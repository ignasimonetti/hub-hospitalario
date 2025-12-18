
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/pocketbase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = await createAdminClient();

        // Fetch users (auth_users collection)
        const usersPromise = pb.collection('auth_users').getFullList({
            sort: '-created',
        });

        // Fetch user role assignments (hub_user_roles collection)
        // expanding the 'role' field to get the role name/details
        const rolesPromise = pb.collection('hub_user_roles').getFullList({
            expand: 'role',
        });

        const [users, userRolesLink] = await Promise.all([usersPromise, rolesPromise]);

        // Map roles to users
        const usersWithRoles = users.map((user) => {
            const myRoles = userRolesLink
                .filter((link) => link.user === user.id)
                .map((link) => ({
                    id: link.expand?.role?.id, // The ID of the Role
                    role_name: link.expand?.role?.name,
                    level: link.expand?.role?.level,
                    is_active: true,
                    assigned_at: link.created,
                    assignment_id: link.id // The ID of the hub_user_roles record
                }))
                .filter(r => r.id); // Filter out items where role expansion might have failed

            return {
                id: user.id,
                email: user.email,
                created_at: user.created,
                email_confirmed_at: user.verified ? new Date().toISOString() : null, // PB's 'verified' is a boolean, approximating date or just existence
                last_sign_in_at: null, // PB doesn't always expose this easily via API unless standard field
                user_metadata: {
                    first_name: user.firstName,
                    last_name: user.lastName,
                    avatar: user.avatar
                },
                user_roles: myRoles
            };
        });

        return NextResponse.json(usersWithRoles);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

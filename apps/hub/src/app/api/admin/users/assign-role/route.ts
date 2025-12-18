
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/pocketbase-admin';

export async function POST(request: NextRequest) {
    try {
        const { userId, roleId } = await request.json();

        if (!userId || !roleId) {
            return NextResponse.json({ error: 'Missing userId or roleId' }, { status: 400 });
        }

        const pb = await createAdminClient();

        // Check if the user already has this role (optional but good UI experience)
        // We can do a quick check
        const existing = await pb.collection('hub_user_roles').getList(1, 1, {
            filter: `user="${userId}" && role="${roleId}"`,
        });

        if (existing.items.length > 0) {
            return NextResponse.json({ message: 'User already has this role' }, { status: 200 });
        }

        const record = await pb.collection('hub_user_roles').create({
            user: userId,
            role: roleId,
            // tenant is omitted for now, effectively global or null if schema allows
        });

        return NextResponse.json(record);

    } catch (error: any) {
        console.error('Error assigning role:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign role' },
            { status: 500 }
        );
    }
}

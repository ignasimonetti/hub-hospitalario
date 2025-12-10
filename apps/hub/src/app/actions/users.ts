'use server';

import { getServerPocketBase } from '@/lib/pocketbase-server';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

const USERS_COLLECTION = 'auth_users';
const USER_ROLES_COLLECTION = 'hub_user_roles';

/**
 * Get all users with their roles and tenant information
 */
export async function getUsers() {
    try {
        // Use admin client to bypass permission issues (viewRule failure)
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        console.log('[getUsers] Fetching users from collection:', USERS_COLLECTION);

        // Expand user roles with role and tenant details
        const users = await pb.collection(USERS_COLLECTION).getList(1, 100, {
            expand: 'hub_user_roles_via_user.role,hub_user_roles_via_user.tenant',
        });

        console.log('[getUsers] Total users found:', users.items.length);
        console.log('[getUsers] First user sample:', users.items[0] ? {
            id: users.items[0].id,
            email: users.items[0].email,
            firstName: users.items[0].firstName,
            lastName: users.items[0].lastName,
            verified: users.items[0].verified,
        } : 'No users');

        return {
            success: true,
            data: users.items,
            error: null,
        };
    } catch (error: any) {
        console.error('[getUsers] Error:', error);
        console.error('[getUsers] Error details:', {
            message: error.message,
            status: error.status,
            response: error.response,
        });
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to fetch users',
        };
    }
}

/**
 * Create a new user
 */
export async function createUser(formData: FormData) {
    try {
        // Use admin client to bypass permission issues
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        // Get current admin user ID for assigned_by field
        const serverPb = await getServerPocketBase();
        const currentAdminId = serverPb.authStore.model?.id;

        console.log('[createUser] Using Admin Client. Base URL:', pb.baseUrl);

        // Generate a strong password if not provided
        const password = formData.get('password') || generatePassword();

        // Prepare data for PocketBase
        const data: any = {
            email: formData.get('email'),
            password: password,
            passwordConfirm: password,
            firstName: formData.get('firstName') || '',
            lastName: formData.get('lastName') || '',
            phone: formData.get('phone') || '',
            dni: formData.get('dni') || '',
            active: formData.get('active') !== 'false',
        };

        // Handle avatar upload if present
        const avatar = formData.get('avatar') as File;
        if (avatar && avatar.size > 0) {
            data.avatar = avatar;
        }

        // 1. Create User
        let user;
        try {
            user = await pb.collection(USERS_COLLECTION).create(data);
            console.log('[createUser] User created successfully:', user.id);
        } catch (err: any) {
            console.error('[createUser] Failed to create user record:', err);
            throw new Error(`Error creating user: ${err.message}`);
        }

        // 2. Assign Roles if provided
        const rolesJson = formData.get('roles') as string;
        const tenantId = formData.get('tenantId') as string;

        if (rolesJson && tenantId) {
            try {
                const roleIds = JSON.parse(rolesJson);
                console.log('[createUser] Assigning roles:', roleIds, 'for tenant:', tenantId);

                for (const roleId of roleIds) {
                    await pb.collection(USER_ROLES_COLLECTION).create({
                        user: user.id,
                        role: roleId,
                        tenant: tenantId,
                        assigned_at: new Date().toISOString(),
                        assigned_by: currentAdminId,
                    });
                }
            } catch (err: any) {
                console.error('[createUser] Failed to assign roles:', err);
                // We don't delete the user, but we warn
                // optionally we could delete the user to be transactional
                throw new Error(`User created but failed to assign roles: ${err.message}`);
            }
        }

        revalidatePath('/admin');

        return {
            success: true,
            data: user,
            error: null,
        };
    } catch (error: any) {
        console.error('[createUser] Top level error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to create user',
        };
    }
}

export async function updateUser(id: string, formData: FormData) {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        // Get current admin user ID for assigned_by field
        const serverPb = await getServerPocketBase();
        const currentAdminId = serverPb.authStore.model?.id;

        const firstName = formData.get('firstName') as string || '';
        const lastName = formData.get('lastName') as string || '';
        const phone = formData.get('phone') as string || '';
        const dni = formData.get('dni') as string || '';

        const data: any = {
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`.trim(),
            phone: phone,
            dni: dni,
            active: formData.get('active') === 'true',
        };

        const avatar = formData.get('avatar') as File;
        if (avatar && avatar.size > 0) {
            data.avatar = avatar;
        }

        // 1. Update User
        let user;
        try {
            console.log('[updateUser] Updating user:', id);
            user = await pb.collection(USERS_COLLECTION).update(id, data);
        } catch (err: any) {
            console.error('[updateUser] Failed to update user record:', err);
            throw new Error(`Error updating user: ${err.message}`);
        }

        // 2. Update Roles if provided
        const rolesJson = formData.get('roles') as string;
        const tenantId = formData.get('tenantId') as string;

        if (rolesJson && tenantId) {
            try {
                // Remove existing roles for this tenant
                const existingRoles = await pb.collection(USER_ROLES_COLLECTION).getList(1, 100, {
                    filter: `user="${id}" && tenant="${tenantId}"`,
                });

                for (const role of existingRoles.items) {
                    await pb.collection(USER_ROLES_COLLECTION).delete(role.id);
                }

                // Add new roles
                const roleIds = JSON.parse(rolesJson);
                for (const roleId of roleIds) {
                    await pb.collection(USER_ROLES_COLLECTION).create({
                        user: id,
                        role: roleId,
                        tenant: tenantId,
                        assigned_at: new Date().toISOString(),
                        assigned_by: currentAdminId,
                    });
                }
            } catch (err: any) {
                console.error('[updateUser] Failed to update roles:', err);
                let detailedError = err.message;
                if (err.data) {
                    detailedError += ' Details: ' + JSON.stringify(err.data);
                }
                throw new Error(`User updated but failed to update roles: ${detailedError}`);
            }
        }

        await logAudit({
            action: 'update',
            resource: 'users',
            resourceId: id,
            details: { email: user.email, changes: Object.keys(data) },
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: user,
            error: null,
        };
    } catch (error: any) {
        console.error('[updateUser] Top level error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to update user',
        };
    }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
    try {
        // Use admin client to bypass permission issues
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        // Get user first for log
        const user = await pb.collection(USERS_COLLECTION).getOne(id);

        // Delete user roles first
        const userRoles = await pb.collection(USER_ROLES_COLLECTION).getList(1, 100, {
            filter: `user="${id}"`,
        });

        for (const role of userRoles.items) {
            await pb.collection(USER_ROLES_COLLECTION).delete(role.id);
        }

        // Delete user
        await pb.collection(USERS_COLLECTION).delete(id);

        // Audit Log
        await logAudit({
            action: 'delete',
            resource: 'users',
            resourceId: id,
            details: { email: user.email, name: user.name },
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: null,
            error: null,
        };
    } catch (error: any) {
        console.error('[deleteUser] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to delete user',
        };
    }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(id: string, isActive: boolean) {
    try {
        const pb = await getServerPocketBase();

        await pb.collection(USERS_COLLECTION).update(id, {
            active: isActive,
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: null,
            error: null,
        };
    } catch (error: any) {
        console.error('[toggleUserStatus] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to update user status',
        };
    }
}

/**
 * Generate a random password
 */
function generatePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

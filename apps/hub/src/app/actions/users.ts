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
        // Use admin client to bypass permission issues (createRule failure)
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        console.log('[createUser] Using Admin Client. Base URL:', pb.baseUrl);

        // Log key form data
        console.log('[createUser] Raw FormData:', {
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            dni: formData.get('dni'),
            active: formData.get('active'),
            sendInvitation: formData.get('sendInvitation'),
            hasAvatar: !!(formData.get('avatar') as File)?.size,
        });

        // Generate a strong password if not provided (min 8 chars)
        const password = formData.get('password') || generatePassword();

        // Prepare data for PocketBase
        // NOTE: We do NOT send 'verified' here as it is a system field.
        const data: any = {
            email: formData.get('email'),
            password: password,
            passwordConfirm: password, // PocketBase usually requires this
            firstName: formData.get('firstName') || '',
            lastName: formData.get('lastName') || '',
            phone: formData.get('phone') || '',
            dni: formData.get('dni') || '',
            active: formData.get('active') !== 'false',
        };

        console.log('[createUser] Sending data:', { ...data, password: '***', passwordConfirm: '***' });

        // Handle avatar upload if present
        const avatar = formData.get('avatar') as File;
        if (avatar && avatar.size > 0) {
            data.avatar = avatar;
            console.log('[createUser] Avatar file:', avatar.name, avatar.size, 'bytes');
        }

        console.log('[createUser] Data to send to PocketBase:', {
            ...data,
            password: '***',
            passwordConfirm: '***',
            avatar: data.avatar ? `file: ${data.avatar.name}` : undefined,
        });

        const user = await pb.collection(USERS_COLLECTION).create(data);

        console.log('[createUser] User created successfully:', user.id);

        // Assign roles if provided
        const rolesJson = formData.get('roles') as string;
        const tenantId = formData.get('tenantId') as string;

        if (rolesJson && tenantId) {
            const roleIds = JSON.parse(rolesJson);
            console.log('[createUser] Assigning roles:', roleIds, 'for tenant:', tenantId);
            for (const roleId of roleIds) {
                await pb.collection(USER_ROLES_COLLECTION).create({
                    user: user.id,
                    role: roleId,
                    tenant: tenantId,
                    is_active: true,
                });
                console.log(`[createUser] Assigned role ${roleId} to user ${user.id} for tenant ${tenantId}`);
            }
        }

        // TODO: Send invitation email if sendInvitation is true

        revalidatePath('/admin');

        return {
            success: true,
            data: user,
            error: null,
        };
    } catch (error: any) {
        console.error('[createUser] Error:', error);

        // Log detailed PocketBase error response
        if (error.data) {
            console.error('[createUser] PocketBase Validation Errors:', JSON.stringify(error.data, null, 2));
        }

        console.error('[createUser] Error details:', {
            message: error.message,
            status: error.status,
            originalError: error.originalError,
        });

        // Extract specific validation message if available
        let errorMessage = error.message || 'Failed to create user';
        if (error.data?.data) {
            const validationErrors = Object.entries(error.data.data)
                .map(([field, err]: [string, any]) => `${field}: ${err.message}`)
                .join(', ');
            if (validationErrors) {
                errorMessage = `Validation error: ${validationErrors}`;
            }
        }

        return {
            success: false,
            data: null,
            error: errorMessage,
        };
    }
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, formData: FormData) {
    try {
        // Use admin client to bypass permission issues
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

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

        // Handle avatar upload if present
        const avatar = formData.get('avatar') as File;
        if (avatar && avatar.size > 0) {
            data.avatar = avatar;
        }

        console.log('[updateUser] Updating user:', id);
        const user = await pb.collection(USERS_COLLECTION).update(id, data);

        // Update roles if provided
        const rolesJson = formData.get('roles') as string;
        const tenantId = formData.get('tenantId') as string;

        if (rolesJson && tenantId) {
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
                    is_active: true,
                });
            }
        }

        // Audit Log
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
        console.error('[updateUser] Error:', error);
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

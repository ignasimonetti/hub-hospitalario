'use server';

import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

const ROLES_COLLECTION = 'hub_roles';
const PERMISSIONS_COLLECTION = 'hub_permissions';
const ROLE_PERMISSIONS_COLLECTION = 'hub_role_permissions';

/**
 * Get all roles with their permissions
 */
export async function getRoles() {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        console.log('[getRoles] Fetching roles...');

        // Fetch roles
        const roles = await pb.collection(ROLES_COLLECTION).getFullList({
            sort: 'name',
        });

        // Fetch all role permissions to map them
        // This might be heavy if there are too many, but for roles it's usually fine
        const rolePermissions = await pb.collection(ROLE_PERMISSIONS_COLLECTION).getFullList({
            expand: 'permission',
        });

        // Map permissions to roles
        const rolesWithPermissions = roles.map(role => {
            const permissions = rolePermissions
                .filter(rp => rp.role === role.id && rp.expand?.permission)
                .map(rp => rp.expand.permission);

            return {
                ...role,
                permissions: permissions
            };
        });

        return {
            success: true,
            data: rolesWithPermissions,
            error: null,
        };
    } catch (error: any) {
        console.error('[getRoles] Error:', error);
        return {
            success: false,
            data: [],
            error: error.message || 'Failed to fetch roles',
        };
    }
}

/**
 * Get all available permissions grouped by resource
 */
export async function getPermissions() {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        const permissions = await pb.collection(PERMISSIONS_COLLECTION).getFullList({
            sort: 'resource,action',
        });

        return {
            success: true,
            data: permissions,
            error: null,
        };
    } catch (error: any) {
        console.error('[getPermissions] Error:', error);
        return {
            success: false,
            data: [],
            error: error.message || 'Failed to fetch permissions',
        };
    }
}

/**
 * Create a new role
 */
export async function createRole(formData: FormData) {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const slug = formData.get('slug') as string || name.toLowerCase().replace(/\s+/g, '_');
        const permissionsJson = formData.get('permissions') as string;

        // 1. Create Role
        const roleData = {
            name,
            slug,
            description,
            is_active: true,
        };

        const role = await pb.collection(ROLES_COLLECTION).create(roleData);

        // 2. Assign Permissions
        if (permissionsJson) {
            const permissionIds = JSON.parse(permissionsJson);
            for (const permId of permissionIds) {
                await pb.collection(ROLE_PERMISSIONS_COLLECTION).create({
                    role: role.id,
                    permission: permId,
                });
            }
        }

        // Audit Log
        await logAudit({
            action: 'create',
            resource: 'roles',
            resourceId: role.id,
            details: { name: role.name, slug: role.slug },
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: role,
            error: null,
        };
    } catch (error: any) {
        console.error('[createRole] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to create role',
        };
    }
}

/**
 * Update a role
 */
export async function updateRole(id: string, formData: FormData) {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const permissionsJson = formData.get('permissions') as string;

        // 1. Update Role details
        const roleData = {
            name,
            description,
        };

        const role = await pb.collection(ROLES_COLLECTION).update(id, roleData);

        // 2. Update Permissions (Sync)
        if (permissionsJson) {
            const newPermissionIds = JSON.parse(permissionsJson);

            // Get existing permissions
            const existingRolePerms = await pb.collection(ROLE_PERMISSIONS_COLLECTION).getFullList({
                filter: `role="${id}"`,
            });

            // Delete removed permissions
            const toDelete = existingRolePerms.filter(rp => !newPermissionIds.includes(rp.permission));
            for (const rp of toDelete) {
                await pb.collection(ROLE_PERMISSIONS_COLLECTION).delete(rp.id);
            }

            // Add new permissions
            const existingPermIds = existingRolePerms.map(rp => rp.permission);
            const toAdd = newPermissionIds.filter((pid: string) => !existingPermIds.includes(pid));

            for (const permId of toAdd) {
                await pb.collection(ROLE_PERMISSIONS_COLLECTION).create({
                    role: id,
                    permission: permId,
                });
            }
        }

        // Audit Log
        await logAudit({
            action: 'update',
            resource: 'roles',
            resourceId: id,
            details: { name, permissionsUpdated: !!permissionsJson },
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: role,
            error: null,
        };
    } catch (error: any) {
        console.error('[updateRole] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to update role',
        };
    }
}

/**
 * Delete a role
 */
export async function deleteRole(id: string) {
    try {
        const { createAdminClient } = await import('@/lib/pocketbase-admin');
        const pb = await createAdminClient();

        // Check if it's a system role (optional safety check)
        const role = await pb.collection(ROLES_COLLECTION).getOne(id);
        if (role.type === 'system') {
            return {
                success: false,
                data: null,
                error: 'Cannot delete system roles',
            };
        }

        // Delete role (cascade should handle permissions, but let's be safe if not configured)
        // Usually we rely on PB cascade, but we can manually delete relations if needed.
        // Assuming cascade is ON or we just delete the role.

        await pb.collection(ROLES_COLLECTION).delete(id);

        // Audit Log
        await logAudit({
            action: 'delete',
            resource: 'roles',
            resourceId: id,
            details: { name: role.name },
        });

        revalidatePath('/admin');

        return {
            success: true,
            data: null,
            error: null,
        };
    } catch (error: any) {
        console.error('[deleteRole] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to delete role',
        };
    }
}

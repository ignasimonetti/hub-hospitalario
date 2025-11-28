import { createAdminClient } from './pocketbase-admin';
import { getServerPocketBase } from './pocketbase-server';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'other';

interface AuditLogParams {
    action: AuditAction;
    resource: string;
    resourceId?: string; // Optional ID of the affected resource
    details?: Record<string, any>;
    actorId?: string; // Optional override, otherwise tries to get current user
    tenantId?: string;
    ipAddress?: string;
}

const AUDIT_COLLECTION = 'hub_audit_logs';

export async function logAudit(params: AuditLogParams) {
    try {
        const pbAdmin = await createAdminClient();

        // Try to get current user if actorId is not provided
        let actorId = params.actorId;
        if (!actorId) {
            try {
                const pbUser = await getServerPocketBase();
                actorId = pbUser.authStore.model?.id;
                console.log('[logAudit] Got actor from session:', actorId);
            } catch (e) {
                console.warn('[logAudit] Could not get current user for audit log:', e);
            }
        }

        // If still no actor, try to get any user as fallback
        if (!actorId) {
            console.warn('[logAudit] No actor ID available. Looking for fallback user...');
            try {
                // Try to find any user to attribute the action to (preferably an admin)
                const users = await pbAdmin.collection('auth_users').getList(1, 1, {
                    sort: '-created',
                });

                if (users.items.length > 0) {
                    actorId = users.items[0].id;
                    console.log('[logAudit] Using fallback user:', actorId);
                } else {
                    console.warn('[logAudit] No users found in system. Skipping audit log.');
                    return;
                }
            } catch (e) {
                console.error('[logAudit] Failed to find fallback user:', e);
                return;
            }
        }

        const logData = {
            actor: actorId,
            action: params.action,
            resource: params.resource,
            details: params.details || {},
            ip_address: params.ipAddress || 'unknown',
            tenant: params.tenantId,
        };

        console.log('[logAudit] Creating audit log:', logData);
        await pbAdmin.collection(AUDIT_COLLECTION).create(logData);
        console.log(`[Audit] ✓ Logged: ${params.action} on ${params.resource}`);

    } catch (error) {
        // Audit logging should not break the main flow, so we catch and log error
        console.error('[Audit] Failed to create audit log:', error);
        if (error && typeof error === 'object' && 'data' in error) {
            console.error('[Audit] Error details:', (error as any).data);
        }
    }
}

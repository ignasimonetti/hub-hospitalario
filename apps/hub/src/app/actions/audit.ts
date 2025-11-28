'use server';

import { createAdminClient } from '@/lib/pocketbase-admin';

const AUDIT_COLLECTION = 'hub_audit_logs';

export async function getAuditLogs(page = 1, perPage = 50, filters?: {
    action?: string;
    resource?: string;
    actor?: string;
    fromDate?: string;
    toDate?: string;
}) {
    try {
        const pb = await createAdminClient();

        let filterString = '';
        const filterParts = [];

        if (filters?.action && filters.action !== 'all') {
            filterParts.push(`action = "${filters.action}"`);
        }
        if (filters?.resource && filters.resource !== 'all') {
            filterParts.push(`resource = "${filters.resource}"`);
        }
        if (filters?.actor) {
            filterParts.push(`actor = "${filters.actor}"`);
        }
        if (filters?.fromDate) {
            filterParts.push(`created >= "${filters.fromDate} 00:00:00"`);
        }
        if (filters?.toDate) {
            filterParts.push(`created <= "${filters.toDate} 23:59:59"`);
        }

        filterString = filterParts.join(' && ');

        const logs = await pb.collection(AUDIT_COLLECTION).getList(page, perPage, {
            filter: filterString,
            sort: '-created',
            expand: 'actor,tenant',
        });

        return {
            success: true,
            data: logs,
            error: null,
        };
    } catch (error: any) {
        console.error('[getAuditLogs] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to fetch audit logs',
        };
    }
}

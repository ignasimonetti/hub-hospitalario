'use server';

import { getServerPocketBase } from '@/lib/pocketbase-server';
import { SupplyRequest } from '@/types/supply';

export async function getSupplyRequests() {
    const pb = await getServerPocketBase();

    try {
        const records = await pb.collection('supply_requests').getList<SupplyRequest>(1, 50, {
            sort: '-created',
            expand: 'requester',
        });

        // Serializing to plain JSON to avoid "Only plain objects can be passed to Client Components" warning
        return {
            items: JSON.parse(JSON.stringify(records.items)),
            totalItems: records.totalItems,
            totalPages: records.totalPages
        };
    } catch (error: any) {
        console.error('Error fetching supply requests:', error);
        return { items: [], totalItems: 0, totalPages: 0 };
    }
}

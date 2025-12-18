
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/pocketbase-admin';

export async function GET() {
    try {
        const pb = await createAdminClient();

        // Fetch all roles
        const records = await pb.collection('hub_roles').getFullList({
            sort: '-created',
        });

        return NextResponse.json(records);
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

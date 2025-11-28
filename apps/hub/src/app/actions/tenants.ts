'use server';

import { getServerPocketBase } from '@/lib/pocketbase-server';
import { revalidatePath } from 'next/cache';

const TENANTS_COLLECTION = 'hub_tenants';

/**
 * Get all tenants
 */
export async function getTenants() {
    try {
        const pb = await getServerPocketBase();
        const tenants = await pb.collection(TENANTS_COLLECTION).getList(1, 100);

        return {
            success: true,
            data: tenants.items,
            error: null,
        };
    } catch (error: any) {
        console.error('Error fetching tenants:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to fetch tenants',
        };
    }
}

/**
 * Create a new tenant
 */
export async function createTenant(formData: FormData) {
    try {
        const pb = await getServerPocketBase();

        const isActiveValue = formData.get('is_active');
        const data: any = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description') || '',
            address: formData.get('address') || '',
            phone: formData.get('phone') || '',
            email: formData.get('email') || '',
            is_active: isActiveValue === 'true',
        };

        // Handle logo upload if present
        const logo = formData.get('logo') as File;
        if (logo && logo.size > 0) {
            data.logo = logo;
        }

        const tenant = await pb.collection(TENANTS_COLLECTION).create(data);

        revalidatePath('/admin');

        return {
            success: true,
            data: tenant,
            error: null,
        };
    } catch (error: any) {
        console.error('Error creating tenant:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to create tenant',
        };
    }
}

/**
 * Update an existing tenant
 */
export async function updateTenant(id: string, formData: FormData) {
    try {
        const pb = await getServerPocketBase();

        const isActiveValue = formData.get('is_active');
        console.log('[updateTenant] Raw is_active value:', isActiveValue);

        // Ensure is_active is always a boolean, defaulting to true if undefined
        const isActive = isActiveValue === 'true' || (isActiveValue !== 'false' && isActiveValue === null);
        console.log('[updateTenant] Converted is_active:', isActive);

        const data: any = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description') || '',
            address: formData.get('address') || '',
            phone: formData.get('phone') || '',
            email: formData.get('email') || '',
            is_active: isActive,
        };

        console.log('[updateTenant] Data to send:', JSON.stringify(data, null, 2));

        // Handle logo upload if present
        const logo = formData.get('logo') as File;
        if (logo && logo.size > 0) {
            data.logo = logo;
        }

        const tenant = await pb.collection(TENANTS_COLLECTION).update(id, data);

        revalidatePath('/admin');

        return {
            success: true,
            data: tenant,
            error: null,
        };
    } catch (error: any) {
        console.error('Error updating tenant:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to update tenant',
        };
    }
}

/**
 * Delete a tenant
 */
export async function deleteTenant(id: string) {
    try {
        const pb = await getServerPocketBase();
        await pb.collection(TENANTS_COLLECTION).delete(id);

        revalidatePath('/admin');

        return {
            success: true,
            data: null,
            error: null,
        };
    } catch (error: any) {
        console.error('Error deleting tenant:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to delete tenant',
        };
    }
}

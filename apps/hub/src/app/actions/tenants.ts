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
        formData.set('is_active', String(isActiveValue === 'true'));

        // Delete empty logo file if not provided
        const logo = formData.get('logo');
        if (logo instanceof File && logo.size === 0) {
            formData.delete('logo');
        }

        const tenant = await pb.collection(TENANTS_COLLECTION).create(formData);

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
        formData.set('is_active', String(isActiveValue === 'true'));

        // Delete empty logo file if not provided
        const logo = formData.get('logo');
        if (logo instanceof File && logo.size === 0) {
            formData.delete('logo');
        }

        const tenant = await pb.collection(TENANTS_COLLECTION).update(id, formData);

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

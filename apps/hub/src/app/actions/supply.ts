'use server';

import { revalidatePath } from 'next/cache';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { createAdminClient } from '@/lib/pocketbase-admin';
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

export async function searchProducts(query: string) {
    const pb = await getServerPocketBase();

    try {
        const filter = query
            ? `(name ~ "${query}" || sku ~ "${query}")`
            : '';

        const records = await pb.collection('supply_products').getList(1, 10, {
            filter,
            sort: 'name',
        });

        return JSON.parse(JSON.stringify(records.items));
    } catch (error: any) {
        console.error('Error searching products:', error);
        return [];
    }
}

export async function createSupplyRequest(data: any) {
    const pb = await getServerPocketBase();

    try {
        // Generate a simple request number (in a real app, this should be more robust)
        const count = await pb.collection('supply_requests').getList(1, 1);
        const requestNumber = `SOL-${new Date().getFullYear()}-${(count.totalItems + 1).toString().padStart(4, '0')}`;

        const record = await pb.collection('supply_requests').create({
            ...data,
            request_number: requestNumber,
            request_date: new Date().toISOString(),
            status: 'pendiente_autorizacion',
            requester: pb.authStore.model?.id,
        });

        revalidatePath('/modules/supply/requests');
        return { success: true, data: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        console.error('Error creating supply request:', error);
        return { success: false, error: error.message };
    }
}

// --- PRODUCTS MANAGEMENT ---

export async function getProducts({
    page = 1,
    perPage = 100,
    search = '',
    sort = 'name',
    category = ''
} = {}) {
    const pb = await getServerPocketBase();
    try {
        let filters = [];
        if (search) {
            // Escape search query for PocketBase filter
            const escapedSearch = search.replace(/"/g, '\\"');
            filters.push(`(name ~ "${escapedSearch}" || sku ~ "${escapedSearch}")`);
        }
        if (category && category !== 'all') {
            filters.push(`category = "${category}"`);
        }

        const filterStr = filters.join(' && ');

        const records = await pb.collection('supply_products').getList(page, perPage, {
            filter: filterStr,
            sort: sort, // Default alphabetical by name
        });

        return {
            items: JSON.parse(JSON.stringify(records.items)),
            totalItems: records.totalItems,
            totalPages: records.totalPages
        };
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return { items: [], totalItems: 0, totalPages: 0 };
    }
}

export async function createProduct(data: any) {
    const pb = await getServerPocketBase();
    try {
        const record = await pb.collection('supply_products').create(data);
        revalidatePath('/modules/supply/products');
        return { success: true, data: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        console.error('Error creating product:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProduct(id: string, data: any) {
    const pb = await getServerPocketBase();
    try {
        const record = await pb.collection('supply_products').update(id, data);
        revalidatePath('/modules/supply/products');
        return { success: true, data: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(id: string) {
    const pb = await getServerPocketBase();

    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario tiene permisos para eliminar productos.');
    }

    try {
        // We use the admin client to bypass "Admins Only" rules in PocketBase,
        // since we already verified the user is a superuser in our own application logic.
        const adminPb = await createAdminClient();
        await adminPb.collection('supply_products').delete(id);
        revalidatePath('/modules/supply/products');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return { success: false, error: error.message };
    }
}

// --- CATEGORIES ---

export async function getSupplyCategories() {
    const pb = await getServerPocketBase();
    try {
        // Use fullList for categories as they shouldn't be too many
        const records = await pb.collection('supply_categories').getFullList({
            sort: 'name',
            filter: 'is_active = true'
        });
        return JSON.parse(JSON.stringify(records));
    } catch (error: any) {
        // Fallback: If collection doesn't exist or error, return empty
        console.warn('Error fetching categories (may not exist yet):', error.message);
        return [];
    }
}

export async function getTenants() {
    const adminPb = await createAdminClient();
    try {
        const records = await adminPb.collection('hub_tenants').getFullList({
            sort: 'name'
        });
        return JSON.parse(JSON.stringify(records));
    } catch (error: any) {
        console.error('Error fetching tenants:', error);
        return [];
    }
}

export async function importHospitalSectors(sectorNames: string[], tenantId?: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede importar sectores.');
    }

    const adminPb = await createAdminClient();

    let targetTenant = tenantId;

    if (!targetTenant) {
        const tenants = await adminPb.collection('hub_tenants').getFullList(1);
        if (tenants.length === 0) throw new Error('No se encontró ningún tenant para asociar los sectores.');
        targetTenant = tenants[0].id;
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const name of sectorNames) {
        try {
            // Check for existing sector in hub_sectors for THIS specific tenant
            const existing = await adminPb.collection('hub_sectors').getList(1, 1, {
                filter: `name = \"${name.replace(/\"/g, '\\\"')}\" && tenant = \"${targetTenant}\"`
            });

            if (existing.totalItems === 0) {
                await adminPb.collection('hub_sectors').create({
                    name: name,
                    tenant: targetTenant,
                    is_active: true,
                    is_stock_hub: false
                });
                importedCount++;
            } else {
                skippedCount++;
            }
        } catch (err) {
            console.error(`Error importing sector ${name}:`, err);
        }
    }

    return { success: true, imported: importedCount, skipped: skippedCount };
}

async function checkIsSuperUser(pb: any) {
    if (!pb.authStore.model?.id) return false;

    // Check by email (failsafe)
    const email = pb.authStore.model.email;
    if (email === 'ignaciosimonetti1984@gmail.com') return true;

    try {
        // Fetch user with role expanded
        // Using auth_users or users depending on configuration
        // lib/auth.ts says auth_users, but PB standard is users
        // We'll try to get the current model which should already have expansion if loaded correctly,
        // but getServerPocketBase might not have it.
        const user = await pb.collection('auth_users').getOne(pb.authStore.model.id, {
            expand: 'role'
        }).catch(() => pb.collection('users').getOne(pb.authStore.model.id, { expand: 'role' }));

        if (!user) return false;

        // Check if explicitly super admin flag is set
        if (user.is_super_admin) return true;

        // Check role by slug or name (expanded)
        const role = user.expand?.role;
        if (role) {
            const roleName = (role.name || '').toLowerCase();
            const roleSlug = (role.slug || '').toLowerCase();

            const isAllowed =
                ['superadmin', 'super_admin', 'superuser'].includes(roleSlug) ||
                ['superadmin', 'super admin', 'administrador', 'admin', 'super usuario', 'superuser'].includes(roleName);

            if (isAllowed) return true;
        }

        return false;
    } catch (error) {
        console.error('Error in checkIsSuperUser:', error);
        return false;
    }
}

// --- VALIDATION HELPERS ---

export async function checkProductAvailability(field: 'sku' | 'name', value: string, currentId?: string) {
    const pb = await getServerPocketBase();
    try {
        let filter = '';
        if (field === 'sku') {
            // Exact match for SKU
            filter = `sku = "${value}"`;
        } else {
            // Fuzzy match for Name (contains)
            filter = `name ~ "${value}"`;
        }

        // Exclude current product if editing
        if (currentId) {
            filter += ` && id != "${currentId}"`;
        }

        const result = await pb.collection('supply_products').getList(1, 10, {
            filter: filter,
            fields: 'id,name,sku'
        });

        return {
            exists: result.totalItems > 0,
            matches: JSON.parse(JSON.stringify(result.items))
        };
    } catch (error) {
        return { exists: false, matches: [] };
    }
}

export async function getHubSectors() {
    const pb = await getServerPocketBase();
    try {
        const records = await pb.collection('hub_sectors').getFullList({
            sort: 'name',
            filter: 'is_active = true'
        });
        return JSON.parse(JSON.stringify(records));
    } catch (error: any) {
        console.warn('Error fetching hub_sectors:', error.message);
        return [];
    }
}

export async function fixSectorsTenant(newTenantId: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede corregir sectores.');
    }

    const adminPb = await createAdminClient();

    try {
        const sectors = await adminPb.collection('hub_sectors').getFullList();
        let updated = 0;

        for (const sector of sectors) {
            await adminPb.collection('hub_sectors').update(sector.id, {
                tenant: newTenantId
            });
            updated++;
        }

        return { success: true, updated };
    } catch (error: any) {
        throw new Error('Error al actualizar sectores: ' + error.message);
    }
}

export async function updateHubSector(id: string, data: any) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede modificar sectores.');
    }

    const adminPb = await createAdminClient();
    try {
        const record = await adminPb.collection('hub_sectors').update(id, data);
        return { success: true, record: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        throw new Error('Error al actualizar el sector: ' + error.message);
    }
}

export async function deleteHubSector(id: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede eliminar sectores.');
    }

    const adminPb = await createAdminClient();
    try {
        await adminPb.collection('hub_sectors').delete(id);
        return { success: true };
    } catch (error: any) {
        throw new Error('Error al eliminar el sector: ' + error.message);
    }
}

// --- SUPPLY NODES (WAREHOUSES) ---

export async function getSupplyNodes() {
    const pb = await getServerPocketBase();
    try {
        const records = await pb.collection('supply_nodes').getFullList({
            sort: '-created',
            expand: 'tenants'
        });
        return JSON.parse(JSON.stringify(records));
    } catch (error: any) {
        console.warn('Error fetching supply_nodes:', error.message);
        return [];
    }
}

export async function createSupplyNode(data: { name: string, type: string, is_active: boolean, tenants: string }) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede crear nodos de depósito.');
    }

    const adminPb = await createAdminClient();
    try {
        const record = await adminPb.collection('supply_nodes').create(data);
        return { success: true, record: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        throw new Error('Error al crear el nodo: ' + error.message);
    }
}

export async function updateSupplyNode(id: string, data: any) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede modificar nodos de depósito.');
    }

    const adminPb = await createAdminClient();
    try {
        const record = await adminPb.collection('supply_nodes').update(id, data);
        return { success: true, record: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        throw new Error('Error al actualizar el nodo: ' + error.message);
    }
}

export async function deleteSupplyNode(id: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) {
        throw new Error('Solo el superusuario puede eliminar nodos.');
    }

    const adminPb = await createAdminClient();
    try {
        await adminPb.collection('supply_nodes').delete(id);
        return { success: true };
    } catch (error: any) {
        throw new Error('Error al eliminar el nodo: ' + error.message);
    }
}

export async function createSupplyCategory(name: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) throw new Error('No autorizado');

    const adminPb = await createAdminClient();
    try {
        const record = await adminPb.collection('supply_categories').create({ name, is_active: true });
        return { success: true, record: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function updateSupplyCategory(id: string, data: any) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) throw new Error('No autorizado');

    const adminPb = await createAdminClient();
    try {
        const record = await adminPb.collection('supply_categories').update(id, data);
        return { success: true, record: JSON.parse(JSON.stringify(record)) };
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function deleteSupplyCategory(id: string) {
    const pb = await getServerPocketBase();
    if (!await checkIsSuperUser(pb)) throw new Error('No autorizado');

    const adminPb = await createAdminClient();
    try {
        await adminPb.collection('supply_categories').delete(id);
        return { success: true };
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function createBaseCategories() {
    const base = ["Descartables", "Limpieza y Desinfección", "Oficina y Papelería", "Medicamentos", "Insumos Quirúrgicos", "Laboratorio", "Radiología"];
    let created = 0;

    for (const name of base) {
        try {
            await createSupplyCategory(name);
            created++;
        } catch (e) { }
    }
    return { success: true, created };
}

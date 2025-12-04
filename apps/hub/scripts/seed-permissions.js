
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

// Load env vars manually from .env.local since we are running outside Next.js
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const PB_URL = env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar';
const ADMIN_EMAIL = env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing admin credentials in .env.local');
    process.exit(1);
}

const PERMISSIONS = [
    // Users
    { slug: 'users.list', name: 'Listar Usuarios', description: 'Ver la lista de usuarios', resource: 'users', action: 'list' },
    { slug: 'users.view', name: 'Ver Detalle Usuario', description: 'Ver detalles de un usuario específico', resource: 'users', action: 'view' },
    { slug: 'users.create', name: 'Crear Usuario', description: 'Crear nuevos usuarios', resource: 'users', action: 'create' },
    { slug: 'users.update', name: 'Editar Usuario', description: 'Modificar usuarios existentes', resource: 'users', action: 'update' },
    { slug: 'users.delete', name: 'Eliminar Usuario', description: 'Eliminar usuarios del sistema', resource: 'users', action: 'delete' },

    // Roles
    { slug: 'roles.list', name: 'Listar Roles', description: 'Ver la lista de roles', resource: 'roles', action: 'list' },
    { slug: 'roles.view', name: 'Ver Detalle Rol', description: 'Ver detalles de un rol', resource: 'roles', action: 'view' },
    { slug: 'roles.create', name: 'Crear Rol', description: 'Crear nuevos roles', resource: 'roles', action: 'create' },
    { slug: 'roles.update', name: 'Editar Rol', description: 'Modificar roles y permisos', resource: 'roles', action: 'update' },
    { slug: 'roles.delete', name: 'Eliminar Rol', description: 'Eliminar roles del sistema', resource: 'roles', action: 'delete' },

    // Tenants (Hospitales)
    { slug: 'tenants.list', name: 'Listar Hospitales', description: 'Ver la lista de hospitales', resource: 'tenants', action: 'list' },
    { slug: 'tenants.view', name: 'Ver Detalle Hospital', description: 'Ver detalles de un hospital', resource: 'tenants', action: 'view' },
    { slug: 'tenants.create', name: 'Crear Hospital', description: 'Registrar nuevos hospitales', resource: 'tenants', action: 'create' },
    { slug: 'tenants.update', name: 'Editar Hospital', description: 'Modificar datos de hospitales', resource: 'tenants', action: 'update' },
    { slug: 'tenants.delete', name: 'Eliminar Hospital', description: 'Dar de baja hospitales', resource: 'tenants', action: 'delete' },

    // Blog / Content Management
    { slug: 'blog.list', name: 'Listar Artículos', description: 'Ver la lista de artículos del blog', resource: 'blog', action: 'list' },
    { slug: 'blog.view', name: 'Ver Artículo', description: 'Ver detalles de un artículo', resource: 'blog', action: 'view' },
    { slug: 'blog.create', name: 'Crear Artículo', description: 'Crear nuevos artículos', resource: 'blog', action: 'create' },
    { slug: 'blog.edit', name: 'Editar Artículo', description: 'Modificar artículos existentes', resource: 'blog', action: 'edit' },
    { slug: 'blog.publish', name: 'Publicar Artículo', description: 'Publicar artículos en el sitio web', resource: 'blog', action: 'publish' },
    { slug: 'blog.delete', name: 'Eliminar Artículo', description: 'Eliminar artículos del sistema', resource: 'blog', action: 'delete' },
    { slug: 'blog.archive', name: 'Archivar Artículo', description: 'Archivar artículos publicados', resource: 'blog', action: 'archive' },
];

async function seed() {
    console.log(`Connecting to ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Authenticated as Admin.');
    } catch (e) {
        console.error('Failed to authenticate:', e.message);
        process.exit(1);
    }

    console.log('Starting permission seed...');

    for (const perm of PERMISSIONS) {
        try {
            // Check if exists
            const existing = await pb.collection('hub_permissions').getList(1, 1, {
                filter: `name="${perm.name}" && resource="${perm.resource}" && action="${perm.action}"`,
            });

            if (existing.items.length > 0) {
                console.log(`Skipping ${perm.slug} (already exists)`);
                continue;
            }

            // Create
            await pb.collection('hub_permissions').create({
                ...perm,
                is_active: true
            });
            console.log(`Created permission: ${perm.slug}`);

        } catch (e) {
            console.error(`Error creating ${perm.slug}:`, e.message);
            if (e.data) console.error(e.data);
        }
    }

    console.log('Seeding complete! 🌱');
}

seed();

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar';
const pb = new PocketBase(POCKETBASE_URL);

async function showSchema() {
    try {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ Error: POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD requeridos.');
            process.exit(1);
        }

        await pb.admins.authWithPassword(adminEmail, adminPassword);

        // Fetch all collections
        const collections = await pb.collections.getFullList(200, 0);

        for (const collection of collections) {
            console.log(`\nSchema for collection: ${collection.name} (${collection.type})`);
            console.log('----------------------------------------');
            // System fields
            console.log('* id (system)');
            console.log('* created (system)');
            console.log('* updated (system)');

            // Custom fields (if any)
            if (Array.isArray(collection.schema)) {
                collection.schema.forEach(field => {
                    console.log(`* ${field.name} (${field.type}) ${field.required ? '[Required]' : ''}`);
                    if (field.options) {
                        if (field.type === 'relation') console.log(`  -> Relation to: ${field.options.collectionId}`);
                        if (field.type === 'select') console.log(`  -> Options: ${field.options.values?.join(', ')}`);
                    }
                });
            } else {
                console.log('No custom fields defined.');
            }
        }
    } catch (error) {
        console.error('Error:', error.originalError || error.message || error);
        process.exit(1);
    }
}

showSchema();

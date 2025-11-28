
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

// Load env vars manually
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

async function check() {
    console.log(`Checking permissions at ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        const perms = await pb.collection('hub_permissions').getFullList();
        console.log(`Found ${perms.length} permissions.`);
        if (perms.length > 0) {
            console.log('Sample:', perms[0]);
        } else {
            console.log('WARNING: No permissions found! Seed failed?');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();

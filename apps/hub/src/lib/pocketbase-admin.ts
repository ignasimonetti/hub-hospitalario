
import PocketBase from 'pocketbase';

export async function createAdminClient() {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar');

    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in environment variables');
    }

    try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        return pb;
    } catch (error) {
        console.error('Failed to authenticate as admin:', error);
        throw new Error('Failed to authenticate as admin');
    }
}

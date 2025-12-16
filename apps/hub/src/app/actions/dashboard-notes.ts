'use server';

import { getServerPocketBase } from '@/lib/pocketbase-server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getDashboardNote() {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
        return null;
    }

    try {
        // Attempt to find an existing note for this user
        // We use getFirstListItem because we expect one note per user
        const note = await pb.collection('hub_dashboard_notes').getFirstListItem(`user="${user.id}"`);
        return note;
    } catch (error: any) {
        if (error.status === 404) {
            return null; // No note found
        }
        console.error('Error fetching dashboard note:', error);
        throw error;
    }
}

export async function saveDashboardNote(content: any) {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        // Check if note exists
        let note;
        try {
            note = await pb.collection('hub_dashboard_notes').getFirstListItem(`user="${user.id}"`);
        } catch (e: any) {
            if (e.status !== 404) throw e;
        }

        if (note) {
            // Update existing note
            await pb.collection('hub_dashboard_notes').update(note.id, {
                content: content,
            });
        } else {
            // Create new note
            await pb.collection('hub_dashboard_notes').create({
                user: user.id,
                content: content,
            });
        }



        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error saving dashboard note:', error);
        return { success: false, error: 'Failed to save note' };
    }
}

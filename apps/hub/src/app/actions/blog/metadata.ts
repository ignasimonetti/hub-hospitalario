'use server';

import { createAdminClient } from '@/lib/pocketbase-admin';

// Types
interface Author {
    id: string;
    first_name: string;
    last_name: string;
    profession?: string;
    email?: string;
    avatar?: string;
    dni: number;
}

interface Tag {
    id: string;
    Etiquetas: string;
    created: string;
    updated: string;
}

const AUTHORS_COLLECTION = 'blog_autores';
const TAGS_COLLECTION = 'blog_etiquetas';

/**
 * Get all authors
 */
export async function getAuthors() {
    try {
        const pb = await createAdminClient();

        const authors = await pb.collection(AUTHORS_COLLECTION).getFullList({
            sort: 'last_name,first_name',
        });

        return {
            success: true,
            data: authors as unknown as Author[],
            error: null,
        };
    } catch (error: any) {
        console.error('[getAuthors] Error:', error);
        return {
            success: false,
            data: [],
            error: error.message || 'Failed to fetch authors',
        };
    }
}

/**
 * Get all tags
 */
export async function getTags() {
    try {
        const pb = await createAdminClient();

        const tags = await pb.collection(TAGS_COLLECTION).getFullList({
            sort: 'Etiquetas',
        });

        return {
            success: true,
            data: tags as unknown as Tag[],
            error: null,
        };
    } catch (error: any) {
        console.error('[getTags] Error:', error);
        return {
            success: false,
            data: [],
            error: error.message || 'Failed to fetch tags',
        };
    }
}

/**
 * Create a new tag
 */
export async function createTag(name: string) {
    try {
        const pb = await createAdminClient();

        const tag = await pb.collection(TAGS_COLLECTION).create({
            Etiquetas: name,
        });

        return {
            success: true,
            data: tag as unknown as Tag,
            error: null,
        };
    } catch (error: any) {
        console.error('[createTag] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to create tag',
        };
    }
}

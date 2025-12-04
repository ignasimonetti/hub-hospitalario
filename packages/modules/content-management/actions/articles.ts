'use server';

import { createAdminClient } from '@/lib/pocketbase-admin';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { Article, ArticleFilters } from '../types';

const ARTICLES_COLLECTION = 'blog_articulos';

/**
 * Get all articles with optional filters
 */
export async function getArticles(filters?: ArticleFilters) {
    try {
        const pb = await createAdminClient();

        let filterString = '';
        const filterParts = [];

        if (filters?.status && filters.status !== 'all') {
            filterParts.push(`status = "${filters.status}"`);
        }
        if (filters?.section && filters.section !== 'all') {
            filterParts.push(`sections ~ "${filters.section}"`);
        }
        if (filters?.author) {
            filterParts.push(`author ~ "${filters.author}"`);
        }
        if (filters?.search) {
            filterParts.push(`(title ~ "${filters.search}" || summary ~ "${filters.search}")`);
        }
        if (filters?.fromDate) {
            filterParts.push(`published_date >= "${filters.fromDate}"`);
        }
        if (filters?.toDate) {
            filterParts.push(`published_date <= "${filters.toDate}"`);
        }

        filterString = filterParts.join(' && ');

        const articles = await pb.collection(ARTICLES_COLLECTION).getList(1, 100, {
            filter: filterString,
            sort: '-published_date',
            expand: 'author,tags,last_edited_by',
        });

        return {
            success: true,
            data: articles.items as Article[],
            totalItems: articles.totalItems,
            error: null,
        };
    } catch (error: any) {
        console.error('[getArticles] Error:', error);
        return {
            success: false,
            data: [],
            totalItems: 0,
            error: error.message || 'Failed to fetch articles',
        };
    }
}

/**
 * Get a single article by ID
 */
export async function getArticle(id: string) {
    try {
        const pb = await createAdminClient();

        const article = await pb.collection(ARTICLES_COLLECTION).getOne(id, {
            expand: 'author,tags,last_edited_by',
        });

        return {
            success: true,
            data: article as Article,
            error: null,
        };
    } catch (error: any) {
        console.error('[getArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to fetch article',
        };
    }
}

/**
 * Create a new article
 */
export async function createArticle(formData: FormData) {
    try {
        const pb = await createAdminClient();

        const data: any = {
            title: formData.get('title'),
            summary: formData.get('summary') || '',
            content: formData.get('content'),
            status: formData.get('status') || 'borrador',
            published_date: formData.get('published_date'),
            video_link: formData.get('video_link') || '',
            sections: formData.getAll('sections'),
            platforms: formData.getAll('platforms'),
            author: formData.getAll('author'),
            tags: formData.getAll('tags'),
            scheduled_for: formData.get('scheduled_for') || null,
        };

        // Handle cover image upload
        const coverImage = formData.get('cover_image') as File;
        if (coverImage && coverImage.size > 0) {
            data.cover_image = coverImage;
        }

        const article = await pb.collection(ARTICLES_COLLECTION).create(data);

        // Audit log
        await logAudit({
            action: 'create',
            resource: 'blog',
            resourceId: article.id,
            details: { title: article.title, status: article.status },
        });

        revalidatePath('/modules/content');

        return {
            success: true,
            data: article,
            error: null,
        };
    } catch (error: any) {
        console.error('[createArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to create article',
        };
    }
}

/**
 * Update an existing article
 */
export async function updateArticle(id: string, formData: FormData) {
    try {
        const pb = await createAdminClient();

        const data: any = {
            title: formData.get('title'),
            summary: formData.get('summary') || '',
            content: formData.get('content'),
            status: formData.get('status'),
            published_date: formData.get('published_date'),
            video_link: formData.get('video_link') || '',
            sections: formData.getAll('sections'),
            platforms: formData.getAll('platforms'),
            author: formData.getAll('author'),
            tags: formData.getAll('tags'),
            scheduled_for: formData.get('scheduled_for') || null,
        };

        // Handle cover image upload
        const coverImage = formData.get('cover_image') as File;
        if (coverImage && coverImage.size > 0) {
            data.cover_image = coverImage;
        }

        const article = await pb.collection(ARTICLES_COLLECTION).update(id, data);

        // Audit log
        await logAudit({
            action: 'update',
            resource: 'blog',
            resourceId: id,
            details: { title: article.title, status: article.status },
        });

        revalidatePath('/modules/content');

        return {
            success: true,
            data: article,
            error: null,
        };
    } catch (error: any) {
        console.error('[updateArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to update article',
        };
    }
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string) {
    try {
        const pb = await createAdminClient();

        const article = await pb.collection(ARTICLES_COLLECTION).getOne(id);
        await pb.collection(ARTICLES_COLLECTION).delete(id);

        // Audit log
        await logAudit({
            action: 'delete',
            resource: 'blog',
            resourceId: id,
            details: { title: article.title },
        });

        revalidatePath('/modules/content');

        return {
            success: true,
            data: null,
            error: null,
        };
    } catch (error: any) {
        console.error('[deleteArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to delete article',
        };
    }
}

/**
 * Publish an article (change status to 'publicado')
 */
export async function publishArticle(id: string) {
    try {
        const pb = await createAdminClient();

        const article = await pb.collection(ARTICLES_COLLECTION).update(id, {
            status: 'publicado',
            published_date: new Date().toISOString(),
        });

        // Audit log
        await logAudit({
            action: 'update',
            resource: 'blog',
            resourceId: id,
            details: { title: article.title, action: 'published' },
        });

        revalidatePath('/modules/content');

        return {
            success: true,
            data: article,
            error: null,
        };
    } catch (error: any) {
        console.error('[publishArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to publish article',
        };
    }
}

/**
 * Archive an article (change status to 'archivado')
 */
export async function archiveArticle(id: string) {
    try {
        const pb = await createAdminClient();

        const article = await pb.collection(ARTICLES_COLLECTION).update(id, {
            status: 'archivado',
        });

        // Audit log
        await logAudit({
            action: 'update',
            resource: 'blog',
            resourceId: id,
            details: { title: article.title, action: 'archived' },
        });

        revalidatePath('/modules/content');

        return {
            success: true,
            data: article,
            error: null,
        };
    } catch (error: any) {
        console.error('[archiveArticle] Error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to archive article',
        };
    }
}

'use server';

import { createAdminClient } from '@/lib/pocketbase-admin';

// Types
export interface BlogStats {
    total: number;
    byStatus: {
        borrador: number;
        en_revision: number;
        publicado: number;
        archivado: number;
    };
    bySection: Array<{
        sectionId: string;
        sectionName: string;
        count: number;
    }>;
    recentActivity: {
        lastWeek: number;
        lastMonth: number;
    };
    topAuthors: Array<{
        authorId: string;
        authorName: string;
        count: number;
    }>;
}

interface Article {
    id: string;
    status: 'borrador' | 'en_revision' | 'publicado' | 'archivado';
    sections?: string[];
    author?: string[];
    created: string;
    updated: string;
}

interface Section {
    id: string;
    Seccion: string;
}

interface Author {
    id: string;
    first_name: string;
    last_name: string;
}

const ARTICLES_COLLECTION = 'blog_articulos';
const SECTIONS_COLLECTION = 'blog_secciones';
const AUTHORS_COLLECTION = 'blog_autores';

/**
 * Get comprehensive blog statistics
 * Processes all articles and aggregates data client-side
 * (PocketBase doesn't support GROUP BY in REST API)
 */
export async function getBlogStats(): Promise<{
    success: boolean;
    data: BlogStats | null;
    error: string | null;
}> {
    try {
        const pb = await createAdminClient();

        // Fetch all articles
        const articles = await pb.collection(ARTICLES_COLLECTION).getFullList<Article>({
            fields: 'id,status,sections,author,created,updated',
        });

        // Fetch sections for name mapping (optional - may not exist)
        let sections: Section[] = [];
        try {
            sections = await pb.collection(SECTIONS_COLLECTION).getFullList<Section>({
                fields: 'id,Seccion',
            });
        } catch (e) {
            console.warn('[getBlogStats] Could not fetch sections, using IDs instead');
        }

        // Fetch authors for name mapping (optional - may not exist)
        let authors: Author[] = [];
        try {
            authors = await pb.collection(AUTHORS_COLLECTION).getFullList<Author>({
                fields: 'id,first_name,last_name',
            });
        } catch (e) {
            console.warn('[getBlogStats] Could not fetch authors, using IDs instead');
        }

        // Create lookup maps
        const sectionMap = new Map(sections.map(s => [s.id, s.Seccion]));
        const authorMap = new Map(authors.map(a => [a.id, `${a.first_name} ${a.last_name}`]));

        // Calculate stats
        const stats: BlogStats = {
            total: articles.length,
            byStatus: {
                borrador: 0,
                en_revision: 0,
                publicado: 0,
                archivado: 0,
            },
            bySection: [],
            recentActivity: {
                lastWeek: 0,
                lastMonth: 0,
            },
            topAuthors: [],
        };

        // Temporary counters
        const sectionCounts = new Map<string, number>();
        const authorCounts = new Map<string, number>();

        // Date thresholds
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Process each article
        for (const article of articles) {
            // Count by status
            if (article.status in stats.byStatus) {
                stats.byStatus[article.status]++;
            }

            // Count by section
            if (article.sections && Array.isArray(article.sections)) {
                for (const sectionId of article.sections) {
                    sectionCounts.set(sectionId, (sectionCounts.get(sectionId) || 0) + 1);
                }
            }

            // Count by author
            if (article.author && Array.isArray(article.author)) {
                for (const authorId of article.author) {
                    authorCounts.set(authorId, (authorCounts.get(authorId) || 0) + 1);
                }
            }

            // Recent activity
            const createdDate = new Date(article.created);
            if (createdDate >= oneWeekAgo) {
                stats.recentActivity.lastWeek++;
            }
            if (createdDate >= oneMonthAgo) {
                stats.recentActivity.lastMonth++;
            }
        }

        // Convert section counts to array with names
        stats.bySection = Array.from(sectionCounts.entries())
            .map(([sectionId, count]) => ({
                sectionId,
                sectionName: sectionMap.get(sectionId) || 'Sin sección',
                count,
            }))
            .sort((a, b) => b.count - a.count);

        // Convert author counts to array with names (top 5)
        stats.topAuthors = Array.from(authorCounts.entries())
            .map(([authorId, count]) => ({
                authorId,
                authorName: authorMap.get(authorId) || 'Desconocido',
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            success: true,
            data: stats,
            error: null,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[getBlogStats] Error:', error);
        return {
            success: false,
            data: null,
            error: errorMessage,
        };
    }
}

/**
 * Get draft articles count (simple metric for widgets)
 */
export async function getDraftCount(): Promise<{
    success: boolean;
    count: number;
    error: string | null;
}> {
    try {
        const pb = await createAdminClient();

        const result = await pb.collection(ARTICLES_COLLECTION).getList(1, 1, {
            filter: 'status = "borrador"',
            fields: 'id',
        });

        return {
            success: true,
            count: result.totalItems,
            error: null,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[getDraftCount] Error:', error);
        return {
            success: false,
            count: 0,
            error: errorMessage,
        };
    }
}

/**
 * Get published articles count (simple metric for widgets)
 */
export async function getPublishedCount(): Promise<{
    success: boolean;
    count: number;
    error: string | null;
}> {
    try {
        const pb = await createAdminClient();

        const result = await pb.collection(ARTICLES_COLLECTION).getList(1, 1, {
            filter: 'status = "publicado"',
            fields: 'id',
        });

        return {
            success: true,
            count: result.totalItems,
            error: null,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[getPublishedCount] Error:', error);
        return {
            success: false,
            count: 0,
            error: errorMessage,
        };
    }
}

'use server';

import { getRealtimeVisitors } from '@/lib/umami-client';

export interface AnalyticsStats {
    pageviews: { value: number; change: number };
    visitors: { value: number; change: number };
    visits: { value: number; change: number };
    locations: { code: string; country?: string; count: number }[];
    totalTime: { value: number; change: number };
}

export async function getAnalyticsStats(): Promise<{ success: boolean; data?: AnalyticsStats; error?: string }> {
    try {
        const stats = await getRealtimeVisitors();

        if (!stats) {
            return { success: false, error: 'No se pudieron obtener datos de Umami' };
        }

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error in getAnalyticsStats server action:', error);
        return { success: false, error: 'Error interno del servidor al conectar con analíticas' };
    }
}

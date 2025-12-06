'use client';

import { useEffect, useState } from 'react';
import { FileTextIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBlogStats, BlogStats } from '@/app/actions/blog/stats';

export function BlogKPIWidget({ className }: { className?: string }) {
    const [stats, setStats] = useState<BlogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                setLoading(true);
                const result = await getBlogStats();
                if (result.success && result.data) {
                    setStats(result.data);
                } else {
                    setError(result.error || 'Error');
                }
            } catch (err) {
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) {
        return (
            <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}>
                <CardContent className="p-4 flex items-center justify-center h-full">
                    <div className="animate-pulse flex flex-col items-center gap-2 w-full">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                        <div className="grid grid-cols-2 gap-2 w-full mt-2">
                            <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded" />
                            <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !stats) {
        return (
            <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}>
                <CardContent className="p-4 flex items-center justify-center h-full text-red-500 text-sm">
                    {error || 'No data'}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <FileTextIcon className="size-5" />
                    KPIs del Blog
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">
                        <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                            {stats.total}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            Total
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {stats.byStatus.borrador}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            Borradores
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.byStatus.publicado}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            Publicados
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.recentActivity.lastWeek}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            Esta semana
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

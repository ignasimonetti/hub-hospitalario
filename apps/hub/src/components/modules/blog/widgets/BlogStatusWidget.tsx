'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getBlogStats, BlogStats } from '@/app/actions/blog/stats';
import { ArticleStatusChart } from '../ArticleStatusChart';

export function BlogStatusWidget({ className }: { className?: string }) {
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
                    <div className="size-32 rounded-full bg-gray-200 dark:bg-slate-800 animate-pulse" />
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
        <ArticleStatusChart
            data={stats.byStatus}
            total={stats.total}
            className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}
        />
    );
}

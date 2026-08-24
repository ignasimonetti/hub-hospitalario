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
        <Card className={`bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-full ${className}`}>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#08487A]/10 text-[#08487A] dark:text-blue-400">
                            <FileTextIcon className="size-4" />
                        </div>
                        Métricas de Publicaciones
                    </CardTitle>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        Blog
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-slate-300">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {stats.total}
                        </span>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Total artículos
                        </p>
                    </div>
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 transition-all hover:border-amber-300">
                        <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                            {stats.byStatus.borrador}
                        </span>
                        <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                            Borradores
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 transition-all hover:border-emerald-300">
                        <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                            {stats.byStatus.publicado}
                        </span>
                        <p className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                            Publicados
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 transition-all hover:border-blue-300">
                        <span className="text-2xl font-bold tracking-tight text-[#08487A] dark:text-blue-400">
                            {stats.recentActivity.lastWeek}
                        </span>
                        <p className="text-[11px] font-medium text-[#08487A]/80 dark:text-blue-400/80 mt-0.5">
                            Esta semana
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

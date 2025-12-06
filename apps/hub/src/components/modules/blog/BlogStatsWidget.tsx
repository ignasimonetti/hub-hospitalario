'use client';

import { useEffect, useState } from 'react';
import {
    FileTextIcon,
    EditIcon,
    CheckCircleIcon,
    ArchiveIcon,
    TrendingUpIcon,
    CalendarIcon,
    UsersIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { ArticleStatusChart } from './ArticleStatusChart';
import { ArticlesBySectionChart } from './ArticlesBySectionChart';
import { getBlogStats, BlogStats } from '@/app/actions/blog/stats';

interface BlogStatsWidgetProps {
    /** Modo compacto para mostrar en dashboard */
    compact?: boolean;
    className?: string;
}

export function BlogStatsWidget({ compact = false, className }: BlogStatsWidgetProps) {
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
                    setError(null);
                } else {
                    setError(result.error || 'Error al cargar estadísticas');
                }
            } catch (err) {
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className={className}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-gray-200 dark:bg-slate-800 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-16" />
                                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-12" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 ${className}`}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-red-500 dark:text-red-400 mb-2">
                        <FileTextIcon className="size-12" />
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-center">
                        {error}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    // Compact mode for dashboard widgets
    if (compact) {
        return (
            <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 ${className}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <FileTextIcon className="size-5" />
                        Estadísticas del Blog
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

    // Full mode for stats page
    return (
        <div className={className}>
            {/* Stats Cards Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatsCard
                    title="Total Artículos"
                    value={stats.total}
                    icon={FileTextIcon}
                    description={`${stats.recentActivity.lastMonth} en el último mes`}
                />
                <StatsCard
                    title="Borradores"
                    value={stats.byStatus.borrador}
                    icon={EditIcon}
                    description="Pendientes de publicar"
                    iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <StatsCard
                    title="Publicados"
                    value={stats.byStatus.publicado}
                    icon={CheckCircleIcon}
                    description="Visibles al público"
                    iconClassName="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                />
                <StatsCard
                    title="Archivados"
                    value={stats.byStatus.archivado}
                    icon={ArchiveIcon}
                    description="Contenido histórico"
                    iconClassName="bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
                <ArticleStatusChart
                    data={stats.byStatus}
                    total={stats.total}
                    className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                />
                <ArticlesBySectionChart
                    data={stats.bySection}
                    className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                />
            </div>

            {/* Additional Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Recent Activity Card */}
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <TrendingUpIcon className="size-4" />
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                                <CalendarIcon className="size-3" />
                                Última semana
                            </span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                {stats.recentActivity.lastWeek}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                                <CalendarIcon className="size-3" />
                                Último mes
                            </span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                {stats.recentActivity.lastMonth}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Authors Card */}
                <Card className="md:col-span-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <UsersIcon className="size-4" />
                            Autores Más Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.topAuthors.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                No hay datos de autores
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {stats.topAuthors.map((author, index) => (
                                    <div
                                        key={author.authorId}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-xs font-medium text-gray-400 dark:text-slate-500 w-4">
                                            #{index + 1}
                                        </span>
                                        <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 truncate">
                                            {author.authorName}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                            {author.count} {author.count === 1 ? 'artículo' : 'artículos'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3Icon, Loader2Icon, EyeIcon, UsersIcon, TimerIcon, MapPinIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { getAnalyticsStats, type AnalyticsStats } from '@/app/actions/analytics';
import Link from 'next/link';

// Helper simple para convertir código país ISO a emoji bandera
function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode === 'UNK') return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

interface UmamiWidgetProps {
    compact?: boolean;
}

export function UmamiWidget({ compact }: UmamiWidgetProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalyticsStats | null>(null);

    // URL pública para "ver más detalles"
    const shareUrl = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL;

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getAnalyticsStats();
                if (result.success && result.data) {
                    setStats(result.data);
                } else {
                    // Fallback silencioso o mensaje amigable
                    setError(result.error || 'No se pudieron cargar datos');
                }
            } catch (err) {
                console.error("Error loading analytics:", err);
                setError('Error de conexión');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const MetricCard = ({ title, value, change, icon: Icon, colorClass, bgClass, valueClassName }: any) => {
        const isPositive = change >= 0;
        return (
            <div className="group flex flex-col p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${bgClass} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                    </div>
                    {/* Only show change if it's significant and not 0 */}
                    {change !== 0 && (
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-0.5" /> : <ArrowDownIcon className="h-3 w-3 mr-0.5" />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>
                <div>
                    <div className={`${valueClassName || 'text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight'}`}>
                        {value}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
                        {title}
                    </p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card className="h-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardHeader className="border-b border-gray-100 dark:border-slate-800 py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3Icon className="h-5 w-5 text-blue-500" />
                        Analíticas Web
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    if (error || !stats) {
        return (
            <Card className="h-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardHeader className="border-b border-gray-100 dark:border-slate-800 py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3Icon className="h-5 w-5 text-gray-400" />
                        Analíticas Web
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] text-center p-6">
                    <p className="text-muted-foreground mb-4">No se pudieron cargar las estadísticas en este momento.</p>

                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex flex-col shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-slate-100">
                        <BarChart3Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Tráfico (Últimos 30 días)
                    </CardTitle>

                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                        title="Vistas"
                        value={stats.pageviews.value.toLocaleString()}
                        change={stats.pageviews.change}
                        icon={EyeIcon}
                        colorClass="text-blue-600 dark:text-blue-400"
                        bgClass="bg-blue-500"
                    />
                    <MetricCard
                        title="Visitantes"
                        value={stats.visitors.value.toLocaleString()}
                        change={stats.visitors.change}
                        icon={UsersIcon}
                        colorClass="text-indigo-600 dark:text-indigo-400"
                        bgClass="bg-indigo-500"
                    />
                    <MetricCard
                        title="Top Ciudades"
                        value={
                            <div className="flex flex-col gap-1.5 w-full mt-1">
                                {stats.locations && stats.locations.length > 0 ? (
                                    stats.locations.slice(0, 3).map((loc) => (
                                        <div key={loc.code} className="flex items-center justify-between text-sm w-full">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {loc.country ? (
                                                    <span className="text-base leading-none select-none" title={`País: ${loc.country}`}>
                                                        {getFlagEmoji(loc.country)}
                                                    </span>
                                                ) : (
                                                    <MapPinIcon className="h-3 w-3 text-orange-500/70 shrink-0" />
                                                )}
                                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[90px]" title={loc.code}>
                                                    {loc.code || 'Desconocido'}
                                                </span>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">{loc.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">Sin datos aún</span>
                                )}
                            </div>
                        }
                        change={0}
                        icon={MapPinIcon}
                        colorClass="text-orange-600 dark:text-orange-400"
                        bgClass="bg-orange-500"
                        valueClassName="text-sm w-full"
                    />
                    <MetricCard
                        title="Tiempo Prom."
                        value={`${Math.round(stats.totalTime.value / 60)}m`}
                        change={stats.totalTime.change}
                        icon={TimerIcon}
                        colorClass="text-emerald-600 dark:text-emerald-400"
                        bgClass="bg-emerald-500"
                    />
                </div>


            </CardContent>
        </Card>
    );
}

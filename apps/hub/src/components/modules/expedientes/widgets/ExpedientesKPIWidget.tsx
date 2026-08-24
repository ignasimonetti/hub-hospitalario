'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Clock, CheckCircle2, Archive, FileText } from "lucide-react";
import { pocketbase } from '@/lib/auth';

interface ExpedientesStatsData {
    total: number;
    activos: number;
    finalizados: number;
    archivados: number;
}

export function ExpedientesKPIWidget({ className }: { className?: string }) {
    const [stats, setStats] = useState<ExpedientesStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                // Fetch counts using the same logic as StatsWrapper
                const p1 = pocketbase.collection('expedientes').getList(1, 1, { skipTotal: false, requestKey: null });
                const p2 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "En trámite"', skipTotal: false, requestKey: null });
                const p3 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "Finalizado"', skipTotal: false, requestKey: null });
                const p4 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "Archivado"', skipTotal: false, requestKey: null });

                const [resTotal, resActivos, resFinal, resArch] = await Promise.all([p1, p2, p3, p4]);

                setStats({
                    total: resTotal.totalItems,
                    activos: resActivos.totalItems,
                    finalizados: resFinal.totalItems,
                    archivados: resArch.totalItems
                });
            } catch (e) {
                console.error("Error loading expedientes stats for widget", e);
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

    if (!stats) {
        return (
            <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}>
                <CardContent className="p-4 flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-full ${className}`}>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FolderOpen className="size-4" />
                        </div>
                        Gestión de Expedientes
                    </CardTitle>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        Mesa de Entradas
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-slate-300">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {stats.total}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            <FileText className="h-3 w-3" />
                            Total
                        </div>
                    </div>
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 transition-all hover:border-amber-300">
                        <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                            {stats.activos}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                            <Clock className="h-3 w-3" />
                            En trámite
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 transition-all hover:border-emerald-300">
                        <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                            {stats.finalizados}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Finalizados
                        </div>
                    </div>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40 transition-all hover:border-purple-300">
                        <span className="text-2xl font-bold tracking-tight text-purple-700 dark:text-purple-400">
                            {stats.archivados}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-purple-800/80 dark:text-purple-400/80 mt-0.5">
                            <Archive className="h-3 w-3" />
                            Archivados
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

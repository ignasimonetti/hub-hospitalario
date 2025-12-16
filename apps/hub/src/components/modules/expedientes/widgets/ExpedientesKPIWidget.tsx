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
        <Card className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 h-full ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <FolderOpen className="size-5 text-emerald-600 dark:text-emerald-500" />
                    Expedientes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">
                        <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                            {stats.total}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <FileText className="h-3 w-3" />
                            Total
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {stats.activos}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <Clock className="h-3 w-3" />
                            En trámite
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.finalizados}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Finalizados
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                            {stats.archivados}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Archive className="h-3 w-3" />
                            Archivados
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

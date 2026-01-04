
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Archive, CheckCircle2 } from "lucide-react";

interface ExpedientesStatsProps {
    total: number;
    activos: number;
    finalizados: number;
    archivados: number;
    loading?: boolean;
}

export function ExpedientesStats({ total, activos, finalizados, archivados, loading = false }: ExpedientesStatsProps) {
    if (loading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
            ))}
        </div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-500 mb-1">
                        Total de Exptes
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {total}
                        </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Registros históricos</p>
                </CardContent>
            </Card>

            {/* Activos */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-500 mb-1">
                        En Trámite
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {activos}
                        </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Actualmente activos</p>
                </CardContent>
            </Card>

            {/* Finalizados */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-500 mb-1">
                        Finalizados
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {finalizados}
                        </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Completados con éxito</p>
                </CardContent>
            </Card>

            {/* Archivados */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-500/10 dark:bg-slate-500/20">
                            <Archive className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-500 mb-1">
                        Archivados
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {archivados}
                        </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Expedientes cerrados</p>
                </CardContent>
            </Card>
        </div>
    );
}

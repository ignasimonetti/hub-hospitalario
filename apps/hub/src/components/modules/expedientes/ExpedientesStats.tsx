
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Exptes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{total}</div>
                    <p className="text-xs text-muted-foreground">Registros históricos</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activos</CardTitle>
                    <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activos}</div>
                    <p className="text-xs text-muted-foreground">En trámite</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{finalizados}</div>
                    <p className="text-xs text-muted-foreground">Completados con éxito</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Archivados</CardTitle>
                    <Archive className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{archivados}</div>
                    <p className="text-xs text-muted-foreground">Expedientes cerrados</p>
                </CardContent>
            </Card>
        </div>
    );
}

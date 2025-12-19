import { Suspense } from 'react';
import { ExpedientesTable } from "@/components/modules/expedientes/ExpedientesTable";
import { ExpedientesStatsWrapper } from "@/components/modules/expedientes/ExpedientesStatsWrapper";

export default function ExpedientesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                        Seguimiento de Expedientes
                    </h2>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">
                        Gestiona, busca y actualiza el estado de los expedientes.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Suspense fallback={<div>Cargando estadísticas...</div>}>
                    <ExpedientesStatsWrapper />
                </Suspense>

                <ExpedientesTable />
            </div>
        </div>
    );
}

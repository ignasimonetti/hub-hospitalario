import { Suspense } from 'react';
import { ExpedientesTable } from "@/components/modules/expedientes/ExpedientesTable";
import { ExpedientesStatsWrapper } from "@/components/modules/expedientes/ExpedientesStatsWrapper";
import { ModulesLayout } from '@/components/ModulesLayout';
import { ProtectedContent } from '@/components/ProtectedContent';

export default function ExpedientesPage() {
    return (
        <ModulesLayout currentPage="expedientes">
            <ProtectedContent
                roles={['superadmin', 'mesa_entrada']}
                fallback={
                    <div className="container mx-auto py-10 px-4">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold mb-4">Acceso denegado</h2>
                            <p>No tienes permisos para acceder al módulo de expedientes.</p>
                            <p>Solo usuarios con rol de Mesa de Entradas o Superadmin pueden acceder a esta sección.</p>
                        </div>
                    </div>
                }
            >
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
            </ProtectedContent>
        </ModulesLayout>
    );
}

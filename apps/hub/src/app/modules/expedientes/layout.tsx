'use client';

import { ModulesLayout } from '@/components/ModulesLayout';
import { ProtectedContent } from '@/components/ProtectedContent';
import { ShieldAlert } from 'lucide-react';

export default function ExpedientesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ModulesLayout currentPage="expedientes">
            <ProtectedContent
                roles={['superadmin', 'mesa_entrada']}
                fallback={
                    <div className="container mx-auto py-10 px-4">
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                            <ShieldAlert className="h-16 w-16 text-yellow-500 opacity-50" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 italic">Acceso Denegado</h2>
                            <p className="text-muted-foreground dark:text-slate-400 max-w-md">
                                No tienes permisos para acceder al módulo de expedientes.
                                Solo usuarios con rol de Mesa de Entradas o Superadmin pueden acceder a esta sección.
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    {children}
                </div>
            </ProtectedContent>
        </ModulesLayout>
    );
}

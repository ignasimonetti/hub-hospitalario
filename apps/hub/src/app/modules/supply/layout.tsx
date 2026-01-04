'use client';

import { ModulesLayout } from '@/components/ModulesLayout';
import { ProtectedContent } from '@/components/ProtectedContent';
import { Package } from 'lucide-react';

export default function SupplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ModulesLayout currentPage="supply">
            <ProtectedContent
                permissions={['supply.requests.list']}
                fallback={
                    <div className="container mx-auto py-10 px-4">
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                            <Package className="h-16 w-16 text-orange-500 opacity-50" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 italic">Acceso Restringido</h2>
                            <p className="text-muted-foreground dark:text-slate-400 max-w-md">
                                No tienes permisos para acceder al módulo de suministros.
                                Por favor, contacta al administrador si crees que esto es un error.
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

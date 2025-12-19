'use client';

import { ModulesLayout } from "@/components/ModulesLayout";
import { ProtectedContent } from "@/components/ProtectedContent";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModulesLayout currentPage="admin">
            <ProtectedContent
                roles={['superadmin']}
                fallback={
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <ShieldCheck className="h-16 w-16 text-red-500 mb-4 opacity-20" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Acceso Restringido</h2>
                        <p className="text-gray-500 dark:text-slate-400 max-w-md">
                            Esta sección está reservada exclusivamente para usuarios con privilegios de Administrador del Sistema.
                        </p>
                    </div>
                }
            >
                {children}
            </ProtectedContent>
        </ModulesLayout>
    );
}

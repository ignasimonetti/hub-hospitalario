'use client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

function ExpedienteGuard({ children }: { children: React.ReactNode }) {
    const { currentRole, status } = useWorkspace();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        const isAdmin = ['superadmin', 'super_admin', 'admin', 'administrador'].includes(currentRole?.slug || '') ||
            ['superadmin', 'super admin', 'administrador', 'admin'].includes(currentRole?.name?.toLowerCase() || '');

        const isMesaEntrada = ['mesa_entrada', 'mesa de entrada', 'mesa de entradas'].includes(currentRole?.slug || '') ||
            (currentRole?.name?.toLowerCase() || '').includes('mesa de entrada');

        if (isAdmin || isMesaEntrada) {
            setIsAuthorized(true);
        } else {
            router.push('/dashboard'); // or /unauthorized
        }
    }, [currentRole, status, router]);

    if (status === 'loading' || (!isAuthorized && status === 'ready')) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    }

    return <>{children}</>;
}


export default function ExpedientesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // We move metadata export to page level or separate file if we use 'use client'
    // But since this file was standard server component, converting it to client for Guard is one way.
    // Better way: Keep this server if possible? No, we need context.
    // So we remove 'export const metadata' if we make this 'use client' or we wrap inner.
    // Let's wrap inner content.

    return (
        <ExpedienteGuard>
            <div className="h-full flex flex-col">
                {children}
            </div>
        </ExpedienteGuard>
    );
}

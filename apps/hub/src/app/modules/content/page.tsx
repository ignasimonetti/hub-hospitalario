'use client';

import { ArticlesTable } from '@/components/modules/ArticlesTable';
import { ProtectedContent } from '@/components/ProtectedContent';
import { ModulesLayout } from '@/components/ModulesLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function ContentManagementPage() {
    const { currentRole } = useWorkspace();

    return (
        <ModulesLayout currentPage="blog">
            <ProtectedContent
                roles={['superadmin', 'editor_blog']}
                fallback={
                    <div className="container mx-auto py-10 px-4">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold mb-4">Acceso denegado</h2>
                            <p>No tienes permisos para acceder al módulo de blog.</p>
                            <p>Solo usuarios con roles de Superadministrador o Editor de Blog pueden acceder a esta sección.</p>
                        </div>
                    </div>
                }
            >
                <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
                    <ArticlesTable />
                </div>
            </ProtectedContent>
        </ModulesLayout>
    );
}

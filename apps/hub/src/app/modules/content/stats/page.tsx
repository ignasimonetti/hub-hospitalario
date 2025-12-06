import { Metadata } from 'next';
import { BlogStatsWidget } from '@/components/modules/blog/BlogStatsWidget';
import { UmamiWidget } from '@/components/modules/analytics/widgets/UmamiWidget';
import { ArrowLeftIcon, BarChart3Icon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Estadísticas del Blog | Hub Hospitalario',
    description: 'Visualiza las métricas y estadísticas del módulo de blog',
};

export default function BlogStatsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/modules/content">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
                                <BarChart3Icon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                                Estadísticas del Blog
                            </h1>
                            <p className="text-muted-foreground dark:text-slate-400 mt-1">
                                Métricas y análisis del contenido publicado
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Production Stats */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                        Producción de Contenido
                    </h2>
                    <BlogStatsWidget />
                </div>

                {/* Web Traffic Analytics (Umami) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                        Tráfico Web
                    </h2>
                    {/* Forzamos una altura mínima para que el iframe se vea bien en esta página completa */}
                    <div className="h-[600px] w-full">
                        <UmamiWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    GripVertical,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    getWidgetsWithUserConfig,
    toggleWidgetVisibility,
} from '@/app/actions/dashboard-config';
import { type WidgetDefinition } from '@/lib/dashboard-constants';
import { useToast } from '@/hooks/use-toast';

interface WidgetConfig extends WidgetDefinition {
    visible: boolean;
    position: number;
    size: 'small' | 'medium' | 'large';
}

export function DashboardPreferences() {
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingWidget, setTogglingWidget] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadWidgets();
    }, []);

    async function loadWidgets() {
        setLoading(true);
        try {
            const result = await getWidgetsWithUserConfig();
            if (result.success) {
                setWidgets(result.data);
            }
        } catch (error) {
            console.error('Error loading widgets:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los widgets",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleWidget(widgetId: string, visible: boolean) {
        setTogglingWidget(widgetId);
        try {
            const result = await toggleWidgetVisibility(widgetId, visible);
            if (result.success) {
                setWidgets(prev =>
                    prev.map(w =>
                        w.id === widgetId ? { ...w, visible } : w
                    )
                );
                toast({
                    title: visible ? "Widget activado" : "Widget desactivado",
                    description: "Tus preferencias se han guardado",
                });
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error toggling widget:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar la preferencia",
                variant: "destructive",
            });
        } finally {
            setTogglingWidget(null);
        }
    }

    if (loading) {
        return (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                Personalización de Dashboard
                            </CardTitle>
                            <CardDescription>Cargando preferencias...</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <LayoutDashboard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Personalización de Dashboard
                        </CardTitle>
                        <CardDescription>
                            Elige qué widgets quieres ver en tu pantalla principal.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {widgets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay widgets disponibles para tu rol.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {widgets.map((widget) => (
                            <motion.div
                                key={widget.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    flex items-center justify-between p-4 rounded-lg border 
                                    transition-all duration-200
                                    ${widget.visible
                                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                                        : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        p-2.5 rounded-full 
                                        ${widget.visible
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }
                                    `}>
                                        {widget.visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h4 className={`font-medium text-base ${widget.visible ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {widget.name}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {widget.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={widget.visible}
                                        onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                                        disabled={togglingWidget === widget.id}
                                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

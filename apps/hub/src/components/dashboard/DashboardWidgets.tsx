'use client';

import { useState, useEffect } from 'react';
import { Settings2Icon, EyeOffIcon, GripVerticalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import {
    getWidgetsWithUserConfig,
    toggleWidgetVisibility,
    updateWidgetPositions,
} from '@/app/actions/dashboard-config';
import { type WidgetDefinition } from '@/lib/dashboard-constants';

// Dnd Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Widget component mapping
import { BlogKPIWidget } from '@/components/modules/blog/widgets/BlogKPIWidget';
import { BlogStatusWidget } from '@/components/modules/blog/widgets/BlogStatusWidget';
import { BlogSectionWidget } from '@/components/modules/blog/widgets/BlogSectionWidget';
import { UmamiWidget } from '@/components/modules/analytics/widgets/UmamiWidget';
import { ExpedientesKPIWidget } from '@/components/modules/expedientes/widgets/ExpedientesKPIWidget';

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
    'BlogKPIWidget': BlogKPIWidget,
    'BlogStatusWidget': BlogStatusWidget,
    'BlogSectionWidget': BlogSectionWidget,
    'UmamiWidget': UmamiWidget,
    'ExpedientesKPIWidget': ExpedientesKPIWidget,
};

interface WidgetConfig extends WidgetDefinition {
    visible: boolean;
    position: number;
    size: 'small' | 'medium' | 'large';
}

interface DashboardWidgetsProps {
    className?: string;
}

// Sortable Item Wrapper
function SortableWidget({ widget, children }: { widget: WidgetConfig; children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={widget.size === 'large' ? 'md:col-span-2' : ''}
            {...attributes}
        >
            <div className="relative group h-full">
                {/* Drag Handle - Visible on Hover */}
                <div
                    {...listeners}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 shadow-sm border border-gray-200 dark:border-slate-700"
                >
                    <GripVerticalIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </div>
                {children}
            </div>
        </div>
    );
}

export function DashboardWidgets({ className }: DashboardWidgetsProps) {
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [togglingWidget, setTogglingWidget] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadWidgets();
    }, []);

    useEffect(() => {
        if (isConfigOpen) {
            loadWidgets();
        }
    }, [isConfigOpen]);

    async function loadWidgets() {
        setLoading(true);
        try {
            const result = await getWidgetsWithUserConfig();
            if (result.success) {
                setWidgets(result.data);
            }
        } catch (error) {
            console.error('Error loading widgets:', error);
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
            }
        } catch (error) {
            console.error('Error toggling widget:', error);
        } finally {
            setTogglingWidget(null);
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = widgets.findIndex((item) => item.id === active.id);
            const newIndex = widgets.findIndex((item) => item.id === over?.id);

            const newOrder = arrayMove(widgets, oldIndex, newIndex);

            // 1. Optimistic Update (Instant visual change)
            setWidgets(newOrder);

            // 2. Persist to Backend (Side effect outside of state setter)
            const updates = newOrder.map((w, index) => ({
                widgetId: w.id,
                position: index,
            }));

            try {
                await updateWidgetPositions(updates);
            } catch (error) {
                console.error('Failed to save widget positions:', error);
                // Optional: Revert state on error if critical
            }
        }
    }

    const visibleWidgets = widgets.filter(w => w.visible);

    // Loading state
    if (loading && widgets.length === 0) {
        return (
            <div className={className}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        Widgets
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(i => (
                        <Card key={i} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                            <CardContent className="p-6">
                                <div className="h-32 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Header with config button */}
            <div className="flex items-center justify-end mb-4">
                <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
                        >
                            <Settings2Icon className="h-4 w-4" />
                            Configurar
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-white dark:bg-slate-900 dark:border-slate-800">
                        <SheetHeader>
                            <SheetTitle className="dark:text-slate-100">
                                Configurar Widgets
                            </SheetTitle>
                            <SheetDescription className="dark:text-slate-400">
                                Elige qué widgets mostrar en tu dashboard.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                            {widgets.map(widget => (
                                <div
                                    key={widget.id}
                                    className={`
                                        flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                                        ${widget.visible
                                            ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm'
                                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVerticalIcon className={`h-4 w-4 cursor-grab ${widget.visible ? 'text-gray-400 dark:text-slate-600' : 'text-gray-300 dark:text-slate-700'}`} />
                                        <div>
                                            <p className={`font-medium ${widget.visible ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
                                                {widget.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-slate-500">
                                                {widget.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={widget.visible}
                                        onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                                        disabled={togglingWidget === widget.id}
                                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                                    />
                                </div>
                            ))}
                            {widgets.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                                    No hay widgets disponibles.
                                </p>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Widgets Grid with Drag & Drop */}
            {visibleWidgets.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="bg-gray-50 dark:bg-slate-900/50 border-dashed border-gray-300 dark:border-slate-700">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <EyeOffIcon className="h-12 w-12 text-gray-400 dark:text-slate-600 mb-4" />
                            <p className="text-gray-600 dark:text-slate-400 text-center">
                                No tienes widgets visibles.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => setIsConfigOpen(true)}
                                className="mt-2"
                            >
                                Configurar widgets
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={visibleWidgets.map(w => w.id)}
                        strategy={rectSortingStrategy}
                    >
                        <motion.div
                            className="grid gap-4 md:grid-cols-2"
                            layout
                        >
                            {visibleWidgets.map(widget => {
                                const WidgetComponent = WIDGET_COMPONENTS[widget.component];

                                if (!WidgetComponent) {
                                    return (
                                        <Card key={widget.id} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                            <CardContent className="p-4">Widget no disponible</CardContent>
                                        </Card>
                                    );
                                }

                                return (
                                    <SortableWidget key={widget.id} widget={widget}>
                                        <WidgetComponent compact={true} />
                                    </SortableWidget>
                                );
                            })}
                        </motion.div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

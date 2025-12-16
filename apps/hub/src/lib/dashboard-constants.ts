
export interface DashboardWidgetConfig {
    id: string;
    user: string;
    widget_id: string;
    visible: boolean;
    position: number;
    size: 'small' | 'medium' | 'large';
    created: string;
    updated: string;
}

export interface WidgetDefinition {
    id: string;
    name: string;
    description: string;
    component: string;
    requiredPermission?: string;
    defaultSize: 'small' | 'medium' | 'large';
}

// Available widgets configuration
export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
    {
        id: 'blog_kpi',
        name: 'KPIs del Blog',
        description: 'Métricas clave: Total, Borradores, Publicados',
        component: 'BlogKPIWidget',
        requiredPermission: 'blog:read',
        defaultSize: 'medium',
    },
    {
        id: 'blog_status',
        name: 'Distribución de Estados',
        description: 'Gráfico de artículos por estado',
        component: 'BlogStatusWidget',
        requiredPermission: 'blog:read',
        defaultSize: 'medium',
    },
    {
        id: 'blog_sections',
        name: 'Artículos por Sección',
        description: 'Distribución de contenido por áreas.',
        defaultSize: 'medium',
        component: 'BlogSectionWidget',
        requiredPermission: 'blog:read',
    },
    {
        id: 'umami_analytics',
        name: 'Analíticas Web',
        description: 'Visitas, fuentes y métricas en tiempo real.',
        defaultSize: 'large',
        component: 'UmamiWidget',
        requiredPermission: 'blog:read', // Alineado con permisos del Blog
    },
    // Future widgets can be added here
    {
        id: 'expedientes_kpi',
        name: 'KPIs Expedientes',
        description: 'Estado actual de trámites.',
        component: 'ExpedientesKPIWidget',
        requiredPermission: 'expedientes:read',
        defaultSize: 'medium',
    },
];

import Link from "next/link";
import {
    ArrowRight,
    Package,
    FileText,
    BarChart3,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle2
} from "lucide-react";

export default function SupplyDashboardPage() {
    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Suministros</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Visión general de abastecimiento, stock y contrataciones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground mr-4 border-r border-border pr-4 h-5 flex items-center hidden sm:flex">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <Link
                        href="/modules/supply/requests/new"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                        <span className="mr-2 text-lg">+</span>
                        Nueva Solicitud
                    </Link>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI 1 */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Solicitudes Activas</p>
                        <h3 className="text-3xl font-bold text-foreground">24</h3>
                        <div className="mt-2 flex items-center text-xs font-medium text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-full border border-amber-100">
                            <Clock className="w-3 h-3 mr-1" />
                            8 pendientes de firma
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Gasto Mensual</p>
                        <h3 className="text-3xl font-bold text-foreground">$4.2M</h3>
                        <div className="mt-2 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full border border-emerald-100">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12% vs mes anterior
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Alertas de Stock</p>
                        <h3 className="text-3xl font-bold text-foreground">15</h3>
                        <div className="mt-2 flex items-center text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-full border border-red-100">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            3 Críticos
                        </div>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <Package className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Proveedores</p>
                        <h3 className="text-3xl font-bold text-foreground">128</h3>
                        <div className="mt-2 flex items-center text-xs font-medium text-muted-foreground bg-secondary w-fit px-2 py-1 rounded-full border border-border">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            98% Activos
                        </div>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Navigation Modules Grid (Fusion: Navigation + Info) */}
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Módulos Operativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Module: Requests */}
                <Link
                    href="/modules/supply/requests"
                    className="group relative overflow-hidden rounded-xl border bg-card p-0 shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col h-full"
                >
                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Solicitudes de Pedidos
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100" />
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Gestionar requerimientos internos de farmacia y servicios.</p>
                        </div>
                    </div>
                    <div className="mt-auto border-t bg-muted/30 p-4 flex gap-4 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 3 Nuevos</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> 2 En Revisión</span>
                    </div>
                </Link>

                {/* Module: Catalog */}
                <div className="group relative overflow-hidden rounded-xl border bg-card p-0 shadow-sm opacity-75 cursor-not-allowed flex flex-col h-full">
                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Catálogo & Stock</h3>
                            <p className="text-sm text-muted-foreground mt-1">Maestro de artículos, precios y control de existencias.</p>
                        </div>
                    </div>
                    <div className="mt-auto border-t bg-muted/30 p-4 flex gap-4 text-xs font-medium text-muted-foreground">
                        <span>Próximamente</span>
                    </div>
                </div>

                {/* Module: Providers */}
                <div className="group relative overflow-hidden rounded-xl border bg-card p-0 shadow-sm opacity-75 cursor-not-allowed flex flex-col h-full">
                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Proveedores</h3>
                            <p className="text-sm text-muted-foreground mt-1">Registro RUPSE, evaluaciones y legajos.</p>
                        </div>
                    </div>
                    <div className="mt-auto border-t bg-muted/30 p-4 flex gap-4 text-xs font-medium text-muted-foreground">
                        <span>Próximamente</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

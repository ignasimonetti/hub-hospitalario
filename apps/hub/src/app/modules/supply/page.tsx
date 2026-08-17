"use client";

import Link from "next/link";
import {
    ArrowRight,
    Package,
    FileText,
    BarChart3,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle2,
    Plus,
    Settings
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function SupplyDashboardPage() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="container mx-auto py-8 space-y-12 max-w-7xl px-4 lg:px-8"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200/80 dark:border-slate-800/60 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Panel de Suministros
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-base font-medium">
                        Visión general de abastecimiento, stock y contrataciones.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mr-4 border-r border-slate-200 dark:border-slate-800 pr-6 h-6 flex items-center hidden sm:flex">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <Link
                        href="/modules/supply/settings"
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-[#08487A] transition-all shadow-sm hover:shadow-md active:scale-95"
                        title="Configuración de Suministros"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/modules/supply/requests/new"
                        className="inline-flex items-center justify-center rounded-2xl bg-[#08487A] hover:bg-[#053D6C] px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                    </Link>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Solicitudes Activas */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-[#08487A] dark:text-sky-400 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Solicitudes Activas</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">24</h3>
                        <div className="mt-3 flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 w-fit px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 uppercase tracking-wider">
                            <Clock className="w-3 h-3 mr-1.5" />
                            8 pendientes de firma
                        </div>
                    </div>
                </motion.div>

                {/* Gasto Mensual */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Gasto Mensual</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">$4.2M</h3>
                        <div className="mt-3 flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 w-fit px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 uppercase tracking-wider">
                            <TrendingUp className="w-3 h-3 mr-1.5" />
                            +12% vs mes anterior
                        </div>
                    </div>
                </motion.div>

                {/* Alert Stock */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Alertas de Stock</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">15</h3>
                        <div className="mt-3 flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 w-fit px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3 mr-1.5" />
                            3 Críticos
                        </div>
                    </div>
                </motion.div>

                {/* Proveedores */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Proveedores</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">128</h3>
                        <div className="mt-3 flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 w-fit px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                            98% Activos
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Navigation Modules Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 rounded-full bg-[#08487A]"></div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Módulos Operativos</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Module: Requests */}
                    <motion.div variants={itemVariants}>
                        <Link
                            href="/modules/supply/requests"
                            className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md hover:border-[#08487A]/40 hover:-translate-y-0.5"
                        >
                            <div className="p-7 flex-1">
                                <div className="p-3.5 w-fit rounded-xl bg-sky-50 text-[#08487A] dark:bg-sky-950/60 dark:text-sky-400 group-hover:bg-[#08487A] group-hover:text-white transition-all duration-300 mb-6">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                        Solicitudes de Pedidos
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#08487A] dark:group-hover:text-sky-400 transition-all group-hover:translate-x-1" />
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-normal leading-relaxed">
                                        Gestionar requerimientos internos de farmacia y servicios.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 p-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 text-[#08487A] dark:text-sky-400">
                                    <div className="w-2 h-2 rounded-full bg-[#08487A] animate-pulse"></div>
                                    3 Nuevos
                                </span>
                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    2 En Revisión
                                </span>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Module: Catalog */}
                    <motion.div variants={itemVariants}>
                        <Link
                            href="/modules/supply/products"
                            className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md hover:border-purple-500/40 hover:-translate-y-0.5"
                        >
                            <div className="p-7 flex-1">
                                <div className="p-3.5 w-fit rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 mb-6">
                                    <Package className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                        Catálogo & Stock
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-all group-hover:translate-x-1" />
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-normal leading-relaxed">
                                        Maestro de artículos, precios y control de existencias.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 p-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                                    Gestión Activa
                                </span>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Module: Providers */}
                    <motion.div variants={itemVariants}>
                        <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 shadow-sm transition-all opacity-60">
                            <div className="p-7 flex-1 text-slate-400">
                                <div className="p-3.5 w-fit rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-6">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-400 dark:text-slate-500">Proveedores</h3>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 font-normal leading-relaxed">
                                        Registro RUPSE, evaluaciones y legajos administrativos.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-800/10 p-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="italic flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-current"></div>
                                    Próximamente
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

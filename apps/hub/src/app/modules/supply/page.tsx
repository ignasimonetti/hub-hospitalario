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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 dark:border-slate-800/60 pb-10">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Panel de Suministros
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">
                        Visión general de abastecimiento, stock y contrataciones.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mr-4 border-r border-gray-200 dark:border-slate-800 pr-6 h-6 flex items-center hidden sm:flex">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <Link
                        href="/modules/supply/settings"
                        className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                        title="Configuración de Suministros"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/modules/supply/requests/new"
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                    </Link>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Solicitudes Activas */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Solicitudes Activas</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">24</h3>
                        <div className="mt-4 flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 w-fit px-3 py-1.5 rounded-xl border border-amber-500/20 uppercase tracking-wider">
                            <Clock className="w-3 h-3 mr-1.5" />
                            8 pendientes de firma
                        </div>
                    </div>
                </motion.div>

                {/* Gasto Mensual */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Gasto Mensual</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">$4.2M</h3>
                        <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 w-fit px-3 py-1.5 rounded-xl border border-emerald-500/20 uppercase tracking-wider">
                            <TrendingUp className="w-3 h-3 mr-1.5" />
                            +12% vs mes anterior
                        </div>
                    </div>
                </motion.div>

                {/* Alert Stock */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-2xl hover:border-red-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="p-3 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Alertas de Stock</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">15</h3>
                        <div className="mt-4 flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 w-fit px-3 py-1.5 rounded-xl border border-red-500/20 uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3 mr-1.5" />
                            3 Críticos
                        </div>
                    </div>
                </motion.div>

                {/* Proveedores */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-2xl hover:border-purple-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Proveedores</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">128</h3>
                        <div className="mt-4 flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20 w-fit px-3 py-1.5 rounded-xl border border-slate-500/20 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                            98% Activos
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Navigation Modules Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-1.5 rounded-full bg-blue-600"></div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Módulos Operativos</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Module: Requests */}
                    <motion.div variants={itemVariants}>
                        <Link
                            href="/modules/supply/requests"
                            className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2"
                        >
                            <div className="p-10 flex-1">
                                <div className="p-5 w-fit rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 mb-8">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                        Solicitudes de Pedidos
                                        <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-2" />
                                    </h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400 mt-4 font-medium leading-relaxed">
                                        Gestionar requerimientos internos de farmacia y servicios.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-gray-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-800/20 p-6 flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                    3 Nuevos
                                </span>
                                <span className="flex items-center gap-2 text-amber-500">
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
                            className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2"
                        >
                            <div className="p-10 flex-1">
                                <div className="p-5 w-fit rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 mb-8">
                                    <Package className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                        Catálogo & Stock
                                        <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-purple-600 transition-all group-hover:translate-x-2" />
                                    </h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400 mt-4 font-medium leading-relaxed">
                                        Maestro de artículos, precios y control de existencias.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-gray-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-800/20 p-6 flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                                    Gestión Activa
                                </span>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Module: Providers */}
                    <motion.div variants={itemVariants}>
                        <div className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 shadow-sm transition-all opacity-70 grayscale-[0.8]">
                            <div className="p-10 flex-1 text-slate-400">
                                <div className="p-5 w-fit rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-300 mb-8">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-400 dark:text-slate-500">Proveedores</h3>
                                    <p className="text-base text-slate-400 dark:text-slate-500 mt-4 font-medium leading-relaxed">
                                        Registro RUPSE, evaluaciones y legajos administrativos.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-gray-100 dark:border-slate-800/50 bg-gray-100/30 dark:bg-slate-800/10 p-6 flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">
                                <span className="italic flex items-center gap-2">
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

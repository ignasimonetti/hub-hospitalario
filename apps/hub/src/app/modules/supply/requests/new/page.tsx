import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupplyRequestForm } from "./request-form";

export default function NewSupplyRequestPage() {
    return (
        <div className="container mx-auto py-8 lg:py-12 max-w-[1400px] space-y-8 h-[calc(100vh-4rem)] flex flex-col px-4 lg:px-12">
            {/* Breadcrumbs & Header */}
            <div className="shrink-0 space-y-4">
                <nav className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/modules/supply" className="hover:text-blue-600 transition-colors">Abastecimiento</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <Link href="/modules/supply/requests" className="hover:text-blue-600 transition-colors">Solicitudes</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <span className="text-slate-900 dark:text-slate-100">Nuevo Requerimiento</span>
                </nav>

                <div className="flex items-center gap-6">
                    <Link
                        href="/modules/supply/requests"
                        className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-blue-500/30"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-1" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Crear Nueva Solicitud</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1 lowercase first-letter:uppercase">Gestione el requerimiento de insumos para su sector.</p>
                    </div>
                </div>
            </div>

            {/* Main Content (Full Height for Scroll) */}
            <div className="flex-1 min-h-0">
                <SupplyRequestForm />
            </div>
        </div>
    );
}

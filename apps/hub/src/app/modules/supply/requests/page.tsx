import Link from "next/link";
import { Plus, Search, Filter, FileText, Calendar } from "lucide-react";
import { getSupplyRequests } from "@/app/actions/supply";

export default async function SupplyRequestsPage() {
    const { items: requests, totalItems } = await getSupplyRequests();

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-200 dark:border-slate-800 pb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Solicitudes de Pedido</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Historial y gestión de requerimientos de insumos.</p>
                </div>
                <Link
                    href="/modules/supply/requests/new"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Solicitud
                </Link>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por número, sector o motivo..."
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                    />
                </div>
                <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-slate-800" />
                <button className="w-full md:w-auto inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros Avanzados
                </button>
            </div>

            {/* Content Area */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                {requests.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="mx-auto h-20 w-20 rounded-3xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                            <FileText className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No hay solicitudes</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto font-medium">
                            Aún no has generado ninguna solicitud de suministros. Comienza creando una nueva.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em] border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-8 py-5">Número / Fecha</th>
                                    <th className="px-8 py-5">Sector</th>
                                    <th className="px-8 py-5">Motivo</th>
                                    <th className="px-8 py-5">Prioridad</th>
                                    <th className="px-8 py-5">Estado</th>
                                    <th className="px-8 py-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-200">
                                {requests.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{req.request_number}</span>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center mt-1.5 uppercase tracking-tighter">
                                                    <Calendar className="w-3 h-3 mr-1.5 opacity-50" />
                                                    {new Date(req.created).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{req.requesting_sector}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium max-w-[200px] truncate block italic">
                                                "{req.motive || 'Sin motivo especificado'}"
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border
                                                ${req.priority === 'urgente' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                                                    req.priority === 'baja' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-slate-600 dark:text-slate-400 border-gray-500/20'}`}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full animate-pulse
                                                    ${req.status === 'autorizado' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                        req.status === 'pendiente_autorizacion' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                            req.status === 'rechazado' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                                'bg-slate-400'}`}></div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[10px] uppercase tracking-widest border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-2 bg-white dark:bg-slate-950 transition-all hover:border-blue-500/30 hover:shadow-lg active:scale-95">
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

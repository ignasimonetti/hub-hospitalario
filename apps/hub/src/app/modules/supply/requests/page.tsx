import Link from "next/link";
import { Plus, Search, Filter, FileText, Calendar } from "lucide-react";
import { getSupplyRequests } from "@/app/actions/supply";

export default async function SupplyRequestsPage() {
    const { items: requests, totalItems } = await getSupplyRequests();

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Solicitudes de Pedido</h1>
                    <p className="text-muted-foreground">Historial y gestión de requerimientos de insumos.</p>
                </div>
                <Link
                    href="/modules/supply/requests/new"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Solicitud
                </Link>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex items-center gap-2 border rounded-lg p-2 bg-card shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por número, sector o motivo..."
                        className="w-full rounded-md border-0 bg-transparent py-2 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                    />
                </div>
                <div className="h-6 w-px bg-border mx-2" />
                <button className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                </button>
            </div>

            {/* Content Area */}
            <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                {requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No hay solicitudes</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                            Aún no has generado ninguna solicitud de suministros. Comienza creando una nueva.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">Número / Fecha</th>
                                    <th className="px-6 py-4">Sector</th>
                                    <th className="px-6 py-4">Motivo</th>
                                    <th className="px-6 py-4">Prioridad</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{req.request_number}</span>
                                                <span className="text-xs text-muted-foreground flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(req.created).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {req.requesting_sector}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                                            {req.motive || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${req.priority === 'urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    req.priority === 'baja' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                {req.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${req.status === 'autorizado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    req.status === 'pendiente_autorizacion' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        req.status === 'rechazado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {req.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-muted-foreground hover:text-primary font-medium text-xs border border-border rounded px-3 py-1 bg-background hover:bg-accent transition-colors">
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

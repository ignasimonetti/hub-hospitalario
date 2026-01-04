
'use client';

import { useState, useEffect } from "react";
import { pocketbase } from "@/lib/auth";
import { ExpedienteRecord, ExpedienteEstado } from "@/types/expedientes";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ExpedienteStatusBadge, ExpedientePriorityBadge } from "./ExpedienteStatusBadge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { LocationSelector } from "@/components/modules/expedientes/LocationSelector";
import { EditableCell } from "@/components/modules/expedientes/EditableCell";
import { RichTextCell } from "@/components/modules/expedientes/RichTextCell";
import {
    Search, Plus, Loader2, MoreHorizontal, Pen, Trash, Archive,
    CheckSquare, XSquare, AlertCircle, Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpedientesTable() {
    const router = useRouter();
    const [expedientes, setExpedientes] = useState<ExpedienteRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null); // For single delete
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);



    const fetchExpedientes = async () => {
        setLoading(true);
        try {
            let filter = "";
            if (statusFilter && statusFilter !== "all") {
                filter = `estado = "${statusFilter}"`;
            }
            if (search) {
                const searchFilter = `(numero ~ "${search}" || descripcion ~ "${search}" || ubicacion ~ "${search}")`;
                filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
            }

            const result = await pocketbase.collection("expedientes").getList<ExpedienteRecord>(1, 50, {
                sort: "-ultimo_movimiento",
                filter: filter,
                expand: 'ubicacion', // Expand location
                requestKey: null // Avoid auto-cancellation
            });
            setExpedientes(result.items);
            // Clear selection on refresh
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching expedientes:", error);
            toast.error("Error al cargar expedientes.");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchExpedientes();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(expedientes.map(e => e.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await pocketbase.collection('expedientes').delete(id);
            toast.success("Expediente eliminado correctamente.");
            fetchExpedientes();
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Error al eliminar el expediente.");
        } finally {
            setDeleteId(null);
        }
    };

    const deleteBulk = async () => {
        try {
            // Sequential deletion to avoid race conditions or use Promise.all
            // PocketBase SDK doesn't have bulk delete yet
            await Promise.all(selectedIds.map(id => pocketbase.collection('expedientes').delete(id)));

            toast.success(`${selectedIds.length} expedientes eliminados.`);
            fetchExpedientes();
            setIsBulkDeleteOpen(false);
        } catch (error) {
            console.error("Error bulk delete:", error);
            toast.error("Error al eliminar expedientes seleccionados.");
        }
    };

    const updateStatus = async (id: string, newStatus: ExpedienteEstado) => {
        // Optimistic update
        setExpedientes(prev => prev.map(e => e.id === id ? { ...e, estado: newStatus } : e));

        try {
            await pocketbase.collection('expedientes').update(id, { estado: newStatus, ultimo_movimiento: new Date() });
            toast.success("Estado actualizado.");
        } catch (error) {
            toast.error("Error al actualizar estado.");
            fetchExpedientes(); // Revert
        }
    };

    const updateLocation = async (id: string, newLocationId: string) => {
        try {
            await pocketbase.collection('expedientes').update(id, { ubicacion: newLocationId, ultimo_movimiento: new Date() });
            toast.success("Ubicación actualizada.");
            // We need to re-fetch to get the expanded location name correctly if we don't have it locally
            // Or we could implement a smarter local update if LocationSelector returned the full object
            fetchExpedientes();
        } catch (error) {
            toast.error("Error al actualizar ubicación.");
        }
    };

    const updatePriority = async (id: string, newPriority: string) => {
        // Optimistic
        setExpedientes(prev => prev.map(e => e.id === id ? { ...e, prioridad: newPriority as any } : e));

        try {
            await pocketbase.collection('expedientes').update(id, { prioridad: newPriority, ultimo_movimiento: new Date() });
            toast.success("Prioridad actualizada.");
        } catch (error) {
            toast.error("Error al actualizar prioridad.");
            fetchExpedientes();
        }
    };

    const updateField = async (id: string, field: 'numero' | 'descripcion' | 'observacion', value: string) => {
        // Optimistic
        setExpedientes(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

        try {
            await pocketbase.collection('expedientes').update(id, { [field]: value, ultimo_movimiento: new Date() });
            toast.success("Actualizado.");
        } catch (error) {
            toast.error("Error al actualizar.");
            fetchExpedientes();
        }
    };

    const updateDate = async (id: string, newDate: Date | undefined) => {
        if (!newDate) return;
        const isoDate = newDate.toISOString();

        // Optimistic
        setExpedientes(prev => prev.map(e => e.id === id ? { ...e, ultimo_movimiento: isoDate } : e));

        try {
            await pocketbase.collection('expedientes').update(id, { ultimo_movimiento: isoDate });
            toast.success("Fecha actualizada.");
        } catch (error) {
            toast.error("Error al actualizar fecha.");
            fetchExpedientes();
        }
    };

    const updateBulkStatus = async (newStatus: ExpedienteEstado) => {
        try {
            await Promise.all(selectedIds.map(id =>
                pocketbase.collection('expedientes').update(id, { estado: newStatus, ultimo_movimiento: new Date() })
            ));
            toast.success(`Estado actualizado a ${newStatus} para ${selectedIds.length} expedientes.`);
            fetchExpedientes();
        } catch (error) {
            toast.error("Error al actualizar estados.");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header / Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                {selectedIds.length > 0 ? (
                    // Bulk Actions Mode
                    <div className="flex w-full items-center justify-between animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                {selectedIds.length} seleccionados
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-muted-foreground">
                                Deseleccionar
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Select onValueChange={(val) => updateBulkStatus(val as ExpedienteEstado)}>
                                <SelectTrigger className="w-[160px] h-9">
                                    <SelectValue placeholder="Cambiar Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="En trámite">En trámite</SelectItem>

                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    <SelectItem value="Archivado">Archivado</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Default Search/Filter Mode
                    <>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por N°, asunto..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="En trámite">En trámite</SelectItem>

                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    <SelectItem value="Archivado">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">

                            <Button onClick={() => router.push("/modules/expedientes/new")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Expediente
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={expedientes.length > 0 && selectedIds.length === expedientes.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Expte N°</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Descripción</TableHead>
                            <TableHead className="hidden lg:table-cell text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Observaciones</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Prioridad</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Estado</TableHead>
                            <TableHead className="hidden md:table-cell text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Ubicación</TableHead>
                            <TableHead className="hidden md:table-cell text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Último Mov.</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-slate-700 dark:text-slate-200">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i} className="border-gray-100 dark:border-slate-800/50">
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : expedientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No se encontraron expedientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            expedientes.map((exp) => (
                                <TableRow
                                    key={exp.id}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-gray-100 dark:border-slate-800/50 group"
                                    data-state={selectedIds.includes(exp.id) ? "selected" : undefined}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(exp.id)}
                                            onCheckedChange={(checked) => handleSelectOne(exp.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap min-w-[180px]">
                                        <EditableCell
                                            value={exp.numero}
                                            onSave={(val) => updateField(exp.id, 'numero', val)}
                                            isMono
                                        />
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        <EditableCell
                                            value={exp.descripcion}
                                            onSave={(val) => updateField(exp.id, 'descripcion', val)}
                                        />
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <RichTextCell
                                            value={exp.observacion}
                                            onSave={(val) => updateField(exp.id, 'observacion', val)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="outline-none focus:ring-1 focus:ring-ring rounded-md p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                                <ExpedientePriorityBadge priority={exp.prioridad} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuItem onClick={() => updatePriority(exp.id, "Alta")}>Alta</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updatePriority(exp.id, "Media")}>Media</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updatePriority(exp.id, "Baja")}>Baja</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="outline-none focus:ring-1 focus:ring-ring rounded-md p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                                <ExpedienteStatusBadge status={exp.estado} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuItem onClick={() => updateStatus(exp.id, "En trámite")}>En trámite</DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => updateStatus(exp.id, "Finalizado")}>Finalizado</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(exp.id, "Archivado")}>Archivado</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm" onClick={(e) => e.stopPropagation()}>
                                        <LocationSelector
                                            value={exp.ubicacion}
                                            initialName={exp.expand?.ubicacion?.nombre}
                                            onChange={(newVal) => updateLocation(exp.id, newVal)}
                                            className="h-8 border-transparent bg-transparent shadow-none hover:bg-gray-100 dark:hover:bg-slate-800 px-2 justify-start text-muted-foreground hover:text-slate-200 transition-colors"
                                        />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"ghost"}
                                                    className={cn(
                                                        "h-8 justify-start text-left font-normal px-2 -ml-2 w-full hover:bg-gray-100 dark:hover:bg-slate-800",
                                                        !exp.ultimo_movimiento && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {exp.ultimo_movimiento ? (
                                                        format(new Date(exp.ultimo_movimiento), "dd/MM/yyyy", { locale: es })
                                                    ) : (
                                                        <span>Sin fecha</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={exp.ultimo_movimiento ? new Date(exp.ultimo_movimiento) : undefined}
                                                    onSelect={(date) => updateDate(exp.id, date)}
                                                    initialFocus
                                                    locale={es}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/modules/expedientes/${exp.id}`)}>
                                                    <Pen className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => setDeleteId(exp.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Mostrando los últimos 50 registros
            </div>

            {/* Single Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el expediente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && deleteItem(deleteId)} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Alert */}
            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {selectedIds.length} expedientes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente los {selectedIds.length} expedientes seleccionados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteBulk} className="bg-red-600 hover:bg-red-700">
                            Eliminar Selección
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

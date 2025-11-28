'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, RefreshCw, User, FileText, Calendar } from "lucide-react";
import { getAuditLogs } from '@/app/actions/audit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function AuditTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedAction, setSelectedAction] = useState<string>('all');

    // Detail Sheet
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = async (reset = false) => {
        setIsLoading(true);
        const currentPage = reset ? 1 : page;

        const result = await getAuditLogs(currentPage, 50, {
            action: selectedAction
        });

        if (result.success) {
            if (reset) {
                setLogs(result.data.items);
            } else {
                setLogs(prev => [...prev, ...result.data.items]);
            }
            setHasMore(result.data.items.length === 50);
            if (reset) setPage(2);
            else setPage(prev => prev + 1);
        } else {
            toast.error("Error al cargar logs de auditoría");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLogs(true);
    }, [selectedAction]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'create':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Crear</Badge>;
            case 'update':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Editar</Badge>;
            case 'delete':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Eliminar</Badge>;
            case 'login':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Acceso</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    const getResourceIcon = (resource: string) => {
        switch (resource) {
            case 'users': return <User className="h-4 w-4" />;
            case 'roles': return <Activity className="h-4 w-4" />;
            case 'tenants': return <Calendar className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getReadableDescription = (log: any) => {
        const { action, resource, details } = log;

        // Extract useful info from details
        const name = details?.name || details?.email || '';
        const changes = details?.changes || [];

        switch (action) {
            case 'create':
                return name ? `Creó: ${name}` : `Creó un nuevo registro`;
            case 'update':
                if (changes.length > 0) {
                    const fieldList = changes.slice(0, 3).join(', ');
                    const more = changes.length > 3 ? ` +${changes.length - 3}` : '';
                    return `Modificó: ${fieldList}${more}`;
                }
                return name ? `Modificó: ${name}` : 'Modificó un registro';
            case 'delete':
                return name ? `Eliminó: ${name}` : 'Eliminó un registro';
            case 'login':
                return 'Inició sesión';
            default:
                return action;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Auditoría del Sistema</h2>
                    <p className="text-muted-foreground">
                        Registro inmutable de todas las acciones realizadas en la plataforma.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por acción" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las acciones</SelectItem>
                            <SelectItem value="create">Creaciones</SelectItem>
                            <SelectItem value="update">Ediciones</SelectItem>
                            <SelectItem value="delete">Eliminaciones</SelectItem>
                            <SelectItem value="login">Accesos</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => fetchLogs(true)}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Fecha</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Recurso</TableHead>
                                <TableHead>Descripción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 && !isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hay registros de auditoría.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-slate-500" />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {log.expand?.actor?.name || log.expand?.actor?.email || 'Sistema'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                {getResourceIcon(log.resource)}
                                                <span className="capitalize">{log.resource}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {getReadableDescription(log)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Log Detail Sheet */}
            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent className="sm:max-w-xl w-full bg-white dark:bg-slate-950">
                    <SheetHeader className="mb-6 border-b pb-4">
                        <SheetTitle>Detalle del Evento</SheetTitle>
                        <SheetDescription className="font-mono text-xs">
                            ID: {selectedLog?.id}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Fecha</label>
                                    <p className="text-sm">{format(new Date(selectedLog.created), 'PPPP p', { locale: es })}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">IP Address</label>
                                    <p className="text-sm font-mono">{selectedLog.ip_address || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Actor</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm">{selectedLog.expand?.actor?.name || 'Sistema'}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-6">{selectedLog.expand?.actor?.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Recurso</label>
                                    <p className="text-sm capitalize mt-1">{selectedLog.resource}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{selectedLog.resource_id}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Cambios / Detalles (JSON)</label>
                                <ScrollArea className="h-[300px] w-full rounded-md border bg-slate-50 dark:bg-slate-900 p-4">
                                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

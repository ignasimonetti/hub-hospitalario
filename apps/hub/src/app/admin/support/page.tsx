'use client';

import { useState, useEffect } from 'react';
import { pocketbase } from '@/lib/auth';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    MessageSquare,
    ExternalLink,
    Trash2,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';

interface ErrorReport {
    id: string;
    description: string;
    url: string;
    status: 'pending' | 'in_progress' | 'resolved';
    priority: 'low' | 'medium' | 'high' | 'critical';
    reporter: string;
    expand?: {
        reporter: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar?: string;
        }
    };
    created: string;
}

export default function AdminSupportPage() {
    const [reports, setReports] = useState<ErrorReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const { toast } = useToast();
    const { createNotification } = useNotifications();
    const router = useRouter();

    const fetchReports = async () => {
        try {
            setLoading(true);
            const pb = pocketbase;
            const records = await pb.collection('hub_error_reports').getFullList<ErrorReport>({
                sort: '-created',
                expand: 'reporter',
            });
            setReports(records);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los reportes',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await pocketbase.collection('hub_error_reports').update(id, {
                status: newStatus
            });

            setReports(prev => prev.map(report =>
                report.id === id ? { ...report, status: newStatus as any } : report
            ));

            toast({
                title: 'Estado actualizado',
                variant: 'default',
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el estado',
                variant: 'destructive',
            });
        }
    };

    const deleteReport = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) return;

        try {
            await pocketbase.collection('hub_error_reports').delete(id);
            setReports(prev => prev.filter(r => r.id !== id));
            toast({
                title: 'Reporte eliminado',
                variant: 'default',
            });
        } catch (error) {
            console.error('Error deleting report:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el reporte',
                variant: 'destructive',
            });
        }
    };

    const handleReply = async () => {
        if (!selectedReport || !replyMessage.trim()) return;

        try {
            setIsReplying(true);
            const pb = pocketbase;
            const currentUser = pb.authStore.model?.id;

            if (!currentUser) {
                throw new Error("No admin user found");
            }

            // 1. Create the comment record
            await pb.collection('hub_comments').create({
                content: replyMessage,
                author: currentUser,
                related_collection: 'hub_error_reports',
                related_id: selectedReport.id,
            });

            // 2. Create notification for the user
            // We include related_id so the user's notification modal can fetch the thread
            await createNotification({
                user: selectedReport.reporter,
                type: 'error_update',
                title: 'Nueva respuesta en tu reporte',
                message: `El administrador ha respondido: "${replyMessage.substring(0, 50)}${replyMessage.length > 50 ? '...' : ''}"`,
                link: '',
                read: false,
                related_id: selectedReport.id
            });

            // 3. Update status to 'in_progress' if needed
            if (selectedReport.status === 'pending') {
                await updateStatus(selectedReport.id, 'in_progress');
            }

            toast({
                title: 'Respuesta enviada',
                description: 'El comentario ha sido registrado y el usuario notificado.',
                variant: 'default',
            });

            setReplyMessage('');
            setSelectedReport(null);

        } catch (error) {
            console.error('Error replying:', error);
            toast({
                title: 'Error',
                description: 'No se pudo enviar la respuesta',
                variant: 'destructive',
            });
        } finally {
            setIsReplying(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Pendiente</Badge>;
            case 'in_progress':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">En Progreso</Badge>;
            case 'resolved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Resuelto</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Soporte Técnico</h1>
                    <p className="text-muted-foreground dark:text-slate-400">Administra los reportes de errores y tickets de soporte</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchReports} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                    <Button onClick={() => router.push('/admin')} variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Dashboard
                    </Button>
                </div>
            </div>

            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="dark:text-slate-100">Reportes Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 dark:text-slate-400">Cargando reportes...</div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-10">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-medium dark:text-slate-100">¡Todo limpio!</h3>
                            <p className="text-gray-500 dark:text-slate-400">No hay reportes de problemas pendientes.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-800">
                                    <TableHead className="dark:text-slate-400">Estado</TableHead>
                                    <TableHead className="dark:text-slate-400">Usuario</TableHead>
                                    <TableHead className="dark:text-slate-400">Problema</TableHead>
                                    <TableHead className="dark:text-slate-400">URL</TableHead>
                                    <TableHead className="dark:text-slate-400">Fecha</TableHead>
                                    <TableHead className="text-right dark:text-slate-400">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id} className="dark:border-slate-800">
                                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                                        <TableCell className="dark:text-slate-200">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {report.expand?.reporter?.firstName} {report.expand?.reporter?.lastName}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-slate-500">
                                                    {report.expand?.reporter?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="truncate text-sm dark:text-slate-300" title={report.description}>
                                                {report.description}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={report.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 text-xs"
                                            >
                                                Ver página <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">
                                            {formatDistanceToNow(new Date(report.created), { addSuffix: true, locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedReport(report)}
                                                    className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:text-slate-400 dark:hover:text-blue-300"
                                                    title="Responder / Ver detalles"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                                {report.status !== 'resolved' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateStatus(report.id, 'resolved')}
                                                        className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:text-slate-400 dark:hover:text-green-300"
                                                        title="Marcar como resuelto"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteReport(report.id)}
                                                    className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-300"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Reply Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="dark:bg-slate-900 dark:border-slate-800 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="dark:text-slate-100">Responder al reporte</DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4 py-4">
                            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-lg border border-gray-200 dark:border-slate-800 text-sm">
                                <p className="font-semibold text-gray-700 dark:text-slate-200 mb-1">
                                    {selectedReport.expand?.reporter?.firstName} reportó:
                                </p>
                                <p className="text-gray-600 dark:text-slate-400 italic">"{selectedReport.description}"</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-200">Tu respuesta</label>
                                <Textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Escribe una respuesta para el usuario..."
                                    className="min-h-[100px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedReport(null)}
                            className="dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReply}
                            disabled={isReplying || !replyMessage.trim()}
                            className="dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                            {isReplying ? 'Enviando...' : 'Enviar Respuesta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

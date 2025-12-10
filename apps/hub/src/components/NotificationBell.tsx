'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, Megaphone, MessageSquare, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { pocketbase } from '@/lib/auth'; // Import Pocketbase directly for component-level logic
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
// Link removed as we handle navigation via state/modal
// import Link from 'next/link';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [viewingNotification, setViewingNotification] = useState<any>(null);
    const { toast } = useToast();
    const {
        notifications,
        loading,
        error,
        count,
        markAsRead,
        markAllAsRead,
        createNotification,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
        refresh,
    } = useNotifications();

    const [replyText, setReplyText] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    // Auto-refresh when dropdown opens
    useEffect(() => {
        if (isOpen) {
            refresh();
        }
    }, [isOpen, refresh]);

    // Fetch comments and context when opening a notification with related_id
    useEffect(() => {
        const fetchThreadAndContext = async () => {
            if (!viewingNotification?.related_id) {
                setComments([]);
                return;
            }

            try {
                setLoadingComments(true);
                const pb = pocketbase;

                // 1. Fetch Comments
                const commentsResult = await pb.collection('hub_comments').getList(1, 50, {
                    filter: `related_id = "${viewingNotification.related_id}"`,
                    sort: 'created',
                    expand: 'author'
                });
                setComments(commentsResult.items);

                // 2. Fetch Parent Context (if not already fetched/available)
                // We guess the collection based on notification type or just try hub_error_reports for now
                if (!viewingNotification.contextData) {
                    try {
                        const parentRecord = await pb.collection('hub_error_reports').getOne(viewingNotification.related_id);
                        setViewingNotification((prev: any) => ({ ...prev, contextData: parentRecord }));
                    } catch (e) {
                        console.log("Could not fetch parent context or not an error report");
                    }
                }

            } catch (error) {
                console.error("Error fetching thread data", error);
            } finally {
                setLoadingComments(false);
            }
        };

        if (viewingNotification) {
            fetchThreadAndContext();
        } else {
            setReplyText(''); // Reset on close
        }
    }, [viewingNotification]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !viewingNotification?.related_id) return;

        try {
            setSendingReply(true);
            const pb = pocketbase;

            // 1. Create Comment
            const newComment = await pb.collection('hub_comments').create({
                content: replyText,
                author: pb.authStore.model?.id,
                related_collection: 'hub_error_reports', // We assume this for now, or infer from notification type
                related_id: viewingNotification.related_id,
            });

            // 2. Refresh local thread
            setComments([...comments, { ...newComment, author: pb.authStore.model?.id, expand: { author: pb.authStore.model } }]);
            setReplyText('');

            // 3. Optional: Notify admin via new notification record? 
            // In a real app we'd have cloud functions. For now, we assume admin checks /admin/support.

            toast({
                title: "Respuesta enviada",
                description: "Tu mensaje ha sido agregado al hilo.",
            });

        } catch (error) {
            console.error("Error sending reply", error);
            toast({ title: "Error al enviar", variant: "destructive" });
        } finally {
            setSendingReply(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const getNotificationIconComponent = (type: string) => {
        switch (type) {
            case 'mention':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'system':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'announcement':
                return <Megaphone className="h-4 w-4 text-purple-500" />;
            case 'error_update':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 hover:bg-gray-100 dark:hover:bg-slate-800"
                    title="Notificaciones"
                >
                    <Bell className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                    {count.unread > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium"
                            variant={count.unread > 9 ? 'destructive' : 'default'}
                        >
                            {count.unread > 9 ? '9+' : count.unread}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <AnimatePresence>
                {isOpen && (
                    <DropdownMenuContent
                        align="end"
                        className="w-80 max-h-[60vh] overflow-y-auto"
                        asChild
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                                <span className="font-medium">Notificaciones</span>
                                {count.unread > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Marcar todas como leídas
                                    </Button>
                                )}
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            {loading ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Cargando notificaciones...
                                </div>
                            ) : error ? (
                                <div className="p-4 text-center text-sm text-red-500">
                                    Error: {error}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No tienes notificaciones
                                </div>
                            ) : (
                                <>
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className="p-0">
                                            <div
                                                className={`block p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                onClick={async () => {
                                                    setViewingNotification(notification); // Open modal
                                                    if (!notification.read) {
                                                        await markAsRead(notification.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 pt-1">
                                                        {getNotificationIconComponent(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                                                {notification.title}
                                                            </p>
                                                            {!notification.read && (
                                                                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                                            {formatDistanceToNow(new Date(notification.created), {
                                                                addSuffix: true,
                                                                locale: es,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                        </div>
                                    ))}

                                    <div className="p-2 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleMarkAllAsRead}
                                            disabled={count.unread === 0}
                                        >
                                            Marcar todas como leídas
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </DropdownMenuContent>
                )}
            </AnimatePresence>

            {/* Notification Detail Modal (Thread Viewer) */}
            <Dialog open={!!viewingNotification} onOpenChange={(open) => !open && setViewingNotification(null)}>
                <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 dark:text-slate-100">
                            {viewingNotification && getNotificationIconComponent(viewingNotification.type)}
                            {viewingNotification?.title || 'Detalles'}
                        </DialogTitle>
                    </DialogHeader>

                    {viewingNotification && (
                        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[300px]">
                            {/* Original Notification Context */}
                            <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-800 mb-6">
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                                    Contexto del Reporte
                                </p>
                                {viewingNotification.contextData ? (
                                    <div className="space-y-2">
                                        <p className="text-gray-900 dark:text-slate-100 font-medium text-sm">
                                            {viewingNotification.contextData.description || "Sin descripción"}
                                        </p>
                                        {viewingNotification.contextData.url && (
                                            <p className="text-xs text-blue-500 truncate">
                                                En: {viewingNotification.contextData.url}
                                            </p>
                                        )}
                                        {/* Show attachments if available on parent - generic check */}
                                        {viewingNotification.contextData.attachment && (
                                            <div className="mt-2">
                                                <a
                                                    href={pocketbase.files.getURL(viewingNotification.contextData, viewingNotification.contextData.attachment)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                                >
                                                    <span className="bg-blue-100 p-1 rounded">📎 Ver adjunto original</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                                        {/* Fallback to notification message if fetch fails */}
                                        {viewingNotification.message}
                                    </p>
                                )}
                            </div>

                            {/* Conversation Thread */}
                            {loadingComments ? (
                                <div className="flex justify-center py-4">
                                    <span className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-gray-200 dark:border-slate-800" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-500">
                                                Historial de comentarios
                                            </span>
                                        </div>
                                    </div>

                                    {comments.map((comment: any) => {
                                        const isMe = comment.author === pocketbase.authStore.model?.id;
                                        return (
                                            <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`
                                                    max-w-[85%] rounded-lg p-3 text-sm
                                                    ${isMe
                                                        ? 'bg-blue-500 text-white rounded-br-none'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-none'
                                                    }
                                                `}>
                                                    <p>{comment.content}</p>
                                                    {/* Render attachment if exists */}
                                                    {comment.attachment && (
                                                        <div className="mt-2 text-xs">
                                                            <a
                                                                href={pocketbase.files.getURL(comment, comment.attachment)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}
                                                            >
                                                                📎 Ver archivo adjunto
                                                            </a>
                                                        </div>
                                                    )}
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {formatDistanceToNow(new Date(comment.created), { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}

                            {/* Anchor for auto-scroll */}
                            <div id="thread-end" />
                        </div>
                    )}

                    {/* Reply Input Area */}
                    {viewingNotification?.related_id && (
                        <div className="pt-2 border-t dark:border-slate-800">
                            <div className="flex gap-2 items-end">
                                <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe una respuesta..."
                                    className="min-h-[80px] text-sm resize-none bg-white dark:bg-slate-950 dark:border-slate-700"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    className="h-[80px] w-[60px]"
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim() || sendingReply}
                                >
                                    {sendingReply ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between w-full sm:justify-between mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                            onClick={() => {
                                if (viewingNotification) {
                                    deleteNotification(viewingNotification.id);
                                    toast({ title: "Notificación eliminada" });
                                    setViewingNotification(null);
                                }
                            }}
                        >
                            Eliminar Notificación
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setViewingNotification(null)}
                            className="dark:bg-slate-800 dark:text-slate-300"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DropdownMenu>
    );
}
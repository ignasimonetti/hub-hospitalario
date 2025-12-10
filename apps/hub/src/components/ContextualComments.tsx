'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { pocketbase } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Comment {
    id: string;
    content: string;
    createdBy: {
        id: string;
        name: string;
        avatar?: string;
        email: string;
    };
    createdAt: string;
    resourceId: string;
    resourceType: string;
}

interface ContextualCommentsProps {
    resourceId: string;
    resourceType: string;
    resourceTitle?: string;
}

export function ContextualComments({
    resourceId,
    resourceType,
    resourceTitle = 'este recurso',
}: ContextualCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { createNotification } = useNotifications();

    // Fetch comments for this resource
    useEffect(() => {
        const fetchComments = async () => {
            try {
                setLoading(true);
                setError(null);

                const pb = pocketbase;
                if (!pb.authStore.isValid) {
                    setLoading(false);
                    return;
                }

                // In a real implementation, we would have a hub_comments collection
                // For now, we'll simulate with local storage or a simple API call
                // This is a placeholder for the actual implementation

                // Simulate API call
                const mockComments: Comment[] = [
                    {
                        id: '1',
                        content: 'Por favor revisar la dosis de insulina para este paciente.',
                        createdBy: {
                            id: 'user1',
                            name: 'Dr. Pérez',
                            email: 'dr.perez@example.com',
                        },
                        createdAt: new Date(Date.now() - 3600000).toISOString(),
                        resourceId,
                        resourceType,
                    },
                    {
                        id: '2',
                        content: 'Se ha actualizado el historial clínico con los nuevos resultados de laboratorio.',
                        createdBy: {
                            id: 'user2',
                            name: 'Enf. Gómez',
                            email: 'enf.gomez@example.com',
                        },
                        createdAt: new Date(Date.now() - 7200000).toISOString(),
                        resourceId,
                        resourceType,
                    },
                ];

                setComments(mockComments);

            } catch (err) {
                console.error('Error fetching comments:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch comments');
                toast({
                    title: 'Error',
                    description: 'No se pudieron cargar los comentarios',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [resourceId, resourceType, toast]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) {
            toast({
                title: 'Error',
                description: 'Por favor escribe un comentario',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('Usuario no autenticado');
            }

            const currentUser = pb.authStore.model;

            // In a real implementation, we would create a comment in the database
            // For now, we'll simulate it
            const newCommentData: Comment = {
                id: Math.random().toString(36).substr(2, 9),
                content: newComment,
                createdBy: {
                    id: currentUser?.id || 'unknown',
                    name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Usuario',
                    email: currentUser?.email || '',
                },
                createdAt: new Date().toISOString(),
                resourceId,
                resourceType,
            };

            // Add to local state
            setComments(prev => [newCommentData, ...prev]);
            setNewComment('');

            // Create notifications for mentioned users (simplified)
            // In a real implementation, we would parse @mentions and create notifications
            const mentionedUsers = extractMentions(newComment);
            if (mentionedUsers.length > 0) {
                // This would be replaced with actual user lookup and notification creation
                console.log('Users to notify:', mentionedUsers);
            }

            // Create notification for the current user
            await createNotification({
                user: currentUser?.id,
                type: 'mention',
                title: `Nuevo comentario en ${resourceTitle}`,
                message: `Has comentado: "${newComment.substring(0, 50)}..."`,
                link: window.location.href,
                read: false,
            });

            toast({
                title: 'Comentario publicado',
                description: 'Tu comentario ha sido añadido',
                variant: 'default',
            });

        } catch (err) {
            console.error('Error submitting comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit comment');
            toast({
                title: 'Error',
                description: 'No se pudo publicar el comentario',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Simple mention extraction (would be more sophisticated in production)
    const extractMentions = (text: string): string[] => {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex) || [];
        return matches.map(match => match.substring(1));
    };

    return (
        <Card className="mt-6">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Comentarios
                </h3>
            </div>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-sm text-gray-500 py-4">
                        Cargando comentarios...
                    </div>
                ) : error ? (
                    <div className="text-center text-sm text-red-500 py-4">
                        Error: {error}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-4">
                        No hay comentarios aún. Sé el primero en comentar.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {comments.map((comment) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex gap-3"
                                >
                                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                        <AvatarImage src={comment.createdBy.avatar} alt={comment.createdBy.name} />
                                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200">
                                            {comment.createdBy.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                                    {comment.createdBy.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                                        addSuffix: true,
                                                        locale: es,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        <Input
                            placeholder={`Añadir un comentario sobre ${resourceTitle}...`}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                            disabled={isSubmitting}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSubmitComment}
                            disabled={isSubmitting || !newComment.trim()}
                            size="icon"
                            className="h-9 w-9 flex-shrink-0"
                        >
                            {isSubmitting ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Presiona Enter para enviar</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pocketbase } from '@/lib/auth';
import { Bell, AlertCircle, Megaphone, MessageSquare } from 'lucide-react';

interface Notification {
    id: string;
    user: string;
    type: 'mention' | 'system' | 'announcement' | 'error_update';
    title: string;
    message: string;
    link: string;
    read: boolean;
    related_id?: string;
    created: string;
    updated: string;
}

interface NotificationCount {
    total: number;
    unread: number;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState<NotificationCount>({ total: 0, unread: 0 });
    const { toast } = useToast();

    // Fetch notifications from PocketBase
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('User not authenticated');
            }

            // Fetch notifications for current user
            const records = await pb.collection('hub_notifications').getFullList<Notification>({
                sort: '-created',
                filter: `user = "${pb.authStore.model?.id}"`,
                expand: 'user',
                requestKey: null,
            });

            setNotifications(records);
            setCount({
                total: records.length,
                unread: records.filter(n => !n.read).length,
            });

            // Show toast for new unread notifications
            const unreadCount = records.filter(n => !n.read).length;
            if (unreadCount > 0) {
                toast({
                    title: `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} nueva${unreadCount > 1 ? 's' : ''}`,
                    description: 'Haz clic en la campana para verlas',
                    variant: 'default',
                });
            }

        } catch (err: any) {
            // Ignore auto-cancellation errors
            if (err?.isAbort || err?.status === 0) return;

            console.error('Error fetching notifications:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las notificaciones',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('User not authenticated');
            }

            await pb.collection('hub_notifications').update(notificationId, {
                read: true,
            });

            // Update local state
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );

            setCount(prev => ({
                ...prev,
                unread: prev.unread - 1,
            }));

        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
            toast({
                title: 'Error',
                description: 'No se pudo marcar la notificación como leída',
                variant: 'destructive',
            });
        }
    }, [toast]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('User not authenticated');
            }

            // Get all unread notifications
            const unreadNotifications = notifications.filter(n => !n.read);

            if (unreadNotifications.length === 0) {
                return;
            }

            // Batch update
            const updatePromises = unreadNotifications.map(notification =>
                pb.collection('hub_notifications').update(notification.id, {
                    read: true,
                })
            );

            await Promise.all(updatePromises);

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.read ? n : { ...n, read: true })
            );

            setCount(prev => ({
                ...prev,
                unread: 0,
            }));

            toast({
                title: 'Todas las notificaciones marcadas como leídas',
                variant: 'default',
            });

        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
            toast({
                title: 'Error',
                description: 'No se pudieron marcar todas las notificaciones como leídas',
                variant: 'destructive',
            });
        }
    }, [notifications, toast]);

    // Create a new notification (for system use)
    const createNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'created' | 'updated'>) => {
        try {
            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('User not authenticated');
            }

            const newNotification = await pb.collection('hub_notifications').create(notificationData);

            // Update local state
            setNotifications(prev => {
                const notification: Notification = {
                    id: newNotification.id,
                    user: newNotification.user,
                    type: newNotification.type,
                    title: newNotification.title,
                    message: newNotification.message,
                    link: newNotification.link,
                    read: newNotification.read,
                    related_id: newNotification.related_id,
                    created: newNotification.created,
                    updated: newNotification.updated,
                };
                return [notification, ...prev];
            });
            setCount(prev => ({
                total: prev.total + 1,
                unread: prev.unread + 1,
            }));

            return newNotification;

        } catch (err) {
            console.error('Error creating notification:', err);
            setError(err instanceof Error ? err.message : 'Failed to create notification');
            toast({
                title: 'Error',
                description: 'No se pudo crear la notificación',
                variant: 'destructive',
            });
            throw err;
        }
    }, [toast]);

    // Delete a notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('User not authenticated');
            }

            await pb.collection('hub_notifications').delete(notificationId);

            // Update local state
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setCount(prev => ({
                total: prev.total - 1,
                unread: prev.unread - (notifications.find(n => n.id === notificationId)?.read ? 0 : 1),
            }));

            toast({
                title: 'Notificación eliminada',
                variant: 'default',
            });

        } catch (err) {
            console.error('Error deleting notification:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete notification');
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la notificación',
                variant: 'destructive',
            });
        }
    }, [toast]);

    // Get icon based on notification type
    const getNotificationIcon = useCallback((type: Notification['type']) => {
        switch (type) {
            case 'mention':
                return MessageSquare({ className: "h-4 w-4 text-blue-500" });
            case 'system':
                return AlertCircle({ className: "h-4 w-4 text-yellow-500" });
            case 'announcement':
                return Megaphone({ className: "h-4 w-4 text-purple-500" });
            case 'error_update':
                return AlertCircle({ className: "h-4 w-4 text-red-500" });
            default:
                return Bell({ className: "h-4 w-4 text-gray-500" });
        }
    }, []);

    // Get notification color based on type
    const getNotificationColor = useCallback((type: Notification['type']) => {
        switch (type) {
            case 'mention':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
            case 'system':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
            case 'announcement':
                return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700';
            case 'error_update':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
            default:
                return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
        }
    }, []);

    // Refresh notifications
    const refresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();

        // Set up polling for new notifications
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        error,
        count,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        createNotification,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
        refresh,
    };
}
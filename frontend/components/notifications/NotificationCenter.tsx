'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { Bell, X, Check, FileText, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR');
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.getNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error('Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: 1 } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success('Todas as notificações marcadas como lidas');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Erro ao marcar notificações como lidas');
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate to related proposal if exists
        if (notification.related_proposal_id) {
            onClose();
            router.push(`/propostas?id=${notification.related_proposal_id}`);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'access_request':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case 'access_granted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'share_invite':
                return <UserPlus className="w-5 h-5 text-blue-600" />;
            case 'validation_request':
                return <FileText className="w-5 h-5 text-orange-600" />;
            case 'proposal_approved':
                return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={onClose}
            />

            {/* Notification Panel */}
            <div className="fixed top-16 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <h3 className="font-semibold text-gray-900">Notificações</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-plura-primary text-white text-xs font-medium rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-plura-primary hover:text-plura-primary/80 font-medium"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plura-primary"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm text-gray-900">
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-plura-primary rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            {notification.message && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            {notification.proposal_name && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Proposta: {notification.proposal_name}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatRelativeTime(new Date(notification.created_at))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

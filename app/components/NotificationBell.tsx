'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Bell, Check } from 'lucide-react'

interface Notification {
    id: string
    title: string
    message: string
    is_read: boolean
    created_at: string
    is_broadcast?: boolean
}

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            const [personalRes, broadcastRes] = await Promise.all([
                supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('broadcast_notifications')
                    .select('*')
                    .eq('status', 'SENT')
                    .order('sent_at', { ascending: false })
                    .limit(10)
            ])

            let readBroadcastIds: string[] = []
            try {
                readBroadcastIds = JSON.parse(
                    localStorage.getItem('mentron_read_broadcasts') || '[]'
                )
            } catch (_) {}

            const personal = (personalRes.data || []).map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                is_read: n.is_read,
                created_at: n.created_at,
                is_broadcast: false
            }))

            const broadcasts = (broadcastRes.data || []).map((b: any) => ({
                id: b.id,
                title: b.title,
                message: b.body || '',
                is_read: readBroadcastIds.includes(b.id),
                created_at: b.sent_at || b.created_at,
                is_broadcast: true
            }))

            const merged = [...personal, ...broadcasts].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setNotifications(merged)
        }

        fetchNotifications()

        const channel = supabase.channel(`notifications_bridge:${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev])
            })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'broadcast_notifications',
            }, (payload) => {
                const b = payload.new as any
                if (b.status === 'SENT') {
                    setNotifications(prev => [{
                        id: b.id,
                        title: b.title,
                        message: b.body || '',
                        is_read: false,
                        created_at: b.sent_at || b.created_at,
                        is_broadcast: true
                    }, ...prev])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => !n.is_read).length

    const markAsRead = async (id: string) => {
        const item = notifications.find(n => n.id === id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        if (item?.is_broadcast) {
            try {
                const readBroadcastIds: string[] = JSON.parse(
                    localStorage.getItem('mentron_read_broadcasts') || '[]'
                )
                if (!readBroadcastIds.includes(id)) {
                    localStorage.setItem(
                        'mentron_read_broadcasts',
                        JSON.stringify([...readBroadcastIds, id])
                    )
                }
            } catch (_) {}
        } else {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        const broadcastIds = notifications.filter(n => n.is_broadcast).map(n => n.id)
        if (broadcastIds.length > 0) {
            try {
                const readBroadcastIds: string[] = JSON.parse(
                    localStorage.getItem('mentron_read_broadcasts') || '[]'
                )
                const combined = Array.from(new Set([...readBroadcastIds, ...broadcastIds]))
                localStorage.setItem('mentron_read_broadcasts', JSON.stringify(combined))
            } catch (_) {}
        }
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-full glass bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
            >
                <Bell size={18} className="text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a] text-[8px] font-black flex items-center justify-center text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-14 right-0 w-80 sm:w-96 glass-card bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                                <span className="block text-2xl mb-2">📭</span>
                                No notifications yet
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-4 border-b border-white/5 last:border-0 transition-all ${notification.is_read ? 'opacity-60 hover:opacity-100' : 'bg-blue-500/5'}`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-black text-white">{notification.title}</h4>
                                                    {notification.is_broadcast && (
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 tracking-wider">
                                                            Broadcast
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed font-medium">{notification.message}</p>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">
                                                    {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <button 
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="w-6 h-6 rounded-full glass bg-white/5 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

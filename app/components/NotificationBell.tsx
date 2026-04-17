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
}

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)
            
            if (data) setNotifications(data)
        }

        fetchNotifications()

        const channel = supabase.channel(`notifications:${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev])
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
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
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
                                                <h4 className="text-sm font-black text-white mb-1">{notification.title}</h4>
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

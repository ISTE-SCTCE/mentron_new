'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Lock, Check } from 'lucide-react'
import { PdfViewerModal } from './PdfViewerModal'

interface NoteAccessGateProps {
    noteUrl: string
    userId: string
    userIsteId: string | null
    userRole: string
    title: string
    children: React.ReactNode
}

export function NoteAccessGate({ noteUrl, userId, userIsteId, userRole, title, children }: NoteAccessGateProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showViewer, setShowViewer] = useState(false)
    const [isteId, setIsteId] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [localIsteId, setLocalIsteId] = useState(userIsteId)

    const isAuthorized = userRole === 'exec' || userRole === 'core' || userRole === 'admin' || !!localIsteId

    const supabase = createClient()

    const handleVerify = async () => {
        if (!isteId.trim()) return
        setIsVerifying(true)
        try {
            // Live validation against Project A via FDW
            const { data: member, error: memberError } = await supabase
                .from('project_a.members')
                .select('ui_id')
                .eq('ui_id', isteId.trim())
                .maybeSingle()

            if (memberError || !member) {
                toast.error("Invalid ISTE ID. Please check and try again.")
                return
            }

            // Success: Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ iste_id: isteId.trim() })
                .eq('id', userId)

            if (updateError) throw updateError

            toast.success("ISTE ID Verified! Opening note...")
            setLocalIsteId(isteId.trim())
            setIsOpen(false)
            
            // Open the secure viewer
            setShowViewer(true)
        } catch (error: any) {
            toast.error(error.message || "Verification failed")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isAuthorized) {
            setShowViewer(true)
        } else {
            setIsOpen(true)
        }
    }

    return (
        <>
            <div onClick={handleClick} className="cursor-pointer">
                {children}
            </div>

            {/* Verification Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative glass-card max-w-md w-full p-8 shadow-2xl border border-white/10"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 mx-auto">
                                <Lock size={32} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">ISTE Membership Required</h2>
                            <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
                                This resource is exclusive to verified ISTE members. Please provide your ISTE Membership ID to instantly unlock education resources.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Your ISTE ID</label>
                                    <input 
                                        type="text" 
                                        value={isteId}
                                        onChange={(e) => setIsteId(e.target.value)}
                                        placeholder="e.g. ISTE-2024-XXXX"
                                        className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    />
                                </div>

                                <button
                                    disabled={isVerifying || !isteId.trim()}
                                    onClick={handleVerify}
                                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    {isVerifying ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            <span>VERIFY & UNLOCK</span>
                                        </>
                                    )}
                                </button>

                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest py-2 transition-colors"
                                >
                                    Not now, thanks
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Viewer */}
            <AnimatePresence>
                {showViewer && (
                    <PdfViewerModal 
                        url={noteUrl} 
                        title={title} 
                        onClose={() => setShowViewer(false)} 
                    />
                )}
            </AnimatePresence>
        </>
    )
}

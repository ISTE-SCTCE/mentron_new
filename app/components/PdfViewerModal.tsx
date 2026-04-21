'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, ShieldAlert, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { PdfCanvasViewer } from './PdfCanvasViewer'

interface PdfViewerModalProps {
    url: string
    title: string
    onClose: () => void
}

export function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showShield, setShowShield] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const toggleFullScreen = async () => {
        if (!containerRef.current) return

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (err) {
            console.error(`Error attempting to toggle full-screen mode: ${err}`)
            setIsFullScreen(!isFullScreen)
        }
    }

    const handleSecurityViolation = (e: any) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault()
        }
        setShowShield(true)
        // Auto-hide shield after a moment
        setTimeout(() => setShowShield(false), 2000)
    }

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement)
        }

        const handleGlobalContextMenu = (e: MouseEvent) => {
            // Only block if the event target is within our modal
            if (containerRef.current?.contains(e.target as Node)) {
                handleSecurityViolation(e)
            }
        }

        document.addEventListener('fullscreenchange', handleFullScreenChange)
        window.addEventListener('contextmenu', handleGlobalContextMenu)
        
        // Prevent accidental back navigation while viewing
        const handlePopState = (e: PopStateEvent) => {
            onClose()
        }
        window.history.pushState(null, '', window.location.href)
        window.addEventListener('popstate', handlePopState)
        
        // Disable keyboard shortcuts for print/save
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'c' || e.key === 'u')) {
                handleSecurityViolation(e)
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange)
            window.removeEventListener('contextmenu', handleGlobalContextMenu)
            window.removeEventListener('popstate', handlePopState)
            window.removeEventListener('keydown', handleKeyDown)
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {})
            }
        }
    }, [onClose])

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
            onContextMenu={handleSecurityViolation}
        >
            {/* Security Shield Overlay (Flash) */}
            <AnimatePresence>
                {showShield && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[10000] bg-red-600/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20"
                        >
                            <Lock className="animate-bounce" />
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-sm">Action Blocked</h4>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Downloads & Right-Click are disabled for security</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Container */}
            <motion.div 
                ref={containerRef}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                    scale: 1, 
                    opacity: 1,
                    padding: isFullScreen ? 0 : 48,
                    width: '100%',
                    height: '100%',
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative flex items-center justify-center overflow-hidden"
            >
                <motion.div 
                    layout
                    className={`relative w-full h-full bg-[#111] overflow-hidden shadow-2xl flex flex-col ${isFullScreen ? '' : 'rounded-[2rem] border border-white/10'}`}
                >
                    {/* Custom Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest truncate max-w-[200px] md:max-w-md">{title}</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Secure Viewer Mode • Protected Content</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleFullScreen}
                                className="flex w-10 h-10 rounded-xl glass bg-white/5 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isFullScreen ? 'minimize' : 'maximize'}
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                    </motion.div>
                                </AnimatePresence>
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl glass bg-red-500/10 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 transition-all border border-transparent hover:border-red-500/20"
                                title="Close Viewer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Viewer Body */}
                    <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                        <PdfCanvasViewer 
                            url={url} 
                            onLoadSuccess={() => setIsLoading(false)}
                            onLoadError={(err) => {
                                console.error(err)
                                toast.error("Failed to load secure document.")
                            }}
                        />

                        {/* Interactive Shield Layer */}
                        <div 
                            className="absolute inset-0 pointer-events-none" 
                            onContextMenu={handleSecurityViolation}
                        />
                    </div>

                    {/* Secure Footer Notification */}
                    <div className="px-6 py-3 bg-red-500/5 text-center shrink-0">
                        <p className="text-[9px] font-black text-red-500/80 uppercase tracking-[0.3em]">
                            ⚠️ This document is protected by ISTE Anti-Piracy Policy. Unauthorized redistribution is strictly prohibited.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

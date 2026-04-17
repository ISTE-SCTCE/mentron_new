'use client'

import { useState, useEffect } from 'react'
import { X, Maximize2, Minimize2, ShieldAlert } from 'lucide-react'

interface PdfViewerModalProps {
    url: string
    title: string
    onClose: () => void
}

export function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Construct URL with parameters to hide toolbar in supporting browsers
    // #toolbar=0&navpanes=0&scrollbar=0
    const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0`

    useEffect(() => {
        // Prevent accidental back navigation while viewing
        const handlePopState = (e: PopStateEvent) => {
            onClose()
        }
        window.history.pushState(null, '', window.location.href)
        window.addEventListener('popstate', handlePopState)
        
        // Disable keyboard shortcuts for print/save
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
                e.preventDefault()
                alert("Printing and Saving are disabled to protect the content.")
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('popstate', handlePopState)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 ${isFullScreen ? 'p-0' : 'p-4 md:p-12'}`}>
            
            {/* Main Container */}
            <div className={`relative w-full h-full bg-[#111] ${isFullScreen ? '' : 'rounded-[2rem] border border-white/10'} overflow-hidden shadow-2xl flex flex-col`}>
                
                {/* Custom Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest truncate max-w-[200px] md:max-w-md">{title}</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Secure Viewer Mode • Copying Disabled</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="hidden md:flex w-10 h-10 rounded-xl glass bg-white/5 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
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
                <div className="flex-1 relative bg-[#0a0a0a]">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0a0a0a]">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest animate-pulse">Initializing Secure View...</p>
                        </div>
                    )}
                    
                    {/* The PDF Embed */}
                    <iframe 
                        src={viewerUrl}
                        className="w-full h-full border-0 select-none"
                        onLoad={() => setIsLoading(false)}
                        title={title}
                        // Important: Sandbox can prevent some interactions but might break the viewer
                        // sandbox="allow-scripts allow-same-origin" 
                    />

                    {/* Security Overlay (Blocks right click on the iframe area in some scenarios) */}
                    <div 
                        className="absolute inset-0 pointer-events-none" 
                        onContextMenu={(e) => e.preventDefault()}
                    />
                </div>

                {/* Secure Footer Notification */}
                <div className="px-6 py-3 bg-red-500/5 text-center shrink-0">
                    <p className="text-[9px] font-black text-red-500/80 uppercase tracking-[0.3em]">
                        ⚠️ This document is protected by ISTE Anti-Piracy Policy. Unauthorized redistribution is strictly prohibited.
                    </p>
                </div>
            </div>
        </div>
    )
}

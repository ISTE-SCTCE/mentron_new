'use client'

import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'

// Set worker from CDN for maximum compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfCanvasViewerProps {
    url: string
    onLoadSuccess?: () => void
    onLoadError?: (error: Error) => void
}

export function PdfCanvasViewer({ url, onLoadSuccess, onLoadError }: PdfCanvasViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [pages, setPages] = useState<number[]>([])
    const [numPages, setNumPages] = useState(0)
    const [isRendering, setIsRendering] = useState(true)
    const pdfDocRef = useRef<any>(null)

    useEffect(() => {
        let isMounted = true

        const loadPdf = async () => {
            try {
                setIsRendering(true)
                const loadingTask = pdfjs.getDocument(url)
                const pdf = await loadingTask.promise
                
                if (!isMounted) return
                
                pdfDocRef.current = pdf
                setNumPages(pdf.numPages)
                setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1))
                onLoadSuccess?.()
                setIsRendering(false)
            } catch (error: any) {
                console.error('Error loading PDF:', error)
                onLoadError?.(error)
                setIsRendering(false)
            }
        }

        loadPdf()

        return () => {
            isMounted = false
            if (pdfDocRef.current) {
                pdfDocRef.current.destroy()
            }
        }
    }, [url, onLoadSuccess, onLoadError])

    return (
        <div 
            ref={containerRef}
            className="w-full h-full overflow-y-auto bg-[#0a0a0a] flex flex-col items-center gap-8 py-12 scroll-smooth selection:bg-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
            {pages.map((pageNumber) => (
                <PdfPage 
                    key={pageNumber} 
                    pdfDoc={pdfDocRef.current} 
                    pageNumber={pageNumber} 
                />
            ))}
            
            {isRendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-50">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest animate-pulse">
                        Rendering Secure Pages...
                    </p>
                </div>
            )}
        </div>
    )
}

interface PdfPageProps {
    pdfDoc: any
    pageNumber: number
}

function PdfPage({ pdfDoc, pageNumber }: PdfPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isRendered, setIsRendered] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Intersection Observer to only render when visible (performance)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        if (canvasRef.current) {
            observer.observe(canvasRef.current)
        }
        observerRef.current = observer

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible || !pdfDoc || isRendered) return

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(pageNumber)
                const canvas = canvasRef.current
                if (!canvas) return

                const context = canvas.getContext('2d')
                if (!context) return

                // Calculate scale based on container width
                const viewport = page.getViewport({ scale: 1.5 }) // Standard high-res scale
                const parentWidth = canvas.parentElement?.clientWidth || 800
                const scale = (parentWidth * 0.9) / viewport.width
                const scaledViewport = page.getViewport({ scale: Math.max(scale, 1.5) })

                canvas.height = scaledViewport.height
                canvas.width = scaledViewport.width

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport,
                }

                await page.render(renderContext).promise
                setIsRendered(true)
            } catch (error) {
                console.error(`Error rendering page ${pageNumber}:`, error)
            }
        }

        renderPage()
    }, [isVisible, pdfDoc, pageNumber, isRendered])

    return (
        <div className="relative group w-full flex flex-col items-center">
            {/* Page Number Label */}
            <div className="absolute -left-12 top-0 text-[10px] font-black text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                PAGE {pageNumber}
            </div>

            <div className="bg-[#111] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-white/5 transition-transform hover:scale-[1.01] duration-500">
                <canvas 
                    ref={canvasRef} 
                    className="max-w-full h-auto block select-none pointer-events-none"
                />
            </div>

            {!isRendered && (
                <div 
                    className="w-[90%] aspect-[1/1.4] bg-white/[0.02] animate-pulse rounded-sm border border-white/5 flex items-center justify-center"
                >
                   <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Loading Page {pageNumber}...</p>
                </div>
            )}
        </div>
    )
}

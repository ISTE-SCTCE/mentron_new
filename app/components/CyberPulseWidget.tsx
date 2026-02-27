'use client'

import { useEffect, useState } from 'react'

export function CyberPulseWidget() {
    const [lines, setLines] = useState<number[]>([])

    useEffect(() => {
        // Generate random heights for the visualizer
        const initial = Array.from({ length: 20 }, () => Math.random() * 100)
        setLines(initial)

        const interval = setInterval(() => {
            setLines(prev => prev.map(h => {
                const change = (Math.random() - 0.5) * 40
                return Math.max(10, Math.min(100, h + change))
            }))
        }, 150)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="glass-card group relative overflow-hidden flex flex-col items-center justify-center p-6 h-64 mt-4"
            style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,210,255,0.05) 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,210,255,0.05)'
            }}>

            {/* Background Scanner Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/50 blur-[2px] animate-[scan_4s_ease-in-out_infinite]" />

            <p className="text-[9px] font-black tracking-[0.4em] text-cyan-500 uppercase mb-6 text-center w-full relative z-10">
                Network Pulse
            </p>

            <div className="flex items-end justify-center w-full gap-1 h-32 relative z-10 mb-4">
                {lines.map((height, i) => (
                    <div key={i} className="w-1.5 rounded-t-sm transition-all duration-150 ease-out flex flex-col justify-end"
                        style={{ height: '100%' }}>
                        <div
                            className="w-full rounded-full transition-all duration-200"
                            style={{
                                height: `${height}%`,
                                background: `linear-gradient(to top, rgba(0,210,255,0.2), rgba(123,47,255,0.8))`,
                                boxShadow: height > 80 ? '0 0 10px rgba(0,210,255,0.5)' : 'none'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">SYSTEM NOMINAL</span>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(-10px); opacity: 0; }
                    50% { transform: translateY(250px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

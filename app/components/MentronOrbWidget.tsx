'use client'

import { useState, useRef } from 'react'

export function MentronOrbWidget() {
    const cardRef = useRef<HTMLDivElement>(null)
    const [rotation, setRotation] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        const card = cardRef.current
        const rect = card.getBoundingClientRect()

        // Calculate mouse position relative to the center of the card
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        // Max rotation angle
        const rotateX = (y / (rect.height / 2)) * -15
        const rotateY = (x / (rect.width / 2)) * 15

        setRotation({ x: rotateX, y: rotateY })
    }

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 })
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="glass-card group relative h-64 mt-4 overflow-hidden flex items-center justify-center cursor-crosshair perspective-[1000px] transition-transform duration-200 ease-out"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(123,47,255,0.05) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
            }}>

            <div className="absolute top-4 left-4 flex gap-1.5 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            </div>

            <p className="absolute bottom-4 left-0 right-0 text-center text-[9px] font-black tracking-[0.3em] text-purple-400/50 uppercase transition-opacity duration-500 group-hover:opacity-100">
                Mentron Core Alive
            </p>

            {/* Inner Container holding the 3D Orb */}
            <div
                className="relative w-32 h-32 flex items-center justify-center transition-transform duration-100 ease-linear preserve-3d"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: 'preserve-3d'
                }}>

                {/* Outer Ring 1 */}
                <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[spin_8s_linear_infinite]"
                    style={{ transform: 'rotateX(60deg) rotateY(15deg) translateZ(0)', transformStyle: 'preserve-3d' }} />

                {/* Outer Ring 2 */}
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[spin_12s_linear_infinite_reverse]"
                    style={{ transform: 'rotateX(20deg) rotateY(60deg) translateZ(0)', transformStyle: 'preserve-3d' }} />

                {/* The Core Orb */}
                <div className="w-16 h-16 rounded-full relative group-hover:scale-110 transition-transform duration-500"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #fff 0%, #00D4FF 20%, #7B2FFF 60%, #03000F 100%)',
                        boxShadow: '0 0 20px rgba(123,47,255,0.5), inset -5px -5px 20px rgba(0,0,0,0.8)',
                        transform: 'translateZ(20px)' // Pops out when tilted
                    }}>

                    {/* Inner pulse */}
                    <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-[2px] animate-ping" />
                </div>
            </div>

        </div>
    )
}

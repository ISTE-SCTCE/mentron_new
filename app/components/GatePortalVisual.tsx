'use client'

import { motion } from 'framer-motion'

export function GatePortalVisual() {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7000df]/30 via-transparent to-[#00c6ff]/30 blur-2xl rounded-full pointer-events-none" />
            
            <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full max-w-[420px] max-h-[420px] relative z-10 drop-shadow-[0_0_45px_rgba(112,0,223,0.4)]"
            >
                <defs>
                    {/* Gradients */}
                    <linearGradient id="gatePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00c6ff" />
                        <stop offset="50%" stopColor="#7000df" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>

                    <linearGradient id="gateArchGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#00c6ff" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="#7000df" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#030712" stopOpacity="0.1" />
                    </linearGradient>

                    <linearGradient id="gateCoreBeam" x1="50%" y1="100%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor="#00c6ff" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#7000df" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#7000df" stopOpacity="0" />
                    </linearGradient>

                    <radialGradient id="portalCoreGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00c6ff" stopOpacity="0.9" />
                        <stop offset="35%" stopColor="#7000df" stopOpacity="0.6" />
                        <stop offset="70%" stopColor="#7000df" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#7000df" stopOpacity="0" />
                    </radialGradient>

                    {/* SVG Filters */}
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    
                    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer Concentric Horizon Rings */}
                <circle
                    cx="250"
                    cy="250"
                    r="215"
                    stroke="#7000df"
                    strokeOpacity="0.2"
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                />
                
                <motion.circle
                    cx="250"
                    cy="250"
                    r="190"
                    stroke="url(#gatePrimaryGrad)"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeDasharray="16 12 4 12"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                />

                <motion.circle
                    cx="250"
                    cy="250"
                    r="165"
                    stroke="#00c6ff"
                    strokeOpacity="0.4"
                    strokeWidth="1.5"
                    strokeDasharray="8 6"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                />

                {/* Vertical Gateway Light Beam */}
                <polygon
                    points="220,440 280,440 265,110 235,110"
                    fill="url(#gateCoreBeam)"
                    opacity="0.6"
                />

                {/* Outer Portal Arch 1 */}
                <path
                    d="M 120 420 L 120 230 C 120 150, 175 90, 250 90 C 325 90, 380 150, 380 230 L 380 420"
                    stroke="url(#gatePrimaryGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#neonGlow)"
                />

                {/* Mid Portal Arch 2 */}
                <path
                    d="M 155 420 L 155 240 C 155 180, 195 130, 250 130 C 305 130, 345 180, 345 240 L 345 420"
                    stroke="#7000df"
                    strokeWidth="2.5"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                />

                {/* Inner Portal Arch 3 */}
                <path
                    d="M 185 420 L 185 250 C 185 205, 212 170, 250 170 C 288 170, 315 205, 315 250 L 315 420"
                    stroke="#00c6ff"
                    strokeWidth="2"
                    strokeOpacity="0.85"
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    filter="url(#softGlow)"
                />

                {/* Portal Floor Grid / Perspective Base */}
                <ellipse cx="250" cy="420" rx="140" ry="26" stroke="#7000df" strokeOpacity="0.4" strokeWidth="1.5" />
                <ellipse cx="250" cy="420" rx="90" ry="16" stroke="#00c6ff" strokeOpacity="0.5" strokeWidth="1" />
                <line x1="160" y1="420" x2="210" y2="390" stroke="#7000df" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="340" y1="420" x2="290" y2="390" stroke="#7000df" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="250" y1="446" x2="250" y2="390" stroke="#00c6ff" strokeOpacity="0.4" strokeWidth="1" />

                {/* Central Nexus Core / Portal Singularity */}
                <circle cx="250" cy="270" r="75" fill="url(#portalCoreGlow)" />
                <circle cx="250" cy="270" r="32" fill="#00c6ff" fillOpacity="0.25" filter="url(#softGlow)" />
                <circle cx="250" cy="270" r="12" fill="#ffffff" filter="url(#softGlow)" />

                {/* Knowledge Node Runes (Departments) */}
                {/* Node 1: ECE (Left Antenna / Signal Wave Node) */}
                <g transform="translate(110, 190)">
                    <circle cx="0" cy="0" r="18" fill="#030712" stroke="#00c6ff" strokeWidth="2" filter="url(#softGlow)" />
                    <circle cx="0" cy="0" r="6" fill="#00c6ff" />
                    <text x="0" y="28" fill="#00c6ff" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                        ECE
                    </text>
                    <path d="M 18 0 C 45 -10, 60 10, 75 50" stroke="#00c6ff" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" />
                </g>

                {/* Node 2: ME (Right Gear / Mech Node) */}
                <g transform="translate(390, 190)">
                    <circle cx="0" cy="0" r="18" fill="#030712" stroke="#f97316" strokeWidth="2" filter="url(#softGlow)" />
                    <circle cx="0" cy="0" r="6" fill="#f97316" />
                    <text x="0" y="28" fill="#f97316" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                        ME
                    </text>
                    <path d="M -18 0 C -45 -10, -60 10, -75 50" stroke="#f97316" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" />
                </g>

                {/* Node 3: Apex Knowledge Gateway Node (Top Center) */}
                <g transform="translate(250, 65)">
                    <polygon points="0,-14 12,0 0,14 -12,0" fill="#030712" stroke="#00c6ff" strokeWidth="2" filter="url(#softGlow)" />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
                    <text x="0" y="-20" fill="#ededed" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
                        GATE
                    </text>
                </g>

                {/* Circuit Traces & Floating Particles */}
                <circle cx="190" cy="150" r="2.5" fill="#00c6ff" opacity="0.8" />
                <circle cx="310" cy="150" r="2.5" fill="#7000df" opacity="0.8" />
                <circle cx="170" cy="330" r="2" fill="#00c6ff" opacity="0.7" />
                <circle cx="330" cy="330" r="2" fill="#7000df" opacity="0.7" />
                <circle cx="250" cy="140" r="3" fill="#ffffff" opacity="0.9" />

                {/* Gateway Doorway Threshold Lines */}
                <line x1="225" y1="270" x2="275" y2="270" stroke="#00c6ff" strokeWidth="1.5" strokeOpacity="0.8" />
                <line x1="235" y1="285" x2="265" y2="285" stroke="#7000df" strokeWidth="1.5" strokeOpacity="0.8" />
            </svg>
        </div>
    )
}

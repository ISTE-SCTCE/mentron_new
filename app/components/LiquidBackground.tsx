'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

export default function LiquidBackground() {
  const prefersReduced = useReducedMotion()

  // Normalized mouse coordinates between -0.5 and 0.5
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for smooth organic parallax lag without CPU lag
  const springConfig = { stiffness: 45, damping: 20, mass: 0.8 }

  // Parallax offsets: negative/positive directions for 3D depth illusion
  const gridX = useSpring(useMotionValue(0), springConfig)
  const gridY = useSpring(useMotionValue(0), springConfig)

  const blob1X = useSpring(useMotionValue(0), springConfig)
  const blob1Y = useSpring(useMotionValue(0), springConfig)

  const blob2X = useSpring(useMotionValue(0), springConfig)
  const blob2Y = useSpring(useMotionValue(0), springConfig)

  const blob3X = useSpring(useMotionValue(0), springConfig)
  const blob3Y = useSpring(useMotionValue(0), springConfig)

  useEffect(() => {
    // Only track mouse on devices with fine pointer precision and when reduced-motion is off
    if (prefersReduced) return
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const normX = e.clientX / innerWidth - 0.5
      const normY = e.clientY / innerHeight - 0.5

      // Subtle parallax pixel ranges: not disorienting, gentle depth
      gridX.set(normX * -8)
      gridY.set(normY * -8)

      blob1X.set(normX * 22)
      blob1Y.set(normY * 22)

      blob2X.set(normX * -26)
      blob2Y.set(normY * -26)

      blob3X.set(normX * 16)
      blob3Y.set(normY * -14)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [prefersReduced, gridX, gridY, blob1X, blob1Y, blob2X, blob2Y, blob3X, blob3Y])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[-1]"
    >
      {/* ── 1. Animated Ambient Mesh Gradient Wave ── */}
      <div className="mesh-gradient" />

      {/* ── 2. Subtle Tech Engineering Dot Grid ── */}
      <motion.div
        className="tech-grid"
        style={prefersReduced ? undefined : { x: gridX, y: gridY }}
      />

      {/* ── 3. Organic Morphing Cyan Blob (Top-Left) ── */}
      <motion.div
        className="liquid-blob liquid-blob-1 -top-[12%] -left-[12%]"
        style={prefersReduced ? undefined : { x: blob1X, y: blob1Y }}
      />

      {/* ── 4. Organic Morphing Electric Purple Blob (Bottom-Right) ── */}
      <motion.div
        className="liquid-blob liquid-blob-2 -bottom-[14%] -right-[14%]"
        style={prefersReduced ? undefined : { x: blob2X, y: blob2Y }}
      />

      {/* ── 5. Ambient Bridge Glow (Center-Right) ── */}
      <motion.div
        className="liquid-blob liquid-blob-3 top-[28%] right-[8%]"
        style={prefersReduced ? undefined : { x: blob3X, y: blob3Y }}
      />

      {/* ── 6. Anti-Banding Subtle Noise Texture ── */}
      <div className="noise-overlay" />
    </div>
  )
}

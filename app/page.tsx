'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, Rocket, Trophy, Users, ArrowRight, ShieldCheck,
  Zap, Sparkles, CheckCircle2, ChevronRight, GraduationCap
} from 'lucide-react'
import { WhatTheHackModal } from '@/app/components/WhatTheHackModal'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F8F6FF', position: 'relative', overflowX: 'hidden' }}
    >
      {/* What The Hack Event Popup Modal */}
      <WhatTheHackModal />

      {/* Liquid background blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '-15%',
          width: '65vw',
          height: '65vw',
          background: 'rgba(108,99,255,0.12)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'blobDrift 18s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '-15%',
          width: '55vw',
          height: '55vw',
          background: 'rgba(255,140,105,0.10)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'blobDrift 22s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Navbar Header */}
      <header
        className="relative z-10 w-full"
        style={{ padding: '24px 24px 12px', maxWidth: 1200, margin: '0 auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(108,99,255,0.25)',
              }}
            >
              <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 900, fontSize: 20 }}>M</span>
            </div>
            <div>
              <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 22, color: '#2D2845', letterSpacing: '-0.5px' }}>
                MENTRON
              </span>
              <span style={{ display: 'block', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: '#FF8C69', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                ISTE SCTCE
              </span>
            </div>
          </Link>

          {/* Action Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: 'transparent',
                  color: '#6C63FF',
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '8px 16px',
                  borderRadius: 50,
                  border: '1.5px solid rgba(108,99,255,0.2)',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </Link>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                style={{
                  padding: '9px 20px',
                  fontSize: 13,
                  width: 'auto',
                  borderRadius: 50,
                }}
              >
                Join Now
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          {/* Top Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: '#EEEEFF', borderRadius: 50, marginBottom: 20 }}>
            <Sparkles size={14} color="#6C63FF" />
            <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, color: '#6C63FF', letterSpacing: 1, textTransform: 'uppercase' }}>
              Official Academic Companion
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Poppins',
              fontWeight: 900,
              fontSize: 'clamp(32px, 6vw, 54px)',
              color: '#2D2845',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              margin: '0 0 18px',
            }}
          >
            Empowering SCTCE Students to <span className="gradient-text">Excel & Innovate</span>
          </h1>

          <p
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 16,
              color: '#8B85A8',
              lineHeight: 1.6,
              margin: '0 0 32px',
            }}
          >
            Access curated semester notes, previous year question papers, collaborate on club projects, and engage in national level hackathons.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                style={{
                  padding: '16px 32px',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 8px 24px rgba(108,99,255,0.3)',
                }}
              >
                <span>ENTER DASHBOARD</span>
                <ArrowRight size={20} />
              </button>
            </Link>

            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button
                className="btn-outlined"
                style={{
                  padding: '15px 28px',
                  fontSize: 15,
                }}
              >
                CREATE ACCOUNT
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="icon-container" style={{ background: '#EEEEFF', width: 48, height: 48 }}>
              <BookOpen size={24} color="#6C63FF" />
            </div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', margin: 0 }}>
              Curated Notes & PYQs
            </h3>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', lineHeight: 1.6, margin: 0 }}>
              Organized by semester (S1 to S8) and department (CSE, ECE, ME, MEA, BT) for quick access before exams.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="icon-container" style={{ background: '#FFF3EE', width: 48, height: 48 }}>
              <Rocket size={24} color="#FF8C69" />
            </div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', margin: 0 }}>
              Club & Student Projects
            </h3>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', lineHeight: 1.6, margin: 0 }}>
              Apply for technical projects, build hands-on skills, and earn XP badges recognized by ISTE SCTCE mentors.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="icon-container" style={{ background: '#EEFAF9', width: 48, height: 48 }}>
              <Trophy size={24} color="#4ECDC4" />
            </div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', margin: 0 }}>
              Hackathons & Events
            </h3>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', lineHeight: 1.6, margin: 0 }}>
              Direct registrations for workshops, idea presentation forums, and flagship hackathons like What The Hack.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
            borderRadius: 28,
            padding: '24px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 20,
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(108,99,255,0.2)',
          }}
        >
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: 'white', margin: 0 }}>1,200+</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>SCTCE Members</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: 'white', margin: 0 }}>500+</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Curated Materials</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: 'white', margin: 0 }}>50+</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Active Projects</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: 'white', margin: 0 }}>SCTCE</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>ISTE Chapter</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(108,99,255,0.08)',
          padding: '24px 24px 40px',
          textAlign: 'center',
          background: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>
            MENTRON by ISTE SCTCE
          </p>
          <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0 }}>
            Indian Society for Technical Education — Student Chapter SCTCE
          </p>
        </div>
      </footer>
    </div>
  )
}
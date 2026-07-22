'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Trophy, Calendar, MapPin, ArrowRight, ShieldAlert } from 'lucide-react'

import { OFFENSO_EMAILS } from '@/app/lib/data/offensoParticipants'

// Whitelist of email addresses authorized to see the "What The Hack" event popup
const ALLOWED_EMAILS: string[] = [
  ...OFFENSO_EMAILS,
  // Add any additional emails here if needed
]


interface Props {
  userEmail?: string | null
}

export function WhatTheHackModal({ userEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if dismissed previously in session
    const dismissed = sessionStorage.getItem('what_the_hack_dismissed')
    if (dismissed) return

    // Email authorization check
    if (userEmail) {
      const emailLower = userEmail.toLowerCase().trim()
      const isAllowed = ALLOWED_EMAILS.includes('*') || ALLOWED_EMAILS.some(e => e.toLowerCase() === emailLower)
      if (isAllowed) {
        setIsOpen(true)
      }
    } else if (ALLOWED_EMAILS.includes('*')) {
      setIsOpen(true)
    }
  }, [userEmail])

  const handleClose = () => {
    sessionStorage.setItem('what_the_hack_dismissed', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(45,40,69,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        className="glass"
        style={{
          position: 'relative',
          maxWidth: 420,
          width: '100%',
          padding: 28,
          background: '#FFFFFF',
          borderRadius: 32,
          boxShadow: '0 20px 50px rgba(108,99,255,0.25)',
          border: '1.5px solid rgba(108,99,255,0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Decorative Top Banner */}
        <div
          style={{
            height: 120,
            margin: '-28px -28px 20px -28px',
            background: 'linear-gradient(135deg, #6C63FF 0%, #FF8C69 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={16} />
              <span
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 900,
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                ISTE SCTCE PRESENTS
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'Poppins',
                fontWeight: 900,
                fontSize: 26,
                letterSpacing: '-0.5px',
                color: 'white',
                margin: 0,
              }}
            >
              WHAT THE HACK?
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div>
          <p
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 13,
              color: '#8B85A8',
              lineHeight: 1.6,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            The ultimate 24-hour national level hackathon is back! Unleash your engineering potential, build revolutionary projects, and win exciting cash prizes.
          </p>

          {/* Details Pill Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#EEEEFF',
                borderRadius: 16,
              }}
            >
              <Trophy size={20} color="#6C63FF" />
              <div>
                <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#8B85A8', margin: 0 }}>PRIZE POOL</p>
                <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, color: '#2D2845', margin: 0 }}>₹50,000+ & Exclusive Goodies</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px',
                  background: '#FFF3EE',
                  borderRadius: 16,
                }}
              >
                <Calendar size={18} color="#FF8C69" />
                <div>
                  <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: '#8B85A8', margin: 0 }}>DATE</p>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 12, color: '#2D2845', margin: 0 }}>Coming Soon</p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px',
                  background: '#EEFAF9',
                  borderRadius: 16,
                }}
              >
                <MapPin size={18} color="#4ECDC4" />
                <div>
                  <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: '#8B85A8', margin: 0 }}>VENUE</p>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 12, color: '#2D2845', margin: 0 }}>SCTCE Campus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/events" onClick={handleClose} style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                }}
              >
                <span>REGISTER NOW</span>
                <ArrowRight size={18} />
              </button>
            </a>

            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 12,
                color: '#8B85A8',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

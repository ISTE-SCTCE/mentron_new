'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { AtSign, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F8F6FF', overflow: 'hidden', position: 'relative' }}
    >
      {/* Liquid background blobs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-15%', width: '65vw', height: '65vw',
        background: 'rgba(108,99,255,0.12)', borderRadius: '50%', filter: 'blur(80px)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'blobDrift 18s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-15%', width: '55vw', height: '55vw',
        background: 'rgba(255,140,105,0.10)', borderRadius: '50%', filter: 'blur(80px)',
        zIndex: 0, pointerEvents: 'none',
        animation: 'blobDrift 22s ease-in-out infinite alternate-reverse',
      }} />

      {/* ISTE Logo — top right */}
      <div
        style={{
          position: 'absolute', top: 48, right: 20, zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 900, fontSize: 14 }}>
            ISTE
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center flex-1"
        style={{ padding: '0 24px', maxWidth: 430, margin: '0 auto', width: '100%' }}
      >
        {/* Mentron Logo */}
        <div
          style={{
            marginBottom: 8,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 20px',
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(108,99,255,0.12)',
              border: '1px solid rgba(108,99,255,0.08)',
            }}
          >
            <div
              style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 900, fontSize: 20 }}>M</span>
            </div>
            <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 22, color: '#2D2845', letterSpacing: '-0.5px' }}>
              MENTRON
            </span>
          </div>
        </div>

        <p
          style={{
            fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#8B85A8',
            marginBottom: 40, textAlign: 'center',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease 0.5s',
          }}
        >
          Your Academic Companion
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              width: '100%', marginBottom: 16, padding: '12px 16px',
              background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: 16, color: '#FF6B6B',
              fontFamily: 'Inter', fontWeight: 600, fontSize: 13, textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Glass card */}
        <div
          className="glass"
          style={{
            padding: 32, width: '100%',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins', fontWeight: 700, fontSize: 13,
              letterSpacing: 4, color: '#FF8C69', textAlign: 'center', marginBottom: 28,
            }}
          >
            SIGN IN
          </p>

          <form
            action={login}
            onSubmit={() => setIsPending(true)}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Email field */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#8B85A8', display: 'flex', alignItems: 'center',
              }}>
                <AtSign size={18} />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                disabled={isPending}
                className="flutter-input"
                style={{ paddingLeft: 44 }}
              />
            </div>

            {/* Password field */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#8B85A8', display: 'flex', alignItems: 'center',
              }}>
                <Lock size={18} />
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                disabled={isPending}
                className="flutter-input"
                style={{ paddingLeft: 44, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#8B85A8',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 11,
                  color: 'rgba(255,140,105,0.75)', textDecoration: 'none',
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="shimmer-btn"
              style={{
                color: 'white', fontFamily: 'Poppins', fontWeight: 700, fontSize: 15,
                padding: '16px', borderRadius: 50, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: 0.5,
                opacity: isPending ? 0.7 : 1,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                'ENTER SYSTEM'
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <button
          onClick={() => window.location.href = '/signup'}
          style={{
            marginTop: 28, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 12, color: '#FF8C69', fontWeight: 600,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease 0.7s',
          }}
        >
          New here? Create Account →
        </button>
      </div>
    </div>
  )
}

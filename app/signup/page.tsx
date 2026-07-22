'use client'

import { signup } from './actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  User, Badge, AtSign, Lock, CreditCard,
  GraduationCap, Building2, Eye, EyeOff, Loader2, ArrowLeft,
} from 'lucide-react'

const YEARS = [
  { value: new Date().getFullYear().toString(), label: new Date().getFullYear().toString() },
  { value: (new Date().getFullYear() - 1).toString(), label: (new Date().getFullYear() - 1).toString() },
  { value: (new Date().getFullYear() - 2).toString(), label: (new Date().getFullYear() - 2).toString() },
  { value: (new Date().getFullYear() - 3).toString(), label: (new Date().getFullYear() - 3).toString() },
]

const DEPTS = [
  { value: 'CSE', label: 'CSE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'ME',  label: 'Mechanical' },
  { value: 'MEA', label: 'Automobile' },
  { value: 'BT',  label: 'Biotechnology' },
]

const COLLEGES = [
  { value: 'sctce', label: 'SCTCE (SCT College of Eng)' },
  { value: 'lbsitw', label: 'LBSITW (LBS Institute of Tech)' },
  { value: 'psg', label: 'PSG Tech' },
  { value: 'gec barton hill', label: 'GEC Barton Hill' },
  { value: 'cet', label: 'CET (College of Eng Trivandrum)' },
  { value: 'other', label: 'Other College' },
]


function FieldLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2,
      color: '#FF8C69', marginBottom: 8, paddingLeft: 4,
    }}>
      {text}
    </p>
  )
}

function TextField({
  name, placeholder, icon: Icon, type = 'text', required = true,
  disabled = false, extra,
}: {
  name: string
  placeholder: string
  icon: React.ComponentType<any>
  type?: string
  required?: boolean
  disabled?: boolean
  extra?: React.ReactNode
}) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: '#8B85A8', display: 'flex', alignItems: 'center', zIndex: 1,
      }}>
        <Icon size={18} />
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flutter-input"
        style={{ paddingLeft: 44, paddingRight: extra ? 44 : 16 }}
      />
      {extra && (
        <div style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        }}>
          {extra}
        </div>
      )}
    </div>
  )
}

export default function SignupPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F8F6FF', position: 'relative', overflow: 'hidden' }}
    >
      {/* Liquid blobs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-15%', width: '60vw', height: '60vw',
        background: 'rgba(108,99,255,0.10)', borderRadius: '50%', filter: 'blur(80px)',
        zIndex: 0, pointerEvents: 'none', animation: 'blobDrift 18s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-15%', width: '50vw', height: '50vw',
        background: 'rgba(255,140,105,0.08)', borderRadius: '50%', filter: 'blur(80px)',
        zIndex: 0, pointerEvents: 'none', animation: 'blobDrift 22s ease-in-out infinite alternate-reverse',
      }} />

      <div
        className="relative z-10"
        style={{ maxWidth: 430, margin: '0 auto', padding: '0 24px' }}
      >
        {/* Back button */}
        <div style={{ paddingTop: 48, paddingBottom: 8 }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#2D2845', fontFamily: 'Inter', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* Headline */}
        <div
          style={{
            marginBottom: 32, textAlign: 'center',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.4s ease 0.1s',
          }}
        >
          <p style={{
            fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 3,
            color: '#FF8C69', textTransform: 'uppercase', marginBottom: 8,
          }}>
            STEP INTO LEARNING
          </p>
          <h1 style={{
            fontFamily: 'Poppins', fontWeight: 900, fontSize: 34,
            color: '#2D2845', letterSpacing: '-0.5px', margin: 0,
          }}>
            Join Mentron
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '12px 16px',
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: 16, color: '#FF6B6B',
            fontFamily: 'Inter', fontWeight: 600, fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Form card */}
        <div
          className="glass"
          style={{
            padding: 28, marginBottom: 40,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
          }}
        >
          <form
            action={signup}
            onSubmit={() => setIsPending(true)}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <FieldLabel text="FULL NAME" />
              <TextField name="full_name" placeholder="e.g. Rahul Sharma" icon={User} disabled={isPending} />
            </div>

            <div>
              <FieldLabel text="ROLL NUMBER" />
              <TextField name="roll_number" placeholder="e.g. 22CS001" icon={Badge} disabled={isPending} />
            </div>

            <div>
              <FieldLabel text="EMAIL ADDRESS" />
              <TextField name="email" placeholder="your@email.com" icon={AtSign} type="email" disabled={isPending} />
            </div>

            <div>
              <FieldLabel text="PASSWORD" />
              <TextField
                name="password"
                placeholder="Create a strong password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                disabled={isPending}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B85A8', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            <div>
              <FieldLabel text="ISTE ID (OPTIONAL)" />
              <TextField name="iste_id" placeholder="For PYQ & Video access" icon={CreditCard} required={false} disabled={isPending} />
            </div>

            <div>
              <FieldLabel text="COLLEGE" />

              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#8B85A8', display: 'flex', alignItems: 'center', zIndex: 1,
                }}>
                  <Building2 size={16} />
                </div>
                <select
                  name="college"
                  defaultValue="sctce"
                  required
                  disabled={isPending}
                  style={{
                    background: '#FBF9FF', border: '1px solid rgba(108,99,255,0.12)',
                    borderRadius: 16, color: '#2D2845', fontFamily: 'Inter', fontWeight: 600,
                    fontSize: 13, padding: '14px 12px 14px 36px', width: '100%',
                    outline: 'none', appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {COLLEGES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Year + Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel text="ADMISSION YEAR" />
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: '#8B85A8', display: 'flex', alignItems: 'center', zIndex: 1,
                  }}>
                    <GraduationCap size={16} />
                  </div>
                  <select
                    name="year"
                    required
                    disabled={isPending}
                    style={{
                      background: '#FBF9FF', border: '1px solid rgba(108,99,255,0.12)',
                      borderRadius: 16, color: '#2D2845', fontFamily: 'Inter', fontWeight: 600,
                      fontSize: 13, padding: '14px 12px 14px 36px', width: '100%',
                      outline: 'none', appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>Year</option>
                    {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel text="DEPARTMENT" />
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: '#8B85A8', display: 'flex', alignItems: 'center', zIndex: 1,
                  }}>
                    <Building2 size={16} />
                  </div>
                  <select
                    name="department"
                    required
                    disabled={isPending}
                    style={{
                      background: '#FBF9FF', border: '1px solid rgba(108,99,255,0.12)',
                      borderRadius: 16, color: '#2D2845', fontFamily: 'Inter', fontWeight: 600,
                      fontSize: 13, padding: '14px 12px 14px 36px', width: '100%',
                      outline: 'none', appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>Dept</option>
                    {DEPTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
            </div>


            {/* Submit */}
            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? (
                  <><Loader2 size={20} className="animate-spin" /><span>Creating…</span></>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </div>

            {/* Login link */}
            <Link
              href="/login"
              style={{
                textAlign: 'center', fontFamily: 'Inter', fontSize: 12,
                color: '#FF8C69', fontWeight: 600, textDecoration: 'none', marginTop: 4,
              }}
            >
              Already in the tribe? Login Now
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}

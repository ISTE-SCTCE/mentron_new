'use client'

import { useState } from 'react'
import { logout } from '@/app/login/actions'
import {
  User, BookOpen, IdCard, Building2, GraduationCap,
  CreditCard, Zap, Mail, Shield, ChevronRight, Edit3, LogOut,
  Bell, HelpCircle, FileText, Lock,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  core: 'Core Member', exec: 'Execom Member', admin: 'Admin', member: 'ISTE Member',
}

const ROLE_COLORS: Record<string, string> = {
  core: '#6C63FF', exec: '#FF8C69', admin: '#4ECDC4', member: '#8B85A8',
}

interface Props {
  displayName: string
  displayRole: string
  displayDept: string
  displayRoll: string
  displayYear: string | number
  userXP: number
  isteId: string | null
  userEmail: string
  profile: any
}

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: Edit3, color: '#6C63FF', bg: '#EEEEFF' },
      { label: 'Change Password', icon: Lock, color: '#FF8C69', bg: '#FFF3EE' },
      { label: 'Notifications', icon: Bell, color: '#4ECDC4', bg: '#EEFAF9' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Study Notes', icon: FileText, color: '#6C63FF', bg: '#EEEEFF', href: '/notes' },
      { label: 'Projects', icon: BookOpen, color: '#FF8C69', bg: '#FFF3EE', href: '/projects' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help & FAQ', icon: HelpCircle, color: '#4ECDC4', bg: '#EEFAF9' },
      { label: 'Privacy Policy', icon: Shield, color: '#8B85A8', bg: '#F5F5FF' },
    ],
  },
]

export function SettingsPageClient({
  displayName, displayRole, displayDept, displayRoll,
  displayYear, userXP, isteId, userEmail, profile,
}: Props) {
  const firstName = displayName.split(' ')[0]
  const roleColor = ROLE_COLORS[displayRole] || '#8B85A8'
  const roleLabel = ROLE_LABELS[displayRole] || 'ISTE Member'

  const [isteIdVal, setIsteIdVal] = useState(isteId || '')
  const [isEditingIste, setIsEditingIste] = useState(!isteId)
  const [isSavingIste, setIsSavingIste] = useState(false)
  const [isteMsg, setIsteMsg] = useState('')

  const displayCollege = (profile?.college || 'sctce').toUpperCase()


  const handleIsteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingIste(true)
    setIsteMsg('')
    const formData = new FormData()
    formData.append('iste_id', isteIdVal)
    const { updateIsteId } = await import('./actions')
    const res = await updateIsteId(formData)
    setIsSavingIste(false)
    if (res?.error) {
      setIsteMsg('Failed to update ISTE ID: ' + res.error)
    } else {
      setIsteMsg('ISTE ID updated successfully!')
      setIsEditingIste(false)
    }
  }

  const INFO_ROWS = [
    { label: 'College', value: displayCollege, icon: Building2, color: '#4ECDC4', bg: '#EEFAF9' },
    { label: 'Roll Number', value: displayRoll, icon: IdCard, color: '#6C63FF', bg: '#EEEEFF' },
    { label: 'Department', value: displayDept, icon: Building2, color: '#FF8C69', bg: '#FFF3EE' },
    { label: 'Year', value: String(displayYear), icon: GraduationCap, color: '#4ECDC4', bg: '#EEFAF9' },
    { label: 'Email', value: userEmail, icon: Mail, color: '#74B9FF', bg: '#F0F8FF' },
  ]



  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      {/* Profile hero card */}
      <div
        style={{
          background: 'linear-gradient(160deg, #8B7FFF 0%, #6C63FF 100%)',
          padding: '60px 20px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 34, color: 'white' }}>
              {firstName[0]?.toUpperCase() || 'S'}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 22, color: 'white', margin: 0 }}>
              {displayName}
            </h1>
            <span style={{
              background: 'rgba(255,255,255,0.2)', color: 'white',
              fontFamily: 'Inter', fontWeight: 700, fontSize: 11,
              padding: '4px 12px', borderRadius: 50, display: 'inline-block', marginTop: 6,
            }}>
              {roleLabel}
            </span>
          </div>
          {/* XP chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', borderRadius: 50, padding: '8px 16px',
          }}>
            <Zap size={14} color="white" />
            <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, color: 'white' }}>
              {userXP.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div
        style={{
          margin: '-32px 20px 0',
          background: 'white',
          borderRadius: 24,
          padding: '20px',
          boxShadow: '0 8px 24px rgba(108,99,255,0.10)',
          border: '1px solid rgba(108,99,255,0.08)',
          position: 'relative', zIndex: 2,
          marginBottom: 20,
        }}
      >
        {INFO_ROWS.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(108,99,255,0.06)' }}
          >
            <div className="icon-container" style={{ background: bg, width: 38, height: 38, flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#8B85A8', margin: 0 }}>{label}</p>
              <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value || '—'}
              </p>
            </div>
          </div>
        ))}

        {/* ISTE ID Row with Edit Option */}
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon-container" style={{ background: '#FFF0F5', width: 38, height: 38, flexShrink: 0 }}>
              <CreditCard size={18} color="#FF6B9D" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#8B85A8', margin: 0 }}>ISTE ID</p>
              {!isEditingIste && isteIdVal ? (
                <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0 }}>
                  {isteIdVal}
                </p>
              ) : (
                <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#FF8C69', margin: 0 }}>
                  {isteIdVal ? 'Update your ISTE ID' : 'Not set yet — add your ISTE ID for PYQ & Video access'}
                </p>
              )}
            </div>
            {!isEditingIste && isteIdVal && (
              <button
                type="button"
                onClick={() => setIsEditingIste(true)}
                style={{
                  background: 'none', border: 'none', color: '#6C63FF',
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>

          {isEditingIste && (
            <form onSubmit={handleIsteSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={isteIdVal}
                onChange={e => setIsteIdVal(e.target.value)}
                placeholder="Enter your ISTE ID"
                className="flutter-input"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                required
              />
              <button
                type="submit"
                disabled={isSavingIste}
                style={{
                  background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
                  color: 'white', border: 'none', borderRadius: 16,
                  padding: '0 16px', fontFamily: 'Poppins', fontWeight: 700,
                  fontSize: 12, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {isSavingIste ? 'Saving…' : 'Save'}
              </button>
            </form>
          )}

          {isteMsg && (
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: isteMsg.includes('Failed') ? '#FF6B6B' : '#4ECDC4', marginTop: 6, paddingLeft: 52 }}>
              {isteMsg}
            </p>
          )}
        </div>
      </div>


      {/* Settings sections */}
      {SECTIONS.map(section => (
        <div key={section.title} style={{ padding: '0 20px', marginBottom: 20 }}>
          <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 12, color: '#8B85A8', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>
            {section.title.toUpperCase()}
          </p>
          <div
            style={{
              background: 'white', borderRadius: 24,
              border: '1px solid rgba(108,99,255,0.08)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(108,99,255,0.06)',
            }}
          >
            {section.items.map(({ label, icon: Icon, color, bg, href }: any, i) => (
              <a
                key={label}
                href={href || '#'}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderBottom: i < section.items.length - 1 ? '1px solid rgba(108,99,255,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div className="icon-container" style={{ background: bg, width: 38, height: 38, flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <p style={{ flex: 1, fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#2D2845', margin: 0 }}>
                    {label}
                  </p>
                  <ChevronRight size={16} color="#8B85A8" />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Logout button */}
      <div style={{ padding: '0 20px' }}>
        <form action={logout}>
          <button
            type="submit"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px', borderRadius: 50, border: '1.5px solid rgba(255,107,107,0.2)',
              background: 'rgba(255,107,107,0.05)', color: '#FF6B6B', cursor: 'pointer',
              fontFamily: 'Poppins', fontWeight: 700, fontSize: 14,
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 11, color: '#B8B4D0', margin: '16px 0 0' }}>
        Mentron by ISTE SCTCE · v2.0
      </p>
    </div>
  )
}

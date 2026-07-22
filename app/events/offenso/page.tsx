import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert, Lock, Zap, Calendar, MapPin, Trophy, Users,
  CheckCircle2, ArrowRight, ExternalLink, Sparkles, BookOpen
} from 'lucide-react'
import { isOffensoParticipant, OFFENSO_PARTICIPANTS } from '@/app/lib/data/offensoParticipants'

export const dynamic = 'force-dynamic'

export default async function OffensoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=Please login to access the Offenso Event page')
  }

  // Also query Supabase `offenso_participants` table if available
  const { data: dbParticipant } = await supabase
    .from('offenso_participants')
    .select('*')
    .eq('email', user.email?.toLowerCase().trim())
    .maybeSingle()

  const hasDbAccess = !!dbParticipant
  const hasLocalAccess = isOffensoParticipant(user.email)
  const isAuthorized = hasDbAccess || hasLocalAccess

  // If user is not authorized
  if (!isAuthorized) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#F8F6FF', paddingTop: 60, paddingBottom: 104 }}
      >
        <div
          className="glass"
          style={{
            maxWidth: 440,
            width: '100%',
            padding: 36,
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 32,
            boxShadow: '0 12px 36px rgba(108,99,255,0.12)',
            border: '1.5px solid rgba(255,107,107,0.2)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(255,107,107,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Lock size={32} color="#FF6B6B" />
          </div>

          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: 2.5,
              color: '#FF6B6B',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            EXCLUSIVE EVENT GATEWAY
          </span>

          <h1
            style={{
              fontFamily: 'Poppins',
              fontWeight: 900,
              fontSize: 26,
              color: '#2D2845',
              margin: '0 0 12px',
              letterSpacing: '-0.5px',
            }}
          >
            Offenso Access Restricted
          </h1>

          <p
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 13,
              color: '#8B85A8',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            Sorry, <strong style={{ color: '#2D2845' }}>{user.email}</strong> is not registered in the official Offenso participant roster. This portal is strictly reserved for confirmed event attendees.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%' }}>
                Return to Dashboard
              </button>
            </Link>

            <Link href="/events" style={{ textDecoration: 'none' }}>
              <button className="btn-outlined" style={{ width: '100%' }}>
                View All Public Events
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Find participant info
  const participantInfo = OFFENSO_PARTICIPANTS.find(
    p => p.email.toLowerCase() === user.email?.toLowerCase().trim()
  ) || dbParticipant

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F8F6FF', paddingBottom: 104 }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #FF8C69 100%)',
          padding: '60px 24px 80px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 50, marginBottom: 16 }}>
            <Sparkles size={14} color="white" />
            <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
              CONFIRMED PARTICIPANT PORTAL
            </span>
          </div>

          <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 42px)', margin: 0, lineHeight: 1.15 }}>
            Welcome to OFFENSO
          </h1>

          <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 15, opacity: 0.9, marginTop: 8 }}>
            Hello, {participantInfo?.name || user.email}! You are authorized to access the event materials, rules, and live leaderboard.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 800, margin: '-40px auto 0', padding: '0 24px', width: '100%', position: 'relative', zIndex: 20 }}>
        {/* Participant Status Card */}
        <div
          className="glass-card"
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 10px 30px rgba(108,99,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#FF8C69', letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                REGISTRATION VERIFIED
              </p>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', margin: '4px 0 0' }}>
                {participantInfo?.name || 'Registered Member'}
              </p>
              <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '2px 0 0' }}>
                {user.email}
              </p>
            </div>

            <span
              style={{
                background: '#EEFAF9',
                color: '#4ECDC4',
                fontFamily: 'Inter',
                fontWeight: 800,
                fontSize: 11,
                padding: '6px 14px',
                borderRadius: 50,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} /> ACTIVE ACCESS
            </span>
          </div>
        </div>

        {/* Schedule & Event Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="icon-container" style={{ background: '#EEEEFF', marginBottom: 12 }}>
              <Trophy size={20} color="#6C63FF" />
            </div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: '0 0 6px' }}>
              Prizes & Rewards
            </h3>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0, lineHeight: 1.5 }}>
              Compete for top positions, cash rewards, and official certificates issued by ISTE SCTCE.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div className="icon-container" style={{ background: '#FFF3EE', marginBottom: 12 }}>
              <Calendar size={20} color="#FF8C69" />
            </div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: '0 0 6px' }}>
              Event Timeline
            </h3>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0, lineHeight: 1.5 }}>
              Check-in begins at 9:00 AM. Keynote address and problem statement release follow immediately.
            </p>
          </div>
        </div>

        {/* Total Roster Count Banner */}
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #EEEEFF, #EEFAF9)',
            borderRadius: 24,
            padding: 24,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 24, color: '#2D2845', margin: 0 }}>
            {OFFENSO_PARTICIPANTS.length} Confirmed Attendees
          </p>
          <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: '#6C63FF', marginTop: 4 }}>
            Official Roster Verified by ISTE SCTCE
          </p>
        </div>
      </div>
    </div>
  )
}

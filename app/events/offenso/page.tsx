import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, ShieldAlert } from 'lucide-react'
import { isOffensoParticipant } from '@/app/lib/data/offensoParticipants'
import { OffensoClient, Folder } from './OffensoClient'

export const dynamic = 'force-dynamic'

export default async function OffensoPage() {
  const supabase = await createClient()

  // 1. Fetch current logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=Please login to access the Offenso Academy portal')
  }

  // 2. Query offenso_participants table
  const { data: dbParticipant } = await supabase
    .from('offenso_participants')
    .select('*')
    .eq('email', user.email?.toLowerCase().trim())
    .maybeSingle()

  // 3. Query profile role
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = userProfile?.role || 'member'
  const userIsExec = userRole === 'exec' || userRole === 'core' || userRole === 'admin'

  const hasDbAccess = !!dbParticipant
  const hasLocalAccess = isOffensoParticipant(user.email)
  const isAuthorized = hasDbAccess || hasLocalAccess || userIsExec

  // If user is not authorized, return access restricted screen
  if (!isAuthorized) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#0A0E27', paddingTop: 60, paddingBottom: 104, color: '#F0F0F0' }}
      >
        {/* Cyberpunk Scanline */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            zIndex: 999,
            opacity: 0.6,
          }}
        />

        <div
          style={{
            maxWidth: 440,
            width: '100%',
            padding: 36,
            textAlign: 'center',
            background: '#0F1535',
            borderRadius: 32,
            boxShadow: '0 12px 36px rgba(255, 0, 127, 0.15)',
            border: '1.5px solid rgba(255, 0, 127, 0.3)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(255, 0, 127, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid #FF007F',
            }}
          >
            <Lock size={32} color="#FF007F" />
          </div>

          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: 2.5,
              color: '#FF007F',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            RESTRICTED ENTRY
          </span>

          <h1
            style={{
              fontFamily: 'Poppins',
              fontWeight: 900,
              fontSize: 24,
              color: '#FFFFFF',
              margin: '0 0 12px',
              letterSpacing: '-0.5px',
            }}
          >
            Access Denied
          </h1>

          <p
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 13,
              color: '#A0A0A0',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            Agent <strong style={{ color: '#00FF41' }}>{user.email}</strong> is not present in the verified Offenso Roster. Access to this dynamic hacking archive is restricted.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00FF41, #00F0FF)',
                  color: '#0A0E27',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                RETURN TO DASHBOARD
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Fetch user's profile details to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const isExec = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'

  // 4. Fetch dynamic academy folders joined with academy_lectures
  const { data: dbFolders } = await supabase
    .from('academy_folders')
    .select('*, academy_lectures(*)')
    .order('created_at', { ascending: false })

  const folders: Folder[] = (dbFolders || []).map((f: any) => {
    // Sort lectures by creation date descending
    const sortedLectures = (f.academy_lectures || []).sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return {
      ...f,
      academy_lectures: sortedLectures,
    }
  })

  return (
    <OffensoClient
      initialFolders={folders}
      isExec={isExec}
      userEmail={user.email || ''}
      userName={profile?.full_name || 'Hacker'}
    />
  )
}

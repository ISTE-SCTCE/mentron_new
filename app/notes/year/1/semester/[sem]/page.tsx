import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FIRST_YEAR_GROUPS, GroupKey, DEPT_TO_GROUP, DeptKey } from '@/app/lib/data/subjects'

const GROUP_COLORS: Record<GroupKey, { color: string; border: string; accent: string }> = {
  A: { color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  B: { color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  C: { color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  D: { color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
}

const VALID_SEMS = ['S1', 'S2']

export default async function GroupPickerPage({
  params,
}: {
  params: Promise<{ sem: string }>
}) {
  const { sem } = await params
  if (!VALID_SEMS.includes(sem)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, role')
    .eq('id', user?.id)
    .single()

  const userDept = profile?.department?.toUpperCase() as DeptKey | undefined
  const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
  const assignedGroup = userDept ? DEPT_TO_GROUP[userDept] : null

  const allGroups = Object.entries(FIRST_YEAR_GROUPS) as [GroupKey, typeof FIRST_YEAR_GROUPS[GroupKey]][]
  const groups = allGroups.filter(([key]) => {
    if (isPrivileged || !assignedGroup) return true
    return key === assignedGroup
  })

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/notes" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href="/notes/year/1" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>1st Year</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <span style={{ color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: 0.5 }}>{sem}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
            1ST YEAR · {sem}
          </p>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
            Select Your Group
          </h1>
          <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>
            Choose the stream group that matches your department
          </p>
        </div>

        {/* Group Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {groups.map(([key, group]) => {
            const style = GROUP_COLORS[key]
            return (
              <Link key={key} href={`/notes/year/1/group/${key}/${sem}`} style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 24,
                    background: '#FFFFFF',
                    border: `1.5px solid ${style.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 180,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div
                      className="icon-container"
                      style={{
                        background: style.color,
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        fontSize: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {group.emoji}
                    </div>
                    <span style={{
                      background: style.color, color: style.accent,
                      fontFamily: 'Poppins', fontWeight: 900, fontSize: 11,
                      padding: '4px 12px', borderRadius: 50,
                    }}>
                      Group {key}
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#2D2845', margin: '0 0 4px' }}>
                    {group.label}
                  </h2>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 12, color: style.accent, margin: '0 0 6px' }}>
                    {group.streams}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0 }}>
                    Click to view subjects for {sem}
                  </p>

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: style.accent, fontFamily: 'Poppins', fontWeight: 900, fontSize: 11, letterSpacing: 0.5, marginTop: 12 }}>
                    <span>VIEW SUBJECTS</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

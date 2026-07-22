import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEPARTMENTS, DeptKey, DEPT_TO_GROUP } from '@/app/lib/data/subjects'

const YEAR_META: Record<number, { label: string; emoji: string; color: string; border: string; accent: string }> = {
  1: { label: '1st Year', emoji: '🌱', color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  2: { label: '2nd Year', emoji: '📘', color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  3: { label: '3rd Year', emoji: '🔬', color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  4: { label: '4th Year', emoji: '🎓', color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
}

const SEMS: Record<number, { sem: string; label: string }[]> = {
  1: [{ sem: 'S1', label: 'Semester 1' }, { sem: 'S2', label: 'Semester 2' }],
  2: [{ sem: 'S3', label: 'Semester 3' }, { sem: 'S4', label: 'Semester 4' }],
  3: [{ sem: 'S5', label: 'Semester 5' }, { sem: 'S6', label: 'Semester 6' }],
  4: [{ sem: 'S7', label: 'Semester 7' }, { sem: 'S8', label: 'Semester 8' }],
}

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>
}) {
  const { year } = await params
  const yearNum = parseInt(year)
  if (![1, 2, 3, 4].includes(yearNum)) notFound()

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

  const meta = YEAR_META[yearNum]
  const sems = SEMS[yearNum]
  const deptList = (Object.entries(DEPARTMENTS) as [DeptKey, typeof DEPARTMENTS[DeptKey]][])

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, marginBottom: 32 }}>
          <Link href="/notes" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>← Notes</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <span style={{ color: meta.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{meta.label}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
            {meta.label.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{meta.emoji}</span> Select Semester
          </h1>
        </div>

        {/* Semester Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}>
          {sems.map(({ sem, label }: { sem: string; label: string }) => {
            let href = ''
            if (yearNum === 1) {
              if (!isPrivileged && assignedGroup) {
                href = `/notes/year/1/group/${assignedGroup}/${sem}`
              } else {
                href = `/notes/year/1/semester/${sem}`
              }
            } else {
              href = `/notes/year/${yearNum}/semester/${sem}`
            }

            return (
              <Link key={sem} href={href} style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 24,
                    background: '#FFFFFF',
                    border: `1.5px solid ${meta.border}`,
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
                        background: meta.color,
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Poppins',
                        fontWeight: 900,
                        fontSize: 16,
                        color: meta.accent,
                      }}
                    >
                      {sem}
                    </div>
                    <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 12, color: meta.accent }}>
                      {meta.label}
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#2D2845', margin: '0 0 4px' }}>
                    {label}
                  </h2>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0 }}>
                    {yearNum === 1 ? 'View your group subjects' : 'Select your department'}
                  </p>

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: meta.accent, fontFamily: 'Poppins', fontWeight: 900, fontSize: 11, letterSpacing: 0.5, marginTop: 12 }}>
                    <span>{yearNum === 1 ? 'VIEW GROUP' : 'CHOOSE DEPARTMENT'}</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* For years 2-4: show dept overview */}
        {yearNum > 1 && (
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#8B85A8', letterSpacing: 1, marginBottom: 12 }}>
              AVAILABLE DEPARTMENTS
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {deptList.map(([code, dept]) => (
                <div
                  key={code}
                  className="glass"
                  style={{
                    padding: 16,
                    background: '#FFFFFF',
                    borderRadius: 20,
                    textAlign: 'center',
                    border: '1px solid rgba(108,99,255,0.06)',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{dept.emoji}</div>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 13, color: '#2D2845', margin: 0 }}>{code}</p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 10, color: '#8B85A8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dept.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

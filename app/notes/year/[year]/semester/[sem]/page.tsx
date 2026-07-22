import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEPARTMENTS, DeptKey } from '@/app/lib/data/subjects'

const YEAR_META: Record<number, { label: string; color: string; border: string; accent: string }> = {
  2: { label: '2nd Year', color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  3: { label: '3rd Year', color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  4: { label: '4th Year', color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
}

const DEPT_META: Record<DeptKey, { color: string; border: string; accent: string }> = {
  CSE: { color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  ECE: { color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  ME:  { color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  MEA: { color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
  BT:  { color: '#F0F8FF', border: 'rgba(116,185,255,0.12)', accent: '#74B9FF' },
}

const VALID_SEMS: Record<number, string[]> = {
  2: ['S3', 'S4'],
  3: ['S5', 'S6'],
  4: ['S7', 'S8'],
}

export default async function DeptPickerPage({
  params,
}: {
  params: Promise<{ year: string; sem: string }>
}) {
  const { year, sem } = await params
  const yearNum = parseInt(year)
  if (![2, 3, 4].includes(yearNum) || !VALID_SEMS[yearNum].includes(sem.toUpperCase())) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, role')
    .eq('id', user?.id)
    .single()

  const userDept = profile?.department?.toUpperCase()
  const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'

  const semKey = sem.toUpperCase()
  const yearMeta = YEAR_META[yearNum]
  const allDepts = (Object.entries(DEPARTMENTS) as [DeptKey, typeof DEPARTMENTS[DeptKey]][])
  const deptList = allDepts.filter(([code]) => {
    if (isPrivileged || !userDept) return true
    return code === userDept
  })

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/notes" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href={`/notes/year/${yearNum}`} style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>{yearMeta.label}</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <span style={{ color: yearMeta.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{semKey}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
            {yearMeta.label.toUpperCase()} · {semKey}
          </p>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
            Select Department
          </h1>
          <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>
            Choose your stream to view subjects and notes
          </p>
        </div>

        {/* Department Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {deptList.map(([code, dept]: [DeptKey, any]) => {
            const meta = DEPT_META[code] || DEPT_META['CSE']
            return (
              <Link key={code} href={`/notes/year/${yearNum}/dept/${code}/${semKey}`} style={{ textDecoration: 'none' }}>
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
                        fontSize: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {dept.emoji}
                    </div>
                    <span style={{
                      background: meta.color, color: meta.accent,
                      fontFamily: 'Poppins', fontWeight: 900, fontSize: 11,
                      padding: '4px 12px', borderRadius: 50,
                    }}>
                      {code}
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#2D2845', margin: '0 0 4px' }}>
                    {dept.name}
                  </h2>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0 }}>
                    View {semKey} subjects &amp; notes
                  </p>

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: meta.accent, fontFamily: 'Poppins', fontWeight: 900, fontSize: 11, letterSpacing: 0.5, marginTop: 12 }}>
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

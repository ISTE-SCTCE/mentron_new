import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { FIRST_YEAR_GROUPS, GroupKey } from '@/app/lib/data/subjects'
import { getDepartmentFromRollNumber, getGroupFromDepartment } from '@/app/lib/utils/departmentMapper'
import { SubjectFoldersClient } from '@/app/notes/SubjectFoldersClient'
import { SubjectRowClient } from '@/app/notes/SubjectRowClient'
import { Lock } from 'lucide-react'

const VALID_GROUPS: GroupKey[] = ['A', 'B', 'C', 'D']
const VALID_SEMS = ['S1', 'S2']

const GROUP_COLORS: Record<GroupKey, { color: string; border: string; accent: string }> = {
  A: { color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  B: { color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  C: { color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  D: { color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
}

export default async function Year1SubjectsPage({
  params,
}: {
  params: Promise<{ group: string; sem: string }>
}) {
  const { group, sem } = await params
  const groupKey = group.toUpperCase() as GroupKey
  if (!VALID_GROUPS.includes(groupKey) || !VALID_SEMS.includes(sem)) notFound()

  const groupMeta = FIRST_YEAR_GROUPS[groupKey]
  const style = GROUP_COLORS[groupKey]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, department, roll_number')
    .eq('id', user?.id ?? '')
    .single()

  const isPrivileged = profile?.role === 'exec' || profile?.role === 'core'
  if (!isPrivileged) {
    const detectedDept = getDepartmentFromRollNumber(profile?.roll_number)
    const resolvedDept = detectedDept !== 'Other' ? detectedDept : (profile?.department ?? '')
    const userGroup = getGroupFromDepartment(resolvedDept)
    if (userGroup !== groupKey) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
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

            <h2 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 24, color: '#2D2845', margin: '0 0 8px' }}>
              Access Restricted
            </h2>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', lineHeight: 1.6, margin: '0 0 24px' }}>
              You belong to <strong style={{ color: '#2D2845' }}>Group {userGroup}</strong>. Group {groupKey} notes are available only to students in that stream.
            </p>

            <Link href={`/notes/year/1/group/${userGroup}/${sem}`} style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%' }}>
                Go to My Group →
              </button>
            </Link>
          </div>
        </div>
      )
    }
  }

  const { data: allNotes } = await supabase
    .from('notes')
    .select('id, subject, title, file_url, profile_id, profiles!notes_profile_id_fkey(full_name)')
    .eq('year', 1)
    .eq('department', groupKey)
    .eq('semester', sem)
    .order('created_at', { ascending: false })

  const notesBySubject: Record<string, any[]> = {}
  for (const note of (allNotes ?? [])) {
    if (!note.subject) continue
    notesBySubject[note.subject] = notesBySubject[note.subject] ?? []
    notesBySubject[note.subject].push(note)
  }

  const { data: rootFolders } = await supabase
    .from('note_folders')
    .select('id, name')
    .eq('department', groupKey)
    .eq('year', '1')
    .eq('semester', sem)
    .eq('subject', 'ROOT')
    .order('created_at', { ascending: true })

  const basePath = `/notes/year/1/group/${groupKey}/${sem}`

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/notes" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href="/notes/year/1" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>1st Year</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href={`/notes/year/1/semester/${sem}`} style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>{sem}</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <span style={{ color: style.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Group {groupKey}</span>
        </div>

        {/* Header card */}
        <div
          className="glass-card"
          style={{
            padding: 24,
            background: '#FFFFFF',
            border: `1.5px solid ${style.border}`,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  background: style.color,
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  fontSize: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {groupMeta.emoji}
              </div>
              <div>
                <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: style.accent, textTransform: 'uppercase', margin: 0 }}>
                  1st Year · {sem}
                </p>
                <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 24, color: '#2D2845', margin: '4px 0 0' }}>
                  {groupMeta.label}
                </h1>
                <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 12, color: style.accent, margin: '2px 0 0' }}>
                  {groupMeta.streams}
                </p>
              </div>
            </div>

            <Link href="/notes/upload" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: 13,
                  width: 'auto',
                  borderRadius: 50,
                }}
              >
                + Contribute Notes
              </button>
            </Link>
          </div>
        </div>

        {/* SubjectFoldersClient helper (folder generation tool) */}
        <div style={{ marginBottom: 32 }}>
          <SubjectFoldersClient
            subjectName="ROOT"
            department={groupKey}
            year="1"
            semester={sem}
            initialFolders={[]}
            canCreateFolder={isPrivileged}
            styleAccent={style.accent}
            styleBorder={style.border}
            yearNum={1}
            deptKey={groupKey}
            semKey={sem}
            isPrivileged={isPrivileged}
            title="Create Additional Custom Subjects"
            hideFolderList={true}
          />
        </div>

        {/* Subjects List */}
        <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#8B85A8', letterSpacing: 1, marginBottom: 16 }}>
          SUBJECTS — {sem}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rootFolders && rootFolders.length > 0 ? (
            rootFolders.map((folder, idx) => {
              const subject = folder.name
              const subjectNotes = notesBySubject[subject] ?? []
              const pyqNotes = notesBySubject[`PYQ - ${subject}`] ?? []
              const videoNotes = notesBySubject[`Video - ${subject}`] ?? []
              const noteCount = subjectNotes.length + pyqNotes.length + videoNotes.length

              return (
                <SubjectRowClient
                  key={idx}
                  id={folder.id}
                  name={folder.name}
                  basePath={basePath}
                  noteCount={noteCount}
                  style={{
                    color: style.color,
                    border: style.border,
                    accent: style.accent,
                  }}
                  idx={idx}
                  isPrivileged={isPrivileged}
                />
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(108,99,255,0.06)' }}>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>
                No subjects found
              </p>
              {isPrivileged && (
                <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', marginTop: 4 }}>
                  Use the generation button above to initialize subjects.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

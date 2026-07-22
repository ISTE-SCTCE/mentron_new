import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { DEPARTMENTS, DeptKey, SemKey } from '@/app/lib/data/subjects'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'
import { SubjectFoldersClient } from '@/app/notes/SubjectFoldersClient'
import { getPermissions } from '@/app/lib/utils/coreAuth'
import { NoteAccessGate } from '@/app/components/NoteAccessGate'
import { VirtualFolderAuthToggle } from '@/app/components/VirtualFolderAuthToggle'

export const dynamic = 'force-dynamic'

const DEPT_META: Record<DeptKey, { color: string; border: string; accent: string }> = {
  CSE: { color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  ECE: { color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  ME:  { color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  MEA: { color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
  BT:  { color: '#F0F8FF', border: 'rgba(116,185,255,0.12)', accent: '#74B9FF' },
}

const YEAR_META: Record<number, { label: string; accent: string }> = {
  2: { label: '2nd Year', accent: '#FF8C69' },
  3: { label: '3rd Year', accent: '#4ECDC4' },
  4: { label: '4th Year', accent: '#FF6B9D' },
}

const VALID_DEPTS = ['CSE', 'ECE', 'ME', 'MEA', 'BT']
const VALID_SEMS = ['S3', 'S4', 'S5', 'S6', 'S7', 'S8']

export default async function SubjectNotesPage({
  params,
}: {
  params: Promise<{ year: string; dept: string; sem: string; subject: string }>
}) {
  const { year, dept, sem, subject } = await params
  const yearNum = parseInt(year)
  const deptKey = dept.toUpperCase() as DeptKey
  const semKey = sem.toUpperCase() as SemKey
  const subjectName = decodeURIComponent(subject)

  if (![2, 3, 4].includes(yearNum) || !VALID_DEPTS.includes(deptKey) || !VALID_SEMS.includes(semKey)) {
    notFound()
  }

  const deptMeta = DEPARTMENTS[deptKey]
  const style = DEPT_META[deptKey] || DEPT_META['CSE']
  const yearMeta = YEAR_META[yearNum]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, department, iste_id')
    .eq('id', user?.id ?? '')
    .single()

  const permissions = await getPermissions()
  const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
  const canCreateFolder = isPrivileged || permissions.can_upload_notes === true

  const isSubfolder = subjectName.startsWith('PYQ - ') || subjectName.startsWith('Video - ')

  // Fetch notes filtered by year + dept + semester + subject (only those without a folder)
  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles!notes_profile_id_fkey(full_name)')
    .eq('year', yearNum)
    .eq('semester', semKey)
    .eq('subject', subjectName)
    .order('created_at', { ascending: false })

  let finalNotes = notes ?? []

  // FALLBACK
  if (finalNotes.length === 0) {
    const { data: fallbackNotes } = await supabase
      .from('notes')
      .select('*, profiles!notes_profile_id_fkey(full_name)')
      .eq('year', yearNum)
      .eq('semester', semKey)
      .order('created_at', { ascending: false })
      .limit(20)
    finalNotes = fallbackNotes ?? []
  }

  // Fetch custom folders for this subject (skip for PYQ/Video sub-folders)
  let folders: { id: string; name: string }[] = []
  if (!isSubfolder) {
    const { data: foldersData } = await supabase
      .from('note_folders')
      .select('id, name')
      .eq('subject', subjectName)
      .eq('department', deptKey)
      .eq('year', yearNum.toString())
      .eq('semester', semKey)
      .order('created_at', { ascending: true })

    folders = foldersData ?? []
  }

  let virtualSettings = null
  if (isSubfolder) {
    const { data } = await supabase
      .from('note_folders')
      .select('requires_auth')
      .eq('subject', subjectName)
      .eq('department', deptKey)
      .eq('year', yearNum.toString())
      .eq('semester', semKey)
      .eq('name', 'Virtual Settings')
      .maybeSingle()
    virtualSettings = data
  }

  const uploadUrl = `/notes/upload?year=${yearNum}&dept=${deptKey}&sem=${semKey}&subject=${encodeURIComponent(subjectName)}`

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 0' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/notes" style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href={`/notes/year/${yearNum}`} style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>{yearMeta.label}</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href={`/notes/year/${yearNum}/semester/${semKey}`} style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>{semKey}</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <Link href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}`} style={{ color: '#8B85A8', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>{deptKey}</Link>
          <span style={{ color: '#B8B4D0' }}>/</span>
          <span style={{ color: '#2D2845', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>{subjectName}</span>
        </div>

        {/* Subject Header */}
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
                {deptMeta.emoji}
              </div>
              <div>
                <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: style.accent, textTransform: 'uppercase', margin: 0 }}>
                  {yearMeta.label} · {semKey} · {deptKey}
                </p>
                <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 24, color: '#2D2845', margin: '4px 0 0' }}>
                  {subjectName}
                </h1>
                {isSubfolder && isPrivileged && (
                  <div style={{ marginTop: 8 }}>
                    <VirtualFolderAuthToggle
                      subjectName={subjectName}
                      department={deptKey}
                      year={yearNum.toString()}
                      semester={semKey}
                      initialRequiresAuth={virtualSettings?.requires_auth ?? false}
                    />
                  </div>
                )}
              </div>
            </div>

            {permissions.can_upload_notes && (
              <Link href={uploadUrl} style={{ textDecoration: 'none' }}>
                <button
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: 13,
                    width: 'auto',
                    borderRadius: 50,
                  }}
                >
                  + Upload Note
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Virtual Folders (PYQ + Video) */}
        {!isSubfolder && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            <Link
              href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}/${encodeURIComponent('PYQ - ' + subjectName)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 20,
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(108,99,255,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 32 }}>📂</div>
                <div>
                  <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>PYQs</h3>
                  <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#8B85A8', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Past Year Questions</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}/${encodeURIComponent('Video - ' + subjectName)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 20,
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(108,99,255,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 32 }}>🎬</div>
                <div>
                  <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>Video Lectures</h3>
                  <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#8B85A8', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Tutorials &amp; Guides</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Custom Folders */}
        {!isSubfolder && (
          <div style={{ marginBottom: 32 }}>
            <SubjectFoldersClient
              subjectName={subjectName}
              department={deptKey}
              year={yearNum.toString()}
              semester={semKey}
              initialFolders={folders}
              canCreateFolder={canCreateFolder}
              styleAccent={style.accent}
              styleBorder={style.border}
              yearNum={yearNum}
              deptKey={deptKey}
              semKey={semKey}
              isPrivileged={isPrivileged}
            />
          </div>
        )}

        {/* Notes list */}
        <div>
          <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#8B85A8', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
            {isSubfolder ? 'All Notes' : 'Notes (No Folder)'}
          </p>

          {notes && notes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {notes.map((note: any) => (
                <div key={note.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {note.title}
                  </h3>
                  {note.description && (
                    <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                      {note.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(108,99,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#8B85A8' }}>
                      {note.profiles?.full_name || 'Anonymous'}
                    </span>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'core') && (
                        <DeleteButton onDelete={deleteNote.bind(null, note.id)} itemName="note" />
                      )}
                      <NoteAccessGate
                        noteUrl={note.file_url}
                        userId={profile?.id}
                        userIsteId={profile?.iste_id}
                        userRole={profile?.role}
                        title={note.title}
                        requiresAuth={isSubfolder ? (virtualSettings?.requires_auth ?? false) : false}
                      >
                        <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                          <button
                            style={{
                              background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
                              color: 'white',
                              fontFamily: 'Inter', fontWeight: 700, fontSize: 12,
                              padding: '8px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
                            }}
                          >
                            View Note
                          </button>
                        </InteractionTracker>
                      </NoteAccessGate>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(108,99,255,0.06)' }}>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>
                No notes uploaded yet
              </p>
              <Link href={uploadUrl} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#6C63FF', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
                Be the first to contribute →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

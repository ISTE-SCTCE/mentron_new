import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { NotesSearch } from './NotesSearch'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'
import { NoteAccessGate } from '@/app/components/NoteAccessGate'
import { getPermissions } from '@/app/lib/utils/coreAuth'

const YEARS = [
  { year: 1, label: '1st Year', sems: 'S1 & S2', emoji: '🌱', color: '#EEEEFF', border: 'rgba(108,99,255,0.12)', accent: '#6C63FF' },
  { year: 2, label: '2nd Year', sems: 'S3 & S4', emoji: '📘', color: '#FFF3EE', border: 'rgba(255,140,105,0.12)', accent: '#FF8C69' },
  { year: 3, label: '3rd Year', sems: 'S5 & S6', emoji: '🔬', color: '#EEFAF9', border: 'rgba(78,205,196,0.12)', accent: '#4ECDC4' },
  { year: 4, label: '4th Year', sems: 'S7 & S8', emoji: '🎓', color: '#FFF0F5', border: 'rgba(255,107,157,0.12)', accent: '#FF6B9D' },
]

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const resolvedSearchParams = await searchParams
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const filter = typeof resolvedSearchParams.filter === 'string' ? resolvedSearchParams.filter : 'all'

  // Fetch notes only when search/filter is active
  let notes: any[] | null = null
  if (query || filter === 'contributions') {
    let dbQuery = supabase
      .from('notes')
      .select('*, profiles!notes_profile_id_fkey(full_name)')
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }
    if (filter === 'contributions' && profile) {
      dbQuery = dbQuery.eq('profile_id', profile.id)
    }

    const { data, error } = await dbQuery
    notes = data
    if (error) console.error('Fetch notes error:', error)
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 0' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
              KNOWLEDGE BASE
            </p>
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
              Academic Notes
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(await getPermissions()).can_upload_notes && (
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
            )}
          </div>
        </header>

        {/* Search bar */}
        <div style={{ marginBottom: 32 }}>
          <NotesSearch initialQuery={query} initialFilter={filter} />
        </div>

        {/* Search results OR Year cards */}
        {(query || filter === 'contributions') ? (
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, color: '#2D2845', marginBottom: 16 }}>
              Search Results
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {notes && notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#EEEEFF', color: '#6C63FF', fontSize: 9, fontFamily: 'Inter', fontWeight: 800, padding: '4px 10px', borderRadius: 50 }}>
                        {note.department}
                      </span>
                      <span style={{ background: '#FFF3EE', color: '#FF8C69', fontSize: 9, fontFamily: 'Inter', fontWeight: 800, padding: '4px 10px', borderRadius: 50 }}>
                        {note.year} Year
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#2D2845', margin: 0 }}>
                      {note.title}
                    </h2>

                    {note.description && (
                      <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {note.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(108,99,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: '#8B85A8', margin: 0 }}>UPLOADED BY</p>
                        <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#2D2845', margin: 0 }}>
                          {note.profiles?.full_name || 'Anonymous'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin') && (
                          <DeleteButton onDelete={deleteNote.bind(null, note.id)} itemName="note" />
                        )}
                        <NoteAccessGate
                          noteUrl={note.file_url}
                          userId={profile?.id}
                          userIsteId={profile?.iste_id}
                          userRole={profile?.role}
                          title={note.title}
                          requiresAuth={false}
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
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', gridColumn: '1 / -1' }}>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 18, color: '#2D2845', margin: '0 0 8px' }}>
                    No notes found
                  </p>
                  <Link href="/notes" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#6C63FF', textDecoration: 'none' }}>
                    Clear search →
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Year Cards ── */
          <div>
            <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', marginBottom: 16 }}>
              Select Your Year
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {YEARS.map(({ year, label, sems, emoji, color, border, accent }) => (
                <Link
                  key={year}
                  href={`/notes/year/${year}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: 24,
                      background: '#FFFFFF',
                      border: `1.5px solid ${border}`,
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
                          background: color,
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          fontSize: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {emoji}
                      </div>
                      <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 12, color: accent }}>
                        {sems}
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#2D2845', margin: '0 0 4px' }}>
                      {label}
                    </h2>
                    <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: 0 }}>
                      Browse notes by semester
                    </p>

                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: accent, fontFamily: 'Poppins', fontWeight: 900, fontSize: 11, letterSpacing: 0.5, marginTop: 12 }}>
                      <span>SELECT SEMESTER</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

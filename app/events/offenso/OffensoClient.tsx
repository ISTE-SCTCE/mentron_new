'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import {
  Terminal, ShieldCheck, FolderPlus, FilePlus2, Play, Download,
  ExternalLink, Trash2, ArrowLeft, X, Sparkles, Tv
} from 'lucide-react'
import Link from 'next/link'
import { PdfViewerModal } from '@/app/components/PdfViewerModal'

export interface Lecture {
  id: string
  folder_id: string
  title: string
  description?: string
  video_url?: string
  notes_url?: string
  lecture_type?: string
  created_at: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  created_at: string
  academy_lectures?: Lecture[]
}

interface Props {
  initialFolders: Folder[]
  isExec: boolean
  userEmail: string
  userName: string
}

export function OffensoClient({ initialFolders, isExec, userEmail, userName }: Props) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [activeFolderId, setActiveFolderId] = useState<string>(initialFolders[0]?.id || '')
  const [playingLecture, setPlayingLecture] = useState<Lecture | null>(null)
  const [viewingNotesUrl, setViewingNotesUrl] = useState<string | null>(null)
  const [viewingNotesTitle, setViewingNotesTitle] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [streamLoading, setStreamLoading] = useState(false)

  // Fetch a presigned R2 GET URL whenever the user opens a video lecture.
  // This lets the browser stream directly from R2 with range-request support
  // instead of buffering through the Next.js proxy (which caused MIME errors).
  const fetchStreamUrl = useCallback(async (lecture: Lecture | null) => {
    if (!lecture?.video_url) {
      setStreamUrl(null)
      return
    }
    setStreamUrl(null)
    setStreamLoading(true)
    try {
      // video_url is stored as "/api/files/academy-lectures/filename.mp4"
      // Extract the R2 key: everything after "/api/files/"
      const key = lecture.video_url.replace(/^\/api\/files\//, '')
      const res = await fetch(`/api/stream?key=${encodeURIComponent(key)}`)
      if (!res.ok) throw new Error('Failed to get stream URL')
      const data = await res.json()
      setStreamUrl(data.url)
    } catch (err) {
      console.error('Stream URL fetch failed:', err)
      // Fallback to proxy URL so user sees something
      setStreamUrl(lecture.video_url)
    } finally {
      setStreamLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStreamUrl(playingLecture)
  }, [playingLecture, fetchStreamUrl])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showLectureModal, setShowLectureModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Announcement Board ──
  const DEFAULT_ANNOUNCEMENT = `💚 Dear Offenso Fam💚
As promised, today we're sharing the Kali Linux installation video guide 💻🐉
This video explains the complete installation process step by step. Please watch it carefully and follow along.

🔗 Watch here: [ https://tinyurl.com/RandDoffenso ]

If you have any doubts, feel free to reach out.
Let's keep learning and growing together 💚🚀`

  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT)
  const [editingAnnouncement, setEditingAnnouncement] = useState(false)
  const [announcementDraft, setAnnouncementDraft] = useState(DEFAULT_ANNOUNCEMENT)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Load announcement from DB on mount
  useEffect(() => {
    async function loadAnnouncement() {
      const { data } = await supabase
        .from('academy_announcements')
        .select('message')
        .eq('id', 1)
        .maybeSingle()
      if (data?.message) {
        setAnnouncement(data.message)
        setAnnouncementDraft(data.message)
      }
    }
    loadAnnouncement()
  }, [])

  async function saveAnnouncement() {
    setSavingAnnouncement(true)
    try {
      await supabase
        .from('academy_announcements')
        .upsert({ id: 1, message: announcementDraft }, { onConflict: 'id' })
      setAnnouncement(announcementDraft)
      setEditingAnnouncement(false)
    } catch (err: any) {
      alert(err.message || 'Failed to save')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  // Auto-detect URLs in text and make them clickable
  function renderMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s\]]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#00FF41',
            textDecoration: 'underline',
            fontWeight: 700,
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  // Form states
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDesc, setNewFolderDesc] = useState('')

  const [newLectureTitle, setNewLectureTitle] = useState('')
  const [newLectureDesc, setNewLectureDesc] = useState('')
  const [newLectureVideo, setNewLectureVideo] = useState('')
  const [newLectureNotes, setNewLectureNotes] = useState('')

  const activeFolder = folders.find(f => f.id === activeFolderId)
  const lectures = activeFolder?.academy_lectures || []

  const supabase = createClient()

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('academy_folders')
        .insert({
          name: newFolderName.trim(),
          description: newFolderDesc.trim(),
        })
        .select()
        .single()

      if (error) throw error

      const created: Folder = { ...data, academy_lectures: [] }
      setFolders([created, ...folders])
      setActiveFolderId(created.id)
      setShowFolderModal(false)
      setNewFolderName('')
      setNewFolderDesc('')
    } catch (err: any) {
      alert(err.message || 'Failed to create folder')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateLecture(e: React.FormEvent) {
    e.preventDefault()
    if (!newLectureTitle.trim() || !activeFolderId) return
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('academy_lectures')
        .insert({
          folder_id: activeFolderId,
          title: newLectureTitle.trim(),
          description: newLectureDesc.trim(),
          video_url: newLectureVideo.trim() || null,
          notes_url: newLectureNotes.trim() || null,
          lecture_type: 'video',
        })
        .select()
        .single()

      if (error) throw error

      const updated = folders.map(f => {
        if (f.id === activeFolderId) {
          return {
            ...f,
            academy_lectures: [data, ...(f.academy_lectures || [])],
          }
        }
        return f
      })

      setFolders(updated)
      setShowLectureModal(false)
      setNewLectureTitle('')
      setNewLectureDesc('')
      setNewLectureVideo('')
      setNewLectureNotes('')
    } catch (err: any) {
      alert(err.message || 'Failed to add lecture')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) return
    try {
      const { error } = await supabase
        .from('academy_folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      const updated = folders.filter(f => f.id !== folderId)
      setFolders(updated)
      if (activeFolderId === folderId) {
        setActiveFolderId(updated[0]?.id || '')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete folder')
    }
  }

  async function handleDeleteLecture(lectureId: string) {
    if (!confirm('Are you sure you want to delete this lecture?')) return
    try {
      const { error } = await supabase
        .from('academy_lectures')
        .delete()
        .eq('id', lectureId)

      if (error) throw error

      const updated = folders.map(f => {
        if (f.id === activeFolderId) {
          return {
            ...f,
            academy_lectures: (f.academy_lectures || []).filter(l => l.id !== lectureId),
          }
        }
        return f
      })
      setFolders(updated)
      if (playingLecture?.id === lectureId) {
        setPlayingLecture(null)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete lecture')
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0A0E27',
        color: '#F0F0F0',
        paddingBottom: 120,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Cyber Header */}
      <div
        style={{
          borderBottom: '1px solid #2A3A5A',
          background: '#0F1535',
          padding: '24px 20px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00FF41', marginBottom: 4 }}>
              <Terminal size={14} />
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
                System Module active
              </span>
            </div>
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
              OFFENSO <span style={{ color: '#00FF41' }}>ACADEMY</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{userName}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#A0A0A0', fontFamily: 'monospace' }}>{userEmail}</p>
            </div>
            <div
              style={{
                background: isExec ? 'rgba(255,0,127,0.1)' : 'rgba(0,255,65,0.1)',
                border: isExec ? '1px solid #FF007F' : '1px solid #00FF41',
                borderRadius: 8,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShieldCheck size={14} color={isExec ? '#FF007F' : '#00FF41'} />
              <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'monospace', color: isExec ? '#FF007F' : '#00FF41', textTransform: 'uppercase' }}>
                {isExec ? 'OPERATOR (EXEC)' : 'PARTICIPANT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 20px' }}>
        
        {/* Navigation Breadcrumb Link */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#00F0FF', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            <ArrowLeft size={16} /> BACK TO EVENTS
          </Link>
        </div>

        {/* ── Pinned Announcement Board ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,65,0.06) 0%, rgba(0,240,255,0.04) 100%)',
            border: '1.5px solid rgba(0,255,65,0.35)',
            borderRadius: 20,
            padding: 24,
            marginBottom: 32,
            position: 'relative',
            boxShadow: '0 4px 24px rgba(0,255,65,0.08)',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📢</span>
              <span style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                color: '#00FF41',
              }}>
                LATEST ANNOUNCEMENT
              </span>
            </div>
            {isExec && !editingAnnouncement && (
              <button
                onClick={() => { setAnnouncementDraft(announcement); setEditingAnnouncement(true) }}
                style={{
                  background: 'rgba(0,255,65,0.1)',
                  border: '1px solid rgba(0,255,65,0.4)',
                  color: '#00FF41',
                  borderRadius: 8,
                  padding: '5px 14px',
                  fontSize: 11,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                ✏️ EDIT
              </button>
            )}
          </div>

          {/* Viewing mode */}
          {!editingAnnouncement && (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: '#E0E0E0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {renderMessage(announcement)}
            </div>
          )}

          {/* Editing mode (exec only) */}
          {editingAnnouncement && (
            <div>
              <textarea
                value={announcementDraft}
                onChange={e => setAnnouncementDraft(e.target.value)}
                rows={10}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(0,255,65,0.4)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: '#F0F0F0',
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingAnnouncement(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A3A5A',
                    color: '#A0A0A0',
                    borderRadius: 8,
                    padding: '7px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={saveAnnouncement}
                  disabled={savingAnnouncement}
                  style={{
                    background: 'linear-gradient(135deg, #00FF41, #00F0FF)',
                    color: '#0A0E27',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 20px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                  }}
                >
                  {savingAnnouncement ? 'SAVING...' : '💾 SAVE'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Player Display */}
        {playingLecture && (
          <div
            style={{
              background: '#0F1535',
              border: '1.5px solid #00F0FF',
              borderRadius: 24,
              padding: 24,
              marginBottom: 32,
              boxShadow: '0 10px 40px rgba(0,240,255,0.15)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setPlayingLecture(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00F0FF', marginBottom: 12 }}>
              <Tv size={18} />
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                Playing Lecture
              </span>
            </div>

            <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#FFFFFF', margin: '0 0 16px' }}>
              {playingLecture.title}
            </h2>

            {playingLecture.video_url ? (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#000000',
                  border: '1px solid #2A3A5A',
                }}
              >
                <video
                  key={streamUrl || 'loading'}
                  src={streamUrl || undefined}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%' }}
                >
                  {streamLoading && (
                    <p style={{ color: '#A0A0A0', textAlign: 'center', marginTop: 40 }}>Loading video...</p>
                  )}
                </video>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 16 }}>
                <p style={{ margin: 0, color: '#A0A0A0' }}>No video stream available for this lecture.</p>
              </div>
            )}

            {playingLecture.description && (
              <p style={{ marginTop: 16, color: '#A0A0A0', fontSize: 14, lineHeight: 1.5, margin: '16px 0 0' }}>
                {playingLecture.description}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 32, alignItems: 'start' }}>
          
          {/* Folders List Sidebar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#FFFFFF', margin: 0, letterSpacing: '0.5px' }}>
                ACADEMY MODULES
              </h2>
              {isExec && (
                <button
                  onClick={() => setShowFolderModal(true)}
                  style={{
                    background: 'rgba(0,240,255,0.1)',
                    border: '1px solid #00F0FF',
                    color: '#00F0FF',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Create Folder"
                >
                  <FolderPlus size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {folders.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #2A3A5A', borderRadius: 16 }}>
                  <p style={{ margin: 0, color: '#A0A0A0', fontSize: 13 }}>No modules available.</p>
                </div>
              ) : (
                folders.map(folder => {
                  const isActive = folder.id === activeFolderId
                  const count = folder.academy_lectures?.length || 0
                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setActiveFolderId(folder.id)
                        setPlayingLecture(null)
                      }}
                      style={{
                        padding: 16,
                        background: isActive ? 'rgba(0,255,65,0.06)' : '#1A1F3A',
                        border: isActive ? '1px solid #00FF41' : '1px solid #2A3A5A',
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 4px 20px rgba(0,255,65,0.08)' : 'none',
                        position: 'relative',
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{folder.name}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', background: isActive ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4, color: isActive ? '#00FF41' : '#A0A0A0' }}>
                          {count} {count === 1 ? 'LEC' : 'LECS'}
                        </span>
                      </h3>
                      {folder.description && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#A0A0A0', lineHeight: 1.4 }}>
                          {folder.description}
                        </p>
                      )}

                      {isExec && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFolder(folder.id)
                          }}
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            background: 'transparent',
                            border: 'none',
                            color: '#FF007F',
                            opacity: 0.4,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                          title="Delete Folder"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Lectures List Content Area */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#FFFFFF', margin: 0 }}>
                  {activeFolder ? activeFolder.name : 'Select a Module'}
                </h2>
                {activeFolder?.description && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#A0A0A0' }}>
                    {activeFolder.description}
                  </p>
                )}
              </div>

              {activeFolderId && isExec && (
                <button
                  onClick={() => setShowLectureModal(true)}
                  style={{
                    background: 'rgba(0,255,65,0.1)',
                    border: '1px solid #00FF41',
                    color: '#00FF41',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FilePlus2 size={14} /> ADD LECTURE
                </button>
              )}
            </div>

            {/* Lectures Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {lectures.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed #2A3A5A', borderRadius: 24, background: '#0F1535' }}>
                  <Sparkles size={32} color="#2A3A5A" style={{ marginBottom: 12 }} />
                  <p style={{ margin: '0 0 4px', color: '#FFFFFF', fontWeight: 700 }}>No Lectures Found</p>
                  <p style={{ margin: 0, color: '#A0A0A0', fontSize: 13 }}>There are no uploaded lectures in this module yet.</p>
                </div>
              ) : (
                lectures.map((lecture, index) => (
                  <div
                    key={lecture.id}
                    style={{
                      background: '#161C38',
                      border: '1px solid #2A3A5A',
                      borderRadius: 20,
                      padding: 20,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                          {lecture.title}
                        </h4>
                        {lecture.description && (
                          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#A0A0A0', lineHeight: 1.5 }}>
                            {lecture.description}
                          </p>
                        )}
                      </div>

                      {isExec && (
                        <button
                          onClick={() => handleDeleteLecture(lecture.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#FF007F',
                            opacity: 0.5,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                          title="Delete Lecture"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Action buttons footer */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {lecture.video_url && (
                        <button
                          onClick={() => setPlayingLecture(lecture)}
                          style={{
                            background: 'linear-gradient(135deg, #00FF41, #00F0FF)',
                            color: '#0A0E27',
                            border: 'none',
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: 12,
                            padding: '8px 16px',
                            borderRadius: 50,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Play size={12} fill="#0A0E27" /> PLAY STREAM
                        </button>
                      )}

                      {lecture.notes_url && (
                        <button
                          onClick={() => {
                            setViewingNotesUrl(lecture.notes_url!)
                            setViewingNotesTitle(lecture.title)
                          }}
                          style={{
                            background: 'transparent',
                            border: '1.5px solid #2A3A5A',
                            color: '#F0F0F0',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '6px 16px',
                            borderRadius: 50,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Tv size={12} /> VIEW NOTES
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cyberpunk Modal: Create Folder */}
      {showFolderModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,14,39,0.8)',
            backdropFilter: 'blur(12px)',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0F1535',
              border: '1.5px solid #00F0FF',
              borderRadius: 24,
              padding: 28,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 10px 45px rgba(0,240,255,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#FFFFFF' }}>
                CREATE MODULE FOLDER
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0A0A0', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00F0FF', marginBottom: 8, fontFamily: 'monospace' }}>
                  FOLDER NAME
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. Exploitation & Assembly"
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00F0FF', marginBottom: 8, fontFamily: 'monospace' }}>
                  DESCRIPTION
                </label>
                <textarea
                  value={newFolderDesc}
                  onChange={e => setNewFolderDesc(e.target.value)}
                  placeholder="Optional brief details..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: 14,
                    minHeight: 80,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00FF41, #00F0FF)',
                  color: '#0A0E27',
                  border: 'none',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {isSubmitting ? 'CREATING...' : 'CREATE MODULE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cyberpunk Modal: Add Lecture */}
      {showLectureModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,14,39,0.8)',
            backdropFilter: 'blur(12px)',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0F1535',
              border: '1.5px solid #00FF41',
              borderRadius: 24,
              padding: 28,
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 10px 45px rgba(0,255,65,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#FFFFFF' }}>
                ADD LECTURE CONTENT
              </h3>
              <button
                onClick={() => setShowLectureModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0A0A0', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLecture}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00FF41', marginBottom: 6, fontFamily: 'monospace' }}>
                  LECTURE TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newLectureTitle}
                  onChange={e => setNewLectureTitle(e.target.value)}
                  placeholder="e.g. Reverse Engineering 101"
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00FF41', marginBottom: 6, fontFamily: 'monospace' }}>
                  DESCRIPTION
                </label>
                <textarea
                  value={newLectureDesc}
                  onChange={e => setNewLectureDesc(e.target.value)}
                  placeholder="Details and objectives..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: 13,
                    minHeight: 60,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00FF41', marginBottom: 6, fontFamily: 'monospace' }}>
                  VIDEO URL
                </label>
                <input
                  type="url"
                  value={newLectureVideo}
                  onChange={e => setNewLectureVideo(e.target.value)}
                  placeholder="https://supabase.co/storage/v1/object/public/..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: '#00FF41', marginBottom: 6, fontFamily: 'monospace' }}>
                  NOTES / RESOURCES URL
                </label>
                <input
                  type="url"
                  value={newLectureNotes}
                  onChange={e => setNewLectureNotes(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2A3A5A',
                    borderRadius: 12,
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00FF41, #00F0FF)',
                  color: '#0A0E27',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {isSubmitting ? 'ADDING...' : 'ADD LECTURE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic PDF Notes Viewer Modal */}
      {viewingNotesUrl && (
        <PdfViewerModal
          url={viewingNotesUrl}
          title={viewingNotesTitle}
          onClose={() => {
            setViewingNotesUrl(null)
            setViewingNotesTitle('')
          }}
        />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, BookOpen, Calculator, Atom, Code2, Cpu, ArrowRight, FileText, Download } from 'lucide-react'

const SEMS = ['S1','S2','S3','S4','S5','S6','S7','S8']
const DEPTS = ['CSE','ECE','ME','MEA','BT']

const SUBJECT_COLORS = ['#6C63FF','#FF8C69','#4ECDC4','#FF6B9D','#74B9FF','#52B788']
const SUBJECT_BG = ['#EEEEFF','#FFF3EE','#EEFAF9','#FFF0F5','#F0F8FF','#F5FFF0']
const ICONS = [Calculator, Atom, Code2, Cpu, BookOpen, FileText]

interface Note {
  id: string
  title: string
  description?: string
  semester?: string
  subject?: string
  department?: string
  file_url?: string
  created_at: string
  profiles?: { full_name: string }
}

interface Props {
  notes: Note[]
  dept: string
  subjectsByDept: Record<string, string[]>
  isCoreOrExec: boolean
  userId?: string
}

export function NotesClient({ notes, dept, subjectsByDept, isCoreOrExec, userId }: Props) {
  const [selectedDept, setSelectedDept] = useState(dept)
  const [selectedSem, setSelectedSem] = useState('S3')
  const [search, setSearch] = useState('')

  const currentSubjects = subjectsByDept[selectedSem] || []

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase()
    return (
      n.title?.toLowerCase().includes(q) ||
      n.subject?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px' }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
          STUDY MATERIALS
        </p>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
          Notes & Resources
        </h1>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>
          Semester-wise curated notes
        </p>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#8B85A8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, subjects…"
            className="flutter-input"
            style={{ paddingLeft: 44 }}
          />
        </div>
      </div>

      {/* Department chips */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px' }}
      >
        {DEPTS.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            className={`chip ${selectedDept === d ? 'active' : ''}`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Semester chips */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px' }}
      >
        {SEMS.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSem(s)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 50, fontSize: 12,
              fontFamily: 'Inter', fontWeight: 700, border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              background: selectedSem === s ? '#2D2845' : '#FFFFFF',
              color: selectedSem === s ? 'white' : '#8B85A8',
              boxShadow: selectedSem === s ? '0 4px 12px rgba(45,40,69,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Subjects grid */}
      {!search && (
        <div style={{ padding: '0 20px 20px' }}>
          <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', marginBottom: 12 }}>
            {selectedDept} — {selectedSem}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentSubjects.map((subject, i) => {
              const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
              const bg = SUBJECT_BG[i % SUBJECT_BG.length]
              const Icon = ICONS[i % ICONS.length]
              const subjectNotes = notes.filter(n =>
                n.subject?.toLowerCase().includes(subject.toLowerCase()) ||
                n.title?.toLowerCase().includes(subject.toLowerCase())
              )
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                >
                  <div className="icon-container" style={{ background: bg, flexShrink: 0 }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0 }}>
                      {subject}
                    </p>
                    <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '2px 0 0' }}>
                      {subjectNotes.length} resource{subjectNotes.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <ArrowRight size={18} color={color} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search results */}
      {search && (
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, color: '#2D2845', marginBottom: 12 }}>
            {filteredNotes.length} results for &ldquo;{search}&rdquo;
          </p>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <BookOpen size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Inter', fontWeight: 600, color: '#8B85A8' }}>No notes found</p>
            </div>
          ) : (
            filteredNotes.map((note, i) => (
              <div
                key={note.id}
                className="glass-card"
                style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div className="icon-container" style={{ background: SUBJECT_BG[i % SUBJECT_BG.length], flexShrink: 0 }}>
                  <FileText size={20} color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '2px 0 0' }}>
                    {note.subject || note.semester || 'General'} · {note.profiles?.full_name || 'ISTE'}
                  </p>
                </div>
                {note.file_url && (
                  <a href={note.file_url} target="_blank" rel="noreferrer">
                    <Download size={18} color="#6C63FF" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

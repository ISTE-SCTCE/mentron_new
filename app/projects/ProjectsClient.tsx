'use client'

import { useState } from 'react'
import { Search, Plus, Users, Zap, Rocket, ChevronRight, CheckCircle2 } from 'lucide-react'

const FILTERS = ['All', 'Open', 'Closed', 'My Projects']

interface Project {
  id: string
  title: string
  description?: string
  status?: string
  team_size?: number
  xp_reward?: number
  posted_by?: string
  is_approved?: boolean
  created_at: string
  profiles?: { full_name: string }
  department?: string
  tags?: string[]
}

interface Props {
  projects: Project[]
  userName: string
  userRole: string
  userId: string
  appliedIds: string[]
}

export function ProjectsClient({ projects, userName, userRole, userId, appliedIds }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'All' ? true :
      filter === 'Open' ? p.status === 'open' || !p.status :
      filter === 'Closed' ? p.status === 'closed' :
      filter === 'My Projects' ? p.posted_by === userId : true
    return matchSearch && matchFilter
  })

  const isExec = userRole === 'exec' || userRole === 'core' || userRole === 'admin'

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104, position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px' }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>INNOVATIONS</p>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>Active Projects</h1>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>Browse open internship positions and submit your application.</p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 16px', position: 'relative' }}>
        <Search size={18} color="#8B85A8" style={{ position: 'absolute', left: 34, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" className="flutter-input" style={{ paddingLeft: 44 }} />
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 20px' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      {/* Projects */}
      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Rocket size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: 'Inter', fontWeight: 600, color: '#8B85A8' }}>No projects found</p>
          </div>
        ) : filtered.map((project, i) => {
          const isOpen = !project.status || project.status === 'open'
          const hasApplied = appliedIds.includes(project.id)
          return (
            <div key={project.id} className="glass-card" style={{ marginBottom: 12 }}>
              {/* Status + XP row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  background: isOpen ? '#EEFAF9' : '#FFF3EE',
                  color: isOpen ? '#4ECDC4' : '#FF8C69',
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 10,
                  padding: '4px 10px', borderRadius: 50,
                }}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
                {project.xp_reward && (
                  <span style={{
                    background: '#EEEEFF', color: '#6C63FF',
                    fontFamily: 'Inter', fontWeight: 700, fontSize: 10,
                    padding: '4px 10px', borderRadius: 50,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Zap size={10} /> {project.xp_reward} XP
                  </span>
                )}
              </div>
              {/* Title */}
              <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, color: '#2D2845', margin: '0 0 6px' }}>
                {project.title}
              </p>
              {/* Description */}
              {project.description && (
                <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              )}
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} color="#8B85A8" />
                    <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8' }}>
                      {project.team_size || 'N/A'} members
                    </span>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8' }}>
                    by {project.profiles?.full_name || 'ISTE'}
                  </span>
                </div>
                {isOpen && (
                  <button
                    disabled={hasApplied}
                    style={{
                      background: hasApplied ? '#EEFAF9' : 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
                      color: hasApplied ? '#4ECDC4' : 'white',
                      fontFamily: 'Inter', fontWeight: 700, fontSize: 12,
                      padding: '8px 16px', borderRadius: 50, border: 'none', cursor: hasApplied ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {hasApplied ? <><CheckCircle2 size={12} /> Applied</> : <>Apply <ChevronRight size={12} /></>}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <a href="/projects/new">
        <button
          style={{
            position: 'fixed', right: 24, bottom: 100,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(108,99,255,0.35)',
            zIndex: 40,
          }}
        >
          <Plus size={24} color="white" />
        </button>
      </a>
    </div>
  )
}

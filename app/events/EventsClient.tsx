'use client'

import { useState } from 'react'
import { Calendar, MapPin, ChevronRight, Zap, MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'

interface Event {
  id: string
  title: string
  venue: string
  date: string | null
  description: string
  registration_required: boolean
}

interface Concept {
  id: string
  user_id: string
  title: string
  description: string
  created_at: string
  profiles: { full_name: string } | null
  event_concept_votes: { vote_value: number; user_id: string }[]
}

interface Props {
  events: Event[]
  concepts: Concept[]
  currentUserId?: string
  currentUserRole: string
}

const EVENT_COLORS = ['#6C63FF', '#FF8C69', '#4ECDC4', '#FF6B9D', '#74B9FF']
const EVENT_BG = ['#EEEEFF', '#FFF3EE', '#EEFAF9', '#FFF0F5', '#F0F8FF']

export function EventsClient({ events, concepts, currentUserId, currentUserRole }: Props) {
  const [activeTab, setActiveTab] = useState<'events' | 'ideas'>('events')

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px' }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
          ISTE SCTCE
        </p>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
          Events & Ideas
        </h1>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>
          Workshops, hackathons & community ideas
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '0 20px 20px' }}>
        <div
          style={{
            display: 'flex', gap: 4, padding: 4,
            background: '#EEEEFF', borderRadius: 16,
          }}
        >
          {(['events', 'ideas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: activeTab === tab ? '#6C63FF' : 'transparent',
                color: activeTab === tab ? 'white' : '#8B85A8',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: 13,
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'events' ? 'Events' : 'Ideas Forum'}
            </button>
          ))}
        </div>
      </div>

      {/* Events tab */}
      {activeTab === 'events' && (
        <div style={{ padding: '0 20px' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Calendar size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 18, color: '#2D2845', margin: '0 0 8px' }}>No events yet</p>
              <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8' }}>Check back soon for upcoming events!</p>
            </div>
          ) : events.map((event, i) => {
            const color = EVENT_COLORS[i % EVENT_COLORS.length]
            const bg = EVENT_BG[i % EVENT_BG.length]
            return (
              <div key={event.id} className="glass-card" style={{ marginBottom: 12 }}>
                {/* Colored left strip */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0, minHeight: 60 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, color: '#2D2845', margin: 0 }}>
                        {event.title}
                      </p>
                      {event.registration_required && (
                        <span style={{ background: bg, color, fontSize: 9, fontFamily: 'Inter', fontWeight: 700, padding: '4px 8px', borderRadius: 50, flexShrink: 0 }}>
                          REG. REQUIRED
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 16 }}>
                      {event.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#8B85A8" />
                          <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8' }}>{event.venue}</span>
                        </div>
                      )}
                      {event.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="#8B85A8" />
                          <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8' }}>
                            {typeof event.date === 'string' ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : event.date}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ideas Forum tab */}
      {activeTab === 'ideas' && (
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', marginBottom: 12 }}>
            Community Ideas ({concepts.length})
          </p>
          {concepts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <MessageSquare size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 18, color: '#2D2845', margin: '0 0 8px' }}>No ideas yet</p>
              <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8' }}>Be the first to share an event idea!</p>
            </div>
          ) : concepts.map((concept, i) => {
            const upvotes = concept.event_concept_votes?.filter(v => v.vote_value > 0).length || 0
            const downvotes = concept.event_concept_votes?.filter(v => v.vote_value < 0).length || 0
            const netVotes = upvotes - downvotes
            return (
              <div key={concept.id} className="glass-card" style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, color: '#2D2845', margin: '0 0 6px' }}>
                  {concept.title}
                </p>
                {concept.description && (
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {concept.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8', margin: 0 }}>
                    by {(concept.profiles as any)?.full_name || 'Member'} · {new Date(concept.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ThumbsUp size={13} color="#6C63FF" />
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#6C63FF' }}>{upvotes}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ThumbsDown size={13} color="#FF6B6B" />
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#FF6B6B' }}>{downvotes}</span>
                    </div>
                    <span style={{
                      background: netVotes >= 0 ? '#EEEEFF' : '#FFF0F5',
                      color: netVotes >= 0 ? '#6C63FF' : '#FF6B9D',
                      fontFamily: 'Inter', fontWeight: 700, fontSize: 11,
                      padding: '4px 10px', borderRadius: 50,
                    }}>
                      Net: {netVotes >= 0 ? '+' : ''}{netVotes}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

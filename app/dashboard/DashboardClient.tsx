'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Bell, MessageSquare, BookOpen, Rocket, Trophy, Lightbulb,
  ShieldCheck, ArrowRight, TrendingUp, Users, FileText, Zap,
  ChevronRight, Calculator, Atom, Code2, Cpu, Download,
} from 'lucide-react'
import { logout } from '@/app/login/actions'
import { WhatTheHackModal } from '@/app/components/WhatTheHackModal'

interface Props {
  displayName: string
  displayRole: string
  displayDept: string
  userXP: number
  totalMembers: number
  totalNotes: number
  totalProjects: number
  isExec: boolean
  coreMember: boolean
  events: any[]
  userEmail?: string | null
}


const ROLE_LABELS: Record<string, string> = {
  core: 'Core', exec: 'Execom', admin: 'Admin', member: 'Member',
}

const QUICK_ACTIONS = [
  {
    title: 'Study Notes',
    subtitle: 'Notes & PYQs',
    icon: BookOpen,
    color: '#6C63FF',
    bg: '#EEEEFF',
    href: '/notes',
  },
  {
    title: 'Idea Presentation',
    subtitle: 'Your ideas',
    icon: Lightbulb,
    color: '#4ECDC4',
    bg: '#EEFAF9',
    href: '/events',
  },
  {
    title: 'Projects',
    subtitle: 'Build & earn XP',
    icon: Rocket,
    color: '#FF8C69',
    bg: '#FFF3EE',
    href: '/projects',
  },
  {
    title: 'Leaderboard',
    subtitle: 'Top students',
    icon: Trophy,
    color: '#FF6B9D',
    bg: '#FFF0F5',
    href: '/leaderboard',
  },
]

const SUBJECT_COLORS = ['#6C63FF', '#FF8C69', '#4ECDC4', '#FF6B9D']
const SUBJECT_BG = ['#EEEEFF', '#FFF3EE', '#EEFAF9', '#FFF0F5']
const SUBJECT_ICONS = [Calculator, Atom, Code2, Cpu]

function getSubjects(dept: string) {
  const map: Record<string, string[]> = {
    CSE: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks'],
    ECE: ['Signals & Systems', 'Digital Electronics', 'VLSI Design', 'Microprocessors'],
    ME:  ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'Strength of Materials'],
    MEA: ['Auto Engineering', 'IC Engines', 'Vehicle Dynamics', 'Transmission'],
    BT:  ['Biochemistry', 'Microbiology', 'Genetics', 'Bioprocess Engineering'],
  }
  return map[dept] || map['CSE']
}

function CalendarWidget() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="glass-card" style={{ margin: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, color: '#2D2845' }}>
          {monthNames[month]} {year}
        </span>
        <span style={{
          background: '#EEEEFF', color: '#6C63FF', fontSize: 10, fontWeight: 700,
          fontFamily: 'Inter', padding: '4px 10px', borderRadius: 50,
        }}>
          Today: {today}
        </span>
      </div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: '#8B85A8' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: d === today ? 800 : 500,
              color: d === today ? 'white' : d ? '#2D2845' : 'transparent',
              background: d === today ? 'linear-gradient(135deg, #8B7FFF, #6C63FF)' : 'transparent',
              borderRadius: 8,
              padding: '6px 2px',
              boxShadow: d === today ? '0 4px 12px rgba(108,99,255,0.3)' : 'none',
            }}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardClient({
  displayName, displayRole, displayDept, userXP,
  totalMembers, totalNotes, totalProjects, isExec, coreMember, events, userEmail,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const firstName = displayName.split(' ')[0] || 'Student'
  const subjects = getSubjects(displayDept)

  useEffect(() => { setMounted(true) }, [])

  const a = (delay: string) => mounted
    ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.4s ease ${delay}, transform 0.4s ease ${delay}` }
    : { opacity: 0, transform: 'translateY(8px)' }

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F8F6FF', paddingBottom: 104, overflowX: 'hidden' }}
    >
      <WhatTheHackModal userEmail={userEmail} />

      {/* ── Header ── */}
      <div
        style={{ padding: '48px 20px 8px', ...a('0s') }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <Link href="/settings">
            <div
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #9F97FF, #6C63FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(108,99,255,0.25)',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: 18 }}>
                {firstName[0]?.toUpperCase() || 'S'}
              </span>
            </div>
          </Link>
          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, color: '#2D2845', lineHeight: 1, margin: 0 }}>
              Hi, {firstName} 👋
            </p>
            <div style={{ marginTop: 3 }}>
              <span className="role-badge">
                {ROLE_LABELS[displayRole] || 'Member'}
              </span>
            </div>
          </div>
          {/* Forum icon */}
          <Link href="/events">
            <div style={{
              width: 42, height: 42, borderRadius: 14, background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(108,99,255,0.08)', cursor: 'pointer',
            }}>
              <MessageSquare size={20} color="#8B85A8" />
            </div>
          </Link>
          {/* Notification bell */}
          <Link href="/events">
            <div style={{
              width: 42, height: 42, borderRadius: 14, background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(108,99,255,0.08)', cursor: 'pointer',
              position: 'relative',
            }}>
              <Bell size={20} color="#8B85A8" />
              {/* Notification badge */}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%', background: '#6C63FF',
              }} />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Headline ── */}
      <div style={{ padding: '20px 20px 0', ...a('0.1s') }}>
        <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 26, color: '#2D2845', lineHeight: 1.2, margin: 0 }}>
          What would you like{'\n'}to learn today?
        </p>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#8B85A8', marginTop: 6 }}>
          Pick up right where you left off.
        </p>
      </div>

      {/* ── XP + Stats Strip ── */}
      <div style={{ padding: '16px 20px 0', ...a('0.15s') }}>
        <div style={{
          display: 'flex', gap: 10,
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #8B7FFF, #6C63FF)',
          borderRadius: 20,
        }}>
          {[
            { label: 'Your XP', value: userXP, icon: Zap },
            { label: 'Members', value: totalMembers, icon: Users },
            { label: 'Notes', value: totalNotes, icon: FileText },
            { label: 'Projects', value: totalProjects, icon: Rocket },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <Icon size={14} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: 'white', margin: 0 }}>
                {value.toLocaleString()}
              </p>
              <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Courses ── */}
      <div style={{ padding: '26px 20px 0', ...a('0.2s') }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="section-label">Featured Courses</p>
          <Link href="/notes" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#6C63FF', textDecoration: 'none' }}>
            See all
          </Link>
        </div>

        {/* Card 1 — Video Lectures */}
        <Link href="/notes" style={{ textDecoration: 'none' }}>
          <div
            style={{
              borderRadius: 24, overflow: 'hidden', marginBottom: 14, cursor: 'pointer',
              background: 'linear-gradient(135deg, #9F97FF, #6C63FF)',
              padding: '24px 20px',
              position: 'relative',
              minHeight: 120,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'absolute', right: -20, top: -20,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            <div>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: 'white', margin: 0 }}>
                Video Lectures
              </p>
              <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
                Watch topic-wise video tutorials for your subjects
              </p>
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 12,
                padding: '8px 16px', borderRadius: 50, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                Start Watching <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2 — Subject Notes */}
        <Link href="/notes" style={{ textDecoration: 'none' }}>
          <div
            style={{
              borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFAA85, #FF8C69)',
              padding: '24px 20px',
              position: 'relative',
              minHeight: 120,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'absolute', right: -20, bottom: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            <div>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: 'white', margin: 0 }}>
                {subjects[0]}
              </p>
              <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
                Study notes, resources, and question papers
              </p>
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 12,
                padding: '8px 16px', borderRadius: 50, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                Start Learning <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Your Subjects ── */}
      {!isExec && (
        <div style={{ ...a('0.22s') }}>
          <div style={{ padding: '26px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="section-label">Your Subjects</p>
            <Link href="/notes" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#6C63FF', textDecoration: 'none' }}>
              See all
            </Link>
          </div>
          <div
            className="no-scrollbar"
            style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px', paddingBottom: 8 }}
          >
            {subjects.map((subject, i) => {
              const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
              const bg = SUBJECT_BG[i % SUBJECT_BG.length]
              const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length]
              const progress = 0.55 + 0.08 * (subject.length % 5)
              return (
                <Link key={i} href="/notes" style={{ textDecoration: 'none' }}>
                  <div
                    className="subject-card"
                    style={{ display: 'flex', flexDirection: 'column', height: 172 }}
                  >
                    <div className="icon-container" style={{ background: bg }}>
                      <Icon size={22} color={color} />
                    </div>
                    <div style={{ flex: 1 }} />
                    <p style={{
                      fontFamily: 'Inter', fontWeight: 800, fontSize: 13, color: '#2D2845',
                      lineHeight: 1.2, margin: '0 0 10px',
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {subject}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1, background: `${color}1F` }}>
                        <div className="progress-bar-fill" style={{ width: `${progress * 100}%`, background: color }} />
                      </div>
                      <ArrowRight size={16} color={color} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ padding: '26px 20px 0', ...a('0.24s') }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {QUICK_ACTIONS.map(({ title, subtitle, icon: Icon, color, bg, href }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div
                className="quick-card"
                style={{ display: 'flex', flexDirection: 'column', minHeight: 120 }}
              >
                <div className="icon-container" style={{ background: bg }}>
                  <Icon size={22} color={color} />
                </div>
                <div style={{ flex: 1 }} />
                <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color: '#2D2845', margin: 0, lineHeight: 1.2 }}>
                  {title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8', margin: 0 }}>
                    {subtitle}
                  </p>
                  <ArrowRight size={16} color={color} />
                </div>
              </div>
            </Link>
          ))}

          {/* Admin tile for exec/core */}
          {isExec && (
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <div className="quick-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 120 }}>
                <div className="icon-container" style={{ background: '#EEEEFF' }}>
                  <ShieldCheck size={22} color="#6C63FF" />
                </div>
                <div style={{ flex: 1 }} />
                <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color: '#2D2845', margin: 0 }}>Admin</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8', margin: 0 }}>Core tools</p>
                  <ArrowRight size={16} color="#6C63FF" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── Recent Events ── */}
      {events.length > 0 && (
        <div style={{ padding: '26px 20px 0', ...a('0.3s') }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="section-label">Upcoming Events</p>
            <Link href="/events" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#6C63FF', textDecoration: 'none' }}>
              See all
            </Link>
          </div>
          {events.map((event, i) => (
            <Link key={event.id || i} href="/events" style={{ textDecoration: 'none' }}>
              <div
                className="glass-card"
                style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <div
                  className="icon-container"
                  style={{
                    background: ['#EEEEFF', '#FFF3EE', '#EEFAF9'][i % 3],
                    flexShrink: 0,
                  }}
                >
                  <Zap size={20} color={['#6C63FF', '#FF8C69', '#4ECDC4'][i % 3]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.title || 'Event'}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '2px 0 0' }}>
                    {event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Upcoming'}
                  </p>
                </div>
                <ChevronRight size={16} color="#8B85A8" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Calendar ── */}
      <div style={{ ...a('0.32s') }}>
        <div style={{ padding: '26px 20px 12px' }}>
          <p className="section-label">Calendar</p>
        </div>
        <CalendarWidget />
      </div>

      {/* ── Contribute ── */}
      <div style={{ padding: '26px 20px 0', ...a('0.35s') }}>
        <div
          className="glass-card"
          style={{ background: '#FFFFFF' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className="icon-container" style={{ background: '#EEEEFF', flexShrink: 0 }}>
              <TrendingUp size={22} color="#6C63FF" />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, letterSpacing: 1.8, color: '#FF8C69', margin: 0 }}>
                CONTRIBUTE
              </p>
              <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color: '#2D2845', margin: 0 }}>
                Share with the community
              </p>
            </div>
          </div>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#FFF3EE', borderRadius: 18, padding: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}
            >
              <Rocket size={22} color="#FF8C69" />
              <p style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 12, color: '#FF8C69', margin: 0 }}>
                Post Project
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '24px 20px 0' }}>
        <form action={logout}>
          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', borderRadius: 50, border: '1px solid rgba(255,107,107,0.2)',
              background: 'rgba(255,107,107,0.05)', color: '#FF6B6B',
              fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

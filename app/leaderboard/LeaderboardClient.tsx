'use client'

import { Trophy, Medal, Star, Zap, Crown } from 'lucide-react'

interface Student {
  full_name: string
  roll_number?: string
  department?: string
  xp: number
  role?: string
}

const DEPT_COLORS: Record<string, string> = {
  CSE: '#6C63FF', ECE: '#FF8C69', ME: '#4ECDC4', MEA: '#FF6B9D', BT: '#74B9FF',
}

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: 'rgba(255,215,0,0.3)', icon: Crown, iconColor: '#FFF' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', shadow: 'rgba(192,192,192,0.3)', icon: Medal, iconColor: '#FFF' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', shadow: 'rgba(205,127,50,0.3)', icon: Star, iconColor: '#FFF' },
]

export function LeaderboardClient({ students }: { students: Student[] }) {
  const top3 = students.slice(0, 3)
  const rest = students.slice(3)

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104 }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 24px' }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>
          COMMUNITY RANKINGS
        </p>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>
          Leaderboard
        </h1>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>
          Top students ranked by XP earned
        </p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div style={{ padding: '0 20px 24px' }}>
          {/* Reorder: 2nd, 1st, 3rd */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
            {[top3[1], top3[0], top3[2]].map((student, visIndex) => {
              const actualIndex = visIndex === 0 ? 1 : visIndex === 1 ? 0 : 2
              if (!student) return <div key={visIndex} style={{ flex: 1 }} />
              const style = RANK_STYLES[actualIndex]
              const height = actualIndex === 0 ? 140 : actualIndex === 1 ? 110 : 90
              const Icon = style.icon
              return (
                <div key={visIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Crown/Medal icon */}
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: style.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 16px ${style.shadow}`,
                      marginBottom: 6,
                    }}
                  >
                    <Icon size={18} color={style.iconColor} />
                  </div>
                  {/* Avatar */}
                  <div
                    style={{
                      width: actualIndex === 0 ? 60 : 48, height: actualIndex === 0 ? 60 : 48,
                      borderRadius: '50%',
                      background: style.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 16px ${style.shadow}`,
                      marginBottom: 8,
                      fontSize: actualIndex === 0 ? 22 : 18,
                      fontFamily: 'Poppins', fontWeight: 900, color: 'white',
                    }}
                  >
                    {student.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 12, color: '#2D2845', textAlign: 'center', margin: '0 0 2px', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.full_name?.split(' ')[0]}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#8B85A8', margin: '0 0 4px' }}>
                    {student.department || 'Member'}
                  </p>
                  {/* Podium base */}
                  <div
                    style={{
                      width: '100%', height: height, borderRadius: '16px 16px 0 0',
                      background: style.bg,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>#{actualIndex + 1}</span>
                    <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 16, color: 'white' }}>
                      {(student.xp || 0).toLocaleString()}
                    </span>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rest of rankings */}
      <div style={{ padding: '0 20px' }}>
        <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: '#2D2845', marginBottom: 12 }}>
          Full Rankings
        </p>
        {students.map((student, i) => {
          const color = DEPT_COLORS[student.department || ''] || '#6C63FF'
          return (
            <div
              key={i}
              className="glass-card"
              style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}
            >
              {/* Rank */}
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: i < 3 ? RANK_STYLES[i].bg : '#F5F3FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Poppins', fontWeight: 900, fontSize: 13,
                color: i < 3 ? 'white' : '#6C63FF', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}44, ${color}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color, flexShrink: 0,
              }}>
                {student.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#2D2845', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.full_name || 'Member'}
                </p>
                <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#8B85A8', margin: '2px 0 0' }}>
                  {student.department || 'ISTE Member'}
                </p>
              </div>
              {/* XP */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Zap size={13} color="#6C63FF" />
                  <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color: '#6C63FF', margin: 0 }}>
                    {(student.xp || 0).toLocaleString()}
                  </p>
                </div>
                <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: '#8B85A8', margin: 0 }}>XP</p>
              </div>
            </div>
          )
        })}

        {students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Trophy size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: 'Inter', fontWeight: 600, color: '#8B85A8' }}>No rankings yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

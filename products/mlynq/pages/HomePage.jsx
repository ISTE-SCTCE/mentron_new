import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { CardSkeleton } from '../components/Skeleton';
import { Calendar, Award, Bell, ChevronRight, User, Clock, MapPin, Tag, QrCode } from 'lucide-react';

const CATEGORY_PILLS = ['All', 'Announcements', 'Workshops', 'Tech Talks', 'Hackathons', 'Meetups', 'Seminars'];

const EVENT_COLORS = ['#DCE9E6', '#E8DFF2', '#F2DFCF'];

function getTypeColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('workshop') || t.includes('basics')) return '#316D60';
  if (t.includes('tech') || t.includes('seminar') || t.includes('geometry')) return '#9B8FCA';
  if (t.includes('meetup') || t.includes('summit') || t.includes('hack')) return '#D97D55';
  return '#D97D55';
}

export default function HomePage() {
  const { user, name, membershipId, isMembershipValid } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [category, setCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const [evRes, annRes, attRes, certRes] = await Promise.all([
        supabase.from('events').select('id,title,date,time,venue,location,type,description,poster_url,is_paid,member_price,non_member_price,allowed_roles').order('date', { ascending: true }),
        supabase.from('announcements').select('id,title,content,visibility,created_at').order('created_at', { ascending: false }),
        supabase.from('member_attendance').select('event_id').eq('user_id', user.id),
        supabase.from('certificates').select('event_id').eq('user_id', user.id),
      ]);
      setEvents(evRes.data || []);
      setAnnouncements(annRes.data || []);

      const attendedEventIds = new Set([
        ...(attRes.data || []).map(r => r.event_id),
        ...(certRes.data || []).map(r => r.event_id),
      ].filter(Boolean));

      setAttendanceCount(attendedEventIds.size);
      setIsLoading(false);
    };
    load();
  }, [user]);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ongoingEvents = events.filter(e => (e.date || '').split('T')[0] === todayStr);
  const upcomingEvents = events.filter(e => (e.date || '').split('T')[0] > todayStr);
  const pastEvents = [...events.filter(e => (e.date || '').split('T')[0] < todayStr)].reverse();

  const filteredItems = (() => {
    if (category === 'All') return [...announcements.map(a => ({ ...a, _type: 'announcement' })), ...events.map(e => ({ ...e, _type: 'event' }))];
    if (category === 'Announcements') return announcements.map(a => ({ ...a, _type: 'announcement' }));
    return events.filter(e => e.type?.toLowerCase() === category.slice(0, -1).toLowerCase() || e.type?.toLowerCase().includes(category.toLowerCase().slice(0, -1))).map(e => ({ ...e, _type: 'event' }));
  })();

  return (
    <DashboardLayout>
      <div className="page-inner">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <header className="m-home-heading"><div><p>YOUR CAMPUS COMPANION</p><h1>Hello, {name?.split(' ')[0] || 'Member'}.</h1><span>A little more connected. A little more you.</span></div><Link to="/profile" aria-label="Open your profile"><User size={24}/></Link></header>
        <section className="m-home-hero"><div><p className="m-kicker">ISTE SCTCE · YOUR CAMPUS PASS</p><h2>Good things happen<br/>when you show up.</h2><p>Keep your attendance QR close. Your next campus moment is waiting.</p><Link to="/qr">Open my attendance QR <QrCode size={20}/></Link></div><div className="m-pass-status"><span className="m-pass-orbit" aria-hidden="true"><QrCode size={58} strokeWidth={1}/></span><strong>{isMembershipValid ? 'Active member' : 'Guest account'}</strong><span>{membershipId || 'Your ISTE community'}</span></div></section>

        <div className="stat-grid">
          {[
            { icon: <Calendar size={20} color="#316D60" />, value: upcomingEvents.length, label: 'Upcoming Events', bg: '#DCE9E6', to: '/events' },
            { icon: <Award size={20} color="#D97D55" />, value: attendanceCount, label: 'Events Attended', bg: '#F2DFCF', to: '/attendance' },
            { icon: <Bell size={20} color="#9B8FCA" />, value: announcements.length, label: 'Announcements', bg: '#E8DFF2', to: '/notifications' },
          ].map(s => (
            <Link key={s.label} to={s.to} className="interactive-lift" style={{ textDecoration: 'none', background: s.bg, borderRadius: 20, padding: '16px 18px', border: '2px solid rgba(40,89,70,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#316D60', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* â”€â”€ DUAL-VIEW GRID: Left feed + Right sidebar â”€â”€ */}
        <div className="dash-grid">

          {/* LEFT COLUMN â€” Feed */}
          <div>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
              {CATEGORY_PILLS.map(c => (
                <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)} className="interactive-lift"
                  style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 20, border: '2px solid', borderColor: category === c ? '#111' : '#D5E4D8', background: category === c ? '#111' : '#fff', color: category === c ? '#fff' : '#316D60', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", whiteSpace: 'nowrap' }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Feed items */}
            {isLoading ? (
              <div className="feed-list">
                {[0, 1, 2].map(k => <CardSkeleton key={k} height={120} />)}
              </div>
            ) : (
              <div className="feed-list">
                {filteredItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: '#316D60', fontFamily: "'Inter',sans-serif" }}>No items found</div>
                )}
                {filteredItems.map((item, i) => {
                  if (item._type === 'announcement') return (
                    <motion.div key={`ann-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}>
                      <Link to="/notifications" className="interactive-lift"
                        style={{ textDecoration: 'none', background: '#fff', borderRadius: 20, padding: '18px 20px', border: '2px solid #D5E4D8', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E8DFF2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bell size={20} color="#9B8FCA" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#316D60', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.content}</div>
                        </div>
                        <ChevronRight size={18} color="#D5E4D8" style={{ flexShrink: 0, marginTop: 2 }} />
                      </Link>
                    </motion.div>
                  );
                  const color = EVENT_COLORS[i % 3];
                  const typeColor = getTypeColor(item.type);
                  const eventVenue = item.venue || item.location;
                  return (
                    <motion.div key={`ev-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
                      className="interactive-lift" style={{ background: color, borderRadius: 20, padding: '18px 20px', border: '2px solid rgba(40,89,70,0.18)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#111', fontSize: 15 }}>{item.title}</span>
                            {item.type && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: typeColor, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '2px 8px', border: `1px solid ${typeColor}30` }}>{item.type}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {item.date && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#316D60', fontWeight: 500 }}>
                                <Clock size={12} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{item.time ? ` â€¢ ${item.time}` : ''}
                              </span>
                            )}
                            {eventVenue && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#316D60', fontWeight: 500 }}>
                                <MapPin size={12} />{eventVenue}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#316D60', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                        <Link to={`/events/${item.id}`} className="interactive-lift"
                          style={{ padding: '8px 18px', background: '#111', color: '#fff', borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", display: 'inline-flex', alignItems: 'center' }}>
                          More Details
                        </Link>
                        <a href="https://istesctce.in/events" target="_blank" rel="noopener noreferrer" className="interactive-lift"
                          style={{ padding: '8px 18px', background: 'rgba(40,89,70,0.18)', color: '#316D60', borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", border: '1.5px solid rgba(95,133,162,0.25)', display: 'inline-flex', alignItems: 'center' }}>
                          Register Now
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN â€” Desktop sidebar (upcoming events + past events) */}
          <div className="dash-grid-right">
            <div className="sidebar-sticky">

              {/* Upcoming Events sidebar card */}
              <div className="sidebar-card" style={{ marginBottom: 16 }}>
                <div className="section-heading">
                  <Calendar size={17} color="#316D60" /> Upcoming Events
                </div>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[0, 1].map(k => <CardSkeleton key={k} height={70} />)}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div style={{ color: '#316D60', fontSize: 13, fontFamily: "'Inter',sans-serif", textAlign: 'center', padding: '24px 0' }}>No upcoming events</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {upcomingEvents.slice(0, 5).map((ev, i) => (
                      <motion.div key={ev.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: i * 0.06 }}>
                        <Link to={`/events/${ev.id}`} style={{ textDecoration: 'none', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 14, background: '#F0F4ED', border: '1.5px solid rgba(95,133,162,0.12)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#D5E4D8'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F0F4ED'}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: EVENT_COLORS[i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Calendar size={16} color={getTypeColor(ev.type)} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#316D60', marginTop: 2 }}>
                              {ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'â€”'}{ev.venue ? ` â€¢ ${ev.venue}` : ''}
                            </div>
                          </div>
                          <ChevronRight size={14} color="#D5E4D8" style={{ flexShrink: 0, marginTop: 4 }} />
                        </Link>
                      </motion.div>
                    ))}
                    {upcomingEvents.length > 5 && (
                      <Link to="/events" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#316D60', padding: '6px 0', textDecoration: 'none', fontFamily: "'Inter',sans-serif" }}>
                        +{upcomingEvents.length - 5} more â†’
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Past Events sidebar card */}
              {!isLoading && pastEvents.length > 0 && (
                <div className="sidebar-card">
                  <div className="section-heading">
                    <Tag size={16} color="#D97D55" /> Recent Past
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pastEvents.slice(0, 3).map((ev, i) => (
                      <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#f8f8f8', border: '1.5px solid rgba(95,133,162,0.1)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F2DFCF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Tag size={14} color="#D97D55" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: '#316D60', fontFamily: "'Inter',sans-serif" }}>
                            {ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'â€”'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

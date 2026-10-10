// src/pages/HistoryPage.jsx
// Members can look back at every event they've attended — pulls from the
// `attendance` table joined to `events`, ordered most-recent-first.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { CardSkeleton } from '../components/Skeleton';
import { Calendar, MapPin, Clock, Search, Award, History as HistoryIcon } from 'lucide-react';

// ── Design tokens (matches CertificatesPage) ────────────────────────────────
const T = {
  bg:         '#FAF6EC',
  navy:       '#1B2A4A',
  gold:       '#C9A227',
  teal:       '#2F6F6E',
  lavender:   '#6B4E9E',
  muted:      '#6b6558',
  caption:    '#8a8371',
  cardSurf:   '#FFFDF8',
  cardBorder: '#E7DFC9',
  divider:    '#EFE9D8',
};

function sealColor(cat) {
  const c = (cat || '').toLowerCase();
  if (c === 'hackathon') return T.gold;
  if (c === 'workshop')  return T.teal;
  if (c === 'seminar')   return T.lavender;
  return T.navy;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);

      // Query 1: Attendance rows for this user joined to event details
      const attPromise = supabase
        .from('member_attendance')
        .select(`
          id,
          scan_time,
          day_number,
          event_id,
          events
        `)
        .eq('user_id', user.id)
        .order('scan_time', { ascending: false });

      // Query 2: Certificates for this user (including Drive link & direct admin publish without QR scans)
      const certPromise = supabase
        .from('certificates')
        .select('id, event_id, student_name, user_id, certificate_url, file_url, title, description, issued_at')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      const [attRes, certRes] = await Promise.all([attPromise, certPromise]);

      if (cancelled) return;

      if (attRes.error) {
        setError(attRes.error.message);
        setIsLoading(false);
        return;
      }

      // Group attendance rows by event_id
      const grouped = new Map();
      for (const row of attRes.data || []) {
        if (!row.events) continue;
        const key = row.event_id;
        if (!grouped.has(key)) {
          grouped.set(key, {
            ...row.events,
            daysAttended: [],
            firstScan: row.scan_time,
            lastScan: row.scan_time,
            hasCertificate: false,
          });
        }
        const entry = grouped.get(key);
        entry.daysAttended.push(row.day_number);
        if (new Date(row.scan_time) < new Date(entry.firstScan)) entry.firstScan = row.scan_time;
        if (new Date(row.scan_time) > new Date(entry.lastScan)) entry.lastScan = row.scan_time;
      }

      // Process certificates: mark existing, and collect missing event IDs
      const certs = certRes.data || [];
      const missingEventIds = [];

      for (const cert of certs) {
        if (grouped.has(cert.event_id)) {
          grouped.get(cert.event_id).hasCertificate = true;
          grouped.get(cert.event_id).certificateUrl = cert.certificate_url || cert.file_url;
        } else if (cert.event_id) {
          missingEventIds.push(cert.event_id);
        }
      }

      // Fetch event rows for events that have certificates but no QR attendance record
      if (missingEventIds.length > 0) {
        const uniqueMissingIds = [...new Set(missingEventIds)];
        const { data: missingEvents } = await supabase
          .from('events')
          .select('id, title, description, date, location, category, poster_url, num_days, coordinator_name, chair_name')
          .in('id', uniqueMissingIds);

        for (const ev of missingEvents || []) {
          const cert = certs.find(c => c.event_id === ev.id);
          grouped.set(ev.id, {
            ...ev,
            daysAttended: [],
            firstScan: null,
            lastScan: null,
            issuedAt: cert?.issued_at || ev.date,
            hasCertificate: true,
            certificateUrl: cert?.certificate_url || cert?.file_url,
          });
        }
      }

      // Sort history descending by event date or scan/issue date
      const sortedHistory = Array.from(grouped.values()).sort((a, b) => {
        const dateA = new Date(a.date || a.lastScan || a.issuedAt || 0);
        const dateB = new Date(b.date || b.lastScan || b.issuedAt || 0);
        return dateB - dateA;
      });

      setHistory(sortedHistory);
      setIsLoading(false);
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [user?.id]);

  const years = useMemo(() => {
    const set = new Set(history.map((e) => (e.date || e.issuedAt) ? new Date(e.date || e.issuedAt).getFullYear() : null).filter(Boolean));
    return ['All', ...Array.from(set).sort((a, b) => b - a)];
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((e) => {
      const matchesSearch = !search || (e.title || '').toLowerCase().includes(search.toLowerCase());
      const eventYear = (e.date || e.issuedAt) ? new Date(e.date || e.issuedAt).getFullYear() : null;
      const matchesYear = yearFilter === 'All' || eventYear === yearFilter;
      return matchesSearch && matchesYear;
    });
  }, [history, search, yearFilter]);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 20px 100px', background: T.bg, minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <HistoryIcon size={22} color={T.navy} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.navy, margin: 0 }}>
            Event History
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: T.caption, margin: '4px 0 20px 0' }}>
          {history.length} event{history.length !== 1 ? 's' : ''} in your history
        </p>

        {/* Search + year filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px',
            background: T.cardSurf, border: `1px solid ${T.cardBorder}`, borderRadius: '10px',
            padding: '10px 14px',
          }}>
            <Search size={16} color={T.caption} />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '14px', color: T.navy }}
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            style={{
              padding: '10px 14px', borderRadius: '10px', border: `1px solid ${T.cardBorder}`,
              background: T.cardSurf, color: T.navy, fontSize: '14px', cursor: 'pointer',
            }}
          >
            {years.map((y) => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#b91c1c', fontSize: '14px' }}>
            Couldn't load history: {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <HistoryIcon size={40} color={T.cardBorder} style={{ marginBottom: '12px' }} />
            <p style={{ color: T.caption, fontSize: '14px', margin: 0 }}>
              {history.length === 0
                ? "You haven't attended any events yet — check the Events tab to find upcoming ones."
                : "No events match your search."}
            </p>
          </div>
        )}

        {/* Event cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((event, i) => {
            const color = sealColor(event.category);
            const daysLabel = event.daysAttended.length > 1
              ? `Attended ${event.daysAttended.length}/${event.num_days || event.daysAttended.length} days`
              : `Day ${event.daysAttended[0]}`;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onClick={() => navigate(`/events/${event.id}`)}
                className="interactive-lift"
                style={{
                  display: 'flex', gap: '14px', background: T.cardSurf,
                  border: `1px solid ${T.cardBorder}`, borderRadius: '14px',
                  padding: '14px', cursor: 'pointer',
                }}
              >
                {/* Category seal */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                  background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${color}40`,
                }}>
                  <Calendar size={20} color={color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: T.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </h3>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: color, background: `${color}15`,
                      padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {event.category || 'Event'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: T.muted }}>
                      <Calendar size={12} /> {formatDate(event.date || event.issuedAt)}
                    </span>
                    {event.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: T.muted }}>
                        <MapPin size={12} /> {event.location}
                      </span>
                    )}
                    {event.firstScan ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: T.muted }}>
                        <Clock size={12} /> Checked in {formatTime(event.firstScan)}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: T.gold, fontWeight: 600 }}>
                        <Award size={12} color={T.gold} /> Certificate Issued
                      </span>
                    )}
                    {event.hasCertificate && event.firstScan && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: T.gold, fontWeight: 600 }}>
                        <Award size={12} color={T.gold} /> Certificate Ready
                      </span>
                    )}
                  </div>

                  {(event.num_days || 1) > 1 && event.daysAttended.length > 0 && (
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', color: T.teal, fontWeight: 600 }}>
                      {daysLabel}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { RefreshCw, Bell } from 'lucide-react';

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NotificationsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('announcements').select().order('created_at', { ascending: false }).limit(30);
    setAnnouncements(data || []);
  };

  useEffect(() => { load().finally(() => setIsLoading(false)); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isNew = (ann) => ann.created_at && (new Date() - new Date(ann.created_at)) < 2 * 24 * 60 * 60 * 1000;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px', background: '#F0F4ED', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: '#214C3D', marginBottom: 4 }}>Notifications</h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#52685C' }}>Club announcements and updates</p>
          </div>
          <button aria-label="Refresh notifications" onClick={handleRefresh} disabled={refreshing} style={{ width: 40, height: 40, borderRadius: 12, background: '#E2EBDD', border: '1px solid #D0DDC9', color: '#8B4D2D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #D0DDC9', borderTopColor: '#8B4D2D', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Bell size={60} color="#D0DDC9" style={{ marginBottom: 20 }} />
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 600, color: '#65766C' }}>No announcements yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-in">
            {announcements.map(ann => {
              const newItem = isNew(ann);
              return (
                <div key={ann.id} style={{ background: '#FFFEF7', borderRadius: '5px 24px 5px 24px', padding: '18px 20px', border: `1.5px solid ${newItem ? 'rgba(217,125,85,0.4)' : 'rgba(255,255,255,0.07)'}`, transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(58,175,169,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={20} color="#316D60" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#214C3D', lineHeight: 1.3 }}>{ann.title}</h3>
                        {newItem && (
                          <span style={{ flexShrink: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, color: '#8B4D2D', background: 'rgba(217,125,85,0.15)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(217,125,85,0.3)' }}>NEW</span>
                        )}
                      </div>
                      {ann.content && (
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#52685C', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 10 }}>
                          {ann.content}
                        </p>
                      )}
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#65766C' }}>
                        {ann.created_at ? timeAgo(ann.created_at) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

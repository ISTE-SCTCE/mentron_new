import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Home, Calendar, Award, Bell, User, LogOut, Menu, X, History, QrCode } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import StudentQrModal from './StudentQrModal';

const navItems = [
  { path: '/home', icon: <Home size={18} />, label: 'Home' },
  { path: '/qr', icon: <QrCode size={18} />, label: 'My QR' },
  { path: '/events', icon: <Calendar size={18} />, label: 'Events' },
  { path: '/attendance', icon: <GraduationCap size={18} />, label: 'Attendance' },
  { path: '/certificates', icon: <Award size={18} />, label: 'Certificates' },
  { path: '/history', icon: <History size={18} />, label: 'History' },
  { path: '/notifications', icon: <Bell size={18} />, label: 'Notifications' },
  { path: '/profile', icon: <User size={18} />, label: 'Profile' },
];

export default function DashboardLayout({ children }) {
  const { name, membershipId, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector('button')?.focus();
    const keyboard = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const controls = drawerRef.current?.querySelectorAll('button, a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [mobileOpen]);

  const avatarUrl = name ? `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(name)}` : null;

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#5F85A2,#3a5c7a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: '#111', lineHeight: 1.2 }}>Mlynq</div>
          <div style={{ fontSize: 11, color: '#5F85A2', fontWeight: 500 }}>ISTE Portal</div>
        </div>
      </div>

      {/* Quick QR Button */}
      <button
        onClick={() => {
          setMobileOpen(false);
          setQrModalOpen(true);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '11px 14px',
          background: 'linear-gradient(135deg, #1a1a24 0%, #121218 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          color: '#fff',
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        }}
      >
        <QrCode size={17} color="#3AAFA9" />
        <span>Show Attendance QR</span>
      </button>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)}
              className="interactive-lift"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14, marginBottom: 4, textDecoration: 'none', transition: 'all 0.15s', color: active ? '#111' : '#5F85A2', background: active ? '#D3E3F0' : 'transparent', fontWeight: active ? 600 : 500, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div style={{ borderTop: '1.5px solid #D3E3F0', paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #D3E3F0' }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#D3E3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#5F85A2" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'Member'}</div>
            <div style={{ fontSize: 11, color: '#5F85A2', fontFamily: "'Inter',sans-serif" }}>{membershipId ? `ID: ${membershipId}` : 'Guest'}</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="interactive-lift" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'rgba(217,125,85,0.1)', border: '1px solid rgba(217,125,85,0.2)', borderRadius: 12, color: '#D97D55', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="creative-dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#EBF3FC' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1.5px solid #D3E3F0', position: 'fixed', top: 72, left: 0, height: 'calc(100dvh - 72px)', overflowY: 'auto', zIndex: 40, display: 'none' }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar with smooth slide-in and backdrop fade */}
      <AnimatePresence>
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2100 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              ref={drawerRef} role="dialog" aria-modal="true" aria-label="Mlynq navigation"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'absolute', left: 0, top: 0, width: 260, height: '100%', background: '#fff', overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}
            >
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" style={{display:'flex',alignItems:'center',gap:8,margin:'16px 16px 0',padding:8,color:'#184d46'}}><X size={20}/> Close</button>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile header */}
      <div style={{ position: 'fixed', top: 72, left: 0, right: 0, height: 60, background: '#fff', borderBottom: '1.5px solid #D3E3F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 30 }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#5F85A2,#3a5c7a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#111' }}>Mlynq</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setQrModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: '#111',
              color: '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Grotesk',sans-serif",
              cursor: 'pointer',
            }}
          >
            <QrCode size={14} color="#3AAFA9" />
            <span>QR</span>
          </button>
          <button aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5F85A2', padding: 6, minWidth:44 }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="dashboard-main" style={{ flex: 1 }}>
        <div key={location.pathname} className="creative-page-enter">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Bar (App Experience on Phones) */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1.5px solid #D3E3F0',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 35,
        padding: '0 8px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        <Link to="/home" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          textDecoration: 'none',
          color: location.pathname === '/home' ? '#111' : '#5F85A2',
          fontWeight: location.pathname === '/home' ? 700 : 500,
          fontSize: 11,
          fontFamily: "'Inter', sans-serif"
        }}>
          <Home size={20} color={location.pathname === '/home' ? '#111' : '#5F85A2'} />
          <span>Home</span>
        </Link>
        <Link to="/events" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          textDecoration: 'none',
          color: location.pathname.startsWith('/events') ? '#111' : '#5F85A2',
          fontWeight: location.pathname.startsWith('/events') ? 700 : 500,
          fontSize: 11,
          fontFamily: "'Inter', sans-serif"
        }}>
          <Calendar size={20} color={location.pathname.startsWith('/events') ? '#111' : '#5F85A2'} />
          <span>Events</span>
        </Link>
        {/* Center Floating QR Action Button */}
        <button
          onClick={() => setQrModalOpen(true)}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #181824 0%, #121218 100%)',
            border: '2px solid rgba(58, 175, 169, 0.6)',
            boxShadow: '0 4px 16px rgba(58, 175, 169, 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transform: 'translateY(-10px)',
            transition: 'transform 0.15s ease'
          }}
          title="Show My Attendance QR"
        >
          <QrCode size={22} color="#3AAFA9" />
        </button>
        <Link to="/certificates" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          textDecoration: 'none',
          color: location.pathname === '/certificates' ? '#111' : '#5F85A2',
          fontWeight: location.pathname === '/certificates' ? 700 : 500,
          fontSize: 11,
          fontFamily: "'Inter', sans-serif"
        }}>
          <Award size={20} color={location.pathname === '/certificates' ? '#111' : '#5F85A2'} />
          <span>Certs</span>
        </Link>
        <Link to="/profile" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          textDecoration: 'none',
          color: location.pathname === '/profile' ? '#111' : '#5F85A2',
          fontWeight: location.pathname === '/profile' ? 700 : 500,
          fontSize: 11,
          fontFamily: "'Inter', sans-serif"
        }}>
          <User size={20} color={location.pathname === '/profile' ? '#111' : '#5F85A2'} />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Dynamic Student QR Modal Accessible Everywhere */}
      <StudentQrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />

      <style>{`
        @media (min-width: 901px) {
          .desktop-sidebar { display: block !important; }
          .mobile-header { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .dashboard-main { margin-left: 240px; }
        }
        @media (max-width: 900px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .dashboard-main { padding-top: 60px; padding-bottom: 76px; }
        }
      `}</style>
    </div>
  );
}

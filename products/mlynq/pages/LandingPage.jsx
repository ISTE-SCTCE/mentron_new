import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap, Calendar, Award, Bell, User,
  ArrowRight, CheckCircle, Zap, Shield, BookOpen,
  QrCode, Check, ChevronRight
} from 'lucide-react';

/* ─── ISTE logo as inline SVG (small badge) ─────────────────────────────── */
function ISTELogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="12" fill="rgba(58,175,169,0.18)" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif" fontWeight="800" fontSize="14" fill="#3AAFA9">
        ISTE
      </text>
    </svg>
  );
}

/* ─── Animated login mockup for hero right column ───────────────────────── */
function LoginMockup() {
  const controls = useAnimation();
  const btnControls = useAnimation();
  const rippleControls = useAnimation();
  const dashControls = useAnimation();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let running = true;

    async function loop() {
      while (running && mountedRef.current) {
        // Reset
        controls.set({ x: 0, y: 0, opacity: 1 });
        btnControls.set({ scale: 1, background: 'linear-gradient(135deg, #5F85A2 0%, #3a5c7a 100%)' });
        rippleControls.set({ opacity: 0, scale: 0 });
        dashControls.set({ opacity: 0 });

        await new Promise(r => setTimeout(r, 600));

        // Cursor glide to Sign In button
        await controls.start({ x: 90, y: 70, transition: { duration: 1.4, ease: 'easeInOut' } });
        await new Promise(r => setTimeout(r, 200));

        // Click: button scale down + ripple
        await Promise.all([
          btnControls.start({ scale: 0.93, transition: { duration: 0.12 } }),
          rippleControls.start({ opacity: 0.7, scale: 2.4, transition: { duration: 0.35, ease: 'easeOut' } }),
        ]);

        await btnControls.start({
          scale: 1,
          background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
          transition: { duration: 0.25 }
        });

        // Ripple fade
        await rippleControls.start({ opacity: 0, transition: { duration: 0.3 } });

        // Cursor hides
        await controls.start({ opacity: 0, transition: { duration: 0.2 } });

        await new Promise(r => setTimeout(r, 300));

        // Dashboard slides in
        await dashControls.start({ opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } });

        // Hold dashboard visible
        await new Promise(r => setTimeout(r, 1800));

        // Dashboard fades out
        await dashControls.start({ opacity: 0, transition: { duration: 0.4 } });
        await new Promise(r => setTimeout(r, 400));
      }
    }

    loop();
    return () => {
      running = false;
      mountedRef.current = false;
    };
  }, [controls, btnControls, rippleControls, dashControls]);

  return (
    <div style={{
      width: 340,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(58,175,169,0.1)',
      position: 'relative',
      userSelect: 'none',
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 36,
        background: 'rgba(9,13,22,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
        <div style={{ flex: 1, marginLeft: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 18, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
          <span style={{ fontSize: 9, color: 'rgba(211,227,240,0.4)', fontFamily: "'Inter', sans-serif" }}>mlynq.istesctce.in</span>
        </div>
        {/* ISTE logo badge — top-right corner */}
        <div style={{ marginLeft: 4, opacity: 0.75 }}>
          <ISTELogo size={22} />
        </div>
      </div>

      {/* Login form body */}
      <div style={{ position: 'relative', padding: '28px 28px 24px' }}>
        {/* Login card */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #3AAFA9, #2B7A78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 6px 20px rgba(58,175,169,0.35)'
          }}>
            <GraduationCap size={24} color="#fff" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9', fontFamily: "'Space Grotesk', sans-serif" }}>
            M-Lynq
          </div>
          <div style={{ fontSize: 11, color: 'rgba(211,227,240,0.5)', fontFamily: "'Inter', sans-serif", marginTop: 3 }}>
            ISTE SCTCE Member Portal
          </div>
        </div>

        {/* Email field */}
        <div style={{
          border: '1px solid rgba(211,227,240,0.15)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 10,
          fontSize: 13,
          color: 'rgba(211,227,240,0.4)',
          fontFamily: "'Inter', sans-serif",
          background: 'rgba(255,255,255,0.03)',
        }}>
          student@sctce.ac.in
        </div>

        {/* Password field */}
        <div style={{
          border: '1px solid rgba(211,227,240,0.15)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 20,
          fontSize: 13,
          color: 'rgba(211,227,240,0.25)',
          fontFamily: "'Inter', sans-serif",
          background: 'rgba(255,255,255,0.03)',
        }}>
          ••••••••
        </div>

        {/* Sign In button — animated */}
        <div style={{ position: 'relative' }}>
          {/* Ripple ring */}
          <motion.div
            animate={rippleControls}
            initial={{ opacity: 0, scale: 0 }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 120, height: 44,
              marginLeft: -60, marginTop: -22,
              borderRadius: 24,
              background: 'rgba(58,175,169,0.3)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <motion.div
            animate={btnControls}
            initial={{ scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 0',
              background: 'linear-gradient(135deg, #5F85A2 0%, #3a5c7a 100%)',
              color: '#fff',
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={15} />
          </motion.div>
        </div>

        {/* Overlay: mini dashboard preview */}
        <motion.div
          animate={dashControls}
          initial={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(9,13,22,0.97)',
            borderRadius: '0 0 22px 22px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3AAFA9', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
            ✓ Signed in — Welcome back!
          </div>
          {[
            { label: 'Events Attended', val: '12', color: '#D9E9F9' },
            { label: 'Certificates Earned', val: '8', color: '#E8E2F5' },
            { label: 'Next Event', val: 'Offenso 2026', color: '#FBE4D5' },
          ].map(c => (
            <div key={c.label} style={{
              background: c.color,
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#111', fontFamily: "'Inter', sans-serif" }}>{c.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#333' }}>{c.val}</span>
            </div>
          ))}
        </motion.div>

        {/* Animated cursor dot */}
        <motion.div
          animate={controls}
          initial={{ x: 0, y: 0, opacity: 1 }}
          style={{
            position: 'absolute',
            top: 32, left: 20,
            width: 14, height: 14,
            borderRadius: '50% 50% 50% 0',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            zIndex: 10,
            transform: 'rotate(-45deg)',
          }}
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, name } = useAuth();

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh', background: '#090D16', color: '#F1F5F9', overflowX: 'clip' }}>

      {/* BACKGROUND GLOW EFFECTS */}
      <div style={{ position: 'fixed', top: 0, left: '20%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,175,169,0.12) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 0, right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(95,133,162,0.15) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* TOP NAVIGATION */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px clamp(16px, 4vw, 40px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 72,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(9, 13, 22, 0.85)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(58,175,169,0.3)'
          }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.5px', color: '#fff' }}>M-Lynq</span>
              <span style={{ fontSize: 10, color: '#3AAFA9', fontWeight: 700, background: 'rgba(58,175,169,0.15)', border: '1px solid rgba(58,175,169,0.3)', padding: '1px 6px', borderRadius: 20 }}>
                ISTE SCTCE
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(211,227,240,0.6)', fontFamily: "'Inter', sans-serif" }}>Member Gateway</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <Link
              to="/home"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
                color: '#fff',
                borderRadius: 24,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 4px 14px rgba(58,175,169,0.25)'
              }}
            >
              <span>{name ? `Hi, ${name.split(' ')[0]}` : 'Dashboard'}</span>
              <ChevronRight size={15} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: '8px 16px',
                  color: '#D3E3F0',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'color 0.15s'
                }}
              >
                Sign In
              </Link>
              <Link
                to="/login"
                style={{
                  padding: '9px 18px',
                  background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
                  color: '#fff',
                  borderRadius: 24,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: '0 4px 16px rgba(58,175,169,0.3)'
                }}
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION — Two-column split */}
      <section style={{
        position: 'relative',
        padding: 'clamp(50px, 8vw, 90px) clamp(16px, 4vw, 40px) 40px',
        maxWidth: 1200,
        margin: '0 auto',
        zIndex: 1,
      }}>
        <style>{`
          @keyframes heroGrid { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          @media (max-width: 900px) {
            .hero-grid { flex-direction: column !important; }
            .hero-right { margin-top: 48px; display: flex; justify-content: center; }
            .hero-mockup-wrap { transform: scale(0.88); transform-origin: center top; }
          }
        `}</style>

        <div className="hero-grid" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(32px, 6vw, 80px)' }}>

          {/* ── LEFT COLUMN — copy ──────────────────────────────────── */}
          <div style={{ flex: '1 1 420px', minWidth: 0, animation: 'heroGrid 0.7s ease-out both' }}>
            {/* Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(58, 175, 169, 0.1)',
              border: '1px solid rgba(58, 175, 169, 0.3)',
              borderRadius: 28,
              padding: '6px 16px',
              marginBottom: 24
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3AAFA9', boxShadow: '0 0 10px #3AAFA9' }} />
              <span style={{ fontSize: 13, color: '#D3E3F0', fontWeight: 600, letterSpacing: '0.2px' }}>
                ISTE Student Chapter — Member Portal
              </span>
            </div>

            {/* Hero Title */}
            <h1 style={{
              fontSize: 'clamp(34px, 5.5vw, 62px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              marginBottom: 20,
              textAlign: 'left',
            }}>
              Learn Something New Today.<br />
              <span style={{
                background: 'linear-gradient(135deg, #3AAFA9 0%, #7FD1AE 50%, #E8A87C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Campus Life, Unified.
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              color: 'rgba(211, 227, 240, 0.75)',
              maxWidth: 520,
              marginBottom: 36,
              lineHeight: 1.65,
              fontFamily: "'Inter', sans-serif",
              textAlign: 'left',
            }}>
              Your all-in-one portal for event registration, instant attendance verification, and custom-issued digital certificates — crafted for a first-class experience on both mobile and PC.
            </p>

            {/* Hero Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0, justifyContent: 'flex-start' }}>
              <Link
                to={isAuthenticated ? "/home" : "/login"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 28px',
                  background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
                  color: '#fff',
                  borderRadius: 30,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: '0 8px 24px rgba(58,175,169,0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>{isAuthenticated ? 'Open My Dashboard' : 'Get Started Now'}</span>
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#D3E3F0',
                  border: '1px solid rgba(211, 227, 240, 0.18)',
                  borderRadius: 30,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                <span>Learn More</span>
              </a>
            </div>
          </div>

          {/* ── RIGHT COLUMN — animated login mockup ────────────────── */}
          <div className="hero-right" style={{ flex: '0 0 360px' }}>
            <div className="hero-mockup-wrap">
              <LoginMockup />
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITY FEATURES (BENTO GRID) */}
      <section id="features" style={{
        padding: '60px clamp(16px, 4vw, 32px) 80px',
        maxWidth: 1120,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>
            Everything You Need as an ISTE Member
          </h2>
          <p style={{ color: 'rgba(211, 227, 240, 0.65)', maxWidth: 560, margin: '0 auto', fontFamily: "'Inter', sans-serif", fontSize: 15 }}>
            Purpose-built tools designed to simplify your engineering campus experience.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20
        }}>
          {[
            {
              icon: <QrCode size={24} />,
              color: '#3AAFA9',
              bg: 'rgba(58, 175, 169, 0.12)',
              title: 'Dynamic Gate QR Code',
              desc: 'One-tap attendance check-in at all club events and workshops. Dynamic cryptographic tokens protect against screenshot proxying.'
            },
            {
              icon: <Award size={24} />,
              color: '#E8A87C',
              bg: 'rgba(232, 168, 124, 0.12)',
              title: 'Custom-Named Certificates',
              desc: 'Official digital certificates issued with custom titles decided by executive committee (e.g., Appreciation, Winner, Excellence) with instant PDF download.'
            },
            {
              icon: <Calendar size={24} />,
              color: '#5F85A2',
              bg: 'rgba(95, 133, 162, 0.15)',
              title: 'Campus Event Hub',
              desc: 'Discover workshops, hackathons, and technical talk series. Filter by category, view location, and access direct materials.'
            },
            {
              icon: <CheckCircle size={24} />,
              color: '#10B981',
              bg: 'rgba(16, 185, 129, 0.12)',
              title: 'Attendance History & Heatmap',
              desc: 'Keep track of every workshop you attend throughout the semester. Your verified attendance records are logged instantly into your account.'
            },
            {
              icon: <Bell size={24} />,
              color: '#F5C842',
              bg: 'rgba(245, 200, 66, 0.12)',
              title: 'Executive Announcements',
              desc: 'Stay informed with direct broadcasts from the ISTE executive committee regarding registration deadlines, venue updates, and competition guidelines.'
            },
            {
              icon: <Shield size={24} />,
              color: '#93C5FD',
              bg: 'rgba(147, 197, 253, 0.12)',
              title: 'Universal Device Sync',
              desc: 'Add to your phone home screen as a mobile app, or launch in any full desktop browser. Real-time Supabase cloud sync keeps your profile up to date.'
            }
          ].map((f, i) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 22,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: f.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{f.title}</h3>
              <p style={{ color: 'rgba(211, 227, 240, 0.65)', fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section style={{
        padding: '0 clamp(16px, 4vw, 32px) 90px',
        maxWidth: 960,
        margin: '0 auto',
        zIndex: 1,
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          padding: 'clamp(36px, 6vw, 64px) clamp(20px, 4vw, 40px)',
          background: 'linear-gradient(135deg, rgba(58,175,169,0.12) 0%, rgba(15,21,36,0.8) 100%)',
          borderRadius: 28,
          border: '1px solid rgba(58,175,169,0.3)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'rgba(58,175,169,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#3AAFA9'
          }}>
            <Zap size={28} />
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 14 }}>
            Ready to Connect with ISTE SCTCE?
          </h2>
          <p style={{ color: 'rgba(211, 227, 240, 0.7)', maxWidth: 480, margin: '0 auto 28px', fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.6 }}>
            Sign in with your member account to access your digital QR code and download your earned event certificates.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={isAuthenticated ? "/home" : "/login"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 30px',
                background: 'linear-gradient(135deg, #3AAFA9 0%, #2B7A78 100%)',
                color: '#fff',
                borderRadius: 30,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 8px 24px rgba(58,175,169,0.35)'
              }}
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign In with Member ID'}</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(211,227,240,0.45)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <GraduationCap size={16} color="#3AAFA9" />
          <span style={{ fontWeight: 700, color: '#D3E3F0' }}>ISTE Student Chapter • SCTCE</span>
        </div>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} M-Lynq Member Portal. All rights reserved.</p>
      </footer>

    </div>
  );
}

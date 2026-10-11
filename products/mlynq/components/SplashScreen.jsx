// src/components/SplashScreen.jsx
// Artistic launch screen: animated particle-constellation canvas (nodes drift,
// connect when close — circuit/network motif fitting a tech club) behind the
// M-Lynq logo. Replaces the flat spinner with something that feels alive.

import { useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const COLORS = ['#5F85A2', '#D3E3F0', '#D97D55'];
    const PARTICLE_COUNT = 55;
    const LINK_DISTANCE = 130;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            const opacity = (1 - dist / LINK_DISTANCE) * 0.15;
            ctx.strokeStyle = `rgba(95, 133, 162, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw + update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const glow = (Math.sin(p.pulse) + 1) / 2; // 0..1 breathing
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + glow * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.35 + glow * 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(step);
    }

    init();
    step();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#0a0a0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <ParticleField />

      {/* Ambient glow halos, same brand gradient as LandingPage hero */}
      <div
        style={{
          position: 'absolute', top: '18%', left: '12%', width: 420, height: 420,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(95,133,162,0.22) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '12%', right: '8%', width: 380, height: 380,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,125,85,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />

      {/* Radial vignette so center content stays readable over particles */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at center, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.75) 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content, fades + rises in on mount */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Logo mark — bounces in on mount, orbited by a spark, swept by a shine loop */}
        <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 20 }}>
          {/* Orbiting spark */}
          <div
            style={{
              position: 'absolute', inset: 0,
              animation: 'splash-orbit 3.2s linear infinite',
            }}
          >
            <div
              style={{
                position: 'absolute', top: -3, left: '50%', width: 6, height: 6,
                marginLeft: -3, borderRadius: '50%',
                background: '#D97D55',
                boxShadow: '0 0 10px 3px rgba(217,125,85,0.7)',
              }}
            />
          </div>

          {/* Logo mark */}
          <div
            style={{
              position: 'absolute', inset: 12, borderRadius: 18,
              background: 'linear-gradient(135deg,#5F85A2,#3a5c7a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 40px rgba(95,133,162,0.4)',
              overflow: 'hidden',
              opacity: mounted ? 1 : 0,
              animation: mounted ? 'splash-bounce-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
            }}
          >
            <GraduationCap size={32} color="#fff" style={{ position: 'relative', zIndex: 1 }} />
            {/* Diagonal shine sweep, loops continuously */}
            <div
              style={{
                position: 'absolute', top: '-50%', left: '-60%', width: '60%', height: '200%',
                background: 'linear-gradient(75deg, transparent, rgba(255,255,255,0.45), transparent)',
                animation: 'splash-shine 3.2s ease-in-out 1s infinite',
              }}
            />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.5px', color: '#fff' }}>
            M-Lynq
          </span>
          <span
            style={{
              fontSize: 11, color: '#5F85A2', fontWeight: 600,
              background: 'rgba(95,133,162,0.15)', padding: '3px 10px',
              borderRadius: 20, border: '1px solid rgba(95,133,162,0.3)',
            }}
          >
            ISTE
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(211,227,240,0.5)', margin: '0 0 36px 0', fontFamily: "'Inter', sans-serif" }}>
          Member Portal
        </p>

        {/* Breathing dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#5F85A2',
                animation: `splash-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splash-bounce-in {
          0% { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(4deg); opacity: 1; }
          80% { transform: scale(0.96) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes splash-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splash-shine {
          0% { transform: translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateX(260%) rotate(0deg); opacity: 0; }
          100% { transform: translateX(260%) rotate(0deg); opacity: 0; }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

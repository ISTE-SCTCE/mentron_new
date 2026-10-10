import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { generateStudentAttendanceToken } from '../lib/qrSecurity';
import DashboardLayout from '../components/DashboardLayout';
import { RefreshCw, ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';

export default function QrPage() {
  const { user, profile, name, membershipId } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const isGeneratingRef = useRef(false);

  const fetchNewToken = useCallback(async () => {
    if (!user?.id || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateStudentAttendanceToken(user.id);
      setQrData(result.qrData);
      setSecondsLeft(30);
    } catch (err) {
      console.error('Failed to generate attendance QR:', err);
      setError(err.message || 'Failed to generate attendance QR code');
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNewToken();
    }
  }, [user?.id, fetchNewToken]);

  useEffect(() => {
    if (!qrData) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchNewToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrData, fetchNewToken]);

  const totalSeconds = 30;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / totalSeconds) * circumference;
  const timerColor = secondsLeft > 10 ? '#3AAFA9' : secondsLeft > 5 ? '#D97D55' : '#E53E3E';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#111',
              marginBottom: 6,
            }}
          >
            My Attendance QR
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#5F85A2', margin: 0 }}>
            Present this dynamic QR code to an ISTE coordinator to mark your event attendance.
          </p>
        </div>

        {/* QR Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #181824 0%, #121218 100%)',
            borderRadius: 28,
            padding: '36px 28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
            color: '#fff',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(95,133,162,0.2) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* Verification Pill */}
          <div style={{ marginBottom: 18 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(95, 133, 162, 0.15)',
                border: '1px solid rgba(95, 133, 162, 0.3)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#D3E3F0',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={14} color="#3AAFA9" />
              Dynamic Student Attendance Token
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 6px',
            }}
          >
            {name || 'Member'}
          </h2>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              color: 'rgba(211, 227, 240, 0.6)',
              marginBottom: 28,
            }}
          >
            {membershipId ? `ISTE ID: ${membershipId}` : profile?.roll_number ? `Roll: ${profile.roll_number}` : 'Member'}
            {profile?.branch && ` • ${profile.branch}`}
          </div>

          {/* QR Display */}
          <div
            style={{
              display: 'inline-flex',
              padding: 24,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
              minWidth: 240,
              minHeight: 240,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            {isGenerating && !qrData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <RefreshCw size={40} color="#5F85A2" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Securing token...</span>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12 }}>
                <AlertCircle size={32} color="#E53E3E" />
                <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>Error loading QR</span>
                <button
                  onClick={fetchNewToken}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : qrData ? (
              <QRCodeSVG
                value={qrData}
                size={220}
                level="M"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#111111"
              />
            ) : null}
          </div>

          {/* Timer and Auto-Refresh Indicator */}
          <div
            style={{
              maxWidth: 380,
              margin: '0 auto 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={30} cy={30} r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={3.5} fill="none" />
                <circle
                  cx={30}
                  cy={30}
                  r={radius}
                  stroke={timerColor}
                  strokeWidth={3.5}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: timerColor,
                }}
              >
                {secondsLeft}s
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                Refreshes in {secondsLeft} seconds
              </div>
              <div style={{ fontSize: 12, color: 'rgba(211, 227, 240, 0.6)' }}>
                Time-based encryption prevents unauthorized reuse.
              </div>
            </div>

            <button
              onClick={fetchNewToken}
              disabled={isGenerating}
              title="Refresh Token Now"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '8px',
                color: '#D3E3F0',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={16} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Trust Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              maxWidth: 440,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'left',
              }}
            >
              <Lock size={16} color="#3AAFA9" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>AES-256-GCM</div>
                <div style={{ fontSize: 11, color: 'rgba(211, 227, 240, 0.5)' }}>Encrypted payload</div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'left',
              }}
            >
              <Sparkles size={16} color="#D97D55" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Anti-Replay</div>
                <div style={{ fontSize: 11, color: 'rgba(211, 227, 240, 0.5)' }}>Single-use verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}

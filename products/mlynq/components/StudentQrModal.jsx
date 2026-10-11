import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { generateStudentAttendanceToken } from '../lib/qrSecurity';
import { X, RefreshCw, ShieldCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function StudentQrModal({ isOpen, onClose }) {
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

  // Initial load and close reset
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNewToken();
    } else {
      setQrData(null);
      setSecondsLeft(30);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, user?.id, fetchNewToken]);

  // 1-second interval countdown timer
  useEffect(() => {
    if (!isOpen || !qrData) return;

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
  }, [isOpen, qrData, fetchNewToken]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Countdown timer circle calculations
  const totalSeconds = 30;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / totalSeconds) * circumference;

  const timerColor = secondsLeft > 10 ? '#3AAFA9' : secondsLeft > 5 ? '#D97D55' : '#E53E3E';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(10, 10, 15, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#141418',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 28,
          padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(95, 133, 162, 0.15)',
          color: '#fff',
          position: 'relative',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(95, 133, 162, 0.15)',
              border: '1px solid rgba(95, 133, 162, 0.3)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: '#D3E3F0',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            <ShieldCheck size={13} color="#3AAFA9" />
            ISTE Verified Attendance
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 4px',
              color: '#fff',
            }}
          >
            {name || profile?.name || 'Member'}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(211, 227, 240, 0.6)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {membershipId ? `ID: ${membershipId}` : profile?.roll_number ? `Roll: ${profile.roll_number}` : 'Member'}
          </p>
        </div>

        {/* QR Code Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            position: 'relative',
          }}
        >
          <div
            style={{
              padding: 20,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 230,
              minHeight: 230,
              position: 'relative',
            }}
          >
            {isGenerating && !qrData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <RefreshCw size={36} color="#5F85A2" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Generating secure token...</span>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12, textAlign: 'center' }}>
                <AlertCircle size={32} color="#E53E3E" />
                <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>Failed to generate QR</span>
                <button
                  onClick={fetchNewToken}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 12,
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  Retry
                </button>
              </div>
            ) : qrData ? (
              <QRCodeSVG
                value={qrData}
                size={210}
                level="M"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#111111"
              />
            ) : null}
          </div>

          {/* Quick Refresh Float Button */}
          <button
            onClick={fetchNewToken}
            disabled={isGenerating}
            title="Refresh QR Token"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#D3E3F0',
              fontSize: 12,
              fontWeight: 500,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            }}
          >
            <RefreshCw size={13} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isGenerating ? 'Securing...' : 'Refresh Token'}</span>
          </button>
        </div>

        {/* Countdown Ring & Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 20,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Circular Countdown SVG */}
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={32}
                cy={32}
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={3.5}
                fill="none"
              />
              <circle
                cx={32}
                cy={32}
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
                fontSize: 18,
                fontWeight: 700,
                color: timerColor,
              }}
            >
              {secondsLeft}s
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
              Dynamic Time-Based Token
            </div>
            <div style={{ fontSize: 12, color: 'rgba(211, 227, 240, 0.6)', lineHeight: 1.4 }}>
              Refreshes automatically every 30s to prevent reuse or screenshot sharing.
            </div>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Lock size={14} color="#3AAFA9" />
            <span style={{ fontSize: 11, color: 'rgba(211, 227, 240, 0.7)', fontWeight: 500 }}>
              AES-256-GCM Encrypted
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Sparkles size={14} color="#D97D55" />
            <span style={{ fontSize: 11, color: 'rgba(211, 227, 240, 0.7)', fontWeight: 500 }}>
              Single-Use Verified
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

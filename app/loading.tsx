export default function Loading() {
    const ballColor = '#7000df'
    const shadowColor = 'rgba(112,0,223,0.45)'
    const glowColor = 'rgba(112,0,223,0.15)'

    return (
        <>
            <style>{`
                @keyframes native-mentron-bounce {
                    0% {
                        top: 60px;
                        height: 5px;
                        border-radius: 50px 50px 25px 25px;
                        transform: scaleX(1.7);
                    }
                    40% {
                        height: 20px;
                        border-radius: 50%;
                        transform: scaleX(1);
                    }
                    100% {
                        top: 0%;
                        height: 20px;
                        border-radius: 50%;
                        transform: scaleX(1);
                    }
                }

                @keyframes native-mentron-shadow {
                    0%   { transform: scaleX(1.5); opacity: 0.8; }
                    100% { transform: scaleX(0.2); opacity: 0.25; }
                }

                @keyframes native-mentron-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                .native-mball {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    animation: native-mentron-bounce 0.5s alternate infinite ease;
                }

                .native-mball:nth-child(2) { animation-delay: 0.15s; left: 80px; }
                .native-mball:nth-child(3) { animation-delay: 0.3s;  left: 160px; }

                .native-mshadow {
                    position: absolute;
                    top: 62px;
                    width: 20px;
                    height: 4px;
                    border-radius: 50%;
                    animation: native-mentron-shadow 0.5s alternate infinite ease;
                }

                .native-mshadow:nth-child(5) { animation-delay: 0.15s; left: 80px; }
                .native-mshadow:nth-child(6) { animation-delay: 0.3s;  left: 160px; }
            `}</style>

            <div
                role="status"
                aria-label="Loading"
                className="fixed inset-0 z-[9990] flex flex-col items-center justify-center transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto"
                style={{ background: 'rgba(3,3,15,0.92)', backdropFilter: 'blur(18px)' }}
            >
                {/* Ambient glow */}
                <div
                    className="absolute w-72 h-72 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                        animation: 'native-mentron-fade-in 0.6s ease both'
                    }}
                />

                {/* ── Bouncing Balls Rig ── */}
                <div style={{ position: 'relative', width: '180px', height: '68px', marginBottom: '40px' }}>
                    {/* Balls */}
                    <div className="native-mball" style={{ left: 0,     top: 60, background: ballColor, boxShadow: `0 0 12px 2px ${glowColor}` }} />
                    <div className="native-mball" style={{ left: '80px', top: 60, background: ballColor, boxShadow: `0 0 12px 2px ${glowColor}` }} />
                    <div className="native-mball" style={{ left: '160px', top: 60, background: ballColor, boxShadow: `0 0 12px 2px ${glowColor}` }} />

                    {/* Shadows */}
                    <div className="native-mshadow" style={{ left: 0,      background: shadowColor, filter: 'blur(2px)' }} />
                    <div className="native-mshadow" style={{ left: '80px',  background: shadowColor, filter: 'blur(2px)' }} />
                    <div className="native-mshadow" style={{ left: '160px', background: shadowColor, filter: 'blur(2px)' }} />
                </div>
                
                {/* Purposely no headings as per user request to cover lag and login */}
            </div>
        </>
    )
}

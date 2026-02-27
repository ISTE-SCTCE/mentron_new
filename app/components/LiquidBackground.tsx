'use client'

export default function LiquidBackground() {
    return (
        <>
            <div className="mesh-gradient" />
            <div
                className="liquid-blob top-[-10%] left-[-10%] bg-[#00c6ff] opacity-30"
                style={{ animationDelay: '0s' }}
            />
            <div
                className="liquid-blob bottom-[-10%] right-[-10%] bg-[#7000df] opacity-40"
                style={{ animationDelay: '-5s' }}
            />
            <div
                className="liquid-blob top-[20%] right-[10%] bg-[#00c6ff] opacity-20"
                style={{ animationDelay: '-10s', width: '40vw', height: '40vw' }}
            />
            <div className="noise-overlay" />
        </>
    )
}

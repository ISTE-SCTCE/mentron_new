'use client'

export default function LiquidBackground() {
    return (
        <>
            <div className="mesh-gradient" />
            <div
                className="liquid-blob top-[-12%] left-[-14%] bg-[#7c3aed]"
                style={{ animationDelay: '0s' }}
            />
            <div
                className="liquid-blob bottom-[-16%] right-[-12%] bg-[#ff9f1c]"
                style={{ animationDelay: '-5s' }}
            />
            <div
                className="liquid-blob top-[24%] right-[8%] bg-[#10b981]"
                style={{ animationDelay: '-10s', width: '40vw', height: '40vw' }}
            />
            <div className="noise-overlay" />
        </>
    )
}

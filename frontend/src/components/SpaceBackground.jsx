import { useState, useEffect } from 'react';

const SpaceBackground = ({ safeMode = false }) => {
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        if (safeMode) return;

        try {
            // Generate space bubbles
            const newBubbles = Array.from({ length: 30 }).map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 10 + 2,
                duration: Math.random() * 15 + 10,
                delay: Math.random() * 10,
                opacity: Math.random() * 0.5 + 0.1,
            }));
            setBubbles(newBubbles);
        } catch (e) {
            console.error("Particle Init Failed:", e);
        }
    }, [safeMode]);

    return (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
            style={{
                background: 'radial-gradient(circle at center, #2C5364, #0F2027)',
                backgroundColor: '#0F2027'
            }}
        >
            {/* Space Background Effects */}
            {!safeMode && bubbles.map((b) => (
                <div
                    key={b.id}
                    className="absolute rounded-full bg-blue-400 blur-[1px] animate-float-up"
                    style={{
                        left: `${b.left}%`,
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                        animationDuration: `${b.duration}s`,
                        animationDelay: `${b.delay}s`,
                        opacity: b.opacity,
                        bottom: '-20px'
                    }}
                />
            ))}

            {/* Light Streaks */}
            <div className="absolute top-0 left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-transparent via-white/5 to-transparent animate-streak pointer-events-none"></div>

            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
    );
};

export default SpaceBackground;

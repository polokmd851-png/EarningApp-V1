import React from 'react';
import { APP_CONFIG } from '../constants';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface SpinWheelProps {
  isSpinning: boolean;
  onSpin: () => void;
  rotation: number;
  segments: Segment[];
  isFreeSpin?: boolean;
  freeSpinsLeft?: number;
  showWinEffect?: boolean;
}

const ConfettiParticle = ({ delay, color, x, y }: any) => (
  <div
    className="absolute w-2 h-2 rounded-full opacity-0"
    style={{
      backgroundColor: color,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      '--tx': `${x}px`,
      '--ty': `${y}px`,
      animation: `particle-explode 0.8s ease-out forwards ${delay}s`
    } as React.CSSProperties}
  />
);

const SpinWheel: React.FC<SpinWheelProps> = ({ 
  isSpinning, 
  onSpin, 
  rotation, 
  segments, 
  isFreeSpin = false, 
  freeSpinsLeft = 0,
  showWinEffect = false
}) => {
  const numSegments = segments.length;
  const segmentAngle = 360 / numSegments;

  // Generate conic gradient string dynamically for background colors
  const gradient = `conic-gradient(${
    segments.map((s, i) => `${s.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`).join(', ')
  })`;

  // Generate particles for win effect
  const particles = showWinEffect ? Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400, // Random spread X
    y: (Math.random() - 0.5) * 400, // Random spread Y
    color: segments[Math.floor(Math.random() * segments.length)].color,
    delay: Math.random() * 0.2
  })) : [];

  return (
    <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6 rounded-2xl text-center text-white mb-6 shadow-xl relative overflow-hidden border-t border-white/20">
      
      {/* Dynamic Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-yellow-400/30 to-pink-500/30 blur-[60px] rounded-full pointer-events-none transition-all duration-500 ease-out z-0 ${isSpinning ? 'scale-125 opacity-100' : 'scale-100 opacity-40'}`}></div>

      {/* Decorative background blur elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none z-0">
         <div className="absolute top-10 left-10 w-24 h-24 bg-white rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl font-black mb-1 drop-shadow-md tracking-tight uppercase italic relative inline-block">
          Lucky Spin
          {/* Subtle sparkle icon */}
          <i className={`fas fa-star text-yellow-300 absolute -top-2 -right-6 text-sm ${isSpinning ? 'animate-spin-slow' : ''}`}></i>
        </h2>
        
        {/* Cost / Free Spin Badge */}
        <div className="mb-6 flex justify-center mt-2">
          {isFreeSpin ? (
            <div className="bg-gradient-to-r from-green-400 to-emerald-600 text-white px-4 py-1.5 rounded-full border border-green-300 shadow-lg shadow-green-500/30 flex items-center gap-2 transform hover:scale-105 transition-transform">
              <i className="fas fa-gift animate-bounce"></i>
              <span className="text-xs font-bold uppercase tracking-wider">
                Free Spin: {freeSpinsLeft}/{APP_CONFIG.DAILY_FREE_SPIN_LIMIT}
              </span>
            </div>
          ) : (
             <p className="text-xs font-medium opacity-90 bg-black/20 inline-block px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              Cost: <span className="text-yellow-300 font-bold">{APP_CONFIG.SPIN_COST}৳</span> per spin
            </p>
          )}
        </div>

        <div className="relative w-[280px] h-[280px] mx-auto mb-8">
          {/* Confetti Explosion Layer */}
          {showWinEffect && (
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particles.map(p => (
                    <ConfettiParticle key={p.id} {...p} />
                ))}
            </div>
          )}

          {/* Outer Ring with Lights */}
          <div className={`absolute inset-[-14px] rounded-full bg-[#2d3436] border-[3px] border-[#fbbf24] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex justify-center items-center transition-all duration-300 ${isSpinning ? 'shadow-[0_0_30px_#fbbf24]' : ''}`}>
             {/* Blinking Dots */}
             {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_8px_white]"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 30}deg) translate(147px) translate(-50%, -50%)`,
                    animation: isSpinning ? `blink 0.2s infinite ${i % 2 === 0 ? '0s' : '0.1s'}` : 'none',
                    backgroundColor: i % 2 === 0 ? '#fbbf24' : '#ffffff'
                  }}
                />
             ))}
          </div>

          {/* Needle Indicator */}
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 z-30 filter drop-shadow-lg">
             <i className="fas fa-caret-down text-5xl text-red-600 stroke-white stroke-2 drop-shadow-md relative" style={{ top: isSpinning ? '-2px' : '0px', transition: 'top 0.1s' }}></i>
          </div>

          {/* The Wheel */}
          <div
            className="w-full h-full rounded-full overflow-hidden relative border-[4px] border-white shadow-inner"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.80, 0.10, 1.0)' : 'transition 0.5s ease-out',
            }}
          >
            {/* Segment Labels */}
            {segments.map((segment, i) => (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-full h-[50%] origin-bottom flex justify-center pt-5"
                style={{
                  transform: `translateX(-50%) rotate(${i * segmentAngle + segmentAngle / 2}deg)`,
                }}
              >
                <span 
                  className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transform" 
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {segment.label}
                </span>
              </div>
            ))}
          </div>

          {/* Center Hub */}
          <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] z-20 cursor-pointer transition-transform border-4 border-gray-200 ${isSpinning ? 'scale-90' : 'active:scale-90 hover:scale-105'}`}
            onClick={onSpin}
          >
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5856d6] to-[#764ba2] flex items-center justify-center shadow-inner">
                 <span className="text-white font-bold text-sm uppercase">{isSpinning ? '...' : 'GO'}</span>
             </div>
          </div>
        </div>

        <button
          onClick={onSpin}
          disabled={isSpinning}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl transform active:scale-95 relative overflow-hidden group ${
            isSpinning
              ? 'bg-gray-400 cursor-not-allowed text-gray-200 shadow-none'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-300 hover:to-orange-400 hover:shadow-orange-500/40'
          }`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10">
          {isSpinning 
            ? 'Spinning...' 
            : isFreeSpin 
              ? 'SPIN FREE' 
              : `SPIN (${APP_CONFIG.SPIN_COST}৳)`}
          </span>
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); filter: brightness(1.5); box-shadow: 0 0 10px white; }
          50% { opacity: 0.5; transform: scale(0.8); filter: brightness(0.8); box-shadow: none; }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
        }
        @keyframes particle-explode {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default SpinWheel;
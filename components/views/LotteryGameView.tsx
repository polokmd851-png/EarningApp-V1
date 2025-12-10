
import React, { useState } from 'react';
import { User, Tab } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';

interface LotteryGameViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
  onNavigate: (tab: Tab) => void;
}

const LotteryGameView: React.FC<LotteryGameViewProps> = ({ user, updateUser, onNavigate }) => {
  const [opening, setOpening] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ type: 'Win' | 'Loss', prize?: string } | null>(null);

  const activeSession = user.activeLottery;

  if (!activeSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-6 text-center">
        <i className="fas fa-ticket-alt text-6xl text-gray-600 mb-4"></i>
        <h2 className="text-2xl font-bold mb-2">No Active Game</h2>
        <p className="text-gray-400 mb-6">Please purchase a lottery card first.</p>
        <button onClick={() => onNavigate('lottery')} className="px-6 py-3 bg-blue-600 rounded-lg font-bold">Go to Dashboard</button>
      </div>
    );
  }

  const handleDraw = () => {
    if (opening || activeSession.drawsLeft <= 0) return;

    setOpening(true);
    setCurrentResult(null);

    // Get current turn logic
    const drawIndex = 5 - activeSession.drawsLeft;
    const resultType = activeSession.resultsSequence[drawIndex];
    let prizeName = '';

    // If win, take the next prize from the pool
    if (resultType === 'Win' && activeSession.prizesPool.length > 0) {
        // We find the first prize not yet "used" in UI (simple hack: remove from pool copy or just pop)
        // Since we stored strictly needed prizes in pool, we can shift.
        // HOWEVER: State update is async. For display, we just look at what *will* be added.
        // We will update the user object completely after animation.
    }

    // Simulate 3D animation delay
    setTimeout(() => {
        let updatedInventory = user.inventory || [];
        let wonItem = null;

        if (resultType === 'Win') {
            // Find a prize from the pool that hasn't been added to inventory yet (by ID)
            // Or simpler: pop from the pool in the active session data structure.
            const prize = activeSession.prizesPool.find(p => !updatedInventory.some(i => i.id === p.id));
            if (prize) {
                wonItem = prize;
                updatedInventory = [prize, ...updatedInventory];
                prizeName = prize.name;
                sendTelegramMessage(`🎁 *Lottery Win!*\nUser: ${user.name}\nPrize: ${prize.name}\nValue: ${prize.value}`);
            }
        } else {
             sendTelegramMessage(`💨 *Lottery Loss*\nUser: ${user.name}\nDraws Left: ${activeSession.drawsLeft - 1}`);
        }

        // Update User State
        const updatedDrawsLeft = activeSession.drawsLeft - 1;
        
        updateUser((prev) => {
             const updatedSession = prev.activeLottery ? { ...prev.activeLottery, drawsLeft: updatedDrawsLeft } : null;
             // If draws are 0, clear session
             return {
                 activeLottery: updatedDrawsLeft > 0 ? updatedSession : null,
                 inventory: updatedInventory
             };
        });

        setCurrentResult({ type: resultType, prize: prizeName });
        setOpening(false);

    }, 2000); // 2 second animation
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-24 font-['Orbitron'] overflow-hidden flex flex-col items-center">
        {/* Top Bar */}
        <div className="w-full p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm z-20">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center font-bold text-black">
                     {activeSession.drawsLeft}
                 </div>
                 <span className="text-sm font-bold opacity-80">Draws Left</span>
             </div>
             <button onClick={() => onNavigate('lottery')} className="text-gray-400 hover:text-white">
                 <i className="fas fa-times text-xl"></i>
             </button>
        </div>

        {/* 3D Scene Container */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative perspective-1000">
             
             {/* The Mystery Box */}
             <div className={`relative w-48 h-48 transition-all duration-500 cursor-pointer ${opening ? 'animate-bounce scale-110' : 'hover:scale-105'}`} onClick={handleDraw}>
                 {/* Box Image based on Type */}
                 <div className={`w-full h-full rounded-3xl bg-gradient-to-br ${activeSession.type === 'VIP' ? 'from-yellow-500 to-amber-700 shadow-yellow-500/50' : 'from-gray-300 to-slate-500 shadow-white/30'} shadow-2xl flex items-center justify-center relative z-10 border-4 border-white/20`}>
                      {opening ? (
                          <i className="fas fa-cog fa-spin text-6xl text-white/50"></i>
                      ) : (
                          <i className={`fas ${activeSession.type === 'VIP' ? 'fa-gem' : 'fa-box'} text-6xl text-white drop-shadow-lg`}></i>
                      )}
                 </div>
                 {/* Platform */}
                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-10 bg-black/50 blur-xl rounded-[100%]"></div>
             </div>

             <h2 className="mt-12 text-2xl font-bold tracking-widest animate-pulse">
                 {opening ? 'OPENING...' : 'TAP TO OPEN'}
             </h2>

             {/* Result Overlay */}
             {currentResult && !opening && (
                 <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                      <div className="text-center p-8 bg-white/10 rounded-2xl border border-white/20 max-w-[300px]">
                          {currentResult.type === 'Win' ? (
                              <>
                                  <i className="fas fa-trophy text-6xl text-yellow-400 mb-4 animate-bounce"></i>
                                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">YOU WON!</h3>
                                  <p className="text-xl font-bold text-white mb-6">{currentResult.prize}</p>
                                  <div className="text-xs text-green-400 bg-green-900/30 py-1 px-3 rounded-full inline-block">
                                      Added to Inventory
                                  </div>
                              </>
                          ) : (
                              <>
                                  <i className="fas fa-wind text-6xl text-gray-400 mb-4"></i>
                                  <h3 className="text-2xl font-bold text-gray-300 mb-2">Better Luck Next Time</h3>
                                  <p className="text-sm text-gray-500 mb-6">This box was empty.</p>
                              </>
                          )}
                          
                          <button 
                            onClick={() => {
                                setCurrentResult(null);
                                if(activeSession.drawsLeft <= 0) onNavigate('lottery');
                            }}
                            className="w-full mt-6 py-3 bg-blue-600 rounded-xl font-bold shadow-lg shadow-blue-600/30"
                          >
                              {activeSession.drawsLeft > 0 ? 'NEXT DRAW' : 'FINISH'}
                          </button>
                      </div>
                 </div>
             )}
        </div>

        {/* Ad Placeholder */}
        <div className="w-full h-16 bg-gray-800 flex items-center justify-center text-gray-500 text-xs tracking-widest uppercase">
            Sponsored Ad Space
        </div>
    </div>
  );
};

export default LotteryGameView;

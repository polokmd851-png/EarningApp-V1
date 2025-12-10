
import React, { useState, useEffect } from 'react';
import { User, Tab, HistoryItem } from '../../types';
import SpinWheel from '../SpinWheel';
import { APP_CONFIG } from '../../constants';
import { sendTelegramMessage } from '../../services/telegramService';

interface HomeViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
  onNavigate: (tab: Tab) => void;
}

// Define segments for the wheel
const SPIN_SEGMENTS = [
  { label: '0৳', value: 0, color: '#ff5252' },
  { label: '10৳', value: 10, color: '#ffb142' },
  { label: '50৳', value: 50, color: '#2ecc71' },
  { label: '20৳', value: 20, color: '#3498db' },
  { label: '0৳', value: 0, color: '#9b59b6' },
  { label: '100৳', value: 100, color: '#f1c40f' },
];

const HomeView: React.FC<HomeViewProps> = ({ user, updateUser, onNavigate }) => {
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winResult, setWinResult] = useState<{ show: boolean; amount: number } | null>(null);
  const [showWinEffect, setShowWinEffect] = useState(false);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Helper to determine free spin status
  const today = new Date().toDateString();
  const dailySpins = user.lastSpinDate === today ? user.spinCount : 0;
  const isFreeSpin = dailySpins < APP_CONFIG.DAILY_FREE_SPIN_LIMIT;
  const freeSpinsLeft = Math.max(0, APP_CONFIG.DAILY_FREE_SPIN_LIMIT - dailySpins);

  // Auto-Slide Logic
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5); // 5 slides total
    }, 3500);
    return () => clearInterval(slideTimer);
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    // Reset effects
    setShowWinEffect(false);

    // Check date and reset if needed (for internal logic consistency)
    const currentDailySpins = user.lastSpinDate === today ? user.spinCount : 0;
    const currentIsFree = currentDailySpins < APP_CONFIG.DAILY_FREE_SPIN_LIMIT;

    // Logic: Cost is deducted from Main Balance (Deposit Balance)
    if (!currentIsFree && user.balance < APP_CONFIG.SPIN_COST) {
      if (window.confirm('❌ Free spins used up! Please deposit funds to continue spinning. Go to Wallet?')) {
        setShowWheel(false);
        onNavigate('wallet');
      }
      return;
    }

    setIsSpinning(true);
    
    // Deduct cost immediately from Deposit Balance if not free
    if (!currentIsFree) {
       updateUser((prev) => ({
         balance: prev.balance - APP_CONFIG.SPIN_COST,
         spinCount: (prev.lastSpinDate === today ? prev.spinCount : 0) + 1,
         lastSpinDate: today
       }));
    } else {
       // Just update count for free spin
       updateUser((prev) => ({
         spinCount: (prev.lastSpinDate === today ? prev.spinCount : 0) + 1,
         lastSpinDate: today
       }));
    }

    // 1. Determine Result Randomly
    const winningIndex = Math.floor(Math.random() * SPIN_SEGMENTS.length);
    const winAmount = SPIN_SEGMENTS[winningIndex].value;

    // 2. Calculate Rotation to land on the winning segment
    const segmentAngle = 360 / SPIN_SEGMENTS.length;
    const wedgeCenter = winningIndex * segmentAngle + segmentAngle / 2;
    const targetBaseRotation = 360 - wedgeCenter;

    // Add 5 full spins (1800 deg) + needed rotation to reach target
    const currentRotationMod = rotation % 360;
    const distanceToNextZero = 360 - currentRotationMod;
    const totalRotation = rotation + distanceToNextZero + (360 * 5) + targetBaseRotation;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      
      // Create history item for this spin
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        type: 'Spin',
        amount: winAmount,
        date: new Date().toLocaleDateString('en-GB'),
        status: 'Success',
        method: currentIsFree ? 'Free Spin' : 'Paid Spin'
      };

      // Update user state: Add history item and update balance if won
      updateUser((prev) => {
        const updates: Partial<User> = {
          history: [newHistoryItem, ...(prev.history || [])]
        };
        
        if (winAmount > 0) {
          updates.earningBalance = (prev.earningBalance || 0) + winAmount;
        }
        
        return updates;
      });

      if (winAmount > 0) {
        // Show particles immediately on win
        setShowWinEffect(true);
      }

      // Show Custom Win Modal instead of alert
      setWinResult({ show: true, amount: winAmount });

      sendTelegramMessage(
        `🎰 *Spin Result*\nUser: ${user.name} (${user.id})\nWon: ${winAmount} Tk\nType: ${currentIsFree ? 'Free' : 'Paid'}\nResult: Added to Earning Balance`
      );
    }, 4000);
  };

  const handleCloseWinModal = () => {
    setWinResult(null);
    setShowWinEffect(false);
  };

  // If user clicked the wheel card, show the Spin Game interface
  if (showWheel) {
    return (
      <div className="p-5 pb-24 min-h-[80vh] flex flex-col relative">
        <button 
          onClick={() => setShowWheel(false)}
          className="self-start mb-4 flex items-center gap-2 text-gray-600 font-bold hover:text-[#5856d6] transition-colors bg-white/50 px-3 py-1 rounded-full"
        >
          <i className="fas fa-arrow-left"></i> Back to Lobby
        </button>
        
        <SpinWheel 
          isSpinning={isSpinning} 
          onSpin={handleSpin} 
          rotation={rotation} 
          segments={SPIN_SEGMENTS}
          isFreeSpin={isFreeSpin}
          freeSpinsLeft={freeSpinsLeft}
          showWinEffect={showWinEffect}
        />
        
        <div className="bg-white/95 backdrop-blur rounded-xl p-5 shadow-sm border border-gray-100 mt-4">
          <h4 className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
            <i className="fas fa-bullhorn text-amber-500"></i> Rules
          </h4>
          <ul className="text-sm text-gray-500 leading-relaxed list-disc list-inside space-y-1">
             <li>Winnings are added to your <strong>Earning Wallet</strong>.</li>
             {!isFreeSpin && <li>Spin cost is deducted from your <strong>Deposit Balance</strong>.</li>}
             <li>Free Spins left today: <strong>{freeSpinsLeft}</strong></li>
          </ul>
        </div>

        {/* Win Notification Modal */}
        {winResult && winResult.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl transform scale-100 animate-pop-in relative overflow-hidden border-4 border-white">
                
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-yellow-300 via-transparent to-blue-300 animate-spin-slow"></div>
                </div>

                <div className="relative z-10">
                  {winResult.amount > 0 ? (
                      <>
                          <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-4 ring-yellow-100">
                              <i className="fas fa-trophy text-5xl text-yellow-500 drop-shadow-sm animate-bounce"></i>
                          </div>
                          <h2 className="text-2xl font-black text-gray-800 mb-1 tracking-tight uppercase">Big Win!</h2>
                          <p className="text-gray-500 text-sm mb-4 font-medium uppercase tracking-wide">You have won</p>
                          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600 mb-2 drop-shadow-sm">
                              {winResult.amount}৳
                          </div>
                          <p className="text-xs text-green-600 font-bold bg-green-50 py-1 px-3 rounded-full inline-block mb-6 border border-green-100">
                            <i className="fas fa-check-circle mr-1"></i> Added to Earning Balance
                          </p>
                      </>
                  ) : (
                      <>
                          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-4 ring-gray-100">
                              <i className="fas fa-heart-broken text-5xl text-gray-400"></i>
                          </div>
                          <h2 className="text-xl font-bold text-gray-700 mb-2">Oh No!</h2>
                          <p className="text-gray-500 text-sm mb-6">You didn't win anything this time.</p>
                      </>
                  )}

                  <button 
                      onClick={handleCloseWinModal}
                      className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-[#5856d6] to-[#764ba2] shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform uppercase tracking-wider text-sm"
                  >
                      {winResult.amount > 0 ? 'Claim Reward' : 'Try Again'}
                  </button>
                </div>
            </div>
            
            <style>{`
              @keyframes popIn {
                0% { opacity: 0; transform: scale(0.5); }
                70% { transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
              }
              .animate-pop-in {
                animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
              .animate-spin-slow {
                animation: spin 8s linear infinite;
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }

  // Define Carousel Slides
  const slides = [
    // 1. Real-time REBATE
    {
      id: 'rebate',
      render: (
        <div className="w-full h-full bg-gradient-to-r from-slate-900 to-blue-900 relative overflow-hidden flex flex-col justify-center px-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
          
          <div className="relative z-10">
            <div className="bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-3 shadow-md">91CLUB.COM</div>
            <h2 className="text-3xl font-black italic text-white leading-none mb-2 drop-shadow-md">
              Real-time <br/> 
              <span className="text-orange-500">REBATE</span>
            </h2>
            <p className="text-blue-100 text-xs font-medium mb-3 opacity-90">Cash Back On Every Bet You Make</p>
            
            <button className="flex items-center gap-2 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
              <span>CLAIM NOW</span>
              <i className="fas fa-arrow-right bg-orange-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"></i>
            </button>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/2643/2643666.png" className="absolute right-[-10px] bottom-[-20px] w-32 h-32 object-contain opacity-90 rotate-12 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" alt="Chip" />
        </div>
      ),
      action: () => onNavigate('wallet')
    },
    // 2. IMO VIP TASK
    {
      id: 'imo',
      render: (
        <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden flex items-center justify-between px-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/20 blur-2xl rounded-full"></div>

          <div className="relative z-10 text-white">
            <h3 className="font-bold text-2xl italic tracking-wider font-orbitron mb-1 drop-shadow-md">IMO VIP TASK</h3>
            <p className="text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-full inline-block shadow-sm">
              Earn 500৳ Instantly
            </p>
          </div>
          <div className="relative z-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce ring-4 ring-white/30">
             <i className="fas fa-comment-dots text-blue-500 text-3xl"></i>
          </div>
        </div>
      ),
      action: () => onNavigate('imo_vip')
    },
    // 3. DAILY FREE SPIN
    {
      id: 'spin',
      render: (
        <div className="w-full h-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 relative overflow-hidden flex items-center justify-between px-6">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <div className="relative z-10 text-white">
              <div className="bg-yellow-400 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block mb-2">HOT GAME</div>
              <h3 className="font-black text-2xl uppercase tracking-tight leading-none mb-1 drop-shadow-md">Lucky Spin</h3>
              <p className="text-xs text-white/90 font-medium">Win up to <span className="text-yellow-300 font-bold">100৳</span> Daily!</p>
           </div>
           <i className="fas fa-dharmachakra text-6xl text-white/30 absolute -right-4 -bottom-4 animate-spin-slow"></i>
           <div className="relative z-10 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 hover:bg-white/30 transition-colors">
              <i className="fas fa-play text-white text-xl ml-1"></i>
           </div>
        </div>
      ),
      action: () => setShowWheel(true)
    },
    // 4. REFER & EARN
    {
      id: 'refer',
      render: (
        <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden flex flex-col justify-center px-6">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10"></div>
           <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm rotate-3 shadow-lg">
                <i className="fas fa-users text-3xl text-yellow-400"></i>
              </div>
              <div className="text-white">
                <h3 className="font-bold text-xl leading-none mb-1">Refer & Earn</h3>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                  50৳
                </div>
                <p className="text-[10px] text-indigo-200">Per Successful Referral</p>
              </div>
           </div>
        </div>
      ),
      action: () => onNavigate('refer')
    },
    // 5. WELCOME BONUS
    {
      id: 'bonus',
      render: (
        <div className="w-full h-full bg-gradient-to-r from-amber-500 to-yellow-500 relative overflow-hidden flex items-center px-6">
           <div className="absolute -right-10 top-0 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
           <div className="relative z-10 w-full">
              <div className="flex justify-between items-end">
                 <div className="text-white">
                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2 animate-pulse">NEW USER</div>
                    <h3 className="font-black text-2xl uppercase italic tracking-tight mb-1 drop-shadow-sm text-white">Welcome <br/> Bonus</h3>
                    <p className="text-xs font-bold text-red-900 bg-white/30 px-2 py-1 rounded inline-block">Get 1-5000 Taka Free</p>
                 </div>
                 <img src="https://cdn-icons-png.flaticon.com/512/1138/1138587.png" className="w-20 h-20 object-contain drop-shadow-xl animate-bounce" alt="Money" />
              </div>
           </div>
        </div>
      ),
      action: () => onNavigate('wallet')
    }
  ];

  // Dashboard / Lobby View
  return (
    <div className="pb-24 min-h-screen">
      {/* Brand Header */}
      <div className="px-5 pt-4 pb-2 flex justify-between items-center">
        <h1 className="text-2xl font-black italic tracking-tighter text-gray-800">
          <span className="text-red-600">GO</span> GAME
          <div className="h-1 w-full bg-red-600 -mt-1 rounded-full opacity-20"></div>
        </h1>
        <div className="text-red-500 text-xl cursor-pointer hover:scale-110 transition-transform">
          <i className="fas fa-cloud-download-alt"></i>
        </div>
      </div>

      {/* Marquee Notification */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center gap-3 border-y border-gray-200 mb-4 shadow-sm">
        <i className="fas fa-volume-up text-red-500 text-sm animate-pulse"></i>
        <div className="flex-1 overflow-hidden whitespace-nowrap text-xs text-gray-700 font-medium">
          {React.createElement('marquee', { scrollamount: 4 } as any, '📢 siteMessage: "Welcome to Pro Earning App! Spin the wheel to win big. Winnings are credited to your Earning Wallet directly."')}
        </div>
      </div>

      {/* AUTO-SLIDING CAROUSEL */}
      <div className="px-4 mb-6">
        <div className="w-full h-44 rounded-xl shadow-lg relative overflow-hidden group">
           {slides.map((slide, index) => (
             <div 
               key={slide.id}
               onClick={slide.action}
               className={`absolute inset-0 transition-all duration-700 ease-in-out cursor-pointer ${
                 index === currentSlide 
                   ? 'opacity-100 translate-x-0 z-10' 
                   : 'opacity-0 translate-x-full z-0'
               }`}
             >
               {slide.render}
             </div>
           ))}
           
           {/* Carousel Indicators */}
           <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
             {slides.map((_, idx) => (
               <div 
                 key={idx}
                 className={`h-1.5 rounded-full transition-all duration-300 ${
                   idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                 }`}
               ></div>
             ))}
           </div>
        </div>
      </div>

      {/* Modern Dual Wallet Dashboard */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-3">
        {/* Deposit Now Wallet */}
        <div className="relative rounded-2xl p-4 text-white shadow-lg overflow-hidden group min-h-[100px] flex flex-col justify-between cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate('wallet')}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#6a11cb] to-[#2575fc]"></div>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-1.5 opacity-90 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
              <i className="fas fa-wallet text-[10px]"></i>
              <span className="text-[10px] font-bold uppercase tracking-wide">Deposit Now</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-plus text-xs"></i>
            </div>
          </div>
          
          <div className="relative z-10 mt-2">
            <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">৳{user.balance.toFixed(2)}</h3>
          </div>
        </div>

        {/* Earning Balance Wallet */}
        <div className="relative rounded-2xl p-4 text-white shadow-lg overflow-hidden group min-h-[100px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#11998e] to-[#38ef7d]"></div>
           <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-1.5 opacity-90 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
              <i className="fas fa-trophy text-[10px]"></i>
              <span className="text-[10px] font-bold uppercase tracking-wide">Earning Bal</span>
            </div>
          </div>

          <div className="relative z-10 mt-2">
            <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">৳{(user.earningBalance || 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mb-6 flex gap-3">
        <button 
          onClick={() => onNavigate('wallet')}
          className="flex-1 bg-white border border-gray-100 hover:bg-orange-50 text-gray-700 rounded-xl py-3 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
        >
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
            <i className="fas fa-arrow-up text-sm"></i>
          </div>
          <span className="text-xs font-bold">Withdraw</span>
        </button>
        
        <button 
          onClick={() => onNavigate('wallet')}
          className="flex-1 bg-white border border-gray-100 hover:bg-blue-50 text-gray-700 rounded-xl py-3 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
        >
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <i className="fas fa-plus text-sm"></i>
          </div>
          <span className="text-xs font-bold">Deposit</span>
        </button>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="px-4 flex gap-3 mb-6">
        {/* Wheel Card */}
        <div 
          onClick={() => setShowWheel(true)}
          className="flex-1 h-24 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 relative overflow-hidden shadow-lg shadow-red-200/50 cursor-pointer group active:scale-95 transition-transform"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          {/* Badge for Free Spins */}
          {freeSpinsLeft > 0 && (
             <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
               {freeSpinsLeft} Free
             </div>
          )}
          <div className="relative z-10 p-3 flex flex-col justify-end h-full">
             <i className="fas fa-dharmachakra text-2xl text-white mb-1 opacity-90 group-hover:rotate-180 transition-transform duration-700"></i>
            <h3 className="text-white font-bold text-sm leading-none drop-shadow-md">Lucky <br/> Spin</h3>
          </div>
        </div>

        {/* VIP / WhatsApp Connect Card */}
        <div 
          onClick={() => onNavigate('whatsapp')}
          className="flex-1 h-24 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 relative overflow-hidden shadow-lg shadow-indigo-200/50 cursor-pointer active:scale-95 transition-transform group"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10"></div>
          <div className="relative z-10 p-3 flex flex-col justify-end h-full">
            <i className="fas fa-crown text-2xl text-yellow-400 mb-1 drop-shadow-sm group-hover:-translate-y-1 transition-transform"></i>
            <h3 className="text-white font-bold text-sm leading-none drop-shadow-md">VIP <br/> Member</h3>
          </div>
          <div className="absolute top-0 right-0 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg text-black">HOT</div>
        </div>

        {/* Refer Card (Small) */}
        <div 
          onClick={() => onNavigate('refer')}
          className="flex-1 h-24 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden shadow-lg shadow-emerald-200/50 cursor-pointer active:scale-95 transition-transform group"
        >
          <div className="relative z-10 p-3 flex flex-col justify-end h-full">
            <i className="fas fa-user-plus text-2xl text-white mb-1 drop-shadow-sm"></i>
            <h3 className="text-white font-bold text-sm leading-none drop-shadow-md">Refer <br/> Earn</h3>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide text-sm font-bold text-gray-400 bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-gray-100">
          <div className="text-gray-800 flex items-center gap-1 border-b-2 border-red-500 pb-1 cursor-pointer whitespace-nowrap px-1">
            <i className="fas fa-home text-red-500"></i> Lobby
          </div>
          <div className="hover:text-gray-600 cursor-pointer whitespace-nowrap flex items-center gap-1 px-1">
            <i className="fas fa-gamepad"></i> Mini game
          </div>
          <div className="hover:text-gray-600 cursor-pointer whitespace-nowrap flex items-center gap-1 px-1">
            <i className="fas fa-slot-machine"></i> Slots
          </div>
          <div className="hover:text-gray-600 cursor-pointer whitespace-nowrap flex items-center gap-1 px-1">
            <i className="fas fa-dice"></i> Card
          </div>
          <div className="hover:text-gray-600 cursor-pointer whitespace-nowrap flex items-center gap-1 px-1">
            <i className="fas fa-fish"></i> Fishing
          </div>
        </div>
      </div>

      {/* Lottery List Item */}
      <div className="px-4 mb-4">
        <div 
          onClick={() => onNavigate('lottery')}
          className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-xl p-3 shadow-lg border border-gray-700 flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group"
        >
           {/* Glow Effect */}
           <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-yellow-500/20 to-transparent skew-x-12 group-hover:from-yellow-500/40 transition-all"></div>
           
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/20 flex items-center justify-center text-white text-2xl font-bold border border-yellow-300">
             <i className="fas fa-gift animate-pulse"></i>
          </div>
          <div className="flex-1 relative z-10">
            <h4 className="font-bold text-white text-lg flex items-center gap-2">
              Lottery Event
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-bounce">LIVE</span>
            </h4>
            <p className="text-xs text-gray-300 mt-0.5">
              Win iPhones, Cash & Gold! 5 Draws per card.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
             <i className="fas fa-chevron-right text-white text-xs"></i>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomeView;

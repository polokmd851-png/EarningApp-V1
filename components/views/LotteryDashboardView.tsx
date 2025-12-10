
import React, { useState } from 'react';
import { User, Tab, ActiveLotterySession, InventoryItem, HistoryItem } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';

interface LotteryDashboardViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
  onNavigate: (tab: Tab) => void;
}

// Lottery Card Definitions
const LOTTERY_CARDS = [
  // 5 VIP Cards (500 TK)
  { id: 'vip1', name: 'Royal Chest', type: 'VIP', price: 500, icon: 'fa-chess-king', color: 'from-yellow-400 to-amber-600', prizes: ['iPhone 15', '5000 Tk', 'Gold Ring'] },
  { id: 'vip2', name: 'Diamond Box', type: 'VIP', price: 500, icon: 'fa-gem', color: 'from-cyan-400 to-blue-600', prizes: ['Laptop', '3000 Tk', 'Diamond'] },
  { id: 'vip3', name: 'Golden Egg', type: 'VIP', price: 500, icon: 'fa-egg', color: 'from-yellow-300 to-yellow-500', prizes: ['Smart TV', '2000 Tk', 'Cash'] },
  { id: 'vip4', name: 'Platinum Case', type: 'VIP', price: 500, icon: 'fa-briefcase', color: 'from-slate-300 to-slate-500', prizes: ['Bike', '10000 Tk', 'Watch'] },
  { id: 'vip5', name: 'Mystery Vault', type: 'VIP', price: 500, icon: 'fa-dungeon', color: 'from-purple-500 to-indigo-600', prizes: ['PS5', '5000 Tk', 'Gadgets'] },
  // 5 Standard Cards (100 TK)
  { id: 'std1', name: 'Silver Pack', type: 'Standard', price: 100, icon: 'fa-box-open', color: 'from-gray-300 to-gray-400', prizes: ['200 Tk', 'Headphones', 'T-Shirt'] },
  { id: 'std2', name: 'Bronze Bag', type: 'Standard', price: 100, icon: 'fa-shopping-bag', color: 'from-orange-700 to-orange-900', prizes: ['150 Tk', 'Cap', 'Mug'] },
  { id: 'std3', name: 'Lucky Pouch', type: 'Standard', price: 100, icon: 'fa-sack-dollar', color: 'from-green-500 to-emerald-700', prizes: ['300 Tk', 'Mobile Recharge', 'Snacks'] },
  { id: 'std4', name: 'Starter Kit', type: 'Standard', price: 100, icon: 'fa-toolbox', color: 'from-blue-400 to-blue-500', prizes: ['120 Tk', 'Pen Drive', 'Notebook'] },
  { id: 'std5', name: 'Mini Chest', type: 'Standard', price: 100, icon: 'fa-archive', color: 'from-teal-400 to-teal-600', prizes: ['250 Tk', 'Keychain', 'Toy'] },
];

const LotteryDashboardView: React.FC<LotteryDashboardViewProps> = ({ user, updateUser, onNavigate }) => {
  const [previewCard, setPreviewCard] = useState<any | null>(null);

  const handlePurchase = (card: any) => {
    // 1. Check if user already has an active session
    if (user.activeLottery) {
      alert("You already have an active game! Please finish your draws first.");
      onNavigate('lottery_game');
      return;
    }

    // 2. Check Balance
    if (user.balance < card.price) {
      if(window.confirm(`Insufficient Balance! You need ${card.price} Tk. Go to Deposit?`)) {
        onNavigate('wallet');
      }
      return;
    }

    // 3. Confirm Purchase
    if (!window.confirm(`Purchase ${card.name} for ${card.price} Tk?`)) return;

    // 4. Generate Result Sequence (The Logic)
    // VIP: 2 Wins, 3 Losses. Standard: 2 Wins, 3 Losses (but smaller prizes).
    const results: ('Win' | 'Loss')[] = ['Win', 'Win', 'Loss', 'Loss', 'Loss'];
    // Shuffle the results randomly
    for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
    }

    // Generate specific prizes for the 'Win' slots
    const wonPrizes: InventoryItem[] = [];
    results.forEach((res, idx) => {
        if (res === 'Win') {
            const randomPrizeName = card.prizes[Math.floor(Math.random() * card.prizes.length)];
            // Simple logic to determine value based on prize name content for demo
            let val = 0;
            if (randomPrizeName.includes('Tk')) val = parseInt(randomPrizeName);
            else val = card.type === 'VIP' ? 5000 : 200; // Mock values for products

            wonPrizes.push({
                id: Date.now() + idx + '',
                name: randomPrizeName,
                type: randomPrizeName.includes('Tk') ? 'Cash' : 'Product',
                value: val,
                image: 'fa-gift',
                obtainedAt: Date.now(),
                lotteryName: card.name
            });
        }
    });

    const newSession: ActiveLotterySession = {
        cardId: card.id,
        cardName: card.name,
        type: card.type,
        drawsLeft: 5,
        resultsSequence: results,
        prizesPool: wonPrizes
    };

    const newHistory: HistoryItem = {
        id: Date.now().toString(),
        type: 'Lottery Purchase',
        amount: card.price,
        date: new Date().toLocaleDateString('en-GB'),
        status: 'Success',
        method: 'Deposit Balance'
    };

    // 5. Update User State
    updateUser(prev => ({
        balance: prev.balance - card.price,
        activeLottery: newSession,
        history: [newHistory, ...(prev.history || [])]
    }));

    // 6. Notify Telegram
    sendTelegramMessage(`🎟 *Lottery Purchased*\nUser: ${user.name}\nCard: ${card.name}\nPrice: ${card.price}\nResult Seq: ${results.join(', ')}`);

    // 7. Navigate to Game
    onNavigate('lottery_game');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-24 font-['Orbitron'] relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Header */}
        <div className="p-5 flex items-center justify-between relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
            <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                LOTTERY EVENT
            </h1>
            <div className="text-sm font-bold bg-black/40 px-3 py-1 rounded-full border border-white/10">
                Bal: ৳{user.balance}
            </div>
        </div>

        {/* Active Game Banner */}
        {user.activeLottery && (
            <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 shadow-lg animate-pulse cursor-pointer relative z-10" onClick={() => onNavigate('lottery_game')}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Game in Progress!</h3>
                        <p className="text-xs opacity-90">Click to continue your {user.activeLottery.cardName}</p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg font-bold">
                        PLAY <i className="fas fa-play ml-1"></i>
                    </div>
                </div>
            </div>
        )}

        <div className="p-4 relative z-10">
            {/* VIP Section */}
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-yellow-400">
                <i className="fas fa-crown"></i> VIP Collection <span className="text-xs bg-yellow-500 text-black px-2 rounded-sm font-bold">500৳</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
                {LOTTERY_CARDS.filter(c => c.type === 'VIP').map(card => (
                    <div key={card.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all cursor-pointer overflow-hidden" onClick={() => setPreviewCard(card)}>
                         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}></div>
                         <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                            <i className={`fas ${card.icon} text-white drop-shadow-md`}></i>
                         </div>
                         <div className="text-center">
                             <h3 className="font-bold text-sm leading-tight mb-1">{card.name}</h3>
                             <p className="text-[10px] text-gray-400">Click to Preview</p>
                         </div>
                         <button 
                            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg text-xs font-bold text-black hover:shadow-lg hover:shadow-orange-500/30 transition-shadow mt-auto"
                            onClick={(e) => { e.stopPropagation(); handlePurchase(card); }}
                         >
                             BUY NOW
                         </button>
                    </div>
                ))}
            </div>

            {/* Standard Section */}
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-300">
                <i className="fas fa-cube"></i> Standard Pack <span className="text-xs bg-gray-500 text-white px-2 rounded-sm font-bold">100৳</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {LOTTERY_CARDS.filter(c => c.type === 'Standard').map(card => (
                    <div key={card.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all cursor-pointer overflow-hidden" onClick={() => setPreviewCard(card)}>
                         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}></div>
                         <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-xl shadow-lg group-hover:rotate-6 transition-transform`}>
                            <i className={`fas ${card.icon} text-white`}></i>
                         </div>
                         <div className="text-center">
                             <h3 className="font-bold text-sm text-gray-200 leading-tight mb-1">{card.name}</h3>
                         </div>
                         <button 
                            className="w-full py-2 bg-white/10 border border-white/20 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors mt-auto"
                            onClick={(e) => { e.stopPropagation(); handlePurchase(card); }}
                         >
                             BUY - 100৳
                         </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Preview Modal */}
        {previewCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl p-6 border border-white/10 relative shadow-2xl">
                    <button onClick={() => setPreviewCard(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                    
                    <div className="text-center mb-6">
                        <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${previewCard.color} flex items-center justify-center text-4xl mb-3 shadow-lg`}>
                             <i className={`fas ${previewCard.icon} text-white`}></i>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{previewCard.name}</h2>
                        <p className="text-gray-400 text-sm">Price: <span className="text-yellow-400 font-bold">{previewCard.price} Tk</span></p>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4 mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Potential Prizes</h3>
                        <div className="space-y-2">
                            {previewCard.prizes.map((prize: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-gray-200">
                                    <i className="fas fa-gift text-purple-400"></i>
                                    <span>{prize}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-3 text-sm text-gray-500 italic">
                                <i className="fas fa-question text-gray-600"></i>
                                <span>...and empty boxes</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setPreviewCard(null); handlePurchase(previewCard); }}
                        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
                    >
                        CONFIRM PURCHASE
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default LotteryDashboardView;

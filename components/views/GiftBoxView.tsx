
import React, { useState } from 'react';
import { User, Tab, InventoryItem, SoldItem, HistoryItem } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';
import { APP_CONFIG } from '../../constants';

interface GiftBoxViewProps {
  user: User;
  updateUser: (updates: Partial<User> | ((prev: User) => Partial<User>)) => void;
  onNavigate: (tab: Tab) => void;
}

const GiftBoxView: React.FC<GiftBoxViewProps> = ({ user, updateUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sold'>('inventory');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [viewMode, setViewMode] = useState<'options' | 'delivery'>('options');
  
  // Delivery Form State
  const [deliveryName, setDeliveryName] = useState(user.name);
  const [deliveryPhone, setDeliveryPhone] = useState(user.phone);
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('bkash');
  const [trxID, setTrxID] = useState('');

  const handleSell = () => {
    if (!selectedItem) return;

    if (!window.confirm(`Sell ${selectedItem.name} for ${selectedItem.value} Tk? \nFunds will be available in 2 hours.`)) return;

    // Create Sold Item
    const soldItem: SoldItem = {
        id: Date.now().toString(),
        name: selectedItem.name,
        amount: selectedItem.value,
        soldAt: Date.now(),
        unlockTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        status: 'Pending'
    };

    // Log History
    const history: HistoryItem = {
        id: Date.now().toString(),
        type: 'Item Sold',
        amount: selectedItem.value,
        date: new Date().toLocaleDateString(),
        status: 'Pending'
    };

    // Update User: Remove from inventory, add to pendingSales
    updateUser(prev => ({
        inventory: prev.inventory?.filter(i => i.id !== selectedItem.id),
        pendingSales: [soldItem, ...(prev.pendingSales || [])],
        history: [history, ...(prev.history || [])]
    }));

    sendTelegramMessage(`🤝 *Item Sold*\nUser: ${user.name}\nItem: ${selectedItem.name}\nPrice: ${selectedItem.value}\nStatus: Funds in 2hr Hold`);

    setSelectedItem(null);
    alert('Item Sold! Check "Sold History" for status.');
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const deliveryFee = 150;
    
    // Simulate Payment
    if (!trxID || trxID.length < 5) {
        alert("Please enter a valid TrxID for the delivery fee.");
        return;
    }

    sendTelegramMessage(`🚚 *Delivery Request*\nUser: ${user.name}\nItem: ${selectedItem.name}\nAddress: ${address}\nPhone: ${deliveryPhone}\nFee TrxID: ${trxID}`);

    // Remove from inventory
    updateUser(prev => ({
        inventory: prev.inventory?.filter(i => i.id !== selectedItem.id),
    }));

    setSelectedItem(null);
    alert('Delivery Request Sent! Admin will contact you.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 pb-24 font-['Poppins']">
        <div className="bg-white p-5 shadow-sm sticky top-0 z-10 flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-gift text-purple-600"></i> My Gift Box
            </h1>
            <button onClick={() => onNavigate('home')} className="text-gray-400">
                <i className="fas fa-times text-xl"></i>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2">
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'inventory' ? 'bg-purple-600 text-white' : 'bg-white text-gray-500'}`}
            >
                Inventory ({user.inventory?.length || 0})
            </button>
            <button 
                onClick={() => setActiveTab('sold')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'sold' ? 'bg-purple-600 text-white' : 'bg-white text-gray-500'}`}
            >
                Sold History
            </button>
        </div>

        {/* Content */}
        <div className="p-4">
            {activeTab === 'inventory' ? (
                <div className="space-y-3">
                    {(!user.inventory || user.inventory.length === 0) && (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-box-open text-4xl mb-3"></i>
                            <p>No items yet. Play Lottery!</p>
                        </div>
                    )}
                    {user.inventory?.map(item => (
                        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 text-xl">
                                    <i className={`fas ${item.image}`}></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-xs text-gray-500">Value: <span className="text-green-600 font-bold">{item.value} Tk</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setSelectedItem(item); setViewMode('options'); }}
                                className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200"
                            >
                                Manage
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                     {user.pendingSales?.map(sale => (
                        <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                             <div className="flex justify-between items-start mb-2">
                                 <h3 className="font-bold text-sm">{sale.name}</h3>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                     {sale.status}
                                 </span>
                             </div>
                             <div className="flex justify-between items-end">
                                 <div>
                                     <p className="text-xs text-gray-500">Amount: {sale.amount} Tk</p>
                                     {sale.status === 'Pending' && (
                                         <p className="text-[10px] text-orange-500 mt-1">
                                             <i className="fas fa-clock mr-1"></i>
                                             Unlocks in: {Math.max(0, Math.ceil((sale.unlockTime - Date.now()) / 60000))} mins
                                         </p>
                                     )}
                                 </div>
                             </div>
                        </div>
                     ))}
                </div>
            )}
        </div>

        {/* Modal for Item Management */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                        <button onClick={() => setSelectedItem(null)} className="text-gray-400">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {viewMode === 'options' ? (
                        <div className="space-y-3">
                            <div className="p-4 bg-purple-50 rounded-xl text-center mb-4">
                                <p className="text-sm text-gray-600 mb-1">Market Price</p>
                                <h2 className="text-3xl font-bold text-purple-600">{selectedItem.value} ৳</h2>
                            </div>
                            
                            <button 
                                onClick={handleSell}
                                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-hand-holding-usd"></i> SELL NOW
                            </button>
                            <p className="text-xs text-center text-gray-400">Money added to wallet in 2 hours.</p>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <button 
                                onClick={() => setViewMode('delivery')}
                                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-truck"></i> Request Home Delivery
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleDeliverySubmit} className="space-y-4">
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-xs text-orange-800 mb-2">
                                <strong>Note:</strong> You must pay <strong>150 Tk</strong> delivery charge in advance.
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500">Full Name</label>
                                <input type="text" value={deliveryName} onChange={e => setDeliveryName(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Address</label>
                                <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border rounded-lg text-sm" rows={2} required placeholder="Village, Thana, District" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Contact Number</label>
                                <input type="tel" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} className="w-full p-2 border rounded-lg text-sm" required />
                            </div>

                            <div className="border-t pt-3">
                                <p className="text-xs font-bold mb-2">Pay 150 Tk via:</p>
                                <div className="flex gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded border text-xs cursor-pointer ${deliveryMethod === 'bkash' ? 'bg-pink-500 text-white' : 'bg-gray-100'}`} onClick={() => setDeliveryMethod('bkash')}>bKash</span>
                                    <span className={`px-3 py-1 rounded border text-xs cursor-pointer ${deliveryMethod === 'nagad' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`} onClick={() => setDeliveryMethod('nagad')}>Nagad</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">Send to: <strong>{deliveryMethod === 'bkash' ? APP_CONFIG.BKASH_NUMBER : APP_CONFIG.NAGAD_NUMBER}</strong></p>
                                <input type="text" value={trxID} onChange={e => setTrxID(e.target.value)} placeholder="Enter TrxID" className="w-full p-2 border rounded-lg text-sm" required />
                            </div>

                            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Submit Request</button>
                            <button type="button" onClick={() => setViewMode('options')} className="w-full py-2 text-xs text-gray-500">Back</button>
                        </form>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default GiftBoxView;

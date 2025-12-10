
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserData, createNewUser, updateUserData } from './services/dbService';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/views/HomeView';
import WalletView from './components/views/WalletView';
import ReferView from './components/views/ReferView';
import ProfileView from './components/views/ProfileView';
import WhatsAppGuideView from './components/views/WhatsAppGuideView';
import ImoVipView from './components/views/ImoVipView';
import LotteryDashboardView from './components/views/LotteryDashboardView';
import LotteryGameView from './components/views/LotteryGameView';
import GiftBoxView from './components/views/GiftBoxView';
import InvestTradeHubView from './components/views/InvestTradeHubView';
import LoginView from './components/views/LoginView';

import { User, Tab } from './types';
import { sendTelegramMessage } from './services/telegramService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginVerified, setIsLoginVerified] = useState(false); // Can serve as WhatsApp verification flag if still needed

  // --- Authentication & Data Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        try {
          // 1. Fetch from Firestore
          let userData = await getUserData(firebaseUser.uid);

          // 2. If no data (New Google User), create doc
          if (!userData) {
            userData = await createNewUser(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
          }
          
          // 3. Set State
          // Migration/Safety checks for old fields if any, though new schema handles it
          if (!userData.history) userData.history = [];
          if (userData.earningBalance === undefined) userData.earningBalance = 0;
          if (userData.spinCount === undefined) userData.spinCount = 0;
          if (!userData.inventory) userData.inventory = [];
          if (!userData.pendingSales) userData.pendingSales = [];
          if (!userData.investments) userData.investments = [];
          if (!userData.cryptoPortfolio) userData.cryptoPortfolio = [];

          setUser(userData);
          // Assuming Auth verified acts as the old "WhatsApp Login" verify
          setIsLoginVerified(true); 

        } catch (err) {
          console.error("Auth flow error:", err);
          alert("Error loading account data. Please check internet.");
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Real-time Logic (Sold Items unlocking) ---
  useEffect(() => {
    if (!user) return;

    const checkSales = () => {
      const now = Date.now();
      let updatedBalance = user.earningBalance || 0;
      let hasUpdates = false;
      
      const updatedPendingSales = user.pendingSales?.map(sale => {
        if (sale.status === 'Pending' && now >= sale.unlockTime) {
          updatedBalance += sale.amount;
          hasUpdates = true;
          // Notify Telegram
          sendTelegramMessage(`💰 *Item Sold Funds Released*\nUser: ${user.name}\nItem: ${sale.name}\nAmount: ${sale.amount} Tk`);
          return { ...sale, status: 'Completed' };
        }
        return sale;
      });

      if (hasUpdates) {
        updateUser({
          earningBalance: updatedBalance,
          pendingSales: updatedPendingSales as any 
        });
        alert('Funds from your sold items have been added to your Earning Balance!');
      }
    };

    checkSales();
    const interval = setInterval(checkSales, 60000); 
    return () => clearInterval(interval);
  }, [user?.pendingSales]);

  // Wrapper to update Local State + Firestore
  const updateUser = (updates: Partial<User> | ((prev: User) => Partial<User>)) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const newValues = typeof updates === 'function' ? updates(prevUser) : updates;
      const updatedUser = { ...prevUser, ...newValues };

      // Sync with Firestore
      updateUserData(prevUser.id, newValues);

      return updatedUser;
    });
  };

  const handleLogout = () => {
    // Local state clear happens in onAuthStateChanged
    // setActiveTab('home'); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-400 font-['Orbitron']">SYNCING CLOUD DATA...</p>
        </div>
      </div>
    );
  }

  // If no user, show Login Screen
  if (!user) {
    return <LoginView />;
  }

  // Optional: Keep WhatsApp Guide if you want a second layer of verification
  // For now, we assume Firebase Login is sufficient.
  // if (!isLoginVerified) { ... }

  // Full Screen Views (Overlay style)
  if (activeTab === 'whatsapp') {
    return <WhatsAppGuideView onNavigate={setActiveTab} />;
  }
  
  if (activeTab === 'imo_vip') {
    return <ImoVipView onNavigate={setActiveTab} user={user} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl">
      {activeTab !== 'invest' && <Header user={user} />}

      <main>
        {activeTab === 'home' && (
          <HomeView 
            user={user} 
            updateUser={updateUser} 
            onNavigate={setActiveTab} 
          />
        )}
        {activeTab === 'wallet' && <WalletView user={user} updateUser={updateUser} />}
        {activeTab === 'refer' && <ReferView user={user} updateUser={updateUser} />}
        {activeTab === 'profile' && <ProfileView user={user} updateUser={updateUser} onLogout={handleLogout} />}
        
        {/* Lottery System Routes */}
        {activeTab === 'lottery' && <LotteryDashboardView user={user} updateUser={updateUser} onNavigate={setActiveTab} />}
        {activeTab === 'lottery_game' && <LotteryGameView user={user} updateUser={updateUser} onNavigate={setActiveTab} />}
        {activeTab === 'gift_box' && <GiftBoxView user={user} updateUser={updateUser} onNavigate={setActiveTab} />}
        
        {/* Invest & Trade Hub Route */}
        {activeTab === 'invest' && <InvestTradeHubView user={user} updateUser={updateUser} onNavigate={setActiveTab} />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
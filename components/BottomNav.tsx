
import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: 'fa-gamepad', label: 'Spin' },
    { id: 'wallet', icon: 'fa-wallet', label: 'Wallet' },
    { id: 'invest', icon: 'fa-chart-line', label: 'Invest' },
    { id: 'gift_box', icon: 'fa-gift', label: 'Gift Box' },
    { id: 'profile', icon: 'fa-user-circle', label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-1/5 py-1 transition-colors duration-200 ${
              activeTab === item.id ? 'text-[#5856d6]' : 'text-gray-400'
            }`}
          >
            <i className={`fas ${item.icon} text-xl mb-1`}></i>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;

import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm max-w-md mx-auto w-full">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200 shadow-sm"
        />
        <div>
          <div className="font-bold text-gray-800 text-sm leading-tight">{user.name}</div>
          <div className="text-[10px] text-gray-500 font-mono">ID: {user.id}</div>
        </div>
      </div>
      
      {/* Dual Balance Display */}
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-400 uppercase">Dep</span>
          <span className="text-xs font-bold text-indigo-700">৳{user.balance.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Win</span>
          <span className="text-xs font-bold text-emerald-700">৳{(user.earningBalance || 0).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
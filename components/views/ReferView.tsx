import React from 'react';
import { User } from '../../types';
import { APP_CONFIG } from '../../constants';
import { sendTelegramMessage } from '../../services/telegramService';

interface ReferViewProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

const ReferView: React.FC<ReferViewProps> = ({ user, updateUser }) => {
  const referLink = `https://t.me/ProEarningBot?start=${user.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referLink);
    alert('Referral Link Copied!');
  };

  const handleClaimBonus = () => {
    const today = new Date().toDateString();
    const lastBonus = localStorage.getItem('lastBonus');

    if (lastBonus === today) {
      alert('Already claimed today!');
      return;
    }

    const bonusAmount = APP_CONFIG.DAILY_BONUS;
    updateUser({ balance: user.balance + bonusAmount });
    localStorage.setItem('lastBonus', today);
    
    sendTelegramMessage(`🎁 *Bonus Claimed*\nUser: ${user.name}\nAmount: ${bonusAmount}`);
    alert(`${bonusAmount} Tk Bonus Added!`);
  };

  return (
    <div className="p-5 pb-24 space-y-4">
      {/* Refer Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <i className="fas fa-users text-5xl text-blue-500 mb-4"></i>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Refer & Earn</h2>
        <p className="text-sm text-gray-500 mb-6">
          প্রতি সফল রেফারে পান {APP_CONFIG.REFER_BONUS} টাকা বোনাস!
        </p>

        <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 border border-slate-200 mb-4">
          <div className="flex-1 overflow-hidden">
            <input
              type="text"
              readOnly
              value={referLink}
              className="w-full bg-transparent border-none text-xs text-gray-600 focus:outline-none"
            />
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-[#5856d6] text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-[#4745b6] transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Daily Reward Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-800 mb-3">Daily Rewards</h4>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <i className="fas fa-calendar-check text-sm"></i>
            </div>
            <span className="text-sm font-medium text-gray-700">Daily Login</span>
          </div>
          <button
            onClick={handleClaimBonus}
            className="bg-[#5856d6] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#4745b6] transition-colors"
          >
            Claim {APP_CONFIG.DAILY_BONUS}৳
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferView;
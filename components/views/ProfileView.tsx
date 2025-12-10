import React, { useState } from 'react';
import { User } from '../../types';
import { sendTelegramMessage } from '../../services/telegramService';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

interface ProfileViewProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, updateUser, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [method, setMethod] = useState(user.paymentMethod);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, paymentMethod: method });
    sendTelegramMessage(`👤 *Profile Updated*\nID: ${user.id}\nNew Name: ${name}`);
    alert('Profile Updated Successfully!');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        onLogout(); // Clears local state if needed, though onAuthStateChanged in App.tsx handles mostly
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
  };

  return (
    <div className="p-5 pb-24 space-y-4">
      {/* Profile Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center pt-8">
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-100 shadow-sm object-cover"
        />
        <h2 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h2>
        <p className="text-xs text-gray-400 mb-4 font-mono">{user.email || 'No Email'}</p>
        <div className="inline-block bg-[#5856d6]/10 text-[#5856d6] px-4 py-1.5 rounded-full font-bold text-sm">
          Balance: ৳ {user.balance.toFixed(2)}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Update Info</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5856d6] text-sm"
              placeholder="Enter Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Mobile</label>
            <input
              type="text"
              value={user.phone || '017...'}
              readOnly
              className="w-full p-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as 'bkash' | 'nagad')}
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5856d6] text-sm bg-white"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#5856d6] hover:bg-[#4846b0] text-white font-bold py-3.5 rounded-lg transition-colors mt-2"
          >
            Save Changes
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-lg transition-colors shadow-sm"
      >
        Log Out
      </button>
    </div>
  );
};

export default ProfileView;
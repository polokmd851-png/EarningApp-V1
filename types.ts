
export interface User {
  id: string; // Changed from number to string for Firebase UID
  name: string;
  email?: string; // Added email field
  balance: number;
  earningBalance?: number;
  phone: string;
  paymentMethod: 'bkash' | 'nagad';
  history: HistoryItem[];
  spinCount: number;
  lastSpinDate: string;
  // New Fields for Lottery System
  inventory?: InventoryItem[];
  pendingSales?: SoldItem[];
  activeLottery?: ActiveLotterySession | null;
  // New Fields for Invest & Trade Hub
  investments?: UserInvestment[];
  cryptoPortfolio?: CryptoPortfolio[];
}

export interface UserInvestment {
  id: string;
  planId: string;
  planName: string;
  investedAmount: number;
  dailyReturn: number; // Amount
  startDate: number;
  endDate: number;
  lastClaimDate: string; // DateString to track daily tasks
  status: 'Active' | 'Completed';
}

export interface CryptoPortfolio {
  symbol: string; // e.g., 'BTC'
  amount: number; // Quantity held
  avgBuyPrice: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Cash' | 'Product';
  value: number; // Market Price
  image: string; // Icon/Image class
  obtainedAt: number;
  lotteryName: string;
}

export interface SoldItem {
  id: string;
  name: string;
  amount: number;
  soldAt: number;
  unlockTime: number; // When money becomes available
  status: 'Pending' | 'Completed';
}

export interface ActiveLotterySession {
  cardId: string;
  cardName: string;
  type: 'VIP' | 'Standard';
  drawsLeft: number;
  resultsSequence: ('Win' | 'Loss')[]; // The pre-calculated outcome
  prizesPool: InventoryItem[]; // The specific prizes won so far or waiting to be revealed
}

export interface HistoryItem {
  id: string;
  type: 'Deposit' | 'Withdraw' | 'Loan' | 'Spin' | 'Lottery Purchase' | 'Item Sold' | 'Delivery Fee' | 'Investment' | 'Trade Buy' | 'Trade Sell' | 'Game TopUp' | 'Daily Profit';
  amount: number;
  date: string;
  status: 'Pending' | 'Success' | 'Rejected';
  method?: string;
}

export type Tab = 'home' | 'wallet' | 'refer' | 'profile' | 'whatsapp' | 'imo_vip' | 'lottery' | 'lottery_game' | 'gift_box' | 'invest';

export interface TelegramConfig {
  botToken: string;
  adminChatId: string;
}

export interface Transaction {
  amount: string;
  sender: string;
  trxID: string;
  method: 'bkash' | 'nagad';
}
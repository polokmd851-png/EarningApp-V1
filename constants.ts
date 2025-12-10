
// Replace these with your actual details
export const APP_CONFIG = {
  // New Token from your provided code
  TELEGRAM_BOT_TOKEN: '7974529959:AAGLoG3GzH7xcn-juDFnGsmNE4SWkQUkeOI',
  ADMIN_CHAT_ID: '6658445342',
  
  BKASH_NUMBER: '01744564593',
  NAGAD_NUMBER: '01806853977',
  SPIN_COST: 50,
  DAILY_BONUS: 10,
  REFER_BONUS: 50,
  DAILY_FREE_SPIN_LIMIT: 10,
};

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBgaF__GMQLqDATz5RuPHoP093LFdSr4ws",
  authDomain: "earningappbd-7562c.firebaseapp.com",
  projectId: "earningappbd-7562c",
  storageBucket: "earningappbd-7562c.firebasestorage.app",
  messagingSenderId: "113140819610",
  appId: "1:113140819610:web:1cf8060ab173d53a4f2123",
  measurementId: "G-B6PGN2VXHH"
};

export const DEFAULT_USER: any = {
  id: '', // Changed to string
  name: 'Guest User',
  balance: 0,
  earningBalance: 0,
  phone: '',
  paymentMethod: 'bkash',
  history: [],
  spinCount: 0,
  lastSpinDate: new Date().toDateString(),
};

export const WHEEL_COLORS = [
  '#ff5252', // Red
  '#ffb142', // Orange
  '#2ecc71', // Green
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#f1c40f', // Yellow
];
import { APP_CONFIG } from '../constants';

export const sendTelegramMessage = async (message: string): Promise<void> => {
  const { TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID } = APP_CONFIG;

  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.warn('Telegram Token is missing or default. Message not sent:', message);
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
};
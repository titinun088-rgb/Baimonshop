// Telegram Bot Utilities
import { EmailPassGameOrder } from '@/types/emailPassGame';
import logger from './logger';

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8590431550:AAFw1fYHBzAyyLa95Ap64Z1FtPO7-E_2ksY';
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''; // ต้องตั้งค่าใน .env.local

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * ส่งข้อความไป Telegram
 */
async function sendTelegramMessage(
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<number | null> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      logger.debug('✅ Telegram message sent:', data.result.message_id);
      return data.result.message_id;
    } else {
      logger.error('❌ Telegram API error:', data);
      return null;
    }
  } catch (error) {
    logger.error('❌ Error sending telegram message:', error);
    return null;
  }
}

/**
 * อัปเดตข้อความใน Telegram
 */
async function editTelegramMessage(
  chatId: string,
  messageId: number,
  newMessage: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newMessage,
        parse_mode: parseMode
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      logger.debug('✅ Telegram message updated');
      return true;
    } else {
      logger.error('❌ Telegram edit error:', data);
      return false;
    }
  } catch (error) {
    logger.error('❌ Error editing telegram message:', error);
    return false;
  }
}

/**
 * สร้างข้อความสำหรับออเดอร์ใหม่
 */
function formatNewOrderMessage(order: EmailPassGameOrder): string {
  const statusEmoji = '🆕';
  const gameEmoji = '🎮';
  
  return `
${statusEmoji} <b>ออเดอร์ใหม่!</b>

${gameEmoji} <b>เกม:</b> ${order.gameName}
📦 <b>แพ็กเกจ:</b> ${order.packageName}
💰 <b>ราคา:</b> ${order.price.toLocaleString()} บาท

📧 <b>อีเมล:</b> <code>${order.gameEmail}</code>
🔐 <b>พาสเวิร์ด:</b> <code>${order.gamePassword}</code>

👤 <b>ลูกค้า:</b> ${order.userEmail}
🆔 <b>Order ID:</b> <code>${order.id}</code>
⏰ <b>เวลา:</b> ${new Date(order.createdAt.toDate()).toLocaleString('th-TH')}

${order.note ? `📝 <b>หมายเหตุ:</b> ${order.note}\n` : ''}
📊 <b>สถานะ:</b> รอดำเนินการ
`.trim();
}

/**
 * สร้างข้อความสำหรับอัปเดตสถานะ
 */
function formatStatusUpdateMessage(order: EmailPassGameOrder): string {
  const statusEmojis = {
    pending: '⏳',
    processing: '⚙️',
    completed: '✅',
    cancelled: '❌',
    failed: '⚠️'
  };
  
  const statusTexts = {
    pending: 'รอดำเนินการ',
    processing: 'กำลังทำ',
    completed: 'สำเร็จ',
    cancelled: 'ยกเลิก',
    failed: 'ล้มเหลว'
  };

  const emoji = statusEmojis[order.status];
  const statusText = statusTexts[order.status];
  const gameEmoji = '🎮';

  let message = `
${emoji} <b>อัปเดตสถานะ</b>

${gameEmoji} <b>เกม:</b> ${order.gameName}
📦 <b>แพ็กเกจ:</b> ${order.packageName}
💰 <b>ราคา:</b> ${order.price.toLocaleString()} บาท

📧 <b>อีเมล:</b> <code>${order.gameEmail}</code>
🔐 <b>พาสเวิร์ด:</b> <code>${order.gamePassword}</code>

👤 <b>ลูกค้า:</b> ${order.userEmail}
🆔 <b>Order ID:</b> <code>${order.id}</code>
⏰ <b>เวลาสั่ง:</b> ${new Date(order.createdAt.toDate()).toLocaleString('th-TH')}

${order.note ? `📝 <b>หมายเหตุลูกค้า:</b> ${order.note}\n` : ''}${order.adminNote ? `💬 <b>หมายเหตุแอดมิน:</b> ${order.adminNote}\n` : ''}
📊 <b>สถานะ:</b> ${statusText}
`.trim();

  if (order.completedAt) {
    message += `\n✅ <b>เสร็จเมื่อ:</b> ${new Date(order.completedAt.toDate()).toLocaleString('th-TH')}`;
  }

  if (order.completedBy) {
    message += `\n👨‍💼 <b>ทำโดย:</b> ${order.completedBy}`;
  }

  return message;
}

/**
 * ส่งแจ้งเตือนออเดอร์ใหม่
 */
export async function sendNewOrderNotification(
  order: EmailPassGameOrder,
  chatId?: string
): Promise<number | null> {
  const targetChatId = chatId || TELEGRAM_CHAT_ID;
  
  if (!targetChatId) {
    logger.warn('⚠️ Telegram Chat ID not configured');
    return null;
  }

  const message = formatNewOrderMessage(order);
  return await sendTelegramMessage(targetChatId, message);
}

/**
 * ส่งแจ้งเตือนอัปเดตสถานะ
 */
export async function sendStatusUpdateNotification(
  order: EmailPassGameOrder,
  chatId?: string,
  messageId?: number
): Promise<boolean> {
  const targetChatId = chatId || TELEGRAM_CHAT_ID;
  
  if (!targetChatId) {
    logger.warn('⚠️ Telegram Chat ID not configured');
    return false;
  }

  const message = formatStatusUpdateMessage(order);
  
  // ถ้ามี message ID ให้แก้ไขข้อความเดิม ไม่งั้นส่งใหม่
  if (messageId && order.telegramMessageId) {
    return await editTelegramMessage(targetChatId, messageId, message);
  } else {
    const newMessageId = await sendTelegramMessage(targetChatId, message);
    return newMessageId !== null;
  }
}

/**
 * ทดสอบการเชื่อมต่อ Telegram Bot
 */
export async function testTelegramConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      logger.debug('✅ Telegram Bot connected:', data.result);
      return true;
    } else {
      logger.error('❌ Telegram Bot error:', data);
      return false;
    }
  } catch (error) {
    logger.error('❌ Error testing telegram:', error);
    return false;
  }
}

/**
 * ดึงข้อมูล Chat
 */
export async function getTelegramUpdates(): Promise<any> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);
    const data = await response.json();
    
    if (data.ok) {
      logger.debug('✅ Telegram updates:', data.result);
      return data.result;
    } else {
      logger.error('❌ Telegram error:', data);
      return null;
    }
  } catch (error) {
    logger.error('❌ Error getting updates:', error);
    return null;
  }
}

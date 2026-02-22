import { getTelegramUpdates, testTelegramConnection } from '@/lib/telegramBotUtils';

/**
 * วิธีหา Telegram Chat ID
 * 
 * 1. ส่งข้อความ /start ไปที่บอท @BaimonshopBot
 * 2. รันฟังก์ชันนี้ใน console:
 */

async function findChatId() {
  console.log('🔍 กำลังค้นหา Chat ID...');
  
  // ทดสอบการเชื่อมต่อก่อน
  const connected = await testTelegramConnection();
  if (!connected) {
    console.error('❌ ไม่สามารถเชื่อมต่อ Telegram Bot ได้');
    return;
  }
  
  // ดึงข้อความล่าสุด
  const updates = await getTelegramUpdates();
  
  if (updates && updates.length > 0) {
    console.log('✅ พบข้อความ:');
    updates.forEach((update: any) => {
      if (update.message) {
        const chatId = update.message.chat.id;
        const username = update.message.from.username || update.message.from.first_name;
        const text = update.message.text;
        
        console.log(`
📱 Chat ID: ${chatId}
👤 จาก: ${username}
💬 ข้อความ: ${text}
        `);
      }
    });
    
    // แสดง Chat ID ล่าสุด
    const lastMessage = updates[updates.length - 1];
    if (lastMessage.message) {
      const chatId = lastMessage.message.chat.id;
      console.log(`
⭐ ใช้ Chat ID นี้:
VITE_TELEGRAM_CHAT_ID=${chatId}
      `);
    }
  } else {
    console.log('⚠️ ไม่พบข้อความ กรุณาส่ง /start ไปที่บอทก่อน');
  }
}

// Export ให้เรียกใช้งานได้
(window as any).findChatId = findChatId;

console.log('💡 วิธีใช้งาน:');
console.log('1. ส่ง /start ไปที่ @BaimonshopBot');
console.log('2. พิมพ์ใน console: findChatId()');

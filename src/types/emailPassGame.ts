// Types สำหรับระบบเติมเกมแบบอีเมล + พาสเวิร์ด

import { Timestamp } from 'firebase/firestore';

// เกมที่เติมแบบอีเมล + พาสเวิร์ด
export interface EmailPassGame {
  id: string;
  name: string;                    // ชื่อเกม เช่น "Free Fire", "PUBG Mobile"
  icon: string;                    // URL ของไอคอนเกม
  description?: string;            // คำอธิบายเกม
  topUpType: 'email_password';     // ประเภทการเติม
  active: boolean;                 // เปิด/ปิดการใช้งาน
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;              // Admin ที่สร้าง
}

// แพ็กเกจราคาของเกม
export interface GamePackage {
  id: string;
  gameId: string;                 // อ้างอิงไปยัง EmailPassGame
  name: string;                   // ชื่อแพ็กเกจ เช่น "50 เพชร", "100 เพชร"
  price: number;                  // ราคา (บาท)
  description?: string;           // รายละเอียดเพิ่มเติม
  value: string;                  // มูลค่าที่ได้ เช่น "50", "100"
  unit: string;                   // หน่วย เช่น "เพชร", "UC", "Coin"
  active: boolean;
  order: number;                  // ลำดับการแสดงผล
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ออเดอร์การเติมเกม
export interface EmailPassGameOrder {
  id: string;
  userId: string;                 // ผู้ใช้ที่สั่ง
  userEmail: string;              // อีเมลผู้ใช้
  gameId: string;                 // เกมที่เลือก
  gameName: string;               // ชื่อเกม (เก็บไว้เผื่อเกมถูกลบ)
  packageId: string;              // แพ็กเกจที่เลือก
  packageName: string;            // ชื่อแพ็กเกจ
  packageValue: string;           // มูลค่า เช่น "50"
  packageUnit: string;            // หน่วย เช่น "เพชร"
  price: number;                  // ราคาที่จ่าย
  
  // ข้อมูลเกม (อีเมล + พาสเวิร์ด)
  gameEmail: string;              // อีเมลของเกม
  gamePassword: string;           // พาสเวิร์ดของเกม
  
  // สถานะ
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  
  // ข้อมูลเพิ่มเติม
  note?: string;                  // หมายเหตุจากลูกค้า
  adminNote?: string;             // หมายเหตุจากแอดมิน
  completedBy?: string;           // แอดมินที่ทำรายการเสร็จ
  
  // เวลา
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  
  // Telegram
  telegramMessageId?: number;     // ID ของข้อความที่ส่งไป Telegram
  telegramChatId?: number;        // Chat ID ที่ส่งไป
}

// สถิติของเกม
export interface GameStats {
  gameId: string;
  gameName: string;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lastOrderDate?: Timestamp;
}

// Filter สำหรับค้นหาออเดอร์
export interface OrderFilter {
  gameId?: string;
  userId?: string;
  status?: EmailPassGameOrder['status'];
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

// Dashboard Stats
export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  topGames: GameStats[];
}

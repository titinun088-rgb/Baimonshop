// ประเภทข้อมูลสำหรับ Activity Logs

export type ActivityAction = 
  // Game actions
  | "game_created" 
  | "game_updated" 
  | "game_deleted"
  // Game Item actions
  | "game_item_created"
  | "game_item_updated"
  | "game_item_deleted"
  // Sale actions
  | "sale_created"
  | "sale_deleted"
  // User actions
  | "user_login"
  | "user_logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  // Report actions
  | "report_created"
  | "report_updated"
  | "report_deleted"
  // Notification actions
  | "notification_created"
  | "notification_updated"
  | "notification_deleted";

export interface ActivityLog {
  id: string;
  userId: string; // UID ของผู้ทำ
  email: string; // อีเมลผู้ทำ
  shopName?: string; // ชื่อร้าน (ถ้ามี)
  action: ActivityAction; // ประเภทกิจกรรม
  details: string; // รายละเอียด
  metadata?: Record<string, any>; // ข้อมูลเพิ่มเติม (เช่น gameId, saleId)
  timestamp: Date; // เวลาที่เกิด
}

export interface ActivityLogInput {
  userId: string;
  email: string;
  shopName?: string;
  action: ActivityAction;
  details: string;
  metadata?: Record<string, any>;
}

// สำหรับ Filter
export interface ActivityFilter {
  userId?: string; // กรองตามผู้ใช้
  action?: ActivityAction; // กรองตามประเภท
  startDate?: Date; // กรองตามวันที่เริ่มต้น
  endDate?: Date; // กรองตามวันที่สิ้นสุด
}

// สำหรับสถิติ
export interface ActivityStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  topUsers: Array<{
    userId: string;
    email: string;
    shopName?: string;
    count: number;
  }>;
  actionBreakdown: Array<{
    action: ActivityAction;
    count: number;
  }>;
}




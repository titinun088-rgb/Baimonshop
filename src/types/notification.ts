// ประเภทข้อมูลสำหรับแจ้งเตือน (Notifications)

export type NotificationType = "info" | "warning" | "success" | "error";
export type NotificationShowMode = "always" | "once"; // แสดงทุกครั้ง หรือ ครั้งเดียว
export type NotificationTarget = "all" | "specific"; // ทั้งระบบ หรือ เฉพาะคน

export interface Notification {
  id: string;
  title: string; // หัวข้อ
  message: string; // ข้อความ
  type: NotificationType; // ประเภท (info, warning, success, error)
  showMode: NotificationShowMode; // โหมดการแสดง (always = ทุกครั้ง, once = ครั้งเดียว)
  targetType: NotificationTarget; // เป้าหมาย (all = ทั้งระบบ, specific = เฉพาะคน)
  targetUserId?: string; // ID ของผู้ใช้เฉพาะ (ถ้า targetType = "specific")
  targetUserEmail?: string; // อีเมลของผู้ใช้เฉพาะ
  readBy: string[]; // Array ของ userId ที่อ่านแล้ว (สำหรับ showMode = "once")
  active: boolean; // เปิด/ปิดการแสดงผล
  createdBy: string; // UID ของ Admin ที่สร้าง
  createdAt: Date; // วันที่สร้าง
  updatedAt?: Date; // วันที่อัปเดต
}

export interface NotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  showMode: NotificationShowMode;
  targetType: NotificationTarget;
  targetUserId?: string;
}

// ประเภทข้อมูลสำหรับรายงานปัญหา (Reports)
export type ReportStatus = "pending" | "in-progress" | "resolved" | "rejected";

export interface Report {
  id: string;
  userId: string; // UID ของผู้แจ้ง
  userEmail: string; // อีเมลผู้แจ้ง
  shopName?: string; // ชื่อร้าน
  title: string; // หัวข้อปัญหา
  description: string; // รายละเอียด
  status: ReportStatus; // สถานะ
  priority: "low" | "medium" | "high"; // ความสำคัญ
  category: string; // หมวดหมู่ (technical, billing, feature, other)
  adminNote?: string; // บันทึกจาก Admin
  resolvedBy?: string; // UID ของ Admin ที่แก้ไข
  createdAt: Date; // วันที่แจ้ง
  updatedAt?: Date; // วันที่อัปเดต
  resolvedAt?: Date; // วันที่แก้ไขเสร็จ
}

export interface ReportInput {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
}




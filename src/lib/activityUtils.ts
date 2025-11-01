import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { ActivityLog, ActivityLogInput, ActivityFilter, ActivityStats } from "@/types/activity";

/**
 * บันทึก Activity Log
 */
export async function logActivity(
  data: ActivityLogInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const logData = {
      userId: data.userId,
      email: data.email,
      shopName: data.shopName || null,
      action: data.action,
      details: data.details,
      metadata: data.metadata || null,
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(db, "activityLogs"), logData);
    console.log("✅ activityUtils: บันทึก log สำเร็จ:", data.action);
    return { success: true };
  } catch (error: any) {
    console.error("❌ activityUtils: Error logging activity:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการบันทึก log",
    };
  }
}

/**
 * ดึง Activity Logs ทั้งหมด
 */
export async function getAllActivityLogs(): Promise<ActivityLog[]> {
  try {
    console.log("🔍 activityUtils: ดึง activity logs ทั้งหมด");
    const logsRef = collection(db, "activityLogs");
    const snapshot = await getDocs(logsRef);

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        email: data.email || "",
        shopName: data.shopName || undefined,
        action: data.action || "",
        details: data.details || "",
        metadata: data.metadata || undefined,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(),
      } as ActivityLog;
    });

    // เรียงลำดับใหม่สุดก่อน (client-side)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log("✅ activityUtils: พบ logs", logs.length, "รายการ");
    return logs;
  } catch (error) {
    console.error("❌ activityUtils: Error getting logs:", error);
    return [];
  }
}

/**
 * ดึง Activity Logs ของผู้ใช้
 */
export async function getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
  try {
    console.log("🔍 activityUtils: ดึง activity logs ของ user:", userId);
    const logsRef = collection(db, "activityLogs");
    const q = query(logsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        email: data.email || "",
        shopName: data.shopName || undefined,
        action: data.action || "",
        details: data.details || "",
        metadata: data.metadata || undefined,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(),
      } as ActivityLog;
    });

    // เรียงลำดับใหม่สุดก่อน (client-side)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log("✅ activityUtils: พบ logs", logs.length, "รายการ");
    return logs;
  } catch (error) {
    console.error("❌ activityUtils: Error getting logs:", error);
    return [];
  }
}

/**
 * กรอง Activity Logs
 */
export function filterActivityLogs(
  logs: ActivityLog[],
  filter: ActivityFilter
): ActivityLog[] {
  let filtered = [...logs];

  // กรองตามผู้ใช้
  if (filter.userId) {
    filtered = filtered.filter((log) => log.userId === filter.userId);
  }

  // กรองตามประเภท
  if (filter.action) {
    filtered = filtered.filter((log) => log.action === filter.action);
  }

  // กรองตามวันที่เริ่มต้น
  if (filter.startDate) {
    filtered = filtered.filter((log) => log.timestamp >= filter.startDate!);
  }

  // กรองตามวันที่สิ้นสุด
  if (filter.endDate) {
    const endOfDay = new Date(filter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter((log) => log.timestamp <= endOfDay);
  }

  return filtered;
}

/**
 * คำนวณสถิติ Activity Logs
 */
export function calculateActivityStats(logs: ActivityLog[]): ActivityStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // นับ logs ตามช่วงเวลา
  const todayLogs = logs.filter((log) => log.timestamp >= todayStart).length;
  const weekLogs = logs.filter((log) => log.timestamp >= weekStart).length;
  const monthLogs = logs.filter((log) => log.timestamp >= monthStart).length;

  // นับ logs ตามผู้ใช้
  const userCounts = new Map<string, { email: string; shopName?: string; count: number }>();
  logs.forEach((log) => {
    const existing = userCounts.get(log.userId);
    if (existing) {
      existing.count++;
    } else {
      userCounts.set(log.userId, {
        email: log.email,
        shopName: log.shopName,
        count: 1,
      });
    }
  });

  // Top 5 users
  const topUsers = Array.from(userCounts.entries())
    .map(([userId, data]) => ({
      userId,
      email: data.email,
      shopName: data.shopName,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // นับ logs ตามประเภท
  const actionCounts = new Map<string, number>();
  logs.forEach((log) => {
    const count = actionCounts.get(log.action) || 0;
    actionCounts.set(log.action, count + 1);
  });

  const actionBreakdown = Array.from(actionCounts.entries())
    .map(([action, count]) => ({
      action: action as any,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLogs: logs.length,
    todayLogs,
    weekLogs,
    monthLogs,
    topUsers,
    actionBreakdown,
  };
}

/**
 * แปล action เป็นภาษาไทย
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    game_created: "สร้างเกมใหม่",
    game_updated: "แก้ไขเกม",
    game_deleted: "ลบเกม",
    game_item_created: "เพิ่มรายการเติม",
    game_item_updated: "แก้ไขรายการเติม",
    game_item_deleted: "ลบรายการเติม",
    sale_created: "บันทึกยอดขาย",
    sale_deleted: "ลบยอดขาย",
    user_login: "เข้าสู่ระบบ",
    user_logout: "ออกจากระบบ",
    user_created: "สร้างผู้ใช้",
    user_updated: "แก้ไขผู้ใช้",
    user_deleted: "ลบผู้ใช้",
    report_created: "แจ้งปัญหา",
    report_updated: "อัปเดตรายงานปัญหา",
    report_deleted: "ลบรายงานปัญหา",
    notification_created: "สร้างประกาศ",
    notification_updated: "แก้ไขประกาศ",
    notification_deleted: "ลบประกาศ",
  };
  return labels[action] || action;
}

/**
 * แปล action เป็นสี
 */
export function getActionColor(action: string): string {
  if (action.includes("created")) return "text-green-500";
  if (action.includes("updated")) return "text-blue-500";
  if (action.includes("deleted")) return "text-red-500";
  if (action.includes("login")) return "text-purple-500";
  return "text-gray-500";
}

/**
 * แปล action เป็น icon
 */
export function getActionIcon(action: string): string {
  if (action.includes("game")) return "🎮";
  if (action.includes("sale")) return "💰";
  if (action.includes("user")) return "👤";
  if (action.includes("report")) return "📋";
  if (action.includes("notification")) return "🔔";
  return "📝";
}




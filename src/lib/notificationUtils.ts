import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import { Notification, NotificationInput } from "@/types/notification";

/**
 * สร้างแจ้งเตือนใหม่ (Admin only)
 */
export async function createNotification(
  adminId: string,
  data: NotificationInput,
  targetUserEmail?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log("📝 notificationUtils: กำลังสร้างแจ้งเตือน...", data);

    const newNotification = {
      title: data.title,
      message: data.message,
      type: data.type,
      showMode: data.showMode,
      targetType: data.targetType,
      targetUserId: data.targetUserId || null,
      targetUserEmail: targetUserEmail || null,
      readBy: [],
      active: true,
      createdBy: adminId,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, "notifications"),
      newNotification
    );
    console.log("✅ notificationUtils: สร้างแจ้งเตือนสำเร็จ! Doc ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ notificationUtils: Error creating notification:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างแจ้งเตือน",
    };
  }
}

/**
 * ดึงแจ้งเตือนทั้งหมด (Admin)
 */
export async function getAllNotifications(): Promise<Notification[]> {
  try {
    console.log("🔍 notificationUtils: ดึงแจ้งเตือนทั้งหมด");
    const notificationsRef = collection(db, "notifications");
    const snapshot = await getDocs(notificationsRef);

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "ไม่มีหัวข้อ",
        message: data.message || "",
        type: data.type || "info",
        showMode: data.showMode || "once",
        targetType: data.targetType || "all",
        targetUserId: data.targetUserId,
        targetUserEmail: data.targetUserEmail,
        readBy: data.readBy || [],
        active: data.active !== false,
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : undefined,
      } as Notification;
    });

    // เรียงลำดับใหม่สุดก่อน
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ notificationUtils: พบแจ้งเตือน", notifications.length, "รายการ");
    return notifications;
  } catch (error) {
    console.error("❌ notificationUtils: Error getting notifications:", error);
    return [];
  }
}

/**
 * ดึงแจ้งเตือนสำหรับผู้ใช้ (แสดงเฉพาะที่เกี่ยวข้อง)
 */
export async function getNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  try {
    console.log("🔍 notificationUtils: ดึงแจ้งเตือนสำหรับผู้ใช้:", userId);
    
    const notificationsRef = collection(db, "notifications");
    const snapshot = await getDocs(notificationsRef);

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "ไม่มีหัวข้อ",
          message: data.message || "",
          type: data.type || "info",
          showMode: data.showMode || "once",
          targetType: data.targetType || "all",
          targetUserId: data.targetUserId,
          targetUserEmail: data.targetUserEmail,
          readBy: data.readBy || [],
          active: data.active !== false,
          createdBy: data.createdBy || "",
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : undefined,
        } as Notification;
      })
      .filter((notif) => {
        // กรองเฉพาะที่ active = true
        if (!notif.active) return false;

        // ถ้าเป็น "all" = แสดงให้ทุกคน
        if (notif.targetType === "all") {
          // ถ้า showMode = "once" และอ่านแล้ว → ไม่แสดง
          if (notif.showMode === "once" && notif.readBy.includes(userId)) {
            return false;
          }
          return true;
        }

        // ถ้าเป็น "specific" = แสดงเฉพาะคนนั้น
        if (notif.targetType === "specific" && notif.targetUserId === userId) {
          // ถ้า showMode = "once" และอ่านแล้ว → ไม่แสดง
          if (notif.showMode === "once" && notif.readBy.includes(userId)) {
            return false;
          }
          return true;
        }

        return false;
      });

    // เรียงลำดับใหม่สุดก่อน
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ notificationUtils: พบแจ้งเตือน", notifications.length, "รายการ");
    return notifications;
  } catch (error) {
    console.error("❌ notificationUtils: Error getting notifications:", error);
    return [];
  }
}

/**
 * ทำเครื่องหมายว่าอ่านแล้ว (สำหรับ showMode = "once")
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📖 notificationUtils: ทำเครื่องหมายว่าอ่านแล้ว:", notificationId);
    
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, {
      readBy: arrayUnion(userId),
    });

    console.log("✅ notificationUtils: ทำเครื่องหมายสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ notificationUtils: Error marking as read:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * อัปเดตแจ้งเตือน (Admin)
 */
export async function updateNotification(
  notificationId: string,
  updates: Partial<Notification>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("✏️ notificationUtils: อัปเดตแจ้งเตือน:", notificationId);
    
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ notificationUtils: อัปเดตสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ notificationUtils: Error updating notification:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดต",
    };
  }
}

/**
 * ลบแจ้งเตือน (Admin)
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🗑️ notificationUtils: กำลังลบแจ้งเตือน:", notificationId);
    await deleteDoc(doc(db, "notifications", notificationId));
    console.log("✅ notificationUtils: ลบแจ้งเตือนสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ notificationUtils: Error deleting notification:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบ",
    };
  }
}

/**
 * เปิด/ปิดแจ้งเตือน (Admin)
 */
export async function toggleNotificationActive(
  notificationId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 notificationUtils: ${active ? "เปิด" : "ปิด"}แจ้งเตือน:`, notificationId);
    
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, {
      active,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ notificationUtils: อัปเดตสถานะสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ notificationUtils: Error toggling active:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาด",
    };
  }
}




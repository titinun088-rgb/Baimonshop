import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { UserRole } from "@/contexts/AuthContext";
import { logActivity } from "./activityUtils";

/**
 * เปลี่ยน role ของผู้ใช้
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminInfo?: { userId: string; email: string; shopName?: string; targetEmail?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 userManagementUtils: เปลี่ยน role ของ ${userId} เป็น ${newRole}`);
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Timestamp.now(),
    });

    // บันทึก Activity Log
    if (adminInfo) {
      await logActivity({
        userId: adminInfo.userId,
        email: adminInfo.email,
        shopName: adminInfo.shopName,
        action: "user_updated",
        details: `เปลี่ยนบทบาทของ "${adminInfo.targetEmail || userId}" เป็น ${newRole === 'admin' ? 'Admin' : 'Seller'}`,
        metadata: { targetUserId: userId, newRole },
      });
    }

    console.log("✅ userManagementUtils: เปลี่ยน role สำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ userManagementUtils: Error updating role:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท",
    };
  }
}

/**
 * พักบัญชีผู้ใช้
 */
export async function suspendUser(
  userId: string,
  reason: string,
  suspendUntil?: Date | null, // null = พักถาวร, undefined = ไม่กำหนด, Date = พักถึงวันที่
  adminInfo?: { userId: string; email: string; shopName?: string; targetEmail?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚫 userManagementUtils: พักบัญชี ${userId}`);
    
    const userRef = doc(db, "users", userId);
    const updateData: any = {
      suspended: true,
      suspendReason: reason,
      updatedAt: Timestamp.now(),
    };

    // ถ้ากำหนดวันหมดอายุ
    if (suspendUntil) {
      updateData.suspendedUntil = Timestamp.fromDate(suspendUntil);
    } else {
      // พักถาวร (จนกว่าจะปลด)
      updateData.suspendedUntil = null;
    }

    await updateDoc(userRef, updateData);

    // บันทึก Activity Log
    if (adminInfo) {
      const suspendType = suspendUntil 
        ? `ถึงวันที่ ${suspendUntil.toLocaleDateString('th-TH')}`
        : "จนกว่าจะปลดพัก";
      
      await logActivity({
        userId: adminInfo.userId,
        email: adminInfo.email,
        shopName: adminInfo.shopName,
        action: "user_updated",
        details: `พักบัญชี "${adminInfo.targetEmail || userId}" (${suspendType}) - เหตุผล: ${reason}`,
        metadata: { targetUserId: userId, suspended: true, suspendUntil, reason },
      });
    }

    console.log("✅ userManagementUtils: พักบัญชีสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ userManagementUtils: Error suspending user:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการพักบัญชี",
    };
  }
}

/**
 * ปลดพักบัญชีผู้ใช้
 */
export async function unsuspendUser(
  userId: string,
  adminInfo?: { userId: string; email: string; shopName?: string; targetEmail?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`✅ userManagementUtils: ปลดพักบัญชี ${userId}`);
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      suspended: false,
      suspendedUntil: null,
      suspendReason: null,
      updatedAt: Timestamp.now(),
    });

    // บันทึก Activity Log
    if (adminInfo) {
      await logActivity({
        userId: adminInfo.userId,
        email: adminInfo.email,
        shopName: adminInfo.shopName,
        action: "user_updated",
        details: `ปลดพักบัญชี "${adminInfo.targetEmail || userId}"`,
        metadata: { targetUserId: userId, suspended: false },
      });
    }

    console.log("✅ userManagementUtils: ปลดพักบัญชีสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ userManagementUtils: Error unsuspending user:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการปลดพักบัญชี",
    };
  }
}

/**
 * เช็คว่าบัญชีถูกพักหรือไม่ (และครบกำหนดปลดพักหรือยัง)
 */
export function isUserSuspended(
  suspended: boolean,
  suspendedUntil?: Date
): { isSuspended: boolean; reason?: string } {
  if (!suspended) {
    return { isSuspended: false };
  }

  // ถ้าไม่มีวันหมดอายุ = พักถาวร
  if (!suspendedUntil) {
    return { isSuspended: true, reason: "บัญชีถูกพักถาวร" };
  }

  // เช็คว่าครบกำหนดปลดพักหรือยัง
  const now = new Date();
  if (now >= suspendedUntil) {
    return { isSuspended: false, reason: "หมดอายุการพัก" };
  }

  return {
    isSuspended: true,
    reason: `บัญชีถูกพักถึงวันที่ ${suspendedUntil.toLocaleDateString('th-TH')}`,
  };
}




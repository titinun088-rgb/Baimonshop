import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { logActivity } from "./activityUtils";

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
 */
export async function updateUserProfile(data: {
  userId: string;
  displayName?: string;
  shopName?: string;
  photoURL?: string;
  email?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 Updating user profile...", data);
    
    const { userId, displayName, shopName, photoURL } = data;
    const user = auth.currentUser;

    // อัปเดต Firebase Auth profile
    if (user && (displayName || photoURL !== undefined)) {
      const updates: { displayName?: string; photoURL?: string | null } = {};
      if (displayName) updates.displayName = displayName;
      if (photoURL !== undefined) updates.photoURL = photoURL || null;
      
      await updateProfile(user, updates);
    }

    // อัปเดต Firestore
    const userRef = doc(db, "users", userId);
    const firestoreUpdates: any = {
      updatedAt: Timestamp.now(),
    };

    if (displayName) firestoreUpdates.displayName = displayName;
    if (shopName) firestoreUpdates.shopName = shopName;
    if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL || null;

    await updateDoc(userRef, firestoreUpdates);

    // บันทึก Activity Log
    await logActivity({
      userId,
      email: user?.email || data.email || "",
      shopName: shopName || "",
      action: "profile_updated",
      details: "อัปเดตข้อมูลโปรไฟล์",
      metadata: { updates: firestoreUpdates },
    });

    console.log("✅ Profile updated successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error updating profile:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์",
    };
  }
}

/**
 * เปลี่ยนรหัสผ่าน
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 Changing password...");
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    // Re-authenticate ก่อนเปลี่ยนรหัสผ่าน
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // เปลี่ยนรหัสผ่าน
    await updatePassword(user, newPassword);

    // บันทึก Activity Log
    await logActivity({
      userId: user.uid,
      email: userEmail,
      shopName: user.displayName || "",
      action: "password_changed",
      details: "เปลี่ยนรหัสผ่านสำเร็จ",
    });

    console.log("✅ Password changed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error changing password:", error);
    
    let errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
    
    if (error.code === "auth/wrong-password") {
      errorMessage = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร";
    } else if (error.code === "auth/requires-recent-login") {
      errorMessage = "กรุณาล็อกอินใหม่ก่อนเปลี่ยนรหัสผ่าน";
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * ตรวจสอบความถูกต้องของ URL รูปภาพ
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return true; // อนุญาตให้ว่างได้
  
  try {
    const urlObj = new URL(url);
    // ตรวจสอบว่าเป็น http หรือ https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }
    // ตรวจสอบนามสกุลไฟล์ (ถ้ามี)
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const path = urlObj.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => path.endsWith(ext));
    
    // อนุญาตทั้ง URL ที่มีนามสกุลและไม่มี (เช่น Gravatar, Firebase Storage signed URLs)
    return true;
  } catch {
    return false;
  }
}


import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  deleteUser as deleteAuthUser
} from "firebase/auth";
import { db, auth } from "./firebase";
import { UserData, UserRole } from "@/contexts/AuthContext";

// ดึงรายการผู้ใช้ทั้งหมด (สำหรับ Admin)
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        suspendedUntil: data.suspendedUntil?.toDate ? data.suspendedUntil.toDate() : undefined,
      } as UserData;
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

// ดึงข้อมูลผู้ใช้เดียว
export async function getUserById(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      suspendedUntil: data.suspendedUntil?.toDate ? data.suspendedUntil.toDate() : undefined,
    } as UserData;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

// สร้างผู้ใช้ใหม่โดย Admin
export async function createUserByAdmin(data: {
  email: string;
  password: string;
  shopName: string;
  displayName: string;
  role: UserRole;
  verified: boolean;
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    // สร้าง user ใน Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    const user = userCredential.user;

    // บันทึกข้อมูลใน Firestore
    const userData: UserData = {
      uid: user.uid,
      email: data.email,
      displayName: data.displayName,
      shopName: data.shopName,
      role: data.role,
      verified: data.verified,
      emailVerified: false,
      suspended: false, // ไม่ถูกพัก
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userData);

    // ส่งอีเมลยืนยัน
    await sendEmailVerification(user);

    return { success: true, uid: user.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: error.code || error.message 
    };
  }
}

// อัปเดตข้อมูลผู้ใช้
export async function updateUser(
  uid: string, 
  updates: Partial<UserData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // ลบ fields ที่ไม่ควรอัปเดต
    const { uid: _, createdAt, ...safeUpdates } = updates as any;
    
    await updateDoc(doc(db, "users", uid), safeUpdates);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ลบผู้ใช้
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    // ลบข้อมูลใน Firestore
    await deleteDoc(doc(db, "users", uid));
    
    // หมายเหตุ: การลบ user ใน Firebase Auth ต้องทำผ่าน Admin SDK
    // หรือผู้ใช้ต้อง re-authenticate ก่อนลบ
    // ในที่นี้เราจะลบเฉพาะข้อมูลใน Firestore
    // Admin สามารถปิด account ได้จาก Firebase Console
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// เปลี่ยนสถานะ verified
export async function toggleUserVerification(
  uid: string, 
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateUser(uid, { verified });
}

// เปลี่ยน role
export async function changeUserRole(
  uid: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  return updateUser(uid, { role });
}

// ตรวจสอบว่าเป็น admin หรือไม่
export function isAdmin(userData: UserData | null): boolean {
  return userData?.role === 'admin';
}

// ตรวจสอบว่า verified หรือไม่
export function isVerified(userData: UserData | null): boolean {
  return userData?.verified === true;
}


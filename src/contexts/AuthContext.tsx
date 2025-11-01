import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getManagedShops, getMyInvitations } from "@/lib/shopInvitationUtils";

export type UserRole = 'admin' | 'seller';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  shopName: string;
  role: UserRole;
  verified: boolean;
  emailVerified: boolean;
  suspended: boolean; // สถานะพักบัญชี
  suspendedUntil?: Date; // วันที่หมดอายุการพัก (null = พักถาวรจนกว่าจะปลด)
  suspendReason?: string; // เหตุผลที่พักบัญชี
  createdAt: Date;
  photoURL?: string;
  balance: number; // ยอดเงินในบัญชี
  lastTopUp?: Date; // วันที่เติมเงินครั้งล่าสุด
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  managedShops: string[]; // รายการ shop owner IDs ที่เป็นผู้ดูแล
  currentShopOwnerId: string | null; // ID ของร้านที่กำลังจัดการ (ตัวเองหรือร้านที่ดูแล)
  invitationCount: number; // จำนวนคำขอที่รอการตอบรับ
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, shopName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loadInvitationCount: () => Promise<void>; // โหลดจำนวนคำขอใหม่
  updateBalance: (amount: number) => Promise<void>; // อัปเดตยอดเงิน
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [managedShops, setManagedShops] = useState<string[]>([]);
  const [currentShopOwnerId, setCurrentShopOwnerId] = useState<string | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);

  // โหลดข้อมูล user จาก Firestore
  const loadUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Convert Firestore Timestamp to Date
        const userData: UserData = {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          suspendedUntil: data.suspendedUntil?.toDate ? data.suspendedUntil.toDate() : undefined,
          balance: data.balance || 0,
          lastTopUp: data.lastTopUp?.toDate ? data.lastTopUp.toDate() : undefined,
        } as UserData;
        setUserData(userData);

        // โหลดรายการร้านที่เป็นผู้ดูแล
        console.log("🔍 Loading managed shops for user:", user.uid);
        const shops = await getManagedShops(user.uid);
        console.log("📋 Managed shops:", shops);
        setManagedShops(shops);

        // ตั้งค่า currentShopOwnerId
        // Priority: 1) ร้านที่ดูแล (ถ้ามี), 2) ตัวเองถ้าเป็น seller/admin, 3) fallback ตัวเอง
        console.log("👤 User role:", userData.role);
        console.log("🏪 Number of managed shops:", shops.length);
        
        if (shops.length > 0 && userData.role !== "admin") {
          // มีร้านที่ดูแล และไม่ใช่ admin → เป็นผู้ดูแลร้าน
          console.log("✅ User is shop manager, using shop owner ID:", shops[0]);
          console.log("🏪 Managing shop owner:", shops[0]);
          setCurrentShopOwnerId(shops[0]);
        } else if (userData.role === "seller" || userData.role === "admin") {
          // เป็นเจ้าของร้านเอง หรือ admin
          console.log("✅ User is shop owner/admin, using own ID:", user.uid);
          setCurrentShopOwnerId(user.uid);
        } else {
          // Fallback: ใช้ตัวเอง
          console.log("⚠️ User has no shop, using own ID as fallback:", user.uid);
          setCurrentShopOwnerId(user.uid);
        }
        
        console.log("🎯 Final currentShopOwnerId:", shops.length > 0 && userData.role !== "admin" ? shops[0] : user.uid);

        // โหลดจำนวนคำขอ
        await loadInvitationCountInternal(user.uid);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // โหลดจำนวนคำขอ (internal function)
  const loadInvitationCountInternal = async (userId: string) => {
    try {
      const invitations = await getMyInvitations(userId);
      setInvitationCount(invitations.length);
    } catch (error) {
      console.error("Error loading invitation count:", error);
    }
  };

  // โหลดจำนวนคำขอ (public function)
  const loadInvitationCount = async () => {
    if (user) {
      await loadInvitationCountInternal(user.uid);
    }
  };

  useEffect(() => {
    // ตั้งค่า listener สำหรับติดตามสถานะการล็อกอิน
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, shopName: string) => {
    try {
      // สร้าง user ใน Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // อัปเดต profile
      await updateProfile(user, { displayName: shopName });

      // บันทึกข้อมูลใน Firestore
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        displayName: shopName,
        shopName: shopName,
        role: 'seller', // default role เป็น seller
        verified: false, // ต้องรอ admin อนุมัติ
        emailVerified: false,
        suspended: false, // ไม่ถูกพัก
        createdAt: new Date(),
        balance: 0, // ยอดเงินเริ่มต้น
      };

      await setDoc(doc(db, "users", user.uid), userData);

      // ส่งอีเมลยืนยัน
      await sendEmailVerification(user);
      
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ตรวจสอบว่ามีข้อมูลใน Firestore หรือยัง
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // ถ้ายังไม่มีข้อมูล ให้สร้างใหม่
        const userData: UserData = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || "ผู้ใช้",
          shopName: user.displayName || "ร้านค้า",
          role: 'seller', // default role
          verified: true, // Google users auto-verified
          emailVerified: user.emailVerified,
          suspended: false, // ไม่ถูกพัก
          createdAt: new Date(),
          photoURL: user.photoURL || undefined,
          balance: 0, // ยอดเงินเริ่มต้น
        };

        await setDoc(doc(db, "users", user.uid), userData);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
      setManagedShops([]);
      setCurrentShopOwnerId(null);
      setInvitationCount(0);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (user) {
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        console.log("🔄 Refreshing user...");
        
        // Reload user จาก Firebase Auth
        await auth.currentUser.reload();
        
        // ดึง user ใหม่จาก auth
        const updatedUser = auth.currentUser;
        console.log("✅ User reloaded, emailVerified:", updatedUser.emailVerified);
        
        // อัปเดต state
        setUser(updatedUser);
        
        // ถ้ายืนยันอีเมลแล้ว อัปเดตใน Firestore
        if (updatedUser.emailVerified) {
          console.log("✅ Updating Firestore...");
          await setDoc(
            doc(db, "users", updatedUser.uid),
            { emailVerified: true, verified: true },
            { merge: true }
          );
        }
        
        // โหลด userData ใหม่เสมอ
        await loadUserData(updatedUser);
        console.log("✅ User data updated");
      }
    } catch (error) {
      console.error("❌ Error refreshing user:", error);
      throw error;
    }
  };

  const updateBalance = async (amount: number) => {
    try {
      if (!user || !userData) {
        throw new Error("User not authenticated");
      }

      const newBalance = (userData.balance || 0) + amount;
      
      // อัปเดตใน Firestore
      await setDoc(
        doc(db, "users", user.uid),
        { 
          balance: newBalance,
          lastTopUp: new Date()
        },
        { merge: true }
      );

      // อัปเดต local state
      setUserData(prev => prev ? {
        ...prev,
        balance: newBalance,
        lastTopUp: new Date()
      } : null);

      console.log(`✅ Balance updated: +${amount} = ${newBalance}`);
    } catch (error) {
      console.error("❌ Error updating balance:", error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    managedShops,
    currentShopOwnerId,
    invitationCount,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendVerificationEmail,
    resetPassword,
    refreshUser,
    loadInvitationCount,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook สำหรับใช้ AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { ShopInvitation, ShopMember } from "@/types/shopInvitation";

// ================================
// Shop Invitations
// ================================

/**
 * ส่งคำขอเพิ่มผู้ดูแลร้านค้า
 */
export const sendShopInvitation = async (
  shopOwnerId: string,
  shopOwnerEmail: string,
  shopName: string,
  invitedUserEmail: string
): Promise<{ success: boolean; error?: string; invitationId?: string }> => {
  try {
    // 1. ตรวจสอบว่า email มีอยู่ในระบบหรือไม่
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", invitedUserEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "ไม่พบผู้ใช้ด้วย email นี้" };
    }

    const invitedUser = userSnapshot.docs[0];
    const invitedUserId = invitedUser.id;
    const invitedUserData = invitedUser.data();

    // 2. ตรวจสอบว่าไม่ใช่ตัวเอง
    if (invitedUserId === shopOwnerId) {
      return { success: false, error: "ไม่สามารถเชิญตัวเองได้" };
    }

    // 3. ตรวจสอบว่าผู้ใช้เป็น shop owner เองหรือไม่
    if (invitedUserData.role === "shop") {
      return {
        success: false,
        error: "ไม่สามารถเชิญเจ้าของร้านอื่นได้ กรุณาเชิญผู้ใช้ที่เป็น user",
      };
    }

    // 4. ตรวจสอบว่าเคยส่งคำขอไปแล้วหรือยัง (ที่ยังรออยู่)
    const invitationsRef = collection(db, "shopInvitations");
    const existingQuery = query(
      invitationsRef,
      where("shopOwnerId", "==", shopOwnerId),
      where("invitedUserId", "==", invitedUserId),
      where("status", "==", "pending")
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return { success: false, error: "คำขอนี้ถูกส่งไปแล้วและกำลังรอการตอบรับ" };
    }

    // 5. ตรวจสอบว่าผู้ใช้เป็นสมาชิกอยู่แล้วหรือไม่
    const membersRef = collection(db, "shopMembers");
    const memberQuery = query(
      membersRef,
      where("shopOwnerId", "==", shopOwnerId),
      where("memberId", "==", invitedUserId)
    );
    const memberSnapshot = await getDocs(memberQuery);

    if (!memberSnapshot.empty) {
      return { success: false, error: "ผู้ใช้นี้เป็นผู้ดูแลร้านอยู่แล้ว" };
    }

    // 6. สร้างคำขอใหม่
    const invitation: Omit<ShopInvitation, "id"> = {
      shopOwnerId,
      shopOwnerEmail,
      shopName,
      invitedUserId,
      invitedUserEmail,
      status: "pending",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await addDoc(invitationsRef, invitation);

    console.log("✅ ส่งคำขอเพิ่มผู้ดูแลสำเร็จ:", docRef.id);
    return { success: true, invitationId: docRef.id };
  } catch (error) {
    console.error("❌ Error sending shop invitation:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการส่งคำขอ",
    };
  }
};

/**
 * ดึงคำขอทั้งหมดที่ส่งมาหาผู้ใช้
 */
export const getMyInvitations = async (
  userId: string
): Promise<ShopInvitation[]> => {
  try {
    const invitationsRef = collection(db, "shopInvitations");
    const q = query(
      invitationsRef,
      where("invitedUserId", "==", userId),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
    const invitations: ShopInvitation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      invitations.push({
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : new Date(),
        respondedAt:
          data.respondedAt instanceof Timestamp
            ? data.respondedAt.toDate()
            : undefined,
      } as ShopInvitation);
    });

    return invitations;
  } catch (error) {
    console.error("❌ Error fetching invitations:", error);
    return [];
  }
};

/**
 * ตอบรับคำขอ
 */
export const acceptInvitation = async (
  invitationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const invitationRef = doc(db, "shopInvitations", invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      return { success: false, error: "ไม่พบคำขอนี้" };
    }

    const invitation = invitationSnap.data() as ShopInvitation;

    // อัปเดตสถานะคำขอเป็น accepted
    await updateDoc(invitationRef, {
      status: "accepted",
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // เพิ่มเข้าเป็น shop member
    const membersRef = collection(db, "shopMembers");
    const member: Omit<ShopMember, "id"> = {
      shopOwnerId: invitation.shopOwnerId,
      memberId: invitation.invitedUserId,
      memberEmail: invitation.invitedUserEmail,
      addedAt: serverTimestamp() as any,
      role: "co-admin",
    };

    await addDoc(membersRef, member);

    console.log("✅ ตอบรับคำขอสำเร็จ");
    return { success: true };
  } catch (error) {
    console.error("❌ Error accepting invitation:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการตอบรับคำขอ" };
  }
};

/**
 * ปฏิเสธคำขอ
 */
export const rejectInvitation = async (
  invitationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const invitationRef = doc(db, "shopInvitations", invitationId);
    
    await updateDoc(invitationRef, {
      status: "rejected",
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ ปฏิเสธคำขอสำเร็จ");
    return { success: true };
  } catch (error) {
    console.error("❌ Error rejecting invitation:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการปฏิเสธคำขอ" };
  }
};

// ================================
// Shop Members
// ================================

/**
 * ดึงรายชื่อผู้ดูแลร้านทั้งหมด
 */
export const getShopMembers = async (
  shopOwnerId: string
): Promise<ShopMember[]> => {
  try {
    const membersRef = collection(db, "shopMembers");
    const q = query(membersRef, where("shopOwnerId", "==", shopOwnerId));

    const snapshot = await getDocs(q);
    const members: ShopMember[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      members.push({
        ...data,
        addedAt:
          data.addedAt instanceof Timestamp
            ? data.addedAt.toDate()
            : new Date(),
      } as ShopMember);
    });

    return members;
  } catch (error) {
    console.error("❌ Error fetching shop members:", error);
    return [];
  }
};

/**
 * ลบผู้ดูแลร้านออก
 */
export const removeShopMember = async (
  shopOwnerId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const membersRef = collection(db, "shopMembers");
    const q = query(
      membersRef,
      where("shopOwnerId", "==", shopOwnerId),
      where("memberId", "==", memberId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "ไม่พบผู้ดูแลนี้" };
    }

    // ลบทุก document ที่ตรงเงื่อนไข (ควรมีแค่ 1)
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log("✅ ลบผู้ดูแลสำเร็จ");
    return { success: true };
  } catch (error) {
    console.error("❌ Error removing shop member:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบผู้ดูแล" };
  }
};

/**
 * ตรวจสอบว่า user เป็นผู้ดูแลร้านของใครบ้าง
 */
export const getManagedShops = async (
  userId: string
): Promise<string[]> => {
  try {
    console.log("🔍 getManagedShops: Querying for userId:", userId);
    const membersRef = collection(db, "shopMembers");
    const q = query(membersRef, where("memberId", "==", userId));

    console.log("🔍 getManagedShops: Executing query...");
    const snapshot = await getDocs(q);
    console.log("📊 getManagedShops: Query returned", snapshot.size, "documents");
    
    const shopOwnerIds: string[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 getManagedShops: Document data:", doc.id, data);
      shopOwnerIds.push(data.shopOwnerId);
    });

    console.log("✅ getManagedShops: Found shop owner IDs:", shopOwnerIds);
    return shopOwnerIds;
  } catch (error) {
    console.error("❌ getManagedShops: Error fetching managed shops:", error);
    console.error("❌ getManagedShops: Error details:", JSON.stringify(error, null, 2));
    return [];
  }
};


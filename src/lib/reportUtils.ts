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
} from "firebase/firestore";
import { db } from "./firebase";
import { Report, ReportInput } from "@/types/notification";
import { createNotification } from "./notificationUtils";

/**
 * สร้างรายงานปัญหาใหม่
 */
export async function createReport(
  userId: string,
  userEmail: string,
  shopName: string | undefined,
  data: ReportInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log("📝 reportUtils: กำลังสร้างรายงานปัญหา...", data);

    const newReport = {
      userId,
      userEmail,
      shopName: shopName || "",
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      status: "pending",
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "reports"), newReport);
    console.log("✅ reportUtils: สร้างรายงานปัญหาสำเร็จ! Doc ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ reportUtils: Error creating report:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างรายงาน",
    };
  }
}

/**
 * ดึงรายงานปัญหาทั้งหมด (Admin)
 */
export async function getAllReports(): Promise<Report[]> {
  try {
    console.log("🔍 reportUtils: ดึงรายงานปัญหาทั้งหมด");
    const reportsRef = collection(db, "reports");
    const snapshot = await getDocs(reportsRef);

    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        shopName: data.shopName || "",
        title: data.title || "ไม่มีหัวข้อ",
        description: data.description || "",
        status: data.status || "pending",
        priority: data.priority || "medium",
        category: data.category || "other",
        adminNote: data.adminNote,
        resolvedBy: data.resolvedBy,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : undefined,
        resolvedAt: data.resolvedAt?.toDate
          ? data.resolvedAt.toDate()
          : undefined,
      } as Report;
    });

    // เรียงลำดับใหม่สุดก่อน
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ reportUtils: พบรายงานปัญหา", reports.length, "รายการ");
    return reports;
  } catch (error) {
    console.error("❌ reportUtils: Error getting reports:", error);
    return [];
  }
}

/**
 * ดึงรายงานปัญหาของผู้ใช้
 */
export async function getReportsByUser(userId: string): Promise<Report[]> {
  try {
    console.log("🔍 reportUtils: ดึงรายงานปัญหาของผู้ใช้:", userId);
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        shopName: data.shopName || "",
        title: data.title || "ไม่มีหัวข้อ",
        description: data.description || "",
        status: data.status || "pending",
        priority: data.priority || "medium",
        category: data.category || "other",
        adminNote: data.adminNote,
        resolvedBy: data.resolvedBy,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : undefined,
        resolvedAt: data.resolvedAt?.toDate
          ? data.resolvedAt.toDate()
          : undefined,
      } as Report;
    });

    // เรียงลำดับใหม่สุดก่อน
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ reportUtils: พบรายงานปัญหา", reports.length, "รายการ");
    return reports;
  } catch (error) {
    console.error("❌ reportUtils: Error getting reports:", error);
    return [];
  }
}

/**
 * อัปเดตสถานะรายงานปัญหา (Admin)
 */
export async function updateReportStatus(
  reportId: string,
  status: Report["status"],
  adminId?: string,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("✏️ reportUtils: อัปเดตสถานะรายงาน:", reportId, "->", status);
    
    const reportRef = doc(db, "reports", reportId);
    
    // ดึงข้อมูลรายงานเดิมเพื่อส่ง notification
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return { success: false, error: "ไม่พบรายงานนี้" };
    }
    
    const reportData = reportSnap.data();
    
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    if (status === "resolved" && adminId) {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = Timestamp.now();
    }

    await updateDoc(reportRef, updateData);

    // ส่งแจ้งเตือนไปยังผู้แจ้งปัญหา
    const statusText = {
      pending: "รอดำเนินการ",
      "in-progress": "กำลังดำเนินการ",
      resolved: "แก้ไขเสร็จสิ้น",
      rejected: "ปฏิเสธ",
    };

    await createNotification({
      userId: reportData.userId,
      title: `อัปเดตสถานะรายงานปัญหา: ${reportData.title}`,
      message: `รายงานของคุณถูกอัปเดตเป็น "${statusText[status]}"${adminNote ? `\n\nหมายเหตุจาก Admin: ${adminNote}` : ""}`,
      type: status === "resolved" ? "success" : status === "rejected" ? "warning" : "info",
      link: `/my-reports`,
    });

    console.log("✅ reportUtils: อัปเดตสถานะและส่งแจ้งเตือนสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ reportUtils: Error updating report status:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดต",
    };
  }
}

/**
 * ลบรายงานปัญหา (Admin)
 */
export async function deleteReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🗑️ reportUtils: กำลังลบรายงานปัญหา:", reportId);
    await deleteDoc(doc(db, "reports", reportId));
    console.log("✅ reportUtils: ลบรายงานปัญหาสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ reportUtils: Error deleting report:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบ",
    };
  }
}

/**
 * นับจำนวนรายงานตามสถานะ
 */
export async function getReportStats(): Promise<{
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  total: number;
}> {
  try {
    const reports = await getAllReports();
    
    return {
      pending: reports.filter((r) => r.status === "pending").length,
      inProgress: reports.filter((r) => r.status === "in-progress").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      total: reports.length,
    };
  } catch (error) {
    console.error("❌ reportUtils: Error getting report stats:", error);
    return {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      total: 0,
    };
  }
}


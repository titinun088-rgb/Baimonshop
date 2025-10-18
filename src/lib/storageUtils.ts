import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * อัปโหลดรูปภาพไป Firebase Storage
 * @param file - ไฟล์รูปภาพ
 * @param folder - โฟลเดอร์ที่จะเก็บ (เช่น 'games', 'items')
 * @returns URL ของรูปภาพที่อัปโหลด
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "กรุณาเลือกไฟล์รูปภาพเท่านั้น" };
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "ขนาดไฟล์ต้องไม่เกิน 5MB" };
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // อัปโหลดไฟล์
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);

    // ดึง URL
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error: any) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
    };
  }
}

/**
 * ลบรูปภาพจาก Firebase Storage
 * @param imageUrl - URL ของรูปภาพที่จะลบ
 */
export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // แปลง URL เป็น path
    const decodedUrl = decodeURIComponent(imageUrl);
    const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);

    if (!pathMatch || !pathMatch[1]) {
      return { success: false, error: "URL ไม่ถูกต้อง" };
    }

    const filePath = pathMatch[1];
    const storageRef = ref(storage, filePath);

    await deleteObject(storageRef);

    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    
    // ถ้าไฟล์ไม่พบ ถือว่าสำเร็จ
    if (error.code === "storage/object-not-found") {
      return { success: true };
    }

    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบรูปภาพ",
    };
  }
}

/**
 * อัปโหลดหลายรูปภาพพร้อมกัน
 * @param files - array ของไฟล์รูปภาพ
 * @param folder - โฟลเดอร์ที่จะเก็บ
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);

    // ตรวจสอบว่ามีการอัปโหลดล้มเหลวหรือไม่
    const failedUploads = results.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: `อัปโหลดไม่สำเร็จ ${failedUploads.length} ไฟล์`,
      };
    }

    const urls = results.map((r) => r.url!);
    return { success: true, urls };
  } catch (error: any) {
    console.error("Multiple upload error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
    };
  }
}


import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { logActivity } from "./activityUtils";
import * as XLSX from "xlsx";

// Types
export interface Game {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  description: string;
  createdBy: string; // UID ของผู้สร้าง
  createdAt: Date;
  updatedAt?: Date;
}

export interface GameItem {
  id: string;
  gameId: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ========================
// GAMES CRUD
// ========================

/**
 * ดึงรายการเกมทั้งหมด
 */
export async function getAllGames(): Promise<Game[]> {
  try {
    console.log("🔍 gameUtils: กำลังดึงรายการเกมทั้งหมด...");
    const gamesRef = collection(db, "games");
    // ใช้ query แบบง่ายๆ ที่ไม่ต้องใช้ Index
    const snapshot = await getDocs(gamesRef);

    console.log("📊 gameUtils: พบเกมทั้งหมด", snapshot.size, "เกม");

    const games = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📄 Game:", doc.id, data.name || "ไม่มีชื่อ");
      return {
        id: doc.id,
        name: data.name || "ไม่มีชื่อ",
        imageUrl: data.imageUrl || "https://via.placeholder.com/400x225?text=No+Image",
        category: data.category || "ทั่วไป",
        description: data.description || "",
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
      } as Game;
    });

    // เรียงลำดับใน JavaScript แทน (ใหม่สุดก่อน)
    games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ gameUtils: คืนค่าเกม", games.length, "เกม");
    return games;
  } catch (error) {
    console.error("❌ gameUtils: Error getting games:", error);
    return []; // คืนค่า array ว่างแทนการ throw error
  }
}

/**
 * ดึงเกมของ seller คนเดียว
 */
export async function getGamesByUser(userId: string): Promise<Game[]> {
  try {
    console.log("🔍 gameUtils: กำลังดึงเกมของ user:", userId);
    const gamesRef = collection(db, "games");
    // ใช้ query แบบง่ายๆ ที่ไม่ต้องใช้ Index
    const q = query(gamesRef, where("createdBy", "==", userId));
    
    const snapshot = await getDocs(q);
    console.log("📊 gameUtils: พบเกมของ user", snapshot.size, "เกม");

    const games = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📄 User Game:", doc.id, data.name || "ไม่มีชื่อ");
      return {
        id: doc.id,
        name: data.name || "ไม่มีชื่อ",
        imageUrl: data.imageUrl || "https://via.placeholder.com/400x225?text=No+Image",
        category: data.category || "ทั่วไป",
        description: data.description || "",
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
      } as Game;
    });

    // เรียงลำดับใน JavaScript แทน (ใหม่สุดก่อน)
    games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ gameUtils: คืนค่าเกมของ user", games.length, "เกม");
    return games;
  } catch (error) {
    console.error("❌ gameUtils: Error getting user games:", error);
    return []; // คืนค่า array ว่างแทนการ throw error
  }
}

/**
 * ดึงข้อมูลเกมเดียว
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    const gameDoc = await getDoc(doc(db, "games", gameId));
    if (!gameDoc.exists()) {
      console.warn(`Game with id ${gameId} not found`);
      return null;
    }

    const data = gameDoc.data();
    return {
      id: gameDoc.id,
      name: data.name || "ไม่มีชื่อ",
      imageUrl: data.imageUrl || "https://via.placeholder.com/400x225?text=No+Image",
      category: data.category || "ทั่วไป",
      description: data.description || "",
      createdBy: data.createdBy || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
    } as Game;
  } catch (error) {
    console.error("Error getting game:", error);
    return null; // คืนค่า null แทนการ throw error
  }
}

/**
 * สร้างเกมใหม่
 */
export async function createGame(
  data: Omit<Game, "id" | "createdAt" | "updatedAt">,
  userInfo?: { userId: string; email: string; shopName?: string }
): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const gameData = {
      ...data,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "games"), gameData);

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_created",
        details: `สร้างเกม "${data.name}"`,
        metadata: { gameId: docRef.id, gameName: data.name },
      });
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating game:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างเกม",
    };
  }
}

/**
 * อัปเดตข้อมูลเกม
 */
export async function updateGame(
  gameId: string,
  updates: Partial<Omit<Game, "id" | "createdAt" | "createdBy">>,
  userInfo?: { userId: string; email: string; shopName?: string; gameName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, "games", gameId), updateData);

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_updated",
        details: `แก้ไขเกม "${userInfo.gameName || updates.name || gameId}"`,
        metadata: { gameId, updates },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating game:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตเกม",
    };
  }
}

/**
 * ลบเกม
 */
export async function deleteGame(
  gameId: string,
  userInfo?: { userId: string; email: string; shopName?: string; gameName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, "games", gameId));

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_deleted",
        details: `ลบเกม "${userInfo.gameName || gameId}"`,
        metadata: { gameId },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting game:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบเกม",
    };
  }
}

// ========================
// GAME ITEMS CRUD
// ========================

/**
 * ดึงรายการเติมทั้งหมดของเกม
 */
export async function getGameItems(gameId: string): Promise<GameItem[]> {
  try {
    console.log("🔍 gameUtils: ดึงรายการเติมสำหรับ gameId:", gameId);
    
    const itemsRef = collection(db, "gameItems");
    
    // ใช้ query แบบง่ายๆ ที่ไม่ต้องใช้ Index (ไม่มี orderBy)
    const q = query(itemsRef, where("gameId", "==", gameId));
    
    const snapshot = await getDocs(q);
    console.log("🔍 gameUtils: พบ", snapshot.size, "รายการ");

    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📄 Item:", doc.id, data);
      return {
        id: doc.id,
        gameId: data.gameId || gameId,
        name: data.name || "ไม่มีชื่อ",
        costPrice: data.costPrice || 0,
        sellPrice: data.sellPrice || 0,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
      } as GameItem;
    });

    // เรียงลำดับใน JavaScript แทน (ใหม่สุดก่อน)
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log("✅ gameUtils: คืนค่า", items.length, "รายการ");
    return items;
  } catch (error) {
    console.error("❌ gameUtils: Error getting game items:", error);
    return []; // คืนค่า array ว่างแทนการ throw error
  }
}

/**
 * ดึงรายการเติมเดียว
 */
export async function getGameItemById(itemId: string): Promise<GameItem | null> {
  try {
    const itemDoc = await getDoc(doc(db, "gameItems", itemId));
    if (!itemDoc.exists()) return null;

    const data = itemDoc.data();
    return {
      id: itemDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as GameItem;
  } catch (error) {
    console.error("Error getting game item:", error);
    throw error;
  }
}

/**
 * สร้างรายการเติมใหม่
 */
export async function createGameItem(
  data: Omit<GameItem, "id" | "createdAt" | "updatedAt">,
  userInfo?: { userId: string; email: string; shopName?: string; gameName?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log("📝 gameUtils: กำลังบันทึก GameItem:", data);
    
    const itemData = {
      ...data,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "gameItems"), itemData);
    console.log("✅ gameUtils: บันทึกสำเร็จ! Doc ID:", docRef.id);

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_item_created",
        details: `เพิ่มรายการเติม "${data.name}" ในเกม "${userInfo.gameName || data.gameId}"`,
        metadata: { gameItemId: docRef.id, gameId: data.gameId, itemName: data.name },
      });
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ gameUtils: Error creating game item:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างรายการเติม",
    };
  }
}

/**
 * อัปเดตรายการเติม
 */
export async function updateGameItem(
  itemId: string,
  updates: Partial<Omit<GameItem, "id" | "createdAt" | "gameId">>,
  userInfo?: { userId: string; email: string; shopName?: string; itemName?: string; gameName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, "gameItems", itemId), updateData);

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_item_updated",
        details: `แก้ไขรายการเติม "${userInfo.itemName || updates.name || itemId}"${userInfo.gameName ? ` ในเกม "${userInfo.gameName}"` : ''}`,
        metadata: { gameItemId: itemId, updates },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating game item:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตรายการเติม",
    };
  }
}

/**
 * ลบรายการเติม
 */
export async function deleteGameItem(
  itemId: string,
  userInfo?: { userId: string; email: string; shopName?: string; itemName?: string; gameName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, "gameItems", itemId));

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "game_item_deleted",
        details: `ลบรายการเติม "${userInfo.itemName || itemId}"${userInfo.gameName ? ` ในเกม "${userInfo.gameName}"` : ''}`,
        metadata: { gameItemId: itemId },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting game item:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบรายการเติม",
    };
  }
}

/**
 * นับจำนวนรายการเติมของเกม
 */
export async function countGameItems(gameId: string): Promise<number> {
  try {
    const itemsRef = collection(db, "gameItems");
    const q = query(itemsRef, where("gameId", "==", gameId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error counting game items:", error);
    return 0;
  }
}

// ========================
// IMPORT/EXPORT FUNCTIONS
// ========================

/**
 * Export รายการเกมเป็น CSV
 */
export function exportGameItemsToCSV(
  items: GameItem[],
  gameName: string,
  filename?: string
) {
  try {
    console.log("📊 gameUtils: กำลัง export รายการเกม", items.length, "รายการ");

    // สร้าง CSV headers
    const headers = ["ชื่อรายการ", "ราคาทุน", "ราคาขาย", "กำไร", "% กำไร"];

    // สร้าง CSV rows
    const rows = items.map((item) => {
      const profit = item.sellPrice - item.costPrice;
      const profitPercent = ((profit / item.costPrice) * 100).toFixed(2);
      return [
        item.name,
        item.costPrice,
        item.sellPrice,
        profit,
        profitPercent + "%",
      ];
    });

    // รวม headers และ rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // สร้าง Blob และ download
    const BOM = "\uFEFF"; // สำหรับรองรับภาษาไทย
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename ||
      `${gameName.replace(/\s+/g, "-")}-items-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    console.log("✅ gameUtils: Export สำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ gameUtils: Error exporting game items:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Import รายการเกมจาก Excel
 */
export async function importGameItemsFromExcel(
  file: File,
  gameId: string,
  userId: string,
  userEmail: string
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  try {
    console.log("📥 gameUtils: กำลัง import จาก Excel:", file.name);

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet) as any[];

          console.log("📋 gameUtils: พบข้อมูล", rows.length, "แถว");

          let imported = 0;
          const errors: string[] = [];

          // ดึงข้อมูลเกมเพื่อ validate
          const game = await getGameById(gameId);
          if (!game) {
            resolve({
              success: false,
              imported: 0,
              errors: ["ไม่พบข้อมูลเกม"],
            });
            return;
          }

          // Import แต่ละแถว
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              // ตรวจสอบข้อมูลที่จำเป็น
              const name = (
                row["ชื่อรายการ"] || row["Name"] || row["Item Name"] || ""
              ).toString().trim();
              const costPrice = Number(
                row["ราคาทุน"] || row["Cost Price"] || row["Cost"]
              );
              const sellPrice = Number(
                row["ราคาขาย"] || row["Sell Price"] || row["Price"]
              );
              const imageUrl = (row["รูปภาพ"] || row["Image"] || "").toString().trim();

              // Validate
              if (!name || !costPrice || !sellPrice) {
                errors.push(`แถว ${i + 2}: ข้อมูลไม่ครบถ้วน`);
                continue;
              }

              if (costPrice <= 0 || sellPrice <= 0) {
                errors.push(`แถว ${i + 2}: ราคาต้องมากกว่า 0`);
                continue;
              }

              if (sellPrice < costPrice) {
                errors.push(
                  `แถว ${i + 2}: ราคาขายต้องมากกว่าหรือเท่ากับราคาทุน`
                );
                continue;
              }

              // สร้างรายการเติม
              const itemData = {
                name,
                costPrice,
                sellPrice,
                imageUrl: imageUrl || "",
              };

              const result = await createGameItem(gameId, itemData, {
                userId,
                userEmail,
              });

              if (result.success) {
                imported++;
              } else {
                errors.push(`แถว ${i + 2}: ${result.error}`);
              }
            } catch (error: any) {
              errors.push(`แถว ${i + 2}: ${error.message}`);
            }
          }

          console.log(
            `✅ gameUtils: Import สำเร็จ ${imported} รายการ, พบข้อผิดพลาด ${errors.length} รายการ`
          );
          resolve({ success: true, imported, errors });
        } catch (error: any) {
          console.error("❌ gameUtils: Error processing Excel:", error);
          resolve({
            success: false,
            imported: 0,
            errors: [error.message],
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          imported: 0,
          errors: ["ไม่สามารถอ่านไฟล์ได้"],
        });
      };

      reader.readAsBinaryString(file);
    });
  } catch (error: any) {
    console.error("❌ gameUtils: Error importing game items:", error);
    return { success: false, imported: 0, errors: [error.message] };
  }
}

/**
 * ตรวจสอบและแก้ไขปัญหาการโหลดเกม
 */
export async function debugGameLoading(): Promise<{
  totalGames: number;
  gamesByUser: Record<string, number>;
  gamesByCategory: Record<string, number>;
  recentGames: Game[];
  errors: string[];
}> {
  const result = {
    totalGames: 0,
    gamesByUser: {} as Record<string, number>,
    gamesByCategory: {} as Record<string, number>,
    recentGames: [] as Game[],
    errors: [] as string[]
  };

  try {
    console.log("🔍 gameUtils: เริ่มการตรวจสอบการโหลดเกม...");
    
    // โหลดเกมทั้งหมด
    const allGames = await getAllGames();
    result.totalGames = allGames.length;
    
    // วิเคราะห์ข้อมูล
    allGames.forEach(game => {
      // นับตามผู้สร้าง
      result.gamesByUser[game.createdBy] = (result.gamesByUser[game.createdBy] || 0) + 1;
      
      // นับตามหมวดหมู่
      result.gamesByCategory[game.category] = (result.gamesByCategory[game.category] || 0) + 1;
    });
    
    // เกมล่าสุด 5 เกม
    result.recentGames = allGames
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    
    console.log("✅ gameUtils: การตรวจสอบเสร็จสิ้น");
    console.log("📊 gameUtils: สถิติ:", result);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMsg);
    console.error("❌ gameUtils: Error in debug:", error);
  }
  
  return result;
}


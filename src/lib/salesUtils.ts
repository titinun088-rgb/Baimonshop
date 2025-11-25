import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Sale, SaleInput, DashboardStats, ChartData } from "@/types/sale";
import { getGameById, getGameItemById } from "./gameUtils";
import { logActivity } from "./activityUtils";
import * as XLSX from "xlsx";

/**
 * สร้างยอดขายใหม่
 */
export async function createSale(
  userId: string,
  userEmail: string,
  shopName: string | undefined,
  saleData: SaleInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log("📝 salesUtils: กำลังสร้างยอดขาย...", saleData);

    // ดึงข้อมูลเกมและรายการเติม
    const game = await getGameById(saleData.gameId);
    if (!game) {
      return { success: false, error: "ไม่พบข้อมูลเกม" };
    }

    const gameItem = await getGameItemById(saleData.gameItemId);
    if (!gameItem) {
      return { success: false, error: "ไม่พบข้อมูลรายการเติม" };
    }

    // คำนวณ
    const totalCost = gameItem.costPrice * saleData.quantity;
    const totalSell = gameItem.sellPrice * saleData.quantity;
    const netAmount = totalSell - saleData.discount;
    const profit = netAmount - totalCost;

    const newSale = {
      userId,
      userEmail,
      shopName: shopName || "",
      gameId: saleData.gameId,
      gameName: game.name,
      gameItemId: saleData.gameItemId,
      gameItemName: gameItem.name,
      quantity: saleData.quantity,
      costPricePerUnit: gameItem.costPrice,
      sellPricePerUnit: gameItem.sellPrice,
      discount: saleData.discount,
      totalCost,
      totalSell,
      netAmount,
      profit,
      saleDate: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "sales"), newSale);
    console.log("✅ salesUtils: สร้างยอดขายสำเร็จ! Doc ID:", docRef.id);

    // บันทึก Activity Log
    await logActivity({
      userId,
      email: userEmail,
      shopName,
      action: "sale_created",
      details: `บันทึกยอดขาย "${gameItem.name}" จำนวน ${saleData.quantity} รายการ (฿${netAmount.toFixed(2)})`,
      metadata: {
        saleId: docRef.id,
        gameId: saleData.gameId,
        gameName: game.name,
        gameItemId: saleData.gameItemId,
        gameItemName: gameItem.name,
        quantity: saleData.quantity,
        netAmount,
        profit,
      },
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ salesUtils: Error creating sale:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างยอดขาย",
    };
  }
}

/**
 * ดึงยอดขายทั้งหมดของ user
 */
export async function getSalesByUser(userId: string): Promise<Sale[]> {
  try {
    console.log("🔍 salesUtils: ดึงยอดขายของ user:", userId);
    const salesRef = collection(db, "sales");
    const q = query(salesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const sales = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        shopName: data.shopName || "",
        gameId: data.gameId || "",
        gameName: data.gameName || "ไม่มีชื่อ",
        gameItemId: data.gameItemId || "",
        gameItemName: data.gameItemName || "ไม่มีชื่อ",
        quantity: data.quantity || 0,
        costPricePerUnit: data.costPricePerUnit || 0,
        sellPricePerUnit: data.sellPricePerUnit || 0,
        discount: data.discount || 0,
        totalCost: data.totalCost || 0,
        totalSell: data.totalSell || 0,
        netAmount: data.netAmount || 0,
        profit: data.profit || 0,
        saleDate: data.saleDate?.toDate ? data.saleDate.toDate() : new Date(),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
      } as Sale;
    });

    // เรียงลำดับใน JavaScript (ใหม่สุดก่อน)
    sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

    console.log("✅ salesUtils: พบยอดขาย", sales.length, "รายการ");
    return sales;
  } catch (error) {
    console.error("❌ salesUtils: Error getting sales:", error);
    return [];
  }
}

/**
 * ดึงยอดขายทั้งหมด (สำหรับ Admin)
 */
export async function getAllSales(): Promise<Sale[]> {
  try {
    console.log("🔍 salesUtils: ดึงยอดขายทั้งหมด");
    const salesRef = collection(db, "sales");
    const snapshot = await getDocs(salesRef);

    const sales = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        shopName: data.shopName || "",
        gameId: data.gameId || "",
        gameName: data.gameName || "ไม่มีชื่อ",
        gameItemId: data.gameItemId || "",
        gameItemName: data.gameItemName || "ไม่มีชื่อ",
        quantity: data.quantity || 0,
        costPricePerUnit: data.costPricePerUnit || 0,
        sellPricePerUnit: data.sellPricePerUnit || 0,
        discount: data.discount || 0,
        totalCost: data.totalCost || 0,
        totalSell: data.totalSell || 0,
        netAmount: data.netAmount || 0,
        profit: data.profit || 0,
        saleDate: data.saleDate?.toDate ? data.saleDate.toDate() : new Date(),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
      } as Sale;
    });

    // เรียงลำดับใน JavaScript (ใหม่สุดก่อน)
    sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

    console.log("✅ salesUtils: พบยอดขายทั้งหมด", sales.length, "รายการ");
    return sales;
  } catch (error) {
    console.error("❌ salesUtils: Error getting all sales:", error);
    return [];
  }
}

/**
 * แก้ไขยอดขาย
 */
export async function updateSale(
  saleId: string,
  saleData: SaleInput,
  userInfo?: { userId: string; email: string; shopName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("✏️ salesUtils: กำลังแก้ไขยอดขาย:", saleId);

    // ดึงข้อมูลเกมและรายการเติม
    const game = await getGameById(saleData.gameId);
    if (!game) {
      return { success: false, error: "ไม่พบข้อมูลเกม" };
    }

    const gameItem = await getGameItemById(saleData.gameItemId);
    if (!gameItem) {
      return { success: false, error: "ไม่พบข้อมูลรายการเติม" };
    }

    // คำนวณใหม่
    const totalCost = gameItem.costPrice * saleData.quantity;
    const totalSell = gameItem.sellPrice * saleData.quantity;
    const netAmount = totalSell - saleData.discount;
    const profit = netAmount - totalCost;

    const updateData = {
      gameId: saleData.gameId,
      gameName: game.name,
      gameItemId: saleData.gameItemId,
      gameItemName: gameItem.name,
      quantity: saleData.quantity,
      costPricePerUnit: gameItem.costPrice,
      sellPricePerUnit: gameItem.sellPrice,
      discount: saleData.discount,
      totalCost,
      totalSell,
      netAmount,
      profit,
      updatedAt: Timestamp.now(),
    };

    const saleRef = doc(db, "sales", saleId);
    await updateDoc(saleRef, updateData);

    console.log("✅ salesUtils: แก้ไขยอดขายสำเร็จ");

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "sale_updated",
        details: `แก้ไขยอดขาย "${gameItem.name}" จำนวน ${saleData.quantity} รายการ (฿${netAmount.toFixed(2)})`,
        metadata: {
          saleId,
          gameId: saleData.gameId,
          gameName: game.name,
          gameItemId: saleData.gameItemId,
          gameItemName: gameItem.name,
          quantity: saleData.quantity,
          netAmount,
          profit,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ salesUtils: Error updating sale:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการแก้ไขยอดขาย",
    };
  }
}

/**
 * ลบยอดขาย
 */
export async function deleteSale(
  saleId: string,
  userInfo?: { userId: string; email: string; shopName?: string; saleName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🗑️ salesUtils: กำลังลบยอดขาย:", saleId);
    await deleteDoc(doc(db, "sales", saleId));
    console.log("✅ salesUtils: ลบยอดขายสำเร็จ");

    // บันทึก Activity Log
    if (userInfo) {
      await logActivity({
        userId: userInfo.userId,
        email: userInfo.email,
        shopName: userInfo.shopName,
        action: "sale_deleted",
        details: `ลบยอดขาย${userInfo.saleName ? ` "${userInfo.saleName}"` : ''} (ID: ${saleId})`,
        metadata: { saleId },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ salesUtils: Error deleting sale:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบยอดขาย",
    };
  }
}

/**
 * คำนวณสถิติ Dashboard (ใช้ข้อมูลจาก API)
 */
export async function getDashboardStats(
  userId?: string
): Promise<DashboardStats> {
  try {
    console.log("📊 salesUtils: คำนวณสถิติ Dashboard จาก API...");
    
    // นำเข้าฟังก์ชันจาก purchaseHistoryUtils
    const { getUserPurchaseHistory, getAllPurchaseHistory } = await import('./purchaseHistoryUtils');
    
    // ดึงข้อมูลจาก API purchase history
    const purchases = userId ? await getUserPurchaseHistory(userId) : await getAllPurchaseHistory();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ฟังก์ชันแปลงค่าให้เป็นตัวเลข
    const parseNumber = (value: any): number => {
      if (typeof value === "number") return isNaN(value) ? 0 : value;
      if (typeof value === "string") {
        const n = parseFloat(value);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    // กรองยอดขายวันนี้
    const todayPurchases = purchases.filter((p) => {
      const purchaseDate = p.date ? new Date(p.date) : (p.syncedAt || new Date());
      return purchaseDate >= todayStart;
    });

    // กรองยอดขายเดือนนี้
    const monthPurchases = purchases.filter((p) => {
      const purchaseDate = p.date ? new Date(p.date) : (p.syncedAt || new Date());
      return purchaseDate >= monthStart;
    });

    // คำนวณยอดขาย/ต้นทุน/กำไร
    const calculateTotals = (items: any[]) => {
      return items.reduce(
        (acc, item) => {
          const apiPrice = parseNumber(item.price);
          const sellPrice = parseNumber(item.sellPrice);
          acc.sales += sellPrice;
          acc.cost += apiPrice;
          acc.profit += sellPrice - apiPrice;
          return acc;
        },
        { sales: 0, cost: 0, profit: 0 }
      );
    };

    const todayTotals = calculateTotals(todayPurchases);
    const monthTotals = calculateTotals(monthPurchases);
    const allTotals = calculateTotals(purchases);

    const stats: DashboardStats = {
      // วันนี้
      todaySales: todayTotals.sales,
      todayCost: todayTotals.cost,
      todayProfit: todayTotals.profit,
      todayOrders: todayPurchases.length,

      // เดือนนี้
      monthSales: monthTotals.sales,
      monthCost: monthTotals.cost,
      monthProfit: monthTotals.profit,
      monthOrders: monthPurchases.length,

      // ทั้งหมด
      totalSales: allTotals.sales,
      totalProfit: allTotals.profit,
      totalOrders: purchases.length,
    };

    console.log("✅ salesUtils: คำนวณสถิติจาก API เสร็จสิ้น", stats);
    return stats;
  } catch (error) {
    console.error("❌ salesUtils: Error calculating stats:", error);
    return {
      todaySales: 0,
      todayCost: 0,
      todayProfit: 0,
      todayOrders: 0,
      monthSales: 0,
      monthCost: 0,
      monthProfit: 0,
      monthOrders: 0,
      totalSales: 0,
      totalProfit: 0,
      totalOrders: 0,
    };
  }
}

/**
 * สร้างข้อมูลกราฟรายวัน (7 วันล่าสุด) - ใช้ข้อมูลจาก API
 */
export async function getDailyChartData(userId?: string): Promise<ChartData[]> {
  try {
    console.log("📈 salesUtils: สร้างข้อมูลกราฟรายวันจาก API...");
    
    // นำเข้าฟังก์ชันจาก purchaseHistoryUtils
    const { getUserPurchaseHistory, getAllPurchaseHistory } = await import('./purchaseHistoryUtils');
    
    // ดึงข้อมูลจาก API purchase history
    const purchases = userId ? await getUserPurchaseHistory(userId) : await getAllPurchaseHistory();
    
    // ฟังก์ชันแปลงค่าให้เป็นตัวเลข
    const parseNumber = (value: any): number => {
      if (typeof value === "number") return isNaN(value) ? 0 : value;
      if (typeof value === "string") {
        const n = parseFloat(value);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    // สร้าง array 7 วันล่าสุด
    const chartData: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayPurchases = purchases.filter((p) => {
        const purchaseDate = p.date ? new Date(p.date) : (p.syncedAt || new Date());
        return purchaseDate >= dateStart && purchaseDate < dateEnd;
      });

      const dayTotals = dayPurchases.reduce(
        (acc, item) => {
          const apiPrice = parseNumber(item.price);
          const sellPrice = parseNumber(item.sellPrice);
          acc.sales += sellPrice;
          acc.cost += apiPrice;
          acc.profit += sellPrice - apiPrice;
          return acc;
        },
        { sales: 0, cost: 0, profit: 0 }
      );

      chartData.push({
        date: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        sales: dayTotals.sales,
        profit: dayTotals.profit,
        cost: dayTotals.cost,
      });
    }

    console.log("✅ salesUtils: สร้างข้อมูลกราฟจาก API เสร็จสิ้น");
    return chartData;
  } catch (error) {
    console.error("❌ salesUtils: Error creating chart data:", error);
    return [];
  }
}

/**
 * Export ยอดขายเป็น CSV
 */
export function exportSalesToCSV(sales: Sale[], filename = "sales-export.csv") {
  try {
    console.log("📊 salesUtils: กำลัง export ยอดขาย", sales.length, "รายการ");

    // สร้าง CSV headers
    const headers = [
      "วันที่ขาย",
      "เกม",
      "รายการเติม",
      "จำนวน",
      "ราคาทุน",
      "ราคาขาย",
      "ส่วนลด",
      "ยอดสุทธิ",
      "กำไร",
      "ผู้ใช้",
      "อีเมล",
    ];

    // สร้าง CSV rows
    const rows = sales.map((sale) => [
      sale.saleDate.toLocaleDateString("th-TH"),
      sale.gameName,
      sale.gameItemName,
      sale.quantity,
      sale.totalCost,
      sale.totalSell,
      sale.discount,
      sale.netAmount,
      sale.profit,
      sale.shopName || "",
      sale.userEmail,
    ]);

    // รวม headers และ rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // สร้าง Blob และ download
    const BOM = "\uFEFF"; // สำหรับรองรับภาษาไทย
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    console.log("✅ salesUtils: Export สำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("❌ salesUtils: Error exporting sales:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Import ยอดขายจาก Excel
 */
export async function importSalesFromExcel(
  file: File,
  userId: string,
  userEmail: string,
  shopName: string | undefined
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  try {
    console.log("📥 salesUtils: กำลัง import จาก Excel:", file.name);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet) as any[];

          console.log("📋 salesUtils: พบข้อมูล", rows.length, "แถว");

          let imported = 0;
          const errors: string[] = [];

          // ดึงข้อมูลเกมและรายการทั้งหมดเพื่อ validate
          const gamesSnapshot = await getDocs(collection(db, "games"));
          const gameItems: any[] = [];
          
          for (const gameDoc of gamesSnapshot.docs) {
            const itemsSnapshot = await getDocs(
              collection(db, "games", gameDoc.id, "items")
            );
            itemsSnapshot.docs.forEach((itemDoc) => {
              gameItems.push({
                id: itemDoc.id,
                gameId: gameDoc.id,
                gameName: gameDoc.data().name,
                itemName: itemDoc.data().name,
                costPrice: itemDoc.data().costPrice,
                sellPrice: itemDoc.data().sellPrice,
              });
            });
          }

          // Import แต่ละแถว
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              // ตรวจสอบข้อมูลที่จำเป็น
              const gameName = (row["เกม"] || row["Game"] || "").toString().trim();
              const itemName = (row["รายการเติม"] || row["Item"] || "").toString().trim();
              const quantity = Number(row["จำนวน"] || row["Quantity"]);
              const discount = Number(row["ส่วนลด"] || row["Discount"] || 0);

              if (!gameName || !itemName || !quantity) {
                errors.push(`แถว ${i + 2}: ข้อมูลไม่ครบถ้วน`);
                continue;
              }

              // หา gameItem ที่ตรงกัน
              const matchedItem = gameItems.find(
                (item) =>
                  item.gameName.trim() === gameName && item.itemName.trim() === itemName
              );

              if (!matchedItem) {
                // หาเกมที่ตรงกัน
                const matchedGame = gameItems.find(item => item.gameName.trim() === gameName);
                if (!matchedGame) {
                  errors.push(`แถว ${i + 2}: ไม่พบเกม "${gameName}"`);
                } else {
                  errors.push(`แถว ${i + 2}: ไม่พบรายการ "${itemName}" ในเกม "${gameName}"`);
                }
                continue;
              }

              // สร้างยอดขาย
              const saleInput: SaleInput = {
                gameId: matchedItem.gameId,
                gameItemId: matchedItem.id,
                quantity,
                discount,
              };

              const result = await createSale(userId, userEmail, shopName, saleInput);
              
              if (result.success) {
                imported++;
              } else {
                errors.push(`แถว ${i + 2}: ${result.error}`);
              }
            } catch (error: any) {
              errors.push(`แถว ${i + 2}: ${error.message}`);
            }
          }

          console.log(`✅ salesUtils: Import สำเร็จ ${imported} รายการ, พบข้อผิดพลาด ${errors.length} รายการ`);
          resolve({ success: true, imported, errors });
        } catch (error: any) {
          console.error("❌ salesUtils: Error processing Excel:", error);
          resolve({ success: false, imported: 0, errors: [error.message] });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, imported: 0, errors: ["ไม่สามารถอ่านไฟล์ได้"] });
      };

      reader.readAsBinaryString(file);
    });
  } catch (error: any) {
    console.error("❌ salesUtils: Error importing sales:", error);
    return { success: false, imported: 0, errors: [error.message] };
  }
}


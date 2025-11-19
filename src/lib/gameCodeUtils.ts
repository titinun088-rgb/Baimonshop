// Game Code Management Utilities
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  writeBatch,
  Timestamp,
  setDoc,
} from "firebase/firestore";

// ==================== Types ====================

export interface Game {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  stock: number; // จำนวนสต็อกทั้งหมด (active codes)
  totalCodes: number; // จำนวนรหัสทั้งหมด (รวม sold)
  createdAt: Date;
  updatedAt: Date;
}

export interface GameCode {
  id: string;
  gameId: string;
  email: string;
  password: string;
  price: number;
  details?: string; // note/details
  status: "active" | "sold" | "hidden";
  buyerUid?: string;
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameCodePurchase {
  id: string;
  userId: string;
  gameId: string;
  gameName: string;
  codeId: string;
  email: string;
  password: string;
  details?: string;
  price: number;
  purchasedAt: Date;
}

// ==================== Game Management ====================

/**
 * สร้างเกมใหม่
 */
export async function createGame(data: {
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
}): Promise<string> {
  try {
    const gameData = {
      ...data,
      stock: 0,
      totalCodes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "games"), gameData);
    console.log("✅ Created game:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating game:", error);
    throw error;
  }
}

/**
 * อัปเดตเกม
 */
export async function updateGame(
  gameId: string,
  data: Partial<Omit<Game, "id" | "stock" | "totalCodes" | "createdAt">>
): Promise<void> {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Updated game:", gameId);
  } catch (error) {
    console.error("❌ Error updating game:", error);
    throw error;
  }
}

/**
 * ลบเกม
 */
export async function deleteGame(gameId: string): Promise<void> {
  try {
    // ตรวจสอบว่ามีรหัสที่ยังไม่ขายหรือไม่
    const activeCodesQuery = query(
      collection(db, "game_codes"),
      where("gameId", "==", gameId),
      where("status", "==", "active")
    );
    const activeCodesSnapshot = await getDocs(activeCodesQuery);

    if (activeCodesSnapshot.size > 0) {
      throw new Error("ไม่สามารถลบเกมที่มีรหัสที่ยังไม่ขายได้");
    }

    // ลบเกม
    await deleteDoc(doc(db, "games", gameId));
    console.log("✅ Deleted game:", gameId);
  } catch (error) {
    console.error("❌ Error deleting game:", error);
    throw error;
  }
}

/**
 * ดึงเกมทั้งหมด
 */
export async function getAllGames(): Promise<Game[]> {
  try {
    const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const games: Game[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      games.push({
        id: docSnap.id,
        name: data.name || "",
        description: data.description || "",
        imageUrl: data.imageUrl || undefined,
        price: data.price || 0,
        stock: 0, // จะอัปเดตด้านล่าง
        totalCodes: 0, // จะอัปเดตด้านล่าง
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Game);
    }

    // อัปเดต stock สำหรับแต่ละเกม
    for (const game of games) {
      const activeCodesQuery = query(
        collection(db, "game_codes"),
        where("gameId", "==", game.id),
        where("status", "==", "active")
      );
      const activeCodesSnapshot = await getDocs(activeCodesQuery);
      game.stock = activeCodesSnapshot.size;

      const allCodesQuery = query(
        collection(db, "game_codes"),
        where("gameId", "==", game.id)
      );
      const allCodesSnapshot = await getDocs(allCodesQuery);
      game.totalCodes = allCodesSnapshot.size;
    }

    return games;
  } catch (error) {
    console.error("❌ Error getting games:", error);
    throw error;
  }
}

/**
 * ดึงเกมตาม ID
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    const gameDoc = await getDoc(doc(db, "games", gameId));
    if (!gameDoc.exists()) {
      return null;
    }

    const data = gameDoc.data();

    // นับสต็อก
    const activeCodesQuery = query(
      collection(db, "game_codes"),
      where("gameId", "==", gameId),
      where("status", "==", "active")
    );
    const activeCodesSnapshot = await getDocs(activeCodesQuery);

    const allCodesQuery = query(
      collection(db, "game_codes"),
      where("gameId", "==", gameId)
    );
    const allCodesSnapshot = await getDocs(allCodesQuery);

    return {
      id: gameDoc.id,
      name: data.name || "",
      description: data.description || "",
      imageUrl: data.imageUrl || undefined,
      price: data.price || 0,
      stock: activeCodesSnapshot.size,
      totalCodes: allCodesSnapshot.size,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Game;
  } catch (error) {
    console.error("❌ Error getting game:", error);
    throw error;
  }
}

// ==================== Game Code Management ====================

/**
 * เพิ่มรหัสเกม (ทีละชิ้น)
 */
export async function addGameCode(data: {
  gameId: string;
  email: string;
  password: string;
  price: number;
  details?: string;
}): Promise<string> {
  try {
    // ตรวจสอบ email ซ้ำ
    const emailQuery = query(
      collection(db, "game_codes"),
      where("email", "==", data.email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    if (emailSnapshot.size > 0) {
      throw new Error("Email นี้ถูกใช้แล้ว");
    }

    // ตรวจสอบ password ซ้ำ
    const passwordQuery = query(
      collection(db, "game_codes"),
      where("password", "==", data.password)
    );
    const passwordSnapshot = await getDocs(passwordQuery);
    if (passwordSnapshot.size > 0) {
      throw new Error("Password นี้ถูกใช้แล้ว");
    }

    const codeData = {
      ...data,
      status: "active" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "game_codes"), codeData);

    // อัปเดต totalCodes ในเกม
    const gameRef = doc(db, "games", data.gameId);
    await updateDoc(gameRef, {
      totalCodes: await getTotalCodesCount(data.gameId),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Added game code:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding game code:", error);
    throw error;
  }
}

/**
 * เพิ่มรหัสเกมหลายชิ้น (จาก Excel)
 */
export async function addGameCodesBulk(
  gameId: string,
  codes: Array<{
    email: string;
    password: string;
    price: number;
    details?: string;
  }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // ตรวจสอบข้อมูลซ้ำทั้งหมดก่อน
    const existingEmails = new Set<string>();
    const existingPasswords = new Set<string>();

    const allCodesQuery = query(collection(db, "game_codes"));
    const allCodesSnapshot = await getDocs(allCodesQuery);
    allCodesSnapshot.forEach((doc) => {
      const data = doc.data();
      existingEmails.add(data.email);
      existingPasswords.add(data.password);
    });

    // ตรวจสอบซ้ำในข้อมูลที่จะเพิ่ม
    const newEmails = new Set<string>();
    const newPasswords = new Set<string>();
    const duplicateInBatch: number[] = [];

    codes.forEach((code, index) => {
      if (newEmails.has(code.email) || existingEmails.has(code.email)) {
        duplicateInBatch.push(index);
        errors.push(`แถว ${index + 1}: Email "${code.email}" ซ้ำ`);
      } else {
        newEmails.add(code.email);
      }

      if (newPasswords.has(code.password) || existingPasswords.has(code.password)) {
        if (!duplicateInBatch.includes(index)) {
          duplicateInBatch.push(index);
          errors.push(`แถว ${index + 1}: Password ซ้ำ`);
        }
      } else {
        newPasswords.add(code.password);
      }
    });

    // เพิ่มเฉพาะรหัสที่ไม่ซ้ำ
    const batch = writeBatch(db);
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore limit

    for (let i = 0; i < codes.length; i++) {
      if (duplicateInBatch.includes(i)) {
        failed++;
        continue;
      }

      const code = codes[i];
      const codeRef = doc(collection(db, "game_codes"));
      batch.set(codeRef, {
        gameId,
        email: code.email,
        password: code.password,
        price: code.price,
        details: code.details || "",
        status: "active" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batchCount++;
      success++;

      // Commit batch เมื่อถึง limit
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Commit batch สุดท้าย
    if (batchCount > 0) {
      await batch.commit();
    }

    // อัปเดต totalCodes ในเกม
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      totalCodes: await getTotalCodesCount(gameId),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Added ${success} game codes, failed: ${failed}`);
    return { success, failed, errors };
  } catch (error) {
    console.error("❌ Error adding game codes bulk:", error);
    throw error;
  }
}

/**
 * อัปเดตรหัสเกม
 */
export async function updateGameCode(
  codeId: string,
  data: Partial<Omit<GameCode, "id" | "gameId" | "createdAt">>
): Promise<void> {
  try {
    const codeRef = doc(db, "game_codes", codeId);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      throw new Error("ไม่พบรหัสเกม");
    }

    const currentData = codeDoc.data();

    // ตรวจสอบ email ซ้ำ (ถ้ามีการเปลี่ยน)
    if (data.email && data.email !== currentData.email) {
      const emailQuery = query(
        collection(db, "game_codes"),
        where("email", "==", data.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (emailSnapshot.size > 0 && emailSnapshot.docs[0].id !== codeId) {
        throw new Error("Email นี้ถูกใช้แล้ว");
      }
    }

    // ตรวจสอบ password ซ้ำ (ถ้ามีการเปลี่ยน)
    if (data.password && data.password !== currentData.password) {
      const passwordQuery = query(
        collection(db, "game_codes"),
        where("password", "==", data.password)
      );
      const passwordSnapshot = await getDocs(passwordQuery);
      if (passwordSnapshot.size > 0 && passwordSnapshot.docs[0].id !== codeId) {
        throw new Error("Password นี้ถูกใช้แล้ว");
      }
    }

    await updateDoc(codeRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Updated game code:", codeId);
  } catch (error) {
    console.error("❌ Error updating game code:", error);
    throw error;
  }
}

/**
 * ลบรหัสเกม
 */
export async function deleteGameCode(codeId: string): Promise<void> {
  try {
    const codeRef = doc(db, "game_codes", codeId);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      throw new Error("ไม่พบรหัสเกม");
    }

    const codeData = codeDoc.data();

    // ห้ามลบรหัสที่ขายแล้ว
    if (codeData.status === "sold") {
      throw new Error("ไม่สามารถลบรหัสที่ขายแล้วได้");
    }

    await deleteDoc(codeRef);

    // อัปเดต totalCodes ในเกม
    const gameRef = doc(db, "games", codeData.gameId);
    await updateDoc(gameRef, {
      totalCodes: await getTotalCodesCount(codeData.gameId),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Deleted game code:", codeId);
  } catch (error) {
    console.error("❌ Error deleting game code:", error);
    throw error;
  }
}

/**
 * ดึงรหัสเกมทั้งหมดในเกม
 */
export async function getGameCodesByGameId(
  gameId: string
): Promise<GameCode[]> {
  try {
    // ลบ orderBy ออกเพื่อไม่ต้องใช้ composite index
    const q = query(
      collection(db, "game_codes"),
      where("gameId", "==", gameId)
    );
    const snapshot = await getDocs(q);

    const codes: GameCode[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      codes.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        soldAt: data.soldAt?.toDate() || undefined,
      } as GameCode);
    });

    // เรียงลำดับใน JavaScript แทน (ใหม่สุดก่อน)
    codes.sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      return dateB - dateA; // ใหม่สุดก่อน
    });

    return codes;
  } catch (error) {
    console.error("❌ Error getting game codes:", error);
    throw error;
  }
}

/**
 * นับจำนวนรหัสทั้งหมดในเกม
 */
async function getTotalCodesCount(gameId: string): Promise<number> {
  try {
    const q = query(
      collection(db, "game_codes"),
      where("gameId", "==", gameId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("❌ Error counting codes:", error);
    return 0;
  }
}

// ==================== Purchase Functions ====================

/**
 * ซื้อรหัสเกม (ใช้ Transaction)
 */
export async function purchaseGameCode(
  userId: string,
  gameId: string
): Promise<GameCodePurchase> {
  try {
    // ตรวจสอบว่า user login แล้ว
    if (!userId) {
      throw new Error("กรุณาเข้าสู่ระบบก่อน");
    }

    // ดึงข้อมูลเกม
    const gameDoc = await getDoc(doc(db, "games", gameId));
    if (!gameDoc.exists()) {
      throw new Error("ไม่พบเกม");
    }
    const gameData = gameDoc.data() as Game;
    const gameName = gameData.name;
    const gamePrice = gameData.price;

    // ตรวจสอบว่ามีราคาหรือไม่
    if (gamePrice === undefined || gamePrice === null || isNaN(gamePrice)) {
      throw new Error("ข้อมูลราคาเกมไม่ถูกต้อง");
    }

    if (gamePrice < 0) {
      throw new Error("ราคาเกมต้องมากกว่าหรือเท่ากับ 0");
    }

    // ใช้ Transaction
    const result = await runTransaction(db, async (transaction) => {
      // 1. ตรวจสอบยอดเงิน
      const userRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }
      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;

      console.log("💰 ตรวจสอบยอดเงิน:", {
        userId,
        currentBalance,
        gamePrice,
        gameName,
        sufficient: currentBalance >= gamePrice
      });

      if (currentBalance < gamePrice) {
        throw new Error(`ยอดเงินไม่เพียงพอ (มี ฿${currentBalance.toLocaleString()} ต้องการ ฿${gamePrice.toLocaleString()})`);
      }

      // 2. Query เฉพาะรหัสที่ status = "active"
      const activeCodesQuery = query(
        collection(db, "game_codes"),
        where("gameId", "==", gameId),
        where("status", "==", "active"),
        limit(100) // จำกัดเพื่อประสิทธิภาพ
      );
      const activeCodesSnapshot = await getDocs(activeCodesQuery);

      if (activeCodesSnapshot.size === 0) {
        throw new Error("สินค้าหมด");
      }

      // 3. สุ่มรหัส 1 ชิ้น
      const codes = activeCodesSnapshot.docs;
      const randomIndex = Math.floor(Math.random() * codes.length);
      const selectedCodeDoc = codes[randomIndex];
      const selectedCodeData = selectedCodeDoc.data();

      // 4. ตรวจสอบอีกรอบว่า status ยังเป็น active (ใน transaction)
      const codeRef = doc(db, "game_codes", selectedCodeDoc.id);
      const codeDocInTransaction = await transaction.get(codeRef);
      const codeDataInTransaction = codeDocInTransaction.data();

      if (!codeDocInTransaction.exists()) {
        throw new Error("รหัสเกมไม่พบ");
      }

      if (codeDataInTransaction.status !== "active") {
        throw new Error("รหัสเกมนี้ถูกขายไปแล้ว กรุณาลองใหม่");
      }

      // 5. เปลี่ยนเป็น sold
      transaction.update(codeRef, {
        status: "sold",
        buyerUid: userId,
        soldAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 6. หัก balance
      const newBalance = currentBalance - gamePrice;
      transaction.update(userRef, {
        balance: newBalance,
        lastUpdated: serverTimestamp(),
      });

      // 7. สร้าง purchase record
      const purchaseRef = doc(collection(db, "game_code_purchases"));
      const purchaseData: Omit<GameCodePurchase, "id"> = {
        userId,
        gameId,
        gameName,
        codeId: selectedCodeDoc.id,
        email: selectedCodeData.email,
        password: selectedCodeData.password,
        details: selectedCodeData.details || "",
        price: gamePrice,
        purchasedAt: new Date(),
      };
      transaction.set(purchaseRef, {
        ...purchaseData,
        purchasedAt: serverTimestamp(),
      });

      return {
        id: purchaseRef.id,
        ...purchaseData,
      } as GameCodePurchase;
    });

    // 8. บันทึกประวัติการซื้อไปยังหน้าประวัติการสั่งซื้อ
    try {
      const reference = `GAMECODE_${Date.now()}_${result.id.substring(0, 8)}`;
      const uniqueKey = `gamecode_${reference}`;
      
      const purchaseHistoryDoc = doc(db, "peamsub_purchases", uniqueKey);
      await setDoc(purchaseHistoryDoc, {
        userId,
        type: 'game',
        peamsubId: 0, // รหัสเกมไม่มี peamsubId
        reference,
        productName: gameName,
        productId: gameId,
        info: `รหัสเกม: ${gameName}`,
        price: gamePrice.toString(),
        recommendedPrice: gamePrice.toString(),
        sellPrice: gamePrice,
        status: 'completed',
        date: new Date().toISOString(),
        resellerId: 'internal',
        syncedAt: serverTimestamp(),
        gameCodePurchaseId: result.id // เก็บ ID ของ game_code_purchases ด้วย
      });
      
      console.log("✅ บันทึกประวัติการซื้อสำเร็จ:", reference);
    } catch (historyError) {
      console.warn("⚠️ ไม่สามารถบันทึกประวัติการซื้อได้:", historyError);
      // ไม่ throw error เพราะการซื้อสำเร็จแล้ว แค่บันทึกประวัติไม่ได้
    }

    console.log("✅ Purchase successful:", result.id);
    return result;
  } catch (error) {
    console.error("❌ Error purchasing game code:", error);
    throw error;
  }
}

/**
 * ดึงประวัติการซื้อรหัสเกมของผู้ใช้
 */
export async function getUserGameCodePurchases(
  userId: string
): Promise<GameCodePurchase[]> {
  try {
    const q = query(
      collection(db, "game_code_purchases"),
      where("userId", "==", userId),
      orderBy("purchasedAt", "desc")
    );
    const snapshot = await getDocs(q);

    const purchases: GameCodePurchase[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      purchases.push({
        id: docSnap.id,
        ...data,
        purchasedAt: data.purchasedAt?.toDate() || new Date(),
      } as GameCodePurchase);
    });

    return purchases;
  } catch (error) {
    console.error("❌ Error getting user purchases:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูลรหัสที่ซื้อ (สำหรับแสดงหลังซื้อ)
 */
export async function getPurchasedCodeDetails(
  purchaseId: string,
  userId: string
): Promise<GameCodePurchase | null> {
  try {
    const purchaseDoc = await getDoc(doc(db, "game_code_purchases", purchaseId));
    if (!purchaseDoc.exists()) {
      return null;
    }

    const data = purchaseDoc.data();

    // ตรวจสอบว่าเป็นผู้ซื้อจริง
    if (data.userId !== userId) {
      throw new Error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
    }

    return {
      id: purchaseDoc.id,
      ...data,
      purchasedAt: data.purchasedAt?.toDate() || new Date(),
    } as GameCodePurchase;
  } catch (error) {
    console.error("❌ Error getting purchased code details:", error);
    throw error;
  }
}


// Email/Password Game Utilities
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  limit,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import logger from './logger';
import {
  EmailPassGame,
  GamePackage,
  EmailPassGameOrder,
  GameStats,
  OrderFilter,
  DashboardStats
} from '@/types/emailPassGame';

// ===== GAME MANAGEMENT =====

/**
 * สร้างเกมใหม่
 */
export async function createGame(
  name: string,
  icon: string,
  description: string,
  createdBy: string
): Promise<string> {
  try {
    const gameData: Omit<EmailPassGame, 'id'> = {
      name,
      icon,
      description,
      topUpType: 'email_password',
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy
    };

    const docRef = await addDoc(collection(db, 'emailPassGames'), gameData);
    logger.debug('✅ Created game:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Error creating game:', error);
    throw error;
  }
}

/**
 * ดึงเกมทั้งหมด
 */
export async function getAllGames(activeOnly: boolean = false): Promise<EmailPassGame[]> {
  try {
    // ดึงทั้งหมดแล้วกรองและเรียงใน client เพื่อไม่ต้องสร้าง index
    const snapshot = await getDocs(collection(db, 'emailPassGames'));
    
    let games: EmailPassGame[] = [];
    snapshot.forEach((doc) => {
      games.push({ id: doc.id, ...doc.data() } as EmailPassGame);
    });

    // กรองถ้าต้องการเฉพาะ active
    if (activeOnly) {
      games = games.filter(game => game.active);
    }

    // เรียงตามชื่อ
    games.sort((a, b) => a.name.localeCompare(b.name));

    return games;
  } catch (error) {
    logger.error('❌ Error getting games:', error);
    throw error;
  }
}

/**
 * ดึงเกมตาม ID
 */
export async function getGameById(gameId: string): Promise<EmailPassGame | null> {
  try {
    const docRef = doc(db, 'emailPassGames', gameId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EmailPassGame;
    }
    return null;
  } catch (error) {
    logger.error('❌ Error getting game:', error);
    throw error;
  }
}

/**
 * อัปเดตเกม
 */
export async function updateGame(
  gameId: string,
  updates: Partial<Omit<EmailPassGame, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'emailPassGames', gameId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    logger.debug('✅ Updated game:', gameId);
  } catch (error) {
    logger.error('❌ Error updating game:', error);
    throw error;
  }
}

/**
 * ลบเกม
 */
export async function deleteGame(gameId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'emailPassGames', gameId));
    logger.debug('✅ Deleted game:', gameId);
  } catch (error) {
    logger.error('❌ Error deleting game:', error);
    throw error;
  }
}

// ===== PACKAGE MANAGEMENT =====

/**
 * สร้างแพ็กเกจใหม่
 */
export async function createPackage(packageData: Omit<GamePackage, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'gamePackages'), packageData);
    logger.debug('✅ Created package:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Error creating package:', error);
    throw error;
  }
}

/**
 * ดึงแพ็กเกจของเกม
 */
export async function getGamePackages(gameId: string, activeOnly: boolean = false): Promise<GamePackage[]> {
  try {
    // ใช้เฉพาะ where gameId แล้วกรองและเรียงใน client
    const q = query(
      collection(db, 'gamePackages'),
      where('gameId', '==', gameId)
    );
    const snapshot = await getDocs(q);
    
    let packages: GamePackage[] = [];
    snapshot.forEach((doc) => {
      packages.push({ id: doc.id, ...doc.data() } as GamePackage);
    });

    // กรองถ้าต้องการเฉพาะ active
    if (activeOnly) {
      packages = packages.filter(pkg => pkg.active);
    }

    // เรียงตาม order
    packages.sort((a, b) => a.order - b.order);

    return packages;
  } catch (error) {
    logger.error('❌ Error getting packages:', error);
    throw error;
  }
}

/**
 * ดึงแพ็กเกจตาม ID
 */
export async function getPackageById(packageId: string): Promise<GamePackage | null> {
  try {
    const docRef = doc(db, 'gamePackages', packageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as GamePackage;
    }
    return null;
  } catch (error) {
    logger.error('❌ Error getting package:', error);
    throw error;
  }
}

/**
 * อัปเดตแพ็กเกจ
 */
export async function updatePackage(
  packageId: string,
  updates: Partial<Omit<GamePackage, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'gamePackages', packageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    logger.debug('✅ Updated package:', packageId);
  } catch (error) {
    logger.error('❌ Error updating package:', error);
    throw error;
  }
}

/**
 * ลบแพ็กเกจ
 */
export async function deletePackage(packageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'gamePackages', packageId));
    logger.debug('✅ Deleted package:', packageId);
  } catch (error) {
    logger.error('❌ Error deleting package:', error);
    throw error;
  }
}

// ===== ORDER MANAGEMENT =====

/**
 * สร้างออเดอร์ใหม่
 */
export async function createOrder(
  userId: string,
  userEmail: string,
  game: EmailPassGame,
  pkg: GamePackage,
  gameEmail: string,
  gamePassword: string,
  note?: string
): Promise<string> {
  try {
    const orderData: Omit<EmailPassGameOrder, 'id'> = {
      userId,
      userEmail,
      gameId: game.id,
      gameName: game.name,
      packageId: pkg.id,
      packageName: pkg.name,
      packageValue: pkg.value,
      packageUnit: pkg.unit,
      price: pkg.price,
      gameEmail,
      gamePassword,
      status: 'pending',
      note: note || null,
      adminNote: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      completedAt: null,
      completedBy: null,
      cancelledAt: null,
      telegramMessageId: null,
      telegramChatId: null
    };

    const docRef = await addDoc(collection(db, 'emailPassOrders'), orderData);
    
    // หักเงินจาก user balance
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(-pkg.price)
    });

    logger.debug('✅ Created order:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Error creating order:', error);
    throw error;
  }
}

/**
 * ดึงออเดอร์ของผู้ใช้
 */
export async function getUserOrders(userId: string): Promise<EmailPassGameOrder[]> {
  try {
    // ใช้แค่ where แล้วเรียงใน client เพื่อไม่ต้องสร้าง composite index
    const q = query(
      collection(db, 'emailPassOrders'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    let orders: EmailPassGameOrder[] = [];
    
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...(doc.data() as Omit<EmailPassGameOrder, 'id'>) });
    });

    // เรียงตามวันที่ใน client
    orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return orders;
  } catch (error) {
    logger.error('❌ Error getting user orders:', error);
    throw error;
  }
}

/**
 * ดึงออเดอร์ทั้งหมด (สำหรับแอดมิน)
 */
export async function getAllOrders(filter?: OrderFilter): Promise<EmailPassGameOrder[]> {
  try {
    let q;
    
    // ใช้ where เพียงอันเดียวเพื่อไม่ต้องสร้าง composite index
    if (filter?.gameId) {
      q = query(collection(db, 'emailPassOrders'), where('gameId', '==', filter.gameId));
    } else if (filter?.userId) {
      q = query(collection(db, 'emailPassOrders'), where('userId', '==', filter.userId));
    } else if (filter?.status) {
      q = query(collection(db, 'emailPassOrders'), where('status', '==', filter.status));
    } else {
      q = query(collection(db, 'emailPassOrders'));
    }

    const snapshot = await getDocs(q);
    
    let orders: EmailPassGameOrder[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...(doc.data() as Omit<EmailPassGameOrder, 'id'>) });
    });

    // กรองเพิ่มเติมใน client ถ้ามีหลาย filter
    if (filter?.gameId && filter?.status) {
      orders = orders.filter(o => o.status === filter.status);
    }
    if (filter?.gameId && filter?.userId) {
      orders = orders.filter(o => o.userId === filter.userId);
    }
    if (filter?.userId && filter?.status) {
      orders = orders.filter(o => o.status === filter.status);
    }

    // เรียงตามวันที่
    orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return orders;
  } catch (error) {
    logger.error('❌ Error getting orders:', error);
    throw error;
  }
}

/**
 * ดึงออเดอร์ตาม ID
 */
export async function getOrderById(orderId: string): Promise<EmailPassGameOrder | null> {
  try {
    const docRef = doc(db, 'emailPassOrders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EmailPassGameOrder;
    }
    return null;
  } catch (error) {
    logger.error('❌ Error getting order:', error);
    throw error;
  }
}

/**
 * อัปเดตสถานะออเดอร์
 */
export async function updateOrderStatus(
  orderId: string,
  status: EmailPassGameOrder['status'],
  adminNote?: string,
  completedBy?: string
): Promise<void> {
  try {
    const updates: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (adminNote) {
      updates.adminNote = adminNote;
    }

    if (status === 'completed') {
      updates.completedAt = Timestamp.now();
      if (completedBy) {
        updates.completedBy = completedBy;
      }
    }

    if (status === 'cancelled') {
      updates.cancelledAt = Timestamp.now();
    }

    const docRef = doc(db, 'emailPassOrders', orderId);
    await updateDoc(docRef, updates);
    
    logger.debug('✅ Updated order status:', orderId, status);
  } catch (error) {
    logger.error('❌ Error updating order status:', error);
    throw error;
  }
}

/**
 * อัปเดต Telegram Message ID
 */
export async function updateOrderTelegram(
  orderId: string,
  messageId: number,
  chatId: number
): Promise<void> {
  try {
    const docRef = doc(db, 'emailPassOrders', orderId);
    await updateDoc(docRef, {
      telegramMessageId: messageId,
      telegramChatId: chatId,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error('❌ Error updating telegram info:', error);
    throw error;
  }
}

// ===== STATISTICS =====

/**
 * ดึงสถิติของเกม
 */
export async function getGameStats(gameId: string): Promise<GameStats> {
  try {
    const orders = await getAllOrders({ gameId });
    
    const stats: GameStats = {
      gameId,
      gameName: '',
      totalOrders: orders.length,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0
    };

    orders.forEach(order => {
      if (order.status === 'completed') {
        stats.totalRevenue += order.price;
        stats.completedOrders++;
      } else if (order.status === 'pending' || order.status === 'processing') {
        stats.pendingOrders++;
      } else if (order.status === 'cancelled') {
        stats.cancelledOrders++;
      }

      if (!stats.lastOrderDate || order.createdAt > stats.lastOrderDate) {
        stats.lastOrderDate = order.createdAt;
      }
    });

    // ดึงชื่อเกม
    const game = await getGameById(gameId);
    if (game) {
      stats.gameName = game.name;
    }

    return stats;
  } catch (error) {
    logger.error('❌ Error getting game stats:', error);
    throw error;
  }
}

/**
 * ดึงสถิติ Dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const allOrders = await getAllOrders();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let todayOrders = 0;
    let todayRevenue = 0;
    let totalOrders = allOrders.length;
    let totalRevenue = 0;
    let pendingOrders = 0;
    
    const gameRevenue: { [gameId: string]: { gameName: string; revenue: number; orders: number } } = {};

    allOrders.forEach(order => {
      const orderDate = order.createdAt.toDate();
      
      if (orderDate >= todayStart) {
        todayOrders++;
        if (order.status === 'completed') {
          todayRevenue += order.price;
        }
      }

      if (order.status === 'completed') {
        totalRevenue += order.price;
        
        if (!gameRevenue[order.gameId]) {
          gameRevenue[order.gameId] = {
            gameName: order.gameName,
            revenue: 0,
            orders: 0
          };
        }
        gameRevenue[order.gameId].revenue += order.price;
        gameRevenue[order.gameId].orders++;
      }

      if (order.status === 'pending' || order.status === 'processing') {
        pendingOrders++;
      }
    });

    // Top 5 games
    const topGames: GameStats[] = Object.entries(gameRevenue)
      .map(([gameId, data]) => ({
        gameId,
        gameName: data.gameName,
        totalOrders: data.orders,
        totalRevenue: data.revenue,
        pendingOrders: 0,
        completedOrders: data.orders,
        cancelledOrders: 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return {
      todayOrders,
      todayRevenue,
      totalOrders,
      totalRevenue,
      pendingOrders,
      topGames
    };
  } catch (error) {
    logger.error('❌ Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * ตรวจสอบยอดเงินผู้ใช้
 */
export async function checkUserBalance(userId: string, requiredAmount: number): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const balance = userSnap.data().balance || 0;
      return balance >= requiredAmount;
    }
    return false;
  } catch (error) {
    logger.error('❌ Error checking balance:', error);
    throw error;
  }
}

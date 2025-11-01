// ประเภทข้อมูลสำหรับยอดขาย (Sales)

export interface Sale {
  id: string;
  userId: string; // ID ของผู้ขาย
  userEmail: string; // อีเมลผู้ขาย
  shopName?: string; // ชื่อร้าน
  gameId: string; // ID ของเกม
  gameName: string; // ชื่อเกม
  gameItemId: string; // ID ของรายการเติม
  gameItemName: string; // ชื่อรายการเติม
  quantity: number; // จำนวน
  costPricePerUnit: number; // ราคาทุนต่อหน่วย
  sellPricePerUnit: number; // ราคาขายต่อหน่วย
  discount: number; // ส่วนลด (บาท)
  totalCost: number; // ต้นทุนรวม (costPrice * quantity)
  totalSell: number; // ราคาขายรวมก่อนส่วนลด (sellPrice * quantity)
  netAmount: number; // ราคาขายสุทธิ (totalSell - discount)
  profit: number; // กำไร (netAmount - totalCost)
  saleDate: Date; // วันที่ขาย
  createdAt: Date; // วันที่สร้างรายการ
  updatedAt?: Date; // วันที่อัปเดต
}

export interface SaleInput {
  gameId: string;
  gameItemId: string;
  quantity: number;
  discount: number;
}

// สำหรับ Dashboard Statistics
export interface DashboardStats {
  todaySales: number; // ยอดขายวันนี้
  todayCost: number; // ต้นทุนวันนี้
  todayProfit: number; // กำไรวันนี้
  todayOrders: number; // จำนวนรายการวันนี้
  
  monthSales: number; // ยอดขายเดือนนี้
  monthCost: number; // ต้นทุนเดือนนี้
  monthProfit: number; // กำไรเดือนนี้
  monthOrders: number; // จำนวนรายการเดือนนี้
  
  totalSales: number; // ยอดขายทั้งหมด
  totalProfit: number; // กำไรทั้งหมด
  totalOrders: number; // จำนวนรายการทั้งหมด
}

// สำหรับกราฟ
export interface ChartData {
  date: string; // วันที่ (รูปแบบ: "DD/MM")
  sales: number; // ยอดขาย
  profit: number; // กำไร
  cost: number; // ต้นทุน
}

export interface MonthlyChartData {
  month: string; // เดือน (รูปแบบ: "Jan", "Feb")
  sales: number;
  profit: number;
  cost: number;
}




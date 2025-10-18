export interface ShopInvitation {
  id: string;
  shopOwnerId: string; // เจ้าของร้านที่ส่งคำขอ
  shopOwnerEmail: string;
  shopName: string;
  invitedUserId: string; // คนที่ถูกเชิญ
  invitedUserEmail: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export interface ShopMember {
  shopOwnerId: string; // เจ้าของร้านหลัก
  memberId: string; // ID ของผู้ดูแล
  memberEmail: string;
  addedAt: Date;
  role: "co-admin" | "manager"; // สำหรับอนาคตถ้าต้องการแบ่ง permission
}


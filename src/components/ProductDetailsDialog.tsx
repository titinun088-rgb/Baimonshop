import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Calendar,
  CreditCard,
  User,
  Hash,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink
} from "lucide-react";
import type { PeamsubPurchaseHistory } from "@/lib/peamsubUtils";
import { toast } from "sonner";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseItem: PeamsubPurchaseHistory | null;
}

const ProductDetailsDialog = ({ isOpen, onClose, purchaseItem }: ProductDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);

  if (!purchaseItem) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            สำเร็จ
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            รอดำเนินการ
          </Badge>
        );
      case "failed":
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            ล้มเหลว
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {status || "ไม่ทราบ"}
          </Badge>
        );
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  const handleCopyReference = () => {
    copyToClipboard(purchaseItem.refId, 'รหัสอ้างอิง');
  };

  const handleCopyProductId = () => {
    copyToClipboard(purchaseItem.productId, 'รหัสสินค้า');
  };

  const handleCopyResellerId = () => {
    copyToClipboard(purchaseItem.resellerId, 'รหัสตัวแทนจำหน่าย');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดสินค้าที่ซื้อ
          </DialogTitle>
          <DialogDescription>
            ข้อมูลรายละเอียดสินค้าที่ซื้อเมื่อ {formatDate(purchaseItem.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* สถานะการซื้อ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                สถานะการซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">สถานะ</label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(purchaseItem.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ข้อมูลสินค้า */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                ข้อมูลสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* รูปภาพสินค้า */}
              {purchaseItem.img && (
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={purchaseItem.img}
                      alt={purchaseItem.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">ชื่อสินค้า</label>
                  <p className="text-lg font-semibold text-white">{stripHtmlTags(purchaseItem.productName)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">รหัสสินค้า</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-black bg-gray-50 px-3 py-2 rounded border">{purchaseItem.productId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyProductId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">รหัสอ้างอิง</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-black bg-gray-50 px-3 py-2 rounded border">{purchaseItem.refId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyReference}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">รหัสตัวแทนจำหน่าย</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-black bg-gray-50 px-3 py-2 rounded border">{purchaseItem.resellerId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyResellerId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {purchaseItem.prize && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">รายละเอียดสินค้า</label>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                      {stripHtmlTags(purchaseItem.prize)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ข้อมูลการชำระเงิน */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ข้อมูลการชำระเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">ราคา</label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(purchaseItem.price)} บาท
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">วันที่ซื้อ</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-white">{formatDate(purchaseItem.date)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ข้อมูลเพิ่มเติม */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                ข้อมูลเพิ่มเติม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">ID การซื้อ</label>
                  <p className="font-mono text-sm text-black bg-gray-50 px-3 py-2 rounded border">
                    {purchaseItem.id}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">วันที่สร้าง</label>
                  <p className="text-sm text-white">{formatDate(purchaseItem.date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ปุ่มปิด */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;

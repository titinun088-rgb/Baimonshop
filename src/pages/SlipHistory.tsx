import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  Receipt,
  Calendar,
  DollarSign,
  Building,
  User,
  FileText,
  Clock
} from "lucide-react";
import { 
  getSlipByReferenceId,
  formatAmount, 
  formatDate
} from "@/lib/slip2goUtils";

interface SlipHistoryItem {
  referenceId: string;
  amount: number;
  dateTime: string;
  verifyDate?: string;
  receiver: {
    account: {
      name: string;
      bank: {
        account?: string | null;
      };
    };
    bank: {
      id: string;
      name?: string | null;
    };
  };
  sender: {
    account: {
      name: string;
      bank: {
        account: string;
      };
    };
    bank: {
      id: string;
      name: string;
    };
  };
  transRef: string;
  ref1?: string | null;
  ref2?: string | null;
  ref3?: string | null;
}

const SlipHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slipHistory, setSlipHistory] = useState<SlipHistoryItem[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<SlipHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load slip history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('slipHistory');
    if (savedHistory) {
      try {
        setSlipHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading slip history:', error);
      }
    }
  }, []);

  // Save slip history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('slipHistory', JSON.stringify(slipHistory));
  }, [slipHistory]);

  const handleSearchByReferenceId = async () => {
    if (!referenceId.trim()) {
      toast.error('กรุณากรอก Reference ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSlipByReferenceId(referenceId.trim());
      
      if (result.success && result.data) {
        const slipData: SlipHistoryItem = {
          referenceId: result.data.referenceId,
          amount: result.data.amount,
          dateTime: result.data.dateTime,
          verifyDate: result.data.verifyDate,
          receiver: {
            account: {
              name: result.data.receiver.account.name,
              bank: {
                account: result.data.receiver.account.bank.account
              }
            },
            bank: {
              id: result.data.receiver.bank.id,
              name: result.data.receiver.bank.name
            }
          },
          sender: {
            account: {
              name: result.data.sender.account.name,
              bank: {
                account: result.data.sender.account.bank.account
              }
            },
            bank: {
              id: result.data.sender.bank.id,
              name: result.data.sender.bank.name
            }
          },
          transRef: result.data.transRef,
          ref1: result.data.ref1,
          ref2: result.data.ref2,
          ref3: result.data.ref3
        };

        // Check if slip already exists in history
        const existingIndex = slipHistory.findIndex(slip => slip.referenceId === slipData.referenceId);
        
        if (existingIndex >= 0) {
          // Update existing slip
          const updatedHistory = [...slipHistory];
          updatedHistory[existingIndex] = slipData;
          setSlipHistory(updatedHistory);
          toast.success('อัปเดตข้อมูลสลิปในประวัติแล้ว');
        } else {
          // Add new slip to history
          setSlipHistory(prev => [slipData, ...prev]);
          toast.success('เพิ่มสลิปในประวัติแล้ว');
        }

        setSelectedSlip(slipData);
        setReferenceId('');
      } else {
        setError(result.error || 'ไม่พบข้อมูลสลิป');
        toast.error(result.error || 'ไม่พบข้อมูลสลิป');
      }
    } catch (error) {
      console.error('Error retrieving slip:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลสลิป');
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลสลิป');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}เรียบร้อยแล้ว`);
  };

  const clearHistory = () => {
    setSlipHistory([]);
    setSelectedSlip(null);
    toast.success('ล้างประวัติสลิปเรียบร้อยแล้ว');
  };

  const removeSlipFromHistory = (referenceId: string) => {
    setSlipHistory(prev => prev.filter(slip => slip.referenceId !== referenceId));
    if (selectedSlip?.referenceId === referenceId) {
      setSelectedSlip(null);
    }
    toast.success('ลบสลิปจากประวัติเรียบร้อยแล้ว');
  };

  const filteredHistory = slipHistory.filter(slip => 
    slip.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.receiver.account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.sender.account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.transRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ประวัติสลิปการโอนเงิน</h1>
            <p className="text-gray-600 mt-2">จัดการและดูประวัติสลิปการโอนเงินที่เคยตรวจสอบแล้ว</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search and Add Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    ค้นหาและเพิ่มสลิป
                  </CardTitle>
                  <CardDescription>
                    ค้นหาสลิปด้วย Reference ID หรือเพิ่มสลิปใหม่
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="referenceId">Reference ID</Label>
                    <Input
                      id="referenceId"
                      placeholder="กรอก Reference ID..."
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSearchByReferenceId}
                    disabled={!referenceId.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        กำลังค้นหา...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        ค้นหาสลิป
                      </>
                    )}
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label>ค้นหาในประวัติ</Label>
                    <Input
                      placeholder="ค้นหาด้วย Reference ID, ชื่อ, หรือรหัสธนาคาร..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={clearHistory}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      ล้างประวัติ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* History List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    ประวัติสลิป ({filteredHistory.length})
                  </CardTitle>
                  <CardDescription>
                    รายการสลิปที่เคยตรวจสอบแล้ว
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>ยังไม่มีประวัติสลิป</p>
                      <p className="text-sm">ใช้ Reference ID เพื่อค้นหาและเพิ่มสลิป</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredHistory.map((slip) => (
                        <div
                          key={slip.referenceId}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSlip?.referenceId === slip.referenceId
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedSlip(slip)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {slip.referenceId.slice(0, 8)}...
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {formatDate(slip.dateTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                  {formatAmount(slip.amount)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {slip.sender.account.name} → {slip.receiver.account.name}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSlipFromHistory(slip.referenceId);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Selected Slip Details */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    รายละเอียดสลิป
                  </CardTitle>
                  <CardDescription>
                    ข้อมูลสลิปที่เลือก
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedSlip ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>เลือกสลิปจากรายการเพื่อดูรายละเอียด</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          ข้อมูลสลิปถูกต้องและครบถ้วน
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">จำนวนเงิน:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-600">
                              {formatAmount(selectedSlip.amount)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.amount.toString(), "จำนวนเงิน")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">ธนาคารผู้รับ:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedSlip.receiver.bank.name || `ธนาคาร ID: ${selectedSlip.receiver.bank.id}`}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.receiver.bank.name || selectedSlip.receiver.bank.id, "ธนาคารผู้รับ")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">หมายเลขบัญชีผู้รับ:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{selectedSlip.receiver.account.bank.account || 'ไม่ระบุ'}</span>
                            {selectedSlip.receiver.account.bank.account && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(selectedSlip.receiver.account.bank.account!, "หมายเลขบัญชีผู้รับ")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">ชื่อบัญชีผู้รับ:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedSlip.receiver.account.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.receiver.account.name, "ชื่อบัญชีผู้รับ")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">ธนาคารผู้ส่ง:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedSlip.sender.bank.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.sender.bank.name, "ธนาคารผู้ส่ง")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">หมายเลขบัญชีผู้ส่ง:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{selectedSlip.sender.account.bank.account}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.sender.account.bank.account, "หมายเลขบัญชีผู้ส่ง")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">ชื่อผู้ส่ง:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedSlip.sender.account.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.sender.account.name, "ชื่อผู้ส่ง")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">วันที่ทำรายการ:</span>
                          <span className="text-sm">{formatDate(selectedSlip.dateTime)}</span>
                        </div>

                        {selectedSlip.verifyDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">วันที่ตรวจสอบ:</span>
                            <span className="text-sm">{formatDate(selectedSlip.verifyDate)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">รหัสอ้างอิงธนาคาร:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{selectedSlip.transRef}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.transRef, "รหัสอ้างอิงธนาคาร")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">รหัสอ้างอิงสลิป:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{selectedSlip.referenceId}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSlip.referenceId, "รหัสอ้างอิงสลิป")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {(selectedSlip.ref1 || selectedSlip.ref2 || selectedSlip.ref3) && (
                          <div className="space-y-2">
                            <Separator />
                            <h4 className="font-medium text-gray-700">ข้อมูลเพิ่มเติม</h4>
                            {selectedSlip.ref1 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ref1:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{selectedSlip.ref1}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedSlip.ref1!, "Ref1")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {selectedSlip.ref2 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ref2:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{selectedSlip.ref2}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedSlip.ref2!, "Ref2")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {selectedSlip.ref3 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ref3:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{selectedSlip.ref3}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedSlip.ref3!, "Ref3")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SlipHistory;


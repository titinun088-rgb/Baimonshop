import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  templateHeaders: string[];
  onImport: (file: File) => Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }>;
  onSuccess: () => void;
}

const ImportDialog = ({
  open,
  onOpenChange,
  title,
  description,
  templateHeaders,
  onImport,
  onSuccess,
}: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // ตรวจสอบนามสกุลไฟล์
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error("กรุณาเลือกไฟล์ Excel (.xlsx, .xls)");
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    try {
      setImporting(true);
      const importResult = await onImport(file);

      setResult({
        imported: importResult.imported,
        errors: importResult.errors,
      });

      if (importResult.imported > 0) {
        toast.success(`นำเข้าข้อมูลสำเร็จ ${importResult.imported} รายการ`);
        onSuccess();
      }

      if (importResult.errors.length === 0 && importResult.imported > 0) {
        // ปิด dialog ถ้าสำเร็จทั้งหมด
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    // สร้าง CSV template
    const csvContent = templateHeaders.join(",");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลด Template เรียบร้อย");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">รูปแบบไฟล์ที่ต้องการ</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  ไฟล์ Excel ต้องมี Header ดังนี้:
                </p>
                <div className="bg-background p-2 rounded text-sm font-mono mb-3">
                  {templateHeaders.join(", ")}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  ดาวน์โหลด Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">เลือกไฟล์ Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                ไฟล์ที่เลือก: {file.name}
              </p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {result.imported > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    นำเข้าข้อมูลสำเร็จ {result.imported} รายการ
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">
                      พบข้อผิดพลาด {result.errors.length} รายการ:
                    </div>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                      {result.errors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {result && result.imported > 0 ? "ปิด" : "ยกเลิก"}
          </Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังนำเข้า...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                นำเข้าข้อมูล
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;




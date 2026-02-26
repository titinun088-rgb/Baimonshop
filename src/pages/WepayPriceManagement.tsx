import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Save,
    Loader2,
    TrendingUp,
    TrendingDown,
    Gamepad2,
    FileDown,
    FileUp,
    Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getWepayGameProducts, WepayGameProduct } from "@/lib/wepayGameUtils";
import {
    getAllPeamsubProductPrices,
    setPeamsubProductPrice,
    deletePeamsubProductPrice,
    PeamsubProductPrice,
} from "@/lib/peamsubPriceUtils";

const WepayPriceManagement = () => {
    const { user, userData } = useAuth();
    const isAdmin = userData?.role === 'admin';

    const [products, setProducts] = useState<WepayGameProduct[]>([]);
    const [adminPrices, setAdminPrices] = useState<Map<string, PeamsubProductPrice>>(new Map());
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Edit Dialog States
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<WepayGameProduct | null>(null);
    const [editCost, setEditCost] = useState("");
    const [editSellPrice, setEditSellPrice] = useState("");
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const loadData = async (force = false) => {
        setLoading(true);
        try {
            const [wepayProducts, allAdminPrices] = await Promise.all([
                getWepayGameProducts(force),
                getAllPeamsubProductPrices()
            ]);

            setProducts(wepayProducts);

            // Filter only wepay_game prices and map them
            const priceMap = new Map<string, PeamsubProductPrice>();
            allAdminPrices.forEach(price => {
                if (price.productType === 'wepay_game') {
                    // The ID in database is wepay_game_{productId}
                    const productId = price.id.replace('wepay_game_', '');
                    priceMap.set(productId, price);
                }
            });
            setAdminPrices(priceMap);

            if (force) toast.success("รีเฟรชข้อมูลล่าสุดเรียบร้อย");
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (product: WepayGameProduct) => {
        setEditingProduct(product);
        const customPrice = adminPrices.get(product.id);
        const apiCost = parseFloat(product.price) || parseFloat(product.pay_to_amount) || 0;

        // Use custom apiPrice (Cost) if set, otherwise default to API cost
        const currentCost = customPrice?.apiPrice || apiCost;
        const currentSellPrice = customPrice?.sellPrice || currentCost;

        setEditCost(currentCost.toString());
        setEditSellPrice(currentSellPrice.toString());
        setEditDialogOpen(true);
    };

    const handleSavePrice = async () => {
        if (!editingProduct || !user) return;

        const sellPriceNum = parseFloat(editSellPrice);
        const costNum = parseFloat(editCost);

        if (isNaN(sellPriceNum) || sellPriceNum < 0 || isNaN(costNum) || costNum < 0) {
            toast.error("กรุณากรอกราคาต้นทุนและราคาขายที่ถูกต้อง");
            return;
        }

        setSaving(true);
        try {
            await setPeamsubProductPrice(
                editingProduct.id,
                'wepay_game',
                sellPriceNum,
                costNum,
                editingProduct.info,     // productName
                editingProduct.category, // category
                user.uid
            );

            toast.success("บันทึกราคาและต้นทุนสำเร็จ");
            setEditDialogOpen(false);

            // Update local state instead of full reload for speed
            const updatedPriceMap = new Map(adminPrices);
            updatedPriceMap.set(editingProduct.id, {
                id: `wepay_game_${editingProduct.id}`,
                productType: 'wepay_game',
                apiPrice: costNum,
                sellPrice: sellPriceNum,
                productName: editingProduct.category,
                updatedAt: new Date(),
                updatedBy: user.uid
            });
            setAdminPrices(updatedPriceMap);
        } catch (error) {
            console.error("Error saving price:", error);
            toast.error("ไม่สามารถบันทึกราคาได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePrice = async (productId: string) => {
        if (!confirm("ล้างราคาที่ตั้งเองและกลับไปใช้ราคาแนะนำจาก API ใช่หรือไม่?")) return;

        try {
            await deletePeamsubProductPrice(productId, 'wepay_game');
            toast.success("ล้างราคาเรียบร้อย");

            const updatedPriceMap = new Map(adminPrices);
            updatedPriceMap.delete(productId);
            setAdminPrices(updatedPriceMap);
        } catch (error) {
            console.error("Error deleting price:", error);
            toast.error("ไม่สามารถลบราคาได้");
        }
    };

    // Export to Excel
    const handleExportExcel = () => {
        try {
            const dataToExport = products.map(p => {
                const adminPrice = adminPrices.get(p.id);
                const cost = adminPrice && adminPrice.apiPrice !== undefined
                    ? (typeof adminPrice.apiPrice === 'string' ? parseFloat(adminPrice.apiPrice) : adminPrice.apiPrice)
                    : (parseFloat(p.price) || parseFloat(p.pay_to_amount) || 0);
                const sellPrice = adminPrice?.sellPrice || cost;

                return {
                    "Game ID": p.id,
                    "Category": p.category,
                    "Product Details": p.info,
                    "Current Cost (฿)": cost,
                    "Current Sell Price (฿)": sellPrice,
                    "API Cost (Ref)": parseFloat(p.price) || parseFloat(p.pay_to_amount) || 0
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "WepayPrices");

            // Auto-width columns
            const maxWidths = [15, 25, 40, 15, 15, 15];
            worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

            XLSX.writeFile(workbook, `Wepay_Prices_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("ส่งออกไฟล์ Excel สำเร็จ");
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("เกิดข้อผิดพลาดในการส่งออกไฟล์");
        }
    };

    // Import from Excel (Only update Cost)
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                let updateCount = 0;
                const newAdminPrices = new Map(adminPrices);

                for (const row of jsonData) {
                    const productId = row["Game ID"]?.toString();
                    const excelCost = parseFloat(row["Current Cost (฿)"]);
                    const excelSellPrice = parseFloat(row["Current Sell Price (฿)"]);

                    if (productId && (!isNaN(excelCost) || !isNaN(excelSellPrice))) {
                        const product = products.find(p => p.id === productId);
                        if (product) {
                            const adminPrice = adminPrices.get(productId);
                            const oldApiCost = parseFloat(product.price) || parseFloat(product.pay_to_amount) || 0;
                            
                            // Determine final values (Use Excel if valid, otherwise keep existing)
                            const finalCost = !isNaN(excelCost) 
                                ? excelCost 
                                : (adminPrice && adminPrice.apiPrice !== undefined 
                                    ? (typeof adminPrice.apiPrice === 'string' ? parseFloat(adminPrice.apiPrice) : adminPrice.apiPrice) 
                                    : oldApiCost);
                                    
                            const finalSellPrice = !isNaN(excelSellPrice) 
                                ? excelSellPrice 
                                : (adminPrice?.sellPrice || finalCost);

                            await setPeamsubProductPrice(
                                productId,
                                'wepay_game',
                                finalSellPrice,
                                finalCost,
                                product.info,
                                product.category,
                                user.uid
                            );

                            newAdminPrices.set(productId, {
                                id: `wepay_game_${productId}`,
                                productType: 'wepay_game',
                                apiPrice: finalCost,
                                sellPrice: finalSellPrice,
                                productName: product.info,
                                updatedAt: new Date(),
                                updatedBy: user.uid
                            });
                            updateCount++;
                        }
                    }
                }

                setAdminPrices(newAdminPrices);
                toast.success(`นำเข้าสำเร็จ อัปเดตข้อมูลทั้งหมด ${updateCount} รายการ`);
            } catch (error) {
                console.error("Import Error:", error);
                toast.error("เกิดข้อผิดพลาดในการนำเข้าไฟล์ ตรวจสอบรูปแบบไฟล์ให้ถูกต้อง");
            } finally {
                setImporting(false);
                // Reset input
                e.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const filteredProducts = products.filter(p =>
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.info.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pay_to_company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <RoleProtectedRoute allowedRoles={["admin"]}>
            <Layout>
                <div className="space-y-6 pb-10">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">จัดการราคา wePAY</h1>
                            <p className="text-muted-foreground">
                                ตั้งราคาขายหน้าร้านและตรวจสอบผลกำไรเทียบกับต้นทุน wePAY
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="flex gap-2">
                                <Button onClick={handleExportExcel} variant="outline" className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        id="excel-import"
                                        onChange={handleImportExcel}
                                        disabled={importing}
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                                        disabled={importing}
                                    >
                                        <label htmlFor="excel-import" className="cursor-pointer">
                                            {importing ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileUp className="mr-2 h-4 w-4" />
                                            )}
                                            Import ต้นทุน
                                        </label>
                                    </Button>
                                </div>
                            </div>
                            <Button onClick={() => loadData(true)} disabled={loading} variant="outline" className="bg-pink-600 hover:bg-pink-700 text-white border-none shadow-lg shadow-pink-600/20">
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                รีเฟรชข้อมูล wePAY
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-400">รายการทั้งหมด</p>
                                        <h3 className="text-2xl font-bold text-white">{products.length}</h3>
                                    </div>
                                    <div className="p-3 bg-pink-500/10 rounded-2xl">
                                        <Gamepad2 className="h-6 w-6 text-pink-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-400">ตั้งราคาเองแล้ว</p>
                                        <h3 className="text-2xl font-bold text-green-500">{adminPrices.size}</h3>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-2xl">
                                        <Save className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-400">กำไรเฉลี่ย (ตัวอย่าง)</p>
                                        <h3 className="text-2xl font-bold text-blue-500">
                                            {adminPrices.size > 0 ? (
                                                Math.round(Array.from(adminPrices.values()).reduce((acc, curr) => acc + (curr.sellPrice - (parseFloat(curr.apiPrice as string) || 0)), 0) / adminPrices.size)
                                            ) : 0} ฿
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        <TrendingUp className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters & Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1-2 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหาชื่อเกม, แพ็คเกจ หรือรหัสบริษัท..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-card border-zinc-800 focus:ring-pink-500/50 text-white"
                        />
                    </div>

                    {/* Pricing Table */}
                    <Card className="border-border bg-card shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-zinc-900/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">เกม / หมวดหมู่</TableHead>
                                        <TableHead className="w-[280px]">แพ็กเกจ / ข้อมูล</TableHead>
                                        <TableHead className="text-right">ต้นทุน API</TableHead>
                                        <TableHead className="text-right">ราคาขาย</TableHead>
                                        <TableHead className="text-right">กำไร</TableHead>
                                        <TableHead className="text-center w-[120px]">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-500 mb-2" />
                                                <p className="text-muted-foreground">กำลังโหลดข้อมูลสินค้าจาก wePAY...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                ไม่พบรายการที่ค้นหา
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        Object.entries(
                                            filteredProducts.reduce((acc, product) => {
                                                const cat = product.category || "อื่นๆ";
                                                if (!acc[cat]) acc[cat] = [];
                                                acc[cat].push(product);
                                                return acc;
                                            }, {} as Record<string, WepayGameProduct[]>)
                                        ).map(([category, items]) => (
                                            <React.Fragment key={category}>
                                                {/* Category Header Row */}
                                                <TableRow className="bg-zinc-800/80 hover:bg-zinc-800/80 border-y border-zinc-700">
                                                    <TableCell colSpan={6} className="py-2 px-4 shadow-inner">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-5 bg-pink-500 rounded-full" />
                                                            <span className="font-black text-pink-400 uppercase tracking-wider text-sm">
                                                                {category}
                                                            </span>
                                                            <Badge variant="outline" className="ml-2 text-[10px] bg-black/20 border-zinc-700">
                                                                {items.length} รายการ
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Products in this category */}
                                                {items.map((product) => {
                                                    const adminPrice = adminPrices.get(product.id);

                                                    // Use admin-defined cost if available, otherwise API cost
                                                    const cost = adminPrice && adminPrice.apiPrice !== undefined
                                                        ? (typeof adminPrice.apiPrice === 'string' ? parseFloat(adminPrice.apiPrice) : adminPrice.apiPrice)
                                                        : (parseFloat(product.price) || parseFloat(product.pay_to_amount) || 0);

                                                    const sellPrice = adminPrice?.sellPrice || cost;
                                                    const profit = sellPrice - cost;
                                                    const profitPercent = cost > 0 ? ((profit / cost) * 100).toFixed(1) : "0";

                                                    return (
                                                        <TableRow key={product.id} className="hover:bg-zinc-800/30 transition-colors border-zinc-800/50">
                                                            <TableCell className="pl-8 text-[11px] text-zinc-500 font-medium">
                                                                {product.category}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-semibold text-white leading-relaxed max-w-md overflow-hidden">
                                                                {product.info ? (
                                                                    <div
                                                                        className="[&>b]:text-pink-400 [&>small]:text-zinc-400 [&_span]:!leading-tight"
                                                                        dangerouslySetInnerHTML={{ __html: product.info }}
                                                                    />
                                                                ) : (
                                                                    <span className="text-zinc-500">ไม่มีข้อมูลเพิ่มเติม</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-sm font-bold text-white">
                                                                ฿{(cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`font-bold ${adminPrice ? 'text-green-500' : 'text-zinc-400'}`}>
                                                                        ฿{sellPrice.toLocaleString()}
                                                                    </span>
                                                                    {!adminPrice && <span className="text-[9px] text-zinc-500 opacity-70">(Cost)</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1.5 font-bold">
                                                                    {profit > 0 ? (
                                                                        <span className="text-green-500 flex items-center text-sm">
                                                                            +{profit.toLocaleString()}
                                                                            <TrendingUp className="ml-1 h-3 w-3" />
                                                                        </span>
                                                                    ) : profit < 0 ? (
                                                                        <span className="text-red-500 flex items-center text-sm">
                                                                            {profit.toLocaleString()}
                                                                            <TrendingDown className="ml-1 h-3 w-3" />
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-zinc-500 text-sm">0</span>
                                                                    )}
                                                                    <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                                                        {profitPercent}%
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        className="h-7 w-7 p-0 bg-zinc-800 hover:bg-zinc-700"
                                                                        onClick={() => openEditDialog(product)}
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    {adminPrice && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                            onClick={() => handleDeletePrice(product.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Edit Price Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>ตั้งราคาขาย</DialogTitle>
                            <DialogDescription>
                                {editingProduct?.category} - {editingProduct?.info}
                            </DialogDescription>
                        </DialogHeader>

                        {editingProduct && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="editCost">ต้นทุน (บาท)</Label>
                                        <div className="relative">
                                            <Input
                                                id="editCost"
                                                type="number"
                                                value={editCost}
                                                onChange={(e) => setEditCost(e.target.value)}
                                                className="h-12 font-bold bg-zinc-900 border-zinc-800 text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 italic">
                                            (API: ฿{(parseFloat(editingProduct?.price || "0") || parseFloat(editingProduct?.pay_to_amount || "0") || 0).toLocaleString()})
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="sellPrice">ราคาที่จะวางขาย (บาท)</Label>
                                        <div className="relative">
                                            <Input
                                                id="sellPrice"
                                                type="number"
                                                value={editSellPrice}
                                                onChange={(e) => setEditSellPrice(e.target.value)}
                                                className="h-12 font-bold bg-zinc-900 border-zinc-700 border-2 text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className={`text-xs font-bold mt-1 ${(parseFloat(editSellPrice) - parseFloat(editCost)) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            กำไร: ฿{(parseFloat(editSellPrice) - parseFloat(editCost)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
                                    <p className="text-xs text-pink-300 leading-relaxed italic">
                                        💡 คุณสามารถแก้ไขต้นทุนได้เองกรณีค่าจาก API ไม่ถูกต้อง หรือระบบจะคำนวณกำไรตามต้นทุนที่คุณระบุใหม่ทันทีครับ
                                    </p>
                                </div>
                            </>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                                ยกเลิก
                            </Button>
                            <Button onClick={handleSavePrice} disabled={saving} className="bg-pink-600 hover:bg-pink-700">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        บันทึกราคา
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Layout>
        </RoleProtectedRoute>
    );
};

export default WepayPriceManagement;

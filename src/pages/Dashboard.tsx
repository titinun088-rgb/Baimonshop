import { useState } from "react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Mock data
const salesData = [
  { date: "01/01", sales: 4000, profit: 2400 },
  { date: "02/01", sales: 3000, profit: 1398 },
  { date: "03/01", sales: 2000, profit: 9800 },
  { date: "04/01", sales: 2780, profit: 3908 },
  { date: "05/01", sales: 1890, profit: 4800 },
  { date: "06/01", sales: 2390, profit: 3800 },
  { date: "07/01", sales: 3490, profit: 4300 },
];

const mockSales = [
  {
    id: 1,
    date: "2024-01-08 14:30",
    game: "Valorant",
    item: "VP 1000",
    quantity: 2,
    cost: 200,
    price: 250,
    profit: 50,
  },
  {
    id: 2,
    date: "2024-01-08 13:15",
    game: "Genshin Impact",
    item: "Genesis Crystal 6480",
    quantity: 1,
    cost: 1500,
    price: 1800,
    profit: 300,
  },
  {
    id: 3,
    date: "2024-01-08 11:00",
    game: "Honkai Star Rail",
    item: "Oneiric Shard 6480",
    quantity: 1,
    cost: 1500,
    price: 1750,
    profit: 250,
  },
  {
    id: 4,
    date: "2024-01-07 16:45",
    game: "Free Fire",
    item: "Diamond 2000",
    quantity: 3,
    cost: 300,
    price: 390,
    profit: 90,
  },
  {
    id: 5,
    date: "2024-01-07 15:20",
    game: "Mobile Legends",
    item: "Diamond 1000",
    quantity: 2,
    cost: 200,
    price: 260,
    profit: 60,
  },
];

const Dashboard = () => {
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(mockSales.length / parseInt(itemsPerPage));
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage);
  const endIndex = startIndex + parseInt(itemsPerPage);
  const currentSales = mockSales.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">ภาพรวมยอดขายและสถิติร้านค้า</p>
        </div>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มยอดขาย
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ยอดขายวันนี้"
          value="฿12,450"
          change="+12.5% จากเมื่อวาน"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="กำไรสุทธิ"
          value="฿8,290"
          change="+8.2% จากเมื่อวาน"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="ยอดขายทั้งหมด"
          value="245"
          change="+18 รายการ"
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="สินค้าทั้งหมด"
          value="156"
          change="12 เกม"
          icon={Package}
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>ยอดขายรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>กำไรรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="profit" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการยอดขายล่าสุด</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">แสดง</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">รายการ</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>เกม</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ราคาทุน</TableHead>
                  <TableHead className="text-right">ราคาขาย</TableHead>
                  <TableHead className="text-right">กำไร</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.date}</TableCell>
                    <TableCell>{sale.game}</TableCell>
                    <TableCell>{sale.item}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">฿{sale.cost}</TableCell>
                    <TableCell className="text-right">฿{sale.price}</TableCell>
                    <TableCell className="text-right text-success">
                      ฿{sale.profit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              แสดง {startIndex + 1} ถึง {Math.min(endIndex, mockSales.length)} จาก{" "}
              {mockSales.length} รายการ
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page ? "bg-gradient-primary shadow-glow" : ""
                  }
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

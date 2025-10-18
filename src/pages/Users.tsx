import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Users = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
            <p className="text-muted-foreground">
              จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
            </p>
          </div>
          <Button className="bg-gradient-primary shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้
          </Button>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>กำลังพัฒนา</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา กรุณารอติดตาม!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Users;

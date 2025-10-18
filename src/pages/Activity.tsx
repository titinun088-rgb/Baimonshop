import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Activity = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">กิจกรรม</h1>
          <p className="text-muted-foreground">
            ติดตามกิจกรรมและการเคลื่อนไหวในระบบ
          </p>
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

export default Activity;

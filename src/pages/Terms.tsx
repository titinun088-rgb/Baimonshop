import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Shield, AlertCircle, UserCheck, Database, Scale } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/register">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าสมัครสมาชิก
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ข้อกำหนดและเงื่อนไขการใช้งาน</h1>
              <p className="text-muted-foreground">Terms of Service</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="pt-6 space-y-8">
            {/* คำนำ */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">คำนำ</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    ยินดีต้อนรับสู่ Game Nexus Dashboard ซึ่งเป็นระบบจัดการผู้ใช้เกมออนไลน์
                    การใช้บริการของเราแสดงว่าคุณยอมรับข้อกำหนดและเงื่อนไขเหล่านี้ 
                    กรุณาอ่านอย่างละเอียดก่อนใช้งาน
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 1. การยอมรับข้อกำหนด */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                1. การยอมรับข้อกำหนด
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เมื่อคุณเข้าถึงและใช้งานเว็บไซต์นี้ คุณตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขดังต่อไปนี้:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>คุณต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ หรือได้รับความยินยอมจากผู้ปกครอง</li>
                  <li>คุณจะให้ข้อมูลที่ถูกต้องและเป็นจริงในการสมัครสมาชิก</li>
                  <li>คุณจะรักษาความปลอดภัยของบัญชีและรหัสผ่านของคุณ</li>
                  <li>คุณจะไม่ใช้บริการในทางที่ผิดกฎหมายหรือไม่เหมาะสม</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 2. บัญชีผู้ใช้ */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                2. บัญชีผู้ใช้และความรับผิดชอบ
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">การสร้างบัญชี:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>คุณต้องสมัครสมาชิกด้วยข้อมูลที่ถูกต้องและครบถ้วน</li>
                  <li>อีเมลที่ใช้สมัครต้องเป็นของคุณและสามารถติดต่อได้จริง</li>
                  <li>ห้ามสร้างบัญชีหลายบัญชีโดยไม่จำเป็น</li>
                  <li>ห้ามแอบอ้างเป็นบุคคลหรือองค์กรอื่น</li>
                </ul>

                <p className="font-medium text-foreground mt-4">ความรับผิดชอบต่อบัญชี:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>คุณมีหน้าที่รักษาความลับของรหัสผ่าน</li>
                  <li>คุณรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นในบัญชีของคุณ</li>
                  <li>หากพบการใช้งานที่ผิดปกติ กรุณาแจ้งเราทันที</li>
                  <li>เราขอสงวนสิทธิ์ในการพักหรือระงับบัญชีที่ละเมิดข้อกำหนด</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 3. การใช้งานและข้อจำกัด */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                3. การใช้งานที่อนุญาตและข้อจำกัด
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">อนุญาตให้ใช้งาน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>จัดการข้อมูลเกมและรายการเติมเงิน</li>
                  <li>บันทึกและติดตามยอดขาย</li>
                  <li>ดูรายงานและสถิติการขาย</li>
                  <li>จัดการข้อมูลลูกค้าและการแจ้งเตือน</li>
                </ul>

                <p className="font-medium text-foreground mt-4">ห้ามใช้งาน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ทำการโจมตีหรือรบกวนระบบ (DDoS, SQL Injection, etc.)</li>
                  <li>พยายามเข้าถึงบัญชีหรือข้อมูลของผู้อื่น</li>
                  <li>ใช้ bot หรือ automated tools โดยไม่ได้รับอนุญาต</li>
                  <li>คัดลอกหรือทำซ้ำระบบเพื่อการค้า</li>
                  <li>เผยแพร่เนื้อหาที่ผิดกฎหมายหรือละเมิดสิทธิ์</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 4. ข้อมูลส่วนบุคคล */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                4. ข้อมูลส่วนบุคคลและความเป็นส่วนตัว
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เรารวบรวมและใช้ข้อมูลของคุณตามที่ระบุในนโยบายความเป็นส่วนตัว:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ข้อมูลที่เก็บ: อีเมล, ชื่อร้าน, ข้อมูลการขาย</li>
                  <li>วัตถุประสงค์: ให้บริการ, ปรับปรุงระบบ, สื่อสารกับผู้ใช้</li>
                  <li>เราไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สาม</li>
                  <li>ข้อมูลจะถูกเก็บรักษาอย่างปลอดภัยด้วย Firebase Security</li>
                  <li>คุณมีสิทธิ์เข้าถึง แก้ไข หรือลบข้อมูลของคุณได้</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 5. ทรัพย์สินทางปัญญา */}
            <section>
              <h2 className="text-xl font-semibold mb-3">5. ทรัพย์สินทางปัญญา</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เนื้อหาทั้งหมดในเว็บไซต์นี้เป็นทรัพย์สินของเรา รวมถึง:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>โค้ดโปรแกรม, ดีไซน์ และโครงสร้างระบบ</li>
                  <li>โลโก้, ไอคอน และกราฟิก</li>
                  <li>เนื้อหา, คู่มือ และเอกสารประกอบ</li>
                  <li>ห้ามคัดลอกหรือดัดแปลงโดยไม่ได้รับอนุญาต</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 6. การจำกัดความรับผิด */}
            <section>
              <h2 className="text-xl font-semibold mb-3">6. การจำกัดความรับผิด</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เราให้บริการในสภาพ "AS IS" และไม่รับประกัน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>บริการจะไม่หยุดชะงักหรือปราศจากข้อผิดพลาด</li>
                  <li>ข้อมูลหรือผลลัพธ์จะถูกต้องเสมอ</li>
                  <li>ความเสียหายที่เกิดจากการใช้หรือไม่สามารถใช้บริการ</li>
                  <li>การสูญเสียข้อมูลจากเหตุสุดวิสัย</li>
                </ul>
                <p className="mt-2">
                  คุณควรสำรองข้อมูลสำคัญและใช้บริการด้วยความระมัดระวัง
                </p>
              </div>
            </section>

            <Separator />

            {/* 7. การเปลี่ยนแปลงข้อกำหนด */}
            <section>
              <h2 className="text-xl font-semibold mb-3">7. การเปลี่ยนแปลงข้อกำหนด</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>จะแจ้งให้ทราบผ่านเว็บไซต์หรืออีเมล</li>
                  <li>การใช้งานต่อถือว่ายอมรับข้อกำหนดใหม่</li>
                  <li>หากไม่เห็นด้วย กรุณาหยุดใช้บริการ</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 8. การยกเลิกบัญชี */}
            <section>
              <h2 className="text-xl font-semibold mb-3">8. การยกเลิกบัญชีและการสิ้นสุดบริการ</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>คุณสามารถยกเลิกบัญชีได้ตลอดเวลาโดย:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ติดต่อผู้ดูแลระบบเพื่อขอลบบัญชี</li>
                  <li>ข้อมูลบางส่วนอาจถูกเก็บไว้ตามกฎหมาย</li>
                </ul>
                <p className="mt-2">เราสามารถระงับหรือยกเลิกบัญชีของคุณได้หากพบว่า:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ละเมิดข้อกำหนดและเงื่อนไข</li>
                  <li>ใช้บริการในทางที่ผิดกฎหมาย</li>
                  <li>ไม่ชำระค่าบริการ (ถ้ามี)</li>
                  <li>ไม่ใช้งานเป็นเวลานาน</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 9. กฎหมายที่ใช้บังคับ */}
            <section>
              <h2 className="text-xl font-semibold mb-3">9. กฎหมายที่ใช้บังคับ</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย 
                  ข้อพิพาทใดๆ จะระงับโดยศาลที่มีเขตอำนาจในประเทศไทย
                </p>
              </div>
            </section>

            <Separator />

            {/* 10. ติดต่อเรา */}
            <section>
              <h2 className="text-xl font-semibold mb-3">10. ติดต่อเรา</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>หากมีคำถามเกี่ยวกับข้อกำหนดและเงื่อนไขเหล่านี้ กรุณาติดต่อ:</p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1 mt-2">
                  <p><strong>อีเมล:</strong> support@gamenexus.com</p>
                  <p><strong>เว็บไซต์:</strong> www.gamenexus.com</p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                การใช้บริการของเราแสดงว่าคุณได้อ่านและยอมรับข้อกำหนดและเงื่อนไขทั้งหมด
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link to="/register">
            <Button size="lg" className="bg-gradient-primary shadow-glow">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปสมัครสมาชิก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;




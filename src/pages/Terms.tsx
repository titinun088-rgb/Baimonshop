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
                    ยินดีต้อนรับสู่ <strong>BaimonShop</strong> เว็บเติมเกมออนไลน์อันดับ 1 ของประเทศไทย 
                    ที่ให้บริการเติมเกมออนไลน์ แอปพรีเมียม บัตรเติมเงิน และบริการดิจิทัลต่างๆ 
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
                <p className="font-medium text-foreground">บริการที่ BaimonShop ให้บริการ:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>เติมเกมออนไลน์:</strong> ROV, Free Fire, PUBG Mobile, Mobile Legends, Genshin Impact, Valorant, Roblox, Fortnite</li>
                  <li><strong>แอปพรีเมียม:</strong> Netflix, Spotify, YouTube Premium, Disney+, Canva Pro</li>
                  <li><strong>บัตรเติมเงิน:</strong> Steam, PlayStation, Xbox, Nintendo, Garena, True Money</li>
                  <li><strong>เติมเงินมือถือ:</strong> AIS, True, DTAC, NT</li>
                  <li><strong>บริการดิจิทัล:</strong> ระบบ Wallet, การชำระเงินออนไลน์, ระบบอัตโนมัติ</li>
                  <li>การจัดการบัญชีผู้ใช้และประวัติการทำรายการ</li>
                  <li>ระบบรายงานและสถิติการใช้งาน</li>
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

            {/* 4. การชำระเงินและการคืนเงิน */}
            <section>
              <h2 className="text-xl font-semibold mb-3">4. การชำระเงินและนโยบายการคืนเงิน</h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">ช่องทางการชำระเงิน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>PromptPay QR Code (ธนาคารทุกธนาคาร)</li>
                  <li>True Money Wallet</li>
                  <li>บัตรเครดิต/เดบิต</li>
                  <li>การโอนเงินธนาคาร</li>
                  <li>ระบบ Wallet ภายในเว็บไซต์</li>
                </ul>
                
                <p className="font-medium text-foreground mt-4">นโยบายการคืนเงิน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>สินค้าดิจิทัลไม่สามารถคืนเงินได้หลังจากส่งมอบแล้ว</li>
                  <li>หากเกิดข้อผิดพลาดจากระบบ เราจะดำเนินการแก้ไขภายใน 24 ชั่วโมง</li>
                  <li>กรณีสินค้าไม่ถูกต้อง สามารถขอเปลี่ยนได้ภายใน 7 วัน</li>
                  <li>การคืนเงินจะดำเนินการภายใน 3-7 วันทำการ</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 5. ข้อมูลส่วนบุคคล */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                5. ข้อมูลส่วนบุคคลและความเป็นส่วนตัว
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เรารวบรวมและใช้ข้อมูลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>ข้อมูลที่เก็บ:</strong> อีเมล, เบอร์โทรศัพท์, ประวัติการทำรายการ, ข้อมูล Wallet</li>
                  <li><strong>วัตถุประสงค์:</strong> ให้บริการเติมเกม, ยืนยันตัตน, ป้องกันการฉ้อโกง, ติดต่อสื่อสาร</li>
                  <li><strong>การแบ่งปัน:</strong> เราไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สาม</li>
                  <li><strong>ความปลอดภัย:</strong> ข้อมูลเข้ารหัสด้วย SSL และเก็บใน Firebase Security</li>
                  <li><strong>สิทธิ์ของคุณ:</strong> เข้าถึง แก้ไข ลบ หรือโอนข้อมูลได้ตามกฎหมาย</li>
                  <li><strong>Cookies:</strong> เราใช้ Cookies เพื่อปรับปรุงประสบการณ์การใช้งาน</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 6. ทรัพย์สินทางปัญญา */}
            <section>
              <h2 className="text-xl font-semibold mb-3">6. ทรัพย์สินทางปัญญา</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>เนื้อหาทั้งหมดในเว็บไซต์ BaimonShop เป็นทรัพย์สินของเรา รวมถึง:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>โลโก้ BaimonShop:</strong> ตราสัญลักษณ์, แบรนด์, สีสัน และดีไซน์</li>
                  <li><strong>ระบบเว็บไซต์:</strong> โค้ดโปรแกรม, UI/UX, อัลกอริทึม, Database</li>
                  <li><strong>เนื้อหา:</strong> คู่มือการใช้งาน, FAQ, บทความ, รูปภาพ</li>
                  <li><strong>ดาตาเบส:</strong> ราคาสินค้า, ข้อมูลเกม, API Endpoints</li>
                  <li><strong>ข้อจำกัด:</strong> ห้ามคัดลอก, ทำซ้ำ, ใช้เพื่อการค้าโดยไม่ได้รับอนุญาต</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* 7. การจำกัดความรับผิดและการรับประกัน */}
            <section>
              <h2 className="text-xl font-semibold mb-3">7. การจำกัดความรับผิดและการรับประกัน</h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">สิ่งที่ BaimonShop รับประกัน:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>บริการเติมเกมและแอปพรีเมียมจะสำเร็จภายใน 24 ชั่วโมง</li>
                  <li>ระบบอัตโนมัติจะทำงานอย่างถูกต้องและรวดเร็ว</li>
                  <li>ความปลอดภัยของข้อมูลการชำระเงินและข้อมูลส่วนตัว</li>
                  <li>สินค้าและบริการจะถูกส่งมอบตามความถูกต้อง</li>
                </ul>
                
                <p className="font-medium text-foreground mt-4">สิ่งที่ BaimonShop ไม่รับผิดชอบ:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ความเสียหายจากการใช้บริการผิดกฎหมายหรือไม่เหมาะสม</li>
                  <li>การสูญเสียเงินจากข้อผิดพลาดทางเทคนิคหรือระบบ</li>
                  <li>ปัญหาจากบุคคลที่สามหรือการกระทำที่ผิดกฎหมาย</li>
                  <li>การหยุดชะงักของระบบจากเหตุสุดวิสัยหรือการบำรุงรักษา</li>
                </ul>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700 mt-4">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">ข้อแนะนำ:</p>
                  <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                    คุณควรสำรองข้อมูลการทำรายการและตรวจสอบความถูกต้องก่อนทำรายการ
                    ใช้บริการด้วยความระมัดระวัง
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 8. การเปลี่ยนแปลงข้อกำหนด */}
            <section>
              <h2 className="text-xl font-semibold mb-3">8. การเปลี่ยนแปลงข้อกำหนด</h2>
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

            {/* 9. การยกเลิกบัญชี */}
            <section>
              <h2 className="text-xl font-semibold mb-3">9. การยกเลิกบัญชีและการสิ้นสุดบริการ</h2>
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

            {/* 10. กฎหมายที่ใช้บังคับ */}
            <section>
              <h2 className="text-xl font-semibold mb-3">10. กฎหมายที่ใช้บังคับ</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย 
                  ข้อพิพาทใดๆ จะระงับโดยศาลที่มีเขตอำนาจในประเทศไทย
                </p>
              </div>
            </section>

            <Separator />

            {/* 11. ติดต่อเรา */}
            <section>
              <h2 className="text-xl font-semibold mb-3">11. ติดต่อเรา</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>หากมีคำถามเกี่ยวกับข้อกำหนดและเงื่อนไขเหล่านี้ กรุณาติดต่อ BaimonShop:</p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 mt-2">
                  <p><strong>เว็บไซต์:</strong> <a href="https://www.baimonshop.com" className="text-primary hover:underline">www.baimonshop.com</a></p>
                  <p><strong>อีเมล สนับสนุน:</strong> support@baimonshop.com</p>
                  <p><strong>เวลาบริการ:</strong> 24 ชั่วโมง ทุกวัน</p>
                  <p><strong>Line ID:</strong> @baimonshop (สำหรับการสนับสนุนด่วน)</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>หมายเหตุ:</strong> หากมีปัญหาเกี่ยวกับการชำระเงินหรือเติมเกม กรุณาส่งหลักฐานการทำรายการและรายละเอียดปัญหามาด้วย
                  </p>
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




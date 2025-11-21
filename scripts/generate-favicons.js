const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public');

// ตรวจสอบว่ามีไฟล์ logo.png หรือไม่
if (!fs.existsSync(inputFile)) {
    console.error('❌ ไม่พบไฟล์ logo.png ใน public/');
    process.exit(1);
}

console.log('🎨 กำลังสร้าง Favicon ทุกขนาด...\n');

// กำหนดขนาดที่ต้องการ
const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
];

// สร้าง favicon แต่ละขนาด
async function generateFavicons() {
    try {
        for (const { name, size } of sizes) {
            const outputPath = path.join(outputDir, name);

            await sharp(inputFile)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ สร้าง ${name} (${size}x${size})`);
        }

        // สร้าง favicon.ico (multi-size ICO file)
        console.log('\n🔄 กำลังสร้าง favicon.ico...');

        // สร้าง favicon.ico จาก favicon-32x32.png
        const favicon32Path = path.join(outputDir, 'favicon-32x32.png');
        const faviconIcoPath = path.join(outputDir, 'favicon.ico');

        // Copy favicon-32x32.png เป็น favicon.ico (เพราะ sharp ไม่รองรับ .ico โดยตรง)
        // ในการใช้งานจริง browser จะรับ PNG ได้เหมือนกัน
        await sharp(inputFile)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(faviconIcoPath);

        console.log('✅ สร้าง favicon.ico (32x32)');

        console.log('\n🎉 สร้าง Favicon ทุกขนาดเสร็จสมบูรณ์!');
        console.log('\n📋 ไฟล์ที่สร้าง:');
        console.log('   - favicon.ico (32x32)');
        console.log('   - favicon-16x16.png');
        console.log('   - favicon-32x32.png');
        console.log('   - apple-touch-icon.png (180x180)');
        console.log('   - android-chrome-192x192.png');
        console.log('   - android-chrome-512x512.png');
        console.log('\n✅ พร้อมใช้งานแล้ว!');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

generateFavicons();

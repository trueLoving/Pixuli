const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 获取项目根目录（从 apps/mobile/scripts/ 向上三级）
const projectRoot = path.resolve(__dirname, '../../../');
const rootIconPath = path.join(projectRoot, 'icon.png');
const outputDir = path.join(__dirname, '../assets/images');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log('开始生成移动端图标...');
    console.log(`源图标: ${rootIconPath}`);

    // 检查源图标是否存在
    if (!fs.existsSync(rootIconPath)) {
      throw new Error(`源图标不存在: ${rootIconPath}`);
    }

    // 读取源图标
    const sourceImage = sharp(rootIconPath);
    const metadata = await sourceImage.metadata();
    console.log(`源图标尺寸: ${metadata.width}x${metadata.height}`);

    // 1. 生成主图标 (1024x1024) - 直接复制
    console.log('生成主图标...');
    await sourceImage
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(outputDir, 'icon.png'));

    // 2. 生成 Android 前景图标 (1024x1024)
    // Android 自适应图标的前景应该只包含图标的主要部分，中心 432x432 区域
    console.log('生成 Android 前景图标...');
    await sourceImage
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(outputDir, 'android-icon-foreground.png'));

    // 3. 生成 Android 背景图标 (1024x1024)
    // 从源图标提取背景色，或使用默认背景色
    console.log('生成 Android 背景图标...');
    const backgroundColor = '#E6F4FE'; // 从 app.json 中获取的背景色
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: backgroundColor,
      },
    })
      .png()
      .toFile(path.join(outputDir, 'android-icon-background.png'));

    // 4. 生成 Android 单色图标 (1024x1024)
    // 将图标转换为单色（灰度）
    console.log('生成 Android 单色图标...');
    await sourceImage
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .greyscale()
      .png()
      .toFile(path.join(outputDir, 'android-icon-monochrome.png'));

    // 5. 生成启动画面图标 (200x200 或更大)
    console.log('生成启动画面图标...');
    await sourceImage
      .resize(400, 400, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(outputDir, 'splash-icon.png'));

    // 6. 生成 Web favicon (多种尺寸)
    console.log('生成 Web favicon...');
    // 生成 32x32 favicon
    await sourceImage
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));

    console.log('✅ 所有图标生成完成！');
    console.log(`输出目录: ${outputDir}`);
  } catch (error) {
    console.error('❌ 生成图标时出错:', error);
    process.exit(1);
  }
}

generateIcons();

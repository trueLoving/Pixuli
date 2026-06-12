/**
 * 从 apps/mobile/assets/images 同步品牌资源到 apps/pixuli（REF-516）。
 * 生成 Web / PWA / Desktop / Capacitor Android 衍生图标。
 */
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIXULI_ROOT = path.resolve(__dirname, '..');
const MOBILE_IMAGES = path.resolve(PIXULI_ROOT, '../mobile/assets/images');
const BRAND_SOURCE = path.join(PIXULI_ROOT, 'brand/source');
const PUBLIC_DIR = path.join(PIXULI_ROOT, 'public');
const PWA_DIR = path.join(PUBLIC_DIR, 'pwa');
const ANDROID_RES = path.join(PIXULI_ROOT, 'android/app/src/main/res');

const SOURCE_FILES = [
  'icon.png',
  'favicon.png',
  'splash-icon.png',
  'android-icon-foreground.png',
  'android-icon-background.png',
  'android-icon-monochrome.png',
];

const LAUNCHER_SIZES = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 },
};

const SPLASH_SCREENS = [
  { dir: 'drawable', width: 480, height: 320 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
];

const SPLASH_BG = '#ffffff';
const ANDROID_LAUNCHER_BG = '#E6F4FE';

async function resizePng(input, output, width, height, fit = 'cover') {
  await sharp(input)
    .resize(width, height, { fit, background: SPLASH_BG })
    .png()
    .toFile(output);
}

async function copySources() {
  await mkdir(BRAND_SOURCE, { recursive: true });
  for (const name of SOURCE_FILES) {
    const from = path.join(MOBILE_IMAGES, name);
    const to = path.join(BRAND_SOURCE, name);
    await copyFile(from, to);
    console.log(`  source: ${name}`);
  }
}

async function generateWebAssets() {
  const icon = path.join(BRAND_SOURCE, 'icon.png');
  const favicon = path.join(BRAND_SOURCE, 'favicon.png');

  await copyFile(icon, path.join(PUBLIC_DIR, 'icon.png'));
  await copyFile(favicon, path.join(PUBLIC_DIR, 'favicon.png'));

  await resizePng(icon, path.join(PWA_DIR, 'icon-192x192.png'), 192, 192, 'contain');
  await resizePng(icon, path.join(PWA_DIR, 'icon-512x512.png'), 512, 512, 'contain');

  const faviconIco = await pngToIco(favicon);
  await writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), faviconIco);

  const icon256 = await sharp(icon).resize(256, 256, { fit: 'contain' }).png().toBuffer();
  const iconIco = await pngToIco(icon256);
  await writeFile(path.join(PUBLIC_DIR, 'icon.ico'), iconIco);

  console.log('  web: public/icon.png, favicon.*, pwa/icons, icon.ico');
}

async function generateAndroidLaunchers() {
  const foreground = path.join(BRAND_SOURCE, 'android-icon-foreground.png');
  const background = path.join(BRAND_SOURCE, 'android-icon-background.png');
  const icon = path.join(BRAND_SOURCE, 'icon.png');

  for (const [density, sizes] of Object.entries(LAUNCHER_SIZES)) {
    const dir = path.join(ANDROID_RES, `mipmap-${density}`);
    await mkdir(dir, { recursive: true });
    await resizePng(
      foreground,
      path.join(dir, 'ic_launcher_foreground.png'),
      sizes.foreground,
      sizes.foreground,
      'contain',
    );
    await resizePng(
      background,
      path.join(dir, 'ic_launcher_background.png'),
      sizes.foreground,
      sizes.foreground,
      'cover',
    );
    await resizePng(icon, path.join(dir, 'ic_launcher.png'), sizes.launcher, sizes.launcher, 'contain');
    await resizePng(
      icon,
      path.join(dir, 'ic_launcher_round.png'),
      sizes.launcher,
      sizes.launcher,
      'contain',
    );
  }

  const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${ANDROID_LAUNCHER_BG}</color>
</resources>
`;
  await writeFile(path.join(ANDROID_RES, 'values/ic_launcher_background.xml'), bgColorXml);

  const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    await writeFile(path.join(ANDROID_RES, 'mipmap-anydpi-v26', name), adaptiveIcon);
  }

  console.log('  android: mipmap launcher + adaptive icon xml');
}

async function generateSplashScreens() {
  const splashIcon = path.join(BRAND_SOURCE, 'splash-icon.png');

  for (const { dir, width, height } of SPLASH_SCREENS) {
    const outDir = path.join(ANDROID_RES, dir);
    await mkdir(outDir, { recursive: true });
    const iconSize = Math.round(Math.min(width, height) * 0.35);
    const iconBuf = await sharp(splashIcon)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: SPLASH_BG,
      },
    })
      .composite([{ input: iconBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(outDir, 'splash.png'));
  }

  console.log('  android: splash screens');
}

async function main() {
  console.log('Sync brand assets from apps/mobile → apps/pixuli\n');
  await copySources();
  await mkdir(PWA_DIR, { recursive: true });
  await generateWebAssets();
  await generateAndroidLaunchers();
  await generateSplashScreens();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

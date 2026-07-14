import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = 'C:\\Users\\Administrateur\\.gemini\\antigravity-ide\\brain\\c255dd64-26dd-4e73-91d1-3bfdb7f58e25\\chrad_app_icon_1784042545232.png';

const PWA_ICONS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
];

const ANDROID_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

async function generateAssets() {
  try {
    if (!fs.existsSync(SOURCE_IMAGE)) {
      throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
    }

    console.log('Generating PWA icons...');
    for (const icon of PWA_ICONS) {
      const destPath = path.join(__dirname, 'public', 'icons', icon.name);
      await sharp(SOURCE_IMAGE)
        .resize(icon.size, icon.size)
        .toFile(destPath);
      console.log(`Created ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\nGenerating Android icons...');
    // Create a circular mask for round icons
    const makeRoundMask = (size) => Buffer.from(
      `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
    );

    for (const target of ANDROID_SIZES) {
      const folderPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', target.folder);
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Standard icon
      const standardPath = path.join(folderPath, 'ic_launcher.png');
      await sharp(SOURCE_IMAGE)
        .resize(target.size, target.size)
        .toFile(standardPath);

      // Round icon
      const roundPath = path.join(folderPath, 'ic_launcher_round.png');
      await sharp(SOURCE_IMAGE)
        .resize(target.size, target.size)
        .composite([{
          input: makeRoundMask(target.size),
          blend: 'dest-in'
        }])
        .png()
        .toFile(roundPath);

      console.log(`Created icons for ${target.folder} (${target.size}x${target.size})`);
    }

    console.log('\nAll assets generated successfully!');
  } catch (error) {
    console.error('Error generating assets:', error);
  }
}

generateAssets();

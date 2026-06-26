import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = path.join(process.cwd(), 'public', 'logo.png');
const androidResDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

const launcherSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
};

const adaptiveSizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432
};

async function generateIcons() {
    for (const [folder, size] of Object.entries(launcherSizes)) {
        const destDir = path.join(androidResDir, folder);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        // ic_launcher.png
        await sharp(sourceImage)
            .resize(size, size)
            .toFile(path.join(destDir, 'ic_launcher.png'));

        // ic_launcher_round.png
        // (For standard rounded icons, we can just use the same image,
        // Android will handle the rounding if it's an adaptive icon,
        // but for legacy we can add a circle mask if needed.
        // However, most modern launchers use adaptive.)
        await sharp(sourceImage)
            .resize(size, size)
            .toFile(path.join(destDir, 'ic_launcher_round.png'));
    }

    for (const [folder, size] of Object.entries(adaptiveSizes)) {
        const destDir = path.join(androidResDir, folder);

        // ic_launcher_foreground.png
        // Adaptive icons need a transparent border.
        // The safe zone is the center 66dp. 108dp is the total size.
        // So foreground should be scaled to roughly 60-70% of the total size
        // and placed on a transparent 108dp canvas.
        const foregroundSize = Math.round(size * 0.65); // 65% to ensure it fits in the 66dp safe zone circle

        const foreground = await sharp(sourceImage)
            .resize(foregroundSize, foregroundSize)
            .toBuffer();

        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{ input: foreground, gravity: 'center' }])
        .png()
        .toFile(path.join(destDir, 'ic_launcher_foreground.png'));
    }

    // Also update drawable/ic_launcher_foreground.png (legacy/fallback)
    const fallbackSize = 432; // xxxhdpi adaptive size
    const foregroundSize = Math.round(fallbackSize * 0.65);
    const foreground = await sharp(sourceImage)
        .resize(foregroundSize, foregroundSize)
        .toBuffer();

    await sharp({
        create: {
            width: fallbackSize,
            height: fallbackSize,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([{ input: foreground, gravity: 'center' }])
    .png()
    .toFile(path.join(androidResDir, 'drawable', 'ic_launcher_foreground.png'));

    console.log('Icons generated successfully!');
}

generateIcons().catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
});

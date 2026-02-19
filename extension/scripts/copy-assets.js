/**
 * Copy assets to dist folder after build
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const distDir = join(root, 'dist');
const publicDir = join(root, 'public');

// Ensure dist exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
copyFileSync(
  join(publicDir, 'manifest.json'),
  join(distDir, 'manifest.json')
);
console.log('Copied manifest.json');

// Copy background.js
copyFileSync(
  join(publicDir, 'background.js'),
  join(distDir, 'background.js')
);
console.log('Copied background.js');

// Copy content-script.js
copyFileSync(
  join(publicDir, 'content-script.js'),
  join(distDir, 'content-script.js')
);
console.log('Copied content-script.js');

// Copy icons directory
const iconsDir = join(publicDir, 'icons');
const distIconsDir = join(distDir, 'icons');

if (!existsSync(distIconsDir)) {
  mkdirSync(distIconsDir, { recursive: true });
}

if (existsSync(iconsDir)) {
  const iconFiles = readdirSync(iconsDir);
  for (const file of iconFiles) {
    copyFileSync(
      join(iconsDir, file),
      join(distIconsDir, file)
    );
    console.log(`Copied icons/${file}`);
  }
}

console.log('\nBuild complete! Load extension from dist/ folder.');

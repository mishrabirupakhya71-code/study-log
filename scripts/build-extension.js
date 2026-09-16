/**
 * Build script for StudySync Extension
 * 
 * 1. Builds the widget via Vite (library mode)
 * 2. Copies the built widget files into extension/widget/
 * 3. Extension is then ready to load in Chrome/Edge as an unpacked extension
 *
 * Usage:  node scripts/build-extension.js
 */

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pwaDir = join(root, 'pwa');
const extDir = join(root, 'extension');
const distWidget = join(pwaDir, 'dist-widget');
const extWidget = join(extDir, 'widget');

console.log('=== StudySync Extension Build ===\n');

// Step 1: Build the widget
console.log('[1/3] Building widget bundle...');
execSync('npm run build:widget', { cwd: pwaDir, stdio: 'inherit' });

// Step 2: Copy widget files into extension
console.log('\n[2/3] Copying widget bundle to extension/widget/...');
mkdirSync(extWidget, { recursive: true });

// Copy all built assets
if (existsSync(distWidget)) {
  const files = readdirSync(distWidget);
  for (const file of files) {
    cpSync(join(distWidget, file), join(extWidget, file), { recursive: true });
    console.log(`  ✓ ${file}`);
  }
} else {
  console.error('  ✗ dist-widget/ not found — widget build may have failed');
  process.exit(1);
}

// Step 3: Generate placeholder icons if they don't exist
console.log('\n[3/3] Checking icons...');
const iconsDir = join(extDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const iconPath = join(iconsDir, `icon-${size}.png`);
  if (!existsSync(iconPath)) {
    console.log(`  ⚠ icons/icon-${size}.png missing — please add your own icon`);
  } else {
    console.log(`  ✓ icon-${size}.png`);
  }
}

console.log(`
=== Build Complete ===

Next steps:
  1. Add icon PNGs to extension/icons/ (16, 32, 48, 128 px)
  2. Open chrome://extensions (or edge://extensions)
  3. Enable "Developer mode"
  4. Click "Load unpacked" → select the extension/ folder
  5. The StudySync FAB will appear on all web pages
`);

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const requireFile = relativePath => {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) failures.push(`Missing file: ${relativePath}`);
  return absolute;
};

for (const file of [
  'js/i18n.js',
  'js/config.js',
  'js/core.js',
  'js/rsvp-guestbook.js',
  'js/venue-gallery.js'
]) {
  const absolute = requireFile(file);
  if (!fs.existsSync(absolute)) continue;
  try {
    new vm.Script(fs.readFileSync(absolute, 'utf8'), { filename: file });
  } catch (error) {
    failures.push(`JavaScript parse error in ${file}: ${error.message}`);
  }
}

const htmlPath = requireFile('index.html');
const cssPath = requireFile('css/styles.css');

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  for (const id of [
    'prelude', 'experience', 'main-content', 'rsvpForm', 'messageSky',
    'messagePopover', 'galleryStage', 'musicToggle'
  ]) {
    if (!html.includes(`id="${id}"`)) failures.push(`Missing required element id: ${id}`);
  }

  const localReferences = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(value =>
      value &&
      !value.startsWith('http://') &&
      !value.startsWith('https://') &&
      !value.startsWith('#') &&
      !value.startsWith('mailto:') &&
      !value.startsWith('tel:') &&
      !value.startsWith('data:')
    )
    .map(value => value.split(/[?#]/)[0]);

  for (const reference of new Set(localReferences)) {
    if (!fs.existsSync(path.join(root, reference))) {
      failures.push(`Broken local reference in index.html: ${reference}`);
    }
  }
}

if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf8');
  if (css.includes('background-image:url("../assets/moon/custom-moon.png")')) {
    failures.push('Obsolete pseudo-element moon renderer is present.');
  }
  if (!css.includes('.moon-image')) failures.push('Stable moon-image styles are missing.');
  if (!css.includes('.portrait-frame')) failures.push('Portrait-frame styles are missing.');
}

for (const file of [
  'manifest.webmanifest',
  'assets/branding/favicon-32.png',
  'assets/branding/apple-touch-icon.png',
  'assets/branding/icon-192.png',
  'assets/branding/icon-512.png'
]) {
  requireFile(file);
}

if (failures.length) {
  console.error('Project validation failed:\n');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Project validation passed.');

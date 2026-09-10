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
  'js/couple-portraits.js',
  'js/story-images.js',
  'js/wedding-gift.js',
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
    'messagePopover', 'galleryStage', 'musicToggle', 'guestbookSearchForm',
    'guestbookSearchButton', 'discoverWish', 'gift', 'giftCopyStatus', 'paypalQrModal'
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
  if (!css.includes('@media (max-width: 480px) and (max-height: 700px)')) {
    failures.push('Short-screen landing media query is missing.');
  }
  if (!css.includes('html.short-landing-viewport .prelude')) {
    failures.push('Visual Viewport landing fallback styles are missing.');
  }
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


const corePath = requireFile('js/core.js');
const rsvpPath = requireFile('js/rsvp-guestbook.js');
const venuePath = requireFile('js/venue-gallery.js');

if (fs.existsSync(corePath)) {
  const core = fs.readFileSync(corePath, 'utf8');
  if (!core.includes("root.classList.add('is-locked')")) failures.push('Root opening lock is missing.');
  if (!core.includes('startWorldStars')) failures.push('Deferred world-star startup is missing.');
  if (!core.includes("'is-exiting'")) failures.push('Interlude exit-state handling is missing.');
  if (!core.includes("'story-entered'")) failures.push('Mobile one-way story state is missing.');
  if (!core.includes("'story-safe-zone'")) failures.push('Mobile story moon-freeze state is missing.');
  if (!core.includes("mobileNarrativeSafe")) failures.push('Mobile narrative safe mode is missing.');
  if (!core.includes("let mobile = matchMedia('(max-width: 800px)').matches;")) {
    failures.push('createStars mobile scope safeguard is missing.');
  }
  if (!core.includes('syncShortLandingViewport')) {
    failures.push('Short iPhone landing Visual Viewport safeguard is missing.');
  }
  if (core.includes("const mobile = matchMedia('(max-width: 800px)').matches;\n            const dpr")) {
    failures.push('createStars mobile variable is incorrectly scoped inside resize().');
  }
}
if (fs.existsSync(rsvpPath)) {
  const rsvp = fs.readFileSync(rsvpPath, 'utf8');
  if (!rsvp.includes('activeGuestbookRequestId')) failures.push('Guestbook stale-response protection is missing.');
  if (!rsvp.includes('guestbookActivated')) failures.push('Lazy Guestbook activation is missing.');
  if (!rsvp.includes('mobileGuestbook ? 12 : 24')) failures.push('Mobile Guestbook page-size safeguard is missing.');
}
if (fs.existsSync(venuePath)) {
  const venue = fs.readFileSync(venuePath, 'utf8');
  if (!venue.includes('AbortController')) failures.push('Guestbook request cancellation is missing.');
  if (venue.includes("loadSharedGuestbook(1, 24, '', 0);")) {
    failures.push('Eager Guestbook startup request is present.');
  }
  if (!venue.includes('is-gallery-parked')) failures.push('Mobile Gallery-to-RSVP parking is missing.');
}


const giftPath = requireFile('js/wedding-gift.js');
if (fs.existsSync(giftPath)) {
  const gift = fs.readFileSync(giftPath, 'utf8');
  if (!gift.includes('weddingGift')) failures.push('Wedding Gift configuration binding is missing.');
  if (!gift.includes('navigator.clipboard')) failures.push('Wedding Gift copy behavior is missing.');
  if (!gift.includes('giftActivated')) failures.push('Lazy Wedding Gift activation is missing.');
}

const configPath = requireFile('js/config.js');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  if (!config.includes('weddingGift')) failures.push('Wedding Gift configuration block is missing.');
}


const couplePath = requireFile('js/couple-portraits.js');
if (fs.existsSync(couplePath)) {
  const couple = fs.readFileSync(couplePath, 'utf8');
  if (!couple.includes('data-couple-carousel')) failures.push('Couple portrait carousel binding is missing.');
  if (!couple.includes('pointerdown')) failures.push('Couple portrait swipe support is missing.');
  if (!couple.includes("event.key === 'ArrowLeft'")) failures.push('Couple portrait keyboard navigation is missing.');
}

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('data-couple-carousel="nicky"')) failures.push('Nicky portrait carousel markup is missing.');
  if (!html.includes('data-couple-carousel="gina"')) failures.push('Gina portrait carousel markup is missing.');
}

if (failures.length) {
  console.error('Project validation failed:\n');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Project validation passed.');

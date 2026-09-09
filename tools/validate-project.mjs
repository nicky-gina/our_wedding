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
}
if (fs.existsSync(rsvpPath)) {
  const rsvp = fs.readFileSync(rsvpPath, 'utf8');
  if (!rsvp.includes('activeGuestbookRequestId')) failures.push('Guestbook stale-response protection is missing.');
}
if (fs.existsSync(venuePath)) {
  const venue = fs.readFileSync(venuePath, 'utf8');
  if (!venue.includes('AbortController')) failures.push('Guestbook request cancellation is missing.');
}


const giftPath = requireFile('js/wedding-gift.js');
if (fs.existsSync(giftPath)) {
  const gift = fs.readFileSync(giftPath, 'utf8');
  if (!gift.includes('weddingGift')) failures.push('Wedding Gift configuration binding is missing.');
  if (!gift.includes('navigator.clipboard')) failures.push('Wedding Gift copy behavior is missing.');
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


const venueGalleryPath = requireFile('js/venue-gallery.js');
const couplePortraitsPath = requireFile('js/couple-portraits.js');

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('<iframe allowfullscreen="" class="venue-map-embed" loading="lazy"')) {
    failures.push('Stable lazy Google Maps iframe is missing.');
  }
  if (html.includes('id="loadVenueMap"')) {
    failures.push('Manual Google Maps load control should not be present.');
  }
  if (html.includes('id="imageLightbox"') || html.includes('js/image-lightbox.js')) {
    failures.push('Full-size image lightbox should not be present in V4.2.4.');
  }
  if (html.includes('is-enlargeable')) {
    failures.push('Photo elements should not be marked enlargeable.');
  }
}

if (fs.existsSync(venueGalleryPath)) {
  const venueGallery = fs.readFileSync(venueGalleryPath, 'utf8');
  if (venueGallery.includes('loadVenueMap') || venueGallery.includes('unloadVenueMap')) {
    failures.push('Dynamic Google Maps create/destroy lifecycle is still present.');
  }
  if (!venueGallery.includes('item.preview || item.thumbnail')) {
    failures.push('Gallery WebP preview browsing strategy is missing.');
  }
  if (!venueGallery.includes("mobileGallery ? '80px 0px' : '450px 0px'")) {
    failures.push('Mobile gallery activation margin safeguard is missing.');
  }
  if (venueGallery.includes('editorial:open-image') || venueGallery.includes('item.image')) {
    failures.push('Gallery full-size image behavior should be disabled.');
  }
}

if (fs.existsSync(couplePortraitsPath)) {
  const couple = fs.readFileSync(couplePortraitsPath, 'utf8');
  if (couple.includes('Promise.all(candidates.map(loadImage))')) {
    failures.push('Eager six-portrait probing regression detected.');
  }
  if (!couple.includes('releaseExcept')) {
    failures.push('Mobile portrait decoded-resource release logic is missing.');
  }
  if (couple.includes('fullImages') || couple.includes('fullSrc') || couple.includes('editorial:open-image')) {
    failures.push('Portrait full-size image behavior should be disabled.');
  }
  if (!couple.includes("event.pointerType === 'mouse'")) {
    failures.push('Desktop mouse pointer-capture exclusion is missing.');
  }
  if (!couple.includes("event.target.closest('button')")) {
    failures.push('Portrait control pointer exclusion is missing.');
  }
}

if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  if (!config.includes('assets/gallery/previews/gallery-01.webp')) {
    failures.push('Gallery preview configuration is missing.');
  }
  if (config.includes('fullImages:') || config.includes('assets/gallery/full/')) {
    failures.push('Runtime config should not reference full-size photo originals.');
  }
}

for (let i = 1; i <= 12; i += 1) {
  requireFile(`assets/gallery/previews/gallery-${String(i).padStart(2, '0')}.webp`);
}

if (failures.length) {
  console.error('Project validation failed:\n');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Project validation passed.');

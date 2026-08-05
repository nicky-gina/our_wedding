# Code structure — V4.0

## Runtime files

- `index.html` — semantic invitation markup and production metadata.
- `css/styles.css` — visual system, responsive rules and animation definitions.
- `js/i18n.js` — translations and language switching.
- `js/config.js` — editable settings, service endpoint and gallery data.
- `js/core.js` — opening sequence, music, celestial world, chapters, reveals and scroll motion.
- `js/rsvp-guestbook.js` — personalization, countdown, RSVP and guestbook interface.
- `js/venue-gallery.js` — venue integration, shared-data requests and gallery behavior.
- `backend/Code.gs` — Google Apps Script backend.
- `manifest.webmanifest` — installable web-app metadata.
- `tools/validate-project.mjs` — dependency-free static regression validator.

## Editing rules

1. Keep wedding values, URLs and gallery data in `js/config.js`.
2. Keep translations in `js/i18n.js`.
3. Add behavior to the relevant runtime module rather than recreating a monolithic script.
4. Preserve the script order in `index.html`.
5. Keep the moon as a real transparent image; do not restore a filtered CSS pseudo-element renderer.
6. Run `npm run validate` before publishing.

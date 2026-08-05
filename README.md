# Editorial Invitation V3.13 — Tiered Typography Finish

A cinematic, celestial, editorial-style digital wedding invitation for **Nicky & Gina**.

**Current release:** V3.13  
**Production date:** 11 October 2026, 19:00 WIB  
**Venue:** MDC Hall Jakarta

This README is the single consolidated source for project setup, configuration, deployment notes, feature documentation, and the complete version history. Separate version changelog files were removed after consolidation.

---

## Current feature set

- Personalized invitation links with guest-name and permanent invitation-ID parameters
- English, Bahasa Indonesia, and Simplified Chinese interface
- Remembered language preference and browser-language detection on first visit
- Cinematic landing page with music controls and stable transparent moon rendering
- Groom and bride profile chapters with bilingual parent information
- Animated relationship timeline, chapter progress, and cinematic interludes
- Twelve-photo editorial gallery with swipe momentum and progressive loading
- Google Maps venue directions
- RSVP submission, retrieval, editing, and cross-device updates through Google Apps Script
- Scalable guestbook with pagination, search, random discovery, animated stars, and accessible wish dialogs
- Real Google Sheets wishes only; no built-in sample messages
- Reduced-motion, keyboard, focus, live-region, and screen-reader support
- Mobile performance safeguards for canvas, blur, parallax, and background-tab activity
- Tiered ivory and champagne-gold typography treatment

---

## Project structure

```text
.
├── index.html
├── README.md
├── CODE_STRUCTURE.md
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   └── i18n.js
├── backend/
│   └── Code.gs
└── assets/
    ├── branding/
    ├── gallery/
    │   ├── full/
    │   ├── thumbs/
    │   └── manifest.json
    ├── moon/
    ├── portraits/
    │   └── originals/
    ├── story/
    │   └── originals/
    ├── couple.png
    ├── hero.jpg
    └── music.m4a
```

`CODE_STRUCTURE.md` contains a compact source-layout reference.

---

## Run locally

Open `index.html` directly, or serve the directory locally:

```bash
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

Serving through HTTP is recommended because browser security rules can restrict requests and media behavior when opening the HTML through a local `file://` path.

---

## Main configuration

Edit `js/config.js` to change deployment-specific settings:

- `weddingDate`
- `rsvpDeadline`
- `googleAppsScriptUrl`
- `enableSharedGuestbook`
- `closeRsvpAfterDeadline`
- `invitationPrefix`
- `mapUrl`
- `galleryItems`

### Gallery assets

The production gallery uses:

```text
assets/gallery/full/gallery-01.jpg ... gallery-12.jpg
assets/gallery/thumbs/gallery-01.webp ... gallery-12.webp
```

Editorial locations, captions, and accessibility text are defined in `js/config.js`. The corresponding metadata manifest is stored at `assets/gallery/manifest.json`.

### Venue directions

The **Open directions** control uses the `mapUrl` value in `js/config.js`. Replace it with a precise Google Maps directions or share URL when needed.

---

## Personalized invitation links

Use the `guest` and `id` query parameters:

```text
https://nicky-gina.github.io/our_wedding/?guest=John%20Doe&id=NG-2026-001
```

- `guest` controls the personalized prologue greeting and prefilled RSVP name.
- `id` is the permanent identifier used to retrieve and update the guest's RSVP.
- The invitation ID should remain stable even when the guest spreadsheet is sorted or reorganized.

Example Google Sheets formula when the guest name is in `A2` and the permanent invitation ID is in `B2`:

```excel
=IF(A2="","","https://nicky-gina.github.io/our_wedding/?guest="&ENCODEURL(TRIM(A2))&"&id="&B2)
```

---

## Google Sheets RSVP and guestbook backend

The backend is implemented in `backend/Code.gs`.

### Expected `Responses` columns

The setup function creates or verifies these headers:

| Column | Header |
|---|---|
| A | Invitation ID |
| B | Guest Name |
| C | Attendance |
| D | Guest Count |
| E | Message |
| F | RSVP Time |
| G | Language |
| H | Device |
| I | Page URL |
| J | Server Updated At |

### Initial setup

1. Create or open the Google Sheet that will store RSVP responses.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with `backend/Code.gs`.
4. Save the project.
5. Run `setupResponsesSheet()` once and approve the requested permissions.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to yourself.
8. Set **Who has access** to **Anyone**.
9. Deploy and copy the URL ending in `/exec`.
10. Paste that URL into `googleAppsScriptUrl` in `js/config.js`.

### Updating an existing deployment

When `backend/Code.gs` changes:

1. Save the Apps Script project.
2. Open **Deploy → Manage deployments**.
3. Edit the existing Web App deployment.
4. Select **New version**.
5. Deploy again.

The existing `/exec` URL normally remains unchanged.

### Backend behavior

- New invitation IDs append a response row.
- Existing invitation IDs update their matching row.
- Returning guests can retrieve their RSVP using the invitation ID.
- Guestbook messages are paginated and searchable.
- Random wish discovery reads from real sheet messages.
- Rows without a message do not appear as guestbook wishes.

---

## Languages and accessibility

Supported languages:

- English
- Bahasa Indonesia
- Simplified Chinese

The language selector updates the document language, static and dynamic copy, RSVP states, guestbook controls, gallery metadata, and chapter labels. The selected language is remembered in local storage.

Accessibility support includes:

- Skip navigation
- Visible keyboard focus states
- Semantic landmarks and dialogs
- Live announcements for dynamic status changes
- Keyboard-operable gallery and guestbook controls
- Focus management and Escape-to-close behavior
- `prefers-reduced-motion` fallbacks
- High-contrast fallback for decorative typography strokes

The bilingual parent-information lines intentionally remain English and Chinese in all interface languages.

---

## Production safeguards

These fixes are part of the current baseline and should be preserved during future work:

- The moon is a real transparent image, not a filtered pseudo-element.
- No drop-shadow/filter is applied to the moon image layer.
- The moon scroll motion uses a continuous sine-wave loop and does not reset at chapter boundaries.
- Groom and bride portraits retain their subtle double editorial borders.
- Mobile canvas resolution and star density are reduced.
- The opening canvas is stopped and removed after entry.
- Background animations pause while the page is hidden.
- Heavy blur-based reveals and multi-layer mobile parallax remain disabled.
- Guestbook data contains real sheet wishes only.

---

# Consolidated version history

## Iteration 4 foundation

- Introduced the cinematic editorial gallery and config-driven image replacement.
- Added the dedicated venue chapter and Google Maps directions.
- Added RSVP deadline messaging, attendance-aware guest counts, and selected-state refinements.
- Added the initial Google Apps Script RSVP and shared guestbook integration.
- Added mobile gallery and venue layouts and subtle photo movement.

### Iteration 4.3 — Mobile viewport corrections

- Constrained the landing page to the actual mobile viewport.
- Rebuilt the couple-name lockup as a responsive three-part grid.
- Added safe-area-aware padding and width limits for the quote, date, moon, and entry control.
- Added document-level horizontal-overflow protection.

### Iteration 4.4 — Mobile gallery and RSVP corrections

- Reworked the mobile gallery into a compact exhibition layout.
- Corrected mobile RSVP spacing, form width, radio alignment, field sizing, and fixed-header clearance.
- Moved gallery arrows inside the featured image.
- Added viewport-safe gallery sizing, swipe/drag, keyboard navigation, a photo counter, crossfade, scale transitions, and automatic thumbnail centering.

### Iteration 4.5 — Gallery initialization fixes

- Removed the thumbnail `scrollIntoView()` behavior that could move the document during initialization.
- Limited active-thumbnail centering to the filmstrip and only after user navigation.
- Disabled browser scroll restoration while the cover was active.
- Reset entry to the prologue and top-aligned the gallery on mobile.
- Refined fixed-header clearance and gallery headline spacing.

### Iteration 4.6 — Branding alignment

- Added the decor-aligned top-left N&G logo.
- Updated the landing-page script lockup to better match the wedding décor artwork.

### Iteration 4.8 — Landing composition and custom moon

- Lowered the mobile landing composition to prevent text from overlapping the moon.
- Rebalanced compact-phone spacing without reducing title prominence.
- Replaced the invitation moon with the uploaded custom moon image on the cover and ambient world.

### Iteration 4.9 — Source cleanup

- Reformatted HTML, CSS, JavaScript, Google Apps Script, and gallery JSON.
- Preserved asset paths, IDs, classes, functionality, and load order.

### Iteration 4.11 — Consolidated source

- Consolidated all styles into `css/styles.css`.
- Consolidated all application logic into `js/app.js`.
- Kept `js/config.js` separate for content and deployment settings.
- Removed obsolete iteration-specific source files without intentionally changing behavior.

## V3.0 — Mobile RSVP and scalable wishes

- Added explicit safe-area gutters for RSVP and Wishes.
- Limited the visible guestbook to 24 stars per page.
- Added server-side wish pagination, newest-first ordering, total-count metadata, and Newer/Older navigation.

## V3.2 — Final portrait assets

- Added optimized bride and groom WebP portraits.
- Retained original PNG files under `assets/portraits/originals/`.

## V3.3 — Story photographs

- Added optimized photos for the three relationship milestones.
- Retained originals under `assets/story/originals/`.

## V3.4–V3.5 — Background music controls

- Started music after the guest entered the invitation.
- Added pause/resume controls and remembered preference.
- Paused playback when the page was hidden and resumed only when previously enabled.

## V3.6.1 — Personalized guest links

- Added personalized prologue greetings through the `guest` URL parameter.
- Prefilled the RSVP name from the personalized link.
- Added a stable invitation-ID parameter for future retrieval and updates.

## V3.6.2 — Bilingual parent information

- Added editable English and Simplified Chinese parent-information blocks to the groom and bride profile pages.

## V3.7 — Accessibility and multilingual support

- Added English, Bahasa Indonesia, and Simplified Chinese.
- Added first-visit browser-language detection and remembered manual preference.
- Translated personalized greetings, RSVP feedback, deadlines, guestbook pagination, gallery captions, chapter names, and dynamic states.
- Added skip navigation, visible focus states, live regions, and improved dialog/form semantics.
- Preserved the bilingual profile-parent blocks in every interface language.

## V3.8 — Visual polish

- Improved readability against bright moon and sky areas with localized overlays, refined colors, and subtle shadows.
- Refined optical sizing, kerning, ligatures, heading balance, paragraph rhythm, and tabular date numerals.
- Added cinematic section reveals, image masking, staggered timing, scene lighting, and subtle celestial depth.
- Added reduced-motion safeguards.

## V3.8.1 — Moon stability fix

- Replaced the filtered pseudo-element moon with a real transparent image.
- Added high-priority moon preloading.
- Disabled legacy pseudo-element moon rendering and filters.
- Fixed the occasional pale opaque rectangle seen during first load.

## V3.8.2 — Couple profile layout fix

- Reduced the mobile gap between parent information and portraits.
- Restored subtle double silver-blue frames around both portraits.
- Improved parent-information readability near the moon.

## V3.8.3 — Mobile stability fix

- Reduced canvas resolution and star density on mobile.
- Stopped and removed the opening canvas after entry.
- Paused canvas animation while the page was hidden.
- Removed large filtered surfaces and disabled expensive mobile blur reveals.
- Separated moon float and scroll-depth transforms to address renderer crashes and motion conflicts.

## V3.8.4 — Moon scroll parallax fix

- Restored lightweight moon scroll movement on mobile through `--moon-scroll-y`.
- Kept heavier cloud, mist, and glow parallax disabled on mobile.
- Preserved the independent floating animation and reduced-motion behavior.

## V3.8.5 — Smooth moon scroll loop

- Replaced viewport-modulo movement with a continuous sine-wave loop.
- Removed chapter-boundary position jumps.
- Set one down-and-up movement cycle to approximately two viewport heights.

## V3.9 — Storytelling enhancements

- Added animated milestone timeline lines and markers.
- Added chapter count and progress to the existing indicator.
- Added a compact mobile chapter-progress control.
- Added four multilingual narrative interludes.
- Preserved the established moon, portrait, and mobile-stability fixes.

## V3.9.1 — Cinematic interludes

- Added four reveal variants: celestial curtain, timeline opening, upward light reveal, and invitation-page opening.
- Added visible-state opening and leaving-state soft closure/fade.
- Limited animation to transform and opacity.
- Reduced travel distance on mobile and added reduced-motion fallbacks.

## V3.10 — Gallery experience

- Added velocity-aware swipe momentum, drag resistance, and snap-back.
- Limited full-resolution preloading to the current and adjacent images.
- Added progressive thumbnail loading.
- Added a lightweight cinematic gallery curtain opening.
- Preserved RSVP, guestbook, Maps, music, personalization, multilingual behavior, moon markup, and portrait styles.

## V3.10.1 — Gallery/interlude correction

- Moved the interlude divider above narrative copy so it no longer intersected multiline text on mobile.
- Added tablet and narrow-phone offsets while preserving gallery and interlude behavior.

## V3.10.2 — Personalized greeting fix

- Prevented the initial translation pass from replacing `Dear <guest name>, ...` with the generic greeting.
- Preserved multilingual greeting updates and RSVP-name prefill.

## V3.11 — RSVP enhancements

- Added a cinematic translated success state with a saved-response summary.
- Added RSVP lookup by invitation ID for returning guests.
- Added edit, update, and cancel-editing actions.
- Updated existing Google Sheets rows instead of creating duplicates for the same invitation ID.
- Required deploying `backend/Code.gs` as a new Apps Script version.

## V3.12 — Guestbook enhancements

- Added animated star arrival for new wishes.
- Rebuilt the accessible wish dialog with backdrop, focus management, and Escape-to-close behavior.
- Added server-side search by name or message.
- Added random wish discovery from the main guestbook and dialog.
- Added multilingual copy and reduced-motion fallbacks.
- Required deploying the included backend as a new Apps Script version.

## V3.12.1 — Premium wish-card redesign

- Rebuilt the wish popup as a premium celestial invitation card.
- Added warm double framing, ornamental corner details, a celestial emblem, refined hierarchy, and a decorative divider.
- Replaced the oversized discovery action with a compact pill button.
- Improved mobile readability and added internal scrolling for long wishes or short screens.
- Preserved dialog semantics, translations, reduced motion, and existing application behavior.

## V3.12.2 — Wish-button readability and loading feedback

- Forced the discovery button text and icon to ivory in every state.
- Prevented loading/disabled opacity from reducing legibility.
- Added a lightweight celestial spinner, translated loading labels, click protection, and `aria-busy`.
- Required no backend redeployment.

## V3.12.3 — Real wishes only

- Removed all hard-coded/template wishes.
- Limited guestbook stars, search, and random discovery to real Google Sheets messages and a just-submitted local RSVP while data refreshes.
- Kept the multilingual empty state when no real messages are available.
- Required no backend redeployment.

## V3.13 — Tiered typography finish

- Retained ivory fill while adding a hairline champagne-gold edge and warm shadow to major display headings.
- Added a softer gold lift to dates, profile quotes, milestone values, venue values, gallery captions, RSVP summary values, and editorial metadata.
- Kept body paragraphs, parent information, forms, buttons, wishes, and long-form copy clean for readability.
- Applied a finer treatment to Simplified Chinese and a lighter treatment on mobile.
- Added a high-contrast fallback that removes decorative strokes.
- Added no JavaScript, filters, canvases, scroll handlers, or backend changes.

---

## Future milestone

The next planned release is **V4.0 — Final Code Polish and production hardening**, including structural cleanup, removal of dead or duplicated code, final regression testing, and deployment documentation review.

# Editorial Invitation V3 — Iteration 4.3

A working cinematic celestial invitation for Nicky & Gina.

Canonical base: Editorial Invitation V3 Iteration 4.5.

## Added in Iteration 4

- Cinematic editorial gallery with six independently composed photo moments
- Config-driven gallery image replacement
- Dedicated venue chapter with celestial map treatment and directions link
- RSVP deadline messaging and optional automatic closure
- Attendance-aware guest-count behaviour
- Selected-state refinement for RSVP choices
- Optional shared guestbook loading from Google Apps Script
- Reference Google Apps Script backend supporting POST, edits and guestbook GET
- Mobile gallery and venue layouts
- Subtle scroll-linked photographic movement

## Run

Open `index.html`, or serve the folder:

```bash
python -m http.server 8080
```

## Add gallery photographs

Copy six optimised JPG/WebP files into `assets/images/gallery/`, then edit `js/config.js`:

```js
galleryImages: {
  gallery1: 'assets/images/gallery/gallery-01.jpg',
  gallery2: 'assets/images/gallery/gallery-02.jpg'
  // ...
}
```

Recommended: 1600–2200 px on the longest edge, under roughly 500 KB each when possible.

## Google Maps venue directions

The **Open directions** button is enabled and points to Google Maps directions for **MDC Hall Jakarta**. The URL is stored in `js/config.js` as `mapUrl`, so it can be replaced with a more precise Google Maps share link later without editing the HTML.

## Google Sheets RSVP and shared guestbook

The production integration is included and enabled. One account-specific deployment step remains:

1. Create or open the Google Sheet that will hold the RSVP responses.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with `backend/Code.gs`.
4. Save, select `setupResponsesSheet`, and click **Run** once. Approve the requested spreadsheet permission.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as** to yourself and **Who has access** to **Anyone**.
7. Deploy and copy the URL ending in `/exec`.
8. Paste that URL into `googleAppsScriptUrl` in `js/config.js`.

`enableSharedGuestbook` is already set to `true`. Once the `/exec` URL is inserted, RSVP submissions are written to the `Responses` sheet, repeated submissions with the same invitation ID update the existing row, and public guestbook messages are loaded from the sheet.

Before the URL is inserted, the invitation safely keeps RSVP responses in the guest's browser so the interface remains testable.

## Personalised link

```text
index.html?guest=John%20Doe&id=NG-001
```

## Next priorities

- Insert final couple and gallery photographs
- Replace generated ambient sound with mastered music
- Add final photo transitions and image preloading
- Refine the shared guestbook reconciliation
- Comprehensive mobile performance and accessibility pass


## Iteration 4.4 corrections
- Reworked the mobile gallery into a compact two-column exhibition so it no longer creates an unexplained long blank scroll while photographs are placeholders.
- Corrected mobile RSVP spacing, headline scale, form width, radio-choice alignment, field sizing, and safe spacing beneath the fixed header.


## Iteration 4.3 correction
- Constrained the cinematic landing page to the actual mobile viewport.
- Rebuilt the couple-name lockup as a responsive three-part grid so it remains centred without creating horizontal overflow.
- Added safe-area-aware padding and width limits for the opening quote, date, moon, and entry control.
- Added document-level horizontal overflow protection.


## Iteration 4.4 corrections
- Moved both gallery navigation arrows inside the featured image so they cannot be clipped on narrow mobile screens.
- Added strict viewport-safe sizing to the gallery chapter.
- Added swipe/drag and keyboard navigation.
- Added a compact in-image photo counter.
- Added cinematic crossfade and subtle scale transitions between gallery photos.
- Preserved the horizontal thumbnail photo-roll with automatic active-thumbnail centring.


## Iteration 4.5 corrections
- Removed the gallery thumbnail `scrollIntoView()` call that could move the entire document to the gallery during page initialisation.
- The active thumbnail is now centred by scrolling only the filmstrip container and only after user navigation.
- Disabled browser scroll restoration while the cinematic cover is active and reset the invitation to the prologue when entering.
- Changed the gallery scene from vertically centred to top-aligned on mobile.
- Added fixed-header clearance and refined the gallery headline scale and spacing to prevent overlap.


## Iteration 4.6
- Added decor-aligned top-left logo using the uploaded wedding decor reference.
- Updated the landing-page “Nicky & Gina” lockup to use a script font closer to the decor artwork.
- Preserved the 4.5 interaction and layout fixes as the base.


## Iteration 4.8
- Lowered the complete mobile landing-page text composition so “The Wedding Of” and the script names no longer overlap the moon.
- Preserved the script size and visual prominence instead of shrinking the title.
- Rebalanced compact-phone spacing around the title, quote, date, and entry control.


## Iteration 4.8
- Replaced the invitation moon with the uploaded custom moon PNG on both the landing page and the ambient in-experience world.
- Preserved the 4.7 canonical branding and layout base.

## Iteration 4.9 — Source-code cleanup

- Reformatted HTML with consistent nesting and indentation.
- Expanded compressed CSS into readable selectors and one declaration per line.
- Reformatted JavaScript and Google Apps Script using a syntax-aware printer.
- Reformatted the gallery manifest JSON.
- Kept file names, asset paths, DOM IDs, classes, functionality, and load order unchanged.



## Iteration 4.11 — consolidated source
- Combined all invitation styles into `css/styles.css` in the same cascade order used previously.
- Combined all application logic into `js/app.js` in the same execution order used previously.
- Kept `js/config.js` separate for deployment and content settings.
- Removed historical `iteration-3` and `iteration-4` CSS/JS files.
- No selectors, IDs, function bodies, event registration order, or feature behaviour were intentionally changed.


## Curated gallery

The production gallery contains 12 optimised full images in `assets/gallery/full/`, matching WebP thumbnails in `assets/gallery/thumbs/`, and editorial metadata in `js/config.js` and `assets/gallery/manifest.json`.


## V3 mobile RSVP and scalable wishes update

- RSVP and Wishes now use explicit mobile safe-area gutters rather than relying only on the global scene padding.
- The public guestbook renders no more than 24 stars at once.
- Google Apps Script serves wishes in pages, newest first, with total-count metadata.
- Newer/Older controls let guests browse a large archive without downloading or positioning hundreds of stars simultaneously.
- After replacing `backend/Code.gs`, redeploy the Apps Script web app as a **new version** so pagination becomes active.

### V3.2 portrait assets

The final bride and groom portraits are stored in `assets/portraits/` as web-optimised WebP files. Their original PNG files are retained under `assets/portraits/originals/`.
## V3.3 story photographs

The three story milestones now use optimized images from `assets/story/`. Original uploads are retained in `assets/story/originals/`.

## Background music controls

- Background music begins after the guest enters the invitation.
- The top-right music control can pause or resume playback.
- The guest's choice is remembered in local storage.
- Playback pauses while the browser tab is hidden and resumes only when music was enabled before leaving.


## Bilingual parent information
The groom and bride pages include editable English and Simplified Chinese parent-information placeholders. Replace the bracketed names directly in `index.html`.


## V3.7 — Accessibility & Multilingual Support
- Added English, Bahasa Indonesia, and Simplified Chinese language switching.
- Automatically detects the browser language on first visit and remembers the guest's choice.
- Translates static content, personalized greetings, RSVP states, guestbook controls, chapter names, and gallery captions.
- Preserves the bilingual English/Chinese parent-information blocks on both profile pages.
- Added a skip link, stronger keyboard focus states, live announcements, improved landmarks, and additional ARIA semantics.
- Respects the existing reduced-motion behavior.


## V3.8 Visual Polish
See `V3.8_CHANGELOG.md` for the readability, typography, transition, and depth updates.


## V3.8.1 moon stability patch
- Replaced the pseudo-element moon renderer with a real transparent PNG image.
- Removed GPU `drop-shadow()` filters from the moon image layer.
- Added high-priority moon preloading for the landing screen.
- Preserved all V3.8 multilingual, accessibility, typography, transition and depth improvements.

## V3.8.2
This patch tightens the stacked groom/bride profile layout, restores the portrait framing, and improves parent-information readability near the moon. See `V3.8.2_CHANGELOG.md`.


## V3.8.3 mobile stability patch
- Prevents mobile renderer crashes caused by excessive simultaneous GPU layers.
- Stops the opening star canvas after entry and pauses canvas work in background tabs.
- Reduces mobile canvas resolution and star count.
- Disables expensive blur reveals and scroll depth on mobile.
- Separates moon floating animation from desktop scroll parallax for smoother motion.


## V3.8.5
Moon scroll parallax now follows a continuous sine-wave loop, eliminating chapter-boundary jumps.


## V3.9
Adds animated milestone timelines, chapter progress, and multilingual scroll narrative interludes. See `V3.9_CHANGELOG.md`.


## V3.9.1
Cinematic transform-and-opacity interludes were added between major story acts.


## V3.10 — Gallery Experience
- Velocity-aware swipe momentum and elastic drag feedback.
- Progressive thumbnail loading and current/adjacent full-image preloading.
- Lightweight cinematic gallery opening with reduced-motion fallback.


## V3.10.2 — Personalized Greeting Fix
- Prevents the initial multilingual translation pass from replacing the personalized prologue greeting with the generic greeting.
- Personalized greetings still update when the language is changed.


## V3.11 RSVP enhancements
Returning guests can retrieve and update an RSVP using the invitation ID in their personal link. Redeploy `backend/Code.gs` after updating the Apps Script project.

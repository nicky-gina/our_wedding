/* =========================================================
 * VENUE & GALLERY
 * Runtime module: venue-gallery.js
 * ========================================================= */

(() => {
    'use strict';
    const config = window.EDITORIAL_INVITE_CONFIG || {};
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const t = (key, vars) => window.inviteI18n?.t(key, vars) || key;
    if (config.mapUrl)
        $('#mapLink').href = config.mapUrl;
    // RSVP adapts to attendance and deadline.
    const form = $('#rsvpForm');
    const count = $('#guestCount');
    const note = $('#deadlineNote');
    const attendance = $$('input[name="attendance"]');
    function syncAttendance() {
        attendance.forEach(radio => radio.closest('.choice').classList.toggle('is-selected', radio.checked));
        const unable = attendance.find(r => r.checked)?.value === 'Not attending';
        count.disabled = unable;
        if (unable)
            count.value = '1';
    }
    attendance.forEach(r => r.addEventListener('change', syncAttendance));
    syncAttendance();
    const deadline = new Date(config.rsvpDeadline || '2026-09-20T23:59:59+07:00');
    if (Date.now() > deadline.getTime()) {
        note.textContent = t('rsvp.deadlinePassed');
        if (config.closeRsvpAfterDeadline) {
            form.classList.add('is-closed');
            $$('input,select,textarea,button', form).forEach(el => el.disabled = true);
        }
    }
    else {
        const locale = window.inviteI18n?.language === 'zh-CN' ? 'zh-CN' : window.inviteI18n?.language === 'id' ? 'id-ID' : 'en-GB';
        note.textContent = t('rsvp.deadline', { date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(deadline) });
    }
    window.addEventListener('editorial:language-changed', () => {
        if (Date.now() > deadline.getTime()) note.textContent = t('rsvp.deadlinePassed');
        else {
            const locale = window.inviteI18n?.language === 'zh-CN' ? 'zh-CN' : window.inviteI18n?.language === 'id' ? 'id-ID' : 'en-GB';
            note.textContent = t('rsvp.deadline', { date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(deadline) });
        }
    });
    // Paginated shared guestbook endpoint. Only one small page is rendered at a time.
    let guestbookAbortController = null;

    async function loadSharedGuestbook(page = 1, pageSize = 24, search = '', requestId = 0) {
        if (!config.googleAppsScriptUrl || !config.enableSharedGuestbook)
            return;

        if (guestbookAbortController)
            guestbookAbortController.abort();

        const controller = new AbortController();
        guestbookAbortController = controller;

        try {
            const separator = config.googleAppsScriptUrl.includes('?') ? '&' : '?';
            const searchPart = search ? `&search=${encodeURIComponent(search)}` : '';
            const url = `${config.googleAppsScriptUrl}${separator}action=guestbook&page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}${searchPart}`;
            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            if (!response.ok)
                throw new Error(`Guestbook request failed with ${response.status}.`);
            const json = await response.json();
            const payload = Array.isArray(json)
                ? { messages: json, page: 1, pageSize, total: json.length, totalPages: 1 }
                : json;
            if (!Array.isArray(payload.messages))
                throw new Error('Guestbook response did not include messages.');
            // Keep the startup cache unfiltered. Search result pages should not
            // replace the normal first-page cache used on the next visit.
            if (!search) localStorage.setItem('editorial-v3-guestbook-page', JSON.stringify(payload));
            window.dispatchEvent(new CustomEvent('editorial:shared-messages', {
                detail: { ...payload, requestId }
            }));
        }
        catch (error) {
            if (error?.name === 'AbortError')
                return;

            console.info('Shared guestbook unavailable; using cached or local wishes.', error);
            window.dispatchEvent(new CustomEvent('editorial:guestbook-load-failed', {
                detail: { requestId }
            }));
        }
        finally {
            if (guestbookAbortController === controller)
                guestbookAbortController = null;
        }
    }
    window.addEventListener('editorial:guestbook-page-request', event => {
        const detail = event.detail || {};
        loadSharedGuestbook(
            Number(detail.page) || 1,
            Number(detail.pageSize) || 24,
            String(detail.search || ''),
            Number(detail.requestId) || 0
        );
    });
    loadSharedGuestbook(1, 24, '', 0);
    // Slow photographic parallax, disabled for reduced motion.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(max-width: 800px)').matches) {
        let ticking = false;
        const update = () => {
            $$('.gallery-piece').forEach(piece => {
                const rect = piece.getBoundingClientRect();
                const offset = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
                $('.gallery-image', piece).style.transform = `translate3d(0,${Math.max(-18, Math.min(18, -offset * 18))}px,0) scale(1.015)`;
            });
            ticking = false;
        };
        addEventListener('scroll', () => { if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        } }, { passive: true });
        update();
    }
})();
document.addEventListener('DOMContentLoaded', () => {
    const config = window.EDITORIAL_INVITE_CONFIG || {};
    const items = Array.isArray(config.galleryItems) ? config.galleryItems : [];
    const gallerySection = document.getElementById('gallery');
    const viewer = gallerySection?.querySelector('.gallery-viewer');
    const main = document.getElementById('galleryMain');
    const stage = document.getElementById('galleryStage');
    const current = document.getElementById('galleryCurrent');
    const total = document.getElementById('galleryTotal');
    const location = document.getElementById('galleryLocation');
    const caption = document.getElementById('galleryCaption');
    const filmstrip = document.getElementById('galleryFilmstrip');
    const thumbs = [...document.querySelectorAll('.gallery-filmstrip .thumb')];

    if (!main || !stage || !items.length || thumbs.length !== items.length)
        return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loadedFullImages = new Set();
    const loadedThumbnails = new Set();
    let idx = 0;
    let galleryActivated = false;
    let dragging = false;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;
    let dragOffset = 0;
    let renderTimer = 0;

    function loadImage(src, cache) {
        if (!src || cache.has(src))
            return;
        cache.add(src);
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
    }

    function preloadAround(index) {
        [-1, 0, 1].forEach(offset => {
            const item = items[(index + offset + items.length) % items.length];
            loadImage(item?.image, loadedFullImages);
        });
    }

    function loadThumbnail(index) {
        const thumb = thumbs[index];
        const item = items[index];
        if (!thumb || !item || loadedThumbnails.has(item.thumbnail))
            return;
        loadedThumbnails.add(item.thumbnail);
        thumb.style.backgroundImage = `linear-gradient(rgba(2,7,14,.08),rgba(2,7,14,.24)),url("${item.thumbnail}")`;
        thumb.classList.add('is-loaded');
    }

    function updateThumbnailMetadata() {
        thumbs.forEach((thumb, index) => {
            const item = items[index];
            const local = window.inviteI18n?.galleryItem(index) || [item.location, item.caption];
            thumb.title = `${local[0]} — ${local[1]}`;
            thumb.setAttribute('aria-label', `${String(index + 1).padStart(2, '0')}: ${local[1]}`);
        });
    }

    function initialiseProgressiveThumbnails() {
        updateThumbnailMetadata();

        if (!('IntersectionObserver' in window)) {
            thumbs.forEach((_, index) => loadThumbnail(index));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting)
                    return;
                const index = Number(entry.target.dataset.index);
                loadThumbnail(index);
                observer.unobserve(entry.target);
            });
        }, {
            root: filmstrip,
            rootMargin: '0px 180px',
            threshold: 0.01
        });

        thumbs.forEach(thumb => observer.observe(thumb));
    }

    function centreActiveThumb(behavior = 'smooth') {
        const active = thumbs[idx];
        if (!active || !filmstrip)
            return;
        const target = active.offsetLeft - (filmstrip.clientWidth - active.offsetWidth) / 2;
        filmstrip.scrollTo({ left: Math.max(0, target), behavior });
    }

    function resetDragVisual(animate = true) {
        stage.classList.toggle('is-dragging', false);
        main.style.transition = animate ? '' : 'none';
        main.style.transform = '';
        main.style.opacity = '';
        if (!animate) {
            requestAnimationFrame(() => {
                main.style.transition = '';
            });
        }
    }

    function applyFrame({ centreThumb = false, behavior = 'smooth' } = {}) {
        const item = items[idx];
        main.style.backgroundImage = `linear-gradient(180deg,transparent 58%,rgba(2,7,14,.22)),url("${item.image}")`;
        main.classList.add('has-image');
        main.setAttribute('aria-label', item.alt || (window.inviteI18n?.galleryItem(idx)?.[1] || item.caption));

        if (current)
            current.textContent = item.number;
        if (total)
            total.textContent = String(items.length).padStart(2, '0');

        const local = window.inviteI18n?.galleryItem(idx) || [item.location, item.caption];
        if (location)
            location.textContent = local[0];
        if (caption)
            caption.textContent = local[1];

        thumbs.forEach((thumb, index) => {
            const active = index === idx;
            thumb.classList.toggle('active', active);
            thumb.setAttribute('aria-current', active ? 'true' : 'false');
        });

        loadThumbnail(idx);
        preloadAround(idx);
        if (centreThumb)
            centreActiveThumb(behavior);
    }

    function render(nextIndex, direction = 0) {
        window.clearTimeout(renderTimer);
        idx = (nextIndex + items.length) % items.length;
        resetDragVisual(false);
        main.dataset.direction = String(direction || 0);
        main.classList.add('is-changing');
        location?.classList.add('is-changing');
        caption?.classList.add('is-changing');

        renderTimer = window.setTimeout(() => {
            applyFrame({ centreThumb: true, behavior: reducedMotion ? 'auto' : 'smooth' });
            requestAnimationFrame(() => {
                main.classList.remove('is-changing');
                location?.classList.remove('is-changing');
                caption?.classList.remove('is-changing');
            });
        }, reducedMotion ? 0 : 150);
    }

    function navigate(delta) {
        render(idx + delta, Math.sign(delta));
    }

    function activateGallery() {
        if (galleryActivated)
            return;
        galleryActivated = true;
        viewer?.classList.add('is-gallery-ready');
        initialiseProgressiveThumbnails();
        applyFrame({ behavior: 'auto' });
    }

    document.querySelector('.gallery-nav.next')?.addEventListener('click', () => navigate(1));
    document.querySelector('.gallery-nav.prev')?.addEventListener('click', () => navigate(-1));
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => {
        const delta = index === idx ? 0 : (index > idx ? 1 : -1);
        render(index, delta);
    }));

    stage.addEventListener('pointerdown', event => {
        if (event.target.closest('button') || event.pointerType === 'mouse' && event.button !== 0)
            return;
        activateGallery();
        dragging = true;
        startX = lastX = event.clientX;
        lastTime = performance.now();
        velocityX = 0;
        dragOffset = 0;
        stage.classList.add('is-dragging');
        stage.setPointerCapture?.(event.pointerId);
    });

    stage.addEventListener('pointermove', event => {
        if (!dragging)
            return;
        const now = performance.now();
        const elapsed = Math.max(8, now - lastTime);
        const delta = event.clientX - lastX;
        velocityX = velocityX * 0.68 + (delta / elapsed) * 0.32;
        lastX = event.clientX;
        lastTime = now;
        dragOffset = event.clientX - startX;

        const resistance = 0.72;
        const translated = dragOffset * resistance;
        const progress = Math.min(1, Math.abs(dragOffset) / Math.max(1, stage.clientWidth));
        main.style.transform = `translate3d(${translated}px,0,0) scale(${1 - progress * 0.018})`;
        main.style.opacity = String(1 - progress * 0.28);
    });

    function finishDrag(event) {
        if (!dragging)
            return;
        dragging = false;
        stage.releasePointerCapture?.(event.pointerId);

        const distanceThreshold = Math.min(78, stage.clientWidth * 0.16);
        const velocityThreshold = 0.42;
        const shouldNavigate = Math.abs(dragOffset) >= distanceThreshold || Math.abs(velocityX) >= velocityThreshold;
        const direction = dragOffset < 0 || (Math.abs(dragOffset) < 8 && velocityX < 0) ? 1 : -1;

        if (shouldNavigate)
            navigate(direction);
        else
            resetDragVisual(true);
    }

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', event => {
        dragging = false;
        stage.releasePointerCapture?.(event.pointerId);
        resetDragVisual(true);
    });

    document.addEventListener('keydown', event => {
        if (!gallerySection?.classList.contains('is-active'))
            return;
        if (event.key === 'ArrowRight')
            navigate(1);
        if (event.key === 'ArrowLeft')
            navigate(-1);
    });

    window.addEventListener('editorial:language-changed', () => {
        updateThumbnailMetadata();
        applyFrame();
    });

    if ('IntersectionObserver' in window && gallerySection) {
        const activationObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting))
                return;
            activateGallery();
            activationObserver.disconnect();
        }, { rootMargin: '450px 0px', threshold: 0.01 });
        activationObserver.observe(gallerySection);
    } else {
        activateGallery();
    }
});

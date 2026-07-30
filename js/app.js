/* =========================================================
 * CORE EXPERIENCE & CELESTIAL WORLD
 * Source: app.js
 * ========================================================= */

(() => {
    'use strict';
    const body = document.body;
    const prelude = document.getElementById('prelude');
    const experience = document.getElementById('experience');
    const enterButton = document.getElementById('enterButton');
    const chapterNumber = document.getElementById('chapterNumber');
    const chapterName = document.getElementById('chapterName');
    const progressBar = document.getElementById('progressBar');
    const scenes = [...document.querySelectorAll('.scene')];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const music = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicPreferenceKey = 'editorialInvitationMusicEnabled';
    const musicTargetVolume = 0.45;
    let invitationOpened = false;
    let musicFadeTimer = null;

    const getMusicPreference = () =>
        localStorage.getItem(musicPreferenceKey) !== 'false';

    const updateMusicToggle = (isPlaying) => {
        if (!musicToggle)
            return;

        musicToggle.setAttribute('aria-pressed', String(isPlaying));
        musicToggle.setAttribute(
            'aria-label',
            isPlaying ? 'Pause background music' : 'Play background music'
        );

        const label = musicToggle.querySelector('.sound-label');
        if (label)
            label.textContent = isPlaying ? 'Music on' : 'Music off';
    };

    const stopMusicFade = () => {
        if (musicFadeTimer !== null) {
            clearInterval(musicFadeTimer);
            musicFadeTimer = null;
        }
    };

    const playMusic = async ({ fadeIn = false } = {}) => {
        if (!music)
            return false;

        stopMusicFade();
        music.volume = fadeIn ? 0 : musicTargetVolume;

        try {
            await music.play();
            updateMusicToggle(true);

            if (fadeIn) {
                musicFadeTimer = window.setInterval(() => {
                    music.volume = Math.min(
                        musicTargetVolume,
                        music.volume + 0.03
                    );

                    if (music.volume >= musicTargetVolume)
                        stopMusicFade();
                }, 150);
            }

            return true;
        } catch (_) {
            updateMusicToggle(false);
            return false;
        }
    };

    const pauseMusic = () => {
        if (!music)
            return;

        stopMusicFade();
        music.pause();
        updateMusicToggle(false);
    };
    // Always begin at the cinematic cover. Disable browser scroll restoration because
    // restoring a previous position can reveal a later chapter behind the fixed prelude.
    if ('scrollRestoration' in history)
        history.scrollRestoration = 'manual';
    const resetOpeningPosition = () => {
        if (!prelude.classList.contains('is-hidden'))
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    resetOpeningPosition();
    addEventListener('pageshow', resetOpeningPosition);
    function createStars(canvas, count, bright = false) {
        const ctx = canvas.getContext('2d');
        let stars = [], raf = 0;
        const resize = () => {
            const dpr = Math.min(devicePixelRatio || 1, 2);
            canvas.width = innerWidth * dpr;
            canvas.height = innerHeight * dpr;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            stars = Array.from({ length: Math.max(70, Math.round(count * innerWidth / 1440)) }, () => ({
                x: Math.random() * innerWidth, y: Math.random() * innerHeight,
                r: Math.random() * (bright ? 1.45 : 1.15) + .15,
                a: Math.random() * .65 + .18, s: Math.random() * .012 + .004, p: Math.random() * Math.PI * 2
            }));
        };
        const draw = (t = 0) => {
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            stars.forEach(star => {
                const alpha = reducedMotion ? star.a : star.a + Math.sin(t * star.s + star.p) * .18;
                ctx.beginPath();
                ctx.fillStyle = `rgba(225,236,255,${Math.max(.05, alpha)})`;
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fill();
            });
            if (!reducedMotion)
                raf = requestAnimationFrame(draw);
        };
        resize();
        draw();
        addEventListener('resize', resize, { passive: true });
        return () => cancelAnimationFrame(raf);
    }
    createStars(document.getElementById('preludeStars'), 180, true);
    createStars(document.getElementById('starCanvas'), 250, false);
    enterButton.addEventListener('click', () => {
        // Reset before unlocking so the invitation always opens on the prologue,
        // never at a browser-restored or gallery-induced scroll position.
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        prelude.classList.add('is-hidden');
        experience.classList.add('is-visible');
        experience.setAttribute('aria-hidden', 'false');
        body.classList.remove('is-locked');
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
        setTimeout(() => document.getElementById('prologue').classList.add('is-active'), 300);
        invitationOpened = true;
        if (getMusicPreference())
            playMusic({ fadeIn: true });
        else
            updateMusicToggle(false);
    });
    if (musicToggle) {
        updateMusicToggle(getMusicPreference());

        musicToggle.addEventListener('click', async () => {
            if (!music)
                return;

            if (music.paused) {
                localStorage.setItem(musicPreferenceKey, 'true');
                await playMusic();
            } else {
                localStorage.setItem(musicPreferenceKey, 'false');
                pauseMusic();
            }
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!music || !invitationOpened)
            return;

        if (document.hidden) {
            if (!music.paused)
                music.dataset.resumeAfterVisibility = 'true';
            pauseMusic();
            return;
        }

        const shouldResume =
            music.dataset.resumeAfterVisibility === 'true' &&
            getMusicPreference();

        delete music.dataset.resumeAfterVisibility;

        if (shouldResume)
            playMusic();
    });
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting)
                return;
            scenes.forEach(scene => scene.classList.toggle('is-active', scene === entry.target));
            chapterNumber.textContent = entry.target.dataset.chapter;
            chapterName.textContent = entry.target.dataset.title;
        });
    }, { threshold: .52 });
    scenes.forEach(scene => observer.observe(scene));
    let ticking = false;
    function updateScroll() {
        const max = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
        if (!reducedMotion) {
            document.querySelector('.moon-wrap').style.transform = `translate3d(0,${scrollY * .023}px,0)`;
            document.querySelector('.cloud-a').style.marginLeft = `${scrollY * .012}px`;
            document.querySelector('.cloud-b').style.marginRight = `${scrollY * .009}px`;
        }
        ticking = false;
    }
    addEventListener('scroll', () => { if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
    } }, { passive: true });
})();


/* =========================================================
 * COUNTDOWN, RSVP & GUESTBOOK
 * Source: iteration-3.js
 * ========================================================= */

(() => {
    'use strict';
    const config = window.EDITORIAL_INVITE_CONFIG || {};
    const $ = (selector, root = document) => root.querySelector(selector);
    const params = new URLSearchParams(location.search);
    const guestParam = (params.get('guest') || '').trim();
    const idParam = (params.get('id') || '').trim();
    const storageKey = 'editorial-v2-rsvp-responses';
    const responseKey = `editorial-v2-rsvp-${idParam || guestParam || 'guest'}`;
    const greeting = $('#personalGreeting');
    const nameInput = $('#guestName');
    const invitationId = $('#invitationId');
    if (guestParam) {
        nameInput.value = guestParam;
        greeting.textContent = `${guestParam}, with grateful hearts, we invite you to share in the beginning of our next chapter.`;
    }
    invitationId.value = idParam || `${config.invitationPrefix || 'NG'}-${Date.now().toString(36).toUpperCase()}`;
    const pad = value => String(value).padStart(2, '0');
    function updateCountdown() {
        const target = new Date(config.weddingDate || '2026-10-11T19:00:00+07:00').getTime();
        const distance = Math.max(0, target - Date.now());
        const values = {
            days: Math.floor(distance / 86400000),
            hours: Math.floor(distance % 86400000 / 3600000),
            minutes: Math.floor(distance % 3600000 / 60000),
            seconds: Math.floor(distance % 60000 / 1000)
        };
        Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el)
            el.textContent = id === 'days' ? value : pad(value); });
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
    const form = $('#rsvpForm');
    const status = $('#formStatus');
    const success = $('#rsvpSuccess');
    const successName = $('#successName');
    const editButton = $('#editResponse');
    function getResponses() {
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        }
        catch (_) {
            return [];
        }
    }
    function saveLocal(payload) {
        const responses = getResponses();
        const index = responses.findIndex(item => item.invitationId === payload.invitationId);
        if (index >= 0)
            responses[index] = payload;
        else
            responses.push(payload);
        localStorage.setItem(storageKey, JSON.stringify(responses));
        localStorage.setItem(responseKey, JSON.stringify(payload));
    }
    function populate(payload) {
        if (!payload)
            return;
        nameInput.value = payload.guestName || '';
        const radio = $(`input[name="attendance"][value="${CSS.escape(payload.attendance || '')}"]`);
        if (radio)
            radio.checked = true;
        $('#guestCount').value = payload.guestCount || '1';
        $('#message').value = payload.message || '';
        invitationId.value = payload.invitationId || invitationId.value;
    }
    try {
        populate(JSON.parse(localStorage.getItem(responseKey) || 'null'));
    }
    catch (_) { }
    async function submitRemote(payload) {
        if (!config.googleAppsScriptUrl)
            return { mode: 'local' };
        const response = await fetch(config.googleAppsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        if (!response.ok)
            throw new Error(`Submission failed (${response.status})`);
        const result = await response.json().catch(() => ({ ok: true }));
        if (result && result.ok === false)
            throw new Error(result.error || 'The RSVP service rejected the response.');
        return result;
    }
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        status.textContent = '';
        if (!form.reportValidity())
            return;
        const submit = $('.submit-rsvp', form);
        submit.disabled = true;
        submit.classList.add('is-loading');
        const data = new FormData(form);
        const payload = {
            invitationId: invitationId.value,
            guestName: String(data.get('guestName') || '').trim(),
            attendance: String(data.get('attendance') || ''),
            guestCount: String(data.get('guestCount') || '1'),
            message: String(data.get('message') || '').trim(),
            rsvpTime: new Date().toISOString(),
            language: navigator.language || 'en',
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            pageUrl: location.href
        };
        try {
            await submitRemote(payload);
            saveLocal(payload);
            successName.textContent = payload.guestName;
            form.hidden = true;
            success.hidden = false;
            renderGuestbook();
        }
        catch (error) {
            status.textContent = 'We could not send your response. Please check your connection and try again.';
            console.error(error);
        }
        finally {
            submit.disabled = false;
            submit.classList.remove('is-loading');
        }
    });
    editButton.addEventListener('click', () => { success.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    const sky = $('#messageSky');
    const popover = $('#messagePopover');
    const controls = $('#guestbookControls');
    const pageStatus = $('#guestbookPageStatus');
    const newerButton = $('#newerWishes');
    const olderButton = $('#olderWishes');
    const PAGE_SIZE = 24;
    let currentPage = 1;
    let totalPages = 1;
    let totalMessages = 0;
    let sharedPageMessages = [];
    const defaultMessages = [
        { guestName: 'A shared wish', message: 'May your life together be filled with patience, kindness, and laughter.' },
        { guestName: 'From the night sky', message: 'May every ordinary day become a memory worth keeping.' },
        { guestName: 'A quiet blessing', message: 'May you always find peace in one another’s presence.' }
    ];
    function seededPosition(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++)
            hash = ((hash << 5) - hash) + seed.charCodeAt(i) | 0;
        return { left: 8 + Math.abs(hash % 84), top: 10 + Math.abs((hash >> 4) % 76), delay: Math.abs(hash % 4000) };
    }
    function openMessage(item) {
        $('#popoverMessage').textContent = `“${item.message}”`;
        $('#popoverName').textContent = `— ${item.guestName}`;
        popover.hidden = false;
    }
    function getCachedGuestbookPage() {
        try {
            const cached = JSON.parse(localStorage.getItem('editorial-v3-guestbook-page') || '{}');
            return cached && Array.isArray(cached.messages) ? cached : null;
        }
        catch (_) {
            return null;
        }
    }
    function uniqueMessages(items) {
        const unique = new Map();
        items.forEach(item => {
            const name = String(item?.guestName || 'Guest').trim();
            const message = String(item?.message || '').trim();
            const key = `${name}|${message}`;
            if (message && !unique.has(key))
                unique.set(key, { guestName: name, message });
        });
        return [...unique.values()];
    }
    function updatePageControls() {
        const hasMultiplePages = totalPages > 1;
        controls.hidden = !hasMultiplePages;
        newerButton.disabled = currentPage <= 1;
        olderButton.disabled = currentPage >= totalPages;
        if (!hasMultiplePages) {
            pageStatus.textContent = '';
            return;
        }
        const first = ((currentPage - 1) * PAGE_SIZE) + 1;
        const last = Math.min(currentPage * PAGE_SIZE, totalMessages);
        pageStatus.textContent = `Wishes ${first}–${last} of ${totalMessages}`;
    }
    function renderGuestbook() {
        sky.innerHTML = '';
        const localMessages = getResponses().filter(item => item.message);
        const fallback = currentPage === 1 ? [...localMessages, ...defaultMessages] : [];
        const messages = uniqueMessages([...sharedPageMessages, ...fallback]).slice(0, PAGE_SIZE);
        if (!messages.length) {
            const empty = document.createElement('p');
            empty.className = 'message-sky-empty';
            empty.textContent = 'The first wishes will soon appear among these stars.';
            sky.appendChild(empty);
        }
        messages.forEach((item, index) => {
            const pos = seededPosition(`${item.guestName}-${item.message}-${index}`);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'guest-star';
            button.setAttribute('aria-label', `Read message from ${item.guestName}`);
            button.style.left = `${pos.left}%`;
            button.style.top = `${pos.top}%`;
            button.style.animationDelay = `${pos.delay}ms`;
            button.innerHTML = '<span>✦</span>';
            button.addEventListener('click', () => openMessage(item));
            sky.appendChild(button);
        });
        sky.classList.remove('is-loading');
        updatePageControls();
    }
    function requestPage(page) {
        const nextPage = Math.max(1, Math.min(totalPages || page, page));
        sky.classList.add('is-loading');
        sky.innerHTML = '';
        window.dispatchEvent(new CustomEvent('editorial:guestbook-page-request', { detail: { page: nextPage, pageSize: PAGE_SIZE } }));
    }
    $('#closeMessage').addEventListener('click', () => { popover.hidden = true; });
    newerButton.addEventListener('click', () => requestPage(currentPage - 1));
    olderButton.addEventListener('click', () => requestPage(currentPage + 1));
    window.addEventListener('editorial:shared-messages', event => {
        const detail = event.detail || {};
        sharedPageMessages = Array.isArray(detail.messages) ? detail.messages : [];
        currentPage = Number(detail.page) || 1;
        totalMessages = Number(detail.total) || sharedPageMessages.length;
        totalPages = Math.max(1, Number(detail.totalPages) || Math.ceil(totalMessages / PAGE_SIZE));
        renderGuestbook();
    });
    const cached = getCachedGuestbookPage();
    if (cached) {
        sharedPageMessages = cached.messages;
        currentPage = Number(cached.page) || 1;
        totalMessages = Number(cached.total) || cached.messages.length;
        totalPages = Math.max(1, Number(cached.totalPages) || 1);
    }
    renderGuestbook();
})();


/* =========================================================
 * VENUE & GALLERY
 * Source: iteration-4.js
 * ========================================================= */

(() => {
    'use strict';
    const config = window.EDITORIAL_INVITE_CONFIG || {};
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    // Replace exhibition placeholders from config without changing markup.
    const gallery = config.galleryImages || {};
    $$('[data-image]').forEach(figure => {
        const key = figure.dataset.image;
        if (!gallery[key])
            return;
        const image = $('.gallery-image', figure);
        image.style.backgroundImage = `linear-gradient(180deg,transparent 60%,rgba(2,7,14,.32)),url("${gallery[key]}")`;
        image.classList.add('has-image');
    });
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
        note.textContent = 'The RSVP date has passed. Please contact Nicky or Gina directly.';
        if (config.closeRsvpAfterDeadline) {
            form.classList.add('is-closed');
            $$('input,select,textarea,button', form).forEach(el => el.disabled = true);
        }
    }
    else {
        note.textContent = `Kindly respond by ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(deadline)}.`;
    }
    // Paginated shared guestbook endpoint. Only one small page is rendered at a time.
    async function loadSharedGuestbook(page = 1, pageSize = 24) {
        if (!config.googleAppsScriptUrl || !config.enableSharedGuestbook)
            return;
        try {
            const separator = config.googleAppsScriptUrl.includes('?') ? '&' : '?';
            const url = `${config.googleAppsScriptUrl}${separator}action=guestbook&page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`;
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok)
                throw new Error(`Guestbook request failed with ${response.status}.`);
            const json = await response.json();
            const payload = Array.isArray(json)
                ? { messages: json, page: 1, pageSize, total: json.length, totalPages: 1 }
                : json;
            if (!Array.isArray(payload.messages))
                throw new Error('Guestbook response did not include messages.');
            localStorage.setItem('editorial-v3-guestbook-page', JSON.stringify(payload));
            window.dispatchEvent(new CustomEvent('editorial:shared-messages', { detail: payload }));
        }
        catch (error) {
            console.info('Shared guestbook unavailable; using cached or local wishes.', error);
            window.dispatchEvent(new CustomEvent('editorial:guestbook-load-failed'));
        }
    }
    window.addEventListener('editorial:guestbook-page-request', event => {
        const detail = event.detail || {};
        loadSharedGuestbook(Number(detail.page) || 1, Number(detail.pageSize) || 24);
    });
    loadSharedGuestbook(1, 24);
    // Slow photographic parallax, disabled for reduced motion.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    const main = document.getElementById('galleryMain');
    const stage = document.getElementById('galleryStage');
    const current = document.getElementById('galleryCurrent');
    const total = document.getElementById('galleryTotal');
    const location = document.getElementById('galleryLocation');
    const caption = document.getElementById('galleryCaption');
    const thumbs = [...document.querySelectorAll('.gallery-filmstrip .thumb')];

    if (!main || !stage || !items.length || thumbs.length !== items.length)
        return;

    let idx = 0;
    let startX = 0;
    let dragging = false;

    function preloadImages() {
        items.slice(1, 4).forEach(item => {
            const image = new Image();
            image.src = item.image;
        });
    }

    function initialiseThumbnails() {
        thumbs.forEach((thumb, index) => {
            const item = items[index];
            thumb.style.backgroundImage = `linear-gradient(rgba(2,7,14,.08),rgba(2,7,14,.24)),url("${item.thumbnail}")`;
            thumb.title = `${item.location} — ${item.caption}`;
        });
    }

    function centreActiveThumb(behavior = 'smooth') {
        const active = thumbs[idx];
        const strip = active?.closest('.gallery-filmstrip');
        if (!active || !strip)
            return;
        const target = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
        strip.scrollTo({ left: Math.max(0, target), behavior });
    }

    function applyFrame({ centreThumb = false, behavior = 'smooth' } = {}) {
        const item = items[idx];
        main.style.backgroundImage = `linear-gradient(180deg,transparent 58%,rgba(2,7,14,.22)),url("${item.image}")`;
        main.classList.add('has-image');
        main.setAttribute('aria-label', item.alt || item.caption);

        if (current)
            current.textContent = item.number;
        if (total)
            total.textContent = String(items.length).padStart(2, '0');
        if (location)
            location.textContent = item.location;
        if (caption)
            caption.textContent = item.caption;

        thumbs.forEach((thumb, index) => {
            const active = index === idx;
            thumb.classList.toggle('active', active);
            thumb.setAttribute('aria-current', active ? 'true' : 'false');
        });

        if (centreThumb)
            centreActiveThumb(behavior);
    }

    function render(nextIndex) {
        idx = (nextIndex + items.length) % items.length;
        main.classList.add('is-changing');
        location?.classList.add('is-changing');
        caption?.classList.add('is-changing');

        window.setTimeout(() => {
            applyFrame({ centreThumb: true });
            requestAnimationFrame(() => {
                main.classList.remove('is-changing');
                location?.classList.remove('is-changing');
                caption?.classList.remove('is-changing');
            });
        }, 180);
    }

    document.querySelector('.gallery-nav.next')?.addEventListener('click', () => render(idx + 1));
    document.querySelector('.gallery-nav.prev')?.addEventListener('click', () => render(idx - 1));
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => render(index)));

    stage.addEventListener('pointerdown', event => {
        if (event.target.closest('button'))
            return;
        startX = event.clientX;
        dragging = true;
        stage.setPointerCapture?.(event.pointerId);
    });

    stage.addEventListener('pointerup', event => {
        if (!dragging)
            return;
        dragging = false;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 42)
            render(idx + (distance < 0 ? 1 : -1));
    });

    stage.addEventListener('pointercancel', () => { dragging = false; });
    document.addEventListener('keydown', event => {
        if (!document.getElementById('gallery')?.classList.contains('is-active'))
            return;
        if (event.key === 'ArrowRight')
            render(idx + 1);
        if (event.key === 'ArrowLeft')
            render(idx - 1);
    });

    initialiseThumbnails();
    applyFrame({ behavior: 'auto' });
    preloadImages();
});

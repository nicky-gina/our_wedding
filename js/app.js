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
    const chapterTotal = document.getElementById('chapterTotal');
    const chapterProgressFill = document.getElementById('chapterProgressFill');
    const chapterName = document.getElementById('chapterName');
    const progressBar = document.getElementById('progressBar');
    const scenes = [...document.querySelectorAll('.scene')];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const music = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicPreferenceKey = 'editorialInvitationMusicEnabled';
    const musicTargetVolume = 0.45;
    const t = (key, vars) => window.inviteI18n?.t(key, vars) || key;
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
            isPlaying ? t('music.pauseAria') : t('music.playAria')
        );

        const label = musicToggle.querySelector('.sound-label');
        if (label)
            label.textContent = isPlaying ? t('music.on') : t('music.off');
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
        if (!canvas)
            return () => {};

        const ctx = canvas.getContext('2d', { alpha: true });
        let stars = [];
        let raf = 0;
        let running = false;

        const resize = () => {
            const mobile = matchMedia('(max-width: 800px)').matches;
            const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75);
            const width = Math.max(1, innerWidth);
            const height = Math.max(1, innerHeight);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const responsiveCount = Math.max(
                mobile ? 45 : 70,
                Math.round(count * width / 1440)
            );

            stars = Array.from({ length: responsiveCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * (bright ? 1.35 : 1.05) + 0.15,
                a: Math.random() * 0.65 + 0.18,
                s: Math.random() * 0.012 + 0.004,
                p: Math.random() * Math.PI * 2
            }));
        };

        const draw = (time = 0) => {
            if (!running)
                return;

            ctx.clearRect(0, 0, innerWidth, innerHeight);

            stars.forEach(star => {
                const alpha = reducedMotion
                    ? star.a
                    : star.a + Math.sin(time * star.s + star.p) * 0.18;

                ctx.beginPath();
                ctx.fillStyle = `rgba(225,236,255,${Math.max(0.05, alpha)})`;
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fill();
            });

            if (!reducedMotion)
                raf = requestAnimationFrame(draw);
        };

        const start = () => {
            if (running || document.hidden)
                return;
            running = true;
            draw();
        };

        const stop = () => {
            running = false;
            cancelAnimationFrame(raf);
            raf = 0;
        };

        const handleVisibility = () => {
            if (document.hidden)
                stop();
            else
                start();
        };

        resize();
        start();
        addEventListener('resize', resize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            stop();
            removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibility);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }

    const stopPreludeStars = createStars(document.getElementById('preludeStars'), 150, true);
    const stopWorldStars = createStars(document.getElementById('starCanvas'), 210, false);
    enterButton.addEventListener('click', () => {
        // Reset before unlocking so the invitation always opens on the prologue,
        // never at a browser-restored or gallery-induced scroll position.
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        prelude.classList.add('is-hidden');
        stopPreludeStars();
        window.setTimeout(() => prelude.remove(), 1600);
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

    window.addEventListener('editorial:language-changed', () => updateMusicToggle(Boolean(music && !music.paused)));

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
    const totalChapters = scenes.length;
    if (chapterTotal) chapterTotal.textContent = String(totalChapters).padStart(2, '0');

    const updateChapterProgress = scene => {
        const index = Math.max(0, scenes.indexOf(scene));
        if (chapterNumber) chapterNumber.textContent = String(index + 1).padStart(2, '0');
        if (chapterName) chapterName.textContent = scene.dataset.title;
        if (chapterProgressFill) {
            chapterProgressFill.style.transform = `scaleX(${(index + 1) / totalChapters})`;
        }
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting)
                return;
            scenes.forEach(scene => scene.classList.toggle('is-active', scene === entry.target));
            updateChapterProgress(entry.target);
        });
    }, { threshold: .52 });
    scenes.forEach(scene => observer.observe(scene));
    updateChapterProgress(scenes[0]);

    // Story milestones draw their timeline once, when first entering view.
    const timelineItems = [...document.querySelectorAll('.story-meta')];
    timelineItems.forEach(item => item.classList.add('timeline-ready'));
    if (reducedMotion) {
        timelineItems.forEach(item => item.classList.add('timeline-drawn'));
    } else {
        const timelineObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('timeline-drawn');
                timelineObserver.unobserve(entry.target);
            });
        }, { threshold: .55 });
        timelineItems.forEach(item => timelineObserver.observe(item));
    }

    // Cinematic interludes open while in view and softly close as they leave.
    // Only transform and opacity are animated to keep mobile compositing light.
    const narratives = [...document.querySelectorAll('[data-narrative]')];
    if (reducedMotion) {
        narratives.forEach(item => item.classList.add('is-visible'));
    } else {
        const narrativeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle(
                    'is-visible',
                    entry.isIntersecting && entry.intersectionRatio >= 0.28
                );
            });
        }, {
            threshold: [0, 0.28, 0.55],
            rootMargin: '-8% 0px -8% 0px'
        });
        narratives.forEach(item => narrativeObserver.observe(item));
    }
    let ticking = false;
    function updateScroll() {
        const max = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
        const allowMotion = !reducedMotion;
        const isMobile = matchMedia('(max-width: 800px)').matches;
        if (allowMotion) {
            const viewportHeight = Math.max(innerHeight, 1);

            /*
             * Use a continuous sine wave instead of scrollY % innerHeight.
             * One complete down-and-up cycle spans two viewport heights,
             * so crossing a chapter boundary never resets the moon position.
             */
            const scrollPhase = (scrollY / viewportHeight) * Math.PI;
            const smoothWave = Math.sin(scrollPhase);

            document.documentElement.style.setProperty(
                '--scene-depth-y',
                isMobile ? '0px' : `${smoothWave * 24}px`
            );
            document.documentElement.style.setProperty(
                '--moon-scroll-y',
                `${smoothWave * (isMobile ? 18 : 24)}px`
            );
        } else {
            document.documentElement.style.setProperty('--scene-depth-y', '0px');
            document.documentElement.style.setProperty('--moon-scroll-y', '0px');
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
    const t = (key, vars) => window.inviteI18n?.t(key, vars) || key;

    // Personalised invitation links use:
    //   ?guest=Guest%20Name&id=NG-2026-001
    // The ID is optional, but recommended because it gives each invitation a
    // stable RSVP record that can be updated when the same link is reopened.
    const normaliseGuestName = value => String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);

    const guestParam = normaliseGuestName(
        params.get('guest') ||
        params.get('name') ||
        params.get('to') ||
        params.get('guestName')
    );
    const idParam = String(params.get('id') || '')
        .trim()
        .slice(0, 100);

    const storageKey = 'editorial-v2-rsvp-responses';
    const responseKey = `editorial-v2-rsvp-${idParam || guestParam || 'guest'}`;
    const greeting = $('#personalGreeting');
    const nameInput = $('#guestName');
    const invitationId = $('#invitationId');

    const applyPersonalisation = () => {
        if (!guestParam)
            return;

        /*
         * Keep the personalised greeting as the source of truth. The i18n
         * layer performs an initial translation pass on DOMContentLoaded, and
         * browsers may also restore pages from the back-forward cache. This
         * function is intentionally safe to run more than once so neither
         * lifecycle can replace the guest's name with the generic greeting.
         */
        greeting.removeAttribute('data-i18n');
        greeting.dataset.personalized = 'true';
        greeting.textContent = t('prologue.personalGreeting', { name: guestParam });

        if (!nameInput.value || nameInput.dataset.prefilled === 'true')
            nameInput.value = guestParam;
        nameInput.dataset.prefilled = 'true';

        const prefilledNote = $('#prefilledNameNote');
        if (prefilledNote)
            prefilledNote.hidden = false;
    };

    applyPersonalisation();
    queueMicrotask(applyPersonalisation);
    document.addEventListener('DOMContentLoaded', applyPersonalisation, { once: true });
    window.addEventListener('pageshow', applyPersonalisation);

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
    const successEyebrow = $('#successEyebrow');
    const successTitle = $('#successTitle');
    const successBody = $('#successBody');
    const successAttendance = $('#successAttendance');
    const successGuests = $('#successGuests');
    const successMessage = $('#successMessage');
    const editButton = $('#editResponse');
    const cancelEditButton = $('#cancelRsvpEdit');
    const existingNote = $('#rsvpExistingNote');
    const submitLabel = $('#rsvpSubmitLabel');
    let savedPayload = null;
    let isEditingExisting = false;

    function getResponses() {
        try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
        catch (_) { return []; }
    }
    function saveLocal(payload) {
        const responses = getResponses();
        const index = responses.findIndex(item => item.invitationId === payload.invitationId);
        if (index >= 0) responses[index] = payload; else responses.push(payload);
        localStorage.setItem(storageKey, JSON.stringify(responses));
        localStorage.setItem(responseKey, JSON.stringify(payload));
    }
    function attendanceLabel(value) { return value === 'Attending' ? t('rsvp.attending') : t('rsvp.unable'); }
    function guestCountLabel(payload) {
        if (payload.attendance === 'Not attending') return '—';
        const count = Math.min(4, Math.max(1, Number(payload.guestCount) || 1));
        return t(`rsvp.${['oneGuest','twoGuests','threeGuests','fourGuests'][count - 1]}`);
    }
    function populate(payload) {
        if (!payload) return;
        nameInput.value = payload.guestName || '';
        $('#guestCount').value = payload.guestCount || '1';
        $('#message').value = payload.message || '';
        invitationId.value = payload.invitationId || invitationId.value;
        [...form.querySelectorAll('input[name="attendance"]')].forEach(radio => {
            const selected = radio.value === payload.attendance;
            radio.checked = selected;
            radio.closest('.choice')?.classList.toggle('is-selected', selected);
        });
        const unable = payload.attendance === 'Not attending';
        $('#guestCount').disabled = unable;
        if (unable) $('#guestCount').value = '1';
    }
    function renderSuccess(payload, { updated = false, animate = true } = {}) {
        if (!payload) return;
        savedPayload = payload;
        const name = payload.guestName || t('guestbook.guest');
        successEyebrow.textContent = t(updated ? 'rsvp.updatedEyebrow' : 'rsvp.successEyebrow');
        successTitle.textContent = t(updated ? 'rsvp.updatedTitle' : 'rsvp.successTitle', { name });
        successBody.textContent = t(payload.attendance === 'Attending' ? 'rsvp.successAttending' : 'rsvp.successUnable');
        successAttendance.textContent = attendanceLabel(payload.attendance);
        successGuests.textContent = guestCountLabel(payload);
        successMessage.textContent = payload.message || t('rsvp.noMessage');
        form.hidden = true; success.hidden = false;
        success.classList.toggle('is-updated', updated);
        success.classList.remove('is-celebrating');
        if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches)
            requestAnimationFrame(() => success.classList.add('is-celebrating'));
        isEditingExisting = false;
    }
    function beginEditing() {
        if (savedPayload) populate(savedPayload);
        success.hidden = true; form.hidden = false;
        isEditingExisting = Boolean(savedPayload);
        existingNote.hidden = !isEditingExisting;
        cancelEditButton.hidden = !isEditingExisting;
        submitLabel.textContent = t(isEditingExisting ? 'rsvp.updateSubmit' : 'rsvp.submit');
        form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
    function readLocalResponse() {
        try { return JSON.parse(localStorage.getItem(responseKey) || 'null'); }
        catch (_) { return null; }
    }
    async function lookupRemoteResponse() {
        if (!idParam || !config.googleAppsScriptUrl) return null;
        const separator = config.googleAppsScriptUrl.includes('?') ? '&' : '?';
        const response = await fetch(`${config.googleAppsScriptUrl}${separator}action=rsvp&id=${encodeURIComponent(idParam)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`RSVP lookup failed (${response.status})`);
        const result = await response.json();
        if (result?.ok === false) throw new Error(result.error || 'RSVP lookup rejected.');
        return result?.found ? result.response : null;
    }
    async function restoreExistingResponse() {
        const local = readLocalResponse();
        if (local) { populate(local); renderSuccess(local, { animate: false }); }
        if (!idParam || !config.googleAppsScriptUrl) return;
        try {
            const remote = await lookupRemoteResponse();
            if (remote) { saveLocal(remote); populate(remote); renderSuccess(remote, { animate: false }); }
        } catch (error) { console.info(t('rsvp.lookupError'), error); }
    }
    async function submitRemote(payload) {
        if (!config.googleAppsScriptUrl) return { mode: 'local', updated: Boolean(savedPayload) };
        const response = await fetch(config.googleAppsScriptUrl, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload) });
        if (!response.ok) throw new Error(`Submission failed (${response.status})`);
        const result = await response.json().catch(() => ({ ok:true }));
        if (result?.ok === false) throw new Error(result.error || 'The RSVP service rejected the response.');
        return result;
    }
    form.addEventListener('submit', async event => {
        event.preventDefault(); status.textContent = '';
        if (!form.reportValidity()) return;
        const submit = $('.submit-rsvp', form); submit.disabled = true; submit.classList.add('is-loading');
        const data = new FormData(form);
        const payload = { invitationId:invitationId.value, guestName:String(data.get('guestName')||'').trim(), attendance:String(data.get('attendance')||''), guestCount:String(data.get('guestCount')||'1'), message:String(data.get('message')||'').trim(), rsvpTime:new Date().toISOString(), language:window.inviteI18n?.language||navigator.language||'en', device:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop', pageUrl:location.href };
        try {
            const result = await submitRemote(payload);
            const updated = Boolean(result?.updated || savedPayload || isEditingExisting);
            saveLocal(payload);
            window.dispatchEvent(new CustomEvent('editorial:rsvp-saved', { detail: payload }));
            renderSuccess(payload, { updated });
            renderGuestbook();
        } catch (error) { status.textContent = t('rsvp.error'); console.error(error); }
        finally { submit.disabled = false; submit.classList.remove('is-loading'); }
    });
    editButton.addEventListener('click', beginEditing);
    cancelEditButton.addEventListener('click', () => savedPayload && renderSuccess(savedPayload, { animate:false }));
    restoreExistingResponse();
    const sky = $('#messageSky');
    const popover = $('#messagePopover');
    const popoverBackdrop = $('#messagePopoverBackdrop');
    const controls = $('#guestbookControls');
    const pageStatus = $('#guestbookPageStatus');
    const searchStatus = $('#guestbookSearchStatus');
    const searchInput = $('#guestbookSearch');
    const discoverButton = $('#discoverWish');
    const anotherWishButton = $('#anotherWish');
    const newerButton = $('#newerWishes');
    const olderButton = $('#olderWishes');
    const PAGE_SIZE = 24;
    let currentPage = 1;
    let totalPages = 1;
    let totalMessages = 0;
    let sharedPageMessages = [];
    let searchQuery = '';
    let searchTimer = 0;
    let previouslyFocusedElement = null;
    let newlySubmittedKey = '';
    function messageKey(item) {
        return `${String(item?.guestName || '').trim()}|${String(item?.message || '').trim()}`;
    }
    function seededPosition(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++)
            hash = ((hash << 5) - hash) + seed.charCodeAt(i) | 0;
        return { left: 8 + Math.abs(hash % 84), top: 10 + Math.abs((hash >> 4) % 76), delay: Math.abs(hash % 4000) };
    }
    function openMessage(item) {
        if (!item) return;
        previouslyFocusedElement = document.activeElement;
        $('#popoverMessage').textContent = `“${item.message}”`;
        $('#popoverName').textContent = `— ${item.guestName}`;
        popoverBackdrop.hidden = false;
        popover.hidden = false;
        document.body.classList.add('is-reading-wish');
        requestAnimationFrame(() => {
            popoverBackdrop.classList.add('is-visible');
            popover.classList.add('is-visible');
            $('#closeMessage').focus({ preventScroll: true });
        });
    }
    function closeMessage() {
        popoverBackdrop.classList.remove('is-visible');
        popover.classList.remove('is-visible');
        document.body.classList.remove('is-reading-wish');
        setTimeout(() => {
            popover.hidden = true;
            popoverBackdrop.hidden = true;
            previouslyFocusedElement?.focus?.({ preventScroll: true });
        }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
    }
    function getCachedGuestbookPage() {
        try {
            const cached = JSON.parse(localStorage.getItem('editorial-v3-guestbook-page') || '{}');
            return cached && Array.isArray(cached.messages) ? cached : null;
        }
        catch (_) { return null; }
    }
    function uniqueMessages(items) {
        const unique = new Map();
        items.forEach(item => {
            const name = String(item?.guestName || t('guestbook.guest')).trim();
            const message = String(item?.message || '').trim();
            const key = `${name}|${message}`;
            if (message && !unique.has(key)) unique.set(key, { guestName: name, message });
        });
        return [...unique.values()];
    }
    function localSearchMessages(query) {
        const normalized = query.trim().toLocaleLowerCase();
        const items = uniqueMessages([
            ...getResponses().filter(item => item.message),
            ...sharedPageMessages
        ]);
        if (!normalized) return items;
        return items.filter(item => `${item.guestName} ${item.message}`.toLocaleLowerCase().includes(normalized));
    }
    function updatePageControls() {
        const hasMultiplePages = totalPages > 1;
        controls.hidden = !hasMultiplePages;
        newerButton.disabled = currentPage <= 1;
        olderButton.disabled = currentPage >= totalPages;
        if (!hasMultiplePages) { pageStatus.textContent = ''; return; }
        const first = ((currentPage - 1) * PAGE_SIZE) + 1;
        const last = Math.min(currentPage * PAGE_SIZE, totalMessages);
        pageStatus.textContent = t('guestbook.pageStatus', { first, last, total: totalMessages });
    }
    function updateSearchStatus() {
        if (!searchQuery) { searchStatus.textContent = ''; return; }
        searchStatus.textContent = totalMessages
            ? t('guestbook.searchResults', { count: totalMessages, query: searchQuery })
            : t('guestbook.noSearchResults', { query: searchQuery });
    }
    function renderGuestbook() {
        sky.innerHTML = '';
        const localMessages = getResponses().filter(item => item.message);
        const fallback = currentPage === 1 ? localMessages : [];
        let messages = uniqueMessages([...sharedPageMessages, ...fallback]);
        if (searchQuery && !window.EDITORIAL_INVITE_CONFIG?.googleAppsScriptUrl) {
            messages = localSearchMessages(searchQuery);
            totalMessages = messages.length;
            totalPages = Math.max(1, Math.ceil(totalMessages / PAGE_SIZE));
            messages = messages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        }
        messages = messages.slice(0, PAGE_SIZE);
        if (!messages.length) {
            const empty = document.createElement('p');
            empty.className = 'message-sky-empty';
            empty.textContent = searchQuery ? t('guestbook.noSearchResults', { query: searchQuery }) : t('guestbook.empty');
            sky.appendChild(empty);
        }
        messages.forEach((item, index) => {
            const pos = seededPosition(`${item.guestName}-${item.message}-${index}`);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'guest-star';
            button.setAttribute('aria-label', t('guestbook.readFrom', { name: item.guestName }));
            button.style.left = `${pos.left}%`;
            button.style.top = `${pos.top}%`;
            button.style.animationDelay = `${pos.delay}ms`;
            button.innerHTML = '<span>✦</span>';
            if (messageKey(item) === newlySubmittedKey) {
                button.classList.add('is-new');
                button.addEventListener('animationend', () => button.classList.remove('is-new'), { once: true });
            }
            button.addEventListener('click', () => openMessage(item));
            sky.appendChild(button);
        });
        newlySubmittedKey = '';
        sky.classList.remove('is-loading');
        updatePageControls();
        updateSearchStatus();
    }
    function requestPage(page) {
        const nextPage = Math.max(1, Math.min(totalPages || page, page));
        const config = window.EDITORIAL_INVITE_CONFIG || {};
        if (!config.googleAppsScriptUrl || !config.enableSharedGuestbook) {
            currentPage = nextPage;
            renderGuestbook();
            return;
        }
        sky.classList.add('is-loading');
        sky.innerHTML = '';
        window.dispatchEvent(new CustomEvent('editorial:guestbook-page-request', {
            detail: { page: nextPage, pageSize: PAGE_SIZE, search: searchQuery }
        }));
    }
    function setRandomWishLoading(isLoading) {
        discoverButton.disabled = isLoading;
        anotherWishButton.disabled = isLoading;
        anotherWishButton.classList.toggle('is-loading', isLoading);
        anotherWishButton.setAttribute('aria-busy', String(isLoading));

        const label = $('#anotherWishLabel');
        if (label) {
            label.textContent = isLoading
                ? t('guestbook.loadingAnother')
                : t('guestbook.another');
        }
    }
    async function discoverRandomWish() {
        setRandomWishLoading(true);
        try {
            const config = window.EDITORIAL_INVITE_CONFIG || {};
            if (config.googleAppsScriptUrl && config.enableSharedGuestbook) {
                const separator = config.googleAppsScriptUrl.includes('?') ? '&' : '?';
                const response = await fetch(`${config.googleAppsScriptUrl}${separator}action=randomWish`, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Random wish request failed with ${response.status}.`);
                const payload = await response.json();
                if (payload?.message?.message) { openMessage(payload.message); return; }
            }
            const available = localSearchMessages('');
            if (available.length) openMessage(available[Math.floor(Math.random() * available.length)]);
        }
        catch (error) {
            console.info('Random wish unavailable; using local wishes.', error);
            const available = localSearchMessages('');
            if (available.length) openMessage(available[Math.floor(Math.random() * available.length)]);
        }
        finally {
            setRandomWishLoading(false);
        }
    }
    $('#closeMessage').addEventListener('click', closeMessage);
    popoverBackdrop.addEventListener('click', closeMessage);
    newerButton.addEventListener('click', () => requestPage(currentPage - 1));
    olderButton.addEventListener('click', () => requestPage(currentPage + 1));
    discoverButton.addEventListener('click', discoverRandomWish);
    anotherWishButton.addEventListener('click', discoverRandomWish);
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            requestPage(1);
        }, 320);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !popover.hidden) closeMessage();
        if (event.key === 'Tab' && !popover.hidden) {
            const focusable = [...popover.querySelectorAll('button:not(:disabled)')];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
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
    window.addEventListener('editorial:language-changed', () => {
        if (guestParam) applyPersonalisation();
        else greeting.textContent = t('prologue.greeting');
        if (savedPayload) renderSuccess(savedPayload, { updated: success.classList.contains('is-updated'), animate: false });
        submitLabel.textContent = t(isEditingExisting ? 'rsvp.updateSubmit' : 'rsvp.submit');
        if (!cancelEditButton.hidden) cancelEditButton.textContent = t('rsvp.cancelEdit');
        renderGuestbook();
    });
    window.addEventListener('editorial:rsvp-saved', event => {
        const item = event.detail || {};
        if (item.message) newlySubmittedKey = messageKey(item);
        currentPage = 1;
        searchQuery = '';
        searchInput.value = '';
        renderGuestbook();
    });
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
    const t = (key, vars) => window.inviteI18n?.t(key, vars) || key;
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
    async function loadSharedGuestbook(page = 1, pageSize = 24, search = '') {
        if (!config.googleAppsScriptUrl || !config.enableSharedGuestbook)
            return;
        try {
            const separator = config.googleAppsScriptUrl.includes('?') ? '&' : '?';
            const searchPart = search ? `&search=${encodeURIComponent(search)}` : '';
            const url = `${config.googleAppsScriptUrl}${separator}action=guestbook&page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}${searchPart}`;
            const response = await fetch(url, { cache: 'no-store' });
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
            window.dispatchEvent(new CustomEvent('editorial:shared-messages', { detail: payload }));
        }
        catch (error) {
            console.info('Shared guestbook unavailable; using cached or local wishes.', error);
            window.dispatchEvent(new CustomEvent('editorial:guestbook-load-failed'));
        }
    }
    window.addEventListener('editorial:guestbook-page-request', event => {
        const detail = event.detail || {};
        loadSharedGuestbook(Number(detail.page) || 1, Number(detail.pageSize) || 24, String(detail.search || ''));
    });
    loadSharedGuestbook(1, 24);
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

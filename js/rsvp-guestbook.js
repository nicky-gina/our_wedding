/* =========================================================
 * COUNTDOWN, RSVP & GUESTBOOK
 * Runtime module: rsvp-guestbook.js
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

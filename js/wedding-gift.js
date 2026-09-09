(() => {
  'use strict';

  const config = window.EDITORIAL_INVITE_CONFIG?.weddingGift || {};
  const t = key => window.inviteI18n?.t(key) || key;
  const status = document.getElementById('giftCopyStatus');

  const normaliseText = value => String(value || '').trim();
  const displayValue = value => normaliseText(value) || '—';

  const populateBank = (key, data = {}) => {
    const bankName = document.querySelector(`[data-gift-bank-name="${key}"]`);
    const accountNumber = document.querySelector(`[data-gift-account-number="${key}"]`);
    const accountHolder = document.querySelector(`[data-gift-account-holder="${key}"]`);
    const copyButton = document.querySelector(`[data-gift-copy="${key}"]`);

    const bank = normaliseText(data.bankName);
    const number = normaliseText(data.accountNumber);
    const holder = normaliseText(data.accountHolder);

    if (bankName) bankName.textContent = displayValue(bank);
    if (accountNumber) accountNumber.textContent = displayValue(number);
    if (accountHolder) accountHolder.textContent = displayValue(holder);

    if (copyButton) {
      copyButton.disabled = !number;
      copyButton.dataset.copyValue = number;
      copyButton.closest('.gift-card')?.classList.toggle('is-incomplete', !(bank && number && holder));
    }
  };

  const populatePaypal = (data = {}) => {
    const handle = normaliseText(data.handle);
    const url = normaliseText(data.url);
    const configuredQrImage = normaliseText(data.qrImage);
    const handleElement = document.querySelector('[data-gift-paypal-handle]');
    const link = document.querySelector('[data-gift-paypal-link]');
    const qrTrigger = document.querySelector('[data-gift-paypal-qr-trigger]');
    const qrThumb = document.querySelector('[data-gift-paypal-qr-thumb]');
    const qrFull = document.querySelector('[data-gift-paypal-qr-full]');

    if (handleElement) handleElement.textContent = displayValue(handle);

    if (link) {
      const validUrl = /^https?:\/\//i.test(url);
      link.href = validUrl ? url : '#';
      link.classList.toggle('is-disabled', !validUrl);
      link.setAttribute('aria-disabled', String(!validUrl));
      link.addEventListener('click', event => {
        if (link.classList.contains('is-disabled')) event.preventDefault();
      });
    }

    // Prefer config, but fall back to the QR src embedded in HTML.
    // This makes the QR visible even when a browser has cached an older config.
    const embeddedQrImage =
      normaliseText(qrThumb?.getAttribute('src')) ||
      normaliseText(qrFull?.getAttribute('src'));
    const qrImage = configuredQrImage || embeddedQrImage;

    if (qrImage && qrTrigger && qrThumb) {
      const hideBrokenQr = () => {
        qrTrigger.hidden = true;
      };

      qrThumb.addEventListener('error', hideBrokenQr, { once: true });

      if (configuredQrImage) {
        qrThumb.src = configuredQrImage;
      }

      qrThumb.alt = t('gift.qrEyebrow');
      qrTrigger.hidden = false;

      // Keep the full-size QR unloaded until the guest actually opens the modal.
      if (qrFull) {
        qrFull.dataset.qrSrc = configuredQrImage || qrImage;
        qrFull.alt = t('gift.qrEyebrow');
      }
    } else if (qrTrigger) {
      qrTrigger.hidden = true;
    }

    document.querySelector('[data-gift-card="paypal"]')
      ?.classList.toggle('is-incomplete', !(handle && /^https?:\/\//i.test(url)));
  };

  const fallbackCopy = value => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  };

  const copyText = async value => {
    if (!value) return false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (_) {
        return fallbackCopy(value);
      }
    }

    return fallbackCopy(value);
  };

  const announceCopied = button => {
    if (status) status.textContent = t('gift.copied');

    const label = button.querySelector('[data-i18n="gift.copyAccount"]');
    if (!label) return;

    label.textContent = t('gift.copied').replace(/[.!。]+$/, '');

    window.setTimeout(() => {
      label.textContent = t('gift.copyAccount');
      if (status) status.textContent = '';
    }, 1800);
  };

  document.querySelectorAll('[data-gift-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = normaliseText(button.dataset.copyValue);
      if (!value) return;

      button.disabled = true;
      const copied = await copyText(value);
      if (copied) announceCopied(button);

      window.setTimeout(() => {
        button.disabled = !normaliseText(button.dataset.copyValue);
      }, 250);
    });
  });


  const qrModal = document.getElementById('paypalQrModal');
  const qrTrigger = document.querySelector('[data-gift-paypal-qr-trigger]');
  let lastQrFocus = null;

  const getFocusableQrElements = () => {
    if (!qrModal) return [];
    return [...qrModal.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden);
  };

  const openQrModal = () => {
    if (!qrModal || !qrTrigger || qrTrigger.hidden) return;

    lastQrFocus = document.activeElement;

    const qrFull = document.querySelector('[data-gift-paypal-qr-full]');
    if (qrFull?.dataset.qrSrc && !qrFull.getAttribute('src')) {
      qrFull.src = qrFull.dataset.qrSrc;
    }

    qrModal.classList.add('is-open');
    qrModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gift-qr-open');

    const focusables = getFocusableQrElements();
    (focusables[0] || qrModal).focus?.();
  };

  const closeQrModal = () => {
    if (!qrModal?.classList.contains('is-open')) return;

    qrModal.classList.remove('is-open');
    qrModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gift-qr-open');
    lastQrFocus?.focus?.();

    window.setTimeout(() => {
      const qrFull = document.querySelector('[data-gift-paypal-qr-full]');
      qrFull?.removeAttribute('src');
    }, 320);
  };

  qrTrigger?.addEventListener('click', openQrModal);
  qrModal?.querySelectorAll('[data-gift-qr-close]').forEach(element => {
    element.addEventListener('click', closeQrModal);
  });

  document.addEventListener('keydown', event => {
    if (!qrModal?.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeQrModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = getFocusableQrElements();
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  populateBank('nicky', config.nicky);
  populateBank('gina', config.gina);
  populatePaypal(config.paypal);

  window.addEventListener('editorial:language-changed', () => {
    if (status) status.textContent = '';

    const qrThumb = document.querySelector('[data-gift-paypal-qr-thumb]');
    const qrFull = document.querySelector('[data-gift-paypal-qr-full]');
    if (qrThumb?.src) qrThumb.alt = t('gift.qrEyebrow');
    if (qrFull?.src) qrFull.alt = t('gift.qrEyebrow');
  });
})();

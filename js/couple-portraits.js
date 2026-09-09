(() => {
  'use strict';

  const config = window.EDITORIAL_INVITE_CONFIG?.couplePortraits || {};
  const t = key => window.inviteI18n?.t(key) || key;

  const loadImage = source => new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(source);
    image.onerror = () => resolve(null);
    image.src = source;
  });

  const formatCount = value => String(value).padStart(2, '0');

  const initialiseCarousel = async figure => {
    const key = figure.dataset.coupleCarousel;
    const settings = config[key] || {};
    const candidates = Array.isArray(settings.images) ? settings.images.filter(Boolean) : [];

    const viewport = figure.querySelector('.portrait-carousel-viewport');
    const track = figure.querySelector('[data-portrait-track]');
    const prev = figure.querySelector('[data-portrait-prev]');
    const next = figure.querySelector('[data-portrait-next]');
    const dots = figure.querySelector('[data-portrait-dots]');
    const count = figure.querySelector('[data-portrait-count]');
    const fallbackSlide = figure.querySelector('[data-fallback-slide]');

    if (!viewport || !track || !fallbackSlide) return;

    // Probe the configured files. If the six new PNGs have not been added yet,
    // the existing single portrait remains intact instead of showing broken images.
    const resolved = (await Promise.all(candidates.map(loadImage))).filter(Boolean);
    if (!resolved.length) {
      if (count) count.textContent = '01 / 01';
      return;
    }

    const personName = key === 'nicky' ? 'Nicky' : 'Gina';
    const personRole = key === 'nicky' ? 'groom' : 'bride';

    const fragment = document.createDocumentFragment();
    resolved.forEach((source, index) => {
      const slide = document.createElement('div');
      slide.className = `portrait-carousel-slide${index === 0 ? ' is-active' : ''}`;
      slide.setAttribute('aria-hidden', String(index !== 0));

      const image = document.createElement('img');
      image.className = 'portrait-image';
      image.src = source;
      image.alt = `${personName}, the ${personRole} — portrait ${index + 1}`;
      image.decoding = 'async';
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.draggable = false;

      slide.appendChild(image);
      fragment.appendChild(slide);
    });

    track.replaceChildren(fragment);

    let current = 0;
    const total = resolved.length;

    const renderDots = () => {
      if (!dots) return;
      dots.replaceChildren();

      for (let index = 0; index < total; index += 1) {
        const button = document.createElement('button');
        button.className = `portrait-carousel-dot${index === 0 ? ' is-active' : ''}`;
        button.type = 'button';
        button.dataset.portraitIndex = String(index);
        button.setAttribute('aria-current', index === 0 ? 'true' : 'false');
        button.setAttribute(
          'aria-label',
          t('profiles.photoDotAria').replace('{number}', String(index + 1))
        );
        button.addEventListener('click', () => goTo(index));
        dots.appendChild(button);
      }

      dots.hidden = total <= 1;
    };

    const update = (animate = true) => {
      track.classList.toggle('no-transition', !animate);
      track.style.transform = `translate3d(${-current * 100}%, 0, 0)`;

      [...track.children].forEach((slide, index) => {
        const active = index === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });

      if (dots) {
        [...dots.children].forEach((dot, index) => {
          const active = index === current;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-current', active ? 'true' : 'false');
        });
      }

      if (count) count.textContent = `${formatCount(current + 1)} / ${formatCount(total)}`;

      if (!animate) {
        requestAnimationFrame(() => track.classList.remove('no-transition'));
      }
    };

    const goTo = index => {
      current = (index + total) % total;
      update(true);
    };

    renderDots();

    if (total > 1) {
      if (prev) {
        prev.hidden = false;
        prev.addEventListener('click', () => goTo(current - 1));
      }
      if (next) {
        next.hidden = false;
        next.addEventListener('click', () => goTo(current + 1));
      }
    }

    viewport.addEventListener('keydown', event => {
      if (total <= 1) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(current - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(current + 1);
      }
    });

    // Horizontal swipe while preserving normal vertical page scrolling.
    let pointerId = null;
    let startX = 0;
    let startY = 0;

    viewport.addEventListener('pointerdown', event => {
      if (total <= 1 || event.pointerType === 'mouse') return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      viewport.setPointerCapture?.(pointerId);
    });

    viewport.addEventListener('pointerup', event => {
      if (pointerId !== event.pointerId) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      pointerId = null;

      if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      goTo(deltaX < 0 ? current + 1 : current - 1);
    });

    viewport.addEventListener('pointercancel', () => {
      pointerId = null;
    });

    update(false);

    window.addEventListener('editorial:language-changed', () => {
      if (!dots) return;
      [...dots.children].forEach((dot, index) => {
        dot.setAttribute(
          'aria-label',
          t('profiles.photoDotAria').replace('{number}', String(index + 1))
        );
      });
    });
  };

  document.querySelectorAll('[data-couple-carousel]').forEach(initialiseCarousel);
})();

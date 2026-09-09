(() => {
  'use strict';

  const config = window.EDITORIAL_INVITE_CONFIG?.couplePortraits || {};
  const t = key => window.inviteI18n?.t(key) || key;
  const mobile = matchMedia('(max-width: 800px)').matches;

  const formatCount = value => String(value).padStart(2, '0');

  const initialiseCarousel = figure => {
    const key = figure.dataset.coupleCarousel;
    const settings = config[key] || {};
    const sources = Array.isArray(settings.images) ? settings.images.filter(Boolean) : [];

    const viewport = figure.querySelector('.portrait-carousel-viewport');
    const track = figure.querySelector('[data-portrait-track]');
    const prev = figure.querySelector('[data-portrait-prev]');
    const next = figure.querySelector('[data-portrait-next]');
    const dots = figure.querySelector('[data-portrait-dots]');
    const count = figure.querySelector('[data-portrait-count]');

    if (!viewport || !track || !sources.length) return;

    const personName = key === 'nicky' ? 'Nicky' : 'Gina';
    const personRole = key === 'nicky' ? 'groom' : 'bride';

    const fragment = document.createDocumentFragment();
    sources.forEach((source, index) => {
      const slide = document.createElement('div');
      slide.className = `portrait-carousel-slide${index === 0 ? ' is-active' : ''}`;
      slide.setAttribute('aria-hidden', String(index !== 0));

      const image = document.createElement('img');
      image.className = 'portrait-image portrait-image-lazy';
      image.dataset.src = source;
      image.alt = `${personName}, the ${personRole} — portrait ${index + 1}`;
      image.decoding = 'async';
      image.draggable = false;

      slide.appendChild(image);
      fragment.appendChild(slide);
    });
    track.replaceChildren(fragment);

    const slides = [...track.children];
    let current = 0;
    let activated = false;
    let lastDirection = 1;

    const ensureLoaded = index => {
      const normalized = (index + sources.length) % sources.length;
      const image = slides[normalized]?.querySelector('.portrait-image');
      if (!image || image.getAttribute('src')) return;

      image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
      image.src = image.dataset.src;
    };

    const releaseExcept = keep => {
      if (!mobile) return;
      const keepSet = new Set(keep.map(index => (index + sources.length) % sources.length));

      slides.forEach((slide, index) => {
        if (keepSet.has(index)) return;
        const image = slide.querySelector('.portrait-image');
        if (!image?.getAttribute('src')) return;
        image.removeAttribute('src');
        image.classList.remove('is-loaded');
      });
    };

    const warmCurrent = (direction = lastDirection) => {
      ensureLoaded(current);
      if (mobile && sources.length > 1) {
        const neighbor = current + (direction || 1);
        ensureLoaded(neighbor);
        window.setTimeout(() => releaseExcept([current, neighbor]), 420);
      } else if (!mobile) {
        sources.forEach((_, index) => ensureLoaded(index));
      }
    };

    const activate = () => {
      if (!activated) activated = true;
      warmCurrent(lastDirection);
    };

    const renderDots = () => {
      if (!dots) return;
      dots.replaceChildren();

      sources.forEach((_, index) => {
        const button = document.createElement('button');
        button.className = `portrait-carousel-dot${index === 0 ? ' is-active' : ''}`;
        button.type = 'button';
        button.dataset.portraitIndex = String(index);
        button.setAttribute('aria-current', index === 0 ? 'true' : 'false');
        button.setAttribute(
          'aria-label',
          t('profiles.photoDotAria').replace('{number}', String(index + 1))
        );
        button.addEventListener('click', () => goTo(index, index >= current ? 1 : -1));
        dots.appendChild(button);
      });

      dots.hidden = sources.length <= 1;
    };

    const update = (animate = true) => {
      track.classList.toggle('no-transition', !animate);
      track.style.transform = `translate3d(${-current * 100}%, 0, 0)`;

      slides.forEach((slide, index) => {
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

      if (count) count.textContent = `${formatCount(current + 1)} / ${formatCount(sources.length)}`;

      if (!animate) {
        requestAnimationFrame(() => track.classList.remove('no-transition'));
      }
    };

    const goTo = (index, direction = 0) => {
      const nextIndex = (index + sources.length) % sources.length;
      lastDirection = direction || (nextIndex >= current ? 1 : -1);
      current = nextIndex;
      activate();
      warmCurrent(lastDirection);
      update(true);
    };

    renderDots();

    if (sources.length > 1) {
      if (prev) {
        prev.hidden = false;
        prev.addEventListener('click', () => goTo(current - 1, -1));
      }
      if (next) {
        next.hidden = false;
        next.addEventListener('click', () => goTo(current + 1, 1));
      }
    }

    viewport.addEventListener('keydown', event => {
      if (sources.length <= 1) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(current - 1, -1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(current + 1, 1);
      }
    });

    let pointerId = null;
    let startX = 0;
    let startY = 0;

    viewport.addEventListener('pointerdown', event => {
      if (
        sources.length <= 1 ||
        event.pointerType === 'mouse' ||
        event.target.closest('button')
      ) {
        return;
      }
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
      goTo(deltaX < 0 ? current + 1 : current - 1, deltaX < 0 ? 1 : -1);
    });

    viewport.addEventListener('pointercancel', () => {
      pointerId = null;
    });

    update(false);

    if ('IntersectionObserver' in window) {
      const activationObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) activate();
      }, {
        rootMargin: mobile ? '180px 0px' : '600px 0px',
        threshold: 0.01
      });
      activationObserver.observe(figure);

      if (mobile) {
        const releaseObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting && activated) releaseExcept([]);
            if (entry.isIntersecting && activated) warmCurrent(lastDirection);
          });
        }, {
          rootMargin: '900px 0px',
          threshold: 0
        });
        releaseObserver.observe(figure);
      }
    } else {
      activate();
    }

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

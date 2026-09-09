(() => {
  'use strict';

  const config = window.EDITORIAL_INVITE_CONFIG?.couplePortraits || {};
  const t = key => window.inviteI18n?.t(key) || key;
  const isMobile = matchMedia('(max-width: 800px)').matches;
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

    if (!viewport || !track || !sources.length)
      return;

    const personName = key === 'nicky' ? 'Nicky' : 'Gina';
    const personRole = key === 'nicky' ? 'groom' : 'bride';
    let current = 0;
    let activeDirection = 1;
    let activated = false;
    let idlePreloadHandle = 0;
    const loadPromises = new Map();

    const fragment = document.createDocumentFragment();
    sources.forEach((source, index) => {
      const slide = document.createElement('div');
      slide.className = `portrait-carousel-slide${index === 0 ? ' is-active' : ''}`;
      slide.setAttribute('aria-hidden', String(index !== 0));

      const image = document.createElement('img');
      image.className = 'portrait-image';
      image.dataset.src = source;
      image.alt = `${personName}, the ${personRole} — portrait ${index + 1}`;
      image.decoding = 'async';
      image.loading = 'lazy';
      image.draggable = false;

      slide.appendChild(image);
      fragment.appendChild(slide);
    });
    track.replaceChildren(fragment);

    const slides = [...track.children];

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

    const ensureLoaded = index => {
      const slide = slides[index];
      const image = slide?.querySelector('img');
      if (!image) return Promise.resolve(false);
      if (image.getAttribute('src')) return Promise.resolve(true);
      if (loadPromises.has(index)) return loadPromises.get(index);

      const source = image.dataset.src;
      if (!source) return Promise.resolve(false);

      const promise = new Promise(resolve => {
        image.onload = () => {
          loadPromises.delete(index);
          resolve(true);
        };
        image.onerror = () => {
          loadPromises.delete(index);
          image.removeAttribute('src');
          resolve(false);
        };
        image.src = source;
      });

      loadPromises.set(index, promise);
      return promise;
    };

    const releaseExcept = keep => {
      if (!isMobile) return;
      const keepSet = new Set(keep);

      slides.forEach((slide, index) => {
        if (keepSet.has(index)) return;
        const image = slide.querySelector('img');
        if (!image?.getAttribute('src')) return;

        // Clearing off-screen image sources gives WebKit an opportunity to
        // release decoded bitmap memory while retaining the URL in data-src.
        image.removeAttribute('src');
      });
    };

    const scheduleNeighbour = direction => {
      if (sources.length <= 1) return;
      if ('cancelIdleCallback' in window && idlePreloadHandle)
        cancelIdleCallback(idlePreloadHandle);
      else if (idlePreloadHandle)
        clearTimeout(idlePreloadHandle);

      const neighbour = (current + direction + sources.length) % sources.length;
      const preload = () => {
        ensureLoaded(neighbour).then(() => {
          releaseExcept([current, neighbour]);
        });
      };

      idlePreloadHandle = 'requestIdleCallback' in window
        ? requestIdleCallback(preload, { timeout: 900 })
        : setTimeout(preload, 650);
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

      if (count)
        count.textContent = `${formatCount(current + 1)} / ${formatCount(sources.length)}`;

      if (!animate)
        requestAnimationFrame(() => track.classList.remove('no-transition'));
    };

    const goTo = async (index, direction = 1) => {
      if (!activated) await activate();
      const target = (index + sources.length) % sources.length;
      if (target === current) return;

      activeDirection = direction >= 0 ? 1 : -1;
      const loaded = await ensureLoaded(target);
      if (!loaded) return;

      current = target;
      update(true);

      // Retain the current slide and, after the transition, at most one
      // directionally useful neighbour on mobile.
      setTimeout(() => {
        releaseExcept([current]);
        scheduleNeighbour(activeDirection);
      }, 760);
    };

    const activate = async () => {
      if (activated) return;
      activated = true;
      figure.classList.add('portrait-carousel-ready');
      await ensureLoaded(0);
      update(false);
      scheduleNeighbour(1);
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
      if (sources.length <= 1 || (event.pointerType === 'mouse' && event.button !== 0))
        return;
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

    // Do not touch the portrait files until this chapter is approaching.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        activate();
        observer.disconnect();
      }, {
        rootMargin: isMobile ? '420px 0px' : '650px 0px',
        threshold: 0.01
      });
      observer.observe(figure);
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

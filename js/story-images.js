(() => {
  'use strict';

  const mobile = matchMedia('(max-width: 800px)').matches;
  const images = [...document.querySelectorAll('[data-story-src]')];
  if (!images.length) return;

  const load = image => {
    if (image.getAttribute('src')) return;
    image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
    image.src = image.dataset.storySrc;
  };

  if (!('IntersectionObserver' in window)) {
    images.forEach(load);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: mobile ? '80px 0px' : '600px 0px',
    threshold: 0.01
  });

  images.forEach(image => observer.observe(image));
})();

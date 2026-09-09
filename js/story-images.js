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

  const release = image => {
    if (!mobile || !image.getAttribute('src')) return;
    image.removeAttribute('src');
    image.classList.remove('is-loaded');
  };

  if (!('IntersectionObserver' in window)) {
    images.forEach(load);
    return;
  }

  const loadObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) load(entry.target);
    });
  }, {
    rootMargin: mobile ? '180px 0px' : '700px 0px',
    threshold: 0.01
  });

  images.forEach(image => loadObserver.observe(image));

  if (mobile) {
    const releaseObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) release(entry.target);
        else if (!entry.target.getAttribute('src')) load(entry.target);
      });
    }, {
      rootMargin: '1100px 0px',
      threshold: 0
    });

    images.forEach(image => releaseObserver.observe(image));
  }
})();

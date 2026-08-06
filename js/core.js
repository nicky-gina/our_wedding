/* =========================================================
 * CORE EXPERIENCE & CELESTIAL WORLD
 * Runtime module: core.js
 * ========================================================= */

(() => {
    'use strict';
    const root = document.documentElement;
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
    let worldStarsStarted = false;
    let stopWorldStars = () => {};

    // iOS/Chrome may still rubber-band a fixed cover when only the body is
    // overflow-locked. Lock both root and body until the cover is removed.
    root.classList.add('is-locked');

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

    const startWorldStars = () => {
        if (worldStarsStarted)
            return;

        worldStarsStarted = true;
        stopWorldStars = createStars(document.getElementById('starCanvas'), 210, false);
    };

    enterButton.addEventListener('click', () => {
        if (invitationOpened)
            return;

        invitationOpened = true;
        enterButton.disabled = true;

        // Keep the document fully locked while the cover fades. The main star
        // canvas starts only after the cover is removed, avoiding two animated
        // full-screen canvases competing during the transition on mobile.
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        prelude.classList.add('is-hidden');
        prelude.setAttribute('aria-hidden', 'true');
        stopPreludeStars();

        experience.classList.add('is-visible');
        experience.setAttribute('aria-hidden', 'false');

        const completeOpening = () => {
            prelude.remove();
            root.classList.remove('is-locked');
            body.classList.remove('is-locked');

            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                startWorldStars();
                const prologue = document.getElementById('prologue');
                scenes.forEach(scene => scene.classList.toggle('is-active', scene === prologue));
                updateChapterProgress(prologue);
            });
        };

        window.setTimeout(completeOpening, reducedMotion ? 0 : 900);

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
        if (!invitationOpened)
            return;

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

    // Cinematic interludes reveal near the viewport centre, then fade upward
    // as the guest scrolls toward the following chapter. The exit state keeps
    // transform/opacity-only animation for mobile renderer safety.
    const narratives = [...document.querySelectorAll('[data-narrative]')];
    if (reducedMotion) {
        narratives.forEach(item => item.classList.add('is-visible'));
    } else {
        const narrativeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const narrative = entry.target;
                const hasPassedViewportTop = entry.boundingClientRect.top < 0;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.34) {
                    narrative.classList.add('is-visible');
                    return;
                }

                if (!hasPassedViewportTop) {
                    narrative.classList.remove('is-visible', 'is-exiting');
                }
            });
        }, {
            threshold: [0, 0.18, 0.34, 0.55, 0.72],
            rootMargin: '-12% 0px -12% 0px'
        });
        narratives.forEach(item => narrativeObserver.observe(item));
    }
    let ticking = false;
    function updateScroll() {
        if (!invitationOpened) {
            ticking = false;
            return;
        }

        const max = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;

        // Start the interlude exit as soon as its content reaches the top
        // quarter of the viewport. Checking this in the existing rAF scroll
        // loop is both precise and inexpensive because there are only four
        // narrative dividers.
        if (!reducedMotion) {
            const exitLine = innerHeight * 0.25;
            narratives.forEach(narrative => {
                if (!narrative.classList.contains('is-visible'))
                    return;

                const content = narrative.querySelector('.scroll-narrative-inner') || narrative;
                const rect = content.getBoundingClientRect();
                const shouldExit = rect.top <= exitLine && rect.bottom > 0;
                narrative.classList.toggle('is-exiting', shouldExit);
            });
        }

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

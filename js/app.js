(function () {
    'use strict';

    var FILMSTRIP_STEPS = 25;
    var FILMSTRIP_DELAY = 5000;
    var IMAGE_BREAKPOINT = 540;
    var imageBreakpointCrossed = false;

    // -------------------------------------------------------
    // Filmstrip
    // -------------------------------------------------------

    function getFilmstrips() {
        return document.querySelectorAll('.filmstrip');
    }

    function animateFilmstrip(el) {
        var current = parseInt(el.dataset.index || '0', 10);
        var height = el.offsetHeight;
        var next;

        if (current >= FILMSTRIP_STEPS) {
            el.classList.remove('animated');
            next = 0;
            // force reflow so transition doesn't fire on the reset
            void el.offsetHeight;
            el.classList.add('animated');
        } else {
            next = current + 1;
        }

        el.dataset.index = next;
        el.style.backgroundPosition = '0 -' + (next * height) + 'px';
    }

    function animateRandomFilmstrip() {
        var strips = getFilmstrips();
        if (!strips.length) return;
        var i = Math.floor(Math.random() * strips.length);
        animateFilmstrip(strips[i]);
    }

    function setRandomFilmstripPositions() {
        getFilmstrips().forEach(function (el) {
            var index = Math.floor(Math.random() * (FILMSTRIP_STEPS + 1));
            el.dataset.index = index;
            el.style.backgroundPosition = '0 -' + (index * el.offsetHeight) + 'px';
        });
    }

    function resizeFilmstrips() {
        var outerWrapper = document.querySelector('.filmstrip-outer-wrapper');
        if (!outerWrapper) return;

        var visibleWrappers = outerWrapper.querySelectorAll('.filmstrip-wrapper:not([style*="display: none"])');
        // account for display:none wrappers via CSS, count visible ones
        var wrapperEls = Array.from(outerWrapper.querySelectorAll('.filmstrip-wrapper')).filter(function (w) {
            return w.offsetParent !== null;
        });
        if (!wrapperEls.length) return;

        var totalWidth = outerWrapper.offsetWidth;
        var filmstripWidth = Math.floor(totalWidth / wrapperEls.length) - 2;
        // aspect ratio: original height 192, width 289
        var filmstripHeight = Math.floor((289 / 192) * filmstripWidth);

        wrapperEls.forEach(function (w) {
            w.style.width = filmstripWidth + 'px';
            w.style.height = filmstripHeight + 'px';
        });

        setRandomFilmstripPositions();
    }

    // -------------------------------------------------------
    // Lazy image loading (IntersectionObserver)
    // -------------------------------------------------------

    function initLazyImages() {
        var images = document.querySelectorAll('img[data-src]');
        if (!images.length) return;

        if (!('IntersectionObserver' in window)) {
            // fallback: load all immediately
            images.forEach(loadImage);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '500px' });

        images.forEach(function (img) {
            observer.observe(img);
        });
    }

    function loadImage(img) {
        var src = img.dataset.src;
        if (!src) return;
        img.src = src;
        img.addEventListener('load', function () {
            img.classList.add('visible');
        }, { once: true });
        // if already cached, force visible
        if (img.complete) img.classList.add('visible');
    }

    // -------------------------------------------------------
    // Adaptive images (swap mobile → web above breakpoint)
    // -------------------------------------------------------

    function updateAdaptiveImages() {
        if (imageBreakpointCrossed) return;
        if (window.innerWidth < IMAGE_BREAKPOINT) return;

        document.querySelectorAll('img.adaptive[data-src]').forEach(function (img) {
            var src = img.dataset.src.replace('-mobile', '-web');
            img.dataset.src = src;
            if (img.classList.contains('visible')) {
                img.src = src;
            }
        });

        imageBreakpointCrossed = true;
    }

    // -------------------------------------------------------
    // Credits overlay
    // -------------------------------------------------------

    function initCredits() {
        var credits = document.querySelector('.credits');
        var trigger = document.querySelector('.x-slug a');
        var closeBtn = document.querySelector('.credits .close-button');
        if (!credits) return;

        function openCredits(e) {
            e.preventDefault();
            credits.style.display = 'block';
            // next frame so transition fires
            requestAnimationFrame(function () {
                credits.classList.add('visible');
            });
        }

        function closeCredits() {
            credits.classList.remove('visible');
            credits.addEventListener('transitionend', function handler() {
                credits.style.display = 'none';
                credits.removeEventListener('transitionend', handler);
            });
        }

        if (trigger) trigger.addEventListener('click', openCredits);
        if (closeBtn) closeBtn.addEventListener('click', closeCredits);

        credits.addEventListener('click', function (e) {
            // close when clicking outside the inner column
            if (e.target === credits) closeCredits();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) closeCredits();
        });
    }

    // -------------------------------------------------------
    // Bottom nav reveal on scroll
    // -------------------------------------------------------

    function initBottomNav() {
        var btns = document.querySelectorAll('.bottom-nav .bn-btn');
        if (!btns.length) return;

        window.addEventListener('scroll', function () {
            var nearBottom = (window.scrollY + window.innerHeight) > (document.documentElement.scrollHeight - 100);
            btns.forEach(function (btn) {
                btn.classList.toggle('expanded', nearBottom);
            });
        });
    }

    // -------------------------------------------------------
    // Resize handler
    // -------------------------------------------------------

    var resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            updateAdaptiveImages();
            resizeFilmstrips();
        }, 100);
    }

    // -------------------------------------------------------
    // Init
    // -------------------------------------------------------

    document.addEventListener('DOMContentLoaded', function () {
        updateAdaptiveImages();
        resizeFilmstrips();
        setInterval(animateRandomFilmstrip, FILMSTRIP_DELAY);

        initLazyImages();
        initCredits();
        initBottomNav();

        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
    });

}());

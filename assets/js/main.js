/* ==========================================================================
   ENGAGE TECH SOLUTIONS — site behaviour
   Progressive enhancement only: every page is fully readable and navigable
   with JavaScript disabled. FAQ accordions are native <details>; the mobile
   drawer falls back to the footer sitemap; nothing here gates content.
   WP: enqueue in the footer with no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- utils */
  function onScroll(fn) {
    var ticking = false;
    function run() { ticking = false; fn(); }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(run); }
    }, { passive: true });
    fn();
  }

  /* ------------------------------------------------- 01 · sticky header */
  /* Compresses 72px -> 58px after 120px of scroll (spec table). */
  var header = document.querySelector('.site-header');
  if (header) {
    onScroll(function () {
      header.classList.toggle('is-compact', window.scrollY > 120);
    });
  }

  /* ---------------------------------------------------- 02 · mega menu */
  /* Hover-intent: 120ms in, 240ms out. Click and keyboard work identically,
     so the menu is operable by touch and by screen reader. */
  var megaWraps = document.querySelectorAll('.has-mega');
  var IN_DELAY = 120, OUT_DELAY = 240;

  Array.prototype.forEach.call(megaWraps, function (wrap) {
    var toggle = wrap.querySelector('.nav-toggle');
    var panel = wrap.querySelector('.mega');
    if (!toggle || !panel) return;
    var tIn = null, tOut = null;

    function open() {
      closeAll(panel);
      panel.setAttribute('data-open', 'true');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      panel.setAttribute('data-open', 'false');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function scheduleOpen() { clearTimeout(tOut); tIn = setTimeout(open, IN_DELAY); }
    function scheduleClose() { clearTimeout(tIn); tOut = setTimeout(close, OUT_DELAY); }

    wrap.addEventListener('mouseenter', scheduleOpen);
    wrap.addEventListener('mouseleave', scheduleClose);
    panel.addEventListener('mouseenter', function () { clearTimeout(tOut); });
    panel.addEventListener('mouseleave', scheduleClose);

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      clearTimeout(tIn); clearTimeout(tOut);
      if (toggle.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
    });
    wrap.addEventListener('focusin', open);
    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) close();
    });
  });

  function closeAll(except) {
    Array.prototype.forEach.call(document.querySelectorAll('.mega'), function (p) {
      if (p === except) return;
      p.setAttribute('data-open', 'false');
      var wrap = p.closest('.has-mega');
      var t = wrap && wrap.querySelector('.nav-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(null); closeDrawer(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-mega')) closeAll(null);
  });

  /* ------------------------------------------------ 03 · mobile drawer */
  var drawer = document.getElementById('nav-drawer');
  var burger = document.querySelector('.nav-burger');
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    if (burger) burger.setAttribute('aria-expanded', 'true');
    var first = drawer.querySelector('.drawer-close');
    if (first) first.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.getAttribute('data-open') !== 'true') return;
    drawer.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  if (burger) burger.addEventListener('click', openDrawer);
  if (drawer) {
    Array.prototype.forEach.call(
      drawer.querySelectorAll('.drawer-close, .drawer-scrim'),
      function (el) { el.addEventListener('click', closeDrawer); }
    );
    /* keep focus inside the drawer while it is open */
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = drawer.querySelectorAll('a[href], button:not([disabled]), summary');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ------------------------------------- 04 · persistent bottom CTA bar */
  /* Appears after 25% scroll on mobile (spec table). */
  var bar = document.querySelector('.mobile-bar');
  if (bar) {
    onScroll(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? window.scrollY / h : 0;
      bar.setAttribute('data-show', pct > 0.25 ? 'true' : 'false');
    });
  }

  /* --------------------------------------------- 05 · reading progress */
  var prog = document.querySelector('.progressbar i');
  if (prog) {
    onScroll(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      prog.style.width = (pct * 100).toFixed(2) + '%';
    });
  }

  /* ---------------------------------------------- 06 · ToC scroll-spy */
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var targets = [];
    Array.prototype.forEach.call(tocLinks, function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) targets.push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Array.prototype.forEach.call(tocLinks, function (a) {
          a.classList.toggle('on', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------ 07 · contact tabs */
  var tablists = document.querySelectorAll('[role="tablist"]');
  Array.prototype.forEach.call(tablists, function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');

    function select(tab) {
      Array.prototype.forEach.call(tabs, function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.setAttribute('tabindex', selected ? '0' : '-1');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { if (selected) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); } }
      });
    }
    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* ---------------------------------- 08 · smooth in-page anchor scroll */
  if (!reduceMotion) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]:not([href="#"])');
      if (!a) return;
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      var offset = (header ? header.offsetHeight : 0) + 16;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  }
})();

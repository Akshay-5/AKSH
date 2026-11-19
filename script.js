/* =========================================================
   spark // portfolio scripts
   ========================================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* -------------------------------------------------------
     1. Boot overlay
     ------------------------------------------------------- */
  const boot = document.getElementById('boot');
  const bootLines = document.getElementById('bootLines');

  const BOOT_TEXT = [
    '[ ok ] initializing secure shell...',
    '[ ok ] loading profile: spark',
    '[ ok ] access granted',
  ];

  function closeBoot() {
    if (!boot || boot.classList.contains('is-done')) return;
    boot.classList.add('is-done');
    setTimeout(() => boot.remove(), 500);
  }

  async function runBoot() {
    if (!boot) return;

    if (reduceMotion) {
      closeBoot();
      startHero();
      return;
    }

    let out = '';
    for (const line of BOOT_TEXT) {
      out += line + '\n';
      bootLines.textContent = out;
      await sleep(170);
    }
    await sleep(260);
    closeBoot();
    startHero();
  }

  // let impatient visitors skip it
  ['click', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (boot && !boot.classList.contains('is-done')) {
        closeBoot();
        startHero();
      }
    }, { once: true, passive: true });
  });

  // safety net: never let the overlay trap the page
  setTimeout(() => { closeBoot(); startHero(); }, 3500);

  /* -------------------------------------------------------
     2. Hero typing effect
     ------------------------------------------------------- */
  const typedEl = document.getElementById('typed');
  const heroEl = document.querySelector('.hero');
  const heroCursor = document.getElementById('heroCursor');
  let heroStarted = false;

  async function startHero() {
    if (heroStarted || !typedEl || !heroEl) return;
    heroStarted = true;

    const word = 'whoami';

    if (reduceMotion) {
      typedEl.textContent = word;
      heroEl.classList.add('is-ready');
      if (heroCursor) heroCursor.classList.add('is-hidden');
      return;
    }

    for (let i = 0; i < word.length; i++) {
      typedEl.textContent += word[i];
      await sleep(95);
    }
    await sleep(220);
    heroEl.classList.add('is-ready');
    if (heroCursor) heroCursor.classList.add('is-hidden');
  }

  if (document.readyState === 'complete') {
    runBoot();
  } else {
    window.addEventListener('load', runBoot);
  }

  /* -------------------------------------------------------
     3. Scroll reveal
     ------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    // stagger cards that sit in the same grid
    document.querySelectorAll('.skills, .projects, .profiles').forEach((grid) => {
      [...grid.children].forEach((child, i) => {
        if (child.classList.contains('reveal')) {
          child.style.setProperty('--d', `${i * 70}ms`);
        }
      });
    });

    document.querySelectorAll('.timeline').forEach((list) => {
      [...list.children].forEach((child, i) => {
        if (child.classList.contains('reveal')) {
          child.style.setProperty('--d', `${i * 90}ms`);
        }
      });
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -------------------------------------------------------
     4. Sticky nav styling + active link
     ------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const navLinks = [...document.querySelectorAll('.nav__menu a')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isMatch = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-active', isMatch);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((section) => spy.observe(section));
  }

  /* -------------------------------------------------------
     5. Mobile menu
     ------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function setMenu(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      setMenu(!nav.classList.contains('is-open'));
    });
  }

  if (navMenu) {
    navMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  });

  /* -------------------------------------------------------
     6. Copy email
     ------------------------------------------------------- */
  const copyBtn = document.getElementById('copyMail');

  if (copyBtn) {
    const original = copyBtn.textContent;

    copyBtn.addEventListener('click', async () => {
      const mail = copyBtn.dataset.mail || '';
      try {
        await navigator.clipboard.writeText(mail);
        copyBtn.textContent = 'copied ✓';
      } catch {
        // clipboard API blocked — select the text instead
        copyBtn.textContent = 'press ctrl+c';
        const range = document.createRange();
        const mailEl = document.querySelector('.contact__mail');
        if (mailEl) {
          range.selectNodeContents(mailEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      setTimeout(() => { copyBtn.textContent = original; }, 2000);
    });
  }

  /* -------------------------------------------------------
     7. Footer year
     ------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
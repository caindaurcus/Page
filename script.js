/* ══════════════════════════════════════════
   AURCUS ONLINE — Community Hub v6
   script.js — Particles, UI & Interactions
   ══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── PARTICLE SYSTEM ─────────────────────
     Two layers:
       1. Ambient dust — tiny slow-moving sparks
       2. Gold flares   — rare bright streaks
  ──────────────────────────────────────────── */
  const PARTICLE_CONFIG = {
    dust: {
      count: 55,
      minSize: 1.2, maxSize: 2.8,
      minDuration: 18, maxDuration: 38,
      minDelay: 0, maxDelay: 30,
      colors: [
        'rgba(212,175,55,.55)',
        'rgba(212,175,55,.35)',
        'rgba(240,204,90,.45)',
        'rgba(0,220,200,.25)',
        'rgba(0,220,200,.15)',
        'rgba(200,192,176,.2)',
      ],
    },
    flare: {
      count: 8,
      minSize: 3, maxSize: 5,
      minDuration: 40, maxDuration: 70,
      minDelay: 0, maxDelay: 60,
      colors: [
        'rgba(212,175,55,.9)',
        'rgba(240,204,90,.8)',
        'rgba(255,220,100,.7)',
      ],
    },
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle(cfg, type) {
    const el = document.createElement('div');
    const size = rand(cfg.minSize, cfg.maxSize);
    const duration = rand(cfg.minDuration, cfg.maxDuration);
    const delay = rand(cfg.minDelay, cfg.maxDelay);
    const startX = rand(0, 100);
    const driftX = rand(-15, 15);
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

    el.style.cssText = `
      position: absolute;
      bottom: -10px;
      left: ${startX}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color};
      animation: particleFloat${type} ${duration}s ${delay}s ease-in-out infinite;
      --drift: ${driftX}vw;
      pointer-events: none;
    `;
    return el;
  }

  function injectParticleKeyframes() {
    if (document.getElementById('aurcus-particle-kf')) return;
    const style = document.createElement('style');
    style.id = 'aurcus-particle-kf';
    style.textContent = `
      @keyframes particleFloatdust {
        0%   { transform: translateY(0) translateX(0) scale(1);    opacity: 0; }
        8%   { opacity: 1; }
        50%  { transform: translateY(-50vh) translateX(calc(var(--drift) * .5)) scale(1.1); opacity: .8; }
        92%  { opacity: .3; }
        100% { transform: translateY(-102vh) translateX(var(--drift)) scale(.6);  opacity: 0; }
      }
      @keyframes particleFloatflare {
        0%   { transform: translateY(0) translateX(0) scale(.8);  opacity: 0; }
        5%   { opacity: 1; }
        30%  { transform: translateY(-25vh) translateX(calc(var(--drift) * .3)) scale(1.3); opacity: .9; }
        70%  { transform: translateY(-65vh) translateX(calc(var(--drift) * .7)) scale(1);   opacity: .5; }
        95%  { opacity: .1; }
        100% { transform: translateY(-105vh) translateX(var(--drift)) scale(.4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function initParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;

    injectParticleKeyframes();

    const frag = document.createDocumentFragment();
    for (let i = 0; i < PARTICLE_CONFIG.dust.count; i++) {
      frag.appendChild(createParticle(PARTICLE_CONFIG.dust, 'dust'));
    }
    for (let i = 0; i < PARTICLE_CONFIG.flare.count; i++) {
      frag.appendChild(createParticle(PARTICLE_CONFIG.flare, 'flare'));
    }
    container.appendChild(frag);
  }

  /* ── COUNTER ANIMATION ───────────────────── */
  function animateCounters() {
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const startTime = performance.now();

      function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(easeOut(progress) * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(tick);
    });
  }

  /* ── COUNTDOWN TIMER ─────────────────────── */
  function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    // 24h countdown seeded by day
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    let remaining = midnight - now;

    function fmt(ms) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    }

    el.textContent = fmt(remaining);
    const iv = setInterval(() => {
      remaining -= 1000;
      if (remaining <= 0) { clearInterval(iv); el.textContent = '00:00:00'; return; }
      el.textContent = fmt(remaining);
    }, 1000);
  }

  /* ── ONLINE COUNT PULSE ──────────────────── */
  function initOnlinePulse() {
    const els = [
      document.getElementById('onlineCount'),
      document.getElementById('drawerOnline'),
    ];
    const base = 1247;
    function update() {
      const delta = Math.floor(Math.random() * 5) - 2;
      const val = Math.max(base + delta, base - 10);
      els.forEach(el => { if (el) el.textContent = val.toLocaleString(); });
    }
    setInterval(update, 7000);
  }

  /* ── HAMBURGER / DRAWER ──────────────────── */
  function initDrawer() {
    const hamburger = document.getElementById('hamburger');
    const drawer    = document.getElementById('drawer');
    const overlay   = document.getElementById('drawerOverlay');
    const closeBtn  = document.getElementById('drawerClose');
    if (!hamburger || !drawer) return;

    function open() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      hamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () =>
      drawer.classList.contains('open') ? close() : open()
    );
    overlay.addEventListener('click', close);
    closeBtn && closeBtn.addEventListener('click', close);

    // Close on nav item click (mobile UX)
    drawer.querySelectorAll('.drawer-item').forEach(item =>
      item.addEventListener('click', close)
    );
  }

  /* ── SPA NAVIGATION ──────────────────────── */
  function initNavigation() {
    const views = document.querySelectorAll('.view');

    function showView(name) {
      views.forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Highlight active drawer item
      document.querySelectorAll('.drawer-item').forEach(item => {
        item.classList.toggle('active', item.dataset.nav === name);
      });

      // Flash
      flashOverlay();
    }

    function flashOverlay() {
      const overlay = document.getElementById('flash-overlay');
      if (!overlay) return;
      overlay.classList.add('flash');
      setTimeout(() => overlay.classList.remove('flash'), 300);
    }

    // Delegate all [data-nav] clicks
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-nav]');
      if (!trigger) return;
      e.preventDefault();
      const nav = trigger.dataset.nav;
      if (nav) showView(nav);
    });
  }

  /* ── LANG SELECTOR ───────────────────────── */
  function initLangSelector() {
    const toggle   = document.getElementById('langToggle');
    const dropdown = document.getElementById('langDropdown');
    const current  = document.getElementById('langCurrent');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    dropdown.querySelectorAll('.lang-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        dropdown.querySelectorAll('.lang-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (current) current.textContent = opt.dataset.lang.toUpperCase();
        dropdown.classList.remove('open');
        applyLang(opt.dataset.lang);
      });
    });

    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', e => e.stopPropagation());
  }

  /* ── i18n ────────────────────────────────── */
  function applyLang(lang) {
    if (!window.TRANSLATIONS || !window.TRANSLATIONS[lang]) return;
    const T = window.TRANSLATIONS[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (T[key]) el.textContent = T[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.dataset.i18nPh;
      if (T[key]) el.placeholder = T[key];
    });
  }

  /* ── CARD SHINE (mousemove) ──────────────── */
  function initCardShine() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotX = ((y - cy) / cy) * -6;
        const rotY = ((x - cx) / cx) * 6;
        card.style.transform = `translateY(-3px) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ── CODE COPY ───────────────────────────── */
  function copyCode(btn) {
    const block = btn.closest('.code-card')?.querySelector('pre');
    if (!block) return;
    const text = block.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1800);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }
  // Expose globally for inline onclick
  window.copyCode = copyCode;

  /* ── AVATAR GENERATOR ────────────────────── */
  function gav(name) {
    const letter = (name || '?')[0].toUpperCase();
    const classIdx = (name || '').charCodeAt(0) % 6;
    return `<span class="avatar-${classIdx}">${letter}</span>`;
  }
  window.gav = gav;

  /* ── SCROLL-TRIGGERED REVEAL ─────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;

    const style = document.createElement('style');
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(18px); transition: opacity .5s ease, transform .5s ease; }
      .reveal.visible { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);

    const targets = [
      '.market-row', '.rank-yt-card', '.seller-card',
      '.post-card', '.news-row', '.code-card',
      '.social-card', '.rule-item',
    ];

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    // Re-run on DOM mutations (Supabase real-time inserts)
    const mutObs = new MutationObserver(() => {
      targets.forEach(sel => {
        document.querySelectorAll(`${sel}:not(.reveal)`).forEach(el => {
          el.classList.add('reveal');
          obs.observe(el);
        });
      });
    });
    mutObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ── NAVBAR SCROLL EFFECT ─────────────────── */
  function initNavbarScroll() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.style.boxShadow = y > 40
        ? '0 2px 40px rgba(0,0,0,.6), 0 1px 0 rgba(212,175,55,.12)'
        : '0 1px 30px rgba(212,175,55,.06)';
      lastY = y;
    }, { passive: true });
  }

  /* ── HERO PARALLAX (subtle) ──────────────── */
  function initParallax() {
    const heroGlow = document.querySelector('.hero-glow');
    const heroDeco = document.querySelector('.hero-deco');
    if (!heroGlow || !heroDeco) return;

    window.addEventListener('mousemove', e => {
      const xRatio = (e.clientX / window.innerWidth - .5) * 2;
      const yRatio = (e.clientY / window.innerHeight - .5) * 2;
      heroGlow.style.transform = `translate(${xRatio * 10}px, ${yRatio * 8}px)`;
      heroDeco.style.transform = `translate(${xRatio * 5}px, ${yRatio * 4}px)`;
    }, { passive: true });
  }

  /* ── PAGE LOAD ENTRANCE ──────────────────── */
  function initEntrance() {
    const hero = document.querySelector('.hero-inner');
    if (!hero) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes heroFadeIn {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .hero-eyebrow  { animation: heroFadeIn .7s .1s both ease-out; }
      .hero-title    { animation: heroFadeIn .7s .25s both ease-out; }
      .hero-subtitle { animation: heroFadeIn .7s .4s both ease-out; }
      .hero-badge-row{ animation: heroFadeIn .7s .5s both ease-out; }
      .hero-stats    { animation: heroFadeIn .7s .6s both ease-out; }
      .hero-cta      { animation: heroFadeIn .7s .72s both ease-out; }
    `;
    document.head.appendChild(style);

    // Trigger counter only after hero is visible
    setTimeout(animateCounters, 600);
  }

  /* ── INIT ────────────────────────────────── */
  function init() {
    initParticles();
    initEntrance();
    initDrawer();
    initNavigation();
    initLangSelector();
    initCountdown();
    initOnlinePulse();
    initCardShine();
    initReveal();
    initNavbarScroll();

    // Parallax only on desktop
    if (window.matchMedia('(pointer: fine)').matches) {
      initParallax();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

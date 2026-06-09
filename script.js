/* ═══════════════════════════════════════════════════════════════════
   AURCUS ONLINE — Community Hub v6
   script.js  ·  BLOOD VOID Edition
   Particle System + Animations + UI Engine
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── CONSTANTS ───────────────────────────────────────────────────── */
const C = {
  CRIMSON:      'rgba(192,24,58,',
  CRIMSON_HI:   'rgba(232,32,74,',
  EMBER:        'rgba(255,107,43,',
  SILVER:       'rgba(200,196,216,',
  WHITE:        'rgba(255,255,255,',

  PARTICLE_COUNT:       90,
  SPARK_COUNT:          18,
  BLOOD_MOTE_COUNT:     26,
  AMBIENT_ORB_COUNT:    4,
  CURSOR_TRAIL_LENGTH:  18,

  FPS_TARGET:           60,
  FRAME_MS:             1000 / 60,
};


/* ══════════════════════════════════════════════════════════════════
   § 1 — UTILITY HELPERS
═══════════════════════════════════════════════════════════════════ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const lerp   = (a, b, t) => a + (b - a) * t;
const clamp  = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const rand   = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt= (lo, hi) => Math.floor(rand(lo, hi + 1));
const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Thin event bus */
const Bus = (() => {
  const _m = {};
  return {
    on:   (e, fn) => (_m[e] = _m[e] || []).push(fn),
    off:  (e, fn) => { _m[e] = (_m[e] || []).filter(f => f !== fn); },
    emit: (e, d)  => (_m[e] || []).forEach(fn => fn(d)),
  };
})();


/* ══════════════════════════════════════════════════════════════════
   § 2 — CANVAS PARTICLE ENGINE
═══════════════════════════════════════════════════════════════════ */

class ParticleEngine {
  constructor(container) {
    this.container = container;
    this.canvas    = document.createElement('canvas');
    this.ctx       = this.canvas.getContext('2d');
    this.particles = [];
    this.sparks    = [];
    this.motes     = [];
    this.orbs      = [];
    this.mouse     = { x: -999, y: -999 };
    this.cursorTrail = [];
    this.raf       = null;
    this._lastTime = 0;
    this._paused   = false;
    this._dpr      = Math.min(window.devicePixelRatio || 1, 2);

    this._setupCanvas();
    this._spawnAll();
    this._bindEvents();
    this._tick(0);
  }

  /* ── canvas setup ── */
  _setupCanvas() {
    const { canvas, container } = this;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.style.position = 'relative';
    container.appendChild(canvas);
    this._resize();
  }

  _resize() {
    const { canvas, _dpr } = this;
    const w = this.container.offsetWidth  || window.innerWidth;
    const h = this.container.offsetHeight || window.innerHeight;
    canvas.width  = w * _dpr;
    canvas.height = h * _dpr;
    this.W = w;
    this.H = h;
    this.ctx.scale(_dpr, _dpr);
  }

  /* ── spawn helpers ── */
  _spawnParticle(i) {
    const types  = ['dust', 'blood', 'ember', 'silver'];
    const type   = rand(0,1) < .55 ? 'dust' : rand(0,1) < .55 ? 'blood' : rand(0,1) < .5 ? 'ember' : 'silver';
    return {
      type,
      x:    rand(0, this.W),
      y:    rand(0, this.H),
      vx:   rand(-0.12, 0.12),
      vy:   rand(-0.35, -0.05),
      size: type === 'dust' ? rand(.6, 1.4) : rand(.8, 2.0),
      life: rand(.3, 1.0),
      maxLife: rand(.3, 1.0),
      alpha: 0,
      fadeIn: true,
      drift: rand(-0.003, 0.003),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.006, 0.018),
    };
  }

  _spawnSpark() {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.4, 1.2);
    return {
      x:    rand(0, this.W),
      y:    rand(0, this.H),
      vx:   Math.cos(angle) * speed,
      vy:   Math.sin(angle) * speed - .6,
      size: rand(0.6, 1.5),
      life: 1,
      decay: rand(0.004, 0.009),
      trail: [],
      glow: rand(0,1) < .5,
    };
  }

  _spawnMote(i) {
    return {
      x:      rand(0, this.W),
      y:      rand(this.H * 0.2, this.H),
      size:   rand(1.5, 3.5),
      opacity: 0,
      maxOpacity: rand(0.04, 0.14),
      speed:  rand(0.06, 0.22),
      drift:  rand(-0.04, 0.04),
      phase:  rand(0, Math.PI * 2),
      phaseSpeed: rand(0.003, 0.009),
      rising: true,
    };
  }

  _spawnOrb(i) {
    const configs = [
      { cx: 0.5,  cy: 0.0,  rx: 0.32, ry: 0.28, col: C.CRIMSON,  alpha: 0.055 },
      { cx: 0.15, cy: 0.55, rx: 0.18, ry: 0.15, col: C.CRIMSON,  alpha: 0.030 },
      { cx: 0.85, cy: 0.70, rx: 0.20, ry: 0.16, col: C.EMBER,    alpha: 0.022 },
      { cx: 0.5,  cy: 1.0,  rx: 0.40, ry: 0.20, col: C.CRIMSON,  alpha: 0.018 },
    ];
    const cfg = configs[i % configs.length];
    return { ...cfg, breathPhase: rand(0, Math.PI * 2), breathSpeed: rand(0.003, 0.007) };
  }

  _spawnAll() {
    for (let i = 0; i < C.PARTICLE_COUNT;   i++) this.particles.push(this._spawnParticle(i));
    for (let i = 0; i < C.SPARK_COUNT;      i++) this.sparks.push(this._spawnSpark());
    for (let i = 0; i < C.BLOOD_MOTE_COUNT; i++) this.motes.push(this._spawnMote(i));
    for (let i = 0; i < C.AMBIENT_ORB_COUNT;i++) this.orbs.push(this._spawnOrb(i));
  }

  /* ── event bindings ── */
  _bindEvents() {
    window.addEventListener('resize', () => {
      this.ctx.setTransform(1,0,0,1,0,0);
      this._resize();
    });

    window.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.cursorTrail.push({ x: this.mouse.x, y: this.mouse.y, t: 1 });
      if (this.cursorTrail.length > C.CURSOR_TRAIL_LENGTH) this.cursorTrail.shift();
    });

    /* spawn burst on click */
    window.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      this._burstAt(e.clientX - rect.left, e.clientY - rect.top);
    });

    /* pause when tab hidden */
    document.addEventListener('visibilitychange', () => {
      this._paused = document.hidden;
      if (!this._paused) this._tick(performance.now());
    });
  }

  /* ── burst on click ── */
  _burstAt(x, y) {
    const count = randInt(7, 14);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(1.2, 3.5);
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1, 2.2),
        life: 1,
        decay: rand(0.018, 0.035),
        trail: [],
        glow: true,
        burst: true,
      });
    }
    /* flash overlay */
    const flash = $('#flash-overlay');
    if (flash) {
      flash.classList.add('flash');
      setTimeout(() => flash.classList.remove('flash'), 250);
    }
  }

  /* ══ DRAW METHODS ════════════════════════════════════════════════ */

  _drawOrbs(t) {
    const { ctx, W, H } = this;
    for (const orb of this.orbs) {
      orb.breathPhase += orb.breathSpeed;
      const breathe = 1 + Math.sin(orb.breathPhase) * 0.12;
      const cx = orb.cx * W;
      const cy = orb.cy * H;
      const rx = orb.rx * W * breathe;
      const ry = orb.ry * H * breathe;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      grd.addColorStop(0,   orb.col + orb.alpha + ')');
      grd.addColorStop(0.5, orb.col + (orb.alpha * 0.5) + ')');
      grd.addColorStop(1,   orb.col + '0)');
      ctx.save();
      ctx.scale(rx / Math.max(rx,ry), ry / Math.max(rx,ry));
      ctx.beginPath();
      ctx.arc(cx * Math.max(rx,ry)/rx, cy * Math.max(rx,ry)/ry, Math.max(rx, ry), 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    }
  }

  _drawParticles(t) {
    const { ctx, mouse, W, H } = this;
    const colorMap = {
      dust:   C.SILVER,
      blood:  C.CRIMSON,
      ember:  C.EMBER,
      silver: C.WHITE,
    };

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      /* mouse repulsion */
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90) {
        const force = (90 - dist) / 90;
        p.vx += (dx / dist) * force * 0.08;
        p.vy += (dy / dist) * force * 0.08;
      }

      /* physics */
      p.wobble  += p.wobbleSpeed;
      p.vx      += p.drift + Math.sin(p.wobble) * 0.003;
      p.vx      *= 0.995;
      p.vy      *= 0.997;
      p.x       += p.vx;
      p.y       += p.vy;

      /* fade in / out lifecycle */
      const halfLife = p.maxLife / 2;
      if (p.fadeIn) {
        p.alpha = clamp(p.alpha + 0.008, 0, 1);
        if (p.alpha >= 1) p.fadeIn = false;
      }
      p.life -= 0.0006;
      if (p.life <= 0) {
        this.particles[i] = this._spawnParticle(i);
        continue;
      }

      /* wrap */
      if (p.x < -5)   p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5)   p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      const col   = colorMap[p.type];
      const alpha = p.life * p.alpha * 0.7;

      /* glow aura for blood/ember types */
      if (p.type === 'blood' || p.type === 'ember') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = col + (alpha * 0.12) + ')';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = col + alpha + ')';
      ctx.fill();
    }
  }

  _drawSparks(t) {
    const { ctx } = this;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 8) s.trail.shift();

      s.vx  *= 0.97;
      s.vy  *= 0.97;
      s.vy  += 0.015; /* gravity */
      s.x   += s.vx;
      s.y   += s.vy;
      s.life -= s.decay;

      if (s.life <= 0) {
        if (s.burst) { this.sparks.splice(i, 1); }
        else         { this.sparks[i] = this._spawnSpark(); }
        continue;
      }

      /* draw trail */
      for (let j = 1; j < s.trail.length; j++) {
        const a = (j / s.trail.length) * s.life * 0.9;
        ctx.beginPath();
        ctx.moveTo(s.trail[j-1].x, s.trail[j-1].y);
        ctx.lineTo(s.trail[j].x,   s.trail[j].y);
        ctx.strokeStyle = C.CRIMSON_HI + a + ')';
        ctx.lineWidth   = (j / s.trail.length) * s.size;
        ctx.stroke();
      }

      /* head glow */
      if (s.glow) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
        grd.addColorStop(0, C.CRIMSON_HI + (s.life * 0.6) + ')');
        grd.addColorStop(1, C.CRIMSON + '0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = C.CRIMSON_HI + (s.life * 0.95) + ')';
      ctx.fill();
    }
  }

  _drawMotes(t) {
    const { ctx, W, H } = this;
    for (const m of this.motes) {
      m.phase   += m.phaseSpeed;
      m.x       += m.drift + Math.sin(m.phase) * 0.1;
      m.y       -= m.speed;
      m.opacity += m.rising ? 0.004 : -0.003;

      if (m.opacity >= m.maxOpacity) m.rising = false;
      if (m.y < -10 || m.opacity <= 0) Object.assign(m, this._spawnMote(0), { opacity: 0, rising: true });

      const grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 2.5);
      grd.addColorStop(0, C.CRIMSON + m.opacity + ')');
      grd.addColorStop(1, C.CRIMSON + '0)');
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = C.CRIMSON_HI + (m.opacity * 3.5) + ')';
      ctx.fill();
    }
  }

  _drawCursorTrail() {
    const { ctx, cursorTrail } = this;
    if (cursorTrail.length < 2) return;
    for (let i = 1; i < cursorTrail.length; i++) {
      cursorTrail[i].t = clamp(cursorTrail[i].t - 0.07, 0, 1);
      const a = (i / cursorTrail.length) * cursorTrail[i].t * 0.45;
      ctx.beginPath();
      ctx.moveTo(cursorTrail[i-1].x, cursorTrail[i-1].y);
      ctx.lineTo(cursorTrail[i].x,   cursorTrail[i].y);
      ctx.strokeStyle = C.CRIMSON + a + ')';
      ctx.lineWidth   = (i / cursorTrail.length) * 2.5;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
    this.cursorTrail = this.cursorTrail.filter(p => p.t > 0);
  }

  /* ── scan-line overlay ── */
  _drawScanLines() {
    const { ctx, W, H } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.018)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  /* ── main render loop ── */
  _tick(now) {
    if (this._paused) return;
    const delta = now - this._lastTime;
    if (delta >= C.FRAME_MS - 1) {
      this._lastTime = now;
      const { ctx, W, H } = this;
      ctx.clearRect(0, 0, W, H);

      this._drawOrbs(now);
      this._drawMotes(now);
      this._drawParticles(now);
      this._drawSparks(now);
      this._drawCursorTrail();
      this._drawScanLines();
    }
    this.raf = requestAnimationFrame(ts => this._tick(ts));
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.remove();
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 3 — HERO TITLE GLITCH EFFECT
═══════════════════════════════════════════════════════════════════ */

class GlitchText {
  constructor(el, options = {}) {
    this.el      = el;
    this.original= el.textContent;
    this.chars   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>/\\|█▓▒░';
    this.running = false;
    this.raf     = null;
    this.opts    = {
      duration:     900,
      intensity:    0.35,
      interval:     40,
      autoPlay:     options.autoPlay  ?? false,
      autoInterval: options.autoInterval ?? 6000,
      ...options,
    };
    if (this.opts.autoPlay) this._autoLoop();
  }

  play() {
    if (this.running) return;
    this.running = true;
    const start   = performance.now();
    const { duration, intensity, interval } = this.opts;
    const original = this.original;

    const step = (now) => {
      const elapsed  = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const glitchAmt= (1 - progress) * intensity;

      let out = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') { out += ' '; continue; }
        out += Math.random() < glitchAmt
          ? this.chars[Math.floor(Math.random() * this.chars.length)]
          : original[i];
      }
      this.el.textContent = out;

      if (progress < 1) {
        this.raf = setTimeout(() => requestAnimationFrame(step), interval);
      } else {
        this.el.textContent = original;
        this.running = false;
      }
    };
    requestAnimationFrame(step);
  }

  _autoLoop() {
    this.play();
    setInterval(() => this.play(), this.opts.autoInterval);
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 4 — STAT COUNTER (animated number roll)
═══════════════════════════════════════════════════════════════════ */

class StatCounter {
  constructor(el) {
    this.el      = el;
    this.target  = parseFloat(el.dataset.target || el.textContent.replace(/[^0-9.]/g, ''));
    this.suffix  = el.dataset.suffix || '';
    this.prefix  = el.dataset.prefix || '';
    this.decimals= parseInt(el.dataset.decimals || 0);
    this.done    = false;
  }

  run(delay = 0) {
    setTimeout(() => {
      const duration = 1800;
      const start    = performance.now();
      const ease     = t => 1 - Math.pow(1 - t, 4);

      const tick = (now) => {
        const t   = clamp((now - start) / duration, 0, 1);
        const val = this.target * ease(t);
        this.el.textContent = this.prefix + val.toFixed(this.decimals) + this.suffix;
        if (t < 1) requestAnimationFrame(tick);
        else       this.done = true;
      };
      requestAnimationFrame(tick);
    }, delay);
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 5 — INTERSECTION OBSERVER REVEAL ENGINE
═══════════════════════════════════════════════════════════════════ */

class RevealEngine {
  constructor() {
    this.counters = [];
    this._io = new IntersectionObserver(this._onIntersect.bind(this), {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    });
    this._statIO = new IntersectionObserver(this._onStatIntersect.bind(this), {
      threshold: 0.5,
    });
  }

  observe(els, stagger = 80) {
    els.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition= `opacity .55s cubic-bezier(.16,1,.3,1) ${i * stagger}ms,
                            transform .55s cubic-bezier(.16,1,.3,1) ${i * stagger}ms`;
      this._io.observe(el);
    });
  }

  observeStats(els) {
    els.forEach((el, i) => {
      const counter = new StatCounter(el);
      this.counters.push({ el, counter, triggered: false });
      this._statIO.observe(el);
    });
  }

  _onIntersect(entries) {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.style.opacity   = '1';
      target.style.transform = 'translateY(0)';
      this._io.unobserve(target);
    });
  }

  _onStatIntersect(entries) {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      const found = this.counters.find(c => c.el === target);
      if (found && !found.triggered) {
        found.triggered = true;
        found.counter.run(200);
        this._statIO.unobserve(target);
      }
    });
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 6 — NAVBAR SCROLL BEHAVIOUR
═══════════════════════════════════════════════════════════════════ */

class NavbarManager {
  constructor(navbar) {
    this.navbar    = navbar;
    this.lastY     = 0;
    this.ticking   = false;
    this._bind();
  }

  _bind() {
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => { this._update(); this.ticking = false; });
        this.ticking = true;
      }
    }, { passive: true });
  }

  _update() {
    const y = window.scrollY;
    const nav = this.navbar;

    /* scrolled state */
    nav.classList.toggle('scrolled', y > 10);

    /* hide on fast scroll down, show on scroll up */
    const diff = y - this.lastY;
    if (diff > 6 && y > 80)  nav.classList.add('nav-hidden');
    if (diff < -4)             nav.classList.remove('nav-hidden');
    this.lastY = y;
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 7 — DRAWER / HAMBURGER
═══════════════════════════════════════════════════════════════════ */

class DrawerManager {
  constructor() {
    this.hamburger = $('.hamburger');
    this.overlay   = $('.drawer-overlay');
    this.drawer    = $('.drawer');
    this.closeBtn  = $('.drawer-close');
    this.items     = $$('.drawer-item');
    this.isOpen    = false;
    this._bind();
  }

  _bind() {
    this.hamburger?.addEventListener('click', () => this.toggle());
    this.overlay?.addEventListener('click',   () => this.close());
    this.closeBtn?.addEventListener('click',  () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    this.items.forEach(item => {
      item.addEventListener('click', () => {
        this.items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.close();
        const view = item.dataset.view;
        if (view) Bus.emit('nav:change', view);
      });
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    this.hamburger?.classList.add('open');
    this.overlay?.classList.add('open');
    this.drawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
    Bus.emit('drawer:open');
  }

  close() {
    this.isOpen = false;
    this.hamburger?.classList.remove('open');
    this.overlay?.classList.remove('open');
    this.drawer?.classList.remove('open');
    document.body.style.overflow = '';
    Bus.emit('drawer:close');
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 8 — VIEW ROUTER
═══════════════════════════════════════════════════════════════════ */

class ViewRouter {
  constructor() {
    this.views    = $$('.view');
    this.navCards = $$('[data-view]');
    this.current  = 'home';
    this._bind();
    this._go('home');
  }

  _bind() {
    this.navCards.forEach(el => {
      el.addEventListener('click', () => {
        const view = el.dataset.view;
        if (view) this._go(view);
      });
    });

    Bus.on('nav:change', view => this._go(view));
  }

  _go(id) {
    this.views.forEach(v => v.classList.toggle('active', v.id === `view-${id}`));
    this.current = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Bus.emit('view:changed', id);
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 9 — LANG SELECTOR
═══════════════════════════════════════════════════════════════════ */

class LangSelector {
  constructor() {
    this.selector = $('.lang-selector');
    this.toggle   = $('.lang-toggle');
    this.dropdown = $('.lang-dropdown');
    this.opts     = $$('.lang-opt');
    this.current  = $('.lang-current');
    this.isOpen   = false;
    this._bind();
  }

  _bind() {
    this.toggle?.addEventListener('click', e => {
      e.stopPropagation();
      this.isOpen ? this._close() : this._open();
    });
    document.addEventListener('click', () => this._close());

    this.opts.forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        this.opts.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (this.current) this.current.textContent = opt.dataset.lang || 'EN';
        this._close();
        Bus.emit('lang:change', opt.dataset.lang);
      });
    });
  }

  _open()  { this.isOpen = true;  this.dropdown?.classList.add('open'); }
  _close() { this.isOpen = false; this.dropdown?.classList.remove('open'); }
}


/* ══════════════════════════════════════════════════════════════════
   § 10 — COPY-TO-CLIPBOARD BUTTONS
═══════════════════════════════════════════════════════════════════ */

function initCopyButtons() {
  $$('.btn-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const block = btn.closest('.code-card')?.querySelector('pre');
      if (!block) return;
      const text = block.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = '✓ COPIED';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
      } catch {
        btn.textContent = '✗ FAILED';
        setTimeout(() => { btn.textContent = 'COPY'; }, 2000);
      }
    });
  });
}


/* ══════════════════════════════════════════════════════════════════
   § 11 — COUNTDOWN TIMER (alert banner)
═══════════════════════════════════════════════════════════════════ */

function initCountdown() {
  const el = $('.countdown-timer');
  if (!el) return;

  /* configurable via data-end="ISO 8601 date" */
  const endRaw  = el.dataset.end;
  const endTime = endRaw ? new Date(endRaw).getTime() : Date.now() + 2 * 24 * 60 * 60 * 1000;

  const pad = n => String(n).padStart(2, '0');

  const tick = () => {
    const diff = Math.max(0, endTime - Date.now());
    const h  = Math.floor(diff / 3600000);
    const m  = Math.floor((diff % 3600000) / 60000);
    const s  = Math.floor((diff % 60000) / 1000);
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    if (diff <= 0) clearInterval(id);
  };
  tick();
  const id = setInterval(tick, 1000);
}


/* ══════════════════════════════════════════════════════════════════
   § 12 — CARD MAGNETIC HOVER (3D tilt)
═══════════════════════════════════════════════════════════════════ */

function initMagneticCards() {
  $$('.card').forEach(card => {
    const MAX_TILT = 8;

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-4px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition= 'transform 0.55s cubic-bezier(.16,1,.3,1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition= 'transform 0.12s linear';
    });
  });
}


/* ══════════════════════════════════════════════════════════════════
   § 13 — RIPPLE EFFECT (on buttons)
═══════════════════════════════════════════════════════════════════ */

function initRipple() {
  $$('.btn-primary, .btn-ghost, .btn-discord').forEach(btn => {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';

    btn.addEventListener('click', e => {
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2.2;
      const ripple = document.createElement('span');

      Object.assign(ripple.style, {
        position:      'absolute',
        borderRadius:  '50%',
        width:         size + 'px',
        height:        size + 'px',
        left:          (e.clientX - rect.left - size / 2) + 'px',
        top:           (e.clientY - rect.top  - size / 2) + 'px',
        background:    'rgba(255,255,255,.12)',
        transform:     'scale(0)',
        pointerEvents: 'none',
        animation:     'rippleAnim .55s cubic-bezier(.16,1,.3,1) forwards',
      });
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* inject keyframe once */
  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = `
      @keyframes rippleAnim {
        to { transform: scale(1); opacity: 0; }
      }`;
    document.head.appendChild(s);
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 14 — ONLINE COUNTER (simulated live)
═══════════════════════════════════════════════════════════════════ */

function initOnlineCounter() {
  const els = $$('[data-online]');
  if (!els.length) return;

  let base = parseInt(els[0]?.textContent || '1247');

  setInterval(() => {
    const delta = randInt(-3, 5);
    base  = Math.max(100, base + delta);
    els.forEach(el => { el.textContent = base.toLocaleString(); });
  }, 4000);
}


/* ══════════════════════════════════════════════════════════════════
   § 15 — PAGE TRANSITION (view change flash)
═══════════════════════════════════════════════════════════════════ */

function initPageTransitions() {
  Bus.on('view:changed', () => {
    const flash = $('#flash-overlay');
    if (!flash) return;
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 220);
  });
}


/* ══════════════════════════════════════════════════════════════════
   § 16 — SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════════════════ */

function initScrollProgress() {
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position:   'fixed',
    top:        '0',
    left:       '0',
    height:     '2px',
    width:      '0%',
    background: 'linear-gradient(90deg, #7a0f24, #e8204a, #ff6b2b)',
    zIndex:     '9998',
    pointerEvents: 'none',
    transition: 'width 0.1s linear',
    boxShadow:  '0 0 8px rgba(232,32,74,.7)',
  });
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (window.scrollY / total * 100) + '%' : '0%';
  }, { passive: true });
}


/* ══════════════════════════════════════════════════════════════════
   § 17 — TYPEWRITER for hero eyebrow
═══════════════════════════════════════════════════════════════════ */

class Typewriter {
  constructor(el, strings, options = {}) {
    this.el      = el;
    this.strings = strings;
    this.idx     = 0;
    this.charIdx = 0;
    this.deleting= false;
    this.opts    = { typeSpeed: 85, deleteSpeed: 45, pauseMs: 2200, ...options };
    this._loop();
  }

  _loop() {
    const str  = this.strings[this.idx];
    const speed= this.deleting ? this.opts.deleteSpeed : this.opts.typeSpeed;

    if (!this.deleting) {
      this.el.textContent = str.slice(0, ++this.charIdx);
      if (this.charIdx === str.length) {
        this.deleting = true;
        return setTimeout(() => this._loop(), this.opts.pauseMs);
      }
    } else {
      this.el.textContent = str.slice(0, --this.charIdx);
      if (this.charIdx === 0) {
        this.deleting = false;
        this.idx = (this.idx + 1) % this.strings.length;
      }
    }
    setTimeout(() => this._loop(), speed);
  }
}


/* ══════════════════════════════════════════════════════════════════
   § 18 — REDUCED MOTION GUARD
═══════════════════════════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ══════════════════════════════════════════════════════════════════
   § 19 — BOOTSTRAP  (DOMContentLoaded)
═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Particle Engine ──────────────────────────────────────────── */
  const particleContainer = $('.bg-particles');
  let engine = null;
  if (particleContainer && !prefersReducedMotion) {
    engine = new ParticleEngine(particleContainer);
  }

  /* ── Glitch text on hero titles ──────────────────────────────── */
  if (!prefersReducedMotion) {
    $$('.title-line').forEach((el, i) => {
      new GlitchText(el, { autoPlay: true, autoInterval: 8000 + i * 1500 });
    });
  }

  /* ── Reveal engine ───────────────────────────────────────────── */
  const reveal = new RevealEngine();
  reveal.observe($$('.card, .rank-card, .news-row, .social-card, .post-card, .code-card'), 55);
  reveal.observeStats($$('.stat-num[data-target]'));

  /* ── Navigation ──────────────────────────────────────────────── */
  const navbar  = $('.navbar');
  if (navbar) new NavbarManager(navbar);
  new DrawerManager();
  new ViewRouter();
  new LangSelector();

  /* ── UI features ─────────────────────────────────────────────── */
  initCopyButtons();
  initCountdown();
  initScrollProgress();
  initPageTransitions();
  initOnlineCounter();

  if (!prefersReducedMotion) {
    initMagneticCards();
    initRipple();
  }

  /* ── Typewriter on eyebrow (if element has data-typewriter) ───── */
  const eyebrow = $('.hero-eyebrow[data-typewriter]');
  if (eyebrow && !prefersReducedMotion) {
    const strings = JSON.parse(eyebrow.dataset.typewriter || '[]');
    if (strings.length) new Typewriter(eyebrow, strings);
  }

  /* ── Inject navbar scroll styles once ───────────────────────── */
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .navbar { transition: transform .35s cubic-bezier(.16,1,.3,1), background .35s ease; }
    .navbar.nav-hidden   { transform: translateY(-100%); }
    .navbar.scrolled     { background: rgba(3,2,10,.96); }
  `;
  document.head.appendChild(styleTag);

  console.log('%c⚔ AURCUS ONLINE — BLOOD VOID ENGINE LOADED', 'color:#e8204a;font-family:monospace;font-weight:700;font-size:14px;');
});
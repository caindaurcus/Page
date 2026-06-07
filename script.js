// =============================================
//  AURCUS ONLINE — script.js
// =============================================

/* ---- PARTICLES ---- */
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() < 0.5 ? 2 : 3}px;
      height: ${Math.random() < 0.5 ? 2 : 3}px;
      animation-duration: ${8 + Math.random() * 14}s;
      animation-delay: ${-Math.random() * 20}s;
      opacity: ${0.3 + Math.random() * 0.4};
    `;
    container.appendChild(p);
  }
})();

/* ---- HAMBURGER / DRAWER ---- */
const hamburger     = document.getElementById('hamburger');
const drawer        = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose   = document.getElementById('drawerClose');

function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  hamburger.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  hamburger.classList.remove('active');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  drawer.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// Close drawer when a nav link is tapped
document.querySelectorAll('.drawer-item').forEach(item => {
  item.addEventListener('click', () => setTimeout(closeDrawer, 200));
});

/* ---- COUNTER ANIMATION ---- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = 16;
  const steps = duration / step;
  let current = 0;
  const increment = target / steps;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }
  }, step);
}

const statNums = document.querySelectorAll('.stat-num');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(n => observer.observe(n));

/* ---- COUNTDOWN TIMER ---- */
(function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  let h = 23, m = 59, s = 59;
  setInterval(() => {
    s--;
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
    if (h < 0) { h = 23; m = 59; s = 59; }
    el.textContent =
      String(h).padStart(2,'0') + ':' +
      String(m).padStart(2,'0') + ':' +
      String(s).padStart(2,'0');
  }, 1000);
})();

/* ---- SCROLL REVEAL ---- */
const revealEls = document.querySelectorAll('.section-block, .card, .help-card, .seller-row, .rank-row, .event-card');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = `fadeUp 0.5s ${i * 0.05}s ease both`;
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));

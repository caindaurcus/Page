document.addEventListener('DOMContentLoaded', () => {
  initLanguageSelector();
  initParticleSystem();
  initCharacterCounter();
});

/* ==========================================================================
   SELECTOR DE IDIOMA INTERACTIVO
   ========================================================================== */
function initLanguageSelector() {
  const toggle = document.getElementById('langToggle');
  const dropdown = document.getElementById('langDropdown');
  const currentText = document.getElementById('langCurrent');

  if (!toggle || !dropdown) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', function() {
      const selectedLang = this.getAttribute('data-lang');
      currentText.textContent = selectedLang;
      dropdown.classList.remove('show');
      
      // Aquí puedes mapear tu objeto TRANSLATIONS existente para cambiar textos
      console.log(`Idioma cambiado a: ${selectedLang}`);
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });
}

/* ==========================================================================
   SISTEMA DE PARTICULAS AMBIENTALES (Canvas Dinámico)
   ========================================================================== */
function initParticleSystem() {
  const container = document.getElementById('bgParticles');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  const maxParticles = 45;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height; // Distribución inicial en pantalla
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 20;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = Math.random() * 0.6 + 0.2; // Velocidad ascendente suave
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10) {
        this.reset();
      }
    }

    draw() {
      ctx.fillStyle = `rgba(189, 0, 255, ${this.opacity})`; // Tono violeta de Aurcus
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f3ff'; // Resplandor cian cruzado
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Inicializar arreglo
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Desactivar sombra para operaciones de limpieza, activarla solo al dibujar
    ctx.shadowBlur = 0; 

    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   CONTADOR DE CARACTERES PARA PUBLICACIONES
   ========================================================================== */
function initCharacterCounter() {
  const textarea = document.getElementById('fContent');
  const counter = document.getElementById('cc');

  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / 300`;

    // Cambio de color sutil cuando se acerca al límite
    if (len >= 280) {
      counter.style.color = '#ff4a4a';
    } else if (len >= 200) {
      counter.style.color = '#ffd700';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  });
}

/* ==========================================================================
   UTILIDAD DE DESTELLO VISUAL (Opcional para tus eventos)
   ========================================================================== */
function triggerScreenFlash() {
  const flash = document.getElementById('flash-overlay');
  if (!flash) return;
  flash.style.opacity = '0.15';
  setTimeout(() => {
    flash.style.opacity = '0';
  }, 400);
}

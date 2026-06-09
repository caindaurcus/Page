// ==========================================================================
// 1. CONFIGURACIÓN Y CREDENCIALES DE SUPABASE
// ==========================================================================
// Reemplaza esto con los datos de tu archivo aurcus-v6.html original
const SUPABASE_URL = "PEGAR_AQUI_TU_URL_DE_SUPABASE"; 
const SUPABASE_KEY = "PEGAR_AQUI_TU_ANON_KEY_DE_SUPABASE";

// Inicialización del cliente oficial
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================================================
// 2. INICIALIZACIÓN DE LA INTERFAZ
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLanguageSelector();
  initParticleSystem();
  initCharacterCounter();
  
  // Carga inicial de datos desde tu base de datos
  cargarForo();
  cargarMarket();
  cargarSellers();
});

// ==========================================================================
// 3. CONTROL DEL MENÚ Y NAVEGACIÓN (LAS 3 LÍNEAS)
// ==========================================================================
function initNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const sideNav = document.getElementById('sideNav');
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.content-section');

  if (!menuToggle || !sideNav) return;

  // Toggle del menú lateral
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuToggle.classList.toggle('active');
    sideNav.classList.toggle('hidden');
  });

  // Cambio de pestañas (Foro, Market, Sellers)
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSectionId = btn.getAttribute('data-target');

      // Actualizar estado visual de los botones
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Mostrar la sección correspondiente
      sections.forEach(section => {
        if (section.id === targetSectionId) {
          section.classList.remove('hidden');
          section.classList.add('active-section');
        } else {
          section.classList.add('hidden');
          section.classList.remove('active-section');
        }
      });

      // Autocerrar el menú en dispositivos móviles
      if (window.innerWidth <= 768) {
        sideNav.classList.add('hidden');
        menuToggle.classList.remove('active');
      }
    });
  });

  // Cerrar si se hace clic fuera
  document.addEventListener('click', (e) => {
    if (!sideNav.contains(e.target) && !menuToggle.contains(e.target)) {
      sideNav.classList.add('hidden');
      menuToggle.classList.remove('active');
    }
  });
}

// ==========================================================================
// 4. LÓGICA MEJORADA DE SUPABASE
// ==========================================================================
async function cargarForo() {
  const contenedorForo = document.getElementById('ff');
  if (!contenedorForo) return;

  try {
    const { data: posts, error } = await supabase
      .from('posts') // Ajusta el nombre de tu tabla si es diferente
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Límite para mejorar rendimiento

    if (error) throw error;

    contenedorForo.innerHTML = ''; 

    if (posts && posts.length > 0) {
      posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `
          <div class="post-top">
            <div class="post-avatar">${post.nickname ? post.nickname[0].toUpperCase() : '?'}</div>
            <span class="post-nick">${post.nickname || 'Usuario Anónimo'}</span>
            <span class="post-time">${new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <p class="post-content">${post.content}</p>
        `;
        contenedorForo.appendChild(postCard);
      });
    } else {
      contenedorForo.innerHTML = '<p class="text-muted">El foro está vacío en este momento.</p>';
    }
  } catch (err) {
    console.error("Error al sincronizar el Foro:", err.message);
  }
}

async function cargarMarket() {
  const contenedorMarket = document.getElementById('marketList');
  if (!contenedorMarket) return;
  // Implementación similar a cargarForo() apuntando a tu tabla del market
}

async function cargarSellers() {
  const contenedorSellers = document.getElementById('sellersList');
  if (!contenedorSellers) return;
  // Implementación similar apuntando a tu tabla de sellers verificados
}

// ==========================================================================
// 5. EFECTOS VISUALES Y EXPERIENCIA DE USUARIO
// ==========================================================================
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
    });
  });

  document.addEventListener('click', () => dropdown.classList.remove('show'));
}

function initParticleSystem() {
  const container = document.getElementById('bgParticles');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];
  const maxParticles = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 20;
      this.size = Math.random() * 2 + 0.5;
      this.speedY = Math.random() * 0.5 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.fillStyle = `rgba(189, 0, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

function initCharacterCounter() {
  const textarea = document.getElementById('fContent');
  const counter = document.getElementById('cc');
  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / 300`;
    
    if (len >= 280) {
      counter.style.color = '#ff4a4a';
    } else if (len >= 200) {
      counter.style.color = '#ffd700';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  });
}

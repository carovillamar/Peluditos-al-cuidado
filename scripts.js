// scripts.js
// ===============================
// Arranque cuando el DOM está listo
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initGalleryFilters();   // Filtros accesibles con aria-pressed
  initSmoothAnchors();    // Scroll suave (usa scrollIntoView + CSS scroll-behavior)
  initContactForm();      // Mensaje de éxito ligero
  setupLightbox();        // Lightbox UNIFICADO (navegación, spinner, accesible)
  initScrollReveal();     // Animaciones al aparecer (respeta reduced motion)
  initToTop();            // Botón volver arriba (si existe #toTop)
  initThemeToggle();      // Lógica del interruptor (persistencia)
  initMobileNav();        // Menú hamburguesa accesible en móviles
  initFAQ();              // FAQ
});

// ===============================
// 1) Galería: filtros con delegación + aria-pressed
// ===============================
function initGalleryFilters() {
  const container = document.querySelector(".filtros-galeria");
  const grid = document.querySelector(".galeria-fotos");
  if (!container || !grid) return;

  // Estado inicial: "todos"
  setActiveFilter("todos");

  // Delegación de eventos
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-galeria");
    if (!btn) return;
    const filtro = btn.dataset.filtro || "todos";
    setActiveFilter(filtro);
  });

  function setActiveFilter(filtro) {
    // Actualiza botones (visual + accesible)
    const botones = container.querySelectorAll(".btn-galeria");
    botones.forEach((b) => {
      const isActive = (b.dataset.filtro || "todos") === filtro;
      b.classList.toggle("activo", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });

  // Filtra figuras completas para evitar huecos
const figuras = grid.querySelectorAll("figure, img[data-categoria]");
figuras.forEach((el) => {
  const img = el.tagName === "IMG" ? el : el.querySelector("img[data-categoria]");
  if (!img) return;

  const cat = img.dataset.categoria;
  const visible = filtro === "todos" || cat === filtro;
  el.style.display = visible ? "" : "none"; // Oculta toda la figura
});
  }
}

// ===============================
// 2) Enlaces internos con scroll suave
// ===============================
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
    enlace.addEventListener("click", (e) => {
      const id = enlace.getAttribute("href");
      if (!id || id.length <= 1) return;
      const destino = document.querySelector(id);
      if (!destino) return;

      e.preventDefault();
      destino.scrollIntoView({ behavior: "smooth", block: "start" });

      // Accesibilidad
      destino.setAttribute("tabindex", "-1");
      destino.focus({ preventScroll: true });
      setTimeout(() => destino.removeAttribute("tabindex"), 1000);
    });
  });
}

// ===============================
// 3) Formulario: mensaje de éxito ligero
// ===============================
function initContactForm() {
  const form = document.getElementById("form-contacto");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let ok = document.getElementById("mensaje-exito");
    if (!ok) {
      ok = document.createElement("div");
      ok.id = "mensaje-exito";
      ok.className = "form-success";
      ok.style.marginTop = "10px";
      ok.style.fontWeight = "600";
      form.appendChild(ok);
    }
    ok.textContent = "¡Gracias por tu mensaje! Te responderé pronto.";
    ok.style.display = "block";

    form.reset();
    setTimeout(() => { ok.style.display = "none"; }, 3000);
  });
}

// ===============================
// 4) Lightbox UNIFICADO (con navegación + spinner)
// Requiere en el HTML, antes de </body>:
//
// <div id="lightbox" aria-hidden="true">
//   <button class="lb-close" aria-label="Cerrar (Esc)">×</button>
//   <button class="lb-nav lb-prev" aria-label="Foto anterior">‹</button>
//   <img class="lb-img" alt="Foto ampliada">
//   <div class="lb-spinner" aria-hidden="true"></div>
//   <button class="lb-nav lb-next" aria-label="Foto siguiente">›</button>
// </div>
//
// Las miniaturas deben tener:
//   src="fotos/fotosSMALL/xxx-small.jpg"
//   data-full="fotos/xxx.JPG"
// ===============================
function setupLightbox() {
  const gallery = document.querySelector(".galeria-fotos");
  const lb = document.getElementById("lightbox");
  if (!gallery || !lb) return;

  const lbImg = lb.querySelector(".lb-img");
  const btnClose = lb.querySelector(".lb-close");
  const btnPrev  = lb.querySelector(".lb-prev");
  const btnNext  = lb.querySelector(".lb-next");
  const spinner  = lb.querySelector(".lb-spinner");

  let currentList = [];    // URLs de data-full (solo visibles)
  let currentIndex = 0;
  let lastFocus = null;    // elemento que tenía el foco al abrir

  // Construye la lista de visibles en ese momento (respeta filtros)
  function buildCurrentList() {
    const thumbs = [...gallery.querySelectorAll('img[data-full]')];
    currentList = thumbs
      .filter(img => img.offsetParent !== null) // visibles
      .map(img => img.dataset.full);
  }

  // Pre-carga y muestra la imagen grande con spinner
  async function setImage(url) {
    lb.classList.add("is-loading"); // (CSS debe mostrar spinner cuando is-loading)
    if (spinner) spinner.hidden = false;

    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      if (img.decode) { await img.decode(); }
      lbImg.src = img.src;
    } catch (err) {
      // en caso de error simplemente ocultamos el spinner
    } finally {
      if (spinner) spinner.hidden = true;
      lb.classList.remove("is-loading");
    }
  }

  function openLightbox(startUrl) {
    buildCurrentList();
    const found = currentList.indexOf(startUrl);
    currentIndex = found >= 0 ? found : 0;

    lastFocus = document.activeElement;

    setImage(currentList[currentIndex]);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // Foco accesible
    btnClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
    // devolver foco
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function prev() {
    if (!currentList.length) return;
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    setImage(currentList[currentIndex]);
  }

  function next() {
    if (!currentList.length) return;
    currentIndex = (currentIndex + 1) % currentList.length;
    setImage(currentList[currentIndex]);
  }

  // Abrir desde la galería
  gallery.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-full]");
    if (!img) return;
    e.preventDefault();
    openLightbox(img.dataset.full);
  });

  // Cerrar: botón, fondo o ESC
  btnClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape")       { e.preventDefault(); closeLightbox(); }
    else if (e.key === "ArrowLeft")  { e.preventDefault(); prev(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  });

  // Navegación con botones (sin cerrar por el clic)
  btnPrev.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
  btnNext.addEventListener("click", (e) => { e.stopPropagation(); next(); });

  // Evitar que clic en la imagen cierre
  lbImg.addEventListener("click", (e) => e.stopPropagation());
}

// ===============================
// 5) Animaciones al aparecer (Scroll Reveal)
// ===============================
function initScrollReveal() {
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  autoMarkReveal();

  if (prefersReduce) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(onIntersect, {
    threshold: 0.15,
    rootMargin: "0px 0px -10% 0px",
  });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  function onIntersect(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }

  function autoMarkReveal() {
    mark(".hero-text", "left");
    mark(".hero-image", "right");

    document.querySelectorAll("section h2").forEach((h2) => {
      h2.classList.add("reveal");
      if (!h2.dataset.reveal) h2.dataset.reveal = "up";
    });

    const containers = document.querySelectorAll(".cards, .pasos, .galeria-fotos");
    containers.forEach((container) => {
      const kids = Array.from(container.children);
      kids.forEach((el, i) => {
        if (!el.classList.contains("reveal")) el.classList.add("reveal");
        if (!el.dataset.reveal) el.dataset.reveal = "up";
        el.style.setProperty("--reveal-delay", `${i * 80}ms`);
      });
    });
  }

  function mark(selector, direction = "up", delay = 0) {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add("reveal");
      el.dataset.reveal = direction;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
    });
  }
}

// ===============================
// 6) Botón "Volver arriba"
// ===============================
function initToTop() {
  const btn = document.getElementById("toTop");
  if (!btn) return;

  const onScroll = () => {
    const show = window.scrollY > 600;
    btn.classList.toggle("is-visible", show);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===============================
// 7) Tema claro/oscuro con toggle + localStorage
// ===============================
function initThemeToggle(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;

  const saved = localStorage.getItem('theme');
  const initial = (saved === 'dark' || saved === 'light') ? saved : 'light';
  applyTheme(initial);
  btn.setAttribute('aria-pressed', String(initial === 'dark'));

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    btn.setAttribute('aria-pressed', String(next === 'dark'));
    localStorage.setItem('theme', next);
  });

  function applyTheme(mode){
    if(mode === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

// ===============================
// 8) Menú hamburguesa accesible en móviles
// ===============================
function initMobileNav(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if(!btn || !nav) return;

  const open = () => {
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    btn.setAttribute('aria-expanded','true');
  };
  const close = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded','false');
  };
  const toggle = () => (nav.classList.contains('is-open') ? close() : open());

  btn.addEventListener('click', toggle);

  // Cerrar al pulsar un enlace del menú
  nav.addEventListener('click', (e) => {
    if(e.target.closest('a')) close();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') close();
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('nav-open')) return;
    const clickedInside = e.target.closest('#primary-nav') || e.target.closest('.nav-toggle');
    if (!clickedInside) close();
  });
}

// Animación huellita del logo (la mantenemos)
document.addEventListener('DOMContentLoaded', () => {
  const pawWrap = document.querySelector('.logo .huella');
  if (pawWrap){
    pawWrap.classList.add('animate-once');
    setTimeout(()=> pawWrap.classList.remove('animate-once'), 900);
  }
});

// ===============================
// 9) FAQ - Solo uno abierto a la vez
// ===============================
function initFAQ() {
  const faqs = document.querySelectorAll(".faq details");
  if (!faqs.length) return;

  faqs.forEach((faq) => {
    faq.addEventListener("toggle", () => {
      if (faq.open) {
        faqs.forEach((other) => {
          if (other !== faq) {
            other.open = false;
          }
        });
      }
    });
  });
}
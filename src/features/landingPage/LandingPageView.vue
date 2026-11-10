
<template>
  <div class="landing">

    <header class="navbar" :class="{ 'navbar--scrolled': scrolled }">
      <div class="navbar__logo">
        
          <img src="../../logo/logo.png" alt="FlowDesk" class="navbar__logo-img" />
       
      </div>
      <nav class="navbar__actions">
        <RouterLink to="/login" class="btn-ghost">Iniciar sesión</RouterLink>
        <RouterLink to="/register" class="btn-cta">Registrarse</RouterLink>
      </nav>
    </header>

    <section class="hero">
      <div class="hero__bg">
      </div>

      <div class="hero__content">

        <div class="hero__left">

          <h1 class="hero__heading">
            Todo tu negocio,<br />
            <em>en un solo lugar</em>
          </h1>

          <p class="hero__sub">
            Gestiona inventarios, empleados, movimientos y reportes
            desde una sola plataforma diseñada para impulsar el crecimiento de tu empresa.
          </p>

          <div class="hero__actions">
            <RouterLink
              to="/register"
              class="btn-hero-primary"
            >
              Comenzar ahora
            </RouterLink>

            <RouterLink
              to="/login"
              class="btn-hero-ghost"
            >
              Iniciar sesión
            </RouterLink>
          </div>

          <div class="hero__actions">
  ...
</div>

<HeroCarousel />
        </div>

        <div class="hero__right">

          <div class="hero__preview">

            <div class="hero__preview-header">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="hero__preview-body">

            </div>

          </div>

        </div>

      </div>
    </section>

    <section class="features">
      <div class="features__inner">
        <div class="features__head">
          <p class="section-eyebrow">Funcionalidades</p>
          <h2 class="section-title">Con Flowdesk podrás:</h2>
        </div>

        <div class="features__layout">
          <ul class="features__list" role="tablist" aria-label="Funcionalidades">
            <li v-for="(feat, index) in features" :key="feat.title" role="presentation">
              <button
                :ref="(el) => setTabRef(el, index)"
                type="button"
                class="feature-tab"
                role="tab"
                :aria-selected="index === activeFeature"
                :tabindex="index === activeFeature ? 0 : -1"
                :style="{ '--tab-accent': feat.accent }"
                @click="selectFeature(index)"
                @mouseenter="onFeatureHover(index)"
                @keydown="onFeatureKeydown"
              >
                <span class="feature-tab__title">{{ feat.title }}</span>
                <span class="feature-tab__desc">{{ feat.desc }}</span>
              </button>
            </li>
          </ul>

          <div
            ref="stageRef"
            class="feature-stage"
            role="tabpanel"
            aria-live="polite"
            :style="{ '--stage-accent': features[activeFeature].accent }"
          >
            <div class="feature-stage__glow" />
            <div :key="`icon-${activeFeature}`" class="feature-stage__icon" v-html="features[activeFeature].icon" />
            <div :key="`body-${activeFeature}`" class="feature-stage__body">
              <h3 class="feature-stage__title">{{ features[activeFeature].title }}</h3>
              <p class="feature-stage__desc">{{ features[activeFeature].desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits">
      <div class="benefits__inner">
        <div class="benefits__intro">
          <p class="section-eyebrow">Beneficios</p>
          <h2 class="section-title">Beneficios de trabajar con nosotros</h2>
          <p class="benefits__text">
            FlowDesk no solo organiza tu operación: la hace más rápida, más precisa y más fácil de escalar.
          </p>
        </div>

        <div class="benefits__grid">
          <article
            v-for="(benefit, index) in benefits"
            :key="benefit.title"
            :ref="(el) => setTileRef(el, index)"
            class="benefit-tile"
            :style="{ '--tile-accent': benefit.accent }"
          >
            <span class="benefit-tile__mark" aria-hidden="true" v-html="benefit.icon" />
            <h3 class="benefit-tile__title">{{ benefit.title }}</h3>
            <p class="benefit-tile__desc">{{ benefit.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section ref="missionRef" class="mission" :class="{ 'mission--circle': missionCircle }">
      <div class="mission__inner">
        <div class="mission__track">
          <div
            v-for="(block, index) in missionBlocks"
            :key="block.label"
            class="mission__block"
            :class="index === 0 ? 'mission__block--now' : 'mission__block--next'"
          >
            <div class="mission__node" :class="index === 0 ? 'mission__node--now' : 'mission__node--next'" />
            <p class="mission__label">{{ block.label }}</p>
            <h3 class="mission__title">{{ block.title }}</h3>
            <p class="mission__text">{{ block.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <span class="footer__copy">© 2025 FlowDesk. Todos los derechos reservados.</span>

    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type ComponentPublicInstance } from 'vue';
import { RouterLink } from 'vue-router';
import HeroCarousel from './components/HeroCarousel.vue';

const scrolled = ref(false);

// ── Funcionalidades: lista de pestañas y panel ──
const activeFeature = ref(0);
const tabEls: (HTMLElement | null)[] = [];

function setTabRef(el: Element | ComponentPublicInstance | null, index: number) {
  tabEls[index] = el instanceof HTMLElement ? el : null;
}

function selectFeature(index: number, focus = false) {
  activeFeature.value = index;
  if (focus) tabEls[index]?.focus();
}

// En escritorio basta con pasar el cursor; en móvil la lista funciona como acordeón.
function onFeatureHover(index: number) {
  if (window.matchMedia('(min-width: 901px)').matches) selectFeature(index);
}

function onFeatureKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  const step = event.key === 'ArrowDown' ? 1 : features.length - 1;
  selectFeature((activeFeature.value + step) % features.length, true);
}

// ── Transiciones ligadas al scroll: cada sección "se abre" al entrar en pantalla ──
const stageRef = ref<HTMLElement | null>(null);
const missionRef = ref<HTMLElement | null>(null);
const missionCircle = ref(false);
const tileEls: (HTMLElement | null)[] = [];
let frame = 0;
let reduceMotion: MediaQueryList | null = null;

function setTileRef(el: Element | ComponentPublicInstance | null, index: number) {
  tileEls[index] = el instanceof HTMLElement ? el : null;
}

// 0 cuando el borde superior del elemento entra por abajo, 1 tras recorrer `span` de la pantalla.
function scrollProgress(el: HTMLElement, span: number) {
  const vh = window.innerHeight;
  const p = Math.min(Math.max((vh - el.getBoundingClientRect().top) / (vh * span), 0), 1);
  return 1 - Math.pow(1 - p, 3);
}

// La misión entra como un círculo angosto que se expande hasta formar un arco sobre el contenido.
function updateMission(el: HTMLElement) {
  const w = el.offsetWidth;
  const t = scrollProgress(el, 0.9);
  const rise = Math.min(w * 0.11, 160);
  const finalRadius = (rise * rise + (w / 2) * (w / 2)) / (2 * rise);
  const startRadius = w * 0.28;
  const startOffset = Math.min(w * 0.18, 260);
  const radius = startRadius + (finalRadius - startRadius) * t;
  const offset = startOffset * (1 - t);
  missionCircle.value = true;
  el.style.clipPath = `circle(${radius.toFixed(1)}px at 50% ${(offset + radius).toFixed(1)}px)`;
}

// El panel navy crece desde una forma más pequeña y redondeada.
function updateStage(el: HTMLElement) {
  const k = 1 - scrollProgress(el, 0.6);
  const inset = (k * 9).toFixed(2);
  el.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${(28 + k * 60).toFixed(1)}px)`;
}

// Los beneficios suben a velocidades distintas; la columna derecha llega más tarde.
function updateTiles() {
  const twoColumns = window.matchMedia('(min-width: 601px)').matches;
  tileEls.forEach((tile, index) => {
    if (!tile) return;
    const k = 1 - scrollProgress(tile, 0.55);
    const right = twoColumns && index % 2 === 1;
    const offset = (right ? 64 : 0) + k * (right ? 110 : 56);
    tile.style.transform = `translateY(${offset.toFixed(1)}px)`;
    tile.style.opacity = (0.35 + 0.65 * (1 - k)).toFixed(3);
  });
}

function resetTransitions() {
  missionCircle.value = false;
  if (missionRef.value) missionRef.value.style.clipPath = '';
  if (stageRef.value) stageRef.value.style.clipPath = '';
  tileEls.forEach((tile) => {
    if (!tile) return;
    tile.style.transform = '';
    tile.style.opacity = '';
  });
}

function updateTransitions() {
  frame = 0;
  if (reduceMotion?.matches) {
    resetTransitions();
    return;
  }
  if (missionRef.value) updateMission(missionRef.value);
  if (stageRef.value && getComputedStyle(stageRef.value).display !== 'none') updateStage(stageRef.value);
  updateTiles();
}

function requestTransitions() {
  if (!frame) frame = requestAnimationFrame(updateTransitions);
}

function onScroll() {
  scrolled.value = window.scrollY > 20;
  requestTransitions();
}

onMounted(() => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion.addEventListener('change', requestTransitions);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', requestTransitions);
  updateTransitions();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', requestTransitions);
  reduceMotion?.removeEventListener('change', requestTransitions);
  if (frame) cancelAnimationFrame(frame);
});

const features = [
  {
    title: 'Control total de tu inventario',
    desc: 'Sabe exactamente qué tienes, dónde está y cuándo se agota, con alertas automáticas de bajo stock.',
    accent: 'var(--color-accent)',
    accentSoft: 'var(--color-accent-subtle)',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>`,
  },
  {
    title: 'Trazabilidad completa de movimientos',
    desc: 'Cada entrada, salida y ajuste queda registrado con su historial completo, sin hojas de cálculo paralelas.',
    accent: 'var(--color-structure-hover)',
    accentSoft: 'var(--color-structure-subtle)',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>`,
  },
  {
    title: 'Importación masiva desde Excel',
    desc: 'Sube tu catálogo completo de productos en segundos, sin capturarlo uno por uno.',
    accent: 'var(--color-warning)',
    accentSoft: 'var(--color-warning-bg)',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`,
  },
  {
    title: 'Reportes y análisis en tiempo real',
    desc: 'Cada movimiento se refleja de inmediato en tus reportes, así siempre decides con datos reales.',
    accent: 'var(--color-accent)',
    accentSoft: 'var(--color-accent-subtle)',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
  },
  {
    title: 'Empleados y roles bajo control',
    desc: 'Agrega colaboradores, define permisos por rol y mantén cada acción alineada con la responsabilidad de tu equipo.',
    accent: 'var(--color-structure-hover)',
    accentSoft: 'var(--color-structure-subtle)',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  },
];

const benefits = [
  {
    title: 'Ahorra horas cada semana',
    desc: 'Automatiza tareas manuales de inventario y reportes para que tu equipo se enfoque en crecer, no en hojas de cálculo.',
    accent: 'var(--color-accent)',
    accentSoft: 'var(--color-accent-subtle)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,
  },
  {
    title: 'Reduce errores costosos',
    desc: 'Datos centralizados y sincronizados en tiempo real eliminan discrepancias entre lo que crees tener y lo que realmente tienes.',
    accent: 'var(--color-success)',
    accentSoft: 'var(--color-success-bg)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>`,
  },
  {
    title: 'Escala sin fricciones',
    desc: 'Agrega productos, empleados y sucursales sin rediseñar tu operación desde cero.',
    accent: 'var(--color-structure-hover)',
    accentSoft: 'var(--color-structure-subtle)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>`,
  },
  {
    title: 'Decide con confianza',
    desc: 'Reportes claros y actualizados al instante te dan la certeza para tomar decisiones de negocio.',
    accent: 'var(--color-warning)',
    accentSoft: 'var(--color-warning-bg)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
  },
];

const missionBlocks = [
  {
    label: 'Nuestra misión',
    title: 'Darle a cada negocio el control que merece',
    text: 'Creemos que la claridad operacional no debería ser exclusiva de las grandes empresas. FlowDesk nació para que cualquier negocio, sin importar su tamaño, pueda tomar decisiones informadas con las herramientas adecuadas. Simplificamos la complejidad para que tú te enfoques en crecer.',
  },
  {
    label: 'Nuestra visión',
    title: 'La plataforma que conecta cada parte de tu empresa',
    text: 'Imaginamos un futuro donde gestionar inventarios, equipos, clientes y finanzas ocurre desde un solo lugar, sin fricciones ni silos de información. FlowDesk será la columna vertebral operacional de los negocios modernos de Latinoamérica.',
  },
];
</script>

<style scoped>

.landing {
  font-family: 'DM Sans', var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg-app);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── NAVBAR ─────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(30, 39, 56, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 48px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.25s, box-shadow 0.25s;
  animation: slideDown 0.5s ease both;
}

.navbar--scrolled {
  background: rgba(30, 39, 56, 0.98);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

.navbar__logo-img {
  height: 70px;
  width: auto;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-ghost {
  padding: 8px 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'DM Sans', var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.55);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.btn-cta {
  padding: 9px 22px;
  border: none;
  border-radius: 8px;
  background: var(--color-warning);
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.35);
  color: #fff;
  font-family: 'DM Sans', var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, transform 0.12s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.btn-cta:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}
.btn-cta:active { transform: translateY(0); }

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px 80px;
  position: relative;
  overflow: hidden;
  background: var(--color-structure-base);
}

.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.hero__bg::before {
  content: '';
  position: absolute;
  top: -20%; left: -10%;
  width: 60%; height: 80%;
  background: radial-gradient(ellipse at center, rgba(45, 88, 120, 0.55) 0%, transparent 70%);
  border-radius: 50%;
}
.hero__bg::after {
  content: '';
  position: absolute;
  bottom: -20%; right: -10%;
  width: 55%; height: 75%;
  background: radial-gradient(ellipse at center, rgba(197, 79, 68, 0.18) 0%, transparent 65%);
  border-radius: 50%;
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.hero__content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 820px;
  animation: fadeUp 0.8s ease 0.2s both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 99px;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 32px;
}

.hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--color-success);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.hero__heading {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(2.6rem, 6vw, 4.5rem);
  font-weight: 400;
  color: #fff;
  line-height: 1.12;
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}
.hero__heading em {
  font-style: italic;
  color: var(--color-warning);
}

.hero__sub {
  font-size: clamp(1rem, 2vw, 1.18rem);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.7;
  max-width: 580px;
  margin: 0 auto 44px;
  font-weight: 300;
}

.hero__actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 72px;
}

.btn-hero-primary {
  padding: 14px 36px;
  border: none;
  border-radius: 10px;
  background: var(--color-warning);
  color: #fff;
  font-family: 'DM Sans', var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, transform 0.12s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(197, 79, 68, 0.4);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.btn-hero-primary:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 167, 38, 0.45);
}

.btn-hero-ghost {
  padding: 13px 32px;
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'DM Sans', var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.btn-hero-ghost:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.hero__stats {
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  animation: fadeUp 0.8s ease 0.5s both;
}

.hero__stat {
  padding: 20px 40px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.15s;
  flex: 1;
}
.hero__stat:last-child { border-right: none; }
.hero__stat:hover { background: rgba(255, 255, 255, 0.06); }

.hero__stat-number {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: 1.9rem;
  color: #fff;
  line-height: 1;
  margin: 0 0 4px;
}
.hero__stat-label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.38);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

/* ── FUNCIONALIDADES ────────────────────────────────────── */
.features {
  background: var(--color-bg-app);
  padding: 128px 24px 120px;
}

.features__inner {
  max-width: 1160px;
  margin: 0 auto;
}

.features__head {
  margin-bottom: 56px;
}

.section-eyebrow {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-accent);
  margin: 0 0 10px;
}

.section-title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(2rem, 4.2vw, 3.2rem);
  font-weight: 400;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.section-sub {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1rem;
  max-width: 520px;
  margin: 0 auto 64px;
  line-height: 1.7;
  font-weight: 300;
}

.features__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 48px;
  align-items: stretch;
}

.features__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-tab {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 18px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  padding: 18px 0 18px 22px;
  position: relative;
}
.feature-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 0;
  border-radius: 4px;
  background: var(--tab-accent);
  transform: translateY(-50%);
  transition: height 0.3s ease;
}
.feature-tab:focus-visible {
  outline: 2px solid var(--color-structure-hover);
  outline-offset: 4px;
  border-radius: 6px;
}

.feature-tab__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-text-faint);
  transition: color 0.25s ease;
}
.feature-tab:hover .feature-tab__title {
  color: var(--color-text-muted);
}
.feature-tab[aria-selected='true']::before {
  height: 70%;
}
.feature-tab[aria-selected='true'] .feature-tab__title {
  color: var(--color-heading);
}

.feature-tab__desc {
  display: none;
}

/* Panel con el mismo navy y la misma cuadrícula del hero */
.feature-stage {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  min-height: 460px;
  background: var(--color-structure-base);
  color: #fff;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.feature-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 70% 30%, #000 0%, transparent 75%);
}

.feature-stage__glow {
  position: absolute;
  top: -20%;
  right: -15%;
  width: 80%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--stage-accent) 0%, transparent 65%);
  opacity: 0.35;
  transition: background 0.5s ease;
}

.feature-stage__icon {
  position: absolute;
  top: 48px;
  right: 48px;
  width: 112px;
  height: 112px;
  border-radius: 32px;
  display: grid;
  place-items: center;
  background: var(--stage-accent);
  color: #fff;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
  transition: background 0.5s ease;
}
.feature-stage__icon :deep(svg) {
  width: 48px;
  height: 48px;
}

.feature-stage__body {
  position: relative;
  max-width: 420px;
}

.feature-stage__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.7rem, 2.6vw, 2.3rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 16px;
}

.feature-stage__desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 1.08rem;
  line-height: 1.7;
  font-weight: 300;
}

.feature-stage__icon,
.feature-stage__body {
  animation: stageIn 0.45s ease both;
}

@keyframes stageIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}

/* ── BENEFICIOS ─────────────────────────────────────────── */
.benefits {
  background: var(--color-bg-app);
  padding: 40px 24px 200px;
}

.benefits__inner {
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 64px;
  align-items: start;
}

.benefits__intro {
  position: sticky;
  top: 120px;
}

.benefits__text {
  color: var(--color-text-muted);
  font-size: 1.05rem;
  line-height: 1.7;
  font-weight: 300;
  margin: 20px 0 0;
  max-width: 36ch;
}

.benefits__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.benefit-tile {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  min-height: 300px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: color-mix(in srgb, var(--tile-accent) 6%, var(--color-bg-surface));
  border: 1px solid color-mix(in srgb, var(--tile-accent) 14%, var(--color-bg-border));
}
.benefit-tile:nth-child(even) {
  transform: translateY(64px);
}

.benefit-tile__mark {
  position: absolute;
  top: -28px;
  right: -28px;
  color: var(--tile-accent);
  opacity: 0.16;
  transition: transform 0.5s ease;
}
.benefit-tile__mark :deep(svg) {
  width: 150px;
  height: 150px;
  stroke-width: 1.4;
}
.benefit-tile:hover .benefit-tile__mark {
  transform: rotate(-8deg) scale(1.05);
}

.benefit-tile__title {
  position: relative;
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: 1.55rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-heading);
  margin: 0 0 12px;
}

.benefit-tile__desc {
  position: relative;
  margin: 0;
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.95rem;
  line-height: 1.65;
  font-weight: 300;
}

/* ── MISIÓN Y VISIÓN ────────────────────────────────────── */
.landing {
  --mission-top: #2A3650;
  --mission-shadow: rgba(30, 39, 56, 0.14);
}
:global([data-theme='dark']) .landing {
  --mission-top: #1F2838;
  --mission-shadow: rgba(0, 0, 0, 0.35);
}

/* Sin JS o con movimiento reducido queda un arco fijo; con scroll se reemplaza por el círculo. */
.mission {
  background: linear-gradient(180deg, var(--mission-top) 0%, var(--color-structure-base) 360px);
  padding: 184px 24px 120px;
  position: relative;
  overflow: hidden;
  margin-top: -96px;
  border-radius: 50% 50% 0 0 / 120px 120px 0 0;
  box-shadow: 0 -24px 64px var(--mission-shadow);
  will-change: clip-path;
}
.mission--circle {
  border-radius: 0;
  box-shadow: none;
}
.mission::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 55%;
  height: 130%;
  background: radial-gradient(ellipse at center, rgba(45, 88, 120, 0.45) 0%, transparent 65%);
  pointer-events: none;
}

.mission__inner {
  max-width: 1120px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.mission__track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
}
.mission__track::before {
  content: '';
  position: absolute;
  top: 9px;
  left: 9px;
  right: 0;
  height: 2px;
  background:
    linear-gradient(90deg, var(--color-warning) 0%, var(--color-warning) 50%, transparent 50%) 0 0 / 100% 2px no-repeat,
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.28) 0 8px, transparent 8px 16px);
}

.mission__node {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: relative;
  margin-bottom: 36px;
}
.mission__node--now {
  background: var(--color-warning);
  box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.18);
}
.mission__node--next {
  background: var(--color-structure-base);
  border: 2px solid rgba(255, 255, 255, 0.55);
}

.mission__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-warning);
  margin: 0 0 14px;
}
.mission__block--next .mission__label {
  color: rgba(255, 255, 255, 0.6);
}

.mission__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.6rem, 2.8vw, 2.3rem);
  font-weight: 400;
  color: #fff;
  margin: 0 0 20px;
  line-height: 1.2;
  max-width: 18ch;
}

.mission__text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.58);
  line-height: 1.75;
  font-weight: 300;
  margin: 0;
  max-width: 52ch;
}

.footer {
  background: #161d2a;
  padding: 28px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer__copy {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.28);
}

.footer__links {
  display: flex;
  gap: 20px;
}

.footer__link {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.28);
  transition: color 0.15s;
  text-decoration: none;
}
.footer__link:hover { color: rgba(255, 255, 255, 0.65); }

@media (max-width: 900px) {
  /* La lista de funcionalidades pasa a acordeón y el panel se oculta */
  .features__layout { grid-template-columns: minmax(0, 1fr); }
  .feature-stage { display: none; }
  .features__list { border-top: 1px solid var(--color-bg-border); }
  .features__list li { border-bottom: 1px solid var(--color-bg-border); }
  .feature-tab { flex-direction: column; align-items: flex-start; gap: 0; padding: 20px 0 20px 20px; }
  .feature-tab[aria-selected='true']::before { height: calc(100% - 40px); }
  .feature-tab[aria-selected='true'] .feature-tab__desc {
    display: block;
    margin: 10px 0 0;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    line-height: 1.65;
    font-weight: 300;
  }
  .benefits__inner { grid-template-columns: minmax(0, 1fr); gap: 40px; }
  .benefits__intro { position: static; }
  .mission__track { grid-template-columns: 1fr; gap: 56px; padding-left: 40px; }
  .mission__track::before {
    top: 0; bottom: 0; left: 9px; right: auto; width: 2px; height: auto;
    background:
      linear-gradient(180deg, var(--color-warning) 0%, var(--color-warning) 50%, transparent 50%) 0 0 / 2px 100% no-repeat,
      repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0 8px, transparent 8px 16px);
  }
  .mission__node { position: absolute; left: -40px; margin: 0; }
  .mission__block { position: relative; }
}

@media (max-width: 900px) and (min-width: 601px) {
  .mission { padding-top: 160px; border-radius: 50% 50% 0 0 / 88px 88px 0 0; margin-top: -72px; }
}

@media (max-width: 600px) {
  .navbar { padding: 0 20px; }
  .features { padding: 88px 16px; }
  .benefits { padding: 24px 16px 136px; }
  .benefits__grid { grid-template-columns: minmax(0, 1fr); }
  .benefit-tile { min-height: 0; padding-top: 112px; }
  .benefit-tile:nth-child(even) { transform: none; }
  .mission { padding: 112px 16px 88px; border-radius: 50% 50% 0 0 / 44px 44px 0 0; margin-top: -40px; }
  .hero__stats { flex-direction: column; }
  .hero__stat {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .hero__stat:last-child { border-bottom: none; }
  .footer { padding: 24px 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .feature-stage__icon,
  .feature-stage__body { animation: none; }
  .feature-tab::before,
  .benefit-tile__mark { transition: none; }
}
</style>
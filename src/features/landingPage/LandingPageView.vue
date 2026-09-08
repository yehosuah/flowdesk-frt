
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
      <p class="section-eyebrow">Funcionalidades</p>
      <h2 class="section-title">Con Flowdesk podrás:</h2>

      <div class="features__grid">
        <div
          v-for="feat in features"
          :key="feat.title"
          class="feature-card"
          :style="{ '--card-accent': feat.accent, '--card-accent-soft': feat.accentSoft }"
        >
          <div class="feature-card__icon" :style="{ background: feat.accent }" v-html="feat.icon" />
          <p class="feature-card__title">{{ feat.title }}</p>
          <p class="feature-card__desc">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <section class="benefits">
      <div class="benefits__inner">
        <div class="benefits__intro">
          <p class="section-eyebrow section-eyebrow--left">Beneficios</p>
          <h2 class="benefits__title">Beneficios de trabajar con nosotros</h2>
          <p class="benefits__text">
            FlowDesk no solo organiza tu operación: la hace más rápida, más precisa y más fácil de escalar.
          </p>
        </div>

        <div class="benefits__list">
          <div v-for="benefit in benefits" :key="benefit.title" class="benefit-item">
            <div class="benefit-item__icon" :style="{ background: benefit.accentSoft, color: benefit.accent }" v-html="benefit.icon" />
            <div>
              <h3 class="benefit-item__title">{{ benefit.title }}</h3>
              <p class="benefit-item__desc">{{ benefit.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mission">
      <div class="mission__inner">
        <div v-for="block in missionBlocks" :key="block.label" class="mission__block">
          <p class="mission__block-label">{{ block.label }}</p>
          <h3 class="mission__block-title">{{ block.title }}</h3>
          <p class="mission__block-text">{{ block.text }}</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <span class="footer__copy">© 2025 FlowDesk. Todos los derechos reservados.</span>

    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import HeroCarousel from './components/HeroCarousel.vue';

const scrolled = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 20;
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

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

/* ── FEATURES ───────────────────────────────────────────── */
.features {
  background: var(--color-bg-app);
  padding: 130px 24px 120px;
}

.section-eyebrow {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 14px;
}
.section-eyebrow--left {
  text-align: left;
}

.section-title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 400;
  color: var(--color-heading);
  text-align: center;
  margin: 0 0 64px;
  line-height: 1.2;
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

.features__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-structure-subtle);
  border-radius: 14px;
  padding: 44px 32px;
  text-align: center;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
  box-shadow: var(--shadow-card);
  position: relative;
}
.feature-card:hover {
  background: var(--card-accent-soft);
  border-color: var(--card-accent);
  box-shadow: 0 20px 40px rgba(13, 17, 24, 0.1);
  transform: translateY(-5px);
  z-index: 1;
}

.feature-card__icon {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: #fff;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}
.feature-card:hover .feature-card__icon {
  transform: scale(1.06);
}

.feature-card__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: 1.15rem;
  font-weight: 400;
  color: var(--color-heading);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
  line-height: 1.35;
}

.feature-card__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.65;
  font-weight: 300;
  margin: 0;
}

/* ── BENEFITS ───────────────────────────────────────────── */
.benefits {
  background: var(--color-bg-surface);
  padding: 110px 24px;
}

.benefits__inner {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 64px;
  align-items: start;
}

.benefits__intro {
  position: sticky;
  top: 120px;
}

.benefits__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 400;
  color: var(--color-heading);
  margin: 0 0 16px;
  line-height: 1.25;
}

.benefits__text {
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.7;
  font-weight: 300;
  margin: 0;
}

.benefits__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefit-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 18px;
  margin: 0 -18px;
  border-radius: 14px;
  transition: background 0.25s ease;
}
.benefit-item:hover {
  background: var(--color-bg-row-alt);
}

.benefit-item__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}
.benefit-item:hover .benefit-item__icon {
  transform: scale(1.08);
}

.benefit-item__title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--color-heading);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.benefit-item__desc {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.65;
  font-weight: 300;
  margin: 0;
}

.mission {
  background: var(--color-structure-base);
  padding: 100px 24px;
  position: relative;
  overflow: hidden;
}
.mission::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 40%; height: 100%;
  background: radial-gradient(ellipse at right, rgba(45, 88, 120, 0.4) 0%, transparent 60%);
  pointer-events: none;
}

.mission__inner {
  max-width: 1060px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: start;
  position: relative;
  z-index: 1;
}

.mission__block-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mission__block-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.mission__block-title {
  font-family: 'DM Serif Display', var(--font-sans);
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  font-weight: 400;
  color: #fff;
  margin: 0 0 18px;
  line-height: 1.25;
}

.mission__block-text {
  font-size: 0.975rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.75;
  font-weight: 300;
  margin: 0;
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
  .features__grid { grid-template-columns: repeat(2, 1fr); }
  .benefits__inner { grid-template-columns: 1fr; gap: 40px; }
  .benefits__intro { position: static; }
  .mission__inner { grid-template-columns: 1fr; gap: 40px; }
}

@media (max-width: 600px) {
  .navbar { padding: 0 20px; }
  .features__grid { grid-template-columns: 1fr; }
  .hero__stats { flex-direction: column; }
  .hero__stat {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .hero__stat:last-child { border-bottom: none; }
  .footer { padding: 24px 20px; }
}
</style>
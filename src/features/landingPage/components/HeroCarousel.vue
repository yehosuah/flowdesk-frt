<template>
  <section ref="containerRef" class="hero-carousel">
    <div ref="trackRef" class="carousel-track">
      <div
        v-for="(item, index) in loopedItems"
        :key="`${item.id}-${index}`"
        :ref="(el) => setCardRef(el, index)"
        class="carousel-item"
      >
        <img
          v-if="item.src"
          :src="item.src"
          :alt="item.alt || ''"
          class="image-placeholder"
          loading="lazy"
        />
        <div v-else class="image-placeholder image-placeholder--empty" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, type ComponentPublicInstance, } from "vue";
import HeroCarousel1 from "../assets/HeroCarousel1.png";
import HeroCarousel2 from "../assets/HeroCarousel2.png";
import HeroCarousel3 from "../assets/HeroCarousel3.png";
import HeroCarousel4 from "../assets/HeroCarousel4.png";
import HeroCarousel5 from "../assets/HeroCarousel5.png";

// Reemplaza cada "src" con la ruta real de tu imagen (por ejemplo
// desde /src/assets/... o una URL). El "alt" es el texto alternativo
// para accesibilidad / SEO — describe brevemente la foto.
const items = [
  { id: 1, src: HeroCarousel1, alt: "HeroCarousel1" },
  { id: 2, src: HeroCarousel2, alt: "HeroCarousel2" },
  { id: 3, src: HeroCarousel3, alt: "HeroCarousel3" },
  { id: 4, src: HeroCarousel4, alt: "HeroCarousel4" },
  { id: 5, src: HeroCarousel5, alt: "HeroCarousel5" },
  { id: 6, src: HeroCarousel1, alt: "HeroCarousel1" },
  { id: 7, src: HeroCarousel2, alt: "HeroCarousel2" },
  { id: 8, src: HeroCarousel3, alt: "HeroCarousel3" },
  { id: 9, src: HeroCarousel4, alt: "HeroCarousel4" },
  { id: 10, src: HeroCarousel5, alt: "HeroCarousel5" },
];

// Duplicamos la lista para que el loop horizontal sea continuo y sin cortes.
const loopedItems = computed(() => [...items, ...items]);

const containerRef = ref<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const cardEls = ref<(HTMLElement | null)[]>([]);

function setCardRef( el: Element | ComponentPublicInstance | null, index: number) 
{
  if (el instanceof HTMLElement) {
    cardEls.value[index] = el;
  } else {
    cardEls.value[index] = null;
  }
}

// --- Config del "curveado" ---
const pxPerSecond = 60; // velocidad del desplazamiento horizontal
const maxLift = 14; // cuánto se desplaza verticalmente en el borde (arco sutil)
const minScale = 0.78; // qué tan chica se ve la tarjeta en el borde (profundidad)

let offsetX = 0;
let rafId = 0;
let lastTime = 0;
let paused = false;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function tick(now: number) {
  if (!lastTime) lastTime = now;
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (!paused && trackRef.value) {
    offsetX += dt * pxPerSecond;
    const half = trackRef.value.scrollWidth / 2;
    if (half > 0 && offsetX >= half) offsetX -= half;
    trackRef.value.style.transform = `translateX(-${offsetX}px)`;
  }

  // Calculamos la posición en el "arco" según dónde está cada tarjeta en pantalla
  if (containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const halfWidth = containerRect.width / 2;

    for (const el of cardEls.value) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const norm = clamp((cardCenter - centerX) / halfWidth, -1, 1);
      // Easing cúbico: el centro queda casi plano, el arco se concentra en los extremos
      const eased = norm * norm * norm;
      const lift = Math.abs(eased) * maxLift;
      // La escala usa |norm| directo para que la profundidad se note en un
      // rango más amplio de tarjetas, no solo en las últimas.
      const scale = 1 - Math.abs(norm) * (1 - minScale);
      // Sin rotate(): las tarjetas viajan por el arco pero siempre quedan rectas.
      el.style.transform = `translateY(${lift}px) scale(${scale})`;
      el.style.zIndex = String(Math.round((1 - Math.abs(norm)) * 100));
    }
  }

  rafId = requestAnimationFrame(tick);
}

function handleEnter() {
  paused = true;
}
function handleLeave() {
  paused = false;
  lastTime = 0;
}

onMounted(() => {
  rafId = requestAnimationFrame(tick);
  containerRef.value?.addEventListener("mouseenter", handleEnter);
  containerRef.value?.addEventListener("mouseleave", handleLeave);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  containerRef.value?.removeEventListener("mouseenter", handleEnter);
  containerRef.value?.removeEventListener("mouseleave", handleLeave);
});
</script>

<style scoped>
.hero-carousel {
  /* Full-bleed: ocupa todo el ancho del navegador */
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  box-sizing: border-box;

  padding-left: clamp(16px, 5vw, 80px);
  padding-right: clamp(16px, 5vw, 80px);
  padding-top: 1px;
  margin-top: 20px;
  padding-bottom: 30px;
  overflow: hidden;

  mask-image: linear-gradient(
    to right,
    transparent,
    black 5%,
    black 95%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 5%,
    black 95%,
    transparent
  );
}

.carousel-track {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.2vw, 20px);
  width: max-content;
  will-change: transform;
}

.carousel-item {
  flex: 0 0 auto;
  width: clamp(220px, 20vw, 400px);
  will-change: transform;
}

.image-placeholder {
  display: block;
  width: 100%;
  /* Proporción fija: así la tarjeta no se deforma entre breakpoints */
  aspect-ratio: 3 / 4;
  height: auto;
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  object-fit: cover;
}

.image-placeholder--empty {
  background: linear-gradient(135deg, var(--color-bg-subtle), var(--color-bg-active), var(--color-bg-subtle));
}

@media (max-width: 480px) {
  .carousel-item {
    width: clamp(170px, 44vw, 240px);
  }
}
</style>
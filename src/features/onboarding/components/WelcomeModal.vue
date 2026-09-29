<template>
  <Modal 
    :model-value="modelValue" 
    title="¡Bienvenido a FlowDesk!" 
    @update:model-value="$emit('update:modelValue', $event)"
    @close="$emit('close')"
  >
    <div class="welcome-content">
      <p class="welcome-text">
        Estamos emocionados de tenerte aquí. FlowDesk está diseñado para ayudarte a gestionar tu inventario, clientes y ventas de la forma más sencilla posible.
      </p>
      
      <div class="welcome-features">
        <div class="feature-item">
          <div class="feature-icon"><Package :size="24" class="icon-primary" /></div>
          <div class="feature-text">
            <strong>Control Total</strong>
            <span>Gestiona entradas y salidas al instante.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><Users :size="24" class="icon-primary" /></div>
          <div class="feature-text">
            <strong>Tus Clientes</strong>
            <span>Directorio y seguimiento de tus mejores compradores.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><BarChart3 :size="24" class="icon-primary" /></div>
          <div class="feature-text">
            <strong>Análisis Inteligente</strong>
            <span>Métricas clave para hacer crecer tu negocio.</span>
          </div>
        </div>
      </div>

      <p class="welcome-text">
        ¿Te gustaría dar un recorrido rápido para conocer dónde está cada cosa?
      </p>
    </div>

    <template #footer>
      <Button variant="ghost" @click="$emit('skip')">
        Omitir por ahora
      </Button>
      <Button variant="primary" @click="$emit('startTour')">
        Iniciar recorrido
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { Modal, Button } from '@/app/components/ui';
import { Package, Users, BarChart3 } from 'lucide-vue-next';

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'skip'): void;
  (e: 'startTour'): void;
}>();
</script>

<style scoped>
.welcome-content {
  padding: 10px 0;
}

.welcome-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text-secondary, #4b5563);
  margin-bottom: 20px;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  background: var(--color-bg-subtle, #f3f4f6);
  padding: 16px;
  border-radius: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-text strong {
  font-size: 0.95rem;
  color: var(--color-heading, #111827);
}

.feature-text span {
  font-size: 0.85rem;
  color: var(--color-text-muted, #6b7280);
}
.icon-primary { color: var(--color-structure-base, #3b82f6); }
</style>

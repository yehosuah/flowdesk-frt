<template>
  <section class="chat-panel" aria-label="Asistente de FlowDesk">
    <header class="chat-panel__header">
      <div class="chat-panel__identity">
        <div class="chat-panel__avatar">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div>
          <h2 class="chat-panel__title">Asistente FlowDesk</h2>
          <p class="chat-panel__status">Asistente inteligente</p>
        </div>
      </div>

      <button
        class="chat-panel__close"
        type="button"
        aria-label="Cerrar asistente"
        @click="closeChat"
      >
        ×
      </button>
    </header>

    <div
      ref="messagesContainer"
      class="chat-panel__messages"
    >
      <div
        v-if="messages.length === 0 && !isLoading"
        class="chat-panel__welcome"
      >
        <div class="chat-panel__welcome-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 9h8M8 13h5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <h3>¿En qué puedo ayudarte?</h3>

        <p>
          Pregúntame sobre la información de tu negocio y te ayudaré a encontrar respuestas.
        </p>
      </div>

      <div
        v-else
        class="chat-panel__conversation"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="[
            `chat-message--${message.role}`,
            { 'chat-message--error': message.isError },
          ]"
        >
          <span class="chat-message__author">
            {{ message.role === 'user' ? 'Tú' : 'Asistente FlowDesk' }}
          </span>

          <div
            v-if="message.isError"
            class="chat-message__bubble chat-error"
            role="alert"
          >
            <div class="chat-error__header">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 8v5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <circle
                  cx="12"
                  cy="16.5"
                  r="1"
                  fill="currentColor"
                />
              </svg>

              <strong>No se pudo completar la consulta</strong>
            </div>

            <p class="chat-error__message">
              {{ message.content }}
            </p>

            <button
              v-if="message.retryContent"
              class="chat-error__retry"
              type="button"
              :disabled="isLoading"
              @click="retryMessage(message)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 11a8 8 0 1 0 2 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M20 4v7h-7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              Reintentar
            </button>
          </div>

          <div
            v-else-if="message.role === 'assistant'"
            class="chat-message__bubble chat-message__content"
            v-html="renderMarkdown(message.content)"
          ></div>

          <div
            v-else
            class="chat-message__bubble"
          >
            {{ message.content }}
          </div>
        </div>

        <div
          v-if="isLoading"
          class="chat-message chat-message--assistant"
          aria-live="polite"
        >
          <span class="chat-message__author">
            Asistente FlowDesk
          </span>

          <div class="chat-message__bubble chat-message__bubble--loading">
            <span class="chat-loading__dot"></span>
            <span class="chat-loading__dot"></span>
            <span class="chat-loading__dot"></span>
            <span class="chat-loading__text">Pensando...</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="chat-panel__footer">
      <div class="chat-panel__input-wrapper">
        <textarea
          v-model="messageInput"
          class="chat-panel__input"
          rows="1"
          placeholder="Escribe tu pregunta..."
          aria-label="Escribe tu pregunta"
          :disabled="isLoading"
          @keydown.enter.prevent="sendMessage"
        />

        <button
          class="chat-panel__send"
          type="button"
          aria-label="Enviar mensaje"
          :disabled="!messageInput.trim() || isLoading"
          @click="sendMessage"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m22 2-7 20-4-9-9-4 20-7Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M22 2 11 13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <p class="chat-panel__disclaimer">
        Las respuestas pueden contener errores. Verifica la información importante.
      </p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { sendChatMessage } from '@/features/chatbot/api';
import {
  ApiError,
  getApiErrorMessage,
} from '@/services/apiClient';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isError?: boolean;
  retryContent?: string;
}

const emit = defineEmits<{
  close: [];
}>();

const messageInput = ref('');
const messages = ref<ChatMessage[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const conversationId = ref<string | null>(null);
const isLoading = ref(false);

let localMessageId = 1;

marked.setOptions({
  breaks: true,
  gfm: true,
});

function renderMarkdown(content: string): string {
  const html = marked.parse(content, {
    async: false,
  });

  return DOMPurify.sanitize(html);
}

async function scrollToBottom(): Promise<void> {
  await nextTick();

  if (!messagesContainer.value) {
    return;
  }

  messagesContainer.value.scrollTop =
    messagesContainer.value.scrollHeight;
}

function closeChat(): void {
  emit('close');
}

function getFriendlyErrorMessage(error: unknown): string {
  const originalMessage = getApiErrorMessage(error);
  const normalizedMessage = originalMessage.toLowerCase();

  if (
    normalizedMessage.includes('already in progress') ||
    normalizedMessage.includes('already processing')
  ) {
    return 'Ya hay una consulta en proceso. Espera un momento antes de volver a intentarlo.';
  }

  if (
    normalizedMessage.includes('no hay una sesión activa') ||
    normalizedMessage.includes('no hay una sesion activa') ||
    normalizedMessage.includes('no active session')
  ) {
    return 'No hay una sesión activa para completar esta solicitud. Intenta nuevamente.';
  }

  if (error instanceof ApiError) {
    if (error.status === 408) {
      return 'La respuesta está tardando más de lo esperado. Puedes volver a intentarlo.';
    }

    if (error.status === 0) {
      return 'No fue posible comunicarse con el asistente. Revisa tu conexión e intenta nuevamente.';
    }

    if (error.status === 401) {
      return 'Tu sesión ya no es válida. Inicia sesión nuevamente para continuar.';
    }

    if (error.status === 429) {
      return 'El asistente está recibiendo demasiadas solicitudes. Espera un momento antes de reintentar.';
    }

    if (error.status >= 500) {
      return 'El asistente no está disponible temporalmente. Intenta nuevamente en unos momentos.';
    }
  }

  return originalMessage;
}

async function requestAssistantResponse(
  content: string,
  errorMessage?: ChatMessage,
): Promise<void> {
  if (isLoading.value) {
    return;
  }

  if (errorMessage) {
    const errorIndex = messages.value.findIndex(
      (message) => message.id === errorMessage.id,
    );

    if (errorIndex !== -1) {
      messages.value.splice(errorIndex, 1);
    }
  }

  isLoading.value = true;

  await scrollToBottom();

  try {
    const response = await sendChatMessage(
      content,
      conversationId.value,
    );

    conversationId.value = response.conversation_id;

    messages.value.push({
      id: response.message_id,
      role: 'assistant',
      content: response.answer,
    });
  } catch (error) {
    messages.value.push({
      id: `error-${localMessageId++}`,
      role: 'assistant',
      content: getFriendlyErrorMessage(error),
      isError: true,
      retryContent: content,
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
}

async function sendMessage(): Promise<void> {
  const content = messageInput.value.trim();

  if (!content || isLoading.value) {
    return;
  }

  messages.value.push({
    id: `user-${localMessageId++}`,
    role: 'user',
    content,
  });

  messageInput.value = '';

  await requestAssistantResponse(content);
}

async function retryMessage(message: ChatMessage): Promise<void> {
  if (!message.retryContent || isLoading.value) {
    return;
  }

  await requestAssistantResponse(
    message.retryContent,
    message,
  );
}
</script>

<style scoped>
.chat-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 48px));
  height: min(560px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  background: var(--color-bg-app);
  color: var(--color-text-primary, inherit);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
}

.chat-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  background: var(--color-structure-base);
  color: #fff;
}

.chat-panel__identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-panel__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.chat-panel__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.chat-panel__status {
  margin: 3px 0 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.75rem;
}

.chat-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-family: inherit;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
}

.chat-panel__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.chat-panel__close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.chat-panel__messages {
  flex: 1;
  min-height: 0;
  padding: 24px 20px;
  overflow-y: auto;
}

.chat-panel__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 290px;
  margin: 54px auto 0;
  text-align: center;
}

.chat-panel__welcome-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: var(--color-structure-base);
  color: #fff;
}

.chat-panel__welcome h3 {
  margin: 0 0 8px;
  font-size: 1.05rem;
}

.chat-panel__welcome p {
  margin: 0;
  opacity: 0.7;
  font-size: 0.85rem;
  line-height: 1.5;
}

.chat-panel__conversation {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-message {
  display: flex;
  flex-direction: column;
  max-width: 84%;
}

.chat-message--user {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-message--assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.chat-message__author {
  margin: 0 5px 5px;
  opacity: 0.55;
  font-size: 0.68rem;
  font-weight: 600;
}

.chat-message__bubble {
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 0.84rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.chat-message--user .chat-message__bubble {
  border-bottom-right-radius: 4px;
  background: var(--color-structure-base);
  color: #fff;
}

.chat-message--assistant .chat-message__bubble {
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-bottom-left-radius: 4px;
  background: rgba(127, 127, 127, 0.12);
}

.chat-message--error {
  max-width: 90%;
}

.chat-message--error .chat-message__bubble {
  background: rgba(220, 80, 80, 0.08);
}

.chat-error {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.chat-error__header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
}

.chat-error__message {
  margin: 0;
  opacity: 0.8;
  font-size: 0.8rem;
  line-height: 1.45;
}

.chat-error__retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid currentColor;
  border-radius: 8px;
  background: transparent;
  color: var(--color-structure-hover);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.chat-error__retry:hover:not(:disabled) {
  background: var(--color-structure-hover);
  color: #fff;
}

.chat-error__retry:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chat-error__retry:focus-visible {
  outline: 2px solid var(--color-structure-hover);
  outline-offset: 2px;
}

.chat-message__content {
  line-height: 1.5;
}

.chat-message__content :deep(p) {
  margin: 0 0 10px;
}

.chat-message__content :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-message__content :deep(strong) {
  font-weight: 700;
}

.chat-message__content :deep(em) {
  font-style: italic;
}

.chat-message__content :deep(ul),
.chat-message__content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.chat-message__content :deep(li) {
  margin: 5px 0;
}

.chat-message__content :deep(li > p) {
  margin: 0;
}

.chat-message__content :deep(h1),
.chat-message__content :deep(h2),
.chat-message__content :deep(h3),
.chat-message__content :deep(h4) {
  margin: 12px 0 7px;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.chat-message__content :deep(h1:first-child),
.chat-message__content :deep(h2:first-child),
.chat-message__content :deep(h3:first-child),
.chat-message__content :deep(h4:first-child) {
  margin-top: 0;
}

.chat-message__content :deep(a) {
  color: var(--color-structure-hover);
  text-decoration: underline;
  overflow-wrap: anywhere;
}

.chat-message__content :deep(code) {
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(127, 127, 127, 0.15);
  font-family: monospace;
  font-size: 0.8rem;
}

.chat-message__content :deep(blockquote) {
  margin: 8px 0;
  padding-left: 10px;
  border-left: 3px solid var(--color-structure-hover);
  opacity: 0.85;
}

.chat-message__bubble--loading {
  display: flex;
  align-items: center;
  gap: 5px;
}

.chat-loading__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.35;
  animation: chat-loading 1.2s infinite ease-in-out;
}

.chat-loading__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.chat-loading__dot:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-loading__text {
  margin-left: 4px;
  opacity: 0.65;
  font-size: 0.78rem;
}

@keyframes chat-loading {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.chat-panel__footer {
  flex-shrink: 0;
  padding: 14px 16px 12px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.chat-panel__input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.14));
  border-radius: 12px;
  background: var(--color-bg-app);
}

.chat-panel__input {
  flex: 1;
  min-height: 24px;
  max-height: 100px;
  padding: 5px 6px;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 0.86rem;
  line-height: 1.4;
}

.chat-panel__input::placeholder {
  opacity: 0.55;
  color: inherit;
}

.chat-panel__input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.chat-panel__send {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-structure-hover);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.chat-panel__send:hover:not(:disabled) {
  background: var(--color-structure-hover);
  color: #fff;
}

.chat-panel__send:disabled {
  background: transparent;
  color: var(--color-text-faint);
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-panel__send:focus-visible {
  outline: 2px solid var(--color-structure-hover);
  outline-offset: 2px;
}

.chat-panel__disclaimer {
  margin: 8px 4px 0;
  opacity: 0.5;
  font-size: 0.66rem;
  line-height: 1.35;
  text-align: center;
}

@media (max-width: 480px) {
  .chat-panel {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
    height: calc(100dvh - 24px);
    border-radius: 14px;
  }

  .chat-panel__welcome {
    margin-top: 36px;
  }
}
</style>
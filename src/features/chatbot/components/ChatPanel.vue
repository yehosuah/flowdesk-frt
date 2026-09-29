<template>
  <section
    class="chat-panel"
    aria-label="Asistente de FlowDesk"
  >
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
          <h2 class="chat-panel__title">
            Asistente FlowDesk
          </h2>

          <p class="chat-panel__status">
            Asistente inteligente
          </p>
        </div>
      </div>

      <button
        class="chat-panel__close"
        type="button"
        aria-label="Cerrar asistente"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <div
      ref="messagesContainer"
      class="chat-panel__messages"
    >
      <div
        v-if="messages.length === 0"
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
          :class="`chat-message--${message.role}`"
        >
          <span class="chat-message__author">
            {{ message.role === 'user' ? 'Tú' : 'Asistente FlowDesk' }}
          </span>

          <div class="chat-message__bubble">
            {{ message.content }}
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
          @keydown.enter.prevent="sendMessage"
        />

        <button
          class="chat-panel__send"
          type="button"
          aria-label="Enviar mensaje"
          :disabled="!messageInput.trim()"
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
import {
  nextTick,
  ref,
} from 'vue';

import { sendChatMessage } from '@/features/chatbot/api';
import { getApiErrorMessage } from '@/services/apiClient';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const emit = defineEmits<{
  close: [];
}>();

const messageInput = ref('');
const messages = ref<ChatMessage[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const conversationId = ref<string | null>(null);

let localMessageId = 1;

async function scrollToBottom(): Promise<void> {
  await nextTick();

  if (!messagesContainer.value) {
    return;
  }

  messagesContainer.value.scrollTop =
    messagesContainer.value.scrollHeight;
}

async function sendMessage(): Promise<void> {
  const content = messageInput.value.trim();

  if (!content) {
    return;
  }

  messages.value.push({
    id: `user-${localMessageId++}`,
    role: 'user',
    content,
  });

  messageInput.value = '';

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
      content: getApiErrorMessage(error),
    });
  }

  await scrollToBottom();
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
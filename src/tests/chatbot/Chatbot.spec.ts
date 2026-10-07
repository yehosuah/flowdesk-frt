import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  flushPromises,
  mount,
} from '@vue/test-utils';

import ChatPanel from '@/features/chatbot/components/ChatPanel.vue';
import ChatWidget from '@/features/chatbot/components/ChatWidget.vue';
import { ApiError } from '@/services/apiClient';

const mocks = vi.hoisted(() => ({
  sendChatMessage: vi.fn(),
}));

vi.mock('@/features/chatbot/api', () => ({
  sendChatMessage: mocks.sendChatMessage,
}));

describe('Chatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emite open al presionar el botón flotante', async () => {
    const wrapper = mount(ChatWidget);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('open')).toHaveLength(1);
  });

  it('emite close al presionar cerrar en el panel', async () => {
    const wrapper = mount(ChatPanel);

    await wrapper.find('.chat-panel__close').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('muestra el mensaje del usuario y la respuesta del asistente', async () => {
    mocks.sendChatMessage.mockResolvedValue({
      conversation_id: 'conversation-1',
      message_id: 'assistant-1',
      answer: '**Inventario:** tienes 4 productos activos.',
      created_at: '2026-09-29T18:00:00Z',
      expires_at: '2026-09-29T19:00:00Z',
      sources: [],
      limitations: [],
    });

    const wrapper = mount(ChatPanel);

    const input = wrapper.find('.chat-panel__input');

    await input.setValue('¿Cuántos productos tengo?');
    await wrapper.find('.chat-panel__send').trigger('click');

    await flushPromises();

    expect(mocks.sendChatMessage).toHaveBeenCalledWith(
      '¿Cuántos productos tengo?',
      null,
    );

    expect(wrapper.text()).toContain(
      '¿Cuántos productos tengo?',
    );

    expect(wrapper.text()).toContain(
      'Inventario: tienes 4 productos activos.',
    );
  });

  it('muestra el estado Pensando mientras espera la respuesta', async () => {
    let resolveRequest!: (value: unknown) => void;

    mocks.sendChatMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const wrapper = mount(ChatPanel);

    await wrapper
      .find('.chat-panel__input')
      .setValue('Consulta de prueba');

    await wrapper.find('.chat-panel__send').trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Pensando...');

    expect(
      wrapper.find('.chat-panel__input').attributes('disabled'),
    ).toBeDefined();

    expect(
      wrapper.find('.chat-panel__send').attributes('disabled'),
    ).toBeDefined();

    resolveRequest({
      conversation_id: 'conversation-1',
      message_id: 'assistant-1',
      answer: 'Respuesta lista.',
      created_at: '2026-09-29T18:00:00Z',
      expires_at: '2026-09-29T19:00:00Z',
      sources: [],
      limitations: [],
    });

    await flushPromises();

    expect(wrapper.text()).not.toContain('Pensando...');
    expect(wrapper.text()).toContain('Respuesta lista.');
  });

  it('muestra un error y permite reintentar la consulta', async () => {
    mocks.sendChatMessage
      .mockRejectedValueOnce(
        new ApiError(
          408,
          'La solicitud tardó demasiado tiempo.',
        ),
      )
      .mockResolvedValueOnce({
        conversation_id: 'conversation-2',
        message_id: 'assistant-2',
        answer: 'Respuesta obtenida después del reintento.',
        created_at: '2026-09-29T18:00:00Z',
        expires_at: '2026-09-29T19:00:00Z',
        sources: [],
        limitations: [],
      });

    const wrapper = mount(ChatPanel);

    await wrapper
      .find('.chat-panel__input')
      .setValue('Consulta con error');

    await wrapper.find('.chat-panel__send').trigger('click');

    await flushPromises();

    expect(wrapper.text()).toContain(
      'No se pudo completar la consulta',
    );

    expect(wrapper.text()).toContain('Reintentar');

    expect(wrapper.text()).toContain(
      'La respuesta está tardando más de lo esperado.',
    );

    await wrapper.find('.chat-error__retry').trigger('click');

    await flushPromises();

    expect(mocks.sendChatMessage).toHaveBeenCalledTimes(2);

    expect(mocks.sendChatMessage).toHaveBeenNthCalledWith(
      2,
      'Consulta con error',
      null,
    );

    expect(wrapper.text()).toContain(
      'Respuesta obtenida después del reintento.',
    );

    expect(wrapper.text()).not.toContain(
      'No se pudo completar la consulta',
    );
  });

  it('no duplica el mensaje del usuario al reintentar', async () => {
    mocks.sendChatMessage
      .mockRejectedValueOnce(
        new ApiError(
          408,
          'La solicitud tardó demasiado tiempo.',
        ),
      )
      .mockResolvedValueOnce({
        conversation_id: 'conversation-3',
        message_id: 'assistant-3',
        answer: 'Consulta recuperada.',
        created_at: '2026-09-29T18:00:00Z',
        expires_at: '2026-09-29T19:00:00Z',
        sources: [],
        limitations: [],
      });

    const wrapper = mount(ChatPanel);

    await wrapper
      .find('.chat-panel__input')
      .setValue('Mensaje único');

    await wrapper.find('.chat-panel__send').trigger('click');

    await flushPromises();

    await wrapper.find('.chat-error__retry').trigger('click');

    await flushPromises();

    const userMessages = wrapper.findAll(
      '.chat-message--user',
    );

    expect(userMessages).toHaveLength(1);
    expect(userMessages[0].text()).toContain('Mensaje único');
  });
});
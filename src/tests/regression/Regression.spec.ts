import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import ClientView from '@/features/clients/views/ClientView.vue';
import SuppliersView from '@/features/suppliers/views/SuppliersView.vue';
import ChatPanel from '@/features/chatbot/components/ChatPanel.vue';

import {
  fetchClients,
  toggleClientStatus,
  type Client,
} from '@/features/clients/api';

import {
  fetchSuppliers,
  fetchSupplierProducts,
  toggleSupplierStatus,
  type Supplier,
} from '@/features/suppliers/api';

import { ApiError } from '@/services/apiClient';

const chatMocks = vi.hoisted(() => ({
  sendChatMessage: vi.fn(),
}));

vi.mock('@/features/clients/api', () => ({
  fetchClients: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  toggleClientStatus: vi.fn(),
}));

vi.mock('@/features/suppliers/api', () => ({
  fetchSuppliers: vi.fn(),
  fetchSupplierProducts: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  toggleSupplierStatus: vi.fn(),
}));

vi.mock('@/features/chatbot/api', () => ({
  sendChatMessage: chatMocks.sendChatMessage,
}));

vi.mock('@/services/apiClient', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/apiClient')>();

  return {
    ...actual,
    getApiErrorMessage: vi.fn((err: unknown) =>
      err instanceof Error ? err.message : 'Error',
    ),
  };
});

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    role: { value: 'admin' },
    is: () => true,
    can: () => true,
    canAccessRoute: () => true,
  }),
}));

function makeClient(
  overrides: Partial<Client> = {},
): Client {
  return {
    id: '1',
    nombre: 'Cliente Activo',
    telefono: '55551234',
    correo: 'cliente@test.com',
    direccion: 'Zona 1',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeSupplier(
  overrides: Partial<Supplier> = {},
): Supplier {
  return {
    id: '1',
    nombre: 'Proveedor Activo',
    telefono: '55551234',
    correo: 'proveedor@test.com',
    direccion: 'Zona 1',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('Pruebas de regresión - FlowDesk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchSupplierProducts).mockResolvedValue([]);
  });

  it('REG-01 conserva el flujo de desactivación de clientes', async () => {
    const active = makeClient();
    const deactivated = {
      ...active,
      is_active: false,
    };

    vi.mocked(fetchClients).mockResolvedValue([active]);

    vi.mocked(toggleClientStatus).mockResolvedValue(
      deactivated,
    );

    const wrapper = mount(ClientView);
    await flushPromises();

    await wrapper
      .find('.btn-icon-action')
      .trigger('click');

    await wrapper
      .find('.btn-status-toggle')
      .trigger('click');

    await flushPromises();

    expect(wrapper.text()).toContain(
      'Desactivar cliente',
    );

    expect(
      wrapper.find('.btn-danger').exists(),
    ).toBe(true);

    await wrapper
      .find('.btn-danger')
      .trigger('click');

    await flushPromises();

    expect(toggleClientStatus).toHaveBeenCalledWith(
      '1',
      false,
    );

    expect(
      wrapper
        .find('.detail-title-row .status-dot--inactive')
        .exists(),
    ).toBe(true);

    expect(wrapper.find('.detail-name').text()).toBe(
      'Cliente Activo',
    );
  });

  it('REG-02 conserva el flujo de desactivación de proveedores', async () => {
    const active = makeSupplier();

    const deactivated = {
      ...active,
      is_active: false,
    };

    vi.mocked(fetchSuppliers).mockResolvedValue([
      active,
    ]);

    vi.mocked(toggleSupplierStatus).mockResolvedValue(
      deactivated,
    );

    const wrapper = mount(SuppliersView);
    await flushPromises();

    await wrapper
      .find('.btn-icon-action')
      .trigger('click');

    await wrapper
      .find('.btn-status-toggle')
      .trigger('click');

    await flushPromises();

    expect(wrapper.text()).toContain(
      'Desactivar proveedor',
    );

    expect(
      wrapper.find('.btn-danger').exists(),
    ).toBe(true);

    await wrapper
      .find('.btn-danger')
      .trigger('click');

    await flushPromises();

    expect(toggleSupplierStatus).toHaveBeenCalledWith(
      '1',
      false,
    );

    expect(
      wrapper
        .find('.detail-title-row .status-dot--inactive')
        .exists(),
    ).toBe(true);

    expect(wrapper.find('.detail-name').text()).toBe(
      'Proveedor Activo',
    );
  });

  it('REG-03 conserva el reintento del chatbot después de un error temporal', async () => {
    chatMocks.sendChatMessage
      .mockRejectedValueOnce(
        new ApiError(
          408,
          'La solicitud tardó demasiado tiempo.',
        ),
      )
      .mockResolvedValueOnce({
        conversation_id: 'conversation-regression',
        message_id: 'assistant-regression',
        answer: 'Respuesta recuperada correctamente.',
        created_at: '2026-10-06T18:00:00Z',
        expires_at: '2026-10-06T19:00:00Z',
        sources: [],
        limitations: [],
      });

    const wrapper = mount(ChatPanel);

    await wrapper
      .find('.chat-panel__input')
      .setValue('Consulta de regresión');

    await wrapper
      .find('.chat-panel__send')
      .trigger('click');

    await flushPromises();

    expect(wrapper.text()).toContain(
      'No se pudo completar la consulta',
    );

    expect(wrapper.text()).toContain('Reintentar');

    await wrapper
      .find('.chat-error__retry')
      .trigger('click');

    await flushPromises();

    expect(
      chatMocks.sendChatMessage,
    ).toHaveBeenCalledTimes(2);

    expect(
      chatMocks.sendChatMessage,
    ).toHaveBeenNthCalledWith(
      2,
      'Consulta de regresión',
      null,
    );

    expect(wrapper.text()).toContain(
      'Respuesta recuperada correctamente.',
    );

    expect(wrapper.text()).not.toContain(
      'No se pudo completar la consulta',
    );

    expect(
      wrapper.findAll('.chat-message--user'),
    ).toHaveLength(1);
  });
});


import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import ImportExcelModal from '@/features/inventory/components/ImportExcelModal.vue';

vi.mock('@/features/inventory/import', () => ({
  importProductsExcel: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn(() => 'Error al importar'),
}));

function createWrapper() {
  return mount(ImportExcelModal, {
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

function createFile(
  name: string,
  size: number,
): File {
  return new File(
    [new Uint8Array(size)],
    name,
    {
      type: 'application/octet-stream',
    },
  );
}

async function selectFile(
  wrapper: VueWrapper,
  file: File,
): Promise<void> {
  const input = wrapper.find<HTMLInputElement>(
    'input[type="file"]',
  );

  Object.defineProperty(input.element, 'files', {
    configurable: true,
    value: [file],
  });

  await input.trigger('change');
  await nextTick();
}

describe('SCRUM-808: Validaciones del modal Excel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('rechaza archivos que no tienen extensión xlsx', async () => {
    const wrapper = createWrapper();

    await selectFile(
      wrapper,
      createFile('productos.csv', 100),
    );

    expect(wrapper.text()).toContain(
      'Solo se aceptan archivos .xlsx',
    );

    expect(
      wrapper.find('.btn-primary').attributes('disabled'),
    ).toBeDefined();

    wrapper.unmount();
  });

  it('rechaza archivos mayores a 5 MB', async () => {
    const wrapper = createWrapper();

    await selectFile(
      wrapper,
      createFile('productos.xlsx', 5 * 1024 * 1024 + 1),
    );

    expect(wrapper.text()).toContain(
      'El archivo no puede superar 5 MB.',
    );

    wrapper.unmount();
  });

  it('permite seleccionar un archivo xlsx válido', async () => {
    const wrapper = createWrapper();

    await selectFile(
      wrapper,
      createFile('productos.xlsx', 1024),
    );

    expect(wrapper.text()).toContain('productos.xlsx');

    expect(
      wrapper.find('.btn-primary').attributes('disabled'),
    ).toBeUndefined();

    wrapper.unmount();
  });

  it('mantiene deshabilitada la vista previa sin archivo', () => {
    const wrapper = createWrapper();

    const previewButton = wrapper.findAll('button')
      .find(button => button.text().includes('Vista previa'));

    expect(previewButton).toBeDefined();
    expect(
      previewButton?.attributes('disabled'),
    ).toBeDefined();

    wrapper.unmount();
  });
});

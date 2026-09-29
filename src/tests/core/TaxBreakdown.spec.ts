import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TaxBreakdown from '@/app/components/TaxBreakdown.vue';

describe('TaxBreakdown', () => {
  it('calcula el IVA (12%) y el total a partir del subtotal', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 1000 } });

    expect(wrapper.text()).toContain('Q 1000.00');
    expect(wrapper.text()).toContain('IVA (12%)');
    expect(wrapper.text()).toContain('Q 120.00');
    expect(wrapper.text()).toContain('Q 1120.00');
  });

  it('redondea correctamente a 2 decimales (evita errores de punto flotante)', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 10.1 } });

    // 10.1 * 0.12 = 1.212 en aritmética exacta; en float puro da
    // 1.2119999999999997, por eso el componente redondea antes de mostrar.
    expect(wrapper.text()).toContain('Q 1.21');
    expect(wrapper.text()).toContain('Q 11.31');
  });

  it('permite una tasa de impuesto distinta a la de Guatemala', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 100, taxRate: 0.1 } });

    expect(wrapper.text()).toContain('IVA (10%)');
    expect(wrapper.text()).toContain('Q 10.00');
    expect(wrapper.text()).toContain('Q 110.00');
  });

  it('muestra el título solo cuando se pasa', () => {
    const withTitle = mount(TaxBreakdown, {
      props: { subtotal: 100, title: 'Resumen de la venta' },
    });
    expect(withTitle.text()).toContain('Resumen de la venta');

    const withoutTitle = mount(TaxBreakdown, { props: { subtotal: 100 } });
    expect(withoutTitle.find('.tax-breakdown__title').exists()).toBe(false);
  });
});

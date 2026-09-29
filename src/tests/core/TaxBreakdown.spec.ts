import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TaxBreakdown from '@/app/components/TaxBreakdown.vue';

describe('TaxBreakdown', () => {
  it('calcula el impuesto y el total a partir del subtotal y la tasa de la empresa', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 1000, taxRate: 12 } });

    expect(wrapper.text()).toContain('Q 1000.00');
    expect(wrapper.text()).toContain('IVA (12%)');
    expect(wrapper.text()).toContain('Q 120.00');
    expect(wrapper.text()).toContain('Q 1120.00');
  });

  it('redondea correctamente a 2 decimales (evita errores de punto flotante)', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 10.1, taxRate: 12 } });

    // 10.1 * 0.12 = 1.212 en aritmética exacta; en float puro da
    // 1.2119999999999997, por eso el componente redondea antes de mostrar.
    expect(wrapper.text()).toContain('Q 1.21');
    expect(wrapper.text()).toContain('Q 11.31');
  });

  it('usa la tasa que le pasen, no asume un porcentaje fijo', () => {
    const wrapper = mount(TaxBreakdown, { props: { subtotal: 100, taxRate: 10 } });

    expect(wrapper.text()).toContain('IVA (10%)');
    expect(wrapper.text()).toContain('Q 10.00');
    expect(wrapper.text()).toContain('Q 110.00');
  });

  it('venta exenta: impuesto en 0 y rótulo "Exenta de IVA" en vez del porcentaje', () => {
    const wrapper = mount(TaxBreakdown, {
      props: { subtotal: 500, taxRate: 12, isExempt: true },
    });

    expect(wrapper.text()).toContain('Exenta de IVA');
    expect(wrapper.text()).not.toContain('IVA (12%)');
    expect(wrapper.text()).toContain('Q 0.00');
    expect(wrapper.text()).toContain('Q 500.00'); // total == subtotal, sin impuesto
  });

  it('descuento: se resta del total y solo se muestra la línea si es mayor a 0', () => {
    const withDiscount = mount(TaxBreakdown, {
      props: { subtotal: 1000, taxRate: 12, descuento: 100 },
    });
    // total = 1000 - 100 + 120 = 1020
    expect(withDiscount.text()).toContain('Descuento');
    expect(withDiscount.text()).toContain('Q 1020.00');

    const withoutDiscount = mount(TaxBreakdown, { props: { subtotal: 1000, taxRate: 12 } });
    expect(withoutDiscount.text()).not.toContain('Descuento');
  });

  it('muestra el título solo cuando se pasa', () => {
    const withTitle = mount(TaxBreakdown, {
      props: { subtotal: 100, taxRate: 12, title: 'Resumen de la venta' },
    });
    expect(withTitle.text()).toContain('Resumen de la venta');

    const withoutTitle = mount(TaxBreakdown, { props: { subtotal: 100, taxRate: 12 } });
    expect(withoutTitle.find('.tax-breakdown__title').exists()).toBe(false);
  });
});

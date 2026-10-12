
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import TaxMetricCards from '@/features/taxation/components/TaxMetricCards.vue';
import type { TaxPeriodMetrics } from '@/features/taxation/types';

describe('SCRUM-668: pruebas de Débito y Crédito Fiscal', () => {
  const mockMetrics: TaxPeriodMetrics = {
    tax_debit: 1200,
    tax_credit: 450,
    net_tax: 750,
    tax_payable: 750,
    carry_forward: 0,
    withholding_tax: 150,
    input_documents_count: 18,
  };

  function mountCards(
    overrides: Partial<TaxPeriodMetrics> = {},
  ) {
    return mount(TaxMetricCards, {
      props: {
        metrics: {
          ...mockMetrics,
          ...overrides,
        },
      },
    });
  }

  it('muestra correctamente el Débito Fiscal', () => {
    const wrapper = mountCards();

    const card = wrapper.get('.metric-card--debit');

    expect(card.text()).toContain('Débito Fiscal (Ventas)');
    expect(card.text()).toContain('1,200.00');
  });

  it('muestra correctamente el Crédito Fiscal', () => {
    const wrapper = mountCards();

    const card = wrapper.get('.metric-card--credit');

    expect(card.text()).toContain('Crédito Fiscal (Compras)');
    expect(card.text()).toContain('450.00');
  });

  it('muestra el Impuesto Neto correctamente', () => {
    const wrapper = mountCards();

    expect(wrapper.text()).toContain('Impuesto Neto');
    expect(wrapper.text()).toContain('750.00');
    expect(wrapper.text()).toContain('Diferencia a favor de la SAT');
  });

  it('identifica un impuesto pendiente de pago', () => {
    const wrapper = mountCards({
      tax_payable: 750,
    });

    expect(wrapper.text()).toContain('Impuesto a Pagar');
    expect(wrapper.text()).toContain('Por liquidar');

    expect(
      wrapper.find('.status-pill--pending').exists(),
    ).toBe(true);
  });

  it('muestra el remanente a favor del contribuyente', () => {
    const wrapper = mountCards({
      tax_debit: 300,
      tax_credit: 900,
      net_tax: -600,
      tax_payable: 0,
      carry_forward: 600,
    });

    expect(wrapper.text()).toContain('Remanente a Favor');
    expect(wrapper.text()).toContain('600.00');
    expect(wrapper.text()).toContain('Diferencia a favor del contribuyente');
  });

  it('muestra correctamente valores en cero', () => {
    const wrapper = mountCards({
      tax_debit: 0,
      tax_credit: 0,
      net_tax: 0,
      tax_payable: 0,
      carry_forward: 0,
      withholding_tax: 0,
      input_documents_count: 0,
    });

    expect(wrapper.get('.metric-card--debit').text()).toContain('0.00');
    expect(wrapper.get('.metric-card--credit').text()).toContain('0.00');
    expect(wrapper.text()).toContain('Sin pago pendiente');
  });

  it('muestra la cantidad de documentos fiscales procesados', () => {
    const wrapper = mountCards({
      input_documents_count: 18,
    });

    const card = wrapper.findAll('.metric-card').find(
      (item) => item.text().includes('Documentos Fiscales'),
    );

    expect(card).toBeDefined();
    expect(card!.text()).toContain('18');
  });
});

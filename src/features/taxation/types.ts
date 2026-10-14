export interface TaxPeriodMetrics {
  period?: {
    start_date: string;
    end_date: string;
  };
  tax_debit: number;
  tax_credit: number;
  net_tax: number;
  tax_payable: number;
  carry_forward: number;
  withholding_tax: number;
  input_documents_count: number;
  input_tax_components_count?: number;
  eligible_tax_components_count?: number;
  currency?: string;
  details?: Array<{
    tax_code?: string;
    name?: string;
    category?: string;
    taxable_base?: number;
    amount?: number;
    [key: string]: unknown;
  }>;
}

export interface TaxPeriodFilter {
  year: number;
  month: number; // 1-12, or 0 for entire year
}

export interface TaxDefinition {
  tax_code: string;
  name: string;
  tax_type?: string;
  rate?: number;
  category?: string;
  active?: boolean;
  eligible_for_input_credit?: boolean;
}

export interface TaxProfile {
  name?: string;
  description?: string;
  jurisdiction?: string;
  regime?: string;
  default_currency?: string;
  effective_from: string;
  effective_until?: string | null;
  taxes?: TaxDefinition[];
  rules?: any[];
  active?: boolean;
  version_id?: string | null;
  precision?: number;
  rounding?: string;
}

export interface TaxProfileResponse {
  profiles: TaxProfile[];
}


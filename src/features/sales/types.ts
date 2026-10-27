// Coincide con app/schemas/commercial.py del backend (SaleCreate/SaleResponse/
// TaxConfigurationResponse). El backend calcula precio unitario, subtotal,
// impuesto y total — el frontend nunca los envía, solo producto_id/cantidad.

export interface SaleItemCreate {
  producto_id: string;
  cantidad: number;
}

export interface SaleCreatePayload {
  cliente_id?: string | null;
  items: SaleItemCreate[];
  descuento?: number;
  es_exenta?: boolean;
  tasa_impuesto?: number;
}

export interface SaleItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  usuario_id: string;
  cliente_id: string | null;
  consumidor_final: boolean;
  cliente_nombre: string | null;
  fecha: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  tasa_impuesto: number;
  es_exenta: boolean;
  total: number;
  estado: string;
  motivo_anulacion?: string | null;
  anulada_por?: string | null;
  anulada_en?: string | null;
  items: SaleItem[];
}

export const SALE_STATE_COMPLETED = 'completada';
export const SALE_STATE_VOIDED = 'anulada';

// Coincide con SaleVoid del backend: motivo obligatorio de 1 a 200 caracteres.
export const SALE_VOID_REASON_MAX_LENGTH = 200;

export interface SaleVoidPayload {
  motivo: string;
}

export interface TaxConfiguration {
  tasa_impuesto: number | string;
}

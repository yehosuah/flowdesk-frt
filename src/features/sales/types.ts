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
  items: SaleItem[];
}

export interface TaxConfiguration {
  tasa_impuesto: number;
}

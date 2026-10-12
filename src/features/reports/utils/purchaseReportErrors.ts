export type PurchaseReportError = number | 'NO_SESSION' | 'EMPTY_FILE' | 'NETWORK';

export function getPurchaseReportErrorMessage(error: PurchaseReportError): string {
  switch (error) {
    case 'NO_SESSION':
    case 401:
      return 'Tu sesión expiró o no está activa. Inicia sesión nuevamente.';
    case 403:
      return 'No tienes permisos para generar este reporte. Se requiere un administrador.';
    case 422:
      return 'Los parámetros del reporte no son válidos. Revisa el régimen y las fechas.';
    case 'EMPTY_FILE':
      return 'El servidor devolvió un archivo vacío. Intenta nuevamente.';
    case 'NETWORK':
      return 'No se pudo completar la descarga. Comprueba tu conexión e intenta nuevamente.';
    default:
      return typeof error === 'number' && error >= 500
        ? 'El servidor no pudo generar el reporte. Intenta nuevamente más tarde.'
        : 'No se pudo descargar el reporte. Intenta nuevamente.';
  }
}

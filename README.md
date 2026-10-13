# Flowdesk Frontend

Flowdesk es un sistema de gestión empresarial que permite administrar productos, proveedores, movimientos de inventario, empleados, clientes, tareas y roles dentro de una organización.

También incluye funcionalidades de análisis de inventario, reportes comerciales y tributarios, generación de archivos Excel, Dashboard Tributario y un sistema de notificaciones para alertas de inventario y resultados de operaciones.

Este repositorio contiene el frontend de Flowdesk, construido con **Vue 3 + TypeScript + Vite**. Consume la API REST de [Flowdesk Backend](https://github.com/fabianpradod/flowdesk-bck).

## Stack

- Vue 3
- TypeScript
- Vite
- Vue Router
- Vitest (testing)
- Vue Test Utils
- lucide-vue-next (íconos)
- Docker + Docker Compose
- Netlify (deploy)

## Requisitos

- Node.js (LTS recomendado)
- npm

## Configuración del entorno

El archivo `.env` no se sube al repositorio. Copiar `.env.example` a `.env` y completar los valores correspondientes.

```bash
cp .env.example .env
```

Por defecto, el frontend debe apuntar a la API de producción del backend:

```text
http://3.235.13.20
```

Si el equipo de backend está ejecutando la API localmente, ajustar la variable correspondiente en `.env` para apuntar a `http://localhost:8000` o al puerto configurado.

## Instalación y desarrollo local

**Instalar dependencias:**

```bash
npm ci
```

También puede utilizarse `npm install` cuando sea necesario actualizar las dependencias.

**Levantar servidor de desarrollo:**

```bash
npm run dev
```

**Compilar para producción:**

```bash
npm run build
```

**Previsualizar el build:**

```bash
npm run preview
```

**Ejecutar pruebas automatizadas:**

```bash
npx vitest run
```

Los scripts disponibles están definidos en `package.json`.

## Estructura del proyecto

El proyecto sigue una arquitectura organizada por funcionalidades dentro de `src/`.

- **`app/`** — Configuración principal, layouts, router y componentes compartidos, incluyendo `ToastContainer.vue`.
- **`features/`** — Módulos de autenticación, inventario, movimientos, análisis, empleados, proveedores, clientes, tareas, reportes, tributación y notificaciones.
- **`composables/`** — Lógica reutilizable de Vue, incluyendo `useToast.ts`.
- **`services/`** — Cliente HTTP y conexión con la API (`apiClient.ts`, `authStorage.ts`, `env.ts`).
- **`stores/`** — Estado global de la aplicación.
- **`styles/`** — Estilos globales y configuración visual.
- **`utils/`** — Utilidades y permisos compartidos.
- **`tests/`** — Pruebas automatizadas organizadas por funcionalidad.

La carpeta `docs/` contiene documentación técnica, evidencias de pruebas y reportes del proyecto.

## Funcionalidades principales

### Gestión de inventario

Permite administrar productos, existencias y movimientos de inventario, incluyendo operaciones de entrada y salida.

### Gestión empresarial

Incluye funcionalidades para administrar clientes, proveedores, empleados, roles y tareas.

### Análisis de inventario

Presenta indicadores y visualizaciones para consultar movimientos, existencias y productos con stock bajo.

### Generador de reportes

Permite configurar y exportar información del negocio mediante filtros de fechas, tipos de reportes y columnas visibles.

Incluye la generación y descarga del reporte tributario en formato Excel (`.xlsx`), con las hojas Compras, Ventas y Resumen.

### Dashboard Tributario

Permite consultar métricas tributarias correspondientes a un período seleccionado.

Incluye indicadores de débito fiscal, crédito fiscal, impuesto neto, impuesto a pagar, remanente a favor y documentos fiscales procesados.

También incorpora filtros por mes y año, estados de carga, manejo de errores y exportación de reportes.

### Sistema de notificaciones — Sprint 9

Durante el Sprint 9 se incorporó un sistema de notificaciones para informar al usuario sobre situaciones importantes relacionadas con el inventario y las operaciones del sistema.

**Campana de notificaciones**

El componente `NotificationBell.vue` permite consultar las alertas pendientes desde la interfaz.

Incluye:

- Indicador con la cantidad de alertas.
- Panel desplegable con el listado de notificaciones.
- Estado vacío cuando no existen alertas.
- Navegación hacia Inventario al seleccionar una alerta.
- Manejo de errores al consultar las notificaciones.
- Integración con el menú lateral y la navegación móvil.

**Alertas de bajo stock**

El composable `useInventoryAlerts.ts` administra el estado compartido de las alertas.

- Consulta las alertas mediante la API.
- Filtra los tipos `stock_bajo` y `sin_stock`.
- Mantiene actualizado el contador de alertas.
- Permite refrescar la información.
- Maneja errores de conexión.
- Limpia las alertas al cambiar de empresa o sesión, evitando mostrar información de una empresa anterior.

**Notificaciones Toast**

El sistema incorpora `ToastContainer.vue` y `useToast.ts` para mostrar mensajes visuales.

Se admiten tres variantes:

- `success`: operaciones exitosas.
- `error`: errores durante las operaciones.
- `info`: mensajes informativos.

Los Toast permiten cierre manual, desaparición automática y visualización simultánea de múltiples mensajes.

## Integración con el backend

Este frontend consume la API REST de Flowdesk Backend.

La documentación interactiva de los endpoints se encuentra en:

[Documentación de la API de Flowdesk](http://3.235.13.20/docs)

Las solicitudes autenticadas utilizan el token de acceso de la sesión activa.

## Manejo de roles

El manejo de roles y permisos en el frontend utiliza las utilidades de `src/utils/permissions.ts`.

Las restricciones de acceso deben mantenerse alineadas con los permisos definidos por el backend.

## Deploy

### Netlify

El proyecto incluye `netlify.toml` y una carpeta `netlify/` con la configuración correspondiente para el despliegue.

El build de producción se genera mediante:

```bash
npm run build
```

Los archivos resultantes se almacenan en `dist/`.

### Docker

El frontend también puede ejecutarse utilizando Docker Compose:

```bash
docker compose up --build
```

Consultar `Dockerfile` y `docker-compose.yml` para conocer la configuración del entorno.

---

## Testing

Flowdesk utiliza **Vitest y Vue Test Utils** para ejecutar pruebas automatizadas del frontend, validar funcionalidades y detectar posibles regresiones.

Las pruebas están organizadas por módulo dentro de `src/tests/`, incluyendo autenticación, inventario, movimientos, clientes, proveedores, empleados, análisis, reportes, Dashboard Tributario y notificaciones.

### Ejecutar pruebas automatizadas

**Ejecutar la suite completa:**

```bash
npx vitest run
```

**Ejecutar pruebas en modo interactivo:**

```bash
npm run test:ui
```

**Ejecutar pruebas con cobertura y reportes de CI:**

```bash
npm run test:ci
```

**Ejecutar pruebas específicas:**

```bash
npx vitest run src/tests/notifications/NotificationBell.spec.ts
npx vitest run src/tests/notifications/useInventoryAlerts.spec.ts
npx vitest run src/tests/core/ToastContainer.spec.ts
```

**Verificar TypeScript:**

```bash
npm run typecheck
```

**Validar compilación de producción:**

```bash
npm run build
```

### Resultados de pruebas — SCRUM-680

Durante el Sprint 9 se ejecutó nuevamente la suite completa de pruebas automatizadas del frontend, después de integrar las funcionalidades y pruebas de notificaciones, alertas de bajo stock y mensajes Toast.

**Fecha de ejecución:** 13 de octubre de 2026.

| Métrica | Resultado |
|---|---|
| Archivos de pruebas ejecutados | 45 |
| Pruebas ejecutadas | 299 |
| Pruebas exitosas | 299 |
| Pruebas fallidas | 0 |
| Duración de la suite | 20.16 segundos |
| Verificación de TypeScript | Exitosa mediante el build |
| Compilación de producción | Exitosa |

### Cobertura global del frontend

La cobertura se obtuvo utilizando Vitest con el proveedor V8 mediante `npm run test:ci`.

| Métrica | Cobertura |
|---|---|
| Sentencias | 54.71% |
| Ramas | 51.62% |
| Funciones | 40.64% |
| Líneas | 55.90% |

### Comparación con la ejecución anterior

| Métrica | 12/10/2026 | 13/10/2026 |
|---|---:|---:|
| Archivos de pruebas | 42 | 45 |
| Pruebas aprobadas | 279 | 299 |
| Cobertura de sentencias | 53.59% | 54.71% |
| Cobertura de ramas | 51.09% | 51.62% |
| Cobertura de funciones | 38.69% | 40.64% |
| Cobertura de líneas | 54.83% | 55.90% |

Se incorporaron 20 pruebas adicionales respecto de la ejecución anterior, y la cobertura global de líneas aumentó 1.07 puntos porcentuales.

### Cobertura de componentes tributarios

Los siguientes valores corresponden al reporte detallado anterior del Sprint 9. Deben contrastarse con el reporte actual antes de utilizarlos como evidencia de la última ejecución.

| Componente | Sentencias | Líneas |
|---|---|---|
| TaxDashboardView.vue | 96.11% | 95.91% |
| TaxFiltersBar.vue | 100% | 100% |
| TaxMetricCards.vue | 100% | 100% |
| ReportsView.vue | 56.53% | 57.24% |
| purchaseReportParams.ts | 100% | 100% |
| purchaseReportErrors.ts | 100% | 100% |
| reports/api.ts | 100% | 100% |

Los porcentajes de `ReportsView.vue` incluyen funcionalidades adicionales al Libro de Compras.

### Validación de notificaciones y alertas

Se verificaron las pruebas incorporadas para las nuevas funcionalidades del Sprint 9.

| Subtarea | Funcionalidad | Resultado |
|---|---|---|
| SCRUM-674 | Campana de notificaciones | 6/6 pruebas aprobadas |
| SCRUM-675 | Alertas de bajo stock | 6/6 pruebas aprobadas |
| SCRUM-676 | Toast de éxito | 8/8 pruebas aprobadas en ToastContainer.spec.ts |

Las pruebas de la campana verifican el contador, apertura y cierre, navegación, estado vacío y manejo de errores.

Las pruebas de alertas verifican el filtrado, conteo, ausencia de alertas, errores, recuperación y aislamiento entre empresas.

Las pruebas de Toast verifican mensajes de éxito y error, cierre manual, desaparición automática, apilamiento e identificadores únicos.

Estos resultados forman parte de las 299 pruebas ejecutadas y no deben sumarse nuevamente.

### Revisión de regresiones — SCRUM-681

Después de incorporar las nuevas pruebas, se ejecutó nuevamente la suite completa del frontend.

Los resultados fueron:

- 299 pruebas aprobadas.
- 0 pruebas fallidas.
- Compilación de producción exitosa.
- Sin regresiones detectadas en los escenarios automatizados evaluados.
- No fueron necesarias correcciones adicionales de código durante esta revisión.

La ausencia de fallos en la suite no garantiza que el sistema esté libre de defectos; los resultados se limitan a los escenarios cubiertos.

### Evidencias generadas

La ejecución de `npm run test:ci` generó:

- `reports/suite.xml`: reporte de resultados en formato JUnit.
- `reports/coverage/`: reportes de cobertura del frontend.

Estos archivos permiten consultar los resultados detallados de la ejecución.

### Documentación de pruebas

Para consultar los resultados completos, la cobertura, los comandos utilizados y las observaciones técnicas:

**[Ver reporte completo de pruebas automatizadas — SCRUM-680](docs/pruebas/SCRUM-680-ejecucion-suite.md)**

**[Ver revisión de regresiones — SCRUM-681](docs/pruebas/SCRUM-681-revision-regresiones.md)**

### Observaciones

- Las 299 pruebas automatizadas finalizaron correctamente en 45 archivos.
- Las pruebas de notificaciones, alertas de bajo stock y Toast se encuentran integradas y aprobadas.
- No se detectaron regresiones mediante la suite ejecutada.
- Los mensajes de error mostrados durante algunas pruebas corresponden a escenarios simulados intencionalmente.
- La verificación de TypeScript y la compilación de producción finalizaron correctamente.
- Vite presentó una advertencia relacionada con el tamaño de algunos archivos JavaScript, sin impedir la compilación.
- La cobertura global de líneas alcanzó el 55.90%, por lo que todavía existen áreas que pueden beneficiarse de pruebas adicionales.
- Los resultados deberán actualizarse cuando se incorporen nuevas funcionalidades o cambios importantes.

---

## Integración continua

El repositorio incluye un flujo de integración continua mediante GitHub Actions para ejecutar verificaciones automatizadas.

La configuración se encuentra en:

`.github/workflows/tests.yml`

La documentación técnica relacionada está disponible en:

[Automatización de CI y pruebas](docs/automatizacion-ci.md)

Los resultados de las verificaciones pueden consultarse en la pestaña **Actions** del repositorio de GitHub.
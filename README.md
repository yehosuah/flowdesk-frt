
# Flowdesk Frontend

Flowdesk es un sistema de gestión empresarial que permite administrar productos, proveedores, movimientos de inventario, empleados, clientes, tareas y roles dentro de una organización.

También incluye funcionalidades de análisis de inventario, reportes comerciales y tributarios, generación de archivos Excel y un Dashboard Tributario.

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
npm install
```

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

- **`app/`** — Configuración principal, layouts, router y componentes compartidos.
- **`features/`** — Módulos de autenticación, inventario, movimientos, análisis, empleados, proveedores, clientes, tareas, reportes y tributación.
- **`services/`** — Cliente HTTP y conexión con la API (`apiClient.ts`, `authStorage.ts`, `env.ts`).
- **`stores/`** — Estado global de la aplicación.
- **`styles/`** — Estilos globales y configuración visual.
- **`utils/`** — Utilidades y permisos compartidos.
- **`tests/`** — Pruebas automatizadas organizadas por funcionalidad.

La carpeta `docs/` contiene documentación técnica y evidencias del proyecto.

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

Las pruebas están organizadas por módulo dentro de `src/tests/`, incluyendo autenticación, inventario, movimientos, clientes, proveedores, empleados, análisis, reportes y Dashboard Tributario.

### Ejecutar pruebas automatizadas

**Ejecutar la suite completa:**

```bash
npx vitest run
```

**Ejecutar pruebas en modo interactivo:**

```bash
npm run test
```

**Ejecutar pruebas con cobertura:**

```bash
npm run test:coverage -- --run
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

Durante el Sprint 9 se ejecutó la suite completa de pruebas automatizadas del frontend para verificar la estabilidad de las funcionalidades implementadas.

**Fecha de ejecución:** 12 de octubre de 2026.

| Métrica | Resultado |
|---|---|
| Archivos de pruebas ejecutados | 42 |
| Pruebas ejecutadas | 279 |
| Pruebas exitosas | 279 |
| Pruebas fallidas | 0 |
| Duración de la suite | 21.92 segundos |
| Verificación de TypeScript | Exitosa |
| Compilación de producción | Exitosa |

### Cobertura global del frontend

La cobertura se obtuvo utilizando Vitest con el proveedor V8.

| Métrica | Cobertura |
|---|---|
| Sentencias | 53.59% |
| Ramas | 51.09% |
| Funciones | 38.69% |
| Líneas | 54.83% |

### Cobertura de componentes tributarios

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

### Documentación de pruebas

Para consultar los resultados completos, cobertura por componente, comandos utilizados y observaciones técnicas:

**[Ver reporte completo de pruebas automatizadas — SCRUM-680](docs/pruebas/SCRUM-680-ejecucion-suite.md)**

### Observaciones

- Las 279 pruebas automatizadas finalizaron correctamente.
- No se detectaron regresiones mediante la suite ejecutada.
- Los mensajes de error mostrados durante las pruebas corresponden a escenarios simulados.
- La compilación de producción finalizó correctamente.
- Vite presentó una advertencia relacionada con el tamaño de algunos archivos JavaScript.
- Los archivos generados en `coverage/` están excluidos del control de versiones mediante `.gitignore`.
- Las pruebas relacionadas con notificaciones, alertas y Toast permanecen pendientes de la integración de sus funcionalidades.

Los resultados corresponden a la ejecución documentada del Sprint 9 y deberán actualizarse cuando se integren nuevas funcionalidades.

---

## Integración continua

El repositorio incluye un flujo de integración continua mediante GitHub Actions para ejecutar verificaciones automatizadas.

La configuración se encuentra en:

`.github/workflows/tests.yml`

La documentación técnica relacionada está disponible en:

[Automatización de CI y pruebas](docs/automatizacion-ci.md)

Los resultados de las verificaciones pueden consultarse en la pestaña **Actions** del repositorio de GitHub.

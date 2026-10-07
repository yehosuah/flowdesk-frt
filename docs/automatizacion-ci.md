# Tarea 5: automatización y demostración de regresión

## Ejecución continua

`.github/workflows/tests.yml` ejecuta GitHub Actions en cada `push` y `pull_request`, con ejecución manual disponible una vez incorporado a la rama predeterminada. Prepara Ubuntu y Node 24, instala con `npm ci` y ejecuta tres grupos en modo no interactivo:

| Paso | Comando | Alcance |
|---|---|---|
| Integración de componentes | `npm run test:integration:ci` | ClientView + ClientModal y SuppliersView + SupplierModal reales. Las llamadas a la API se simulan: no comprueba frontend contra backend. |
| Regresión | `npm run test:regression:ci` | Impuestos y descuentos, permisos, almacenamiento y vencimiento de sesiones. |
| Suite completa | `npm run test:ci` | Todas las pruebas existentes y cobertura V8. |

Los grupos seleccionados también están en la suite completa. Sus conteos no deben sumarse como casos distintos. Los pasos posteriores de pruebas se ejecutan aun si un grupo anterior falla; el workflow conserva el estado fallido. `pipefail` evita que `tee` oculte el código de salida de Vitest. No se utiliza `continue-on-error` en las pruebas.

## Evidencia

Cada ejecución conserva logs, XML JUnit, cobertura HTML/JSON y resúmenes Markdown/JSON con SHA, URL, evento y nombres de pruebas fallidas. El resumen también aparece en GitHub Actions. `upload-artifact` usa `if: always()` para guardar evidencia en ejecuciones exitosas y fallidas, con retención de 90 días. Descarga los artefactos antes del vencimiento para integrarlos en la entrega. El workflow no despliega.

## Demostración reproducible

Ejecutar en una rama de trabajo y con Node 24:

```bash
npm ci
npm run test:regression:ci
# Commit y push del workflow: esperar la ejecución inicial exitosa.
python3 scripts/demo_regression.py apply
npm run test:regression:ci
# Esperado: salida 1 y fallo de la prueba del descuento.
git add src/app/components/TaxBreakdown.vue
git commit -m "demo: introducir regresión deliberada en el descuento"
git push
# Esperar el CI fallido y guardar su reporte antes de corregir.
python3 scripts/demo_regression.py restore
npm run test:regression:ci
git add src/app/components/TaxBreakdown.vue
git commit -m "fix: restaurar la resta del descuento"
git push
# Esperar CI exitoso y guardar los tres resultados.
```

Caso protegido: subtotal Q 1,000, descuento Q 100 e impuesto Q 120 deben producir un total de Q 1,020. La mutación cambia `subtotal - descuento + impuesto` por `subtotal + descuento + impuesto` y produce Q 1,220. Se modifica el componente real, sin cambiar la prueba o su expectativa. La corrección restaura la expresión original. El script rechaza aplicar el fallo en `master`, `main` o un HEAD separado, y solo cambia una coincidencia exacta.

## Problemas de configuración y alcance

El lockfile original impedía `npm ci` por entradas faltantes de `@emnapi/core` y `@emnapi/runtime`; se regeneró y se verificó la instalación limpia. Node 25 causaba errores de `localStorage` en jsdom; Node 24 aprobó la suite y se fijó para el runner.

La cobertura describe el código ejercitado y no acredita por sí sola integración real. Esta suite detecta cambios en comportamiento comprobado de componentes y reglas locales; las integraciones HTTP/PostgreSQL se verifican en el workflow del backend. No incluye un navegador real contra ambos servicios, pruebas de carga ni validación de servicios externos.

## Referencias oficiales

- [Eventos de workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Conservación de artefactos](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [Reporters de Vitest](https://vitest.dev/guide/reporters)

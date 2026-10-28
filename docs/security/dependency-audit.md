
# Auditoría de dependencias del frontend

**Proyecto:** FlowDesk
**Sprint:** 10
**Subtarea:** SCRUM-707
**Herramienta:** npm audit

## 1. Evaluación realizada

Se realizó una auditoría de las dependencias del frontend para identificar vulnerabilidades conocidas y posibles problemas de compatibilidad.

Comandos utilizados:

```bash
npm audit
npm audit --omit=dev
npm ls vite esbuild @vitejs/plugin-vue vitest
npm outdated
npm explain esbuild
```

## 2. Vulnerabilidades identificadas

| Dependencia | Versión | Severidad | Tipo |
|---|---|---|---|
| vite | 5.4.21 | Alta | Directa |
| esbuild | 0.21.5 | Moderada | Transitiva |

**Total:** 2 vulnerabilidades.

- Críticas: 0
- Altas: 1
- Moderadas: 1
- Bajas: 0

La vulnerabilidad reportada para esbuild está relacionada con solicitudes no autorizadas al servidor de desarrollo.

La auditoría indica que la corrección automática requiere una actualización mayor de Vite, potencialmente incompatible con la configuración actual.

## 3. Dependencias de producción

Se ejecutó:

```bash
npm audit --omit=dev
```

Resultado:

```text
found 0 vulnerabilities
```

No se reportaron vulnerabilidades conocidas en las dependencias de producción evaluadas.

Este resultado no garantiza que toda la aplicación esté libre de vulnerabilidades.

## 4. Compatibilidad de dependencias

Se identificaron las siguientes versiones:

- Vite: 5.4.21.
- Vitest: 4.1.11.
- esbuild: 0.21.5.
- @vitejs/plugin-vue: 5.2.4.

La inspección del árbol de dependencias mediante `npm ls` produjo un error `ELSPROBLEMS`, asociado a una versión de esbuild que no satisface los requisitos de la instalación de Vite 8 utilizada por Vitest.

## 5. Acciones recomendadas

1. Evaluar la actualización de Vite y sus plugins compatibles.
2. Resolver el conflicto de versiones de esbuild.
3. Evitar `npm audit fix --force` sin verificar las incompatibilidades.
4. Ejecutar nuevamente las pruebas automatizadas después de actualizar.
5. Verificar la compilación y el funcionamiento del frontend.

## 6. Estado

La auditoría de dependencias fue realizada y documentada.

**Pendiente:** aplicar y validar las correcciones correspondientes en SCRUM-708.

---

## 7. Verificación de package-lock.json — SCRUM-709

Se verificó la integridad y reproducibilidad de las dependencias del frontend después de la actualización realizada en SCRUM-708.

### Procedimiento realizado

Se ejecutaron los siguientes comandos:

- `npm install --package-lock-only --ignore-scripts`
- `npm ci`
- `npm ls vite esbuild @vitejs/plugin-vue vitest`
- `npm audit`
- `npm run typecheck`
- `npx vitest run`
- `npm run build`

### Resultados obtenidos

| Verificación | Resultado |
|---|---|
| Regeneración de package-lock.json | Sin cambios adicionales |
| Instalación limpia con npm ci | Exitosa |
| Compatibilidad de dependencias | Sin conflictos reportados |
| Vulnerabilidades detectadas | 0 |
| Archivos de pruebas | 47 aprobados |
| Pruebas automatizadas | 311 aprobadas |
| Verificación TypeScript | Sin errores |
| Compilación de producción | Exitosa con Vite 6.4.4 |

### Conclusión

El archivo `package-lock.json` se encuentra sincronizado con `package.json` y permite reproducir la instalación de dependencias mediante `npm ci`.

No fue necesario modificar nuevamente el archivo, ya que la actualización de SCRUM-708 había generado una versión válida y consistente.

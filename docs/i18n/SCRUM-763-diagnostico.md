
# SCRUM-763 — Diagnóstico del sistema de traducciones

## 1. Información general

- Proyecto: FlowDesk
- Sprint: 10
- Subtarea: SCRUM-763
- Módulo: Internacionalización
- Rama: sprint10-ruth

## 2. Objetivo

Revisar la implementación actual de traducciones en el frontend de FlowDesk para identificar los componentes que requieren internacionalización y definir una solución que permita cambiar entre español e inglés.

## 3. Metodología

Se realizó una inspección del código fuente del frontend utilizando comandos de búsqueda y revisión de archivos.

Se revisaron:

- Dependencias del proyecto.
- Punto de entrada de la aplicación.
- Componentes principales.
- Etiquetas de navegación.
- Referencias a idiomas y formatos regionales.
- Posibles implementaciones de internacionalización.

## 4. Hallazgos

### 4.1 Sistema de internacionalización

No se identificó una implementación centralizada de internacionalización.

Las dependencias vue-i18n e i18next no se encuentran instaladas.

### 4.2 Inicialización de la aplicación

El archivo src/main.ts inicializa Vue, el router y el estado de la aplicación, pero no registra un plugin de internacionalización.

### 4.3 Navegación

El componente src/app/layouts/MainLayout.vue contiene etiquetas de navegación definidas directamente en español.

Entre las etiquetas identificadas están:

- Inventario.
- Movimiento de Inventario.
- Proveedores.
- Clientes.

### 4.4 Rutas

El archivo src/app/router/index.ts contiene metadatos de rutas y títulos que deberán revisarse para permitir su traducción.

### 4.5 Formatos regionales

Se identificaron componentes que utilizan formatos regionales como es-GT para fechas y números.

Estos formatos deberán adaptarse al idioma seleccionado cuando corresponda.

### 4.6 Persistencia de idioma

No se identificó un mecanismo centralizado para almacenar y recuperar la preferencia de idioma del usuario.

## 5. Recomendaciones

Se recomienda:

1. Incorporar vue-i18n como solución de internacionalización para Vue 3.
2. Crear catálogos de traducción separados para español e inglés.
3. Centralizar las claves de traducción para evitar textos duplicados.
4. Adaptar los componentes de navegación y formularios.
5. Implementar persistencia de la preferencia de idioma.
6. Internacionalizar los mensajes de error y el tutorial.
7. Incorporar pruebas automatizadas para verificar el cambio de idioma.

## 6. Propuesta de estructura

src/
  i18n/
    index.ts
    locales/
      es.ts
      en.ts

La implementación de esta estructura corresponde a las siguientes subtareas del Sprint 10.

## 7. Conclusión

La revisión permitió identificar que FlowDesk no dispone actualmente de un sistema centralizado de traducciones.

Se propone implementar vue-i18n para administrar los textos de la aplicación y permitir el cambio entre español e inglés.

El diagnóstico proporciona la base técnica para continuar con SCRUM-764 y las demás subtareas de internacionalización.

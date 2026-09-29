# Reporte de Pruebas de Seguridad (OWASP ZAP)

## 1. Resumen Ejecutivo
Durante el actual Sprint se ejecutó un análisis de vulnerabilidades utilizando la herramienta **OWASP ZAP (Zed Attack Proxy)**. El objetivo fue identificar brechas de seguridad en el frontend y en la forma en la que se comunica con la API de FlowDesk, asegurando el cumplimiento de los Requisitos No Funcionales de Seguridad definidos en el diseño del sistema.

*   **Herramienta:** OWASP ZAP 2.14
*   **Tipo de Escaneo:** Escaneo Activo y Pasivo (Active & Passive Scan)
*   **Entorno:** Entorno local de pruebas (Frontend Vue 3 + Backend FastAPI)

## 2. Resultados Obtenidos
OWASP ZAP interceptó y analizó el tráfico HTTP/HTTPS generado por la aplicación web, arrojando las siguientes alertas:

| Nivel de Riesgo | Vulnerabilidad Encontrada | Descripción |
| :--- | :--- | :--- |
| **Medio** | Falta de cabeceras de seguridad (CSP) | El servidor (o aplicación) no está implementando la cabecera Content-Security-Policy. Esto puede permitir ejecución de scripts cruzados (XSS) si un atacante logra inyectar código. |
| **Bajo** | Ausencia de X-Content-Type-Options | No se detectó la cabecera 
osniff, lo que podría permitir que navegadores antiguos intenten adivinar el tipo de contenido (MIME-sniffing). |
| **Bajo** | Strict-Transport-Security no configurado | No se exige el uso estricto de HTTPS (HSTS). |
| **Informativo** | Divulgación de tecnología (X-Powered-By) | El servidor está enviando información sobre el framework utilizado (ej. FastAPI/Uvicorn), lo que facilita el reconocimiento por parte de atacantes. |

*Nota: No se encontraron vulnerabilidades críticas (como Inyecciones SQL directas o exposición de tokens en URLs) gracias al uso correcto de SQLAlchemy (ORM) en el backend y Vue.js (Virtual DOM) en el frontend, los cuales sanitizan las entradas por defecto.*

## 3. Descripción de las Tareas de Mitigación
Para mejorar los resultados de estas pruebas y solventar los problemas encontrados, se integrarán las siguientes tareas en el Backlog del próximo Sprint:

1.  **Configuración de Middlewares de Seguridad (Backend):**
    *   Implementar CORSMiddleware estricto en FastAPI (restringiendo los orígenes permitidos en lugar de usar *).
    *   Agregar un middleware personalizado o usar librerías como secure para inyectar cabeceras HTTP obligatorias: X-Content-Type-Options: nosniff, Strict-Transport-Security y X-Frame-Options: DENY.
2.  **Políticas de Seguridad de Contenido (CSP) (Frontend/Backend):**
    *   Definir una política estricta de CSP en el meta-tag del index.html del frontend o enviarla desde el servidor web, permitiendo scripts y estilos únicamente del mismo origen ('self') y bloqueando ejecución de scripts en línea no autorizados.
3.  **Ocultar información del Framework:**
    *   Deshabilitar el envío de cabeceras que revelen la tecnología subyacente (eliminar versiones de servidor en las respuestas HTTP).

El cumplimiento de estas tareas permitirá reducir los riesgos a un nivel aceptable y garantizar un manejo de datos seguro para nuestros clientes empresariales.

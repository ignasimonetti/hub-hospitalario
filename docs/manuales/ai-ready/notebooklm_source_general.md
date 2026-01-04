# Hub Hospitalario CISB: Fuente de Conocimiento para NotebookLM

> **Instrucción para NotebookLM:** Este documento contiene la "Verdad Fuente" sobre el Hub Hospitalario. Úsalo para responder preguntas, generar guiones y crear resúmenes visuales. Presta especial atención a las descripciones visuales para correlacionar con las imágenes que se te han suministrado.

---

## 1. Concepto y Visión
El **Hub Hospitalario** no es solo un software; es la transformación digital del Ministerio de Salud de Santiago del Estero.
*   **Identidad:** Plataforma SaaS multi-hospital moderna.
*   **Misión:** Eliminar la burocracia de papel y empoderar al personal de salud con datos en tiempo real.
*   **Liderazgo:** Una iniciativa impulsada bajo la gestión de la Dra. Natividad Nassif (Ministra de Salud).

## 2. Recorrido Visual (Correlación con Capturas)

### A. La Pantalla de Login (`login_page`)
*   **Visual:** Minimalista, institucional, con el logo del CISB prominente.
*   **Mensaje:** Seguridad desde la puerta de entrada. Acceso exclusivo para personal autorizado.

### B. El Dashboard Principal (`dashboard_main` / `dashboard_metrics`)
*   **Visual:** Un panel de control limpio con tarjetas de métricas en la parte superior.
*   **Elementos Clave:**
    *   **Tarjetas de KPIs:** Números grandes y claros (ej: "Total Expedientes", "Usuarios Activos").
    *   **Sidebar (Barra Lateral):** Menú de navegación a la izquierda, oscuro y elegante, con iconos irreconocibles para cada módulo (Expedientes, Blog, Configuración).
    *   **Estética:** Espacios en blanco (o gris oscuro en Dark Mode) para reducir el ruido visual.

### C. El Modo Oscuro (`dashboard_dark_mode`)
*   **Visual:** La interfaz cambia a tonos pizarra (Slate) profundos, no negro puro. Textos en gris claro.
*   **Propósito:** Diseñado específicamente para **Guardias Nocturnas**. Reduce la fatiga ocular de médicos que trabajan en entornos de baja luz. Es una característica de bienestar laboral, no solo estética.

### D. Centro de Ayuda (`help_center`)
*   **Visual:** Tarjetas amigables con preguntas frecuentes y guías.
*   **Mensaje:** "No estás solo". El soporte es parte integral de la experiencia del usuario.

## 3. Jerarquía y Seguridad (El Sistema de Roles)
El sistema entiende quién eres y te protege de la sobrecarga de información.
*   **Nivel 1-2 (Operativo):** Personal de Limpieza y Mantenimiento. Ven tareas simples.
*   **Nivel 5-7 (Asistencial):** Enfermería y Médicos. Acceden a historias clínicas y turnos.
*   **Nivel 8-10 (Estratégico):** Directores y Ministerio. Ven el panorama completo, auditorías y estadísticas globales.

## 4. Los Módulos de Gestión

### Mesa de Entrada (Expedientes)
*   **Función:** Seguimiento tipo "delivery" de los trámites estatales. Sabes exactamente en qué oficina está tu pedido.
*   **Innovación:** Navegación fluida. Olvida el botón "Atrás" del navegador; el sistema te guía con "breadcrumbs" (migas de pan).

### Suministros (Próximamente)
*   **Concepto:** La unión de Compras y Depósito.
*   **Impacto:** Evita que falten insumos críticos porque "se perdió el papel del pedido". Trazabilidad total desde que se pide una gasa hasta que se usa.

### Blog y Comunicaciones
*   **Función:** El canal oficial. En lugar de rumores de pasillo, información oficial y protocolos médicos accesibles al instante.

---

## 5. Datos Clave para Infografías
*   **Tecnología:** Next.js 14, PocketBase, Inteligencia Artificial.
*   **Impacto:** +Eficiencia, -Papel, +Transparencia.
*   **Usuarios:** Desde administrativos hasta cirujanos.

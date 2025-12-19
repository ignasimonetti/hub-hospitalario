# Módulo de Expedientes

## 📋 Descripción General
Módulo diseñado para el seguimiento, gestión y consulta del estado de expedientes administrativos del hospital. Permite a los usuarios (con permisos adecuados) crear, buscar, filtrar y actualizar expedientes de forma eficiente con una interfaz inspirada en la fluidez de Notion.

## 📂 Estructura de Archivos

### Páginas e Infraestructura (`/app/modules/expedientes`)
- `layout.tsx`: **Crucial.** Mantiene el `ModulesLayout` y el `ProtectedContent` (Mesa de Entrada/Admin). Asegura que el sidebar nunca desaparezca al navegar.
- `page.tsx`: Dashboard principal (Tabla y estadísticas).
- `new/page.tsx`: Creación de nuevos expedientes. Incluye patrón de navegación "Volver".
- `[id]/page.tsx`: Edición de expedientes existentes.

### Componentes (`/components/modules/expedientes`)
- `ExpedientesTable.tsx`: Tabla con búsqueda, filtros y edición inline (estado, prioridad, ubicación).
- `ExpedientesStatsWrapper.tsx` & `ExpedientesStats.tsx`: KPIs de gestión.
- `ExpedienteForm.tsx`: Formulario centralizado con soporte para creación y edición.
- `LocationSelector.tsx`: Selector inteligente que permite crear nuevas ubicaciones inline.
- `EditableCell.tsx`: Celda genérica para edición rápida de texto en tablas.
- `RichTextCell.tsx`: Celda para previsualizar/editar contenido HTML (TipTap) en tablas.

## 💾 Modelo de Datos (PocketBase)

**Colección:** `expedientes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | text | Número de expediente (ej: EX-2025-...). |
| `descripcion` | text | Asunto o descripción corta. |
| `estado` | select | `En trámite`, `Finalizado`, `Archivado`, `Pendiente`. |
| `prioridad` | select | `Alta`, `Media`, `Baja`. |
| `ubicacion` | relation | Vínculo a la colección `ubicaciones`. |
| `observacion` | editor | Detalles extendidos en formato HTML. |
| `fecha_inicio` | date | Fecha de creación del registro. |
| `ultimo_movimiento` | date | Fecha de la última actualización. |
| `tenant` | relation | Vínculo al Hospital/Organización. |

## 🚀 UX / UI Patterns Implementados

1.  **Sidebar Permanente:** El módulo utiliza el layout compartido para garantizar que el usuario siempre tenga acceso a la navegación lateral, incluso en formularios de creación.
2.  **Navegación Soft (Breadcrumbs):** Los formularios de `new` y `edit` incluyen un enlace de "Volver / [Contexto]" en la parte superior para facilitar el retorno a la lista sin perder la ubicación mental.
3.  **Selector con Creación Inline:** El `LocationSelector` permite añadir nuevas ubicaciones directamente desde el dropdown si no existen, evitando interrumpir el flujo de carga de datos.
4.  **Edición Rápida (Smart Table):** Casí todos los campos de la tabla son editables con un solo clic, permitiendo movimientos rápidos de expedientes sin entrar al formulario completo.
5.  **Manejo Proactivo de Autocancelación:** Las peticiones a PocketBase están optimizadas para ignorar errores de aborto (`status 0`), garantizando una experiencia limpia de logs en consola.

## 🔒 Seguridad
Implementado mediante `ProtectedContent` a nivel de `layout.tsx`, restringiendo el acceso completo a los roles `superadmin` y `mesa_entrada`.

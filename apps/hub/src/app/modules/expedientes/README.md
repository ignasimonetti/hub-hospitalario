# Módulo de Expedientes

## 📋 Descripción General
Módulo diseñado para el seguimiento, gestión y consulta del estado de expedientes administrativos del hospital. Permite a los usuarios (con permisos adecuados) crear, buscar, filtrar y actualizar expedientes de forma eficiente.

## 📂 Estructura de Archivos

### Páginas (`/app/modules/expedientes`)
- `page.tsx`: Página principal (Dashboard de expedientes con tabla y estadísticas).
- `new/page.tsx`: Formulario para crear un nuevo expediente.
- `[id]/page.tsx`: Vista detallada de un expediente (pendiente de implementación completa).

### Componentes (`/components/modules/expedientes`)
- `ExpedientesTable.tsx`: Tabla principal con funcionalidades de filtrado, búsqueda y edición inline.
- `ExpedientesStatsWrapper.tsx` & `ExpedientesStats.tsx`: Tarjetas de estadísticas (KPIs) en la parte superior.
- `ExpedienteForm.tsx`: Formulario reutilizable para creación/edición.
- `ExpedienteStatusBadge.tsx`: Badges visuales para estados y prioridades.
- `LocationSelector.tsx`: Componente para cambio rápido de ubicación física del expediente.
- `widgets/ExpedientesKPIWidget.tsx`: Widget integrable en el dashboard principal.

## 💾 Modelo de Datos (PocketBase)

**Colección:** `expedientes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | text | Número único de expediente (formato oficial). |
| `asunto` | text | Descripción breve del trámite. |
| `fecha_inicio` | date | Fecha de inicio del expediente. |
| `iniciador` | text | Persona o área que inicia el trámite. |
| `estado` | select | `En trámite`, `Finalizado`, `Archivado`. |
| `prioridad` | select | `Normal`, `Urgente`, `Muy Urgente`. |
| `ubicacion_actual` | text | Oficina o área donde se encuentra físicamente. |
| `ultimo_movimiento` | date | Fecha del último cambio de estado/ubicación. |
| `descripcion` | editor | Detalles adicionales (Rich Text). |
| `etiquetas` | json | Tags para categorización flexible. |

## 🔒 Permisos y Seguridad
- **Lectura Pública:** Restringida.
- **Lectura/Escritura:** Roles `superadmin`, `mesa_entrada`.
- **Solo Lectura (algunos campos):** Roles administrativos generales (según configuración).

## 🚀 Funcionalidades Clave
1.  **Edición Inline:** Actualización rápida de ubicación y estado desde la tabla.
2.  **KPIs en tiempo real:** Conteo de expedientes activos, finalizados y archivados.
3.  **Integración con Dashboard:** Widget personalizado visible en el home.
4.  **Búsqueda Avanzada:** Filtrado por número, asunto o iniciador.

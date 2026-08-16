# Módulo de Prestadores Médicos

Gestión y liquidación de prestaciones para prestadores médicos (Guardias Médicas y Extensión Horaria).

---

## 📌 Funcionalidades Principales

1. **Gestión de Prestaciones**:
   - Carga y visualización de prestaciones organizadas en **Guardias Médicas** y **Extensión Horaria**.
   - Validación de topes de facturación dinámicos configurables por SuperAdmin.
   - Cálculo automático de montos sugeridos según días hábiles e inhábiles / feriados.

2. **Parámetros del Sistema (SuperAdmin)**:
   - Configuración de tarifas (Guardias Ordinarias/Críticas, Días Hábiles/Inhábiles, Horas de Extensión).
   - Tope máximo de facturación mensual/período.
   - Almacenamiento persistente en PocketBase (`system_settings` / `prestadores_config`).

3. **Subida de Comprobantes**:
   - Carga de planillas de guardias/horas y facturas fiscales.
   - Flujo de estados: Borrador, Presentado, En Revisión, Aprobado, Pagado, Rechazado.

4. **Auditoría y Liquidación (Tesorería)** *(En desarrollo / pendiente)*:
   - Panel de control de Tesorería para revisión de comprobantes presentados y liquidación de pagos.

---

## 📁 Estructura de Archivos

- `src/app/modules/prestadores/`: Página principal del módulo de prestadores.
- `src/components/prestadores/`:
  - `ModalNuevaPrestacion.tsx`: Formulario de carga de prestaciones con validación de tarifas y topes.
  - `ModalSeleccionarTipoTramite.tsx`: Selector inicial de tipo de prestación.
  - `PrestacionesTable.tsx`: Tabla de historial y estado de trámites.
- `src/components/admin/ParametersTab.tsx`: Pestaña de configuración de tarifas y topes para SuperAdmin.
- `src/lib/services/parametersService.ts`: Servicio para persistencia y lectura de parámetros en PocketBase.
- `src/types/prestadores.ts`: Tipos TypeScript del módulo.

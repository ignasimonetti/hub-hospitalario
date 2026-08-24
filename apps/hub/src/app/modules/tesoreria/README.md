# Módulo de Tesorería & Liquidación de Honorarios - CISB

El módulo de **Tesorería** (`/app/modules/tesoreria`) gestiona el tramo final del circuito de facturación de prestadores del **Centro Integral de Salud La Banda (CISB)**.

---

## 1. Circuito Operativo y Flujo de Estados

```
[Prestador] Presenta planilla asistencial + Factura ARCA
   │
   ▼ (estado: 'pendiente')
[Director Adjunto] Visado Asistencial / Control de turnos y horas
   │
   ▼ (estado: 'visado_adjunto')
[Director Coordinador] Aprobación Final y Firma Digital Institucional
   │
   ▼ (estado: 'aprobado')
┌─────────────────────────────────────────────────────────────┐
│                  BANDEJA DE TESORERÍA                       │
│  1. CONTROL DOCUMENTAL & SOFT-LOCKING (Evita colisiones)    │
│     - Bloqueo exclusivo por operador (15 min)               │
│     - Verificación ARCA + DGR + Planilla                    │
│     - Cálculo anticipado de retención y Neto BSE            │
│     - Estado: 'Conformado para Lote'                        │
│                                                             │
│  2. CARATULACIÓN & CREACIÓN DE LOTE GDE                     │
│     - Propagación masiva del Nº de Expediente GDE           │
│     - Generación automática de Planilla Anexo I GEDO        │
│     - Exportación de Transferencias BSE (Montos Netos)      │
│                                                             │
│  3. RETORNO DE DESPACHO (RESOLUCIÓN DE PAGO)                │
│     - Carga de Nº y Fecha de Resolución                     │
│     - Cierre de Transferencias y archivo en GDE             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Funcionalidades Principales

1. **Bandeja de Liquidación con Filtros y Pestañas:**
   - **Pendientes de Pago:** Recepción inmediata de órdenes aprobadas por Dirección.
   - **Historial Liquidado:** Registro de pagos con comprobante y fecha.
   - **Observaciones Fiscales:** Seguimiento de trámites en subsanación.
   - **Todos:** Vista global con buscador dinámico (médico, CUIT, CBU, Nº de trámite o factura) y filtros de período y servicio hospitalario.

2. **Acciones de Tesorería:**
   - **Registrar Pago Individual:** Carga de número de comprobante/orden de transferencia, fecha, notas y archivo adjunto.
   - **Liquidar Lote Masivo:** Selección múltiple de trámites aprobados para imputar un mismo lote bancario u orden de pago en un solo clic.
   - **Observar Comprobante Fiscal:** Selector de categorías ARCA predefinidas (*Importe no coincide, CAE vencido, Período erróneo, CUIT inválido, Falta de constancia fiscal*) con descargo detallado.
   - **Exportación Bancaria (CSV/Excel):** Archivo con formato para acreditar haberes (CUIT, Beneficiario, CBU/Alias, Importe, Concepto, Factura, etc.).
   - **Exportación de Reporte Contable:** Planilla estructurada para auditoría y rendición hospitalaria.

3. **Métricas y KPIs en Cabecera:**
   - Total liquidado acumulado ($ ARS y cantidad).
   - Total pendiente de pago ($ ARS y cantidad).
   - Volumen presupuestario total del período.
   - Cantidad y monto en observación fiscal.
   - Desglose presupuestario interactivo por Servicio Asistencial (Guardia, UTI, Pediatría, Cirugía, etc.).

4. **Detalle 360° de Liquidación:**
   - Acceso al comprobante fiscal ARCA y constancia de conducta fiscal DGR.
   - Visualización y descarga de la **Planilla Oficial PDF** con detalle de horas/guardias y firmas digitales estampadas.
   - Línea de tiempo completa de auditoría y trazabilidad.

---

## 3. Estructura de Archivos

- `apps/hub/src/types/tesoreria.ts`: Interfaces y tipos de Tesorería.
- `apps/hub/src/lib/services/tesoreriaService.ts`: Servicio de datos, operaciones de pago, exportaciones y cálculo de KPIs.
- `apps/hub/src/components/tesoreria/KpisTesoreria.tsx`: Tarjetas de métricas y desglose por servicio.
- `apps/hub/src/components/tesoreria/ModalRegistrarPago.tsx`: Modal de registro de pago individual.
- `apps/hub/src/components/tesoreria/ModalLiquidarLote.tsx`: Modal de procesamiento en lote masivo.
- `apps/hub/src/components/tesoreria/ModalObservarFiscal.tsx`: Modal de observación fiscal ARCA.
- `apps/hub/src/components/tesoreria/ModalDetalleLiquidacion.tsx`: Modal de vista integral 360°.
- `apps/hub/src/app/modules/tesoreria/page.tsx`: Página principal con Notion/Clean UI.

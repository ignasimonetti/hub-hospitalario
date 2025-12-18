# PDR: Módulo Integral de Suministros (Contrataciones + Inventario)

## 1. Visión Superadora
El objetivo es transformar la gestión logística del hospital, pasando de un "registro de papeles" a una **cadena de suministro inteligente**.

### El Problema Actual (Sesgo a evitar)
- **Herramientas desconectadas:** Compras en Softr/Notion (solo registro), Depósito en sistema de terceros.
- **Visión fragmentada:** Desconexión entre lo solicitado, lo comprado y lo recibido.
- **UX Arcaica y Fricción:** "Muchas pantallas", sistema lento y estéticamente pobre que desincentiva el uso real-time (carga diferida = stock irreal).
- **Stock Distorsionado:** Duplicidad de productos (mismo ítem con 2 nombres) y falta de carga en tiempo real de ingresos/egresos.
- **Recepción Ciega:** El encargado de depósito recibe camiones sin saber qué compró el hospital (falta de acceso a expedientes).
- **Silos de Comunicación:** Compras no se entera cuando llega la mercadería; Depósito no avisa.
- **Confusión Patrimonial:** Mezcla de bienes de consumo (gasas) con bienes de capital (computadoras) sin alertar a Patrimoniales.
- **Autorización a Ciegas:** Quien aprueba pedidos no ve el histórico de consumo del solicitante ("Piden por las dudas").
- **Stock Oculto (Shadow Inventory):** Práctica informal de no dar ingreso al stock real para "esconderlo" de los solicitantes voraces. Solución: Mostrar stock real pero robustecer la autorización.
- **Bifurcación de Pedidos (La Doble Vía):** El usuario pide por papel pensando que hay que comprar, pero el insumo estaba en stock (o viceversa). Genera fricción administrativa al tener que rechazar y redirigir.
- **Inconsistencia de Rubro (Legal/Contable):** Conflictos cuando el proveedor ganador tiene un rubro RUPSE que no "encaja" semánticamente con el objeto de la compra.
- **Justificación Débil (Contable):** Rechazo de expedientes de reposición por falta de evidencia de stock crítico adjunta al pedido.
- **Ineficiencia en Cotizaciones:** Solicitar 3 presupuestos por email manual es lento y propenso a errores.
- **Hechos Consumados (Servicios):** Prestaciones mensuales (ej: Jardinería) que se inician sin contrato firmado por demoras administrativas, obligando a "dibujar" el expediente *post mortem*.

### 📊 Reportes y Dashboard (Analytics)
1. **Consumo por Sector (Gráfico de Torta):** Visualización porcentual de quién consume más de un producto (ej: "Toallas de papel: 15% UTI, 10% Guardia").
2. **Gasto por Período:** Comparativa mensual de consumo valorizado.
3. **Semáforo de Stock:** Alertas visuales de productos por debajo del umbral.
4. **Reporte de Pendientes:** Pedidos autorizados pero no retirados.
5. **Histórico de Movimientos:** Trazabilidad completa (Ingresos vs Egresos).

### 💻 Estrategia de Frontend (Módulos Separados)
Aunque comparten la base de datos, la experiencia de usuario se divide en dos aplicaciones/módulos distintos para evitar ruido visual:

1.  **Módulo de Compras (Administrative Hub):**
    *   *Usuarios:* Equipo de Compras, Dirección, Auditoría.
    *   *Foco:* Expedientes GDE, Proveedores, Licitaciones, Facturas, Pagos.
    *   *Integración:* Carga de PDFs (Pliegos, Facturas), Dashboard Financiero.

2.  **Módulo de Depósito (Logistic Hub):**
    *   *Usuarios:* Encargado de Depósito, Solicitantes (Enfermería).
    *   *Foco:* Recepción física, Armado de Pedidos, Stock, Etiquetas.
    *   *Integración:* Lectores de código de barras, Impresión de remitos.

**Interconexión:**
*   Cuando Compras "Adjudica", Depósito ve "Pendiente de Recepción".
*   Cuando Depósito "Recibe", Compras ve "Listo para Pagar".

### ⚖️ Reglas de Negocio (Compras)
1.  **Validación de Stock Previa:** El sistema NO debe permitir iniciar un trámite de compra sin que el sistema certifique "Falta de Stock" o "Stock Insuficiente" (evitar compras duplicadas).
2.  **Umbrales de Contratación (Dinámicos):**
    *   Los montos límite no están "hardcodeados". Se administran desde la colección `sys_config` por un Super Admin.
    *   *Ejemplo actual:*
        *   `<= $LIMIT_DIRECTA` (ej: 250k) -> Sugerir **Contratación Directa**.
        *   `<= $LIMIT_MINISTRA` (ej: 800k) -> Sugerir **Firma Ministra**.
        *   `> $LIMIT_DIRECTA` -> Sugerir **Licitación Pública**.

### 💻 Interfaz de Usuario (UI Guidelines)
- **Selectores Inteligentes:** Búsqueda asíncrona para catálogos grandes.
- **Feedback Visual:** Alertas claras, Badges de estado (ej: 'Entregado Parcial' en naranja).
- **Gráficos Integrados:** Utilizar librerías de charts (Recharts/Chart.js) para el análisis de consumo.

### La Solución Propuesta (Hub Hospitalario)
Un ecosistema unificado donde **Contrataciones** e **Inventario** son un único flujo continuo.
- **Trazabilidad Total:** `Solicitud -> Licitación -> Adjudicación -> Recepción -> Consumo`.
- **Inteligencia:** Alertas de stock y previsión de compras.

---

## 2. Análisis del Flujo Actual (Softr/Notion)
Basado en la exploración del sistema actual (`cisbanda.softr.app`), se identificaron los siguientes datos críticos que debemos migrar y estructurar:

### Datos de Expedientes de Compra
- **Identificadores:** `Nro Expediente` (Formato GDE: EX-2025-XXXX...), `Carátula` (Descripción narrativa).
- **Clasificación:** `Tipo de Contrato` (Compra Directa, Licitación), `Tipo de Bien` (Consumible vs. Activo Fijo).
- **Logística:** `Sector Solicitante` (Origen), `Sector Destino` (Entrega).
- **Financiero:** `Financiamiento` (Fuente de fondos), `Presupuestos` (Montos), `Proveedor` (Adjudicado).
- **Estado:** Actualmente manejado como etiquetas (ej: "ADJUDICADO"). En el nuevo sistema será una máquina de estados estricta.

---

### 3. Alcance Funcional Detallado

### A. Módulo de Contrataciones (Procurement)
1.  **Solicitud de Pedido (Internal Request):**
    - Formulario estandarizado para jefes de área.
    - Firmas/Aprobaciones digitales antes de iniciar expediente.
2.  **Gestión de Expedientes (Purchasing):**
    - Vinculación automática con GDE (manual o API futura).
    - **Kanban de Compras:** `Borrador -> Cotización -> Adjudicación -> En Tránsito -> Cerrado`.
    - Comparativa de presupuestos integrada.
3.  **Gestión de Contratos y Servicios (NUEVO):**
    - Para servicios recurrentes (Limpieza, Vigilancia, Alquileres).
    - **Alertas de Vencimiento:** Notificaciones automatizadas 90/60/30 días antes de finalizar el contrato.
    - Repositorio digital de instrumentos legales (Decretos, Contratos firmados).
4.  **Gestión de Proveedores & Compliance:**
    - Base de datos unificada (Domicilio, Provincia, Contacto).
    - **Nomenclador de Actividades:** Clasificación estandarizada (CUASE/AFIP) con código y descripción (ej: 11110 - Cultivo).
    - **Semáforo RUPSE:** Control de vigencia del Registro Único de Proveedores. Alerta si el proveedor está "Vencido" o "Suspendido".
    - Categorización por Rubro.

### B. Módulo de Depósito & Inventario (Warehouse)
1.  **Recepción Inteligente (Inbound):**
    - El depósito ve las "Órdenes de Compra Adjudicadas" pendientes de recibir.
    - **Checklist de Recepción:** Validación de remito vs. orden de compra.
    - **Gestión de Estados Logísticos:** Soporte para `Pendiente`, `Entrega Parcial` (Backorder), `Entregado`, y manejo de entregas `Adelantadas` (antes de fecha pactada).
2.  **Gestión de Inventario:**
    - **Multi-almacén:** Depósito Central, Farmacia, Quirófano, Guardias.
    - **Lotes y Vencimientos:** Control estricto para insumos médicos (FEFO - First Expired, First Out).
    - **Análisis de Consumo Histórico (Forecast):** Cálculo automático de promedios mensuales para sugerir cantidades de recompra (basado en lo visto en "Promedio de Consumo").
3.  **Bienes Patrimoniales (Assets):**
    - Si el ítem es `Activo Fijo` (ej: Mobiliario, Equipos), se activa el flujo de Patrimonio.
    - Generación de Código QR único.
    - Asignación de Responsable y Ubicación física.

---

## 4. Arquitectura de Datos (PocketBase Schema)

### 👥 Roles y Flujos de Trabajo (Workflow)

El sistema se basa en 3 perfiles operativos clave (además del Super Admin):

#### 1. Solicitante (`supply_requester`)
*   **Quién es:** Empleado de un sector (Enfermería, Maternidad, Administración).
*   **Qué hace:** Genera "Pedidos Internos" seleccionando productos de un catálogo (experiencia tipo *Carrito de Compras*).
*   **Límites:** Solo ve productos habilitados para su sector. No puede ver precios ni stock crítico.

#### 🆕 Role: Data Steward / Catalogador (`supply_data_steward`)
*   **Responsabilidad Crítica:** Gobernanza del Catálogo Maestro.
*   **Tarea:** Único habilitado para crear/editar productos.
*   **Objetivo:** Evitar entropía ("Gasa 10x10" vs "Gasa 10*10"). Normalización forzosa.

#### 2. Autorizador (`supply_approver`)
*   **Quién es:** Jefe de Servicio, Farmacia o Dirección.
*   **Qué hace:** Revisa los pedidos pendientes.
    *   *Edita cantidades:* "Pidieron 10, pero solo autorizo 5 por escasez".
    *   *Rechaza:* "No justificado".
    *   *Aprueba:* Pasa el pedido a la cola de entrega de Depósito.
    * 3.  **Adelantos de Mercadería ("Válvula de Escape"):**
    *   *Realidad:* A veces urge un insumo y el proveedor lo entrega "de palabra" antes de la Orden de Compra (OC).
    *   *Solución:* Permitir `ingreso_adelanto` en Depósito sin bloquear por falta de OC.
    *   *Control:* Este ingreso queda en estado "Regularización Pendiente".
    *   *Cierre:* Cuando finalmente sale la OC días después, el sistema detecta que hay un "Adelanto Pendiente" para ese proveedor y sugiere vincularlos ("¿Esta OC #500 regulariza el Adelanto del día 15?").

5.  **Servicios Recurrentes (Anti-Consumados):**
    *   *Realidad:* Se presta el servicio (Jardinería) y luego se arman los papeles.
    *   *Solución:* Entidad `supply_contracts` para servicios mensuales.
    *   *Automatización:* El sistema dispara la solicitud de cotización (emails automáticos) el día 10 del mes anterior.
    *   *Control:* Si se intenta cargar una cotización con fecha posterior al inicio del servicio, el sistema marca el expediente con flags de "Irregularidad Administrativa".

#### 3. Encargado de Depósito (`supply_manager`)
*   **Quién es:** Responsable físico del almacén.
*   **Qué hace:**
    *   *Ingresos:* Da entrada a mercadería (Compras o Devoluciones).
    *   *Egresos (Paperless):* Prepara el pedido. Al entregar, **escanea el QR del empleado solicitante** (desde su celular) para confirmar la recepción. Sin papeles.
    *   *Gestión:* Configura Puntos de Reposición (Stock Mínimo) y registra bajas (roturas/vencimientos).
    *   *Reportes:* Monitorea consumo y alertas de stock.

#### 🆕 Role: Agente IA (Auditor & Facilitador - n8n)
*   **Identidad:** "Agente de Suministros (Bot)".
*   **Funciones (Automáticas):**
    1.  **Auditoría RUPSE:** Lee PDFs adjuntos, extrae fechas de vigencia y actividades, y alerta inconsistencias.
    2.  **Notificador Inteligente:** Envía WhatsApp/Emails a proveedores: *"Ganaste la licitación #123. Sube tu factura aquí"*.
    3.  **Policía de Consumo:** Analiza patrones anómalos (ej: "Maternidad pidió 300% más gasas que su promedio histórico") y alerta al Autorizador.
    4.  **Gestor de Licitaciones:** Publica pliegos y recibe ofertas en un **Portal de Proveedores** (Futuro) eliminando el email manual.

#### 4. Flujo de Adjudicación (El "Ritual" Administrativo)
1.  **Recepción de Ofertas:** Se cargan los presupuestos y se valida el Checklist Documental (RUPSE, F931, etc.).
2.  **Cuadro Comparativo:** El sistema genera una tabla automática comparando precios y amenities.
3.  **Ruta Financiera (Bifurcación):**
    *   *Si es Presupuestario:* Va a **Contable** para impactar partida (Afectación Preventiva).
    *   *Si es Fondos Propios:* Va a **Tesorería** para verificar saldo en cuenta.
4.  **Generación y Firma de F1:**
    *   Compras genera el F1.
    *   **Firma GDE:** Solicitante + Autoridad Competente (según monto) firman digitalmente.
5.  **Compromiso Presupuestario (Solo Presupuesto):**
    *   *Si impacta presupuesto:* Pasa a Contable para registrar el "Compromiso".
    *   *Si es Fondos Propios:* Salta este paso.
7.  **Gestión de Pago y Cierre:**
    *   **Presentación Digital:** Proveedor envía mail con Factura + OC + Remito Firmado + Fiscal Vigente (Todo Timbrado).
    *   **Consolidación:** Compras unifica en PDF y sube a GDE.
    *   **Parte de Recepción Definitivo:** Generado por Compras. Requiere Firma Conjunta (Depósito + Director).
    *   **Intervención Patrimonial:** Si es Bien de Uso -> Alta en `fixed_assets` y adjunto de "Constancia de Cargo" al expediente.
    *   **Dictamen Legal:** Pase a Legales para confección de Resolución Aprobatoria.

8.  **Liquidación y Pago (Tesorería - Módulo Futuro):**
    *   **Cálculo de Retenciones:** Tesorería calcula IIBB y Ganancias sobre la factura.
    *   **Emisión de OP (Orden de Pago):** Se genera el documento discriminando `Monto Bruto` - `Retenciones` = `Monto Neto`.
    *   **Ejecución:** Firma de Autoridad + Transferencia Bancaria.
    *   **Conciliación Contable:** Si el gasto fue presupuestario, Contable registra la OP para igualar columnas: `Afectado = Comprometido = Ordenado a Pagar`.

---

### 📦 Colecciones Principales

#### `supply_products` (Catálogo Maestro)
- `name`, `description` (Marca/Modelo detalle).
- `sku` (código interno).
- `type`: [consumible, activo_fijo, servicio].
- `category`: Relación a `supply_categories`.
- `unit`: [unidad, caja, litro, etc].
- `alert_threshold`: Stock mínimo alerta.
- `lead_time_normal`: Plazo normal entrega (días).
- `lead_time_max`: Plazo estadístico máximo (días).
- `default_provider`: Relación a `supply_providers` (Proveedor habitual).
- `is_critical`: Booleano para semáforo rojo en UI.

#### `supply_categories` (NUEVO - Zismed Legacy)
- `name` (ej: TEXTILES Y COLCHONES).
- `description`.
- `is_active` (Bool).

#### `supply_requests` (Pedidos Internos / Farmacia)
- `request_number` (Auto: 029853).
- `request_date`.
- `requesting_sector`: Relación a organigrama (ej: Internacion Maternidad).
- `destination_sector`: Lugar físico de entrega (ej: Coordinación de enfermería).
- `requester`: Usuario solicitante (Nombre/ID).
- `motive`: Texto libre o categorías (ej: FALTANTE, SANITIZACION).
- `priority`: [baja, normal, urgente].
- `status`: [pendiente_autorizacion, autorizado, rechazado, entregado_parcial, entregado_total].
- `items`: Array de objetos:
  - `product_id`.
  - `quantity_requested` (Original).
  - `quantity_authorized` (Lo que Compras/Farmacia aprueba para entregar).
  - `current_stock_at_authorization` (Snapshot del stock al momento de autorizar).
- `observations`.

#### `supply_product_prices`
- Historial de precios por proveedor y fecha (para comparativas).

#### `supply_contracts` (Servicios Recurrentes)
- `expedient_number` (N° Expte).
- `service_name` (Concepto, ej: Limpieza).
- `provider` (Relación).
- `contract_type`: [licitacion_publica, contrato_locacion, compra_directa].
- `status`: [vigente, por_vencer, vencido, prorrogado, en_tramite].
- `start_date`, `end_date` (Vencimiento).
- `reception_commission` (Texto/Relación: Responsables de validar el servicio).
- `legal_documents` (PDFs: Pliegos, Decretos, Contratos).
- `renewal_alert` (Bool).

#### `supply_providers`
- `name`, `business_name` (Razón Social), `cuit`.
- `email`, `phone`, `address`, `province`.
- `cbu` (Datos Bancarios).
- `rupse_number`, `rupse_expiration_date`.
- `rupse_certificate` (Archivo PDF vigente).
- `status`: [activo, suspendido, vencido].
- `activities`: Relación a `supply_provider_activities` (Nomenclador).

#### `supply_provider_activities` (Master Data)
- `code` (ej: 11110).
- `description` (ej: Cultivo de cereales).

#### `supply_purchases` (Expedientes de Compra)
- `gde_code` (EX-2025-...), `title` (Carátula).
- `provider` (Relación a `supply_providers`).
- `contract_type`: [
    directa,            // < $250k
    directa_excepcion,  // > $250k + Urgencia
    licitacion_publica, // > $250k
    firma_ministra      // < $800k (Financiamiento Hospital)
  ].
- `financing_source`: [rentas_generales, programa_nacional, hospital_tesoro].
- `total_amount` (Monto total).
- `status`: [borrador, orden_compra, adjudicado, recibido_parcial, facturado, completado].
- `invoice_number`, `invoice_date`.
- `invoice_file` (PDF Factura).
- `documents` (Array: Presupuestos, F1, Dictámenes).
- `warehouse_feedback` (Observaciones desde depósito sobre la entrega).
- `expected_delivery_date`.
- `stock_evidence_snapshot` (JSON: Stock actual y consumo promedio al momento de crear el expediente).

#### `supply_purchase_quotes` (Cotizaciones y Oferentes)
- `purchase_id`: Relación a Expediente.
- `provider_id`: Relación a Proveedor.
- `amount`: Monto ofertado.
- `currency`: [ARS, USD].
- `file`: PDF del presupuesto.
- `status`: [solicitada, recibida, desestimada, ganadora].
- `ia_match_score`: (0-100) Coincidencia semántica Objeto-Rubro.
- `documents_checklist`: JSON con validaciones:
    - `is_rupse_valid` (Vigente y Rubro afín).
    - `has_arca_status` (Inscripción ARCA).
    - `has_rentas_status` (Inscripción Rentas Prov).
    - `has_fiscal_certificate` (Conducta Fiscal).
    - `has_f931` (Si tiene empleados).
    - `has_repsal`.

#### `supply_financial_movements` (Nexo Módulo Contable)
- `purchase_id`.
- `type`: [afectacion_preventiva, verificacion_fondos].
- `sector`: [contable_presupuesto, tesoreria].
- `status`: [pendiente, aprobado, rechazado].
- `notes`: "Partida 299 con saldo suficiente".

#### `supply_purchase_f1` (Documento F1)
- `purchase_id`.
- `details`: Renglones definitivos basados en la oferta ganadora.
- `total_amount`.
- `gde_signature_status`: [pendiente, firmado_solicitante, firmado_autoridad].
- `generated_at`.

#### `supply_purchase_orders` (Orden de Compra)
- `purchase_id`: Relación a Expediente.
- `f1_id`: Relación al F1 origen.
- `oc_number`: Numeración interna/oficial.
- `issue_date`.
- `files`: [PDF OC Firmada].
#### `supply_purchase_invoices` (Gestión de Pago)
- `purchase_id`: Relación.
- `provider_id`.
- `invoice_file`: PDF Factura Timbrada.
- `remito_file`: PDF Remito Firmado (si aplica).
- `fiscal_certificate`: PDF actualizado.
- `provisional_reception_report`: PDF Parte de Recepción (Firma Conjunta).
- `patrimonial_proof`: PDF Constancia Alta Patrimonial (si aplica).
- `status`: [presentada, observada_timbrado, en_legales, aprobada_pago].

#### `supply_legal_resolutions` (Resoluciones)
- `purchase_id`.
- `resolution_number` (Si ya existe).
- `draft_text`: Texto borrador del acto administrativo.
- `legal_status`: [pendiente_dictamen, dictaminado, firmada_ministra].
- `name` (ej: CENTRO LA BANDA, BIENES PATRIMONIALES).
- `location` (ej: consultorios, Segundo Piso).
- `description`.
- `is_active`.

#### `supply_inventory_transactions` (Ingresos/Egresos)
- `type`: [ingreso_compra, ingreso_ministerio, ingreso_adelanto, salida_consumo, baja_mercaderia, transferencia].
- `is_advance_delivery`: Bool (Adelanto sin OC).
- `external_reference`: N° Remito Ministerial (cuando no hay Expte interno).
- `date` (Fecha movimiento: 16/12/2025 13:52).
- `proof_number` (N° Comprobante Autogenerado: 0000062765).
- `related_purchase`: Relación opcional (null si es adelanto puro o donación).
- `related_expedient`: Texto libre si hay GDE pero no OC aún.
- `provider` (Para ingresos).
- `requesting_service` (Para egresos: ej: Administracion).
- `delivering_user` (Usuario que entregó: 27357388827).
- `receiving_user` (Empleado que retiró: FELIPE PERALTA).
- `observations` (ej: PRUEBA).
- `items`: [
    {
       `product_code`: "0000001557",
       `description`: "PAÑO PARA LA HIGIENE CORPORAL",
       `quantity`: 5.00
    }
  ]
- `status`: [activo, anulado].

#### `supply_fixed_assets` (Patrimonio)
- `inventory_number` (Código etiqueta).
- `serial_number` (Serie fábrica).
- `purchase_record` (Origen compra).
- `current_location`, `responsible_person`.
- `status`: [activo, en_reparacion, baja].

#### `sys_config` (Parámetros Globales)
- `key`: (ej: `amount_limit_direct_purchase`).
- `value`: (ej: `250000`).
- `description`: "Monto máximo para compra directa según Ley 7253".
- `updated_by`: Registro de quién cambió el tope legal.

#### `sys_audit_log` (Seguridad)
- Registro de quién modificó qué cosa y cuándo.

### 📚 Estándares y Referencias (SaaS Benchmarks)
Basado en el análisis de plataformas SaaS modernas (Appsmith, Retool, Vibe Code), este proyecto adopta una **Estrategia de Hibridación Arquitectónica**:
1.  **Integridad Transaccional (Core):** Priorizamos la robustez de datos (Conciliación Contable, Stock Real-time) sobre la generación puramente estética ("Vibe Code").
2.  **Soporte Multi-Almacén:** Arquitectura nativa para múltiples depósitos físicos (`supply_warehouses`).
3.  **Automatización Inteligente:** Uso de IA para tareas auxiliares (Validación RUPSE, Alertas de Consumo) sin comprometer la lógica de negocio central.
4.  **UX Enterprise:** Dashboards operativos inspirados en *Inventory Management Templates* de alto nivel (como Appsmith/Retool) pero con una interfaz de usuario personalizada y fluida.

### ⚙️ Viabilidad Técnica e Integraciones
1.  **AFIP (Inscripción y CAE):**
    *   **Padron A13 (`ws_sr_padron_a13`):** Factible vía SOAP para validar CUIT y datos básicos de proveedores.
    *   **Factura Electrónica (`WSFE`):** Posible integración para validar la autenticidad del CAE en facturas presentadas mediante `FEConsultaCAERequest`.
2.  **RUPSE (Santiago del Estero):**
    *   *Limitación:* No se detectan APIs públicas documentadas.
    *   *Estrategia MVP:* Carga manual de certificado PDF. Validación de vigencia mediante lectura de fecha en PDF (OCR/AI) o chequeo manual en portal web.

### 🎨 Alineación con Design System
El desarrollo respetará estrictamente los lineamientos definidos en `apps/hub/docs/DESIGN_SYSTEM.md`:
*   **Armonía Visual:** Uso de la paleta de colores institucional y variables CSS globales.
*   **Componentes:** Reutilización de `Card`, `Table`, `Badge` y `Button` existentes para mantener coherencia con otros módulos.
*   **Dark Mode:** Soporte nativo y testeado para operaciones nocturnas (guardias).
*   **Accesibilidad:** Interfaces claras para usuarios con alta carga cognitiva (urgencias).

---

### 📅 Roadmap de Implementación (Fases)

Para mitigar riesgos organizacionales y técnicos, el despliegue se realizará en etapas:

**Fase 1: Core Operativo (90 días)**
*   Objetivo: Ordenar la casa (Logística Interna).
*   Funcionalidades:
    *   Gestion de Stock (Ingreso/Egreso manual).
    *   Pedidos Internos + Autorización.
    *   Catálogo Maestro Normalizado.
    *   Adelantos de Mercadería (sin validar OC).

**Fase 2: Core Administrativo**
*   Objetivo: Conectar con el dinero (Compras).
*   Funcionalidades:
    *   Expedientes de Compra (GDE).
    *   Checklists Documentales (Manuales).
    *   Circuito F1 -> OC -> Recepción vinculada.
    *   Reglas de Montos Dinámicos.

**Fase 3: Inteligencia y Automatización (Futuro)**
*   Objetivo: Eficiencia y Compliance.
*   Funcionalidades:
    *   Integtración AFIP/WSFE.
    *   OCR de RUPSE.
    *   Forecast de Compras (IA).
    *   Triple Conciliación Contable.

### 🚀 Estrategia de Lanzamiento ("Quick Win")
Para generar momentum y adhesión temprana:
*   **Piloto (Semana 4):** Solo Sector "Farmacia". Flujo completo `Solicitud -> Autorización -> Entrega`.
*   **Objetivo:** Demostrar que es más rápido que el papel.

### 📊 Métricas de Éxito (KPIs)
El sistema será exitoso si logra:
1.  **Reducir Tiempos:** De 48hs a <4hs en el ciclo `Solicitud -> Entrega` interna.
2.  **Eliminar Papel:** 100% de los pedidos internos gestionados digitalmente en sectores piloto.
3.  **Precisión de Stock:** <5% de discrepancia entre stock físico y sistémico en auditorías sorpresa.
4.  **Adjudicación Transparente:** 100% de adjudicaciones con evidencia de stock adjunta.

### 🛡 Infraestructura y Seguridad
*   **Backup:** Snapshot horario de la base de datos (SQLite WAL) enviado a bucket S3 externo cifrado.
*   **Fallback:** Procedimiento de contingencia detallado (Planillas Excel de emergencia) si cae el sistema.

### 📖 Glosario Técnico
*   **Expediente:** Carpeta administrativa (GDE) que contiene toda la historia de una compra.
*   **Orden de Compra (OC):** Documento legal que formaliza la contratación con el proveedor.
*   **Pedido Interno:** Solicitud de un sector (ej: Enfermería) al depósito. No implica dinero.
*   **F1:** Formulario de adjudicación presupuestaria interna.
*   **RUPSE:** Registro Único de Proveedores de Santiago del Estero.
*   **Adelanto:** Entrega física de mercadería previa a la regularización administrativa (OC).
*   **QR Handshake:** Protocolo de entrega donde el solicitante muestra un QR único en su celular y el despachante lo escanea para validar identidad y cerrar el pedido sin firmar papel.

### 🔮 Visión de Futuro: Licitación Pública & Portal
Para la **Fase 3**, se reemplazará el envío de emails manuales por un **Portal de Proveedores (Vendor Portal)**:
1.  Proveedores se loguean con CUIT.
2.  Ven licitaciones abiertas.
3.  Cargan cotizaciones y documentos directamente en el sistema (Self-Service).
4.  La IA pre-valida la oferta antes de que llegue a Compras.
Para avanzar al diseño de pantallas, necesitamos definir:
1.  **Modelos de Inspiración:** ¿Qué interfaces (Dribbble, Behance, otros SaaS) resuenan con la visión de "superador"?
2.  **Nivel de Automatización:** ¿Deseamos integración con lectores de código de barras existentes o apps móviles para el personal de depósito?

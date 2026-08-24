# 🏥 Hub Hospitalario - Arquitectura, Tecnologías e Infraestructura

Este documento describe la arquitectura global, las tecnologías utilizadas, la integración de almacenamiento de objetos (Cloudflare R2) y los esquemas de base de datos en PocketBase para el sistema **Hub Hospitalario (CISB)**.

---

## 🛠️ 1. Stack Tecnológico

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19 / 18, TypeScript).
- **Estilos y UI**:
  - [Tailwind CSS](https://tailwindcss.com/) con paleta institucional CISB (`#08487A` primario, `slate-50` a `slate-950` en modo oscuro).
  - [shadcn/ui](https://ui.shadcn.com/) (componentes Dialog, Select, Dropdown, Tabs, Button, Card, Sheet, etc.).
  - [Lucide React](https://lucide.dev/) para iconografía coherente.
  - [Framer Motion](https://www.framer.com/motion/) para transiciones y animaciones sutiles.
  - [Sonner](https://sonner.emilkowal.ski/) para notificaciones Toast interactivas.
- **Monorepo**: Turborepo con `pnpm`.

### Backend & Autenticación
- **Backend / Database**: [PocketBase](https://pocketbase.io/) (versión v0.23+ alojada en VPS Linux en `https://pocketbase.manta.com.ar`).
- **Base de Datos**: SQLite integrada con WAL mode y reglas de acceso reactivas a nivel de API.
- **Mailing**: [Resend](https://resend.com/) API para notificaciones transaccionales por correo electrónico.

### Almacenamiento de Archivos (Object Storage)
- **Proveedor**: **Cloudflare R2** (compatible con AWS S3 API).
- **Bucket activo**: `pb-backup-cisb` (usado tanto para almacenamiento de archivos subidos como para backups automatizados).
- **Endpoint**: `https://6b9cc4836d7dc32e0e6e1c1a56d9aadc.r2.cloudflarestorage.com`
- **Región**: `auto`
- **Configuración en PocketBase**:
  - `forcePathStyle: true`
  - `s3.enabled: true`
- **Ventajas**:
  - Zero Egress Fees (sin costos por descarga de archivos o PDFs).
  - Descarga de archivos acelerada por la CDN global de Cloudflare.
  - El VPS solo almacena la base de datos SQLite ligera, facilitando backups y migraciones instantáneas.

---

## 📂 2. Módulos Principales del Sistema

### A. Portal de Prestadores Médicos y Asistenciales (`/modules/prestadores`)
Permite a profesionales médicos y asistenciales gestionar sus datos fiscales/profesionales y presentar liquidaciones de honorarios (guardias y extensiones horarias) a Tesorería.

1. **Gestión de Datos Fiscales y Conducta Fiscal ("Mis Datos")**:
   - **Colección PocketBase**: `prestadores_perfiles`
   - **Campos**:
     - `user` (relation -> `auth_users`): Usuario propietario.
     - `cuit` (text): CUIT/CUIL de 11 dígitos.
     - `profession` (select): Rol/profesión (`medico`, `kinesiologo`, `enfermero`, etc.).
     - `specialty` (text, opcional): Especialidad o servicio asistencial.
     - `license_number` (text): Matrícula profesional (MP / MN).
     - `tax_condition` (select): `monotributo`, `responsable_inscripto`, `exento`.
     - `cbu_alias` (text, opcional): CBU o Alias bancario para transferencias.
     - `phone` (text, opcional): Teléfono de contacto.
     - `file_conducta_fiscal` (file, max 10MB, PDF/JPG/PNG): Constancia DGR / Rentas vigente (almacenada en R2).
     - `conducta_fiscal_due_date` (date): Fecha límite de vigencia de la constancia.
   - **Comportamiento**:
     - Si hay constancia vigente, se reutiliza automáticamente en las presentaciones.
     - Permite previsualizar el PDF en pestaña nueva (`getPerfilFileUrl`).
     - Permite eliminar ("Quitar") o reemplazar la constancia en cualquier momento.

2. **Presentación y Facturación de Honorarios ("Nueva Presentación")**:
   - **Colección PocketBase**: `prestaciones_presentaciones`
   - **Campos**:
     - `user` (relation -> `auth_users`).
     - `tenant` (relation -> `hub_tenants`).
     - `period_month` (number): Mes de liquidación.
     - `period_year` (number): Año de liquidación.
     - `invoice_number` (text): Punto de venta y número de comprobante ARCA.
     - `invoice_date` (date): Fecha de emisión.
     - `invoice_amount` (number): Monto total facturado.
     - `service_type` (select): `guardia`, `consultorio`, `horas_planta`, `cirugias`, `otro`.
     - `service_days_type` (select): `mes_completo`, `rango_fechas`, `dias_especificos`.
     - `service_days_detail` (text): Detalle o renglones digitales.
     - `file_invoice` (file, PDF): Factura electrónica emitida.
     - `file_conducta_fiscal` (file, PDF): Constancia DGR adjunta.
     - `file_service_proof` (file, PDF): Planilla de guardia o certificación del servicio.
     - `status` (select): `pendiente`, `en_revision`, `observado`, `aprobado`, `pagado`.
     - `treasury_observation` (text): Devolución o motivo de corrección de Tesorería.

### B. Módulo de Suministros y Farmacia (`/modules/supply`)
- Gestión integral de stock, depósitos hospitalarios, solicitudes de insumos y catálogo de artículos.
- Colecciones: `supply_products`, `supply_warehouses`, `supply_requests`, `supply_purchases`, `supply_stock`, `supply_providers`.

### C. Módulo de Expedientes Digitales (`/modules/expedientes`)
- Trazabilidad y seguimiento de expedientes físicos y digitales a través de los sectores del hospital.
- Colecciones: `expedientes`, `ubicaciones`.

### D. Multi-Tenancy y Permisos
- Gestión de tenants (`hub_tenants`), roles (`hub_roles`) y permisos granulares (`hub_permissions`, `hub_role_permissions`).
- Los usuarios se vinculan a un tenant activo en sesión mediante `WorkspaceContext`.

---

## 🔒 3. Reglas de Acceso (API Rules en PocketBase)

| Colección | List / View Rule | Create Rule | Update Rule | Delete Rule |
| :--- | :--- | :--- | :--- | :--- |
| `prestadores_perfiles` | `@request.auth.id != ""` | `@request.auth.id != ""` | `user = @request.auth.id \|\| @request.auth.is_super_admin = true` | `@request.auth.is_super_admin = true` |
| `prestaciones_presentaciones` | `user = @request.auth.id \|\| @request.auth.is_super_admin = true` | `@request.auth.id != ""` | `user = @request.auth.id \|\| @request.auth.is_super_admin = true` | `@request.auth.is_super_admin = true` |
| `auth_users` | `@request.auth.id != ""` | Admin only | `id = @request.auth.id \|\| @request.auth.is_super_admin = true` | Admin only |

---

## 📌 4. Recomendaciones para Futuros Desarrollos / IAs

1. **Manejo de archivos con PocketBase**:
   - Para generar URLs de archivos se debe utilizar `pocketbase.files.getURL(record, filename)`.
   - Asegurarse de que el objeto `record` cuente con `id`, `collectionId` y `collectionName`.
2. **Subida de archivos mediante `FormData`**:
   - Para eliminar un archivo existente, enviar `formData.append('campo_archivo', '')`.
   - Para actualizar solo datos sin tocar el archivo, omitir el campo del archivo en el `FormData` (PocketBase conservará el archivo existente).
3. **Persistencia de fechas**:
   - Los campos tipo `date` en PocketBase esperan cadenas ISO (`YYYY-MM-DD` o `YYYY-MM-DD HH:mm:ss.sssZ`) o `""` para vaciar el campo.

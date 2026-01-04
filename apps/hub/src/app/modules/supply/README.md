# Módulo de Suministros (Supply Module)

Este módulo gestiona el ciclo logístico integral del hospital, desde la administración de depósitos y catálogo maestro hasta la gestión de solicitudes y control de stock.

## 🏗️ Estructura Organizativa (Core)

El sistema se basa en tres pilares fundamentales integrados al núcleo del Hub:

1.  **Sectores (`hub_sectors`)**: Maestro de unidades operativas (Guardia, UTI, etc.). Es una colección transversal que servirá también para RRHH.
2.  **Nodos de Depósito (`supply_nodes`)**: Puntos físicos de almacenamiento.
    *   **Central**: Centro de distribución maestro.
    *   **Periférico**: Depósitos de servicio (Farmacia, Gabinetes).
    *   **Especial**: Áreas con requerimientos críticos (Cadena de frío, Estupefacientes).
3.  **Tenants**: Multitenencia nativa para soportar múltiples hospitales en la misma instancia.

## 📦 Modelo de Datos

### Colecciones PocketBase
- `supply_products`: Catálogo maestro de insumos (Nombre, SKU, Categoría, Estado).
- `supply_nodes`: Definición de depósitos y su tipo.
- `supply_categories`: Categorización técnica de insumos.
- `supply_requests`: Gestión de pedidos entre sectores y depósitos.
- `hub_sectors`: Sectores del hospital vinculados a usuarios.

## 🚀 Funcionalidades Principales

### 1. Panel de Configuración (Settings)
Ubicación: `/modules/supply/settings`
- **Gestión de Nodos**: Panel lateral (Sheet) para crear y editar depósitos con control de estado.
- **Importación Masiva de Sectores**: Herramienta administrativa para poblar los 103 sectores hospitalarios desde XML.
- **Herramienta de Re-vinculación**: Utilidad para corregir la asociación de sectores con hospitales (Tenants) en masa.
- **Gestión de Catálogo**: Administración de categorías y parámetros de negocio.

### 2. Dashboard Operativo
Ubicación: `/modules/supply`
- KPIs en tiempo real (en desarrollo).
- Accesos rápidos a creación de solicitudes y reportes.

### 3. Gestión de Productos
Ubicación: `/modules/supply/products`
- Listado con filtros avanzados.
- Validación de SKU y nombres duplicados.

## 🛠️ Server Actions (`app/actions/supply.ts`)

- `importHospitalSectors`: Importación masiva de sectores.
- `fixSectorsTenant`: Corrección masiva de pertenencia de sectores.
- `getHubSectors`: Obtención de sectores activos.
- `getSupplyNodes` / `createSupplyNode` / `updateSupplyNode`: Gestión completa de depósitos.
- `getSupplyCategories`: Listado de categorías activas.
- `checkProductAvailability`: Validación de unicidad de insumos.

## 🎨 Estética y UX
- **Diseño**: Glassmorphism premium, paleta de azules corporativos y modo oscuro nativo.
- **Interacciones**: Uso de `Sheets` para edición sin pérdida de contexto.
- **Seguridad**: Reglas de API granulares y filtrado de sectores basado en la asignación del usuario (`auth_users.assigned_sectors`).

---
*Nota: Este módulo está diseñado siguiendo la visión de plataforma integrada del Hub Hospitalario.*

# Implementation Plan: Supply Module (Hub Hospitalario)

## 1. Goal Description
Create the data foundation and frontend structure for the comprehensive Supply Module (Contrataciones + Inventario). This involves defining a 15-collection PocketBase schema and setting up the Next.js directory structure to support the dual-module architecture (Admin vs. Logistics).

## 2. User Review Required
> [!IMPORTANT]
> **Data Governance:** The schema introduces a strict `supply_data_steward` role. Only users with this role/permission will be able to create new products.
> **Montos Dinámicos:** The `sys_config` collection will determine the thresholds for purchasing rules (Directa vs Licitación). Initial values will be set to $250k and $800k but can be changed by Admin.

## 3. Proposed Changes

### Database Schema (PocketBase)
We will create a new file `docs/schemas/pocketbase_schema_supply.json` containing the definitions for:

#### Master Data
*   `supply_products`: The catalog. Indexed by SKU.
*   `supply_categories`: Categories (Rubros).
*   `supply_providers`: Vendors with RUPSE data.
*   `supply_warehouses`: Physical locations.
*   `sys_config`: System parameters.

#### Operational Core (Logistics)
*   `supply_requests`: Internal orders (User -> Approver).
*   `inventory_transactions`: The ledger of movements (Ingress/Egress).
*   `fixed_assets`: Patrimonial tracking.

#### Administrative Core (Procurement)
*   `supply_purchases`: Experiments/Purchase Files (GDE).
*   `supply_purchase_quotes`: Vendor offers & RUPSE checks.
*   `supply_purchase_f1`: Adjudication document.
*   `supply_purchase_orders`: Formal OCs.
*   `supply_purchase_invoices`: Invoices & Payments.

### Frontend Structure (Next.js)
New directories in `apps/hub/src/app/(protected)/modules/supply`:
*   `/logistics`: The "Logistic Hub" for generic users and warehouse managers.
    *   `/requests`: Shopping cart experience.
    *   `/inventory`: Stock management (Ingress/Egress).
*   `/admin`: The "Procurement Hub" for the purchasing team.
    *   `/purchases`: Expedient management.
    *   `/providers`: Vendor database.

## 4. Verification Plan
### Automated Tests
*   We will script the seeding of the schema to a local PocketBase instance (if available) or verify the JSON structure against PocketBase import rules.

### Manual Verification
*   User will review the `pocketbase_schema_supply.json` to confirm all fields are present.
*   User will check the created folder structure in the IDE.

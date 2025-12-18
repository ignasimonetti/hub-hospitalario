# Task Checklist: Integrated Supply Module (Hub Hospitalario)

## 1. Foundation & Architecture (Current)
- [ ] **Database Schema Definition** <!-- id: 1 -->
    - [ ] Create `pocketbase_schema_supply.json` with all 15+ collections. <!-- id: 2 -->
    - [ ] Define relationships, validation rules, and indexes. <!-- id: 3 -->
- [ ] **Frontend Scaffolding** <!-- id: 4 -->
    - [ ] Create directory structure in `apps/hub/src/app/(protected)/modules/supply`. <!-- id: 5 -->
    - [ ] Set up shared types and interfaces (`types/supply.ts`). <!-- id: 6 -->

## 2. Phase 1: Operational Core (Logistics)
- [ ] **Catalog Management** <!-- id: 7 -->
    - [ ] Implementation of `supply_products` CRUD (Data Steward role). <!-- id: 8 -->
    - [ ] "Seed" script for initial categories and products. <!-- id: 9 -->
- [ ] **Internal Requests (The "Cart")** <!-- id: 10 -->
    - [ ] Create "Request New Supply" flow for `supply_requester`. <!-- id: 11 -->
    - [ ] Product selector with stock visibility (filtered by sector). <!-- id: 12 -->
- [ ] **Authorization Flow** <!-- id: 13 -->
    - [ ] Dashboard for `supply_approver`. <!-- id: 14 -->
    - [ ] Logic for editing quantities/rejecting items. <!-- id: 15 -->
- [ ] **Warehouse Operations** <!-- id: 16 -->
    - [ ] Dashboard for `supply_manager` (Pending Deliveries). <!-- id: 17 -->
    - [ ] `inventory_transactions` implementation (Ingress/Egress). <!-- id: 18 -->
    - [ ] QR Handshake UI (Mockup/Initial implementation). <!-- id: 19 -->

## 3. Phase 2: Administrative Core (Procurement)
- [ ] **Purchase Request Management** <!-- id: 20 -->
    - [ ] Logic for auto-generating purchase requests from stock gaps. <!-- id: 21 -->
- [ ] **Expedient Management (GDE Wrapper)** <!-- id: 22 -->
    - [ ] `supply_purchases` CRUD. <!-- id: 23 -->
    - [ ] Rules engine for Dynamic Thresholds (Direct vs Tender). <!-- id: 24 -->
- [ ] **Financial Flow** <!-- id: 25 -->
    - [ ] Purchase Quotes & RUPSE Check. <!-- id: 26 -->
    - [ ] F1 Document Generation & Signing Status. <!-- id: 27 -->
    - [ ] Purchase Order (OC) Generation & Notification. <!-- id: 28 -->

## 4. Phase 3: Intelligence & Automation (Future)
- [ ] **n8n Agent Integration** <!-- id: 29 -->
    - [ ] RUPSE Auditor workflow. <!-- id: 30 -->
    - [ ] Stock Consumption Anomaly Detector. <!-- id: 31 -->
- [ ] **Vendor Portal** <!-- id: 32 -->
    - [ ] Basic self-service interface for providers. <!-- id: 33 -->

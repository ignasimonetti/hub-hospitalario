
export type SupplyProductType = 'consumible' | 'activo_fijo' | 'servicio';
export type SupplyRequestStatus = 'pendiente_autorizacion' | 'autorizado' | 'rechazado' | 'entregado_parcial' | 'entregado_total';
export type SupplyPriority = 'baja' | 'normal' | 'urgente';
export type SupplyProviderStatus = 'activo' | 'suspendido' | 'vencido';

export interface SupplyCategory {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface SupplyProviderActivity {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    code: string;
    description: string;
}

export interface SupplyProvider {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    business_name?: string;
    cuit: string;
    email?: string;
    phone?: string;
    cbu?: string;
    rupse_number?: string;
    rupse_expiration_date?: string;
    rupse_certificate?: string;
    status: SupplyProviderStatus;
    activities: string[]; // Relation IDs
}

export interface SupplyWarehouse {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    location?: string;
    is_main: boolean;
}

export interface SupplyProduct {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    description?: string;
    sku: string;
    type: SupplyProductType;
    category: string; // Relation ID
    unit: string;
    alert_threshold?: number;
    default_provider?: string; // Relation ID
    is_critical: boolean;
}

export interface SupplyRequestItem {
    product_id: string;
    quantity_requested: number;
    quantity_authorized?: number;
    current_stock_at_authorization?: number;
}

export interface SupplyRequest {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    request_number: string;
    request_date: string;
    requesting_sector: string;
    destination_sector?: string;
    requester: string; // User ID
    motive?: string;
    priority: SupplyPriority;
    status: SupplyRequestStatus;
    items: SupplyRequestItem[];
    observations?: string;
}

export interface SupplyPurchase {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    gde_code?: string;
    title: string;
    contract_type: 'directa' | 'directa_excepcion' | 'licitacion_publica' | 'firma_ministra';
    financing_source: 'rentas_generales' | 'programa_nacional' | 'hospital_tesoro';
    total_amount?: number;
    status: 'borrador' | 'orden_compra' | 'adjudicado' | 'recibido_parcial' | 'facturado' | 'completado';
    stock_evidence_snapshot?: any; // JSON
}

export interface SupplyInventoryTransactionItem {
    product_code: string; // or ID
    description: string;
    quantity: number;
    expiration_date?: string;
    batch_number?: string;
}

export interface SupplyInventoryTransaction {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    type: 'ingreso_compra' | 'ingreso_ministerio' | 'ingreso_adelanto' | 'salida_consumo' | 'baja_mercaderia' | 'transferencia';
    is_advance_delivery: boolean;
    date: string;
    related_purchase?: string;
    items: SupplyInventoryTransactionItem[];
    status: 'activo' | 'anulado';
}


export interface ExpedienteRecord {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;

    numero: string;
    descripcion: string; // Asunto
    estado: ExpedienteEstado;
    prioridad: ExpedientePrioridad;
    ubicacion: string; // Relation ID to 'ubicaciones'
    observacion: string; // HTML Content
    fecha_inicio?: string;
    ultimo_movimiento?: string;

    tenant: string;
    created_by?: string;

    expand?: {
        ubicacion?: UbicacionRecord;
        created_by?: any;
    }
}

export interface UbicacionRecord {
    id: string;
    nombre: string;
    descripcion?: string;
    tenant: string;
}

export type ExpedienteEstado = "En trámite" | "Finalizado" | "Archivado" | "Pendiente";
export type ExpedientePrioridad = "Alta" | "Media" | "Baja";

export interface ExpedienteCreateData {
    numero: string;
    descripcion?: string;
    estado: string;
    ubicacion?: string;
    observacion?: string;
    prioridad: string;
    tenant: string;
    fecha_inicio?: string;
    ultimo_movimiento?: string;
}

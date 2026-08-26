import {
  PrestacionPresentacion,
  PrestadorPerfil,
  SectorServicio,
  TipoPrestacion,
  EventoObservacion,
} from './prestadores';

export interface PrestacionTesoreriaItem extends PrestacionPresentacion {
  perfilPrestador?: PrestadorPerfil | null;
}

export type EstadoLoteTesoreria =
  | 'borrador'
  | 'en_tramite_gde'
  | 'cerrado'
  | 'en_contabilidad'
  | 'en_despacho'
  | 'autorizado_resolucion'
  | 'pagado_bse'
  | 'archivado';

export interface OrdenDePagoConfigPayload {
  numero_op: string; // Ej: "3930"
  anio_op?: number; // Ej: 2026
  expediente_gde?: string; // Ej: "EX-2026-03181067- -GDESDE-CISB#MS"
  numero_resolucion?: string; // Ej: "RESOL-2026-2157-E-GDESDE-CISB#MS"
  fecha_resolucion?: string;
  jurisdiccion?: string; // Ej: "63"
  programa?: string; // Ej: "11 - PREVENCION, PROMOCION, PROTECCION, RECUPERACION Y REHABILITACION DE LA SALUD"
  actividad?: string; // Ej: "ACT 1"
  partida?: string; // Ej: "PART 341"
  fuente_financiamiento?: string; // Ej: "11 - TESORO PROVINCIAL" o "REMESAS DEL TESORO"
  banco_nombre?: string; // Ej: "BSE - CUENTA CORRIENTE"
  cuenta_bancaria?: string; // Ej: "1255424/86"
  observaciones?: string;
}

export interface ComprobanteBancarioAdjunto {
  id: string;
  name: string;
  url: string;
  size?: number;
  uploaded_at: string;
}

export interface LoteTesoreria {
  id: string;
  tenant: string;
  numero_lote: string; // Ej: "LOTE 4 JUNIO 2026"
  numero_expediente_gde?: string; // Ej: "EX-2026-03181067- -GDESDE-CISB#MS"
  codigo_tramite_gde?: string; // Ej: "GSGE00055 - Solicitud de Pago"
  descripcion: string;
  periodo_mes: number;
  periodo_anio: number;
  estado: EstadoLoteTesoreria;
  numero_orden_pago?: string; // Ej: "3930" (Orden de Pago GDE)
  fecha_orden_pago?: string;
  comprobante_pago_bse?: string; // Ej: "OP-LOTE-4-BSE" o REF Transferencia
  fecha_pago_bse?: string;
  numero_resolucion?: string; // Ej: "RESOL-2026-2244-E-GDESDE-CISB#MS"
  fecha_resolucion?: string;
  op_config?: OrdenDePagoConfigPayload; // Datos presupuestarios y bancarios configurados
  comprobantes_bancarios?: string[] | ComprobanteBancarioAdjunto[]; // Archivos PDF de acreditación bancaria
  comprobantes_retenciones?: string[] | ComprobanteBancarioAdjunto[]; // Certificados y constancias oficiales de retenciones (DGR, AFIP/ARCA, etc.)
  monto_bruto_total: number;
  monto_retenciones_total: number;
  monto_neto_total: number;
  cantidad_prestaciones: number;
  created_by?: string;
  created_by_name?: string;
  created: string;
  updated: string;
  prestaciones_ids: string[];
}

export interface KpisTesoreriaData {
  totalLiquidadoMonto: number;
  totalLiquidadoCantidad: number;
  totalPendienteMonto: number;
  totalPendienteCantidad: number;
  totalObservadoMonto: number;
  totalObservadoCantidad: number;
  totalConformadoMonto: number;
  totalConformadoCantidad: number;
  desglosePorServicio: {
    servicioKey: string;
    servicioLabel: string;
    montoLiquidado: number;
    montoPendiente: number;
    montoTotal: number;
    cantidadPrestaciones: number;
    porcentajeDelTotal: number;
  }[];
}

export interface RegistrarPagoPayload {
  receiptNumber: string;
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  fileProof?: File | null;
}

export interface LiquidarLotePayload {
  batchReceiptNumber: string;
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  numeroResolucion?: string;
}

export interface CrearLotePayload {
  numeroLote: string;
  numeroExpedienteGde: string;
  descripcion: string;
  periodoMes: number;
  periodoAnio: number;
  prestacionesIds: string[];
}

export type CategoriaObservacionFiscal =
  | 'cae_invalido_vencido'
  | 'cuit_emisor_invalido'
  | 'monto_discordante'
  | 'periodo_invalido'
  | 'falta_conducta_fiscal'
  | 'punto_venta_invalido'
  | 'otro_fiscal';

export interface ObservarFiscalPayload {
  categoria: CategoriaObservacionFiscal;
  motivoDetallado: string;
}

export const CATEGORIAS_OBSERVACION_FISCAL: {
  id: CategoriaObservacionFiscal;
  label: string;
  descripcion: string;
}[] = [
  {
    id: 'monto_discordante',
    label: 'Importe no coincide con la Planilla Asistencial',
    descripcion: 'El total facturado en ARCA difiere del monto liquidable computado en la planilla digital.',
  },
  {
    id: 'periodo_invalido',
    label: 'Período facturado erróneo en el comprobante',
    descripcion: 'El concepto o fechas facturadas en el comprobante no corresponden al mes de la prestación.',
  },
  {
    id: 'cae_invalido_vencido',
    label: 'CAE / CAI no válido o vencido',
    descripcion: 'El código de autorización electrónica emitido por ARCA presenta inconsistencias.',
  },
  {
    id: 'cuit_emisor_invalido',
    label: 'CUIT / Datos de Emisor o Receptor incorrectos',
    descripcion: 'La factura no fue emitida al CUIT oficial del CISB o los datos del prestador no coinciden.',
  },
  {
    id: 'falta_conducta_fiscal',
    label: 'Constancia de Cumplimiento Fiscal (DGR/ARCA) vencida',
    descripcion: 'La constancia de conducta fiscal adjunta se encuentra fuera del plazo de vigencia.',
  },
  {
    id: 'punto_venta_invalido',
    label: 'Punto de Venta o Tipo de Comprobante incorrecto',
    descripcion: 'Debe emitirse Factura B o C electrónica con punto de venta habilitado para servicios.',
  },
  {
    id: 'otro_fiscal',
    label: 'Otra Inconsistencia Fiscal / Administrativa',
    descripcion: 'Observación específica descripta en el detalle de Tesorería.',
  },
];

export interface RegistroLoteBancarioExport {
  ordenPago: string;
  cuit: string;
  beneficiario: string;
  cbuAlias: string;
  condicionFiscal: string;
  servicioHospitalario: string;
  tipoFormulario: string;
  numeroTramite: string;
  numeroExpedienteGde: string;
  facturaNumero: string;
  periodo: string;
  montoBruto: number;
  retencionIIBB: number;
  retencionGanancias: number;
  retencionSUSS: number;
  retencionOtras: number;
  retencionOtrasConcepto: string;
  retencionMontoTotal: number;
  montoNeto: number;
  estado: string;
  fechaAprobacionDireccion: string;
  fechaPago: string;
}

export interface MotivoObservacionConfig {
  id: string;
  label: string;
  descripcion: string;
}

export interface ConfiguracionModuloTesoreria {
  motivos_observacion_fiscal: MotivoObservacionConfig[];
  codigo_tramite_gde_default: string;
  plantilla_expediente_gde: string;
  cuit_hospital_pagador: string;
  nombre_cuenta_bancaria: string;
  leyenda_transferencia_bse: string;
  minutos_bloqueo_revision: number;
  retenciones_habilitadas: {
    iibb: boolean;
    ganancias: boolean;
    suss: boolean;
    otras: boolean;
  };
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_MOTIVOS_OBSERVACION_FISCAL: MotivoObservacionConfig[] = [
  {
    id: 'monto_discordante',
    label: 'Importe no coincide con la Planilla Asistencial',
    descripcion: 'El total facturado en ARCA difiere del monto liquidable computado en la planilla digital.',
  },
  {
    id: 'periodo_invalido',
    label: 'Período facturado erróneo en el comprobante',
    descripcion: 'El concepto o fechas facturadas en el comprobante no corresponden al mes de la prestación.',
  },
  {
    id: 'cae_invalido_vencido',
    label: 'CAE / CAI no válido o vencido',
    descripcion: 'El código de autorización electrónica emitido por ARCA presenta inconsistencias.',
  },
  {
    id: 'cuit_emisor_invalido',
    label: 'CUIT / Datos de Emisor o Receptor incorrectos',
    descripcion: 'La factura no fue emitida al CUIT oficial del CISB o los datos del prestador no coinciden.',
  },
  {
    id: 'falta_conducta_fiscal',
    label: 'Constancia de Cumplimiento Fiscal (DGR/ARCA) vencida',
    descripcion: 'La constancia de conducta fiscal adjunta se encuentra fuera del plazo de vigencia.',
  },
  {
    id: 'punto_venta_invalido',
    label: 'Punto de Venta o Tipo de Comprobante incorrecto',
    descripcion: 'Debe emitirse Factura B o C electrónica con punto de venta habilitado para servicios.',
  },
  {
    id: 'otro_fiscal',
    label: 'Otra Inconsistencia Fiscal / Administrativa',
    descripcion: 'Observación específica descripta en el detalle de Tesorería.',
  },
];

export const DEFAULT_CONFIGURACION_TESORERIA: ConfiguracionModuloTesoreria = {
  motivos_observacion_fiscal: DEFAULT_MOTIVOS_OBSERVACION_FISCAL,
  codigo_tramite_gde_default: 'GSGE00055 - Solicitud de Pago',
  plantilla_expediente_gde: 'EX-2026- -GDESDE-CISB#MS',
  cuit_hospital_pagador: '30-71477758-5',
  nombre_cuenta_bancaria: 'CISB - Cta Cte Recaudación BSE',
  leyenda_transferencia_bse: 'Pago Honorarios Prestaciones CISB',
  minutos_bloqueo_revision: 15,
  retenciones_habilitadas: {
    iibb: true,
    ganancias: true,
    suss: true,
    otras: true,
  },
};

export const ESTADOS_LOTE_CONFIG: Record<
  EstadoLoteTesoreria,
  { label: string; bgLight: string; textDark: string }
> = {
  borrador: {
    label: 'Borrador / Preparación',
    bgLight: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    textDark: 'text-slate-700 dark:text-slate-300',
  },
  en_tramite_gde: {
    label: 'Expediente GDE (Abierto)',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    textDark: 'text-blue-700 dark:text-blue-300',
  },
  cerrado: {
    label: 'Cerrado para Emisión',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    textDark: 'text-purple-700 dark:text-purple-300',
  },
  en_contabilidad: {
    label: 'Pase a Contable (Asiento Global)',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    textDark: 'text-amber-800 dark:text-amber-200',
  },
  en_despacho: {
    label: 'Pase a Despacho (Resolución)',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    textDark: 'text-purple-700 dark:text-purple-300',
  },
  autorizado_resolucion: {
    label: 'Autorizado con Resolución',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    textDark: 'text-emerald-700 dark:text-emerald-300',
  },
  pagado_bse: {
    label: 'Transferido / Pagado BSE',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    textDark: 'text-teal-700 dark:text-teal-300',
  },
  archivado: {
    label: 'Archivado en GDE',
    bgLight: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    textDark: 'text-gray-600 dark:text-gray-400',
  },
};

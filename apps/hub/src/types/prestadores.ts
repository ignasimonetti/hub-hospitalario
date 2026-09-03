/**
 * Tipos de datos para el módulo Portal de Prestadores y Facturación de Honorarios
 */

export type ProfesionPrestador =
  | 'medico'
  | 'psicologo'
  | 'kinesiologo'
  | 'obstetra'
  | 'enfermero'
  | 'bioquimico'
  | 'tecnico'
  | 'odontologo'
  | 'nutricionista'
  | 'farmaceutico'
  | 'asistente_social'
  | 'otro';

export type CondicionFiscal = 'monotributo' | 'responsable_inscripto' | 'exento';

export type TipoPrestacion =
  | 'guardia'
  | 'extension_horaria'
  | 'guardia_ordinaria'
  | 'guardia_critica'
  | 'consultorio'
  | 'coordinacion'
  | 'fortalecimiento'
  | 'ufmi'
  | 'ufi'
  | 'otro';

export type SectorServicio =
  | 'clinica_medica'
  | 'pediatria'
  | 'uti_adultos'
  | 'utin_neonatologia'
  | 'guardia_emergencias'
  | 'cirugia_quirofano'
  | 'traumatologia'
  | 'cardiologia'
  | 'ginecologia_obstetricia'
  | 'salud_mental'
  | 'imagenes'
  | 'laboratorio'
  | 'kinesiologia'
  | 'otro';

export type TipoDiasPrestacion = 'mes_completo' | 'rango_fechas' | 'dias_especificos';

export type OrigenObservacion = 'director_adjunto' | 'director_coordinador' | 'tesoreria';

export interface EventoObservacion {
  id: string;
  autor_id: string;
  autor_nombre: string;
  rol_emisor: 'director_adjunto' | 'director_coordinador' | 'tesoreria' | 'prestador';
  tipo: 'observacion' | 'correccion_reenvio';
  motivo: string;
  created_at: string;
}

export type EstadoPrestacion =
  | 'borrador'
  | 'pendiente'
  | 'en_revision'
  | 'visado_adjunto'
  | 'observado'
  | 'observado_tesoreria'
  | 'aprobado'
  | 'pagado';

export interface PrestadorPerfil {
  id: string;
  collectionId: string;
  collectionName: string;
  user: string;
  cuit: string;
  profession: ProfesionPrestador;
  specialty?: string;
  license_number: string;
  tax_condition: CondicionFiscal;
  cbu_alias?: string;
  phone?: string;
  file_conducta_fiscal?: string;
  conducta_fiscal_due_date?: string;
  created: string;
  updated: string;
}

export const MAX_INVOICE_AMOUNT = 800000; // Tope máximo por comprobante / trámite ($800.000)

export interface FeriadoConfig {
  fecha: string; // YYYY-MM-DD
  motivo: string;
  tipo?: 'nacional' | 'provincial' | 'asueto';
}

export interface ProfesionHabilitada {
  id: string;
  label: string;
}

export interface ConfiguracionModuloPrestadores {
  valor_guardia_ordinaria_habil: number;
  valor_guardia_ordinaria_inhabil: number;
  valor_guardia_critica_habil: number;
  valor_guardia_critica_inhabil: number;
  valor_modulo_6hs_extension?: number;
  valor_hora_extension: number;
  tope_maximo_factura: number;
  sectores_habilitados?: string[];
  profesiones_habilitadas?: ProfesionHabilitada[];
  feriados_config?: FeriadoConfig[];
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_SECTORES_HABILITADOS: string[] = [
  'Guardia de Emergencias',
  'Terapia Intensiva Adultos (UTI)',
  'Terapia Intensiva Pediátrica / Neonatología (UTIN)',
  'Clínica Médica / Sala',
  'Pediatría',
  'Cirugía General / Quirófano',
  'Traumatología y Ortopedia',
  'Cardiología',
  'Ginecología y Obstetricia',
  'Salud Mental / Psicología',
  'Diagnóstico por Imágenes',
  'Laboratorio / Bioquímica',
  'Kinesiología y Rehabilitación',
  'Consultorios Externos',
  'Otro Sector / Servicio',
];

export const DEFAULT_PROFESIONES_HABILITADAS: ProfesionHabilitada[] = [
  { id: 'medico', label: 'Médico / Especialista' },
  { id: 'psicologo', label: 'Psicólogo / Lic. en Psicología' },
  { id: 'kinesiologo', label: 'Kinesiólogo / Fisioterapeuta' },
  { id: 'obstetra', label: 'Obstetra / Lic. en Obstetricia' },
  { id: 'enfermero', label: 'Enfermero / Instrumentador' },
  { id: 'bioquimico', label: 'Bioquímico' },
  { id: 'tecnico', label: 'Técnico de Salud / Imágenes' },
  { id: 'odontologo', label: 'Odontólogo' },
  { id: 'nutricionista', label: 'Lic. en Nutrición' },
  { id: 'farmaceutico', label: 'Farmacéutico' },
  { id: 'asistente_social', label: 'Trabajador / Asistente Social' },
  { id: 'otro', label: 'Otro Profesional Asistencial' },
];

export const DEFAULT_FERIADOS_ARGENTINA_SDE: FeriadoConfig[] = [
  { fecha: '2026-01-01', motivo: 'Año Nuevo', tipo: 'nacional' },
  { fecha: '2026-02-16', motivo: 'Carnaval', tipo: 'nacional' },
  { fecha: '2026-02-17', motivo: 'Carnaval', tipo: 'nacional' },
  { fecha: '2026-03-24', motivo: 'Día Nacional de la Memoria por la Verdad y la Justicia', tipo: 'nacional' },
  { fecha: '2026-04-02', motivo: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', tipo: 'nacional' },
  { fecha: '2026-04-03', motivo: 'Viernes Santo', tipo: 'nacional' },
  { fecha: '2026-04-27', motivo: 'Día de la Autonomía Provincial (Santiago del Estero)', tipo: 'provincial' },
  { fecha: '2026-05-01', motivo: 'Día del Trabajador', tipo: 'nacional' },
  { fecha: '2026-05-25', motivo: 'Día de la Revolución de Mayo', tipo: 'nacional' },
  { fecha: '2026-06-15', motivo: 'Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes', tipo: 'nacional' },
  { fecha: '2026-06-20', motivo: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', tipo: 'nacional' },
  { fecha: '2026-07-09', motivo: 'Día de la Independencia', tipo: 'nacional' },
  { fecha: '2026-07-25', motivo: 'Fundación de la Ciudad de Santiago del Estero', tipo: 'provincial' },
  { fecha: '2026-08-17', motivo: 'Paso a la Inmortalidad del Gral. José de San Martín', tipo: 'nacional' },
  { fecha: '2026-10-12', motivo: 'Día del Respeto a la Diversidad Cultural', tipo: 'nacional' },
  { fecha: '2026-11-23', motivo: 'Día de la Soberanía Nacional', tipo: 'nacional' },
  { fecha: '2026-12-08', motivo: 'Día de la Inmaculada Concepción de María', tipo: 'nacional' },
  { fecha: '2026-12-25', motivo: 'Navidad', tipo: 'nacional' },
];

export const DEFAULT_CONFIGURACION_PRESTADORES: ConfiguracionModuloPrestadores = {
  valor_guardia_ordinaria_habil: 95000,
  valor_guardia_ordinaria_inhabil: 115000,
  valor_guardia_critica_habil: 130000,
  valor_guardia_critica_inhabil: 160000,
  valor_modulo_6hs_extension: 111000,
  valor_hora_extension: 18500,
  tope_maximo_factura: 800000,
  sectores_habilitados: DEFAULT_SECTORES_HABILITADOS,
  profesiones_habilitadas: DEFAULT_PROFESIONES_HABILITADAS,
  feriados_config: DEFAULT_FERIADOS_ARGENTINA_SDE,
};

export interface RenglonGuardiaDigital {
  id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  tipo: 'normal' | 'critica';
  duracion_horas?: number;
  valor?: number;
}

export interface RenglonExtensionHorariaDigital {
  id: string;
  fecha: string;
  horario_programado: string;
  horas_cumplidas: number;
  valor?: number;
}

export interface FormularioGuardiaData {
  tipo_formulario: 'guardia';
  reemplazo_de?: string;
  observaciones?: string;
  renglones: RenglonGuardiaDigital[];
}

export interface FormularioExtensionHorariaData {
  tipo_formulario: 'extension_horaria';
  cargo_especialidad?: string;
  observaciones?: string;
  renglones: RenglonExtensionHorariaDigital[];
}

export type FormularioDigitalData = FormularioGuardiaData | FormularioExtensionHorariaData;

export interface DetalleFacturaItem {
  number: string;
  date: string;
  amount: number;
  service_days_type?: TipoDiasPrestacion;
  service_days_detail?: string;
  file_name?: string;
}

export interface PrestacionPresentacion {
  id: string;
  collectionId: string;
  collectionName: string;
  user: string;
  tenant: string;
  form_number?: string; // Ej: "G-0001" o "EH-0001"
  period_month: number;
  period_year: number;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  invoices_detail?: DetalleFacturaItem[];
  service_type: TipoPrestacion;
  hospital_service?: SectorServicio | string;
  service_days_type: TipoDiasPrestacion;
  service_days_detail?: string;
  digital_form_data?: FormularioDigitalData | string;
  conducta_fiscal_due_date: string;
  file_invoice: string;
  file_conducta_fiscal: string;
  file_service_proof?: string;
  status: EstadoPrestacion;
  adjunto_approved_by?: string;
  adjunto_approved_at?: string;
  adjunto_signature_meta?: string;
  director_approved_by?: string;
  director_approved_at?: string;
  director_signature_meta?: string;
  director_observation?: string;
  treasury_observation?: string;
  origen_observacion?: OrigenObservacion;
  historial_observaciones?: EventoObservacion[] | string;
  director_adjunto_asignado?: string;
  area_adjunta_destino?: string;
  treasury_paid_at?: string;
  treasury_receipt_number?: string;
  treasury_check_status?: 'pendiente_control' | 'en_revision' | 'conformado' | 'observado_fiscal';
  treasury_locked_by?: string;
  treasury_locked_name?: string;
  treasury_locked_at?: string;
  treasury_verified_by?: string;
  treasury_verified_at?: string;
  lote_id?: string;
  lote_numero?: string;
  numero_expediente_gde?: string;
  retencion_iibb?: number;
  retencion_ganancias?: number;
  retencion_suss?: number;
  retencion_otras?: number;
  retencion_otras_concepto?: string;
  retencion_monto?: number;
  monto_neto_liquidable?: number;
  submitted_at?: string;
  reviewed_at?: string;
  paid_at?: string;
  created: string;
  updated: string;
  expand?: {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      professional_id?: string;
      signature_data?: string;
    };
    tenant?: {
      id: string;
      name: string;
      code?: string;
    };
  };
}

export const PROFESIONES_MAP: Record<ProfesionPrestador, string> = {
  medico: 'Médico / Especialista',
  psicologo: 'Psicólogo / Lic. en Psicología',
  kinesiologo: 'Kinesiólogo / Fisioterapeuta',
  obstetra: 'Obstetra / Lic. en Obstetricia',
  enfermero: 'Enfermero / Instrumentador',
  bioquimico: 'Bioquímico',
  tecnico: 'Técnico de Salud / Imágenes',
  odontologo: 'Odontólogo',
  nutricionista: 'Lic. en Nutrición',
  farmaceutico: 'Farmacéutico',
  asistente_social: 'Trabajador / Asistente Social',
  otro: 'Otro Profesional Asistencial',
};

export const CONDICIONES_FISCALES_MAP: Record<CondicionFiscal, string> = {
  monotributo: 'Monotributista',
  responsable_inscripto: 'Responsable Inscripto',
  exento: 'Exento',
};

export const DIRECTORES_ADJUNTOS_AREAS = [
  { id: "adultos", label: "Dirección Adjunta de Adultos / Polivalente", icon: "🏥" },
  { id: "pediatria", label: "Dirección Adjunta de Pediatría / Infantil", icon: "👶" },
  { id: "maternidad", label: "Dirección Adjunta de Maternidad & Neonatología", icon: "🤰" },
  { id: "general", label: "Dirección Médica General / Coordinación", icon: "🛡️" },
];

export const TIPOS_PRESTACION_MAP: Record<TipoPrestacion, string> = {
  guardia: 'Guardias Médicas (Formulario G)',
  extension_horaria: 'Extensión Horaria (Formulario EH)',
  guardia_ordinaria: 'Guardia Ordinaria',
  guardia_critica: 'Guardia Crítica',
  consultorio: 'Consultorios Externos',
  coordinacion: 'Coordinación',
  fortalecimiento: 'Fortalecimiento',
  ufmi: 'UFMI',
  ufi: 'UFI',
  otro: 'Otra Prestación',
};

export const SECTORES_SERVICIO_MAP: Record<SectorServicio, string> = {
  clinica_medica: 'Clínica Médica / Sala',
  pediatria: 'Pediatría',
  uti_adultos: 'Terapia Intensiva Adultos (UTI)',
  utin_neonatologia: 'Terapia Intensiva Pediátrica / Neonatología (UTIN)',
  guardia_emergencias: 'Guardia de Emergencias',
  cirugia_quirofano: 'Cirugía General / Quirófano',
  traumatologia: 'Traumatología y Ortopedia',
  cardiologia: 'Cardiología',
  ginecologia_obstetricia: 'Ginecología y Obstetricia',
  salud_mental: 'Salud Mental / Psicología',
  imagenes: 'Diagnóstico por Imágenes',
  laboratorio: 'Laboratorio / Bioquímica',
  kinesiologia: 'Kinesiología y Rehabilitación',
  otro: 'Otro Sector / Servicio',
};

export const ESTADOS_PRESTACION_CONFIG: Record<
  EstadoPrestacion,
  { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; bgLight: string; textDark: string }
> = {
  borrador: {
    label: 'Borrador',
    color: 'slate',
    badgeVariant: 'outline',
    bgLight: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    textDark: 'text-slate-700 dark:text-slate-300',
  },
  pendiente: {
    label: 'Pendiente',
    color: 'amber',
    badgeVariant: 'outline',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    textDark: 'text-amber-700 dark:text-amber-300',
  },
  en_revision: {
    label: 'En Revisión',
    color: 'sky',
    badgeVariant: 'secondary',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    textDark: 'text-sky-700 dark:text-sky-300',
  },
  visado_adjunto: {
    label: 'Visado Dir. Adjunto',
    color: 'violet',
    badgeVariant: 'secondary',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    textDark: 'text-violet-700 dark:text-violet-300',
  },
  observado: {
    label: 'Observado (Dirección)',
    color: 'rose',
    badgeVariant: 'destructive',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    textDark: 'text-rose-700 dark:text-rose-300',
  },
  observado_tesoreria: {
    label: 'Observado (Tesorería)',
    color: 'amber',
    badgeVariant: 'destructive',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
    textDark: 'text-amber-800 dark:text-amber-200',
  },
  aprobado: {
    label: 'Aprobado',
    color: 'emerald',
    badgeVariant: 'default',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    textDark: 'text-emerald-700 dark:text-emerald-300',
  },
  pagado: {
    label: 'Pagado',
    color: 'indigo',
    badgeVariant: 'default',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    textDark: 'text-indigo-700 dark:text-indigo-300',
  },
};

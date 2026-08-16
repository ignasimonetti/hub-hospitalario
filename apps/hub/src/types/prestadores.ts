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

export type EstadoPrestacion = 'pendiente' | 'en_revision' | 'observado' | 'aprobado' | 'pagado';

export interface PrestadorPerfil {
  id: string;
  user: string;
  cuit: string;
  profession: ProfesionPrestador;
  specialty?: string;
  license_number: string;
  tax_condition: CondicionFiscal;
  cbu_alias?: string;
  phone?: string;
  created: string;
  updated: string;
}

export const MAX_INVOICE_AMOUNT = 800000; // Tope máximo por comprobante / trámite ($800.000)

export interface ConfiguracionModuloPrestadores {
  valor_guardia_ordinaria_habil: number;
  valor_guardia_ordinaria_inhabil: number;
  valor_guardia_critica_habil: number;
  valor_guardia_critica_inhabil: number;
  valor_hora_extension: number;
  tope_maximo_factura: number;
  sectores_habilitados?: string[];
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_CONFIGURACION_PRESTADORES: ConfiguracionModuloPrestadores = {
  valor_guardia_ordinaria_habil: 95000,
  valor_guardia_ordinaria_inhabil: 115000,
  valor_guardia_critica_habil: 130000,
  valor_guardia_critica_inhabil: 160000,
  valor_hora_extension: 18500,
  tope_maximo_factura: 800000,
};

export interface RenglonGuardiaDigital {
  id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  tipo: 'normal' | 'critica';
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
  treasury_observation?: string;
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
  observado: {
    label: 'Observado',
    color: 'rose',
    badgeVariant: 'destructive',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    textDark: 'text-rose-700 dark:text-rose-300',
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

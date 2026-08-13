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
  | 'consultorio'
  | 'certificacion_servicio'
  | 'horas_planta'
  | 'cirugias'
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

export interface PrestacionPresentacion {
  id: string;
  user: string;
  tenant: string;
  period_month: number;
  period_year: number;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  service_type: TipoPrestacion;
  service_days_type: TipoDiasPrestacion;
  service_days_detail?: string;
  conducta_fiscal_due_date: string;
  file_invoice: string;
  file_conducta_fiscal: string;
  file_service_proof: string;
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
  guardia: 'Guardia Médica / Activa',
  consultorio: 'Consultorios Externos',
  certificacion_servicio: 'Certificación de Servicios',
  horas_planta: 'Horas de Planta / Sala',
  cirugias: 'Módulo Quirúrgico / Cirugías',
  otro: 'Otra Prestación Asistencial',
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

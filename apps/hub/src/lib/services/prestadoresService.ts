import { pocketbase } from '@/lib/auth';
import { PrestadorPerfil, PrestacionPresentacion, EventoObservacion } from '@/types/prestadores';

/**
 * Obtiene el perfil de prestador del usuario logueado
 */
export async function getPrestadorPerfil(): Promise<PrestadorPerfil | null> {
  try {
    const user = pocketbase.authStore.model;
    if (!user) return null;

    const record = await pocketbase
      .collection('prestadores_perfiles')
      .getFirstListItem<PrestadorPerfil>(`user = "${user.id}"`, {
        requestKey: null, // Desactiva la autocancelación por re-render de React
      });

    return record;
  } catch (error: any) {
    if (error?.status === 404) {
      return null; // Aún no tiene perfil cargado
    }
    if (error?.isAbort || error?.message?.includes('autocancelled')) {
      return null; // Cancelación benigna por desmontaje de componente
    }
    console.error('Error fetching prestador perfil:', error);
    return null;
  }
}

/**
 * Guarda o actualiza el perfil de prestador (acepta objeto parcial o FormData para adjuntar archivos)
 */
export async function savePrestadorPerfil(
  data: Partial<Omit<PrestadorPerfil, 'id' | 'created' | 'updated' | 'user'>> | FormData
): Promise<PrestadorPerfil> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error('Usuario no autenticado');

  try {
    const existing = await getPrestadorPerfil();

    if (data instanceof FormData) {
      if (!data.has('user')) {
        data.append('user', user.id);
      }
      if (existing) {
        const updated = await pocketbase
          .collection('prestadores_perfiles')
          .update<PrestadorPerfil>(existing.id, data, {
            requestKey: null,
          });
        return updated;
      } else {
        const created = await pocketbase
          .collection('prestadores_perfiles')
          .create<PrestadorPerfil>(data, {
            requestKey: null,
          });
        return created;
      }
    } else {
      if (existing) {
        const updated = await pocketbase
          .collection('prestadores_perfiles')
          .update<PrestadorPerfil>(existing.id, data, {
            requestKey: null,
          });
        return updated;
      } else {
        const created = await pocketbase
          .collection('prestadores_perfiles')
          .create<PrestadorPerfil>(
            {
              ...data,
              user: user.id,
            },
            {
              requestKey: null,
            }
          );
        return created;
      }
    }
  } catch (error: any) {
    console.error('Error saving prestador perfil:', error);
    throw new Error(error?.message || 'Error al guardar el perfil de prestador');
  }
}

/**
 * Genera el próximo número correlativo de trámite con sigla institucional
 * Formato: {SIGLA}-{TIPO}-{AÑO}-{00001} (Ej: CISB-G-2026-00042)
 */
export async function getNextFormNumber(
  serviceType: 'guardia' | 'extension_horaria',
  tenantCode: string = 'CISB'
): Promise<string> {
  const year = new Date().getFullYear();
  const typeCode = serviceType === 'guardia' ? 'G' : 'EH';
  const prefix = `${tenantCode.toUpperCase()}-${typeCode}-${year}`;

  try {
    // Buscar la última presentación creada con este prefijo
    const lastRecords = await pocketbase
      .collection('prestaciones_presentaciones')
      .getList<PrestacionPresentacion>(1, 1, {
        filter: `form_number ~ "${prefix}"`,
        sort: '-created',
        requestKey: null,
      });

    let nextNumber = 1;
    if (lastRecords && lastRecords.items.length > 0) {
      const lastCode = lastRecords.items[0].form_number;
      if (lastCode) {
        const parts = lastCode.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextNumber = lastSeq + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(5, '0');
    return `${prefix}-${paddedNumber}`;
  } catch (error) {
    // Si falla o no existe registro previo, generar con fallback seguro
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-0${randomDigits}`;
  }
}

/**
 * Obtiene las presentaciones del usuario actual para el tenant seleccionado
 */
export async function getMisPrestaciones(tenantId?: string): Promise<PrestacionPresentacion[]> {
  try {
    const user = pocketbase.authStore.model;
    if (!user) return [];

    let filter = `user = "${user.id}"`;
    if (tenantId) {
      filter += ` && tenant = "${tenantId}"`;
    }

    try {
      const records = await pocketbase
        .collection('prestaciones_presentaciones')
        .getFullList<PrestacionPresentacion>({
          filter,
          sort: '-created',
          requestKey: null, // Desactiva la autocancelación por re-render
        });

      return records;
    } catch (innerErr: any) {
      if (innerErr?.isAbort || innerErr?.message?.includes('autocancelled')) return [];
      if (innerErr?.status === 404 || innerErr?.status === 400) return [];

      // Si falla por el filtro de tenant, reintentar solo por usuario
      try {
        const records = await pocketbase
          .collection('prestaciones_presentaciones')
          .getFullList<PrestacionPresentacion>({
            filter: `user = "${user.id}"`,
            sort: '-created',
            requestKey: null,
          });
        return records;
      } catch {
        return [];
      }
    }
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.warn('Prestaciones: colección no disponible aún.');
    return [];
  }
}

/**
 * Envía una nueva presentación de honorarios con archivos PDF
 */
export async function submitPrestacion(
  formData: FormData
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error('Usuario no autenticado');

  formData.append('user', user.id);
  formData.append('status', 'pendiente');
  formData.append('submitted_at', new Date().toISOString());

  try {
    const created = await pocketbase
      .collection('prestaciones_presentaciones')
      .create<PrestacionPresentacion>(formData, {
        expand: 'tenant,user',
      });

    return created;
  } catch (error: any) {
    console.error('Error submitting prestacion:', error);
    throw new Error(error?.message || 'Error al enviar la presentación de honorarios');
  }
}

/**
 * Guarda una presentación en modo borrador (sin número de formulario oficial correlativo)
 */
export async function saveBorradorPrestacion(
  formData: FormData
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error('Usuario no autenticado');

  formData.append('user', user.id);
  formData.append('status', 'borrador');
  formData.append('form_number', ''); // Sin número oficial en borrador

  try {
    const created = await pocketbase
      .collection('prestaciones_presentaciones')
      .create<PrestacionPresentacion>(formData, {
        expand: 'tenant,user',
      });

    return created;
  } catch (error: any) {
    console.error('Error saving borrador prestacion:', error);
    throw new Error(error?.message || 'Error al guardar el borrador');
  }
}

/**
 * Actualiza un borrador existente
 */
export async function updateBorradorPrestacion(
  id: string,
  formData: FormData
): Promise<PrestacionPresentacion> {
  formData.append('status', 'borrador');
  formData.append('form_number', '');

  try {
    const updated = await pocketbase
      .collection('prestaciones_presentaciones')
      .update<PrestacionPresentacion>(id, formData, {
        expand: 'tenant,user',
      });

    return updated;
  } catch (error: any) {
    console.error('Error updating borrador prestacion:', error);
    throw new Error(error?.message || 'Error al actualizar el borrador');
  }
}

/**
 * Reenvía una presentación corregida por el prestador.
 * - Si la observación provino de Tesorería (error fiscal/factura), la presentación retorna a estado "aprobado"
 *   (para liquidación directa en Tesorería) CONSERVANDO todas las firmas de Dirección.
 * - Si la observación fue asistencial (Dir. Adjunto o Coordinador), retorna al circuito de Dirección ("pendiente").
 */
export async function resubmitPrestacion(
  id: string,
  formData: FormData,
  mensajeDescargo?: string
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  const now = new Date().toISOString();

  // Obtener estado y origen actual de la observación
  const current = await pocketbase
    .collection('prestaciones_presentaciones')
    .getOne<PrestacionPresentacion>(id, { requestKey: null });

  const esObservacionTesoreria =
    current.status === 'observado_tesoreria' || current.origen_observacion === 'tesoreria';

  // Si fue observada por Tesorería y ya contaba con firmas de Dirección,
  // la corrección va directo a Tesorería en estado 'aprobado' sin anular las firmas previas.
  const nuevoEstado = esObservacionTesoreria && current.director_approved_at ? 'aprobado' : 'pendiente';

  formData.append('status', nuevoEstado);
  formData.append('submitted_at', now);

  // Construir historial acumulativo
  let historial: EventoObservacion[] = [];
  if (current.historial_observaciones) {
    try {
      historial = typeof current.historial_observaciones === 'string'
        ? JSON.parse(current.historial_observaciones)
        : [...current.historial_observaciones];
    } catch {
      historial = [];
    }
  }

  const nombrePrestador = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Prestador';

  historial.push({
    id: `ev-${Date.now()}`,
    autor_id: user?.id || '',
    autor_nombre: nombrePrestador,
    rol_emisor: 'prestador',
    tipo: 'correccion_reenvio',
    motivo: mensajeDescargo || 'Presentación corregida y reenviada por el prestador.',
    created_at: now,
  });

  formData.append('historial_observaciones', JSON.stringify(historial));

  try {
    const updated = await pocketbase
      .collection('prestaciones_presentaciones')
      .update<PrestacionPresentacion>(id, formData, {
        expand: 'tenant,user',
        requestKey: null,
      });

    return updated;
  } catch (error: any) {
    console.error('Error resubmitting prestacion:', error);
    throw new Error(error?.message || 'Error al reenviar la corrección');
  }
}

/**
 * Elimina una presentación (utilizado para descartar borradores)
 */
export async function deletePrestacion(id: string): Promise<boolean> {
  try {
    await pocketbase.collection('prestaciones_presentaciones').delete(id);
    return true;
  } catch (error: any) {
    console.error('Error deleting prestacion:', error);
    throw new Error(error?.message || 'Error al eliminar el borrador');
  }
}

/**
 * Obtiene la URL completa para previsualizar/descargar un archivo de PocketBase (Presentación)
 */
export function getPresentacionFileUrl(
  record: PrestacionPresentacion,
  filename: string
): string {
  if (!filename) return '';
  const rec = {
    ...record,
    collectionId: record.collectionId || 'pbc_847757850',
    collectionName: record.collectionName || 'prestaciones_presentaciones',
  };
  return pocketbase.files.getURL(rec, filename);
}

export const getPrestacionFileUrl = getPresentacionFileUrl;

/**
 * Obtiene la URL completa para previsualizar/descargar un archivo de PocketBase (Perfil)
 */
export function getPerfilFileUrl(
  record: PrestadorPerfil,
  filename: string
): string {
  if (!filename) return '';
  const rec = {
    ...record,
    collectionId: record.collectionId || 'pbc_326866583',
    collectionName: record.collectionName || 'prestadores_perfiles',
  };
  return pocketbase.files.getURL(rec, filename);
}

/**
 * Obtiene todas las prestaciones del hospital (para Directores, Auditores y Tesorería)
 */
export async function getTodasLasPrestaciones(tenantId?: string): Promise<PrestacionPresentacion[]> {
  try {
    let filter = "";
    if (tenantId) {
      filter = `tenant = "${tenantId}"`;
    }

    const records = await pocketbase
      .collection("prestaciones_presentaciones")
      .getFullList<PrestacionPresentacion>({
        filter: filter || undefined,
        sort: "-created",
        expand: "tenant,user",
        requestKey: null,
      });

    return records;
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes("autocancelled")) return [];
    console.error("Error fetching todas las prestaciones:", error);
    return [];
  }
}

/**
 * Visa una prestación por parte del Director Adjunto (primera firma).
 * La prestación pasa a estado "visado_adjunto", pendiente de aprobación final del Director Coordinador.
 */
export async function visarPrestacionAdjunto(
  id: string,
  metaFirma: string,
  observacion?: string
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  try {
    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(id, {
        status: "visado_adjunto",
        adjunto_approved_by: user.id,
        adjunto_approved_at: now,
        adjunto_signature_meta: metaFirma,
        director_observation: observacion || "",
        reviewed_at: now,
      }, {
        expand: "tenant,user",
        requestKey: null,
      });

    return updated;
  } catch (error: any) {
    console.error("Error visando prestacion por Dir. Adjunto:", error);
    throw new Error(error?.message || "Error al visar la prestación");
  }
}

/**
 * Aprueba y firma digitalmente una prestación por parte del Director Coordinador (firma final).
 * El Director Coordinador puede aprobar directamente (supliendo la firma del Adjunto)
 * o dar la aprobación final a una presentación ya visada por el Adjunto.
 * Principio: "quien puede lo más, puede lo menos".
 */
export async function aprobarPrestacionDirector(
  id: string,
  metaFirma: string,
  observacion?: string
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  try {
    // Obtener la presentación actual para verificar si ya tiene visa del adjunto
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    const updateData: Record<string, any> = {
      status: "aprobado",
      director_approved_by: user.id,
      director_approved_at: now,
      director_signature_meta: metaFirma,
      director_observation: observacion || "",
      reviewed_at: now,
    };

    // Si no tiene visa del adjunto, el Coordinador suple ambas firmas
    if (!current.adjunto_approved_by) {
      updateData.adjunto_approved_by = user.id;
      updateData.adjunto_approved_at = now;
      updateData.adjunto_signature_meta = `${metaFirma} [Suplido por Dir. Coordinador]`;
    }

    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(id, updateData, {
        expand: "tenant,user",
        requestKey: null,
      });

    return updated;
  } catch (error: any) {
    console.error("Error aprobando prestacion por Direccion:", error);
    throw new Error(error?.message || "Error al aprobar la prestación");
  }
}

/**
 * Observa una presentación por parte de la Dirección (Adjunta o Coordinadora)
 */
export async function observarPrestacionDirector(
  id: string,
  motivoObservacion: string,
  rolEmisor: 'director_adjunto' | 'director_coordinador' = 'director_adjunto'
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  const nombreEmisor = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    let historial: EventoObservacion[] = [];
    if (current.historial_observaciones) {
      try {
        historial = typeof current.historial_observaciones === 'string'
          ? JSON.parse(current.historial_observaciones)
          : [...current.historial_observaciones];
      } catch {
        historial = [];
      }
    }

    historial.push({
      id: `ev-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: nombreEmisor,
      rol_emisor: rolEmisor,
      tipo: 'observacion',
      motivo: motivoObservacion,
      created_at: now,
    });

    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(id, {
        status: "observado",
        origen_observacion: rolEmisor,
        director_observation: motivoObservacion,
        treasury_observation: motivoObservacion,
        historial_observaciones: JSON.stringify(historial),
        reviewed_at: now,
      }, {
        expand: "tenant,user",
        requestKey: null,
      });

    return updated;
  } catch (error: any) {
    console.error("Error observando prestacion por Direccion:", error);
    throw new Error(error?.message || "Error al observar la prestación");
  }
}

/**
 * Observa una presentación por parte de Tesorería (errores fiscales / facturas)
 * Al corregir el médico, volverá directo a Tesorería en estado 'aprobado' sin repetir firmas de directores.
 */
export async function observarPrestacionTesoreria(
  id: string,
  motivoObservacion: string
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  const nombreEmisor = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    let historial: EventoObservacion[] = [];
    if (current.historial_observaciones) {
      try {
        historial = typeof current.historial_observaciones === 'string'
          ? JSON.parse(current.historial_observaciones)
          : [...current.historial_observaciones];
      } catch {
        historial = [];
      }
    }

    historial.push({
      id: `ev-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: nombreEmisor,
      rol_emisor: 'tesoreria',
      tipo: 'observacion',
      motivo: motivoObservacion,
      created_at: now,
    });

    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(id, {
        status: "observado_tesoreria",
        origen_observacion: "tesoreria",
        treasury_observation: motivoObservacion,
        historial_observaciones: JSON.stringify(historial),
        reviewed_at: now,
      }, {
        expand: "tenant,user",
        requestKey: null,
      });

    return updated;
  } catch (error: any) {
    console.error("Error observando prestacion por Tesorería:", error);
    throw new Error(error?.message || "Error al observar la prestación por Tesorería");
  }
}

/**
 * Obtiene la nómina de usuarios con rol de Director (Adjunto o Coordinador, excluyendo superadmins puros) para el selector de destino.
 */
export async function getDirectoresDisponibles(tenantId?: string): Promise<{ id: string; nombre: string; email: string; rol?: string }[]> {
  try {
    // Buscar roles de director adjunto y coordinador
    const roles = await pocketbase.collection("hub_roles").getFullList({
      filter: 'slug = "director_adjunto" || slug = "director_coordinador" || slug = "director" || name ~ "Director"',
      requestKey: null,
    });

    if (roles.length === 0) {
      return [];
    }

    const roleIds = roles.map((r) => `role = "${r.id}"`).join(" || ");
    let filter = `(${roleIds})`;
    if (tenantId) {
      filter += ` && (tenant = "${tenantId}" || tenant = "")`;
    }

    const userRoles = await pocketbase.collection("hub_user_roles").getFullList({
      filter: filter,
      expand: "user,role",
      requestKey: null,
    });

    const directoresMap = new Map<string, { id: string; nombre: string; email: string; rol?: string }>();

    for (const ur of userRoles) {
      const u = (ur as any).expand?.user;
      const r = (ur as any).expand?.role;
      if (u && !directoresMap.has(u.id)) {
        const rolLabel = r?.slug === "director_coordinador" ? "Dir. Coordinador" : "Dir. Adjunto";
        directoresMap.set(u.id, {
          id: u.id,
          nombre: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          email: u.email,
          rol: rolLabel,
        });
      }
    }

    return Array.from(directoresMap.values());
  } catch (error: any) {
    console.error("Error fetching directores disponibles:", error);
    return [];
  }
}

// Alias de retrocompatibilidad
export const getDirectoresAdjuntosDisponibles = getDirectoresDisponibles;

/**
 * Reasigna o deriva una presentación a otro Director Adjunto (usado por Director Coordinador)
 */
export async function derivarPrestacionADirectorAdjunto(
  id: string,
  nuevoDirectorId: string,
  observacionDerivacion?: string
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  try {
    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(
        id,
        {
          assigned_director_adjunto_id: nuevoDirectorId,
          status: "pendiente",
          director_observation: observacionDerivacion ? `[Derivado por Dir. Coordinador]: ${observacionDerivacion}` : "",
          reviewed_at: now,
        },
        {
          expand: "tenant,user",
          requestKey: null,
        }
      );

    return updated;
  } catch (error: any) {
    console.error("Error derivando prestación a Director Adjunto:", error);
    throw new Error(error?.message || "Error al derivar la prestación");
  }
}

/**
 * Realiza el visado masivo de múltiples prestaciones por parte de un Director Adjunto
 */
export async function visarMultiplesPrestaciones(
  ids: string[],
  metaFirma: string,
  observacionInterna?: string
): Promise<{ exitosas: number; fallidas: number }> {
  let exitosas = 0;
  let fallidas = 0;

  for (const id of ids) {
    try {
      await visarPrestacionAdjunto(id, metaFirma, observacionInterna);
      exitosas++;
    } catch (err) {
      console.error(`Error visando prestacion ${id}:`, err);
      fallidas++;
    }
  }

  return { exitosas, fallidas };
}

/**
 * Realiza la aprobación y elevación masiva a Tesorería de múltiples prestaciones por parte de la Dirección
 */
export async function aprobarMultiplesPrestaciones(
  ids: string[],
  metaFirma: string,
  observacionInterna?: string
): Promise<{ exitosas: number; fallidas: number }> {
  let exitosas = 0;
  let fallidas = 0;

  for (const id of ids) {
    try {
      await aprobarPrestacionDirector(id, metaFirma, observacionInterna);
      exitosas++;
    } catch (err) {
      console.error(`Error aprobando prestacion ${id}:`, err);
      fallidas++;
    }
  }

  return { exitosas, fallidas };
}

/* ============================================================
   LISTADOS PAGINADOS + KPIs LIVIANOS
   Reemplaza progresivamente a getFullList para escalabilidad.
   ============================================================ */

export type GrupoListadoPrestaciones =
  | "activos" // todo menos aprobado/pagado (incluye borradores)
  | "historial" // aprobado + pagado
  | "borrador"
  | "pendientes" // pendiente, en_revision, visado_adjunto
  | "observadas" // observado, observado_tesoreria
  | "aprobado"
  | "pagado";

export interface PrestacionPageOptions {
  tenantId?: string;
  grupo?: GrupoListadoPrestaciones;
  page?: number; // 1-based
  perPage?: number; // default 25, máx 50
  sort?: string; // ej. "-created", "invoice_amount", "form_number"
  /** Solo directores: búsqueda libre sobre trámite/factura/nombre */
  search?: string;
  servicio?: string;
  periodoMes?: number;
  periodoAnio?: number;
  /** Filtro nominal de Director Adjunto asignado */
  directorId?: string;
}

export interface PrestacionPageResult {
  items: PrestacionPresentacion[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

const PAGE_EMPTY: PrestacionPageResult = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 1,
  perPage: 25,
};

function filtroPorGrupo(grupo?: GrupoListadoPrestaciones): string {
  switch (grupo) {
    case "activos":
      return '(status != "aprobado" && status != "pagado")';
    case "historial":
      return '(status = "aprobado" || status = "pagado")';
    case "borrador":
      return 'status = "borrador"';
    case "pendientes":
      return '(status = "pendiente" || status = "en_revision" || status = "visado_adjunto")';
    case "observadas":
      return '(status = "observado" || status = "observado_tesoreria")';
    case "aprobado":
      return 'status = "aprobado"';
    case "pagado":
      return 'status = "pagado"';
    default:
      return "";
  }
}

/**
 * Listado paginado de las prestaciones del usuario actual.
 * Sustituye a getMisPrestaciones (getFullList) para las vistas de dashboard.
 */
export async function getMisPrestacionesPaginadas(
  opts: PrestacionPageOptions = {}
): Promise<PrestacionPageResult> {
  const user = pocketbase.authStore.model;
  if (!user) return { ...PAGE_EMPTY };

  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 25));

  const parts: string[] = [`user = "${user.id}"`];
  if (opts.tenantId) parts.push(`tenant = "${opts.tenantId}"`);
  const grupoFilter = filtroPorGrupo(opts.grupo);
  if (grupoFilter) parts.push(grupoFilter);
  if (opts.servicio) parts.push(`hospital_service = "${opts.servicio}"`);
  if (opts.periodoMes) parts.push(`period_month = ${opts.periodoMes}`);
  if (opts.periodoAnio) parts.push(`period_year = ${opts.periodoAnio}`);

  try {
    const result = await pocketbase
      .collection("prestaciones_presentaciones")
      .getList<PrestacionPresentacion>(page, perPage, {
        filter: parts.join(" && "),
        sort: opts.sort || "-created",
        requestKey: null,
      });

    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage,
    };
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes("autocancelled")) {
      return { ...PAGE_EMPTY, page, perPage };
    }
    console.error("Error fetching mis prestaciones paginadas:", error);
    return { ...PAGE_EMPTY, page, perPage };
  }
}

/**
 * Listado paginado de todas las prestaciones del tenant (Directores/Auditores).
 * Siempre excluye borradores. Búsqueda y filtros se aplican server-side.
 */
export async function getTodasPrestacionesPaginadas(
  opts: PrestacionPageOptions = {}
): Promise<PrestacionPageResult> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 25));

  const parts: string[] = ['status != "borrador"'];
  if (opts.tenantId) parts.push(`tenant = "${opts.tenantId}"`);

  if (
    opts.grupo &&
    opts.grupo !== "activos" &&
    opts.grupo !== "historial"
  ) {
    const grupoFilter = filtroPorGrupo(opts.grupo);
    if (grupoFilter) parts.push(grupoFilter);
  }

  if (opts.search?.trim()) {
    const q = opts.search.trim().replace(/"/g, '\\"');
    parts.push(
      `(form_number ~ "${q}" || invoice_number ~ "${q}" || user.lastName ~ "${q}" || user.firstName ~ "${q}")`
    );
  }
  if (opts.servicio) parts.push(`hospital_service = "${opts.servicio}"`);
  if (opts.periodoMes) parts.push(`period_month = ${opts.periodoMes}`);
  if (opts.periodoAnio) parts.push(`period_year = ${opts.periodoAnio}`);
  if (opts.directorId)
    parts.push(`director_adjunto_asignado = "${opts.directorId}"`);

  try {
    const result = await pocketbase
      .collection("prestaciones_presentaciones")
      .getList<PrestacionPresentacion>(page, perPage, {
        filter: parts.join(" && "),
        sort: opts.sort || "-created",
        expand: "tenant,user",
        requestKey: null,
      });

    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage,
    };
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes("autocancelled")) {
      return { ...PAGE_EMPTY, page, perPage };
    }
    // Fallback sin búsqueda relacional (por si el backend no filtra por expand)
    if (opts.search?.trim()) {
      try {
        const retryParts = parts.filter((p) => !p.includes("user."));
        const result = await pocketbase
          .collection("prestaciones_presentaciones")
          .getList<PrestacionPresentacion>(page, perPage, {
            filter: retryParts.join(" && "),
            sort: opts.sort || "-created",
            expand: "tenant,user",
            requestKey: null,
          });
        return {
          items: result.items,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          page: result.page,
          perPage,
        };
      } catch {
        return { ...PAGE_EMPTY, page, perPage };
      }
    }
    console.error("Error fetching todas las prestaciones paginadas:", error);
    return { ...PAGE_EMPTY, page, perPage };
  }
}

/* ---------- KPIs livianos (proyección fields) ---------- */

interface KpiProyectadaRow {
  id: string;
  status: string;
  invoice_amount: number;
}

export interface ProyeccionKpisPrestaciones {
  totalRecords: number;
  /** suma de invoice_amount por status */
  sumaPorEstado: Record<string, number>;
  /** conteo por status */
  conteoPorEstado: Record<string, number>;
  /** años con actividad (desc), para filtros de historial */
  anios: number[];
  /** períodos únicos "M/YYYY" (desc), para filtro de dirección */
  periodos: string[];
  /** servicios únicos presentes, para filtro de dirección */
  servicios: string[];
}

async function fetchKpisProyectadas(filter: string): Promise<ProyeccionKpisPrestaciones> {
  const out: ProyeccionKpisPrestaciones = {
    totalRecords: 0,
    sumaPorEstado: {},
    conteoPorEstado: {},
    anios: [],
    periodos: [],
    servicios: [],
  };

  try {
    const records = (await pocketbase
      .collection("prestaciones_presentaciones")
      .getFullList({
        filter,
        sort: "-created",
        fields: "id,status,invoice_amount,period_year,period_month,hospital_service",
        requestKey: null,
      })) as unknown as (KpiProyectadaRow & {
      period_year?: number;
      period_month?: number;
      hospital_service?: string;
    })[];

    out.totalRecords = records.length;
    const aniosSet = new Set<number>();
    const periodosSet = new Set<string>();
    const serviciosSet = new Set<string>();
    for (const r of records) {
      const st = r.status || "?";
      out.sumaPorEstado[st] =
        (out.sumaPorEstado[st] || 0) + (Number(r.invoice_amount) || 0);
      out.conteoPorEstado[st] = (out.conteoPorEstado[st] || 0) + 1;
      if (r.period_year) aniosSet.add(Number(r.period_year));
      if (r.period_month && r.period_year) {
        periodosSet.add(`${r.period_month}/${r.period_year}`);
      }
      if (r.hospital_service) serviciosSet.add(r.hospital_service);
    }
    out.anios = Array.from(aniosSet).sort((a, b) => b - a);
    out.periodos = Array.from(periodosSet).sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return yB * 100 + mB - (yA * 100 + mA);
    });
    out.servicios = Array.from(serviciosSet);
  } catch (error: any) {
    if (!error?.isAbort && !error?.message?.includes("autocancelled")) {
      console.error("Error fetching KPIs proyectados:", error);
    }
  }

  return out;
}

/** KPIs del prestador actual (payload liviano: solo id/status/monto/año) */
export async function getMisKpisLivianos(
  tenantId?: string
): Promise<ProyeccionKpisPrestaciones> {
  const user = pocketbase.authStore.model;
  if (!user)
    return {
      totalRecords: 0,
      sumaPorEstado: {},
      conteoPorEstado: {},
      anios: [],
      periodos: [],
      servicios: [],
    };

  let filter = `user = "${user.id}"`;
  if (tenantId) filter += ` && tenant = "${tenantId}"`;

  try {
    return await fetchKpisProyectadas(filter);
  } catch {
    return await fetchKpisProyectadas(`user = "${user.id}"`);
  }
}

/** KPIs globales del tenant para Dirección (excluye borradores) */
export async function getDireccionKpisLivianos(
  tenantId?: string
): Promise<ProyeccionKpisPrestaciones> {
  let filter = 'status != "borrador"';
  if (tenantId) filter += ` && tenant = "${tenantId}"`;
  return fetchKpisProyectadas(filter);
}

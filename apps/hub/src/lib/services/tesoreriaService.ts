import { pocketbase } from "@/lib/auth";
import {
  PrestacionPresentacion,
  PrestadorPerfil,
  EventoObservacion,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  CONDICIONES_FISCALES_MAP,
} from "@/types/prestadores";
import {
  PrestacionTesoreriaItem,
  LoteTesoreria,
  KpisTesoreriaData,
  RegistrarPagoPayload,
  LiquidarLotePayload,
  CrearLotePayload,
  ObservarFiscalPayload,
  CATEGORIAS_OBSERVACION_FISCAL,
  RegistroLoteBancarioExport,
  OrdenDePagoConfigPayload,
} from "@/types/tesoreria";
import Papa from "papaparse";

const LOCK_TIMEOUT_MINUTES = 15;
const LOTES_STORAGE_KEY = "hub_cisb_tesoreria_lotes";

/**
 * Verifica si un registro está bloqueado activamente por otro empleado
 */
export function isPrestacionBloqueada(
  prestacion: PrestacionPresentacion,
  currentUserId?: string
): { bloqueado: boolean; porUsuario?: string; minutosRestantes?: number } {
  if (!prestacion.treasury_locked_by || !prestacion.treasury_locked_at) {
    return { bloqueado: false };
  }

  // Si el usuario que lo tiene bloqueado es el usuario actual, no está bloqueado para él
  if (currentUserId && prestacion.treasury_locked_by === currentUserId) {
    return { bloqueado: false };
  }

  const lockedTime = new Date(prestacion.treasury_locked_at).getTime();
  const now = new Date().getTime();
  const elapsedMinutes = (now - lockedTime) / (1000 * 60);

  if (elapsedMinutes < LOCK_TIMEOUT_MINUTES) {
    const minutosRestantes = Math.ceil(LOCK_TIMEOUT_MINUTES - elapsedMinutes);
    return {
      bloqueado: true,
      porUsuario: prestacion.treasury_locked_name || "Otro administrativo",
      minutosRestantes,
    };
  }

  return { bloqueado: false };
}

/**
 * Bloquea una prestación para control documental exclusivo de un operador de tesorería
 */
export async function bloquearPrestacionParaRevision(id: string): Promise<boolean> {
  const user = pocketbase.authStore.model;
  if (!user) return false;

  const now = new Date().toISOString();
  const nombreOperador = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    const lockStatus = isPrestacionBloqueada(current, user.id);
    if (lockStatus.bloqueado) {
      throw new Error(
        `El trámite está siendo revisado actualmente por ${lockStatus.porUsuario} (${lockStatus.minutosRestantes} min restantes).`
      );
    }

    await pocketbase
      .collection("prestaciones_presentaciones")
      .update(
        id,
        {
          treasury_locked_by: user.id,
          treasury_locked_name: nombreOperador,
          treasury_locked_at: now,
          treasury_check_status: "en_revision",
        },
        { requestKey: null }
      );

    return true;
  } catch (error: any) {
    console.error("Error bloqueando prestacion:", error);
    throw error;
  }
}

/**
 * Libera el bloqueo de una prestación
 */
export async function liberarBloqueoPrestacion(id: string): Promise<void> {
  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    const prevStatus = current.treasury_check_status === "conformado" ? "conformado" : "pendiente_control";

    await pocketbase
      .collection("prestaciones_presentaciones")
      .update(
        id,
        {
          treasury_locked_by: "",
          treasury_locked_name: "",
          treasury_locked_at: "",
          treasury_check_status: prevStatus,
        },
        { requestKey: null }
      );
  } catch (error) {
    console.error("Error liberando bloqueo de prestación:", error);
  }
}

/**
 * Conforma documentalmente una prestación y registra el desglose manual de retenciones (IIBB, Ganancias, SUSS)
 */
export async function conformarPrestacionTesoreria(
  id: string,
  datosRetencion: {
    retencionIibb: number;
    retencionGanancias: number;
    retencionSuss: number;
    retencionOtras?: number;
    retencionOtrasConcepto?: string;
    retencionMonto: number;
    montoNeto: number;
  }
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  const nombreTesorero = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    let historial: EventoObservacion[] = [];
    if (current.historial_observaciones) {
      try {
        historial = typeof current.historial_observaciones === "string"
          ? JSON.parse(current.historial_observaciones)
          : [...current.historial_observaciones];
      } catch {
        historial = [];
      }
    }

    const retOtras = datosRetencion.retencionOtras || 0;
    const conceptoOtras = datosRetencion.retencionOtrasConcepto ? ` [${datosRetencion.retencionOtrasConcepto}]` : "";

    historial.push({
      id: `ev-conf-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: nombreTesorero,
      rol_emisor: "tesoreria",
      tipo: "observacion",
      motivo: `Trámite conformado por Tesorería. Retenciones: IIBB: $${datosRetencion.retencionIibb.toLocaleString(
        "es-AR"
      )}, Ganancias: $${datosRetencion.retencionGanancias.toLocaleString(
        "es-AR"
      )}, SUSS: $${datosRetencion.retencionSuss.toLocaleString(
        "es-AR"
      )}${retOtras > 0 ? `, Otras: $${retOtras.toLocaleString("es-AR")}${conceptoOtras}` : ""} (Total Retenciones: $${datosRetencion.retencionMonto.toLocaleString(
        "es-AR"
      )}) | Neto BSE: $${datosRetencion.montoNeto.toLocaleString("es-AR")}`,
      created_at: now,
    });

    // Metadata estructurada para resiliencia absoluta
    const metaTag = JSON.stringify({
      tag: "CONFORMADO_METADATA",
      check_status: "conformado",
      retencion_iibb: datosRetencion.retencionIibb,
      retencion_ganancias: datosRetencion.retencionGanancias,
      retencion_suss: datosRetencion.retencionSuss,
      retencion_otras: retOtras,
      retencion_otras_concepto: datosRetencion.retencionOtrasConcepto || "",
      retencion_monto: datosRetencion.retencionMonto,
      monto_neto_liquidable: datosRetencion.montoNeto,
      verified_by: user.id,
      verified_at: now,
      custom_note: current.treasury_observation && !current.treasury_observation.startsWith("{") ? current.treasury_observation : "",
    });

    const updated = await pocketbase
      .collection("prestaciones_presentaciones")
      .update<PrestacionPresentacion>(
        id,
        {
          treasury_check_status: "conformado",
          treasury_verified_by: user.id,
          treasury_verified_at: now,
          retencion_iibb: datosRetencion.retencionIibb,
          retencion_ganancias: datosRetencion.retencionGanancias,
          retencion_suss: datosRetencion.retencionSuss,
          retencion_otras: retOtras,
          retencion_otras_concepto: datosRetencion.retencionOtrasConcepto || "",
          retencion_monto: datosRetencion.retencionMonto,
          monto_neto_liquidable: datosRetencion.montoNeto,
          treasury_observation: metaTag,
          historial_observaciones: JSON.stringify(historial),
          treasury_locked_by: "",
          treasury_locked_name: "",
          treasury_locked_at: "",
        },
        {
          expand: "tenant,user",
          requestKey: null,
        }
      );

    return updated;
  } catch (error: any) {
    console.error("Error conformando prestación por tesorería:", error);
    throw new Error(error?.message || "Error al conformar el trámite");
  }
}

/**
 * Obtiene un mapa de perfiles de prestadores indexados por el ID de usuario
 */
export async function getMapPerfilesPrestadores(): Promise<Map<string, PrestadorPerfil>> {
  const map = new Map<string, PrestadorPerfil>();
  try {
    const records = await pocketbase
      .collection("prestadores_perfiles")
      .getFullList<PrestadorPerfil>({
        requestKey: null,
      });

    for (const record of records) {
      if (record.user) {
        map.set(record.user, record);
      }
    }
  } catch (error: any) {
    if (!error?.isAbort && !error?.message?.includes("autocancelled")) {
      console.error("Error fetching map de perfiles de prestadores:", error);
    }
  }
  return map;
}

/**
 * Obtiene todas las prestaciones relevantes para Tesorería con perfiles vinculados y resiliencia de metadata
 */
export async function getPrestacionesParaTesoreria(
  tenantId?: string
): Promise<PrestacionTesoreriaItem[]> {
  try {
    let filter = "";
    if (tenantId) {
      filter = `tenant = "${tenantId}"`;
    }

    const [records, perfilesMap, lotesGuardados] = await Promise.all([
      pocketbase
        .collection("prestaciones_presentaciones")
        .getFullList<PrestacionPresentacion>({
          filter: filter || undefined,
          sort: "-created",
          expand: "tenant,user",
          requestKey: null,
        }),
      getMapPerfilesPrestadores(),
      getLotesTesoreria(tenantId),
    ]);

    // Mapa auxiliar: prestacionId -> LoteTesoreria
    const prestacionToLoteMap = new Map<string, LoteTesoreria>();
    for (const l of lotesGuardados) {
      if (l.prestaciones_ids && Array.isArray(l.prestaciones_ids)) {
        for (const pId of l.prestaciones_ids) {
          prestacionToLoteMap.set(pId, l);
        }
      }
    }

    const itemsConPerfil: PrestacionTesoreriaItem[] = records.map((rec) => {
      const perfil = rec.user ? perfilesMap.get(rec.user) || null : null;
      let checkStatus = rec.treasury_check_status || "pendiente_control";
      let retIibb = rec.retencion_iibb || 0;
      let retGanancias = rec.retencion_ganancias || 0;
      let retSuss = rec.retencion_suss || 0;
      let retOtras = rec.retencion_otras || 0;
      let retOtrasConcepto = rec.retencion_otras_concepto || "";
      let retTotal = rec.retencion_monto || 0;
      let montoNeto = rec.monto_neto_liquidable !== undefined ? rec.monto_neto_liquidable : (Number(rec.invoice_amount) || 0);

      // Reconstrucción desde metadata si aplica
      if (rec.treasury_observation && typeof rec.treasury_observation === "string" && rec.treasury_observation.startsWith("{")) {
        try {
          const parsed = JSON.parse(rec.treasury_observation);
          if (parsed.tag === "CONFORMADO_METADATA") {
            checkStatus = parsed.check_status || "conformado";
            retIibb = parsed.retencion_iibb || 0;
            retGanancias = parsed.retencion_ganancias || 0;
            retSuss = parsed.retencion_suss || 0;
            retOtras = parsed.retencion_otras || 0;
            retOtrasConcepto = parsed.retencion_otras_concepto || "";
            retTotal = parsed.retencion_monto || 0;
            montoNeto = parsed.monto_neto_liquidable !== undefined ? parsed.monto_neto_liquidable : (Number(rec.invoice_amount) || 0) - retTotal;
          }
        } catch {
          // Ignorar error de parseo
        }
      }

      // Reconstrucción infalible de lote_id desde el mapa de lotes
      const loteAsignado = prestacionToLoteMap.get(rec.id);
      const finalLoteId = rec.lote_id || loteAsignado?.id || "";
      const finalLoteNumero = rec.lote_numero || loteAsignado?.numero_lote || "";
      const finalExpteGde = rec.numero_expediente_gde || loteAsignado?.numero_expediente_gde || "";

      return {
        ...rec,
        treasury_check_status: checkStatus as any,
        retencion_iibb: retIibb,
        retencion_ganancias: retGanancias,
        retencion_suss: retSuss,
        retencion_otras: retOtras,
        retencion_otras_concepto: retOtrasConcepto,
        retencion_monto: retTotal,
        monto_neto_liquidable: montoNeto,
        lote_id: finalLoteId,
        lote_numero: finalLoteNumero,
        numero_expediente_gde: finalExpteGde,
        perfilPrestador: perfil,
      };
    });

    return itemsConPerfil;
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes("autocancelled")) return [];
    console.error("Error fetching prestaciones para tesoreria:", error);
    return [];
  }
}

/**
 * Obtiene la lista de Lotes de Tesorería (persistencia en localStorage y sincronización con PocketBase)
 */
export async function getLotesTesoreria(tenantId?: string): Promise<LoteTesoreria[]> {
  try {
    // 1. Cargar de localStorage
    let localLotes: LoteTesoreria[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOTES_STORAGE_KEY);
      if (stored) {
        try {
          localLotes = JSON.parse(stored);
        } catch {
          localLotes = [];
        }
      }
    }

    // 2. Intentar cargar de PocketBase si la colección existe
    try {
      const records = await pocketbase
        .collection("tesoreria_lotes")
        .getFullList<LoteTesoreria>({
          requestKey: null,
        });

      if (records && records.length > 0) {
        return records;
      }
    } catch {
      // Ignorar si no existe la colección en PB
    }

    return localLotes;
  } catch (error) {
    console.warn("Error leyendo lotes:", error);
    return [];
  }
}

function saveLocalLotes(lotes: LoteTesoreria[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOTES_STORAGE_KEY, JSON.stringify(lotes));
  }
}

/**
 * Crea un nuevo Lote de Tesorería y propaga masivamente el Nº de Expediente GDE a todos los trámites vinculados
 */
export async function crearLoteTesoreria(
  payload: CrearLotePayload,
  prestaciones: PrestacionTesoreriaItem[],
  tenantId?: string
): Promise<LoteTesoreria> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  // ── VALIDACIÓN DE SEGURIDAD: ninguna prestación puede estar en más de un lote ──
  const lotesExistentes = await getLotesTesoreria(tenantId);
  const prestacionesYaEnLote: { prestacionId: string; loteNumero: string }[] = [];

  for (const id of payload.prestacionesIds) {
    // Verificar contra lotes guardados (localStorage / PB)
    const loteContenedor = lotesExistentes.find(
      (l) => l.prestaciones_ids && l.prestaciones_ids.includes(id)
    );
    if (loteContenedor) {
      prestacionesYaEnLote.push({ prestacionId: id, loteNumero: loteContenedor.numero_lote });
      continue;
    }
    // Verificar contra el campo lote_id de la propia prestación
    const prest = prestaciones.find((p) => p.id === id);
    if (prest && prest.lote_id) {
      prestacionesYaEnLote.push({ prestacionId: id, loteNumero: prest.lote_numero || prest.lote_id });
    }
  }

  if (prestacionesYaEnLote.length > 0) {
    const detalle = prestacionesYaEnLote
      .map((x) => `• ${x.prestacionId} → ya en lote ${x.loteNumero}`)
      .join("\n");
    throw new Error(
      `No se puede crear el lote: ${prestacionesYaEnLote.length} prestación(es) ya pertenecen a otro lote.\n${detalle}`
    );
  }
  // ── FIN VALIDACIÓN ──

  const now = new Date().toISOString();
  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  const itemsDelLote = prestaciones.filter((p) => payload.prestacionesIds.includes(p.id));
  const montoBruto = itemsDelLote.reduce((acc, cur) => acc + (Number(cur.invoice_amount) || 0), 0);
  const montoRetenciones = itemsDelLote.reduce(
    (acc, cur) => acc + (Number(cur.retencion_monto) || 0),
    0
  );
  const montoNeto = montoBruto - montoRetenciones;

  const loteId = `LOTE-${Date.now().toString().slice(-6)}`;
  const nuevoLote: LoteTesoreria = {
    id: loteId,
    tenant: tenantId || "",
    numero_lote: payload.numeroLote.toUpperCase(),
    numero_expediente_gde: payload.numeroExpedienteGde.trim(),
    codigo_tramite_gde: "GSGE00055 - Solicitud de Pago",
    descripcion: payload.descripcion.trim(),
    periodo_mes: payload.periodoMes,
    periodo_anio: payload.periodoAnio,
    estado: "en_tramite_gde",
    monto_bruto_total: montoBruto,
    monto_retenciones_total: montoRetenciones,
    monto_neto_total: montoNeto,
    cantidad_prestaciones: itemsDelLote.length,
    created_by: user.id,
    created_by_name: userName,
    created: now,
    updated: now,
    prestaciones_ids: payload.prestacionesIds,
  };

  // 1. Guardar en localStorage
  const currentLotes = await getLotesTesoreria(tenantId);
  // Reemplazar si existiera o agregar al inicio
  const filtered = currentLotes.filter((l) => l.id !== loteId);
  const updatedLotes = [nuevoLote, ...filtered];
  saveLocalLotes(updatedLotes);

  // 2. Intentar guardar en PocketBase si existe la colección
  try {
    await pocketbase.collection("tesoreria_lotes").create(nuevoLote, { requestKey: null });
  } catch (e) {
    // Ignorar si no está creada en PB
  }

  // 3. PROPAGACIÓN MASIVA AUTOMÁTICA a cada prestación
  for (const id of payload.prestacionesIds) {
    try {
      await pocketbase.collection("prestaciones_presentaciones").update(
        id,
        {
          lote_id: loteId,
          lote_numero: payload.numeroLote.toUpperCase(),
          numero_expediente_gde: payload.numeroExpedienteGde.trim(),
          treasury_check_status: "conformado",
        },
        { requestKey: null }
      );
    } catch (err) {
      console.error(`Error vinculando prestación ${id} al lote:`, err);
    }
  }

  return nuevoLote;
}

/**
 * Quita una prestación individual de un Lote y la devuelve al buzón general de conformadas.
 * Solo se permite si el lote está en estado abierto.
 */
export async function quitarPrestacionDeLote(
  prestacionId: string,
  loteId: string,
  tenantId?: string
): Promise<void> {
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (!targetLote) throw new Error("Lote no encontrado");

  if (!ESTADOS_LOTE_ABIERTO.includes(targetLote.estado)) {
    throw new Error(
      `El lote "${targetLote.numero_lote}" está cerrado o liquidado. No se pueden quitar prestaciones sin reabrirlo previamente.`
    );
  }

  // 1. Desvincular en PocketBase
  try {
    await pocketbase.collection("prestaciones_presentaciones").update(
      prestacionId,
      {
        lote_id: "",
        lote_numero: "",
        numero_expediente_gde: "",
      },
      { requestKey: null }
    );
  } catch (err) {
    console.error("Error desvinculando prestacion de lote:", err);
  }

  // 2. Actualizar el Lote en memoria/storage
  targetLote.prestaciones_ids = targetLote.prestaciones_ids.filter((id) => id !== prestacionId);
  targetLote.cantidad_prestaciones = targetLote.prestaciones_ids.length;
  targetLote.updated = new Date().toISOString();
  saveLocalLotes(lotes);
}

/**
 * Estados de lote que permiten agregar/quitar prestaciones ("lote abierto")
 */
export const ESTADOS_LOTE_ABIERTO: string[] = ["borrador", "en_tramite_gde"];

/**
 * Conmuta el estado de apertura/cierre de un lote.
 * Un lote con Orden de Pago / Pago BSE no puede reabrirse jamás.
 */
export async function toggleCierreLoteTesoreria(
  loteId: string,
  tenantId?: string
): Promise<LoteTesoreria> {
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (!targetLote) throw new Error("Lote no encontrado");

  // Si ya fue pagado o tiene liquidación bancaria BSE ejecutada, es irreversible
  if (targetLote.estado === "pagado_bse" || targetLote.comprobante_pago_bse) {
    throw new Error(
      "Este lote ya cuenta con Liquidación / Pago BSE ejecutado y no puede ser modificado."
    );
  }

  const estaAbierto = ESTADOS_LOTE_ABIERTO.includes(targetLote.estado);
  const nuevoEstado = estaAbierto ? "cerrado" : "en_tramite_gde";

  targetLote.estado = nuevoEstado;
  targetLote.updated = new Date().toISOString();

  saveLocalLotes(lotes);

  // Sincronizar en PB si la colección existe
  try {
    await pocketbase.collection("tesoreria_lotes").update(
      targetLote.id,
      { estado: nuevoEstado },
      { requestKey: null }
    );
  } catch {
    // Ignorar si no está en PB
  }

  return targetLote;
}

/**
 * Guarda y consolida la configuración de la Orden de Pago en el Lote (número de OP, resolución, imputación y banco).
 * Cierra automáticamente el lote si estaba abierto.
 */
export async function guardarOrdenDePagoConfigLote(
  loteId: string,
  config: OrdenDePagoConfigPayload,
  tenantId?: string
): Promise<LoteTesoreria> {
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (!targetLote) throw new Error("Lote no encontrado");

  targetLote.numero_orden_pago = config.numero_op;
  targetLote.numero_resolucion = config.numero_resolucion || targetLote.numero_resolucion;
  targetLote.fecha_resolucion = config.fecha_resolucion || targetLote.fecha_resolucion;
  targetLote.op_config = config;
  
  // Cerrar el lote si estaba abierto
  if (ESTADOS_LOTE_ABIERTO.includes(targetLote.estado)) {
    targetLote.estado = "cerrado";
  }

  targetLote.updated = new Date().toISOString();
  saveLocalLotes(lotes);

  try {
    await pocketbase.collection("tesoreria_lotes").update(
      targetLote.id,
      {
        numero_orden_pago: config.numero_op,
        numero_resolucion: config.numero_resolucion || "",
        fecha_resolucion: config.fecha_resolucion || "",
        estado: targetLote.estado,
      },
      { requestKey: null }
    );
  } catch {
    // Ignorar si PB no tiene la colección
  }

  return targetLote;
}

/**
 * Agrega prestaciones conformadas a un Lote ya existente.
 * Solo se permite si el lote está en estado abierto (borrador / en_tramite_gde).
 */
export async function agregarPrestacionesALote(
  loteId: string,
  nuevasPrestacionesIds: string[],
  prestaciones: PrestacionTesoreriaItem[],
  tenantId?: string
): Promise<void> {
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (!targetLote) throw new Error("Lote no encontrado");

  // Validar que el lote esté en estado abierto
  if (!ESTADOS_LOTE_ABIERTO.includes(targetLote.estado)) {
    throw new Error(
      `El lote "${targetLote.numero_lote}" ya no admite prestaciones porque se encuentra en estado "${targetLote.estado}". Solo los lotes en estado Borrador o Expediente GDE Caratulado permiten incorporar prestaciones.`
    );
  }

  // Validar que ninguna de las nuevas prestaciones ya pertenezca a otro lote
  const prestacionesConflicto: { id: string; loteNumero: string }[] = [];
  for (const id of nuevasPrestacionesIds) {
    if (targetLote.prestaciones_ids.includes(id)) continue; // ya está en este lote, ok
    const otroLote = lotes.find(
      (l) => l.id !== loteId && l.prestaciones_ids && l.prestaciones_ids.includes(id)
    );
    if (otroLote) {
      prestacionesConflicto.push({ id, loteNumero: otroLote.numero_lote });
    }
  }
  if (prestacionesConflicto.length > 0) {
    const detalle = prestacionesConflicto
      .map((x) => `• ${x.id} → ya en lote ${x.loteNumero}`)
      .join("\n");
    throw new Error(
      `No se pueden agregar: ${prestacionesConflicto.length} prestación(es) ya pertenecen a otro lote.\n${detalle}`
    );
  }

  const unicosIds = Array.from(new Set([...targetLote.prestaciones_ids, ...nuevasPrestacionesIds]));
  targetLote.prestaciones_ids = unicosIds;
  targetLote.cantidad_prestaciones = unicosIds.length;

  const items = prestaciones.filter((p) => unicosIds.includes(p.id));
  const montoBruto = items.reduce((acc, cur) => acc + (Number(cur.invoice_amount) || 0), 0);
  const montoRet = items.reduce((acc, cur) => acc + (Number(cur.retencion_monto) || 0), 0);
  targetLote.monto_bruto_total = montoBruto;
  targetLote.monto_retenciones_total = montoRet;
  targetLote.monto_neto_total = montoBruto - montoRet;
  targetLote.updated = new Date().toISOString();

  saveLocalLotes(lotes);

  // Propagar a las prestaciones añadidas
  for (const id of nuevasPrestacionesIds) {
    try {
      await pocketbase.collection("prestaciones_presentaciones").update(
        id,
        {
          lote_id: targetLote.id,
          lote_numero: targetLote.numero_lote,
          numero_expediente_gde: targetLote.numero_expediente_gde || "",
        },
        { requestKey: null }
      );
    } catch (err) {
      console.error(`Error agregando prestacion ${id} a lote ${loteId}:`, err);
    }
  }
}

/**
 * Elimina un Lote y desvincula todas sus prestaciones
 */
export async function eliminarLoteTesoreria(
  loteId: string,
  tenantId?: string
): Promise<void> {
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (targetLote) {
    for (const id of targetLote.prestaciones_ids) {
      try {
        await pocketbase.collection("prestaciones_presentaciones").update(
          id,
          {
            lote_id: "",
            lote_numero: "",
            numero_expediente_gde: "",
          },
          { requestKey: null }
        );
      } catch (e) {
        // Ignorar
      }
    }
  }

  const updated = lotes.filter((l) => l.id !== loteId);
  saveLocalLotes(updated);
}

/**
 * Actualiza masivamente el número de resolución y estado de un lote y sus prestaciones
 */
export async function actualizarResolucionLote(
  loteId: string,
  prestacionesIds: string[],
  datosResolucion: {
    numeroResolucion: string;
    fechaResolucion: string;
  },
  tenantId?: string
): Promise<void> {
  const now = new Date().toISOString();
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (targetLote) {
    targetLote.numero_resolucion = datosResolucion.numeroResolucion;
    targetLote.fecha_resolucion = datosResolucion.fechaResolucion;
    targetLote.estado = "autorizado_resolucion";
    targetLote.updated = now;
    saveLocalLotes(lotes);
  }

  // Actualizar historial en las prestaciones
  for (const id of prestacionesIds) {
    try {
      await pocketbase.collection("prestaciones_presentaciones").update(
        id,
        {
          treasury_observation: `[Resolución ${datosResolucion.numeroResolucion}] Pago autorizado por Despacho.`,
        },
        { requestKey: null }
      );
    } catch (err) {
      console.error(`Error actualizando prestacion ${id} con resolución:`, err);
    }
  }
}

/**
 * Registra la liquidación / pago individual de una prestación
 */
export async function registrarPagoLiquidacion(
  id: string,
  payload: RegistrarPagoPayload
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  const nombreTesorero = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    let historial: EventoObservacion[] = [];
    if (current.historial_observaciones) {
      try {
        historial = typeof current.historial_observaciones === "string"
          ? JSON.parse(current.historial_observaciones)
          : [...current.historial_observaciones];
      } catch {
        historial = [];
      }
    }

    historial.push({
      id: `ev-pay-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: nombreTesorero,
      rol_emisor: "tesoreria",
      tipo: "observacion",
      motivo: `Pago / Liquidación registrada. Comprobante Nº ${payload.receiptNumber}${
        payload.notes ? ` - Detalle: ${payload.notes}` : ""
      }`,
      created_at: now,
    });

    if (payload.fileProof) {
      const formData = new FormData();
      formData.append("status", "pagado");
      formData.append("paid_at", payload.paymentDate || now.split("T")[0]);
      formData.append("treasury_paid_at", now);
      formData.append("treasury_receipt_number", payload.receiptNumber);
      if (payload.notes) {
        formData.append("treasury_observation", payload.notes);
      }
      formData.append("historial_observaciones", JSON.stringify(historial));
      formData.append("file_service_proof", payload.fileProof);

      const updated = await pocketbase
        .collection("prestaciones_presentaciones")
        .update<PrestacionPresentacion>(id, formData, {
          expand: "tenant,user",
          requestKey: null,
        });

      return updated;
    } else {
      const updated = await pocketbase
        .collection("prestaciones_presentaciones")
        .update<PrestacionPresentacion>(
          id,
          {
            status: "pagado",
            paid_at: payload.paymentDate || now.split("T")[0],
            treasury_paid_at: now,
            treasury_receipt_number: payload.receiptNumber,
            treasury_observation: payload.notes || current.treasury_observation || "",
            historial_observaciones: JSON.stringify(historial),
          },
          {
            expand: "tenant,user",
            requestKey: null,
          }
        );

      return updated;
    }
  } catch (error: any) {
    console.error("Error registrando pago en tesorería:", error);
    throw new Error(error?.message || "Error al registrar la liquidación de pago");
  }
}

/**
 * Liquida en lote múltiple
 */
export async function liquidarLotePrestaciones(
  ids: string[],
  payload: LiquidarLotePayload,
  loteId?: string,
  tenantId?: string
): Promise<{ exitosas: number; fallidas: number }> {
  let exitosas = 0;
  let fallidas = 0;

  for (const id of ids) {
    try {
      await registrarPagoLiquidacion(id, {
        receiptNumber: payload.batchReceiptNumber,
        paymentDate: payload.paymentDate,
        notes: payload.notes
          ? `[Lote ${payload.batchReceiptNumber}] ${payload.notes}`
          : `[Lote ${payload.batchReceiptNumber}]`,
      });
      exitosas++;
    } catch (err) {
      console.error(`Error liquidando presentación ${id} en lote:`, err);
      fallidas++;
    }
  }

  // Actualizar estado del lote si fue provisto
  if (loteId) {
    const lotes = await getLotesTesoreria(tenantId);
    const target = lotes.find((l) => l.id === loteId);
    if (target) {
      target.estado = "pagado_bse";
      target.comprobante_pago_bse = payload.batchReceiptNumber;
      target.fecha_pago_bse = payload.paymentDate || new Date().toISOString().split("T")[0];
      target.updated = new Date().toISOString();
      saveLocalLotes(lotes);

      try {
        await pocketbase.collection("tesoreria_lotes").update(
          target.id,
          {
            estado: "pagado_bse",
            comprobante_pago_bse: payload.batchReceiptNumber,
            fecha_pago_bse: payload.paymentDate || new Date().toISOString().split("T")[0],
          },
          { requestKey: null }
        );
      } catch {
        // Ignorar si PB no tiene la colección
      }
    }
  }

  return { exitosas, fallidas };
}

/**
 * Observa un comprobante fiscal / ARCA devolviendo al prestador sin anular firmas asistenciales
 */
export async function observarComprobanteFiscal(
  id: string,
  payload: ObservarFiscalPayload
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error("Usuario no autenticado");

  const now = new Date().toISOString();
  const nombreTesorero = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  const categoriaObj = CATEGORIAS_OBSERVACION_FISCAL.find((c) => c.id === payload.categoria);
  const categoriaTitulo = categoriaObj ? categoriaObj.label : "Inconsistencia Fiscal";
  const motivoCompleto = `[${categoriaTitulo}] ${payload.motivoDetallado}`.trim();

  try {
    const current = await pocketbase
      .collection("prestaciones_presentaciones")
      .getOne<PrestacionPresentacion>(id, { requestKey: null });

    let historial: EventoObservacion[] = [];
    if (current.historial_observaciones) {
      try {
        historial = typeof current.historial_observaciones === "string"
          ? JSON.parse(current.historial_observaciones)
          : [...current.historial_observaciones];
      } catch {
        historial = [];
      }
    }

    historial.push({
      id: `ev-obs-tax-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: nombreTesorero,
      rol_emisor: "tesoreria",
      tipo: "observacion",
      motivo: motivoCompleto,
      created_at: now,
    });

    let updated: PrestacionPresentacion;
    try {
      updated = await pocketbase
        .collection("prestaciones_presentaciones")
        .update<PrestacionPresentacion>(
          id,
          {
            status: "observado_tesoreria",
            origen_observacion: "tesoreria",
            treasury_observation: motivoCompleto,
            treasury_check_status: "observado_fiscal",
            treasury_locked_by: "",
            treasury_locked_name: "",
            treasury_locked_at: "",
            historial_observaciones: JSON.stringify(historial),
            reviewed_at: now,
          },
          {
            expand: "tenant,user",
            requestKey: null,
          }
        );
    } catch (updateErr: any) {
      // Fallback: Si fallan campos auxiliares en PB, actualizar los campos core
      console.warn("Fallback update en observarComprobanteFiscal:", updateErr?.message);
      updated = await pocketbase
        .collection("prestaciones_presentaciones")
        .update<PrestacionPresentacion>(
          id,
          {
            status: "observado_tesoreria",
            origen_observacion: "tesoreria",
            treasury_observation: motivoCompleto,
            historial_observaciones: JSON.stringify(historial),
            reviewed_at: now,
          },
          {
            expand: "tenant,user",
            requestKey: null,
          }
        );
    }

    return updated;
  } catch (error: any) {
    console.error("Error al observar comprobante fiscal por Tesorería:", error);
    throw new Error(error?.message || "Error al emitir la observación fiscal");
  }
}

/**
 * Calcula los KPIs y métricas de Tesorería a partir de la lista de prestaciones
 */
export function calcularKpisTesoreria(
  prestaciones: PrestacionTesoreriaItem[],
  filtroMes?: number,
  filtroAnio?: number
): KpisTesoreriaData {
  let items = prestaciones;
  if (filtroMes && filtroMes > 0) {
    items = items.filter((p) => p.period_month === filtroMes);
  }
  if (filtroAnio && filtroAnio > 0) {
    items = items.filter((p) => p.period_year === filtroAnio);
  }

  let totalLiquidadoMonto = 0;
  let totalLiquidadoCantidad = 0;
  let totalPendienteMonto = 0;
  let totalPendienteCantidad = 0;
  let totalObservadoMonto = 0;
  let totalObservadoCantidad = 0;
  let totalConformadoMonto = 0;
  let totalConformadoCantidad = 0;

  const desgloseMap = new Map<
    string,
    {
      servicioKey: string;
      servicioLabel: string;
      montoLiquidado: number;
      montoPendiente: number;
      montoTotal: number;
      cantidadPrestaciones: number;
    }
  >();

  for (const item of items) {
    const monto = Number(item.invoice_amount) || 0;
    const srvKey = (item.hospital_service as string) || "otro";
    const srvLabel =
      SECTORES_SERVICIO_MAP[srvKey as SectorServicio] ||
      (srvKey ? srvKey.replace(/_/g, " ") : "General");

    if (!desgloseMap.has(srvKey)) {
      desgloseMap.set(srvKey, {
        servicioKey: srvKey,
        servicioLabel: srvLabel,
        montoLiquidado: 0,
        montoPendiente: 0,
        montoTotal: 0,
        cantidadPrestaciones: 0,
      });
    }

    const srvData = desgloseMap.get(srvKey)!;
    srvData.montoTotal += monto;
    srvData.cantidadPrestaciones += 1;

    if (item.status === "pagado") {
      totalLiquidadoMonto += monto;
      totalLiquidadoCantidad += 1;
      srvData.montoLiquidado += monto;
    } else if (item.status === "aprobado") {
      totalPendienteMonto += monto;
      totalPendienteCantidad += 1;
      srvData.montoPendiente += monto;

      if (item.treasury_check_status === "conformado") {
        totalConformadoMonto += monto;
        totalConformadoCantidad += 1;
      }
    } else if (item.status === "observado_tesoreria" || item.status === "observado") {
      totalObservadoMonto += monto;
      totalObservadoCantidad += 1;
    }
  }

  const granTotal = totalLiquidadoMonto + totalPendienteMonto;
  const desglosePorServicio = Array.from(desgloseMap.values())
    .map((s) => ({
      ...s,
      porcentajeDelTotal: granTotal > 0 ? (s.montoTotal / granTotal) * 100 : 0,
    }))
    .sort((a, b) => b.montoTotal - a.montoTotal);

  return {
    totalLiquidadoMonto,
    totalLiquidadoCantidad,
    totalPendienteMonto,
    totalPendienteCantidad,
    totalObservadoMonto,
    totalObservadoCantidad,
    totalConformadoMonto,
    totalConformadoCantidad,
    desglosePorServicio,
  };
}

/**
 * Convierte un importe numérico a su representación en texto (pesos argentinos).
 */
function importeEnLetras(monto: number): string {
  const unidades = [
    "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE",
    "DIECIOCHO", "DIECINUEVE", "VEINTE",
  ];
  const decenas = [
    "", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
  ];
  const centenas = [
    "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
    "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
  ];

  const parteEntera = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - parteEntera) * 100);

  function convertirGrupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    if (n <= 20) return unidades[n];
    if (n < 30) return "VEINTI" + unidades[n - 20];

    const d = Math.floor(n / 10);
    const u = n % 10;
    if (n < 100) return decenas[d] + (u > 0 ? " Y " + unidades[u] : "");

    const c = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[c] + (resto > 0 ? " " + convertirGrupo(resto) : "");
  }

  if (parteEntera === 0) return `CERO CON ${String(centavos).padStart(2, "0")}/100`;

  let resultado = "";
  const millones = Math.floor(parteEntera / 1000000);
  const miles = Math.floor((parteEntera % 1000000) / 1000);
  const cientos = parteEntera % 1000;

  if (millones > 0) {
    resultado += (millones === 1 ? "UN MILLON" : convertirGrupo(millones) + " MILLONES") + " ";
  }
  if (miles > 0) {
    resultado += (miles === 1 ? "MIL" : convertirGrupo(miles) + " MIL") + " ";
  }
  if (cientos > 0) {
    resultado += convertirGrupo(cientos);
  }

  return resultado.trim() + ` CON ${String(centavos).padStart(2, "0")}/100`;
}

/**
 * Genera la Orden de Pago Global en formato HTML, replicando el formato oficial del CISB.
 * Incluye el logo institucional oficial del CISB, datos de imputación presupuestaria,
 * cuenta bancaria y nómina consolidada de beneficiarios con desglose de retenciones.
 */
export function generarOrdenDePagoHTML(
  lote: LoteTesoreria,
  prestaciones: PrestacionTesoreriaItem[],
  configParam?: OrdenDePagoConfigPayload,
  hospitalName: string = 'Centro Integral de Salud La Banda - Dr. Ricardo "Pololo" Abdala'
): string {
  const cfg = configParam || lote.op_config || {
    numero_op: lote.numero_orden_pago || "S/N",
    anio_op: lote.periodo_anio || new Date().getFullYear(),
    expediente_gde: lote.numero_expediente_gde || "A CARATULAR",
    numero_resolucion: lote.numero_resolucion || "PENDIENTE",
    jurisdiccion: "63",
    programa: "11 - PREVENCION, PROMOCION, PROTECCION, RECUPERACION Y REHABILITACION DE LA SALUD",
    actividad: "ACT 1",
    partida: "PART 341",
    fuente_financiamiento: "REMESAS DEL TESORO",
    banco_nombre: "BSE - CUENTA CORRIENTE",
    cuenta_bancaria: "1255424/86",
  };

  const numeroOP = cfg.numero_op || lote.numero_orden_pago || "S/N";
  const anio = cfg.anio_op || lote.periodo_anio || new Date().getFullYear();
  const expedienteGDE = cfg.expediente_gde || lote.numero_expediente_gde || "A CARATULAR";
  const resolucionNum = cfg.numero_resolucion || lote.numero_resolucion || "PENDIENTE";
  const jurisdiccion = cfg.jurisdiccion || "63";
  const programa = cfg.programa || "11 - PREVENCION, PROMOCION, PROTECCION, RECUPERACION Y REHABILITACION DE LA SALUD";
  const actividad = cfg.actividad || "ACT 1";
  const partida = cfg.partida || "PART 341";
  const fuenteFinanciamiento = cfg.fuente_financiamiento || "REMESAS DEL TESORO";
  const bancoNombre = cfg.banco_nombre || "BSE - CUENTA CORRIENTE";
  const cuentaBancaria = cfg.cuenta_bancaria || "1255424/86";

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);

  const hoy = new Date();
  const fechaEmision = hoy.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Cálculos totales
  let totalBruto = 0;
  let totalRetIIBB = 0;
  let totalRetGanancias = 0;
  let totalRetSUSS = 0;
  let totalRetOtras = 0;

  const beneficiarios = prestaciones.map((p) => {
    const user = p.expand?.user;
    const nombre = user
      ? `${user.lastName || ""} ${user.firstName || ""}`.trim().toUpperCase() || user.email.toUpperCase()
      : "PRESTADOR ASISTENCIAL";

    const cuit = p.perfilPrestador?.cuit || "Sin CUIT";
    const cbuAlias = p.perfilPrestador?.cbu_alias || "Sin CBU/Alias";
    const montoBruto = Number(p.invoice_amount) || 0;
    const retIIBB = Number(p.retencion_iibb) || 0;
    const retGanancias = Number(p.retencion_ganancias) || 0;
    const retSUSS = Number(p.retencion_suss) || 0;
    const retOtras = Number(p.retencion_otras) || 0;
    const retTotal = Number(p.retencion_monto) || retIIBB + retGanancias + retSUSS + retOtras;
    const montoNeto =
      p.monto_neto_liquidable !== undefined ? Number(p.monto_neto_liquidable) : montoBruto - retTotal;

    totalBruto += montoBruto;
    totalRetIIBB += retIIBB;
    totalRetGanancias += retGanancias;
    totalRetSUSS += retSUSS;
    totalRetOtras += retOtras;

    return { nombre, cuit, cbuAlias, montoBruto, retIIBB, retGanancias, retSUSS, retOtras, retTotal, montoNeto, factura: p.invoice_number || "S/N" };
  });

  const totalRetenciones = totalRetIIBB + totalRetGanancias + totalRetSUSS + totalRetOtras;
  const totalNeto = totalBruto - totalRetenciones;

  const filasBeneficiarios = beneficiarios
    .map((b) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; font-size: 10px; font-weight: 600;">${b.nombre}</td>
        <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; text-align: center;">${b.cuit}</td>
        <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; text-align: center;">${b.factura}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px;">${formatMoney(b.montoBruto)}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px; color: #dc2626;">${b.retIIBB > 0 ? `-${formatMoney(b.retIIBB)}` : "-"}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px; color: #dc2626;">${b.retGanancias > 0 ? `-${formatMoney(b.retGanancias)}` : "-"}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px; color: #dc2626;">${b.retSUSS > 0 ? `-${formatMoney(b.retSUSS)}` : "-"}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px; color: #dc2626;">${b.retOtras > 0 ? `-${formatMoney(b.retOtras)}` : "-"}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10px; font-weight: 700; color: #b91c1c;">${b.retTotal > 0 ? `-${formatMoney(b.retTotal)}` : "-"}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: right; font-size: 10.5px; font-weight: 800; color: #047857;">${formatMoney(b.montoNeto)}</td>
      </tr>
    `)
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Orden de Pago ${numeroOP} - ${anio} - CISB</title>
    <style>
      * { box-sizing: border-box; }
      @page {
        size: A4 landscape;
        margin: 10mm 12mm;
      }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 15mm 15mm; color: #0f172a; line-height: 1.3; font-size: 11px; background: #fff; }
      
      .top-branding { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #08487A; padding-bottom: 10px; margin-bottom: 10px; }
      .logo-box { display: flex; align-items: center; gap: 12px; }
      .logo-img { height: 48px; width: auto; object-fit: contain; }
      .institution-text { text-align: left; }
      .institution-name { font-size: 13px; font-weight: 800; color: #08487A; text-transform: uppercase; letter-spacing: 0.5px; }
      .institution-sub { font-size: 9.5px; font-weight: 600; color: #475569; text-transform: uppercase; }
      .header-area { font-size: 12px; font-weight: 800; color: #08487A; text-transform: uppercase; letter-spacing: 1px; text-align: right; }

      .op-title-row { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 10px; }
      .op-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #08487A; }
      .op-number { font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a; }

      .meta-grid { display: grid; grid-template-columns: 130px 1fr 120px 1fr; gap: 3px 10px; font-size: 10px; margin-bottom: 10px; background: #fafafa; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; }
      .meta-label { font-weight: 700; color: #334155; }
      .meta-value { font-family: monospace; color: #0f172a; }

      .legal-text { font-size: 9.5px; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 6px 10px; background-color: #f8fafc; text-align: center; margin: 8px 0; letter-spacing: 0.3px; line-height: 1.3; font-weight: 600; }
      
      .importe-box { background-color: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 8px 12px; margin: 8px 0 12px 0; display: flex; justify-content: space-between; align-items: center; }
      .importe-left { flex: 1; }
      .importe-label { font-size: 10px; font-weight: 800; color: #15803d; text-transform: uppercase; }
      .importe-valor { font-size: 18px; font-weight: 900; font-family: monospace; color: #0f172a; }
      .importe-letras { font-size: 9.5px; font-style: italic; margin-top: 1px; color: #334155; font-weight: 600; }

      table.detail { width: 100%; border-collapse: collapse; margin-top: 6px; }
      table.detail th { background-color: #f1f5f9; border-bottom: 2px solid #0f172a; border-top: 1px solid #cbd5e1; padding: 6px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2px; }
      table.detail .total-row td { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 10px; padding: 6px 6px; background-color: #f8fafc; }
      
      .section-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #08487A; margin: 10px 0 4px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }

      .bank-info { background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; padding: 6px 10px; margin: 10px 0; font-size: 10px; display: flex; justify-content: space-between; align-items: center; }
      
      .footer-date { text-align: right; font-size: 10px; margin-top: 12px; color: #475569; font-weight: 600; }
      .footer-sign { margin-top: 35px; display: flex; justify-content: space-between; text-align: center; font-size: 9px; }
      .sign-box { border-top: 1px solid #94a3b8; width: 170px; padding-top: 4px; }

      @media print {
        body { margin: 0; padding: 4mm 6mm; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 12px; text-align: right;">
      <button onclick="window.print()" style="padding: 7px 14px; background-color: #08487A; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer;">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>

    <!-- Encabezado con Logo Institucional Oficial del CISB -->
    <div class="top-branding">
      <div class="logo-box">
        <img src="/assets/cisb.png" alt="Logo CISB" class="logo-img" onerror="this.style.display='none'" />
        <div class="institution-text">
          <div class="institution-name">Centro Integral de Salud La Banda</div>
          <div class="institution-sub">Dr. Ricardo "Pololo" Abdala • Ministerio de Salud • Sgo. del Estero</div>
        </div>
      </div>
      <div class="header-area">
        Área Tesorería
      </div>
    </div>

    <div class="op-title-row">
      <div class="op-title">ORDEN DE PAGO GLOBAL</div>
      <div>
        <span style="font-size: 10.5px; font-weight: bold; color: #475569;">N° </span>
        <span class="op-number">${numeroOP}</span>
        &nbsp;&nbsp;
        <span style="font-size: 10.5px; font-weight: bold; color: #475569;">AÑO: </span>
        <span style="font-size: 13px; font-weight: 800; font-family: monospace;">${anio}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-label">EXPEDIENTE GDE:</div>
      <div class="meta-value">${expedienteGDE}</div>

      <div class="meta-label">RESOLUCIÓN N°:</div>
      <div class="meta-value">${resolucionNum}</div>

      <div class="meta-label">JURISDICCIÓN:</div>
      <div class="meta-value">${jurisdiccion}</div>

      <div class="meta-label">CÓDIGO DE PAGO:</div>
      <div class="meta-value">${actividad} &nbsp;/&nbsp; ${partida}</div>

      <div class="meta-label">PROGRAMA:</div>
      <div class="meta-value" style="grid-column: span 3;">${programa}</div>

      <div class="meta-label">LOTE REFERENCIA:</div>
      <div class="meta-value" style="grid-column: span 3;">${lote.numero_lote} — ${lote.descripcion}</div>
    </div>

    <div class="legal-text">
      Cumplidos los trámites legales y reglamentarios sobre ejecución del presupuesto, se procede al pago de:
    </div>

    <div class="importe-box">
      <div class="importe-left">
        <div class="importe-label">El Importe Total Bruto a Liquidar:</div>
        <div class="importe-valor">${formatMoney(totalBruto)}</div>
        <div class="importe-letras">SON PESOS: ${importeEnLetras(totalBruto)}</div>
      </div>
    </div>

    <!-- Matriz Única Integral de Liquidación y Retenciones -->
    <div class="section-title">Matriz Consolidada de Liquidación y Retenciones (${beneficiarios.length} Prestadores)</div>
    <table class="detail">
      <thead>
        <tr>
          <th style="text-align: left;">Beneficiario / Profesional</th>
          <th style="text-align: center; width: 85px;">CUIT</th>
          <th style="text-align: center; width: 75px;">Factura</th>
          <th style="text-align: right; width: 80px;">Bruto</th>
          <th style="text-align: right; width: 70px;">Ret. IIBB</th>
          <th style="text-align: right; width: 70px;">Ret. Gan.</th>
          <th style="text-align: right; width: 70px;">Ret. SUSS</th>
          <th style="text-align: right; width: 70px;">Otras Ret.</th>
          <th style="text-align: right; width: 80px;">Total Ret.</th>
          <th style="text-align: right; width: 90px;">Neto a Pagar</th>
        </tr>
      </thead>
      <tbody>
        ${filasBeneficiarios}
        <tr class="total-row">
          <td colspan="3" style="text-align: right; text-transform: uppercase;">TOTALES CONSOLIDADOS:</td>
          <td style="text-align: right; font-family: monospace;">${formatMoney(totalBruto)}</td>
          <td style="text-align: right; font-family: monospace; color: #dc2626;">${totalRetIIBB > 0 ? `-${formatMoney(totalRetIIBB)}` : "-"}</td>
          <td style="text-align: right; font-family: monospace; color: #dc2626;">${totalRetGanancias > 0 ? `-${formatMoney(totalRetGanancias)}` : "-"}</td>
          <td style="text-align: right; font-family: monospace; color: #dc2626;">${totalRetSUSS > 0 ? `-${formatMoney(totalRetSUSS)}` : "-"}</td>
          <td style="text-align: right; font-family: monospace; color: #dc2626;">${totalRetOtras > 0 ? `-${formatMoney(totalRetOtras)}` : "-"}</td>
          <td style="text-align: right; font-family: monospace; color: #b91c1c; font-weight: 800;">${totalRetenciones > 0 ? `-${formatMoney(totalRetenciones)}` : "-"}</td>
          <td style="text-align: right; font-family: monospace; color: #047857; font-weight: 800;">${formatMoney(totalNeto)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Datos Bancarios e Imputación de Fondos -->
    <div class="bank-info">
      <div>
        <strong>CUENTA BANCARIA DEBITADA:</strong> ${bancoNombre} &nbsp; 
        <span style="font-family: monospace; font-weight: bold; color: #08487A;">N° ${cuentaBancaria}</span>
      </div>
      <div>
        <strong>FUENTE DE FINANCIAMIENTO:</strong> ${fuenteFinanciamiento}
      </div>
    </div>

    <div class="footer-date">
      Santiago del Estero — La Banda, ${fechaEmision}
    </div>
  </body>
  </html>
  `;
}

/**
 * Genera la Planilla Oficial de Resumen de Lote para Expediente GDE (Anexo I)
 * Formato fiel al modelo analógico oficial del CISB
 */
export function generarPlanillaResumenLoteHTML(
  tituloLote: string,
  expedienteGde: string,
  prestaciones: PrestacionTesoreriaItem[],
  hospitalName: string = 'Centro Integral de Salud La Banda - Dr. Ricardo "Pololo" Abdala'
): string {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  let totalGeneralBruto = 0;
  let totalGeneralNeto = 0;

  const filasHTML = prestaciones
    .map((p) => {
      const user = p.expand?.user;
      const nombreCompleto = user
        ? `${user.lastName || ""} ${user.firstName || ""}`.trim().toUpperCase() || user.email.toUpperCase()
        : "PRESTADOR ASISTENCIAL";

      const montoBruto = Number(p.invoice_amount) || 0;
      const retencion = Number(p.retencion_monto) || 0;
      const montoNeto = p.monto_neto_liquidable !== undefined ? p.monto_neto_liquidable : montoBruto - retencion;

      totalGeneralBruto += montoBruto;
      totalGeneralNeto += montoNeto;

      const numExpte = p.numero_expediente_gde || p.form_number || p.id.slice(0, 8);
      const comprobante = p.invoice_number || "S/N";

      return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; font-weight: bold; text-align: left;">${nombreCompleto}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: left;">${numExpte}</td>
        <td style="padding: 6px 8px; font-family: monospace; text-align: left;">${comprobante}</td>
        <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; text-align: right;">${formatMoney(
          montoBruto
        )}</td>
      </tr>
    `;
    })
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Planilla Resumen Lote GDE - CISB</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.3; }
      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
      .hospital-name { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #334155; }
      .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px; }
      .meta-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; display: flex; justify-content: space-between; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #0f172a; padding: 8px; font-size: 11px; text-transform: uppercase; }
      .total-row { background-color: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: bold; font-size: 12px; }
      .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; text-align: center; }
      .sign-box { border-top: 1px solid #94a3b8; width: 220px; padding-top: 4px; }
      @media print {
        body { margin: 10mm; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
      <button onclick="window.print()" style="padding: 8px 16px; background-color: #0284c7; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>

    <div class="header">
      <div class="hospital-name">Provincia de Santiago del Estero — Ministerio de Salud</div>
      <div class="hospital-name">${hospitalName}</div>
      <div class="title">PLANILLA DE IMPORTES PARCIALES POR EXPEDIENTES DE CADA PRESTADOR</div>
    </div>

    <div class="meta-box">
      <div>
        <strong>REFERENCIA:</strong> ${tituloLote || "LOTE DE HONORARIOS"} <br>
        <strong>EXPEDIENTE GDE:</strong> ${expedienteGde || "A CARATULAR"}
      </div>
      <div style="text-align: right;">
        <strong>TOTAL PRESTADORES:</strong> ${prestaciones.length} <br>
        <strong>FECHA EMISIÓN:</strong> ${new Date().toLocaleDateString("es-AR")}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">PROFESIONAL</th>
          <th style="text-align: left;">N° DE EXPTE. / TRÁMITE</th>
          <th style="text-align: left;">COMPROBANTE</th>
          <th style="text-align: right;">Suma de IMPORTE</th>
        </tr>
      </thead>
      <tbody>
        ${filasHTML}
        <tr class="total-row">
          <td colspan="3" style="padding: 10px 8px; text-align: right; text-transform: uppercase;">Total General:</td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 800;">
            ${formatMoney(totalGeneralBruto)}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer-sign">
      <div class="sign-box">
        Responsable Control Tesorería<br>
        CISB - La Banda
      </div>
      <div class="sign-box">
        Jefe Depto. Tesorería<br>
        CISB - La Banda
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Genera y descarga el archivo CSV de Lote de Transferencias Bancarias con importes Netos y Retenciones para BSE
 */
export function exportarLoteTransferenciasCSV(
  prestaciones: PrestacionTesoreriaItem[],
  nombreArchivo: string = "Lote_Transferencias_BSE_CISB.csv"
) {
  const dataExport: RegistroLoteBancarioExport[] = prestaciones.map((p, idx) => {
    const perfil = p.perfilPrestador;
    const user = p.expand?.user;
    const nombreCompleto = user
      ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
      : "Prestador Asistencial";

    const condicion = perfil?.tax_condition
      ? CONDICIONES_FISCALES_MAP[perfil.tax_condition] || perfil.tax_condition
      : "Monotributista";

    const srvKey = (p.hospital_service as string) || "";
    const srvLabel =
      SECTORES_SERVICIO_MAP[srvKey as SectorServicio] ||
      (srvKey ? srvKey.replace(/_/g, " ") : "Servicio Médico");

    const tipoForm = p.service_type === "guardia" ? "Guardia (Form G)" : "Extensión Horaria (Form EH)";

    const montoBruto = Number(p.invoice_amount) || 0;
    const retIIBB = Number(p.retencion_iibb) || 0;
    const retGanancias = Number(p.retencion_ganancias) || 0;
    const retSUSS = Number(p.retencion_suss) || 0;
    const retOtras = Number(p.retencion_otras) || 0;
    const retOtrasConcepto = p.retencion_otras_concepto || "";
    const retTotal = Number(p.retencion_monto) || retIIBB + retGanancias + retSUSS + retOtras;
    const montoNeto =
      p.monto_neto_liquidable !== undefined ? Number(p.monto_neto_liquidable) : montoBruto - retTotal;

    return {
      ordenPago: `ORD-${String(idx + 1).padStart(4, "0")}`,
      cuit: perfil?.cuit || "Sin CUIT",
      beneficiario: nombreCompleto,
      cbuAlias: perfil?.cbu_alias || "Sin CBU/Alias cargado",
      condicionFiscal: condicion,
      servicioHospitalario: srvLabel,
      tipoFormulario: tipoForm,
      numeroTramite: p.form_number || p.id,
      numeroExpedienteGde: p.numero_expediente_gde || p.lote_numero || "Sin Asignar",
      facturaNumero: p.invoice_number || "S/N",
      periodo: `${String(p.period_month).padStart(2, "0")}/${p.period_year}`,
      montoBruto: montoBruto,
      retencionIIBB: retIIBB,
      retencionGanancias: retGanancias,
      retencionSUSS: retSUSS,
      retencionOtras: retOtras,
      retencionOtrasConcepto: retOtrasConcepto,
      retencionMontoTotal: retTotal,
      montoNeto: montoNeto,
      estado: p.status.toUpperCase(),
      fechaAprobacionDireccion: p.director_approved_at
        ? p.director_approved_at.split("T")[0]
        : "-",
      fechaPago: p.paid_at || p.treasury_paid_at ? (p.paid_at || p.treasury_paid_at)!.split("T")[0] : "-",
    };
  });

  const csv = Papa.unparse(dataExport, {
    delimiter: ";",
    header: true,
  });

  // BOM para compatibilidad con Excel en español
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga el reporte completo de liquidaciones para Contabilidad
 */
export function exportarReporteLiquidacionesCSV(
  prestaciones: PrestacionTesoreriaItem[],
  nombreArchivo: string = "Reporte_Liquidaciones_Tesoreria_CISB.csv"
) {
  exportarLoteTransferenciasCSV(prestaciones, nombreArchivo);
}

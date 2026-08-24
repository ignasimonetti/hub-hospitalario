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

    const [records, perfilesMap] = await Promise.all([
      pocketbase
        .collection("prestaciones_presentaciones")
        .getFullList<PrestacionPresentacion>({
          filter: filter || undefined,
          sort: "-created",
          expand: "tenant,user",
          requestKey: null,
        }),
      getMapPerfilesPrestadores(),
    ]);

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
  const updatedLotes = [nuevoLote, ...currentLotes];
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
 * Quita una prestación individual de un Lote y la devuelve al buzón general de conformadas
 */
export async function quitarPrestacionDeLote(
  prestacionId: string,
  loteId: string,
  tenantId?: string
): Promise<void> {
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
  const lotes = await getLotesTesoreria(tenantId);
  const targetLote = lotes.find((l) => l.id === loteId);
  if (targetLote) {
    targetLote.prestaciones_ids = targetLote.prestaciones_ids.filter((id) => id !== prestacionId);
    targetLote.cantidad_prestaciones = targetLote.prestaciones_ids.length;
    targetLote.updated = new Date().toISOString();
    saveLocalLotes(lotes);
  }
}

/**
 * Agrega prestaciones conformadas a un Lote ya existente
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
      target.updated = new Date().toISOString();
      saveLocalLotes(lotes);
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

    const updated = await pocketbase
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
 * Genera la Planilla Oficial de Resumen de Lote para Expediente GDE (Anexo I)
 * Formato fiel al modelo analógico oficial del CISB
 */
export function generarPlanillaResumenLoteHTML(
  tituloLote: string,
  expedienteGde: string,
  prestaciones: PrestacionTesoreriaItem[],
  hospitalName: string = 'Centro Integral de Salud La Banda "Dr. Ricardo Abdala"'
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

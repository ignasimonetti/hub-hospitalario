"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PrestacionPresentacion,
  PrestadorPerfil,
  ESTADOS_PRESTACION_CONFIG,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  FormularioDigitalData,
} from "@/types/prestadores";
import { getPrestacionFileUrl, getPerfilFileUrl, deletePrestacion } from "@/lib/services/prestadoresService";
import { abrirPlanillaOficialEnNuevaPestana } from "@/lib/services/pdfPrestacionService";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  Clock,
  Building2,
  CheckCircle2,
  Edit3,
  Activity,
  CalendarClock,
  ClipboardList,
  Printer,
  Trash2,
} from "lucide-react";

interface ModalDetallePrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestacion: PrestacionPresentacion | null;
  perfil?: PrestadorPerfil | null;
  tenantName?: string;
  onEditarObservada?: (prestacion: PrestacionPresentacion) => void;
  onEliminarBorrador?: (id: string) => void;
  onRetomarBorrador?: (prestacion: PrestacionPresentacion) => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function ModalDetallePrestacion({
  open,
  onOpenChange,
  prestacion,
  perfil,
  tenantName,
  onEditarObservada,
  onEliminarBorrador,
  onRetomarBorrador,
}: ModalDetallePrestacionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Parsear digital_form_data (siempre antes de returns condicionales para respetar reglas de hooks)
  const digitalForm = useMemo<FormularioDigitalData | null>(() => {
    if (!prestacion?.digital_form_data) return null;
    try {
      if (typeof prestacion.digital_form_data === "string") {
        return JSON.parse(prestacion.digital_form_data);
      }
      return prestacion.digital_form_data;
    } catch {
      return null;
    }
  }, [prestacion?.digital_form_data]);

  // Parsear historial_observaciones
  const historialObservaciones = useMemo(() => {
    if (!prestacion?.historial_observaciones) return [];
    try {
      if (typeof prestacion.historial_observaciones === "string") {
        return JSON.parse(prestacion.historial_observaciones);
      }
      return Array.isArray(prestacion.historial_observaciones) ? prestacion.historial_observaciones : [];
    } catch {
      return [];
    }
  }, [prestacion?.historial_observaciones]);

  if (!prestacion) return null;

  const estadoCfg = ESTADOS_PRESTACION_CONFIG[prestacion.status];
  const mesNombre = MESES[prestacion.period_month - 1] || `Mes ${prestacion.period_month}`;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const clean = dateStr.split("T")[0].split(" ")[0];
      const parts = clean.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Factura solo si existe archivo adjunto
  const invoiceUrl = prestacion.file_invoice
    ? getPrestacionFileUrl(prestacion, prestacion.file_invoice)
    : null;

  // Conducta fiscal: buscar en la presentación o en el perfil del prestador
  const conductaUrl = prestacion.file_conducta_fiscal
    ? getPrestacionFileUrl(prestacion, prestacion.file_conducta_fiscal)
    : perfil?.file_conducta_fiscal
    ? getPerfilFileUrl(perfil, perfil.file_conducta_fiscal)
    : null;

  const proofUrl = prestacion.file_service_proof
    ? getPrestacionFileUrl(prestacion, prestacion.file_service_proof)
    : null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setConfirmDeleteOpen(false);
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Encabezado fijo superior */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 text-left shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  prestacion.service_type === "guardia"
                    ? "bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400"
                    : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {prestacion.service_type === "guardia" ? (
                  <Activity className="w-5 h-5" />
                ) : (
                  <CalendarClock className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {prestacion.service_type === "guardia" ? "Formulario G" : "Formulario EH"}
                  </DialogTitle>
                  {prestacion.form_number && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                      {prestacion.form_number}
                    </span>
                  )}
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                    Período: {mesNombre} {prestacion.period_year}
                  </span>
                  <span>•</span>
                  <span>{prestacion.invoice_number ? `Factura ${prestacion.invoice_number}` : "Sin factura adjunta (Borrador)"}</span>
                </DialogDescription>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoCfg.bgLight} ${estadoCfg.textDark}`}
            >
              {estadoCfg.label}
            </span>
          </div>
        </DialogHeader>

        {/* Cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left">
          {/* Si está observada (por Dirección o Tesorería), destacar el motivo y mostrar el historial */}
          {(prestacion.status === "observado" || prestacion.status === "observado_tesoreria") && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              prestacion.status === "observado_tesoreria"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 font-bold text-xs ${
                  prestacion.status === "observado_tesoreria"
                    ? "text-amber-900 dark:text-amber-200"
                    : "text-rose-900 dark:text-rose-200"
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {prestacion.status === "observado_tesoreria"
                    ? "Observación de Tesorería (Facturación / Datos Fiscales):"
                    : "Observación de Dirección Asistencial:"}
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-slate-700">
                  {prestacion.origen_observacion === "tesoreria"
                    ? "Revisión Fiscal"
                    : prestacion.origen_observacion === "director_coordinador"
                    ? "Dirección Coordinadora"
                    : "Dirección Adjunta"}
                </span>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium pl-6 leading-relaxed">
                {prestacion.director_observation || prestacion.treasury_observation || "Se requiere subsanar la presentación para avanzar en el circuito."}
              </p>

              {/* Hilo Historial de Mensajes / Observaciones si tiene más de 1 evento */}
              {historialObservaciones.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Historial de Intercambios:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {historialObservaciones.map((ev: any, idx: number) => (
                      <div
                        key={ev.id || idx}
                        className="text-[11px] p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>
                            {ev.rol_emisor === "tesoreria"
                              ? "💰 Tesorería"
                              : ev.rol_emisor === "director_coordinador"
                              ? "🛡️ Dir. Coordinador"
                              : ev.rol_emisor === "director_adjunto"
                              ? "🩺 Dir. Adjunto"
                              : "👤 Prestador"} ({ev.autor_nombre})
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            {formatDate(ev.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 italic">{ev.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumen Financiero */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                Monto Facturado
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatMoney(prestacion.invoice_amount)}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                Factura AFIP
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                N° {prestacion.invoice_number} ({formatDate(prestacion.invoice_date)})
              </p>
            </div>
          </div>

          {/* PLANILLA DIGITAL NATIVA (CERTIFICACIÓN DE ASISTENCIA) */}
          {digitalForm && (
            <div className="p-3.5 bg-slate-50/90 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Certificación de Asistencia Digital
                  </span>
                </div>
                {digitalForm.tipo_formulario === "guardia" ? (
                  <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-full">
                    {digitalForm.renglones.length} guardias
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    {digitalForm.renglones.reduce((sum, r) => sum + (Number(r.horas_cumplidas) || 0), 0)} hs totales
                  </span>
                )}
              </div>

              {/* Renglones Formulario G (Guardias) */}
              {digitalForm.tipo_formulario === "guardia" && (
                <div className="space-y-2">
                  {digitalForm.reemplazo_de && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      <strong>En reemplazo de:</strong> {digitalForm.reemplazo_de}
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Entrada</th>
                          <th className="py-2 px-3">Salida</th>
                          <th className="py-2 px-3 text-right">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {digitalForm.renglones.map((g, idx) => (
                          <tr key={g.id || idx}>
                            <td className="py-1.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {formatDate(g.fecha)}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{g.hora_entrada}</td>
                            <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{g.hora_salida}</td>
                            <td className="py-1.5 px-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  g.tipo === "critica"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                                    : "bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300"
                                }`}
                              >
                                {g.tipo === "critica" ? "Crítica" : "Ordinaria"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Renglones Formulario EH (Extensión Horaria) */}
              {digitalForm.tipo_formulario === "extension_horaria" && (
                <div className="space-y-2">
                  {digitalForm.cargo_especialidad && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      <strong>Cargo / Especialidad:</strong> {digitalForm.cargo_especialidad}
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Horario Programado</th>
                          <th className="py-2 px-3 text-right">Hs. Cumplidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {digitalForm.renglones.map((eh, idx) => (
                          <tr key={eh.id || idx}>
                            <td className="py-1.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {formatDate(eh.fecha)}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">
                              {eh.horario_programado}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {eh.horas_cumplidas} hs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {digitalForm.observaciones && (
                <div className="p-2.5 bg-slate-100/70 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Observaciones:</span> {digitalForm.observaciones}
                </div>
              )}
            </div>
          )}

          {/* Detalle de Cabecera */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Mes y Año Devengado:</span>
              <span className="font-bold text-[#08487A] dark:text-sky-400">
                {mesNombre} de {prestacion.period_year}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Tipo de Trámite:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {TIPOS_PRESTACION_MAP[prestacion.service_type] || prestacion.service_type}
              </span>
            </div>

            {prestacion.hospital_service && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Servicio / Sector:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {SECTORES_SERVICIO_MAP[prestacion.hospital_service as SectorServicio] ||
                    prestacion.hospital_service}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Vencimiento Conducta Fiscal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(prestacion.conducta_fiscal_due_date)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Fecha de Presentación:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(prestacion.submitted_at || prestacion.created)}
              </span>
            </div>
          </div>

          {/* Documentos Adjuntos (Acceso a PDF) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">
              Documentos Digitales Adjuntos
            </span>

            <div className="space-y-2">
              {invoiceUrl ? (
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <FileText className="w-4 h-4 text-sky-600" /> Factura AFIP / ARCA (PDF)
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                </a>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Factura AFIP: Pendiente de adjuntar
                  </div>
                  <span className="text-[10px] italic">Borrador</span>
                </div>
              )}

              {conductaUrl ? (
                <a
                  href={conductaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" /> Certificado de Conducta Fiscal (PDF)
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                </a>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-slate-400" /> Conducta Fiscal no disponible
                  </div>
                </div>
              )}

              {proofUrl && (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-indigo-600" /> Planilla Escaneada Anterior (PDF)
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Pie de página fijo inferior */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {confirmDeleteOpen ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl animate-in fade-in-50">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>¿Confirmas que deseas eliminar este borrador?</span>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-300 font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!prestacion) return;
                    setIsDeleting(true);
                    try {
                      await deletePrestacion(prestacion.id);
                      toast.success("Borrador descartado exitosamente");
                      setConfirmDeleteOpen(false);
                      onOpenChange(false);
                      if (onEliminarBorrador) onEliminarBorrador(prestacion.id);
                    } catch (error: any) {
                      toast.error(error.message || "Error al descartar el borrador");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(prestacion.status === "borrador" || prestacion.status === "observado" || prestacion.status === "observado_tesoreria") && onEliminarBorrador && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={isDeleting}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {prestacion.status === "borrador" ? "Descartar Borrador" : "Anular y Eliminar"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => abrirPlanillaOficialEnNuevaPestana(prestacion, perfil, tenantName)}
                  className="text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-600" /> Imprimir Planilla
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {prestacion.status === "borrador" && onRetomarBorrador && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onRetomarBorrador(prestacion);
                    }}
                    className="w-full sm:w-auto bg-[#08487A] hover:bg-[#06375d] text-white font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Retomar y Completar
                  </Button>
                )}

                {(prestacion.status === "observado" || prestacion.status === "observado_tesoreria") && onEditarObservada && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onEditarObservada(prestacion);
                    }}
                    className={`w-full sm:w-auto text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm ${
                      prestacion.status === "observado_tesoreria"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Subsanar
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>


      </DialogContent>
    </Dialog>
  );
}

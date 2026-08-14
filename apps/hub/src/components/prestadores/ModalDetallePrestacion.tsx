"use client";

import { useMemo } from "react";
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
  ESTADOS_PRESTACION_CONFIG,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  FormularioDigitalData,
} from "@/types/prestadores";
import { getPrestacionFileUrl } from "@/lib/services/prestadoresService";
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
  Stethoscope,
  ClipboardList,
} from "lucide-react";

interface ModalDetallePrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestacion: PrestacionPresentacion | null;
  onEditarObservada?: (prestacion: PrestacionPresentacion) => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function ModalDetallePrestacion({
  open,
  onOpenChange,
  prestacion,
  onEditarObservada,
}: ModalDetallePrestacionProps) {
  if (!prestacion) return null;

  const estadoCfg = ESTADOS_PRESTACION_CONFIG[prestacion.status];
  const mesNombre = MESES[prestacion.period_month - 1] || `Mes ${prestacion.period_month}`;

  // Parsear digital_form_data
  const digitalForm = useMemo<FormularioDigitalData | null>(() => {
    if (!prestacion.digital_form_data) return null;
    try {
      if (typeof prestacion.digital_form_data === "string") {
        return JSON.parse(prestacion.digital_form_data);
      }
      return prestacion.digital_form_data;
    } catch {
      return null;
    }
  }, [prestacion.digital_form_data]);

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

  const invoiceUrl = getPrestacionFileUrl(prestacion, prestacion.file_invoice);
  const conductaUrl = getPrestacionFileUrl(prestacion, prestacion.file_conducta_fiscal);
  const proofUrl = prestacion.file_service_proof
    ? getPrestacionFileUrl(prestacion, prestacion.file_service_proof)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
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
                  <Stethoscope className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {prestacion.form_number
                    ? `${prestacion.service_type === "guardia" ? "Formulario G" : "Formulario EH"} • ${prestacion.form_number}`
                    : `Factura ${prestacion.invoice_number}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Período: {mesNombre} {prestacion.period_year}
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

        <div className="space-y-4 py-2 text-left">
          {/* Si está observada, destacar el motivo */}
          {prestacion.status === "observado" && prestacion.treasury_observation && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Observación de Tesorería:
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 pl-6">
                {prestacion.treasury_observation}
              </p>
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
                                {g.tipo === "critica" ? "Crítica" : "Normal"}
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
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-sky-600" /> Factura AFIP (PDF)
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>

              <a
                href={conductaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" /> Conducta Fiscal (PDF)
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>

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

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
          {prestacion.status === "observado" && onEditarObservada && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEditarObservada(prestacion);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Corregir y Reenviar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

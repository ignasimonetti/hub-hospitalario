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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PrestacionPresentacion,
  ESTADOS_PRESTACION_CONFIG,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  FormularioDigitalData,
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import { getPrestadoresConfig } from "@/lib/services/parametersService";
import {
  aprobarPrestacionDirector,
  visarPrestacionAdjunto,
  observarPrestacionDirector,
  getPrestacionFileUrl,
  derivarPrestacionADirectorAdjunto,
  getDirectoresDisponibles,
} from "@/lib/services/prestadoresService";
import { abrirPlanillaOficialEnNuevaPestana } from "@/lib/services/pdfPrestacionService";
import { useRoles } from "@/hooks/usePermissions";
import { pocketbase } from "@/lib/auth";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  User,
  Activity,
  CalendarClock,
  Loader2,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface ModalAuditoriaDirectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestacion: PrestacionPresentacion | null;
  currentUserName: string;
  onActualizado: (prestacionActualizada: PrestacionPresentacion) => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function ModalAuditoriaDirector({
  open,
  onOpenChange,
  prestacion,
  currentUserName,
  onActualizado,
}: ModalAuditoriaDirectorProps) {
  const [modoAccion, setModoAccion] = useState<"ver" | "aprobar" | "observar" | "derivar">("ver");
  const [motivoObservacion, setMotivoObservacion] = useState("");
  const [observacionAprobacion, setObservacionAprobacion] = useState("");
  const [directorParaDerivar, setDirectorParaDerivar] = useState("");
  const [motivoDerivacion, setMotivoDerivacion] = useState("");
  const [directoresAdjuntosLista, setDirectoresAdjuntosLista] = useState<{ id: string; nombre: string; email: string; rol?: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [configPrestadores, setConfigPrestadores] = useState<ConfiguracionModuloPrestadores>(DEFAULT_CONFIGURACION_PRESTADORES);

  // Cargar aranceles vigentes
  useEffect(() => {
    if (prestacion?.tenant) {
      getPrestadoresConfig(prestacion.tenant).then(setConfigPrestadores);
    }
  }, [prestacion?.tenant]);

  // Cargar lista de directores adjuntos para derivación (excluyendo al usuario actual y solo roles adjuntos)
  useEffect(() => {
    if (open && prestacion) {
      getDirectoresDisponibles(prestacion.tenant).then((dirs) => {
        const currentUserId = pocketbase.authStore.model?.id;
        // Filtrar para mostrar directores adjuntos disponibles para derivar
        const adjuntosValidos = dirs.filter((d) => {
          // Excluir al usuario actual que está derivando
          if (currentUserId && d.id === currentUserId) return false;
          // Excluir si ya está asignado a este mismo director
          if (prestacion.director_adjunto_asignado && d.id === prestacion.director_adjunto_asignado) return false;
          return true;
        });
        setDirectoresAdjuntosLista(adjuntosValidos.length > 0 ? adjuntosValidos : dirs.filter((d) => d.id !== currentUserId));
      });
    }
  }, [open, prestacion]);

  // Parsear digital_form_data
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

  // Calcular total devengado según la certificación asistencial cargada
  const montoDevengado = useMemo(() => {
    if (!prestacion) return 0;
    if (!digitalForm) {
      return Number(prestacion.invoice_amount) || 0;
    }
    if (digitalForm.tipo_formulario === "guardia") {
      return (digitalForm.renglones || []).reduce((sum, g) => {
        if (!g.fecha) return sum;
        if (typeof g.valor === "number" && g.valor > 0) return sum + g.valor;
        const horas = Math.max(1, Math.min(24, Number(g.duracion_horas) || 24));
        const dateObj = new Date(g.fecha + "T12:00:00Z");
        const dayOfWeek = dateObj.getUTCDay();
        const isInhabil = dayOfWeek === 0 || dayOfWeek === 6;
        let valor24hs = 0;
        if (g.tipo === "critica") {
          valor24hs = isInhabil ? configPrestadores.valor_guardia_critica_inhabil : configPrestadores.valor_guardia_critica_habil;
        } else {
          valor24hs = isInhabil ? configPrestadores.valor_guardia_ordinaria_inhabil : configPrestadores.valor_guardia_ordinaria_habil;
        }
        return sum + (valor24hs / 24) * horas;
      }, 0);
    } else if (digitalForm.tipo_formulario === "extension_horaria") {
      return (digitalForm.renglones || []).reduce((sum, r) => {
        if (typeof r.valor === "number" && r.valor > 0) return sum + r.valor;
        const horas = Number(r.horas_cumplidas) || 0;
        return sum + horas * configPrestadores.valor_hora_extension;
      }, 0);
    }
    return Number(prestacion.invoice_amount) || 0;
  }, [digitalForm, configPrestadores, prestacion]);

  if (!prestacion) return null;

  const montoFacturado = Number(prestacion.invoice_amount) || 0;
  const hayInconsistencia = montoDevengado > 0 && Math.abs(montoDevengado - montoFacturado) > 0.01;

  const estadoCfg = ESTADOS_PRESTACION_CONFIG[prestacion.status];
  const mesNombre = MESES[prestacion.period_month - 1] || `Mes ${prestacion.period_month}`;
  const isGuardia = prestacion.service_type === "guardia";

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
      const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
      const parts = clean.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return clean;
    } catch {
      return dateStr;
    }
  };

  const invoiceUrl = prestacion.file_invoice
    ? getPrestacionFileUrl(prestacion, prestacion.file_invoice)
    : null;

  const nombrePrestador = prestacion.expand?.user
    ? `${prestacion.expand.user.firstName || ""} ${prestacion.expand.user.lastName || ""}`.trim() || prestacion.expand.user.email
    : "Profesional Prestador";

  // Roles del usuario para jerarquía de firmas
  const { hasRole } = useRoles(prestacion.tenant);
  const isDirCoordinador = hasRole("director_coordinador") || hasRole("superadmin") || hasRole("admin");
  const isDirAdjunto = hasRole("director_adjunto");

  // Determinar si la acción es "Visar (Adjunto)" o "Aprobar (Coordinador)"
  const requiereVisaAdjunto = !prestacion.adjunto_approved_at && prestacion.status !== "visado_adjunto";
  const accionEsSoloVisa = isDirAdjunto && !isDirCoordinador;

  // Handler: Aprobar / Visar
  const handleAprobarOVisar = async () => {
    setIsProcessing(true);
    try {
      if (accionEsSoloVisa) {
        // Director Adjunto realiza primera firma / visa
        const metaFirma = `${currentUserName} (Director Adjunto)`;
        const updated = await visarPrestacionAdjunto(
          prestacion.id,
          metaFirma,
          observacionAprobacion.trim()
        );
        toast.success("Presentación visada correctamente. Pendiente de aprobación del Director Coordinador.");
        onActualizado(updated);
      } else {
        // Director Coordinador (o SuperAdmin) realiza aprobación final
        // Si no tenía visa del Adjunto, se suple automáticamente
        const metaFirma = `${currentUserName} (Director Coordinador)`;
        const updated = await aprobarPrestacionDirector(
          prestacion.id,
          metaFirma,
          observacionAprobacion.trim()
        );
        toast.success("Solicitud aprobada y firmada formalmente. Enviada a Tesorería.");
        onActualizado(updated);
      }
      onOpenChange(false);
      setModoAccion("ver");
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la presentación");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Derivar a Director Adjunto (solo Dir Coordinador)
  const handleDerivar = async () => {
    if (!directorParaDerivar) {
      toast.error("Debes seleccionar un Director Adjunto de destino");
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await derivarPrestacionADirectorAdjunto(
        prestacion.id,
        directorParaDerivar,
        motivoDerivacion.trim()
      );
      toast.success("Expediente derivado correctamente al Director Adjunto para visado técnico.");
      onActualizado(updated);
      onOpenChange(false);
      setModoAccion("ver");
      setDirectorParaDerivar("");
      setMotivoDerivacion("");
    } catch (error: any) {
      toast.error(error.message || "Error al derivar la presentación");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Observar y Devolver al Prestador
  const handleObservar = async () => {
    if (!motivoObservacion.trim()) {
      toast.error("Debes detallar el motivo de la observación para el médico");
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await observarPrestacionDirector(
        prestacion.id,
        motivoObservacion.trim()
      );
      toast.info("Presentación observada. El prestador fue notificado para corregir.");
      onActualizado(updated);
      onOpenChange(false);
      setModoAccion("ver");
      setMotivoObservacion("");
    } catch (error: any) {
      toast.error(error.message || "Error al observar la prestación");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setModoAccion("ver");
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[720px] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Cabecera Fija */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 text-left shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#08487A]/10 text-[#08487A] dark:text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Auditoría y Autorización de Dirección
                  </DialogTitle>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {prestacion.form_number || "S/N (Pendiente)"}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Prestador: <strong>{nombrePrestador}</strong></span>
                  <span>•</span>
                  <span>Período: {mesNombre} {prestacion.period_year}</span>
                </DialogDescription>
              </div>
            </div>

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoCfg.bgLight} ${estadoCfg.textDark}`}>
              {estadoCfg.label}
            </span>
          </div>
        </DialogHeader>

        {/* Cuerpo Scrolleable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left">
          {/* Card Resumen Rápido con Devengado vs Facturado */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Servicio / Sector</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={prestacion.hospital_service || "Servicio Asistencial"}>
                {prestacion.hospital_service
                  ? (SECTORES_SERVICIO_MAP[prestacion.hospital_service as SectorServicio] || prestacion.hospital_service)
                  : "Servicio Asistencial"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Factura</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                {prestacion.invoice_number ? `N° ${prestacion.invoice_number}` : "Sin número"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Facturado</span>
              <span className={`text-sm font-extrabold font-mono block ${hayInconsistencia ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                {formatMoney(montoFacturado)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Devengado</span>
              <span className="text-sm font-extrabold text-blue-700 dark:text-blue-400 font-mono block">
                {formatMoney(montoDevengado)}
              </span>
            </div>
          </div>

          {/* Banner de Advertencia en Dirección si hay discrepancia */}
          {hayInconsistencia && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Diferencia entre Planilla Asistencial y Factura Adjunta:</strong>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  El cálculo asistencial según guardias/horas cargadas da <strong>{formatMoney(montoDevengado)}</strong>, mientras que el importe facturado es <strong>{formatMoney(montoFacturado)}</strong> (Diferencia: <strong>{formatMoney(Math.abs(montoDevengado - montoFacturado))}</strong>). Puede verificar la planilla o solicitar rectificación al profesional antes de elevar a Tesorería.
                </p>
              </div>
            </div>
          )}

          {/* Si ya fue aprobado o visado */}
          {prestacion.director_approved_at && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Visado Digitalmente por:</strong> {prestacion.director_signature_meta || "Dirección"} el {formatDate(prestacion.director_approved_at)}
                </span>
              </div>
              <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300">
                Aprobado
              </Badge>
            </div>
          )}

          {/* Si está observada */}
          {prestacion.status === "observado" && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Observación Registrada por Dirección:</span>
              </div>
              <p className="text-[11px] leading-relaxed pl-5">
                {prestacion.director_observation || prestacion.treasury_observation || "Sin detalle"}
              </p>
            </div>
          )}

          {/* Grilla de Asistencia Cargada */}
          {digitalForm && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">
                  {isGuardia ? "Planilla de Guardias Asistenciales" : "Planilla de Extensión Horaria"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isGuardia && digitalForm.tipo_formulario === "guardia"
                    ? `${digitalForm.renglones.length} guardias registradas`
                    : !isGuardia && digitalForm.tipo_formulario === "extension_horaria"
                    ? `${digitalForm.renglones.length} registros cargados`
                    : ""}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    {isGuardia ? (
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Entrada</th>
                        <th className="p-2">Salida / Duración</th>
                        <th className="p-2">Complejidad</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Horario Programado</th>
                        <th className="p-2">Horas Cumplidas</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {isGuardia && digitalForm.tipo_formulario === "guardia" && (
                      digitalForm.renglones.map((g, idx) => (
                        <tr key={g.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-medium">{formatDate(g.fecha)}</td>
                          <td className="p-2">{g.hora_entrada} hs</td>
                          <td className="p-2 font-semibold text-slate-700 dark:text-slate-200">
                            {g.hora_salida} hs ({g.duracion_horas || 24} hs)
                          </td>
                          <td className="p-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              g.tipo === "critica"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            }`}>
                              {g.tipo === "critica" ? "Crítica" : "Ordinaria"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}

                    {!isGuardia && digitalForm.tipo_formulario === "extension_horaria" && (
                      digitalForm.renglones.map((eh, idx) => (
                        <tr key={eh.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-medium">{formatDate(eh.fecha)}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-400">{eh.horario_programado || "s/d"}</td>
                          <td className="p-2 font-bold text-emerald-700 dark:text-emerald-400">{eh.horas_cumplidas} hs</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {digitalForm.observaciones && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Observaciones del Prestador:</span> {digitalForm.observaciones}
                </div>
              )}
            </div>
          )}

          {/* Documentación Adjunta */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">
              Factura Electrónica ARCA / AFIP
            </span>
            {invoiceUrl ? (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" /> Factura PDF Adjunta por el Prestador
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>
            ) : (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                Factura electrónica no adjuntada aún
              </div>
            )}
          </div>

          {/* Formulario de Aprobación / Visado */}
          {modoAccion === "aprobar" && (
            <div className={`p-3.5 border rounded-xl space-y-2.5 animate-in fade-in-50 ${
              accionEsSoloVisa
                ? "bg-sky-50/90 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800"
                : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
            }`}>
              <div className={`flex items-center gap-2 font-bold text-xs ${
                accionEsSoloVisa ? "text-sky-900 dark:text-sky-100" : "text-emerald-900 dark:text-emerald-100"
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${accionEsSoloVisa ? "text-sky-600" : "text-emerald-600"}`} />
                {accionEsSoloVisa
                  ? "¿Confirmar Visado y Firma de Dirección Adjunta?"
                  : "¿Confirmar Aprobación Final y Firma de Dirección Coordinadora?"}
              </div>
              <p className={`text-[11px] leading-relaxed ${
                accionEsSoloVisa ? "text-sky-800/80 dark:text-sky-200/80" : "text-emerald-800/80 dark:text-emerald-200/80"
              }`}>
                {accionEsSoloVisa
                  ? "Al confirmar el visado, se estampará tu firma electrónica de Director Adjunto y la presentación pasará automáticamente a la Dirección Coordinadora para su aprobación final."
                  : "Al confirmar, se estampará la firma oficial de Dirección y el expediente se elevará a Tesorería para su liquidación y pago."}
              </p>
              <div className="space-y-1">
                <Label className={`text-[10px] ${
                  accionEsSoloVisa ? "text-sky-900 dark:text-sky-200" : "text-emerald-900 dark:text-emerald-200"
                }`}>
                  Observación de visado / control (opcional):
                </Label>
                <Textarea
                  placeholder="Ej: Prestaciones verificadas con el libro de guardia central."
                  value={observacionAprobacion}
                  onChange={(e) => setObservacionAprobacion(e.target.value)}
                  className="h-16 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          {/* Formulario de Derivación a Director Adjunto (Solo Dir Coordinador) */}
          {modoAccion === "derivar" && (
            <div className="p-3.5 bg-sky-50/90 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-xl space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-sky-900 dark:text-sky-100 font-bold text-xs">
                <ArrowRightLeft className="w-4 h-4 text-sky-600" />
                Derivar Trámite a Director Adjunto para Visado Técnico
              </div>
              <p className="text-[11px] text-sky-800/80 dark:text-sky-200/80 leading-relaxed">
                Selecciona al Director Adjunto del área para que audite y vise técnicamente la planilla de prestaciones antes de la aprobación final.
              </p>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-sky-900 dark:text-sky-200">
                  Director Adjunto de Destino <span className="text-rose-500">*</span>
                </Label>
                <Select value={directorParaDerivar} onValueChange={setDirectorParaDerivar}>
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border-sky-300">
                    <SelectValue placeholder="Seleccionar Director Adjunto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {directoresAdjuntosLista.length > 0 ? (
                      directoresAdjuntosLista.map((dir) => (
                        <SelectItem key={dir.id} value={dir.id} className="text-xs">
                          👤 {dir.nombre} <span className="text-[10px] text-slate-400">({dir.rol || "Dir. Adjunto"})</span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled className="text-xs">
                        No se encontraron directores configurados
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-sky-900 dark:text-sky-200">
                  Instrucción / Motivo de derivación (opcional):
                </Label>
                <Textarea
                  placeholder="Ej: Por favor verificar la planilla con el libro de guardia del servicio correspondiente antes de visar."
                  value={motivoDerivacion}
                  onChange={(e) => setMotivoDerivacion(e.target.value)}
                  className="h-16 text-xs bg-white dark:bg-slate-900 border-sky-300"
                />
              </div>
            </div>
          )}

          {/* Formulario de Observación */}
          {modoAccion === "observar" && (
            <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Observar y Devolver al Prestador para Subsanación
              </div>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-200/80 leading-relaxed">
                Detalla con claridad el motivo por el cual se observa esta presentación. El profesional recibirá esta notificación y podrá subsanarla desde su portal.
              </p>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-rose-900 dark:text-rose-200">
                  Motivo de la Observación <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  placeholder="Ej: La guardia del día 15/08 no coincide con el libro de guardia del servicio. Corregir horario o fecha."
                  value={motivoObservacion}
                  onChange={(e) => setMotivoObservacion(e.target.value)}
                  className="h-20 text-xs bg-white dark:bg-slate-900 border-rose-300"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Pie Fijo con Acciones */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => abrirPlanillaOficialEnNuevaPestana(prestacion)}
              className="text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" /> Ver Planilla Oficial
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {modoAccion === "ver" && (
              <>
                {["pendiente", "en_revision", "visado_adjunto"].includes(prestacion.status) && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModoAccion("observar")}
                      className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Observar
                    </Button>

                    {/* Botón Derivar solo para Director Coordinador si no está visado aún */}
                    {isDirCoordinador && prestacion.status !== "visado_adjunto" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setModoAccion("derivar")}
                        className="text-xs border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                        Derivar a Dir. Adjunto
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setModoAccion("aprobar")}
                      className={`text-xs text-white font-medium flex items-center gap-1.5 shadow-sm ${
                        accionEsSoloVisa ? "bg-[#08487A] hover:bg-[#06375c]" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {accionEsSoloVisa ? "Visar" : "Aprobar"}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </>
            )}

            {modoAccion === "aprobar" && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModoAccion("ver")}
                  disabled={isProcessing}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAprobarOVisar}
                  disabled={isProcessing}
                  className={`text-xs text-white font-medium shadow-sm flex items-center gap-1.5 ${
                    accionEsSoloVisa ? "bg-[#08487A] hover:bg-[#06375c]" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {accionEsSoloVisa ? "Confirmar Visado" : "Confirmar Aprobación"}
                    </>
                  )}
                </Button>
              </>
            )}

            {modoAccion === "derivar" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setModoAccion("ver")}
                  className="text-xs"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessing || !directorParaDerivar}
                  onClick={handleDerivar}
                  className="text-xs bg-sky-700 hover:bg-sky-800 text-white font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {isProcessing ? "Derivando..." : "Confirmar Derivación"}
                </Button>
              </>
            )}

            {modoAccion === "observar" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setModoAccion("ver")}
                  className="text-xs"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleObservar}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isProcessing ? "Enviando observación..." : "Notificar Observación"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

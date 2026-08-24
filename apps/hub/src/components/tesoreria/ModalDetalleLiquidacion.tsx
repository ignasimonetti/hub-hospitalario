"use client";

import { useState } from "react";
import { PrestacionTesoreriaItem } from "@/types/tesoreria";
import {
  PROFESIONES_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  CONDICIONES_FISCALES_MAP,
  ESTADOS_PRESTACION_CONFIG,
  EventoObservacion,
  FormularioDigitalData,
} from "@/types/prestadores";
import { getPresentacionFileUrl, getPerfilFileUrl } from "@/lib/services/prestadoresService";
import { generarPlanillaOficialHTML } from "@/lib/services/pdfPrestacionService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  User,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  History,
  Copy,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

interface ModalDetalleLiquidacionProps {
  isOpen: boolean;
  onClose: () => void;
  prestacion: PrestacionTesoreriaItem | null;
  onRegistrarPago: (prestacion: PrestacionTesoreriaItem) => void;
  onObservarFiscal: (prestacion: PrestacionTesoreriaItem) => void;
}

export function ModalDetalleLiquidacion({
  isOpen,
  onClose,
  prestacion,
  onRegistrarPago,
  onObservarFiscal,
}: ModalDetalleLiquidacionProps) {
  const [activeTab, setActiveTab] = useState<"liquidacion" | "asistencial" | "historial">("liquidacion");

  if (!prestacion) return null;

  const perfil = prestacion.perfilPrestador;
  const user = prestacion.expand?.user;
  const nombrePrestador = user
    ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
    : "Prestador Asistencial";

  const srvKey = (prestacion.hospital_service as string) || "";
  const srvLabel =
    SECTORES_SERVICIO_MAP[srvKey as SectorServicio] ||
    (srvKey ? srvKey.replace(/_/g, " ") : "Servicio Asistencial");

  const estadoCfg = ESTADOS_PRESTACION_CONFIG[prestacion.status] || {
    label: prestacion.status,
    bgLight: "bg-slate-100 border-slate-200",
    textDark: "text-slate-700",
  };

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
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  // Historial de eventos
  let historial: EventoObservacion[] = [];
  if (prestacion.historial_observaciones) {
    try {
      historial = typeof prestacion.historial_observaciones === "string"
        ? JSON.parse(prestacion.historial_observaciones)
        : prestacion.historial_observaciones;
    } catch {
      historial = [];
    }
  }

  // Descarga / Previsualización de Planilla HTML oficial
  const handleVerPlanillaOficial = () => {
    const html = generarPlanillaOficialHTML(prestacion, perfil);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const facturaUrl = prestacion.file_invoice
    ? getPresentacionFileUrl(prestacion, prestacion.file_invoice)
    : "";

  const conductaFiscalUrl = prestacion.file_conducta_fiscal
    ? getPresentacionFileUrl(prestacion, prestacion.file_conducta_fiscal)
    : perfil?.file_conducta_fiscal
    ? getPerfilFileUrl(perfil, perfil.file_conducta_fiscal)
    : "";

  const comprobantePagoUrl = prestacion.file_service_proof
    ? getPresentacionFileUrl(prestacion, prestacion.file_service_proof)
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                  {prestacion.form_number || `ID: ${prestacion.id.slice(0, 8)}`}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${estadoCfg.bgLight} ${estadoCfg.textDark}`}>
                  {estadoCfg.label}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight mt-1.5">
                {nombrePrestador}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                <span>{srvLabel}</span>
                <span>•</span>
                <span>Período: {String(prestacion.period_month).padStart(2, "0")}/{prestacion.period_year}</span>
              </DialogDescription>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Total a Liquidar</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatMoney(Number(prestacion.invoice_amount) || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <TabsList className="grid grid-cols-3 w-full h-9 bg-slate-200/70 dark:bg-slate-800/70">
              <TabsTrigger value="liquidacion" className="text-xs flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Liquidación & Banco
              </TabsTrigger>
              <TabsTrigger value="asistencial" className="text-xs flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Planilla & Firmas
              </TabsTrigger>
              <TabsTrigger value="historial" className="text-xs flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Trazabilidad ({historial.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5">
            {/* TAB 1: DATOS DE LIQUIDACIÓN Y BANCO */}
            <TabsContent value="liquidacion" className="space-y-4 m-0">
              {/* Datos Bancarios y Fiscales */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  Datos de Acreditación Bancaria & Fiscal
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[11px]">CUIT / CUIL</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-slate-100">
                      {perfil?.cuit || "No informado"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Condición Fiscal</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {perfil?.tax_condition
                        ? CONDICIONES_FISCALES_MAP[perfil.tax_condition] || perfil.tax_condition
                        : "Monotributo"}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block text-[10px]">CBU / ALIAS REGISTRADO</span>
                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-slate-100 select-all">
                        {perfil?.cbu_alias || "Sin CBU registrado en el perfil"}
                      </span>
                    </div>
                    {perfil?.cbu_alias && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-sky-600 dark:text-sky-400"
                        onClick={() => copyToClipboard(perfil.cbu_alias!, "CBU/Alias")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comprobantes Fiscales ARCA */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  Comprobante Fiscal (Factura Electrónica ARCA)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Nº de Factura:</span>
                    <div className="font-bold font-mono text-gray-900 dark:text-slate-100">
                      {prestacion.invoice_number || "S/N"}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Fecha Emisión:</span>
                    <div className="font-semibold text-gray-900 dark:text-slate-100">
                      {formatDate(prestacion.invoice_date)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Importe Facturado:</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(Number(prestacion.invoice_amount) || 0)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {facturaUrl ? (
                    <a
                      href={facturaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Ver / Descargar Factura ARCA
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Sin archivo de factura adjunto</span>
                  )}

                  {conductaFiscalUrl && (
                    <a
                      href={conductaFiscalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Constancia Conducta Fiscal (DGR)
                    </a>
                  )}
                </div>
              </div>

              {/* Registro de Pago si ya está pagado */}
              {prestacion.status === "pagado" && (
                <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Liquidación Efectuada
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Comprobante de Pago:</span>
                      <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {prestacion.treasury_receipt_number || "Registrado"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Fecha de Pago:</span>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {formatDate(prestacion.paid_at || prestacion.treasury_paid_at)}
                      </div>
                    </div>
                  </div>
                  {prestacion.treasury_observation && (
                    <p className="text-xs text-emerald-950 dark:text-emerald-200 pt-1 border-t border-emerald-200/50">
                      <strong>Detalle:</strong> {prestacion.treasury_observation}
                    </p>
                  )}
                  {comprobantePagoUrl && (
                    <div className="pt-1">
                      <a
                        href={comprobantePagoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
                      >
                        <Download className="h-3 w-3" /> Ver Comprobante Bancario Adjunto
                      </a>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: PLANILLA ASISTENCIAL & FIRMAS */}
            <TabsContent value="asistencial" className="space-y-4 m-0">
              {/* Firmas de Dirección */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-violet-600" />
                  Visados y Aprobación de la Dirección Asistencial
                </div>

                <div className="space-y-2 text-xs">
                  {/* Visado Adjunto */}
                  <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        1. Visado Dirección Adjunta / Asistencial
                      </span>
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                        {prestacion.adjunto_approved_at
                          ? `Visado el ${formatDate(prestacion.adjunto_approved_at)}`
                          : "Pendiente de visado adjunto"}
                      </span>
                      {prestacion.adjunto_signature_meta && (
                        <p className="text-[11px] font-mono text-violet-700 dark:text-violet-300 mt-0.5">
                          {prestacion.adjunto_signature_meta}
                        </p>
                      )}
                    </div>
                    {prestacion.adjunto_approved_at ? (
                      <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 text-[10px]">
                        Visado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                    )}
                  </div>

                  {/* Aprobación Coordinador */}
                  <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        2. Aprobación Final Dirección Coordinadora / General
                      </span>
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                        {prestacion.director_approved_at
                          ? `Aprobado y elevado el ${formatDate(prestacion.director_approved_at)}`
                          : "Pendiente de aprobación de coordinación"}
                      </span>
                      {prestacion.director_signature_meta && (
                        <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {prestacion.director_signature_meta}
                        </p>
                      )}
                    </div>
                    {prestacion.director_approved_at ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-[10px]">
                        Aprobado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Ver Planilla Oficial PDF */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-slate-100">
                    Planilla Oficial de Prestaciones CISB
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Incluye detalle de horas/guardias cumplidas y firmas digitales estampadas
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerPlanillaOficial}
                  className="text-xs flex items-center gap-1.5 border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Abrir Planilla Oficial
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: TRAZABILIDAD & HISTORIAL */}
            <TabsContent value="historial" className="space-y-3 m-0">
              {historial.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No hay registros de eventos u observaciones en esta presentación.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historial.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-slate-100">
                          {ev.autor_nombre} ({ev.rol_emisor?.replace("_", " ").toUpperCase()})
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(ev.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                        {ev.motivo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {prestacion.status === "aprobado" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onObservarFiscal(prestacion);
                  }}
                  className="text-xs border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Observar Comprobante ARCA
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onRegistrarPago(prestacion);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Registrar Pago / Liquidar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

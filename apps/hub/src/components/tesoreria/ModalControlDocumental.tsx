"use client";

import { useState, useEffect } from "react";
import { PrestacionTesoreriaItem } from "@/types/tesoreria";
import {
  CONDICIONES_FISCALES_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
} from "@/types/prestadores";
import {
  getPresentacionFileUrl,
  getPerfilFileUrl,
} from "@/lib/services/prestadoresService";
import {
  bloquearPrestacionParaRevision,
  liberarBloqueoPrestacion,
  conformarPrestacionTesoreria,
} from "@/lib/services/tesoreriaService";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  FileCheck2,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Lock,
  Calculator,
  ShieldCheck,
  Building2,
  CreditCard,
  Loader2,
  User,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";

interface ModalControlDocumentalProps {
  isOpen: boolean;
  onClose: () => void;
  prestacion: PrestacionTesoreriaItem | null;
  onConformado: () => void;
  onObservar: (prestacion: PrestacionTesoreriaItem) => void;
}

export function ModalControlDocumental({
  isOpen,
  onClose,
  prestacion,
  onConformado,
  onObservar,
}: ModalControlDocumentalProps) {
  const [retencionIibb, setRetencionIibb] = useState<number>(0);
  const [retencionGanancias, setRetencionGanancias] = useState<number>(0);
  const [retencionSuss, setRetencionSuss] = useState<number>(0);
  const [retencionOtras, setRetencionOtras] = useState<number>(0);
  const [retencionOtrasConcepto, setRetencionOtrasConcepto] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && prestacion) {
      // Bloquear registro para este operador
      bloquearPrestacionParaRevision(prestacion.id).catch((err) => {
        toast.warning(err?.message || "Aviso de revisión simultánea");
      });

      // Cargar retenciones manuales previas si ya existen
      setRetencionIibb(Number(prestacion.retencion_iibb) || 0);
      setRetencionGanancias(Number(prestacion.retencion_ganancias) || 0);
      setRetencionSuss(Number(prestacion.retencion_suss) || 0);
      setRetencionOtras(Number(prestacion.retencion_otras) || 0);
      setRetencionOtrasConcepto(prestacion.retencion_otras_concepto || "");
    }
  }, [isOpen, prestacion]);

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

  const montoBruto = Number(prestacion.invoice_amount) || 0;
  const totalRetenciones =
    (Number(retencionIibb) || 0) +
    (Number(retencionGanancias) || 0) +
    (Number(retencionSuss) || 0) +
    (Number(retencionOtras) || 0);
  const montoNeto = Math.max(0, montoBruto - totalRetenciones);

  const isYaConformado = prestacion.treasury_check_status === "conformado";

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleClose = async () => {
    if (!isYaConformado) {
      await liberarBloqueoPrestacion(prestacion.id);
    }
    onClose();
  };

  const handleConfirmarConformado = async () => {
    try {
      setIsSubmitting(true);
      await conformarPrestacionTesoreria(prestacion.id, {
        retencionIibb: Number(retencionIibb) || 0,
        retencionGanancias: Number(retencionGanancias) || 0,
        retencionSuss: Number(retencionSuss) || 0,
        retencionOtras: Number(retencionOtras) || 0,
        retencionOtrasConcepto: retencionOtrasConcepto.trim(),
        retencionMonto: totalRetenciones,
        montoNeto,
      });
      toast.success(
        isYaConformado
          ? "Conformación y retenciones actualizadas correctamente."
          : "Trámite verificado y conformado. Listo para incorporar al Lote."
      );
      onConformado();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al conformar trámite");
    } finally {
      setIsSubmitting(false);
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

  const handleVerPlanillaOficial = () => {
    const html = generarPlanillaOficialHTML(prestacion, perfil);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 pr-12 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 flex-wrap">
                  Control Documental & Retenciones
                  {isYaConformado ? (
                    <Badge className="bg-emerald-600 text-white border-emerald-500 text-[10px]">
                      Conformado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300 flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" /> En revisión exclusiva
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Trámite Nº {prestacion.form_number || prestacion.id} • {nombrePrestador}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Facturado</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {formatMoney(montoBruto)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. Checklist de Control Documental */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              1. Verificación Documental (Conducta Fiscal + Factura ARCA + Planilla)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Factura ARCA */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Factura Electrónica ARCA
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {prestacion.invoice_number || "S/N"}
                  </Badge>
                </div>
                <div className="text-gray-500 space-y-0.5 text-[11px]">
                  <div><strong>Monto:</strong> {formatMoney(montoBruto)}</div>
                  <div><strong>Fecha Emisión:</strong> {prestacion.invoice_date || "-"}</div>
                </div>
                {facturaUrl ? (
                  <a
                    href={facturaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <Download className="h-3 w-3" /> Ver Factura Adjunta
                  </a>
                ) : (
                  <span className="text-[11px] text-rose-500 font-medium">Sin archivo de factura</span>
                )}
              </div>

              {/* Conducta Fiscal DGR */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Conducta Fiscal (DGR SDE)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {prestacion.conducta_fiscal_due_date ? `Vto: ${prestacion.conducta_fiscal_due_date}` : "Sin fecha"}
                  </Badge>
                </div>
                <div className="text-gray-500 space-y-0.5 text-[11px]">
                  <div><strong>CUIT:</strong> {perfil?.cuit || "No informado"}</div>
                  <div><strong>Condición:</strong> {perfil?.tax_condition ? CONDICIONES_FISCALES_MAP[perfil.tax_condition] : "Monotributo"}</div>
                </div>
                {conductaFiscalUrl ? (
                  <a
                    href={conductaFiscalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <Download className="h-3 w-3" /> Ver Certificado DGR
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-600 font-medium">Sin certificado adjunto</span>
                )}
              </div>
            </div>

            {/* Planilla Asistencial */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Planilla Asistencial Digital
                </div>
                <div className="text-[11px] text-gray-500">
                  {srvLabel} • {prestacion.director_signature_meta || "Firmado por Dirección Asistencial"}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleVerPlanillaOficial}
                className="h-7 text-xs border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-300"
              >
                Abrir Planilla Firmada
              </Button>
            </div>
          </div>

          {/* 2. Carga Manual de Retenciones Impositivas (DGR / AFIP) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                2. Carga de Retenciones Manuales (DGR Santiago / AFIP)
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-slate-400">
                CBU: <strong className="text-gray-900 dark:text-slate-100">{perfil?.cbu_alias || "Sin CBU"}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              {/* Retención Ingresos Brutos */}
              <div className="space-y-1">
                <Label htmlFor="retIIBB" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  Ret. Ingresos Brutos ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-xs text-gray-400 font-mono">$</span>
                  <Input
                    id="retIIBB"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={retencionIibb || ""}
                    onChange={(e) => setRetencionIibb(parseFloat(e.target.value) || 0)}
                    className="h-8 pl-6 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Retención Ganancias */}
              <div className="space-y-1">
                <Label htmlFor="retGan" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  Ret. Ganancias ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-xs text-gray-400 font-mono">$</span>
                  <Input
                    id="retGan"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={retencionGanancias || ""}
                    onChange={(e) => setRetencionGanancias(parseFloat(e.target.value) || 0)}
                    className="h-8 pl-6 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Retención SUSS / Nómina */}
              <div className="space-y-1">
                <Label htmlFor="retSuss" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  Ret. SUSS / Cargas ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-xs text-gray-400 font-mono">$</span>
                  <Input
                    id="retSuss"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={retencionSuss || ""}
                    onChange={(e) => setRetencionSuss(parseFloat(e.target.value) || 0)}
                    className="h-8 pl-6 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Otras Retenciones / Embargos Judiciales / Deducciones Especiales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <Label htmlFor="retOtras" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Otras Retenciones ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-xs text-gray-400 font-mono">$</span>
                  <Input
                    id="retOtras"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={retencionOtras || ""}
                    onChange={(e) => setRetencionOtras(parseFloat(e.target.value) || 0)}
                    className="h-8 pl-6 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="retOtrasConc" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  Concepto / Motivo de Otra Retención (opcional)
                </Label>
                <Input
                  id="retOtrasConc"
                  type="text"
                  placeholder="Ej: Embargo Judicial Oficio Nº 142/26, Aporte Colegio Médico..."
                  value={retencionOtrasConcepto}
                  onChange={(e) => setRetencionOtrasConcepto(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Totalizador de Retenciones y Neto BSE */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="p-2 rounded bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-gray-500 block">Total Retenciones Impositivas</span>
                <span className="font-bold font-mono text-rose-600 text-sm">
                  - {formatMoney(totalRetenciones)}
                </span>
              </div>

              <div className="p-2 rounded bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-right">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-semibold">
                  Neto a Liquidar en BSE
                </span>
                <span className="font-extrabold font-mono text-emerald-800 dark:text-emerald-200 text-sm">
                  {formatMoney(montoNeto)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="text-xs"
          >
            Liberar y Cerrar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onObservar(prestacion);
              }}
              className="text-xs border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Observar Trámite
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirmarConformado}
              disabled={isSubmitting}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                </>
              ) : isYaConformado ? (
                <>
                  <Edit3 className="h-3.5 w-3.5" /> Actualizar Conformación
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Conformar para Lote
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

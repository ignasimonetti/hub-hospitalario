"use client";

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
  const proofUrl = getPrestacionFileUrl(prestacion, prestacion.file_service_proof);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Factura {prestacion.invoice_number}
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
                Fecha de Emisión
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {formatDate(prestacion.invoice_date)}
              </p>
            </div>
          </div>

          {/* Detalle de Prestación */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Tipo de Prestación:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {TIPOS_PRESTACION_MAP[prestacion.service_type]}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Días Trabajados:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {prestacion.service_days_detail || "Mes completo"}
              </span>
            </div>

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

              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-indigo-600" /> Planilla / Constancia de Prestación (PDF)
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>
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

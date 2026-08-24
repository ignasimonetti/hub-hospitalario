"use client";

import { useState } from "react";
import { LoteTesoreria, PrestacionTesoreriaItem } from "@/types/tesoreria";
import {
  exportarDetalleLote,
  ModoExportDetalle,
  FormatoExportDetalle,
} from "@/lib/services/detalleLoteExportService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ModalExportarDetalleLoteProps {
  isOpen: boolean;
  onClose: () => void;
  lote: LoteTesoreria;
  prestacionesDelLote: PrestacionTesoreriaItem[];
}

export function ModalExportarDetalleLote({
  isOpen,
  onClose,
  lote,
  prestacionesDelLote,
}: ModalExportarDetalleLoteProps) {
  const [modo, setModo] = useState<ModoExportDetalle>("bancario");
  const [formato, setFormato] = useState<FormatoExportDetalle>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportar = () => {
    if (prestacionesDelLote.length === 0) {
      toast.error("El lote no tiene prestaciones vinculadas.");
      return;
    }

    try {
      setIsExporting(true);
      exportarDetalleLote({
        prestaciones: prestacionesDelLote,
        numeroLote: lote.numero_lote,
        expedienteGde: lote.numero_expediente_gde,
        modo,
        formato,
      });
      const modoLabel =
        modo === "bancario" ? "Bancario" : "Contable Completo";
      toast.success(
        `Detalle ${modoLabel} ${
          formato === "pdf" ? "generado para impresión/PDF" : `exportado en ${formato.toUpperCase()}`
        }.`
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al exportar el detalle del lote");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (!val && !isExporting) onClose();
      }}
    >
      <DialogContent className="max-w-md p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 pr-12 border-b border-slate-100 dark:border-slate-800">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Exportar Detalle
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {lote.numero_lote} • {prestacionesDelLote.length} registros
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          {/* Modo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contenido del archivo
            </Label>
            <Select value={modo} onValueChange={(v: ModoExportDetalle) => setModo(v)}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bancario" className="text-xs">
                  Bancario — mínimo para transferencias
                </SelectItem>
                <SelectItem value="contable" className="text-xs">
                  Contable Completo — con retenciones y trazabilidad
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">
              {modo === "bancario"
                ? "Orden, CUIT, Beneficiario, CBU/Alias, Condición Fiscal e Importe Neto."
                : "Incluye retenciones desglosadas, expediente GDE, facturas y fechas."}
            </p>
          </div>

          {/* Formato */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Formato de salida
            </Label>
            <Select
              value={formato}
              onValueChange={(v: FormatoExportDetalle) => setFormato(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" className="text-xs">
                  CSV (.csv) — compatible Excel
                </SelectItem>
                <SelectItem value="xlsx" className="text-xs">
                  Excel (.xlsx)
                </SelectItem>
                <SelectItem value="pdf" className="text-xs">
                  PDF / Impresión
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleExportar} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

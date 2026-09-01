"use client";

import { useState } from "react";
import { PrestacionTesoreriaItem, CrearLotePayload } from "@/types/tesoreria";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  FileText,
  Building2,
  FolderOpen,
  Calculator,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ModalCrearLoteGDEProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: PrestacionTesoreriaItem[];
  onConfirm: (payload: CrearLotePayload) => Promise<void>;
  periodoMes: number;
  periodoAnio: number;
}

export function ModalCrearLoteGDE({
  isOpen,
  onClose,
  selectedItems,
  onConfirm,
  periodoMes,
  periodoAnio,
}: ModalCrearLoteGDEProps) {
  const [numeroLote, setNumeroLote] = useState(`LOTE 4 JUNIO 2026`);
  const [numeroExpedienteGde, setNumeroExpedienteGde] = useState(
    `EX-2026-03181067- -GDESDE-CISB#MS`
  );
  const [descripcion, setDescripcion] = useState(
    `Honorarios profesionales correspondientes al período del CISB`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montoBruto = selectedItems.reduce(
    (acc, cur) => acc + (Number(cur.invoice_amount) || 0),
    0
  );
  const montoRetenciones = selectedItems.reduce(
    (acc, cur) => acc + (Number(cur.retencion_monto) || 0),
    0
  );
  const montoNeto = montoBruto - montoRetenciones;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroLote.trim()) {
      toast.error("Por favor ingrese el identificador o nombre del lote.");
      return;
    }
    if (!numeroExpedienteGde.trim()) {
      toast.error("Por favor ingrese el número de expediente electrónico GDE.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm({
        numeroLote: numeroLote.trim(),
        numeroExpedienteGde: numeroExpedienteGde.trim(),
        descripcion: descripcion.trim(),
        periodoMes,
        periodoAnio,
        prestacionesIds: selectedItems.map((p) => p.id),
      });
      toast.success(
        `Lote creado y expediente GDE asignado masivamente a ${selectedItems.length} prestaciones.`
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al crear lote GDE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/80 dark:bg-[#1f1f1f]/80 p-5 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-[#2b2b2b] rounded-lg border border-[#e6e6e6] dark:border-[#383838] text-[#615d59] dark:text-[#a39e98]">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#000000] dark:text-white tracking-tight">
                Crear Lote GDE
              </DialogTitle>
              <DialogDescription className="text-[#615d59] dark:text-[#a39e98] text-xs mt-0.5">
                Propagación masiva de carátula a {selectedItems.length} prestaciones conformadas
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Resumen Financiero del Lote */}
          <div className="p-3.5 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/60 dark:bg-[#1f1f1f]/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#31302e] dark:text-slate-300">
                Total de Prestaciones en el Lote:
              </span>
              <Badge variant="outline" className="bg-white dark:bg-[#2b2b2b] text-[#000000] dark:text-white font-semibold border-[#e6e6e6] dark:border-[#383838]">
                {selectedItems.length} trámites
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e6e6e6] dark:border-[#2e2e2e] text-xs">
              <div>
                <span className="text-[10px] text-[#615d59] dark:text-[#a39e98] block">Total Bruto Facturado</span>
                <span className="font-bold font-mono text-[#000000] dark:text-white">
                  {formatMoney(montoBruto)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#615d59] dark:text-[#a39e98] block">Total Retenciones</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  - {formatMoney(montoRetenciones)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#1aae39] dark:text-emerald-400 block font-semibold">
                  Neto a Liquidar
                </span>
                <span className="font-extrabold font-mono text-[#1aae39] dark:text-emerald-400">
                  {formatMoney(montoNeto)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="numeroLote" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Nombre / Identificador del Lote <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="numeroLote"
                placeholder="Ej: LOTE 4 JUNIO 2026"
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
                className="text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="numeroExpedienteGde" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Número de Expediente Electrónico GDE <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="numeroExpedienteGde"
                placeholder="Ej: EX-2026-03181067- -GDESDE-CISB#MS"
                value={numeroExpedienteGde}
                onChange={(e) => setNumeroExpedienteGde(e.target.value)}
                className="text-xs font-mono"
                required
              />
              <p className="text-[11px] text-[#615d59] dark:text-[#a39e98]">
                <strong>Propagación Masiva:</strong> Este número de expediente se guardará automáticamente en las {selectedItems.length} prestaciones vinculadas.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Descripción / Motivo del Trámite GDE
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Honorarios profesionales asistenciales..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-[#e6e6e6] dark:border-[#2e2e2e] gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#000000] hover:bg-[#2e2e2e] dark:bg-white dark:hover:bg-slate-200 dark:text-[#000000] text-white font-medium rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creando Lote...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Crear Lote & Asignar a {selectedItems.length} Trámites
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

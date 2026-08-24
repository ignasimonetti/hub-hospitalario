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
  Sparkles,
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
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                Caratular & Crear Lote de Expediente GDE
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-xs mt-0.5">
                Propagación masiva de carátula a {selectedItems.length} prestaciones conformadas
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Resumen Financiero del Lote */}
          <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-300">
                Total de Prestaciones en el Lote:
              </span>
              <Badge className="bg-blue-600 text-white font-bold">
                {selectedItems.length} trámites
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 block">Total Bruto Facturado</span>
                <span className="font-bold font-mono text-gray-900 dark:text-slate-100">
                  {formatMoney(montoBruto)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Total Retenciones</span>
                <span className="font-bold font-mono text-rose-600">
                  - {formatMoney(montoRetenciones)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                  Neto a Liquidar (BSE)
                </span>
                <span className="font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
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
              <p className="text-[11px] text-gray-500">
                ✨ <strong>Propagación Masiva:</strong> Este número de expediente se guardará automáticamente en las {selectedItems.length} prestaciones vinculadas.
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

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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

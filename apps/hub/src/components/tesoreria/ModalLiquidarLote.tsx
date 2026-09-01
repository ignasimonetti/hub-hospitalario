"use client";

import { useState } from "react";
import { PrestacionTesoreriaItem, LiquidarLotePayload } from "@/types/tesoreria";
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
  CheckCircle2,
  Receipt,
  Loader2,
  Layers,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ModalLiquidarLoteProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: PrestacionTesoreriaItem[];
  onConfirm: (ids: string[], payload: LiquidarLotePayload) => Promise<void>;
}

export function ModalLiquidarLote({
  isOpen,
  onClose,
  selectedItems,
  onConfirm,
}: ModalLiquidarLoteProps) {
  const [batchReceiptNumber, setBatchReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalMonto = selectedItems.reduce(
    (acc, cur) => acc + (Number(cur.invoice_amount) || 0),
    0
  );

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchReceiptNumber.trim()) {
      toast.error("Por favor ingrese el número de lote o comprobante general.");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("No hay trámites seleccionados para liquidar.");
      return;
    }

    try {
      setIsSubmitting(true);
      const ids = selectedItems.map((item) => item.id);
      await onConfirm(ids, {
        batchReceiptNumber: batchReceiptNumber.trim(),
        paymentDate,
        notes: notes.trim(),
      });
      toast.success(
        `Lote de ${selectedItems.length} prestaciones liquidado exitosamente.`
      );
      onClose();
      setBatchReceiptNumber("");
      setNotes("");
    } catch (err: any) {
      toast.error(err?.message || "Error al liquidar lote de prestaciones");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/80 dark:bg-[#1f1f1f]/80 p-5 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-[#2b2b2b] rounded-lg border border-[#e6e6e6] dark:border-[#383838] text-[#615d59] dark:text-[#a39e98]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#000000] dark:text-white tracking-tight">
                Liquidar Lote Masivo de Honorarios
              </DialogTitle>
              <DialogDescription className="text-[#615d59] dark:text-[#a39e98] text-xs mt-0.5">
                Procesamiento simultáneo de transferencias
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Resumen del Lote */}
          <div className="p-3.5 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/60 dark:bg-[#1f1f1f]/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#31302e] dark:text-slate-300">
                Trámites a Liquidar:
              </span>
              <Badge variant="outline" className="bg-white dark:bg-[#2b2b2b] text-[#000000] dark:text-white font-semibold border-[#e6e6e6] dark:border-[#383838]">
                {selectedItems.length} órdenes seleccionadas
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#e6e6e6] dark:border-[#2e2e2e]">
              <span className="text-xs text-[#615d59] dark:text-[#a39e98]">Total a Acreditar:</span>
              <span className="text-base font-extrabold text-[#1aae39] dark:text-emerald-400 font-mono">
                {formatMoney(totalMonto)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="batchReceiptNumber" className="text-xs font-semibold">
                Nº de Lote / Orden de Pago Bancaria <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="batchReceiptNumber"
                placeholder="Ej: LOTE-BANCO-2026-08A o OP-LOTE-0091"
                value={batchReceiptNumber}
                onChange={(e) => setBatchReceiptNumber(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentDate" className="text-xs font-semibold">
                Fecha de Pago Efectiva <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Observaciones Generales de la Liquidación (Opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Ej: Acreditado vía archivo de lote Banco Santiago del Estero (BSE)."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                  Liquidando Lote...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Liquidar {selectedItems.length} Trámites
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

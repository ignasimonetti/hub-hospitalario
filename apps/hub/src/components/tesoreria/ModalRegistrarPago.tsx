"use client";

import { useState } from "react";
import { PrestacionTesoreriaItem, RegistrarPagoPayload } from "@/types/tesoreria";
import { SECTORES_SERVICIO_MAP, SectorServicio, CONDICIONES_FISCALES_MAP } from "@/types/prestadores";
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
  DollarSign,
  CheckCircle2,
  Calendar,
  FileCheck2,
  Building2,
  User,
  CreditCard,
  UploadCloud,
  Loader2,
  Receipt,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface ModalRegistrarPagoProps {
  isOpen: boolean;
  onClose: () => void;
  prestacion: PrestacionTesoreriaItem | null;
  onConfirm: (id: string, payload: RegistrarPagoPayload) => Promise<void>;
}

export function ModalRegistrarPago({
  isOpen,
  onClose,
  prestacion,
  onConfirm,
}: ModalRegistrarPagoProps) {
  const [paymentMethod, setPaymentMethod] = useState<"transferencia" | "cheque" | "otro">("transferencia");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [fileProof, setFileProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identificador = paymentMethod === "cheque" ? chequeNumber.trim() : receiptNumber.trim();
    if (!identificador) {
      toast.error(
        paymentMethod === "cheque"
          ? "Por favor ingrese el número de cheque."
          : "Por favor ingrese el número de transferencia o referencia bancaria."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(prestacion.id, {
        receiptNumber: identificador,
        paymentDate,
        paymentMethod,
        chequeNumber: paymentMethod === "cheque" ? chequeNumber.trim() : undefined,
        notes: notes.trim(),
        fileProof,
      });
      toast.success("Pago registrado exitosamente. La orden pasó a estado 'Pagado'.");
      onClose();
      // Reset form
      setReceiptNumber("");
      setChequeNumber("");
      setNotes("");
      setFileProof(null);
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800">
        <div className="border-b border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/80 dark:bg-[#1f1f1f]/80 p-5 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-[#2b2b2b] rounded-lg border border-[#e6e6e6] dark:border-[#383838] text-[#615d59] dark:text-[#a39e98]">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#000000] dark:text-white">
                Registrar Pago Individual de Factura
              </DialogTitle>
              <DialogDescription className="text-xs text-[#615d59] dark:text-[#a39e98] mt-0.5">
                Asocie el comprobante de transferencia bancaria o número de cheque a este profesional
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Ficha Resumen de la Prestación */}
          <div className="bg-[#f6f5f4]/50 dark:bg-[#1f1f1f]/40 border border-[#e6e6e6] dark:border-[#2e2e2e] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                {nombrePrestador}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Neto: {formatMoney(Number(prestacion.monto_neto_liquidable || prestacion.invoice_amount) || 0)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-gray-500 dark:text-slate-400">CUIT:</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {perfil?.cuit || "No informado"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">Período:</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {String(prestacion.period_month).padStart(2, "0")}/{prestacion.period_year}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">CBU / Alias:</span>{" "}
                <span className="font-mono text-[11px] font-semibold text-gray-800 dark:text-slate-200">
                  {perfil?.cbu_alias || "Sin CBU"}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Pago */}
          <div className="space-y-3">
            {/* Selector de Medio de Pago */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Medio de Pago Utilizado <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transferencia")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    paymentMethod === "transferencia"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  Transferencia BSE
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cheque")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    paymentMethod === "cheque"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  Cheque Librado
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("otro")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    paymentMethod === "otro"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  Otro Medio
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Fecha Efectiva de Pago <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  {paymentMethod === "cheque"
                    ? "Nº de Cheque"
                    : paymentMethod === "transferencia"
                    ? "Nº de Transferencia / Transacción BSE"
                    : "Nº de Comprobante / Referencia"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                {paymentMethod === "cheque" ? (
                  <Input
                    placeholder="Ej: CHQ-0482910"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    required
                    className="text-xs h-9 font-mono"
                  />
                ) : (
                  <Input
                    placeholder="Ej: BSE-TX-99882211"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    required
                    className="text-xs h-9 font-mono"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Observaciones / Imputación (Opcional)
              </label>
              <Textarea
                placeholder="Detalles sobre cuenta bancaria de débito, retenciones o notas contables..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            {/* Adjuntar Comprobante */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Adjuntar Comprobante Individual (PDF / Imagen)
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <input
                  type="file"
                  id="fileProofInput"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="fileProofInput"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <UploadCloud className="h-5 w-5 text-slate-400" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {fileProof
                      ? fileProof.name
                      : "Seleccionar ticket bancario o copia de cheque (PDF/JPG)"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PDF, JPG o PNG hasta 10MB
                  </span>
                </label>
              </div>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Confirmar Liquidación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

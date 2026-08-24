"use client";

import { useState } from "react";
import {
  PrestacionTesoreriaItem,
  ObservarFiscalPayload,
  CategoriaObservacionFiscal,
  CATEGORIAS_OBSERVACION_FISCAL,
} from "@/types/tesoreria";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  FileWarning,
  ShieldCheck,
  Loader2,
  Info,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface ModalObservarFiscalProps {
  isOpen: boolean;
  onClose: () => void;
  prestacion: PrestacionTesoreriaItem | null;
  onConfirm: (id: string, payload: ObservarFiscalPayload) => Promise<void>;
}

export function ModalObservarFiscal({
  isOpen,
  onClose,
  prestacion,
  onConfirm,
}: ModalObservarFiscalProps) {
  const [categoria, setCategoria] = useState<CategoriaObservacionFiscal>("monto_discordante");
  const [motivoDetallado, setMotivoDetallado] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!prestacion) return null;

  const user = prestacion.expand?.user;
  const nombrePrestador = user
    ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
    : "Prestador Asistencial";

  const handleCategoriaChange = (val: string) => {
    const cat = val as CategoriaObservacionFiscal;
    setCategoria(cat);
    const catObj = CATEGORIAS_OBSERVACION_FISCAL.find((c) => c.id === cat);
    if (catObj && !motivoDetallado) {
      setMotivoDetallado(catObj.descripcion);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoDetallado.trim()) {
      toast.error("Por favor ingrese el detalle explicativo de la observación fiscal.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(prestacion.id, {
        categoria,
        motivoDetallado: motivoDetallado.trim(),
      });
      toast.success("Observación fiscal registrada. El trámite fue devuelto al prestador.");
      onClose();
      setMotivoDetallado("");
    } catch (err: any) {
      toast.error(err?.message || "Error al emitir la observación fiscal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 p-5 pr-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                Observar Trámite
              </DialogTitle>
              <DialogDescription className="text-amber-100 text-xs mt-0.5">
                Trámite Nº {prestacion.form_number || prestacion.id} • {nombrePrestador}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Banner Explicativo de Conservación de Firmas Asistenciales */}
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex gap-2.5 items-start">
            <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Preservación de Visados Médicos:</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Esta observación <strong>no anulará las firmas de Dirección</strong>. Cuando el prestador reemplace el comprobante ARCA y reenvíe, volverá directamente a Tesorería en estado <em>Aprobado</em> sin requerir nuevo visado asistencial.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Tipo de Inconsistencia Fiscal <span className="text-rose-500">*</span>
              </Label>
              <Select value={categoria} onValueChange={handleCategoriaChange}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Seleccione el motivo de observación" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_OBSERVACION_FISCAL.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motivoDetallado" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Instrucciones y Detalle para el Prestador <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="motivoDetallado"
                placeholder="Indique con claridad qué corrección debe realizar en su facturación (ej: anular comprobante con Nota de Crédito y emitir nueva factura con importe $X)..."
                value={motivoDetallado}
                onChange={(e) => setMotivoDetallado(e.target.value)}
                rows={4}
                className="text-xs resize-none"
                required
              />
              <p className="text-[11px] text-gray-500">
                Este mensaje aparecerá destacado en el panel del prestador para guiar su subsanación.
              </p>
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
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Observando...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                  Confirmar y Devolver al Prestador
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

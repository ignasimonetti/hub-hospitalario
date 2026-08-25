"use client";

import { useState, useEffect } from "react";
import { LoteTesoreria, PrestacionTesoreriaItem, OrdenDePagoConfigPayload } from "@/types/tesoreria";
import {
  generarOrdenDePagoHTML,
  guardarOrdenDePagoConfigLote,
} from "@/lib/services/tesoreriaService";
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
import {
  ClipboardList,
  Building2,
  Landmark,
  FileText,
  Loader2,
  Printer,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ModalConfigurarOrdenDePagoProps {
  isOpen: boolean;
  onClose: () => void;
  lote: LoteTesoreria | null;
  prestacionesDelLote: PrestacionTesoreriaItem[];
  onRefresh: () => Promise<void>;
}

export function ModalConfigurarOrdenDePago({
  isOpen,
  onClose,
  lote,
  prestacionesDelLote,
  onRefresh,
}: ModalConfigurarOrdenDePagoProps) {
  const [numeroOP, setNumeroOP] = useState("");
  const [anioOP, setAnioOP] = useState(new Date().getFullYear());
  const [expedienteGDE, setExpedienteGDE] = useState("");
  const [numeroResolucion, setNumeroResolucion] = useState("");
  const [fechaResolucion, setFechaResolucion] = useState("");
  const [jurisdiccion, setJurisdiccion] = useState("63");
  const [programa, setPrograma] = useState("11 - PREVENCION, PROMOCION, PROTECCION, RECUPERACION Y REHABILITACION DE LA SALUD");
  const [actividad, setActividad] = useState("ACT 1");
  const [partida, setPartida] = useState("PART 341");
  const [fuenteFinanciamiento, setFuenteFinanciamiento] = useState("REMESAS DEL TESORO");
  const [bancoNombre, setBancoNombre] = useState("BSE - CUENTA CORRIENTE");
  const [cuentaBancaria, setCuentaBancaria] = useState("1255424/86");
  const [observaciones, setObservaciones] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar con valores existentes del lote o valores por defecto
  useEffect(() => {
    if (lote) {
      const cfg = lote.op_config;
      setNumeroOP(cfg?.numero_op || lote.numero_orden_pago || "");
      setAnioOP(cfg?.anio_op || lote.periodo_anio || new Date().getFullYear());
      setExpedienteGDE(cfg?.expediente_gde || lote.numero_expediente_gde || "");
      setNumeroResolucion(cfg?.numero_resolucion || lote.numero_resolucion || "");
      setFechaResolucion(cfg?.fecha_resolucion || lote.fecha_resolucion || "");
      setJurisdiccion(cfg?.jurisdiccion || "63");
      setPrograma(cfg?.programa || "11 - PREVENCION, PROMOCION, PROTECCION, RECUPERACION Y REHABILITACION DE LA SALUD");
      setActividad(cfg?.actividad || "ACT 1");
      setPartida(cfg?.partida || "PART 341");
      setFuenteFinanciamiento(cfg?.fuente_financiamiento || "REMESAS DEL TESORO");
      setBancoNombre(cfg?.banco_nombre || "BSE - CUENTA CORRIENTE");
      setCuentaBancaria(cfg?.cuenta_bancaria || "1255424/86");
      setObservaciones(cfg?.observaciones || "");
    }
  }, [lote, isOpen]);

  if (!lote) return null;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);

  const handleGuardarYGenerar = async () => {
    if (!numeroOP.trim()) {
      toast.error("Por favor ingrese el Número de Orden de Pago.");
      return;
    }

    const payload: OrdenDePagoConfigPayload = {
      numero_op: numeroOP.trim(),
      anio_op: Number(anioOP) || new Date().getFullYear(),
      expediente_gde: expedienteGDE.trim(),
      numero_resolucion: numeroResolucion.trim(),
      fecha_resolucion: fechaResolucion.trim(),
      jurisdiccion: jurisdiccion.trim(),
      programa: programa.trim(),
      actividad: actividad.trim(),
      partida: partida.trim(),
      fuente_financiamiento: fuenteFinanciamiento.trim(),
      banco_nombre: bancoNombre.trim(),
      cuenta_bancaria: cuentaBancaria.trim(),
      observaciones: observaciones.trim(),
    };

    try {
      setIsSaving(true);
      await guardarOrdenDePagoConfigLote(lote.id, payload);
      
      const html = generarOrdenDePagoHTML(lote, prestacionesDelLote, payload);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }

      toast.success(`Orden de Pago N° ${payload.numero_op} consolidada y generada exitosamente.`);
      await onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar y generar la Orden de Pago");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
            <ClipboardList className="w-5 h-5" />
            Consolidar y Generar Orden de Pago (OP Global)
          </div>
          <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {lote.numero_lote} — {prestacionesDelLote.length} Prestadores
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete los datos contables, presupuestarios y bancarios emitidos en el expediente electrónico para emitir la Orden de Pago oficial.
          </DialogDescription>
        </div>

        <div className="p-5 space-y-4">
          {/* Banner Informativo */}
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>Cierre Implícito del Lote:</strong> Al guardar y consolidar la Orden de Pago, el lote se cerrará automáticamente para evitar que se sigan incorporando o quitando prestaciones.
            </div>
          </div>

          {/* Resumen Financiero del Lote */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Bruto</div>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                {formatMoney(lote.monto_bruto_total)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-rose-500 uppercase font-semibold">Retenciones</div>
              <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                -{formatMoney(lote.monto_retenciones_total)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-600 uppercase font-semibold">Neto a Pagar</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney(lote.monto_neto_total)}
              </div>
            </div>
          </div>

          {/* Sección 1: Identificación de la OP y Acto Administrativo */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              1. Identificación de la Orden de Pago y Expediente
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Nº Orden de Pago <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="ej: 3930"
                  value={numeroOP}
                  onChange={(e) => setNumeroOP(e.target.value)}
                  className="h-8 text-xs font-mono font-bold bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Año de Ejercicio
                </Label>
                <Input
                  type="number"
                  value={anioOP}
                  onChange={(e) => setAnioOP(Number(e.target.value))}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Nº Expediente GDE
                </Label>
                <Input
                  placeholder="EX-2026-..."
                  value={expedienteGDE}
                  onChange={(e) => setExpedienteGDE(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Nº Resolución / Disposición (Acto Administrativo)
                </Label>
                <Input
                  placeholder="ej: RESOL-2026-2157-E-GDESDE-CISB#MS"
                  value={numeroResolucion}
                  onChange={(e) => setNumeroResolucion(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Fecha de Resolución
                </Label>
                <Input
                  type="date"
                  value={fechaResolucion}
                  onChange={(e) => setFechaResolucion(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Imputación Presupuestaria */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              2. Imputación Presupuestaria (Afectación de Partidas)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Jurisdicción
                </Label>
                <Input
                  value={jurisdiccion}
                  onChange={(e) => setJurisdiccion(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Actividad Presupuestaria
                </Label>
                <Input
                  placeholder="ej: ACT 1"
                  value={actividad}
                  onChange={(e) => setActividad(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Partida Presupuestaria
                </Label>
                <Input
                  placeholder="ej: PART 341"
                  value={partida}
                  onChange={(e) => setPartida(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Programa Presupuestario
              </Label>
              <Input
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-slate-900 mt-1"
              />
            </div>
          </div>

          {/* Sección 3: Datos Bancarios y Fuente de Financiamiento */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              3. Cuenta Pagadora y Fuente de Financiamiento
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Banco y Tipo de Cuenta
                </Label>
                <Input
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Nº de Cuenta Débito
                </Label>
                <Input
                  value={cuentaBancaria}
                  onChange={(e) => setCuentaBancaria(e.target.value)}
                  className="h-8 text-xs font-mono font-bold bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Fuente de Financiamiento
                </Label>
                <Input
                  value={fuenteFinanciamiento}
                  onChange={(e) => setFuenteFinanciamiento(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGuardarYGenerar}
            disabled={isSaving || !numeroOP.trim()}
            className="text-xs bg-[#08487A] hover:bg-[#06375d] text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            Consolidar y Generar Orden de Pago PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

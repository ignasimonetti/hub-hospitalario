"use client";

import { useState } from "react";
import { LoteTesoreria, PrestacionTesoreriaItem, ESTADOS_LOTE_CONFIG } from "@/types/tesoreria";
import {
  generarPlanillaResumenLoteHTML,
  generarOrdenDePagoHTML,
  liquidarLotePrestaciones,
  quitarPrestacionDeLote,
  eliminarLoteTesoreria,
  toggleCierreLoteTesoreria,
  ESTADOS_LOTE_ABIERTO,
} from "@/lib/services/tesoreriaService";
import { ModalExportarDetalleLote } from "@/components/tesoreria/ModalExportarDetalleLote";
import { ModalConfigurarOrdenDePago } from "@/components/tesoreria/ModalConfigurarOrdenDePago";
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
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Loader2,
  Check,
  Trash2,
  UserMinus,
  Lock,
  Unlock,
  Receipt,
  FileCheck2,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface ModalDetalleLoteGDEProps {
  isOpen: boolean;
  onClose: () => void;
  lote: LoteTesoreria | null;
  prestacionesDelLote: PrestacionTesoreriaItem[];
  onRefresh: () => Promise<void>;
}

export function ModalDetalleLoteGDE({
  isOpen,
  onClose,
  lote,
  prestacionesDelLote,
  onRefresh,
}: ModalDetalleLoteGDEProps) {
  const [isPayingLote, setIsPayingLote] = useState(false);
  const [isTogglingCierre, setIsTogglingCierre] = useState(false);
  const [isConfigOPOpen, setIsConfigOPOpen] = useState(false);
  const [comprobantePagoBSE, setComprobantePagoBSE] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!lote) return null;

  const estaAbierto = ESTADOS_LOTE_ABIERTO.includes(lote.estado);
  const estaPagado = lote.estado === "pagado_bse" || Boolean(lote.comprobante_pago_bse);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const estadoCfg = ESTADOS_LOTE_CONFIG[lote.estado] || {
    label: lote.estado,
    bgLight: "bg-slate-100 border-slate-200",
    textDark: "text-slate-700",
  };

  const handleToggleCierre = async () => {
    if (estaPagado) return;
    try {
      setIsTogglingCierre(true);
      const updated = await toggleCierreLoteTesoreria(lote.id);
      if (updated.estado === "cerrado") {
        toast.success(`Lote "${lote.numero_lote}" cerrado. Ya no admite agregar ni quitar prestaciones.`);
      } else {
        toast.success(`Lote "${lote.numero_lote}" reabierto. Ya puede volver a incorporar prestaciones.`);
      }
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al conmutar estado del lote");
    } finally {
      setIsTogglingCierre(false);
    }
  };

  const handleAbrirPlanillaResumenGDE = () => {
    const html = generarPlanillaResumenLoteHTML(
      lote.numero_lote,
      lote.numero_expediente_gde || "A CARATULAR",
      prestacionesDelLote
    );
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleExportarBSE = () => {
    setIsExportOpen(true);
  };

  const handleQuitarPrestacion = async (prestacionId: string, nombreMedico: string) => {
    try {
      setRemovingId(prestacionId);
      await quitarPrestacionDeLote(prestacionId, lote.id);
      toast.success(`${nombreMedico} desvinculado del lote y devuelto a la bandeja general.`);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al quitar prestación del lote");
    } finally {
      setRemovingId(null);
    }
  };

  const handleEliminarLote = async () => {
    if (
      !window.confirm(
        `¿Está seguro de desarmar el lote "${lote.numero_lote}"? Todas las prestaciones volverán al buzón de conformadas sin perder sus retenciones.`
      )
    ) {
      return;
    }
    try {
      await eliminarLoteTesoreria(lote.id);
      toast.success("Lote desarmado exitosamente.");
      await onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar lote");
    }
  };

  const handleConfirmarPagoLote = async () => {
    if (!comprobantePagoBSE.trim()) {
      toast.error("Por favor ingrese el número de orden de pago o comprobante BSE.");
      return;
    }
    try {
      setIsPayingLote(true);
      await liquidarLotePrestaciones(
        lote.prestaciones_ids,
        {
          batchReceiptNumber: comprobantePagoBSE.trim(),
          paymentDate: new Date().toISOString().split("T")[0],
          notes: `Liquidación masiva Lote ${lote.numero_lote} - Expte GDE ${lote.numero_expediente_gde || "-"}`,
        },
        lote.id
      );
      toast.success("Pago de lote registrado y todas las prestaciones pasaron a Pagado.");
      await onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Error al liquidar lote");
    } finally {
      setIsPayingLote(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 pr-12 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700">
                  {lote.numero_lote}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${estadoCfg.bgLight} ${estadoCfg.textDark}`}
                >
                  {estaPagado ? (
                    <FileCheck2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  ) : !estaAbierto ? (
                    <Lock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  )}
                  {estadoCfg.label}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1.5 font-mono truncate">
                {lote.numero_expediente_gde || "Sin carátula"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                {lote.descripcion} • {prestacionesDelLote.length} prestaciones vinculadas
              </DialogDescription>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Bruto a Comprometer</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {formatMoney(lote.monto_bruto_total)}
                </div>
              </div>

              {/* Switch Abrir / Cerrar Lote (Solo disponible antes de imputar Orden de Pago) */}
              {!estaPagado && (
                <Button
                  type="button"
                  size="sm"
                  variant={estaAbierto ? "outline" : "secondary"}
                  onClick={handleToggleCierre}
                  disabled={isTogglingCierre}
                  className="h-7 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  title={
                    estaAbierto
                      ? "Cerrar lote para evitar que se sigan agregando o quitando prestaciones"
                      : "Reabrir lote para permitir modificaciones antes de la orden de pago"
                  }
                >
                  {isTogglingCierre ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : estaAbierto ? (
                    <>
                      <Lock className="w-3 h-3" /> Cerrar Lote
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" /> Reabrir Lote
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Banner de Estado del Lote */}
          {estaPagado ? (
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Lote Liquidado con Orden de Pago / Pago BSE</span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    Comprobante: {lote.numero_orden_pago || "Ref. Liquidado"} • Fecha: {lote.fecha_orden_pago || "-"}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">Inmutable</Badge>
            </div>
          ) : !estaAbierto ? (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Lote Cerrado para Emisión y Contabilidad</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    No admite agregar ni quitar prestaciones. Para modificar su nómina, pulse "Reabrir Lote".
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Bloqueado</Badge>
            </div>
          ) : null}

          {/* Botones de Acción Documental y Bancaria */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAbrirPlanillaResumenGDE}
                className="text-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Ver Planilla Resumen GDE (Anexo I)
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleExportarBSE}
                className="text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar Detalle
              </Button>
            </div>

            {estaAbierto && !estaPagado && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleEliminarLote}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Desarmar Lote
              </Button>
            )}
          </div>

          {/* Tabla de Prestaciones del Lote con Botón para Quitar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Nómina de Profesionales Incluidos ({prestacionesDelLote.length})
              </span>
              <span className="text-[11px] text-gray-400">
                {estaAbierto
                  ? "Pase el cursor sobre un trámite para quitarlo del lote"
                  : "Nómina fija (lote cerrado)"}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-gray-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2">Profesional & CUIT</th>
                    <th className="p-2">Factura</th>
                    <th className="p-2 text-right">Bruto</th>
                    <th className="p-2 text-right">Retención</th>
                    <th className="p-2 text-right">Neto</th>
                    <th className="p-2 text-center w-12">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {prestacionesDelLote.map((p) => {
                    const user = p.expand?.user;
                    const nombre = user
                      ? `${user.lastName || ""} ${user.firstName || ""}`.trim()
                      : "Prestador";
                    const bruto = Number(p.invoice_amount) || 0;
                    const ret = Number(p.retencion_monto) || 0;
                    const neto = p.monto_neto_liquidable !== undefined ? Number(p.monto_neto_liquidable) : bruto - ret;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2">
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{nombre}</div>
                          <div className="text-[10px] text-gray-400 font-mono">CUIT: {p.perfilPrestador?.cuit || "-"}</div>
                        </td>
                        <td className="p-2 font-mono">{p.invoice_number || "S/N"}</td>
                        <td className="p-2 text-right font-mono font-medium">{formatMoney(bruto)}</td>
                        <td className="p-2 text-right font-mono text-rose-600">
                          {ret > 0 ? `-${formatMoney(ret)}` : "-"}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatMoney(neto)}
                        </td>
                        <td className="p-2 text-center">
                          {estaAbierto && !estaPagado && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={removingId === p.id}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600"
                              title="Quitar del lote y devolver a bandeja general"
                              onClick={() => handleQuitarPrestacion(p.id, nombre)}
                            >
                              {removingId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserMinus className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generar Orden de Pago (Documento para Expediente GDE) */}
          {!estaPagado && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Orden de Pago Global (Documento Oficial GDE)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lote.numero_orden_pago
                    ? `OP N° ${lote.numero_orden_pago} configurada. Puede editar los datos presupuestarios o volver a emitir el documento.`
                    : "Complete los datos contables y presupuestarios del expediente para emitir la Orden de Pago oficial."}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsConfigOPOpen(true)}
                className="h-8 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {lote.numero_orden_pago ? "Ver / Editar Orden de Pago" : "Generar Orden de Pago"}
              </Button>
            </div>
          )}

          {/* Liquidación Final / Cierre de Pago BSE */}
          {!estaPagado && (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                Cierre de Pago
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Al registrar el número de orden de pago o transferencia BSE, el lote quedará cerrado de forma inmutable.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Input
                  placeholder="Nº Orden de Pago Global / Ref. BSE (ej: OP-LOTE-4-BSE)"
                  value={comprobantePagoBSE}
                  onChange={(e) => setComprobantePagoBSE(e.target.value)}
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmarPagoLote}
                  disabled={isPayingLote}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1"
                >
                  {isPayingLote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmar Transferencias Ejecutadas
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal Formulario Configurar Orden de Pago */}
      <ModalConfigurarOrdenDePago
        isOpen={isConfigOPOpen}
        onClose={() => setIsConfigOPOpen(false)}
        lote={lote}
        prestacionesDelLote={prestacionesDelLote}
        onRefresh={onRefresh}
      />

      {/* Diálogo de exportación (modo + formato) */}
      <ModalExportarDetalleLote
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        lote={lote}
        prestacionesDelLote={prestacionesDelLote}
      />
    </Dialog>
  );
}

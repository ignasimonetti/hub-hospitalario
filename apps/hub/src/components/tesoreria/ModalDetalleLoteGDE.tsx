"use client";

import { useState } from "react";
import { LoteTesoreria, PrestacionTesoreriaItem, ESTADOS_LOTE_CONFIG } from "@/types/tesoreria";
import {
  generarPlanillaResumenLoteHTML,
  generarOrdenDePagoHTML,
  liquidarLotePrestaciones,
  marcarPrestacionesPagadas,
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
  FileText,
  Pencil,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null); // 'bulk' o ID específico

  if (!lote) return null;

  const estaAbierto = ESTADOS_LOTE_ABIERTO.includes(lote.estado);
  const estaPagado = lote.estado === "pagado_bse" || Boolean(lote.comprobante_pago_bse);
  const tieneOP = Boolean(lote.numero_orden_pago || lote.op_config);

  const prestacionesPagadasCount = prestacionesDelLote.filter((p) => p.status === "pagado").length;
  const totalPrestacionesCount = prestacionesDelLote.length;
  const todosPagados = totalPrestacionesCount > 0 && prestacionesPagadasCount === totalPrestacionesCount;

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleccionar solo los pendientes de pago
      const pendientes = prestacionesDelLote
        .filter((p) => p.status !== "pagado")
        .map((p) => p.id);
      setSelectedIds(pendientes);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarcarPagadoIndividual = async (id: string, nombreMedico: string) => {
    try {
      setIsMarkingPaid(id);
      const res = await marcarPrestacionesPagadas([id], lote.id);
      if (res.loteCompleto) {
        toast.success(`Pago registrado para ${nombreMedico}. ¡Todo el lote quedó pagado y cerrado!`);
      } else {
        toast.success(`Pago registrado para ${nombreMedico}. Estado actualizado a "Pagado".`);
      }
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar el pago");
    } finally {
      setIsMarkingPaid(null);
    }
  };

  const handleMarcarSeleccionadosPagados = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsMarkingPaid("bulk");
      const res = await marcarPrestacionesPagadas(selectedIds, lote.id);
      if (res.loteCompleto) {
        toast.success(`Se registraron ${res.exitosas} pagos. ¡Todo el lote quedó liquidado!`);
      } else {
        toast.success(`Se registraron ${res.exitosas} pagos exitosamente.`);
      }
      setSelectedIds([]);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar pagos masivos");
    } finally {
      setIsMarkingPaid(null);
    }
  };

  const handleMarcarTodosPagados = async () => {
    const pendientes = prestacionesDelLote
      .filter((p) => p.status !== "pagado")
      .map((p) => p.id);
    if (pendientes.length === 0) {
      toast.info("Todas las prestaciones de este lote ya están pagadas.");
      return;
    }
    if (
      !window.confirm(
        `¿Confirmar que se transfirió el pago a los ${pendientes.length} prestadores pendientes? Se actualizará su estado a "Pagado" en el sistema.`
      )
    ) {
      return;
    }
    try {
      setIsMarkingPaid("bulk");
      const res = await marcarPrestacionesPagadas(pendientes, lote.id);
      toast.success(`Se marcaron ${res.exitosas} prestaciones como Pagadas. Lote liquidado.`);
      setSelectedIds([]);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al liquidar prestaciones");
    } finally {
      setIsMarkingPaid(null);
    }
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

  const handleAbrirOrdenDePagoPDF = () => {
    const html = generarOrdenDePagoHTML(lote, prestacionesDelLote, lote.op_config);
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

              {/* Switch Abrir / Cerrar Lote (Solo disponible si no está pagado ni tiene Orden de Pago) */}
              {!estaPagado && !tieneOP && (
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
          ) : tieneOP ? (
            <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl flex items-center justify-between text-xs text-purple-900 dark:text-purple-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <span className="font-bold">Lote Cerrado con Orden de Pago Emitida (OP N° {lote.numero_orden_pago})</span>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    La nómina de prestadores y montos es definitiva e inmutable. Puede actualizar los datos administrativos/presupuestarios si fuera necesario.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-100/60 dark:bg-purple-900/30 text-[10px]">OP Emitida</Badge>
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

          {/* Tabla de Prestaciones del Lote con Selección y Pagos Individuales */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Nómina de Profesionales ({prestacionesDelLote.length})
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono font-semibold ${
                    todosPagados
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                  }`}
                >
                  {prestacionesPagadasCount} de {totalPrestacionesCount} Pagados
                </Badge>
              </div>

              {/* Botón de acción masiva para seleccionados */}
              {!estaPagado && selectedIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleMarcarSeleccionadosPagados}
                  disabled={Boolean(isMarkingPaid)}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs animate-in fade-in duration-200"
                >
                  {isMarkingPaid === "bulk" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Marcar {selectedIds.length} seleccionados como Pagados
                </Button>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-gray-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                  <tr>
                    {!estaPagado && (
                      <th className="p-2 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.length > 0 &&
                            selectedIds.length ===
                              prestacionesDelLote.filter((p) => p.status !== "pagado").length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          title="Seleccionar todos los pendientes de pago"
                        />
                      </th>
                    )}
                    <th className="p-2">Profesional & CUIT</th>
                    <th className="p-2">Factura</th>
                    <th className="p-2 text-right">Bruto</th>
                    <th className="p-2 text-right">Retención</th>
                    <th className="p-2 text-right">Neto</th>
                    <th className="p-2 text-center">Estado de Pago</th>
                    {estaAbierto && !estaPagado && <th className="p-2 text-center w-10">Quitar</th>}
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
                    const isPagadoRow = p.status === "pagado";
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isPagadoRow
                            ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                            : isSelected
                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {!estaPagado && (
                          <td className="p-2 text-center">
                            {!isPagadoRow && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(p.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            )}
                          </td>
                        )}
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
                          {isPagadoRow ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 text-[10px] font-semibold flex items-center gap-1 mx-auto w-fit">
                              <Check className="h-3 w-3" />
                              Pagado
                            </Badge>
                          ) : !estaPagado ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarcarPagadoIndividual(p.id, nombre)}
                              disabled={Boolean(isMarkingPaid)}
                              className="h-6 px-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 dark:border-emerald-700"
                              title="Marcar como pagada tras realizar la transferencia en Home Banking"
                            >
                              {isMarkingPaid === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Marcar Pagado"
                              )}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Pendiente</span>
                          )}
                        </td>
                        {estaAbierto && !estaPagado && (
                          <td className="p-2 text-center">
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
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generar / Ver / Editar Orden de Pago (Documento para Expediente GDE) */}
          {!estaPagado && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Orden de Pago Global (Documento Oficial GDE)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {tieneOP
                    ? `OP N° ${lote.numero_orden_pago} emitida. Puede visualizar el documento oficial o corregir datos presupuestarios.`
                    : "Complete los datos contables y presupuestarios del expediente para consolidar y emitir la Orden de Pago."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {tieneOP ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAbrirOrdenDePagoPDF}
                      className="h-8 text-xs font-bold flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
                      title="Abrir el documento oficial en una nueva pestaña para imprimir o descargar en PDF"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Ver Orden de Pago (PDF)
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsConfigOPOpen(true)}
                      className="h-8 text-xs font-semibold flex items-center gap-1.5"
                      title="Modificar número de resolución, imputación contable o cuenta débito"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar Datos de OP
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsConfigOPOpen(true)}
                    className="h-8 text-xs font-semibold flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Generar Orden de Pago
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Liquidación Rápida Masiva de Pendientes */}
          {!estaPagado && !todosPagados && (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Liquidación Total de Pendientes
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Si ya ejecutó todas las transferencias de este lote en Home Banking, puede marcarlas todas juntas en 1 clic.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleMarcarTodosPagados}
                disabled={Boolean(isMarkingPaid)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shrink-0"
              >
                {isMarkingPaid === "bulk" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Marcar Todos como Pagados ({totalPrestacionesCount - prestacionesPagadasCount})
              </Button>
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

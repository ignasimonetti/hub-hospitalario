"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ConfiguracionModuloTesoreria,
  DEFAULT_CONFIGURACION_TESORERIA,
  MotivoObservacionConfig,
} from "@/types/tesoreria";
import {
  getTesoreriaConfig,
  saveTesoreriaConfig,
} from "@/lib/services/parametersService";
import { toast } from "sonner";
import {
  Receipt,
  Save,
  ShieldCheck,
  Building2,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileCheck2,
  CreditCard,
  Clock,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

interface TesoreriaParametersTabProps {
  onBack?: () => void;
}

export function TesoreriaParametersTab({ onBack }: TesoreriaParametersTabProps) {
  const [config, setConfig] = useState<ConfiguracionModuloTesoreria>(
    DEFAULT_CONFIGURACION_TESORERIA
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para nuevo motivo de observación
  const [nuevoMotivoId, setNuevoMotivoId] = useState("");
  const [nuevoMotivoLabel, setNuevoMotivoLabel] = useState("");
  const [nuevoMotivoDesc, setNuevoMotivoDesc] = useState("");
  const [editingMotivoIdx, setEditingMotivoIdx] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingDesc, setEditingDesc] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getTesoreriaConfig();
      setConfig(data);
    } catch (e) {
      console.error("Error loading tesoreria parameters:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await saveTesoreriaConfig(config);
      toast.success("Parámetros de Tesorería guardados exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar parámetros");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMotivo = () => {
    if (!nuevoMotivoLabel.trim()) {
      toast.error("El título del motivo es obligatorio");
      return;
    }
    const idGenerado =
      nuevoMotivoId.trim().toLowerCase().replace(/\s+/g, "_") ||
      `motivo_${Date.now().toString().slice(-4)}`;

    const current = config.motivos_observacion_fiscal || [];
    if (current.some((m) => m.id === idGenerado)) {
      toast.error("Ya existe un motivo con ese identificador");
      return;
    }

    const nuevo: MotivoObservacionConfig = {
      id: idGenerado,
      label: nuevoMotivoLabel.trim(),
      descripcion: nuevoMotivoDesc.trim() || nuevoMotivoLabel.trim(),
    };

    setConfig((prev) => ({
      ...prev,
      motivos_observacion_fiscal: [...prev.motivos_observacion_fiscal, nuevo],
    }));
    setNuevoMotivoId("");
    setNuevoMotivoLabel("");
    setNuevoMotivoDesc("");
    toast.success(`Motivo "${nuevo.label}" agregado`);
  };

  const handleRemoveMotivo = (id: string) => {
    if (config.motivos_observacion_fiscal.length <= 1) {
      toast.error("Debe existir al menos un motivo configurado");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      motivos_observacion_fiscal: prev.motivos_observacion_fiscal.filter((m) => m.id !== id),
    }));
    toast.success("Motivo eliminado");
  };

  const handleStartEditMotivo = (idx: number, motivo: MotivoObservacionConfig) => {
    setEditingMotivoIdx(idx);
    setEditingLabel(motivo.label);
    setEditingDesc(motivo.descripcion);
  };

  const handleSaveEditMotivo = (idx: number) => {
    if (!editingLabel.trim()) return;
    setConfig((prev) => {
      const list = [...prev.motivos_observacion_fiscal];
      list[idx] = {
        ...list[idx],
        label: editingLabel.trim(),
        descripcion: editingDesc.trim() || editingLabel.trim(),
      };
      return { ...prev, motivos_observacion_fiscal: list };
    });
    setEditingMotivoIdx(null);
    setEditingLabel("");
    setEditingDesc("");
    toast.success("Motivo actualizado");
  };

  const handleRestoreDefaultMotivos = () => {
    setConfig((prev) => ({
      ...prev,
      motivos_observacion_fiscal: DEFAULT_CONFIGURACION_TESORERIA.motivos_observacion_fiscal,
    }));
    toast.success("Motivos por defecto restablecidos");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* BLOQUE 1: PLANTILLA DE EXPEDIENTES GDE */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Parámetros de Expedientes GDE (Trámites de Pago)
              </CardTitle>
              <CardDescription className="text-xs">
                Estructura por defecto para la caratulación y pase de lotes a Contabilidad y Despacho.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Código de Trámite GDE por Defecto
              </Label>
              <Input
                type="text"
                value={config.codigo_tramite_gde_default || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    codigo_tramite_gde_default: e.target.value,
                  }))
                }
                placeholder="Ej: GSGE00055 - Solicitud de Pago"
                className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Identificador oficial del tipo de expediente en el sistema GDE Santiago del Estero.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plantilla / Prefijo de Expediente GDE
              </Label>
              <Input
                type="text"
                value={config.plantilla_expediente_gde || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    plantilla_expediente_gde: e.target.value,
                  }))
                }
                placeholder="Ej: EX-2026- -GDESDE-CISB#MS"
                className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Formato sugerido al momento de caratular un nuevo lote de prestaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 2: PARÁMETROS BANCARIOS BSE */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Parámetros Bancarios & Liquidación BSE
              </CardTitle>
              <CardDescription className="text-xs">
                Datos del hospital emisor para los lotes de exportación a Banca Empresa del BSE.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CUIT Hospital Pagador (CISB)
              </Label>
              <Input
                type="text"
                value={config.cuit_hospital_pagador || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    cuit_hospital_pagador: e.target.value,
                  }))
                }
                placeholder="30-71477758-5"
                className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Denominación Cuenta Pagadora
              </Label>
              <Input
                type="text"
                value={config.nombre_cuenta_bancaria || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    nombre_cuenta_bancaria: e.target.value,
                  }))
                }
                placeholder="CISB - Cta Cte Recaudación BSE"
                className="h-9 text-xs bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Leyenda de Transferencia BSE
              </Label>
              <Input
                type="text"
                value={config.leyenda_transferencia_bse || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    leyenda_transferencia_bse: e.target.value,
                  }))
                }
                placeholder="Pago Honorarios Prestaciones CISB"
                className="h-9 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Tiempo de Bloqueo Exclusivo de Revisión (minutos)
              </Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={config.minutos_bloqueo_revision || 15}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    minutos_bloqueo_revision: parseInt(e.target.value, 10) || 15,
                  }))
                }
                className="h-9 text-xs font-mono w-32 bg-white dark:bg-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Minutos que un trámite permanece bloqueado para otros usuarios mientras un administrativo lo controla.
              </p>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Campos de Retenciones Habilitados
              </span>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.retenciones_habilitadas?.iibb ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        retenciones_habilitadas: {
                          ...prev.retenciones_habilitadas,
                          iibb: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>Ingresos Brutos (DGR)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.retenciones_habilitadas?.ganancias ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        retenciones_habilitadas: {
                          ...prev.retenciones_habilitadas,
                          ganancias: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>Ganancias</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.retenciones_habilitadas?.suss ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        retenciones_habilitadas: {
                          ...prev.retenciones_habilitadas,
                          suss: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>SUSS / Cargas</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.retenciones_habilitadas?.otras ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        retenciones_habilitadas: {
                          ...prev.retenciones_habilitadas,
                          otras: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    Otras (Embargos / Ajustes)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 3: CATÁLOGO CRUD DE MOTIVOS DE OBSERVACIÓN FISCAL (ARCA) */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Catálogo de Motivos de Observación Fiscal ARCA
                </CardTitle>
                <CardDescription className="text-xs">
                  Lista desplegable de inconsistencias fiscales estándar disponibles al observar un comprobante en Tesorería.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaultMotivos}
              className="text-xs h-7 gap-1 border-slate-300 text-slate-600"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer por defecto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulario de Alta Rápida */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Agregar Nuevo Motivo de Observación
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <Input
                  placeholder="Título breve (ej: Factura Duplicada)"
                  value={nuevoMotivoLabel}
                  onChange={(e) => setNuevoMotivoLabel(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  placeholder="Descripción explicativa de la inconsistencia..."
                  value={nuevoMotivoDesc}
                  onChange={(e) => setNuevoMotivoDesc(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddMotivo}
                  className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Motivos Configurados */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {config.motivos_observacion_fiscal?.map((motivo, idx) => {
              const isEditing = editingMotivoIdx === idx;

              return (
                <div
                  key={motivo.id}
                  className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="h-7 text-xs bg-white dark:bg-slate-950"
                      />
                      <Input
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        className="h-7 text-xs bg-white dark:bg-slate-950"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{motivo.label}</span>
                        <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 text-slate-400">
                          {motivo.id}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{motivo.descripcion}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEditMotivo(idx)}
                          className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMotivoIdx(null)}
                          className="h-7 w-7 p-0 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEditMotivo(idx, motivo)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMotivo(motivo.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

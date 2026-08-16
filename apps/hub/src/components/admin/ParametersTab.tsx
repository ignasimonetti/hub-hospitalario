"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import {
  getPrestadoresConfig,
  savePrestadoresConfig,
} from "@/lib/services/parametersService";
import { toast } from "sonner";
import {
  Sliders,
  Save,
  RotateCcw,
  DollarSign,
  Activity,
  CalendarClock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Calculator,
} from "lucide-react";

export function ParametersTab() {
  const [config, setConfig] = useState<ConfiguracionModuloPrestadores>(
    DEFAULT_CONFIGURACION_PRESTADORES
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del Simulador Rápido
  const [simTipoGuardia, setSimTipoGuardia] = useState<"ordinaria" | "critica">("ordinaria");
  const [simEsInhabil, setSimEsInhabil] = useState<boolean>(false);
  const [simHorasEH, setSimHorasEH] = useState<number>(10);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getPrestadoresConfig();
      setConfig(data);
    } catch (e) {
      console.error("Error loading parameters:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePrestadoresConfig(config);
      toast.success("Parámetros y aranceles guardados exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar parámetros");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("¿Deseas restablecer todos los parámetros a los valores de referencia del sistema?")) {
      setConfig(DEFAULT_CONFIGURACION_PRESTADORES);
      toast.info("Valores restablecidos a los valores por defecto");
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Cálculo del Simulador
  const valorGuardiaSimulada =
    simTipoGuardia === "ordinaria"
      ? simEsInhabil
        ? config.valor_guardia_ordinaria_inhabil
        : config.valor_guardia_ordinaria_habil
      : simEsInhabil
      ? config.valor_guardia_critica_inhabil
      : config.valor_guardia_critica_habil;

  const totalEHSimulado = simHorasEH * config.valor_hora_extension;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Parámetros y Aranceles Globales
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configuración de tarifas asistenciales, guardias y topes normativos para el Portal de Prestadores y Tesorería.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restablecer
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Guardando..." : "Guardar Parámetros"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BLOQUE 1: TOPE NORMATIVO DE TRÁMITE */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tope Normativo por Trámite / Factura
                </CardTitle>
                <CardDescription className="text-xs">
                  Límite máximo permitido por comprobante individual de honorarios.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Monto Máximo Permitido ($)
                </Label>
                <Input
                  type="number"
                  step="1000"
                  value={config.tope_maximo_factura}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      tope_maximo_factura: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-10 text-sm font-bold bg-white dark:bg-slate-900"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Valor actual configurado: <strong>{formatMoney(config.tope_maximo_factura)}</strong>
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Impacto en el Portal:
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Si un prestador intenta cargar un comprobante que supere este valor, el sistema le exigirá
                  dividir la prestación con el botón "+ Agregar otra factura".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOQUE 2: ARANCELES DE GUARDIAS MÉDICAS (FORMULARIO G) */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Aranceles de Guardias Médicas (Formulario G)
                </CardTitle>
                <CardDescription className="text-xs">
                  Valores de referencia para liquidación de guardias presenciales de 24hs / 12hs.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Guardia Ordinaria - Día Hábil */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Guardia Ordinaria • Día Hábil ($)
                </Label>
                <Input
                  type="number"
                  step="500"
                  value={config.valor_guardia_ordinaria_habil}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      valor_guardia_ordinaria_habil: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                />
                <span className="text-[11px] text-slate-400 block">
                  Lunes a Viernes: {formatMoney(config.valor_guardia_ordinaria_habil)}
                </span>
              </div>

              {/* Guardia Ordinaria - Día Inhábil / Feriado */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Guardia Ordinaria • Inhábil / Fin de Semana / Feriado ($)
                </Label>
                <Input
                  type="number"
                  step="500"
                  value={config.valor_guardia_ordinaria_inhabil}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      valor_guardia_ordinaria_inhabil: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                />
                <span className="text-[11px] text-slate-400 block">
                  Sábados, Domingos y Feriados: {formatMoney(config.valor_guardia_ordinaria_inhabil)}
                </span>
              </div>

              {/* Guardia Crítica - Día Hábil */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                <Label className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                  Guardia Crítica (UTI / Shock) • Día Hábil ($)
                </Label>
                <Input
                  type="number"
                  step="500"
                  value={config.valor_guardia_critica_habil}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      valor_guardia_critica_habil: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                />
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                  Lunes a Viernes: {formatMoney(config.valor_guardia_critica_habil)}
                </span>
              </div>

              {/* Guardia Crítica - Inhábil / Feriado */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                <Label className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                  Guardia Crítica (UTI / Shock) • Inhábil / Feriado ($)
                </Label>
                <Input
                  type="number"
                  step="500"
                  value={config.valor_guardia_critica_inhabil}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      valor_guardia_critica_inhabil: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                />
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                  Sábados, Domingos y Feriados: {formatMoney(config.valor_guardia_critica_inhabil)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOQUE 3: EXTENSIÓN HORARIA (FORMULARIO EH) */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Arancel de Extensión Horaria (Formulario EH)
                </CardTitle>
                <CardDescription className="text-xs">
                  Valor retributivo por cada hora asistencial programada cumplida.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valor por Hora Asistencial ($ / hora)
                </Label>
                <Input
                  type="number"
                  step="100"
                  value={config.valor_hora_extension}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      valor_hora_extension: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                />
                <span className="text-[11px] text-slate-400 block">
                  Tarifa horaria: {formatMoney(config.valor_hora_extension)} / hs
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SIMULADOR RÁPIDO INTERACTIVO */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Simulador de Liquidación de Prueba
                </CardTitle>
                <CardDescription className="text-xs">
                  Verifica en tiempo real los importes según los aranceles configurados ut supra.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simulador Guardias */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Simular 1 Guardia:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={simTipoGuardia === "ordinaria" ? "default" : "outline"}
                    onClick={() => setSimTipoGuardia("ordinaria")}
                    className="h-7 text-xs"
                  >
                    Ordinaria
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={simTipoGuardia === "critica" ? "default" : "outline"}
                    onClick={() => setSimTipoGuardia("critica")}
                    className="h-7 text-xs"
                  >
                    Crítica
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={simEsInhabil ? "secondary" : "outline"}
                    onClick={() => setSimEsInhabil(!simEsInhabil)}
                    className="h-7 text-xs"
                  >
                    {simEsInhabil ? "Inhábil/Feriado" : "Día Hábil"}
                  </Button>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Monto calculado:</span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {formatMoney(valorGuardiaSimulada)}
                  </span>
                </div>
              </div>

              {/* Simulador EH */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Simular Extensión Horaria:
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500">Cantidad de Hs:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={simHorasEH}
                    onChange={(e) => setSimHorasEH(Number(e.target.value) || 0)}
                    className="h-7 w-20 text-xs font-bold"
                  />
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Total {simHorasEH} hs:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(totalEHSimulado)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

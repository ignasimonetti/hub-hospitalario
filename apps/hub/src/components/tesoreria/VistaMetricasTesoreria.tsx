"use client";

import { useMemo, useState } from "react";
import { KpisTesoreriaData } from "@/types/tesoreria";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  Receipt,
  FileCheck2,
  Percent,
  Calculator,
  ArrowUpRight,
  ShieldAlert,
  Landmark,
  BarChart2,
  Filter,
  Hourglass,
  Timer,
  Zap,
  HelpCircle,
  FileWarning,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VistaMetricasTesoreriaProps {
  kpis: KpisTesoreriaData;
  periodoLabel?: string;
}

const COLORS_ESTADOS = {
  liquidado: "#10B981",
  pendiente: "#3B82F6",
  observado: "#F59E0B",
};

export function VistaMetricasTesoreria({ kpis, periodoLabel }: VistaMetricasTesoreriaProps) {
  const [filtroServicioGrafico, setFiltroServicioGrafico] = useState<string>("todos");

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMoneyCompact = (amount: number) => {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}k`;
    }
    return `$${amount}`;
  };

  const totalVolumenBruto = kpis.totalLiquidadoMonto + kpis.totalPendienteMonto;
  const totalTramites = kpis.totalLiquidadoCantidad + kpis.totalPendienteCantidad;
  const tasaEfectividad =
    totalTramites > 0 ? (kpis.totalLiquidadoCantidad / totalTramites) * 100 : 0;

  // Datos para gráfico de dona de distribución por estado
  const dataDistribucionEstados = [
    { name: "Liquidado / Pagado", value: kpis.totalLiquidadoMonto, color: COLORS_ESTADOS.liquidado },
    { name: "Pendiente de Pago", value: kpis.totalPendienteMonto, color: COLORS_ESTADOS.pendiente },
    { name: "Observado Fiscal", value: kpis.totalObservadoMonto, color: COLORS_ESTADOS.observado },
  ].filter((item) => item.value > 0);

  // Filtrado de servicios para visualización
  const serviciosFiltrados = useMemo(() => {
    if (filtroServicioGrafico === "todos") return kpis.desglosePorServicio;
    return kpis.desglosePorServicio.filter((s) => s.servicioKey === filtroServicioGrafico);
  }, [kpis.desglosePorServicio, filtroServicioGrafico]);

  // Datos para gráfico de barras de servicios
  const dataGraficoServicios = useMemo(() => {
    return serviciosFiltrados.slice(0, 8).map((srv) => ({
      name: srv.servicioLabel.length > 18 ? srv.servicioLabel.substring(0, 18) + "..." : srv.servicioLabel,
      fullName: srv.servicioLabel,
      liquidado: srv.montoLiquidado,
      pendiente: srv.montoPendiente,
      total: srv.montoTotal,
      tramites: srv.cantidadPrestaciones,
    }));
  }, [serviciosFiltrados]);

  // Datos para evolución cronológica mensual
  const dataEvolucion = useMemo(() => {
    return (kpis.evolucionMensual || []).filter((item) => item.montoTotal > 0);
  }, [kpis.evolucionMensual]);

  // Cálculos de semaforización de tiempos
  const tiempos = kpis.tiemposGestion || {
    promedioDiasNetos: 0,
    medianaDiasNetos: 0,
    semaforo: { optimo: 0, moderado: 0, demorado: 0 },
    tramitesEvaluados: 0,
    tiempoMinimoDias: 0,
    tiempoMaximoDias: 0,
  };

  const totalSemaforo = tiempos.tramitesEvaluados || 1;
  const pctOptimo = Math.round((tiempos.semaforo.optimo / totalSemaforo) * 100);
  const pctModerado = Math.round((tiempos.semaforo.moderado / totalSemaforo) * 100);
  const pctDemorado = Math.max(0, 100 - pctOptimo - pctModerado);

  // Métrica de Observaciones Fiscales
  const tasaObs = kpis.tasaObservacion || {
    porcentaje: 0,
    cantidadTotalAuditados: 0,
    cantidadObservados: 0,
    montoRetenidoPreventivo: 0,
    desglosePorMotivo: [],
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 4 Tarjetas de KPIs Principales Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Liquidado BSE */}
          <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Total Transferido (BSE)
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-mono">
                  {formatMoney(kpis.totalLiquidadoMonto)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[10px]">
                    {kpis.totalLiquidadoCantidad} trámites pagados
                  </Badge>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    ({tasaEfectividad.toFixed(0)}% del total)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendiente de Liquidar */}
          <Card className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Pendiente de Liquidar
                </span>
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-mono">
                  {formatMoney(kpis.totalPendienteMonto)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
                  <Badge variant="outline" className="border-blue-300 dark:border-blue-800 bg-blue-100 text-blue-800 dark:text-blue-300 text-[10px]">
                    {kpis.totalPendienteCantidad} prestaciones con firmas
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retenciones Fiscales Totales */}
          <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                  Retenciones Fiscales
                </span>
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Landmark className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-mono">
                  {formatMoney(kpis.totalRetencionesMonto || 0)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                  <Badge variant="outline" className="border-indigo-300 dark:border-indigo-800 bg-indigo-100 text-indigo-800 dark:text-indigo-300 text-[10px]">
                    DGR / AFIP / SUSS
                  </Badge>
                  <span className="text-[10px] text-gray-500">
                    Neto: {formatMoneyCompact(kpis.totalNetoEstimado || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasa de Observación Fiscal & Retención Preventiva */}
          <Card className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Tasa de Observación Fiscal
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight font-mono">
                    {tasaObs.porcentaje}%
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      tasaObs.porcentaje <= 5
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : tasaObs.porcentaje <= 12
                        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {tasaObs.porcentaje <= 5 ? "Baja Fricción" : tasaObs.porcentaje <= 12 ? "Moderada" : "Alta Fricción"}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <span className="text-[11px]">
                    {tasaObs.cantidadObservados} obs. ({formatMoneyCompact(tasaObs.montoRetenidoPreventivo)} retenido)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILA 2: TIEMPOS DE DEMORA (SLA) & CALIDAD FISCAL (OBSERVACIONES) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de SLA & Tiempos Netos */}
          <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-700 dark:text-purple-400">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Tiempo Neto de Demora & Gestión de Pago (SLA Tesorería)
                      </CardTitle>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p className="font-semibold mb-1">Cálculo Limpio sin Sesgos:</p>
                          <p>
                            El reloj inicia cuando la Dirección Coordinadora aprueba la prestación. Si Tesorería observa la factura, el cómputo se pausa y se reinicia cuando el prestador subsana el comprobante, imputando a Tesorería únicamente sus días de gestión real hasta la transferencia en BSE.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </div>
                    <CardDescription className="text-xs">
                      Medición neta desde el visto bueno directivo / subsanación hasta la acreditación en BSE.
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900 font-medium">
                  {tiempos.tramitesEvaluados} liquidaciones
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiempos.tramitesEvaluados === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5">
                  <Hourglass className="h-6 w-6 text-gray-300 stroke-1" />
                  <span>No hay trámites pagados registrados en este período para calcular tiempos de gestión.</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40">
                      <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 block uppercase tracking-wider">
                        Promedio Neto
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-purple-950 dark:text-purple-100 font-mono">
                          {tiempos.promedioDiasNetos}
                        </span>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          días
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-600/80 dark:text-purple-400 mt-0.5">
                        Rango: {tiempos.tiempoMinimoDias} a {tiempos.tiempoMaximoDias} días
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
                      <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 block uppercase tracking-wider">
                        Mediana Típica
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-blue-950 dark:text-blue-100 font-mono">
                          {tiempos.medianaDiasNetos}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          días
                        </span>
                      </div>
                      <p className="text-[10px] text-blue-600/80 dark:text-blue-400 mt-0.5">
                        El 50% de los trámites se pagó en ≤ {tiempos.medianaDiasNetos}d
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                      <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">
                        En Término Ideal
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-emerald-950 dark:text-emerald-100 font-mono">
                          {pctOptimo}%
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          (≤ 15 días)
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">
                        {tiempos.semaforo.optimo} de {tiempos.tramitesEvaluados} trámites
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      <span>Semáforo de Plazos:</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-700 dark:text-emerald-400">🟢 ≤15d ({pctOptimo}%)</span>
                        <span className="text-amber-700 dark:text-amber-400">🟡 16-30d ({pctModerado}%)</span>
                        <span className="text-rose-700 dark:text-rose-400">🔴 &gt;30d ({pctDemorado}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      {pctOptimo > 0 && (
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${pctOptimo}%` }}
                          title={`Óptimo (<= 15 días): ${tiempos.semaforo.optimo}`}
                        />
                      )}
                      {pctModerado > 0 && (
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${pctModerado}%` }}
                          title={`Moderado (16 a 30 días): ${tiempos.semaforo.moderado}`}
                        />
                      )}
                      {pctDemorado > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all"
                          style={{ width: `${pctDemorado}%` }}
                          title={`Demorado (> 30 días): ${tiempos.semaforo.demorado}`}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Panel de Calidad de Facturación & Motivos de Observación */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-lg text-amber-700 dark:text-amber-400">
                  <FileWarning className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Control de Calidad Fiscal
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Motivos de rechazo preventivo antes de pago.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasaObs.desglosePorMotivo.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5">
                  <CheckCircle className="h-6 w-6 text-emerald-500 stroke-1" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    100% de Calidad Documental
                  </span>
                  <span>No se registran inconsistencias fiscales en el período.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {tasaObs.desglosePorMotivo.map((mot, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]" title={mot.motivoLabel}>
                          {mot.motivoLabel}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-amber-300 text-amber-800 dark:text-amber-300">
                          {mot.cantidad} caso(s)
                        </Badge>
                      </div>
                      <div className="h-1.5 w-full bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${mot.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500">
                <span>Total Auditados: <strong>{tasaObs.cantidadTotalAuditados}</strong></span>
                <span>Fricción: <strong>{tasaObs.porcentaje}%</strong></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILA 3: COMPARATIVA POR SERVICIO Y DISTRIBUCIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras: Honorarios por Servicio Asistencial */}
          <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-blue-700 dark:text-blue-400">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Erogación por Servicio Asistencial
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Comparativa de montos liquidados vs pendientes por área médica en {periodoLabel || "el período"}.
                </CardDescription>
              </div>

              <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                Volumen: {formatMoneyCompact(totalVolumenBruto)}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              {dataGraficoServicios.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                  <Building2 className="h-8 w-8 text-gray-300 stroke-1" />
                  No hay prestaciones registradas para este período.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dataGraficoServicios}
                      margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                      <XAxis
                        dataKey="name"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                      />
                      <YAxis
                        tickFormatter={formatMoneyCompact}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                      />
                      <Tooltip
                        formatter={(val: any, name: string) => [
                          formatMoney(Number(val)),
                          name === "liquidado" ? "Transferido (BSE)" : "Pendiente",
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.fullName || label;
                        }}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar
                        dataKey="liquidado"
                        name="Transferido (BSE)"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="pendiente"
                        name="Pendiente"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Dona: Distribución Presupuestaria */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-950/60 rounded-lg text-purple-700 dark:text-purple-400">
                  <PieChartIcon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Estado Presupuestario
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Proporción de fondos ejecutados vs por liberar.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dataDistribucionEstados.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                  Sin datos suficientes
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-44 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataDistribucionEstados}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dataDistribucionEstados.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any) => [formatMoney(Number(val)), "Monto"]}
                          contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-semibold text-gray-400">Total</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {formatMoneyCompact(totalVolumenBruto)}
                      </span>
                    </div>
                  </div>

                  {/* Leyenda de Estados */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {dataDistribucionEstados.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-600 dark:text-slate-300 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold font-mono text-gray-900 dark:text-slate-100">
                          {formatMoney(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FILA 4: EVOLUCIÓN MENSUAL & DESGLOSE COMPLETO POR ESPECIALIDAD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolución Mensual de Pagos */}
          {dataEvolucion.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Evolución Mensual
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Curva de liquidación del ejercicio.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dataEvolucion}
                      margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorLiquidado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                      <XAxis dataKey="mesLabel" tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis tickFormatter={formatMoneyCompact} tick={{ fontSize: 10, fill: "#64748B" }} />
                      <Tooltip
                        formatter={(val: any) => [formatMoney(Number(val)), "Transferido"]}
                        contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="montoLiquidado"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLiquidado)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla / Ranking de Servicios Asistenciales */}
          <Card className={`border border-slate-200 dark:border-slate-800 shadow-xs ${dataEvolucion.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Desglose Completo por Especialidad / Servicio
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Participación porcentual y volumen total por área.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {kpis.desglosePorServicio.length} servicios activos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {kpis.desglosePorServicio.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No hay datos asistenciales registrados para el período seleccionado.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {kpis.desglosePorServicio.map((srv, idx) => (
                    <div key={srv.servicioKey} className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {srv.servicioLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-400">
                            {srv.cantidadPrestaciones} trámites
                          </span>
                          <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                            {formatMoney(srv.montoTotal)}
                          </span>
                          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                            {srv.porcentajeDelTotal.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      {/* Barra de progreso de distribución */}
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${srv.montoTotal > 0 ? (srv.montoLiquidado / srv.montoTotal) * 100 : 0}%`,
                          }}
                          title={`Transferido: ${formatMoney(srv.montoLiquidado)}`}
                        />
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${srv.montoTotal > 0 ? (srv.montoPendiente / srv.montoTotal) * 100 : 0}%`,
                          }}
                          title={`Pendiente: ${formatMoney(srv.montoPendiente)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

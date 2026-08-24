"use client";

import { KpisTesoreriaData } from "@/types/tesoreria";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Building2,
  CheckCircle2,
  TrendingUp,
  PieChart,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface KpisTesoreriaProps {
  kpis: KpisTesoreriaData;
  periodoLabel?: string;
}

export function KpisTesoreria({ kpis, periodoLabel }: KpisTesoreriaProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalVolumen = kpis.totalLiquidadoMonto + kpis.totalPendienteMonto;

  return (
    <div className="space-y-4">
      {/* Tarjetas Principales de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Liquidado (Pagado) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border border-emerald-100 dark:border-emerald-950/60 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Total Liquidado
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  {formatMoney(kpis.totalLiquidadoMonto)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0 h-4">
                    {kpis.totalLiquidadoCantidad} trámites pagados
                  </Badge>
                  {periodoLabel && <span className="text-gray-400 dark:text-slate-500">• {periodoLabel}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Pendiente de Pago (Aprobados por Dirección) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="border border-blue-100 dark:border-blue-950/60 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Pendiente de Pago
                </span>
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  {formatMoney(kpis.totalPendienteMonto)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-800 bg-blue-100/60 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] px-1.5 py-0 h-4">
                    {kpis.totalPendienteCantidad} listos para liquidar
                  </Badge>
                  <span className="text-gray-400 dark:text-slate-500">• Con firmas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Volumen Total del Período */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Volumen Total
                </span>
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  {formatMoney(totalVolumen)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                  <span>{kpis.totalLiquidadoCantidad + kpis.totalPendienteCantidad} prestaciones procesadas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Observaciones Fiscales */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Card className={`border ${
            kpis.totalObservadoCantidad > 0
              ? "border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/10 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          } shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Observados ARCA
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  {kpis.totalObservadoCantidad}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <span>{formatMoney(kpis.totalObservadoMonto)} en subsanación</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Desglose por Servicio Asistencial (Notion Clean UI) */}
      {kpis.desglosePorServicio.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  Desglose Presupuestario por Servicio Asistencial
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {kpis.desglosePorServicio.length} servicios con actividad
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {kpis.desglosePorServicio.map((srv) => (
                <div
                  key={srv.servicioKey}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium text-gray-900 dark:text-slate-200 truncate pr-2"
                      title={srv.servicioLabel}
                    >
                      {srv.servicioLabel}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                      {formatMoney(srv.montoTotal)}
                    </span>
                  </div>

                  {/* Barra de Progreso relativa */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                    {srv.montoLiquidado > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(srv.montoLiquidado / srv.montoTotal) * 100}%`,
                        }}
                        title={`Liquidado: ${formatMoney(srv.montoLiquidado)}`}
                      />
                    )}
                    {srv.montoPendiente > 0 && (
                      <div
                        className="bg-blue-400 dark:bg-blue-500 h-full"
                        style={{
                          width: `${(srv.montoPendiente / srv.montoTotal) * 100}%`,
                        }}
                        title={`Pendiente: ${formatMoney(srv.montoPendiente)}`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Liq: {formatMoney(srv.montoLiquidado)}</span>
                      {srv.montoPendiente > 0 && (
                        <>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 ml-1"></span>
                          <span>Pend: {formatMoney(srv.montoPendiente)}</span>
                        </>
                      )}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {srv.porcentajeDelTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

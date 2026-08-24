"use client";

import { KpisTesoreriaData } from "@/types/tesoreria";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  PieChart,
  DollarSign,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { motion } from "framer-motion";

interface VistaMetricasTesoreriaProps {
  kpis: KpisTesoreriaData;
  periodoLabel?: string;
}

export function VistaMetricasTesoreria({ kpis, periodoLabel }: VistaMetricasTesoreriaProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalVolumen = kpis.totalLiquidadoMonto + kpis.totalPendienteMonto;

  return (
    <div className="space-y-6">
      {/* 4 Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidado */}
        <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Total Transferido (BSE)
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {formatMoney(kpis.totalLiquidadoMonto)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[10px]">
                  {kpis.totalLiquidadoCantidad} trámites pagados
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pendiente de Pago */}
        <Card className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Pendiente de Liquidar
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {formatMoney(kpis.totalPendienteMonto)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
                <Badge variant="outline" className="border-blue-300 dark:border-blue-800 bg-blue-100 text-blue-800 dark:text-blue-300 text-[10px]">
                  {kpis.totalPendienteCantidad} prestaciones con firmas
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conformados para Lote */}
        <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                Conformados (Controlados)
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {formatMoney(kpis.totalConformadoMonto)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                <Badge variant="outline" className="border-indigo-300 dark:border-indigo-800 bg-indigo-100 text-indigo-800 dark:text-indigo-300 text-[10px]">
                  {kpis.totalConformadoCantidad} listos para caratular
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observaciones Fiscales */}
        <Card className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Observaciones Fiscales
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {kpis.totalObservadoCantidad} trámites
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                <span>{formatMoney(kpis.totalObservadoMonto)} retenido</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Servicio Hospitalario */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Distribución de Honorarios por Servicio Asistencial
                </CardTitle>
                <CardDescription className="text-xs">
                  Volumen total asignado por servicio hospitalario en {periodoLabel || "el período seleccionado"}.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold">
              Volumen Total: {formatMoney(totalVolumen)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {kpis.desglosePorServicio.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No hay datos asistenciales registrados para el período seleccionado.
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.desglosePorServicio.map((srv) => (
                <div key={srv.servicioKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {srv.servicioLabel}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">
                        {srv.cantidadPrestaciones} trámites
                      </span>
                      <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formatMoney(srv.montoTotal)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 w-12 text-right">
                        {srv.porcentajeDelTotal.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Barra de progreso */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 rounded-l-full"
                      style={{
                        width: `${srv.montoTotal > 0 ? (srv.montoLiquidado / srv.montoTotal) * srv.porcentajeDelTotal : 0}%`,
                      }}
                      title={`Liquidado: ${formatMoney(srv.montoLiquidado)}`}
                    />
                    <div
                      className="h-full bg-blue-500 rounded-r-full"
                      style={{
                        width: `${srv.montoTotal > 0 ? (srv.montoPendiente / srv.montoTotal) * srv.porcentajeDelTotal : 0}%`,
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
  );
}

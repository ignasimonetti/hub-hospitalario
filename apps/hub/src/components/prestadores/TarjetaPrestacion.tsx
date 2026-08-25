"use client";

import { useMemo } from "react";
import {
  PrestacionPresentacion,
  ESTADOS_PRESTACION_CONFIG,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
} from "@/types/prestadores";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  Activity,
  CalendarClock,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Hourglass,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface TarjetaPrestacionProps {
  prestacion: PrestacionPresentacion;
  onClick: () => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function TarjetaPrestacion({ prestacion, onClick }: TarjetaPrestacionProps) {
  const estadoCfg = ESTADOS_PRESTACION_CONFIG[prestacion.status];
  const mesNombre = MESES[prestacion.period_month - 1] || `Mes ${prestacion.period_month}`;
  const isGuardia = prestacion.service_type === "guardia";
  const isEH = prestacion.service_type === "extension_horaria";
  const isObservada = prestacion.status === "observado" || prestacion.status === "observado_tesoreria";

  // Resumen del volumen prestacional desde el campo plano service_days_detail
  // (evita parsear digital_form_data — JSON pesado — en cada card del dashboard)
  const resumenVolumen = useMemo(() => {
    const detalle = prestacion?.service_days_detail?.trim();
    if (!detalle) {
      return isGuardia ? "Guardias Médicas" : "Extensión Horaria";
    }

    if (isGuardia) {
      // Formato: "dd/mm (hh:mm-hh:mm Ordinaria), dd/mm (...)"
      const cant = (detalle.match(/\(/g) || []).length || 1;
      return `${cant} guardia${cant > 1 ? "s" : ""}`;
    } else {
      // Formato: "dd/mm (4 hs - 14:00 a 18:00), ..."
      const matches = detalle.match(/(\d+(?:[.,]\d+)?)\s*hs/gi) || [];
      let totalHs = 0;
      let cantDias = 0;
      for (const m of matches) {
        totalHs += parseFloat(m.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        cantDias++;
      }
      if (cantDias === 0) return "Extensión Horaria";
      return `${totalHs} hs en ${cantDias} día${cantDias > 1 ? "s" : ""}`;
    }
  }, [prestacion?.service_days_detail, isGuardia]);

  // Indicador de Paso en el Circuito (si no está observada)
  const pasoCircuito = useMemo(() => {
    switch (prestacion.status) {
      case "borrador":
        return { label: "Borrador sin tramitar", icon: Hourglass, color: "text-slate-500 bg-slate-100 dark:bg-slate-800" };
      case "pendiente":
      case "en_revision":
        return { label: "Paso 1: Control Dirección Adjunta", icon: ShieldCheck, color: "text-amber-700 bg-amber-50 dark:bg-amber-950/60" };
      case "visado_adjunto":
        return { label: "Paso 2: Firma Dirección Coordinadora", icon: ShieldCheck, color: "text-violet-700 bg-violet-50 dark:bg-violet-950/60" };
      case "aprobado":
        return { label: "Paso 3: En Tesorería para Liquidación", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60" };
      case "pagado":
        return { label: "Circuito Completado (Abonado)", icon: CheckCircle2, color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60" };
      default:
        return { label: "En Trámite", icon: Clock, color: "text-slate-600 bg-slate-100" };
    }
  }, [prestacion.status]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const motivoObservacion = prestacion.director_observation || prestacion.treasury_observation || "Se requiere subsanación para continuar.";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <Card className={`border transition-all rounded-2xl overflow-hidden h-full flex flex-col justify-between shadow-2xs hover:shadow-md ${
        prestacion.status === "observado"
          ? "border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-slate-900"
          : prestacion.status === "observado_tesoreria"
          ? "border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-slate-900"
          : "border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90"
      }`}>
        <CardContent className="p-4 flex flex-col justify-between flex-1 gap-3">
          {/* Cabecera: Icono + Identificador + Factura + Pastilla de Estado única */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isGuardia
                    ? "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                    : isEH
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isGuardia ? (
                  <Activity className="w-4 h-4" />
                ) : isEH ? (
                  <CalendarClock className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                {prestacion.form_number ? (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                    {prestacion.form_number}
                  </span>
                ) : (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    Sin N° asignado
                  </span>
                )}
                {prestacion.invoice_number && (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                    Fac {prestacion.invoice_number}
                  </span>
                )}
              </div>
            </div>

            {/* Única pastilla de estado principal en la cabecera */}
            <span
              className={`shrink-0 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${estadoCfg.bgLight} ${estadoCfg.textDark}`}
            >
              {estadoCfg.label}
            </span>
          </div>

          {/* Bloque de Servicio / Sector y Período en contenedor dedicado a ancho completo */}
          <div className="space-y-1.5">
            {/* Servicio en contenedor propio para evitar colapsos y cortes de texto */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Servicio / Sector
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug break-words mt-0.5">
                {prestacion.hospital_service
                  ? (SECTORES_SERVICIO_MAP[prestacion.hospital_service as SectorServicio] || prestacion.hospital_service)
                  : (isGuardia ? "Guardia Central" : "Servicio Hospitalario")}
              </p>
            </div>

            {/* Período */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 px-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Período: <strong className="text-slate-700 dark:text-slate-300">{mesNombre} {prestacion.period_year}</strong>
              </span>
            </div>
          </div>

          {/* Bloque Central: Si está observada muestra motivo destacado; si no, muestra el estado del circuito */}
          {isObservada ? (
            <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
              prestacion.status === "observado_tesoreria"
                ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                : "bg-rose-50/90 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
            }`}>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {prestacion.status === "observado_tesoreria"
                    ? "Observación de Tesorería"
                    : "Observación de Dirección"}
                </span>
                <span className="text-[10px] font-semibold underline text-sky-700 dark:text-sky-400 flex items-center gap-0.5 shrink-0">
                  Subsanar <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                "{motivoObservacion}"
              </p>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200/50 dark:border-slate-800 ${pasoCircuito.color}`}>
              <pasoCircuito.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{pasoCircuito.label}</span>
            </div>
          )}

          {/* Pie: Monto Facturado vs Fecha */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                {prestacion.status === "pagado" ? "Monto Abonado" : "Monto Facturado"}
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
                {formatMoney(prestacion.invoice_amount)}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
              <span className="text-[11px] font-medium">{formatDate(prestacion.submitted_at || prestacion.created)}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


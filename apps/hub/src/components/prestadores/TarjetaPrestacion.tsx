"use client";

import {
  PrestacionPresentacion,
  ESTADOS_PRESTACION_CONFIG,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
} from "@/types/prestadores";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  Clock,
  Activity,
  CalendarClock,
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
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isGuardia
                    ? "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                    : isEH
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isGuardia ? (
                  <Activity className="w-5 h-5" />
                ) : isEH ? (
                  <CalendarClock className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prestacion.form_number
                      ? `${prestacion.form_number} • Factura ${prestacion.invoice_number}`
                      : `Factura ${prestacion.invoice_number}`}
                  </h4>
                  {isGuardia && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
                      Guardias
                    </span>
                  )}
                  {isEH && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Extensión Horaria
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    {mesNombre} {prestacion.period_year}
                    {prestacion.hospital_service &&
                      ` • ${
                        SECTORES_SERVICIO_MAP[prestacion.hospital_service as SectorServicio] ||
                        prestacion.hospital_service
                      }`}
                  </span>
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${estadoCfg.bgLight} ${estadoCfg.textDark}`}
            >
              {estadoCfg.label}
            </span>
          </div>

          {/* Banner de alerta si está observada */}
          {prestacion.status === "observado" && prestacion.treasury_observation && (
            <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="truncate">Observación: {prestacion.treasury_observation}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Monto Liquidado
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatMoney(prestacion.invoice_amount)}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
              <span className="text-[11px]">{formatDate(prestacion.submitted_at || prestacion.created)}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

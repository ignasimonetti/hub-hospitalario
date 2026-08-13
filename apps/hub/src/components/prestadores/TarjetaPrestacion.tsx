"use client";

import {
  PrestacionPresentacion,
  ESTADOS_PRESTACION_CONFIG,
  TIPOS_PRESTACION_MAP,
} from "@/types/prestadores";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, ChevronRight, AlertCircle, Clock } from "lucide-react";
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
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Factura {prestacion.invoice_number}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {mesNombre} {prestacion.period_year} • {TIPOS_PRESTACION_MAP[prestacion.service_type]}
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

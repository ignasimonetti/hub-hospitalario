"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, ArrowRight, Stethoscope, FileSpreadsheet } from "lucide-react";

interface ModalSeleccionarTipoTramiteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTipo: (tipo: "guardia" | "extension_horaria") => void;
}

export function ModalSeleccionarTipoTramite({
  open,
  onOpenChange,
  onSelectTipo,
}: ModalSeleccionarTipoTramiteProps) {
  const handleSelect = (tipo: "guardia" | "extension_horaria") => {
    onOpenChange(false);
    onSelectTipo(tipo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Nueva Presentación Digital
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona el formulario digital oficial que deseas confeccionar y liquidar ante Tesorería:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 pb-1">
          {/* Opción 1: Guardias Médicas (Formulario Único G) */}
          <button
            type="button"
            onClick={() => handleSelect("guardia")}
            className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                  Formulario G
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Guardias Médicas
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Para guardias activas presenciales de 12hs o 24hs (ordinarias o críticas) en el servicio asistencial.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
              <span>Confeccionar Planilla</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Opción 2: Extensión Horaria (Formulario Único EH) */}
          <button
            type="button"
            onClick={() => handleSelect("extension_horaria")}
            className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Formulario EH
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Extensión Horaria
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Para horas asistenciales programadas adicionales que exceden la carga horaria regular del servicio.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Confeccionar Planilla</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

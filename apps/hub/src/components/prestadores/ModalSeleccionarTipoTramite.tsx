"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Stethoscope, FileSpreadsheet } from "lucide-react";

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
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <DialogHeader className="space-y-1.5 text-center">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nueva Presentación
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona el tipo de prestación que deseas liquidar:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 pb-1">
          {/* Opción 1: Guardias */}
          <button
            type="button"
            onClick={() => handleSelect("guardia")}
            className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/30 text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Guardias
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Formulario G
              </span>
            </div>
          </button>

          {/* Opción 2: Extensión Horaria */}
          <button
            type="button"
            onClick={() => handleSelect("extension_horaria")}
            className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Extensión Horaria
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Formulario EH
              </span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

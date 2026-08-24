"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FeriadoConfig } from "@/types/prestadores";

interface DatePickerInhabilesProps {
  value?: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  feriados?: FeriadoConfig[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePickerInhabiles({
  value,
  onChange,
  feriados = [],
  placeholder = "Seleccionar fecha",
  className,
  disabled = false,
}: DatePickerInhabilesProps) {
  const [open, setOpen] = React.useState(false);

  // Convertir string YYYY-MM-DD a Date local seguro
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3) return undefined;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [value]);

  // Set de fechas de feriados para lookup rápido
  const feriadosMap = React.useMemo(() => {
    const map = new Map<string, FeriadoConfig>();
    feriados.forEach((f) => map.set(f.fecha, f));
    return map;
  }, [feriados]);

  // Modificadores de react-day-picker para sombreado
  const modifiers = React.useMemo(() => {
    return {
      inhabil: (date: Date) => {
        const day = date.getDay();
        const dateStr = format(date, "yyyy-MM-dd");
        return day === 0 || day === 6 || feriadosMap.has(dateStr);
      },
      feriado: (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return feriadosMap.has(dateStr);
      },
    };
  }, [feriadosMap]);

  const handleSelect = (date?: Date) => {
    if (!date) return;
    const formatted = format(date, "yyyy-MM-dd");
    onChange(formatted);
    setOpen(false);
  };

  const currentInfo = React.useMemo(() => {
    if (!value) return null;
    const f = feriadosMap.get(value);
    if (f) return { label: `🎌 ${f.motivo}`, isInhabil: true };
    if (selectedDate) {
      const day = selectedDate.getDay();
      if (day === 0) return { label: "Domingo", isInhabil: true };
      if (day === 6) return { label: "Sábado", isInhabil: true };
    }
    return { label: "Hábil", isInhabil: false };
  }, [value, feriadosMap, selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-between text-left font-normal text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 px-2.5",
            !value && "text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>
              {selectedDate
                ? format(selectedDate, "dd/MM/yyyy", { locale: es })
                : placeholder}
            </span>
          </div>

          {currentInfo && (
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 truncate max-w-[120px]",
                currentInfo.isInhabil
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {currentInfo.label}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-2xl z-50"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
          modifiers={modifiers}
          modifiersClassNames={{
            inhabil: "!bg-amber-500/10 !text-amber-800 dark:!text-amber-300 font-semibold rounded-lg hover:!bg-amber-500/20",
            feriado: "!bg-amber-500/15 !text-amber-900 dark:!text-amber-200 font-bold border border-amber-300/60 dark:border-amber-700/60 rounded-lg shadow-2xs hover:!bg-amber-500/25",
          }}
          className="rounded-xl text-xs"
        />

        {/* Referencias visuales en el pie del calendario */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 px-1 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-amber-500/20 border border-amber-400/60 inline-block shrink-0" />
            <span className="font-medium text-slate-600 dark:text-slate-400">Fines de semana y feriados</span>
          </div>
          <span className="text-[9.5px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            Tarifa Inhábil
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

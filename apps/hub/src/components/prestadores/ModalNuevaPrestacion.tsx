"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PrestadorPerfil,
  TipoPrestacion,
  SectorServicio,
  TipoDiasPrestacion,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  PrestacionPresentacion,
  RenglonGuardiaDigital,
  RenglonExtensionHorariaDigital,
  FormularioDigitalData,
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import {
  submitPrestacion,
  resubmitPrestacion,
  getNextFormNumber,
} from "@/lib/services/prestadoresService";
import { getPrestadoresConfig } from "@/lib/services/parametersService";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Paperclip,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  Activity,
  CalendarClock,
  Clock,
  UserCheck,
  ClipboardList,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";

interface ModalNuevaPrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PrestadorPerfil;
  tenantId: string;
  tenantCode?: string;
  onCreated: (prestacion: PrestacionPresentacion) => void;
  onOpenPerfil?: () => void;
  observadaParaReenviar?: PrestacionPresentacion | null;
  tipoInicial?: "guardia" | "extension_horaria";
}

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export function ModalNuevaPrestacion({
  open,
  onOpenChange,
  perfil,
  tenantId,
  tenantCode = "CISB",
  onCreated,
  onOpenPerfil,
  observadaParaReenviar = null,
  tipoInicial = "guardia",
}: ModalNuevaPrestacionProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Tipo de Trámite
  const [serviceType, setServiceType] = useState<TipoPrestacion>(
    observadaParaReenviar
      ? (observadaParaReenviar.service_type as TipoPrestacion)
      : tipoInicial
  );

  // Sincronizar tipoInicial si cambia al abrir el modal
  useEffect(() => {
    if (open) {
      if (observadaParaReenviar) {
        setServiceType(observadaParaReenviar.service_type as TipoPrestacion);
      } else {
        setServiceType(tipoInicial);
      }
    }
  }, [open, tipoInicial, observadaParaReenviar]);

  // Período y Sector
  const [periodMonth, setPeriodMonth] = useState<number>(
    observadaParaReenviar ? observadaParaReenviar.period_month : currentMonth
  );
  const [periodYear, setPeriodYear] = useState<number>(
    observadaParaReenviar ? observadaParaReenviar.period_year : currentYear
  );
  const [hospitalService, setHospitalService] = useState<SectorServicio>(
    (observadaParaReenviar?.hospital_service as SectorServicio) || "guardia_emergencias"
  );

  // Configuración de aranceles y topes (dinámica desde SuperAdmin)
  const [config, setConfig] = useState<ConfiguracionModuloPrestadores>(
    DEFAULT_CONFIGURACION_PRESTADORES
  );

  useEffect(() => {
    if (open) {
      getPrestadoresConfig(tenantId).then(setConfig);
    }
  }, [open, tenantId]);

  // Campos específicos de Guardias (Formulario G)
  const [reemplazoDe, setReemplazoDe] = useState<string>("");
  const [renglonesGuardia, setRenglonesGuardia] = useState<RenglonGuardiaDigital[]>([
    {
      id: "g-1",
      fecha: "",
      hora_entrada: "08:00",
      hora_salida: "20:00",
      tipo: "normal",
    },
  ]);

  // Campos específicos de Extensión Horaria (Formulario EH)
  const [cargoEspecialidad, setCargoEspecialidad] = useState<string>(
    perfil.specialty || ""
  );
  const [renglonesEH, setRenglonesEH] = useState<RenglonExtensionHorariaDigital[]>([
    {
      id: "eh-1",
      fecha: "",
      horario_programado: "14:00 a 18:00",
      horas_cumplidas: 4,
    },
  ]);

  // Observaciones comunes
  const [observaciones, setObservaciones] = useState<string>("");

  // Factura Única (Nuevo paradigma: 1 Formulario = 1 Factura)
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    observadaParaReenviar ? observadaParaReenviar.invoice_number : ""
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    observadaParaReenviar ? observadaParaReenviar.invoice_date.split("T")[0] : ""
  );
  const [invoiceAmount, setInvoiceAmount] = useState<string>(
    observadaParaReenviar ? String(observadaParaReenviar.invoice_amount) : ""
  );
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Validación de Conducta Fiscal desde el Perfil
  const estadoConducta = useMemo(() => {
    if (!perfil.conducta_fiscal_due_date) {
      return {
        valida: false,
        mensaje: "No has configurado la fecha de vencimiento de tu Conducta Fiscal.",
        detalle: "Actualiza tu perfil para adjuntar la constancia.",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(`${perfil.conducta_fiscal_due_date.split("T")[0]}T00:00:00`);

    if (isNaN(dueDate.getTime())) {
      return {
        valida: false,
        mensaje: "Fecha de vencimiento de Conducta Fiscal no válida.",
        detalle: "Actualiza tu perfil de prestador.",
      };
    }

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        valida: false,
        vencida: true,
        mensaje: `Tu Conducta Fiscal está VENCIDA (${dueDate.toLocaleDateString("es-AR")}).`,
        detalle: "Debes actualizar la constancia en tu perfil para poder presentar liquidaciones.",
      };
    }

    return {
      valida: true,
      mensaje: `Conducta Fiscal vigente hasta el ${dueDate.toLocaleDateString("es-AR")}`,
      detalle: diffDays <= 7 ? `⚠️ Vence en ${diffDays} días` : "Documentación tributaria al día",
    };
  }, [perfil.conducta_fiscal_due_date]);

  // Inicializar estado si es una corrección observada con digital_form_data
  useEffect(() => {
    if (observadaParaReenviar?.digital_form_data) {
      try {
        const raw =
          typeof observadaParaReenviar.digital_form_data === "string"
            ? JSON.parse(observadaParaReenviar.digital_form_data)
            : observadaParaReenviar.digital_form_data;

        if (raw.tipo_formulario === "guardia") {
          setReemplazoDe(raw.reemplazo_de || "");
          setObservaciones(raw.observaciones || "");
          if (raw.renglones && raw.renglones.length > 0) {
            setRenglonesGuardia(raw.renglones);
          }
        } else if (raw.tipo_formulario === "extension_horaria") {
          setCargoEspecialidad(raw.cargo_especialidad || perfil.specialty || "");
          setObservaciones(raw.observaciones || "");
          if (raw.renglones && raw.renglones.length > 0) {
            setRenglonesEH(raw.renglones);
          }
        }
      } catch (e) {
        console.error("Error parsing digital form data:", e);
      }
    }
  }, [observadaParaReenviar, perfil]);

  // Handlers para renglones de Guardias
  const handleAddRenglonGuardia = () => {
    if (renglonesGuardia.length >= 15) {
      toast.error("El formulario oficial admite hasta 15 guardias por planilla.");
      return;
    }
    setRenglonesGuardia((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        fecha: "",
        hora_entrada: "08:00",
        hora_salida: "20:00",
        tipo: "normal",
      },
    ]);
  };

  const handleRemoveRenglonGuardia = (id: string) => {
    if (renglonesGuardia.length <= 1) return;
    setRenglonesGuardia((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRenglonGuardia = (
    id: string,
    field: keyof RenglonGuardiaDigital,
    value: any
  ) => {
    setRenglonesGuardia((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Handlers para renglones de Extensión Horaria
  const handleAddRenglonEH = () => {
    if (renglonesEH.length >= 25) {
      toast.error("El formulario oficial admite hasta 25 registros por planilla.");
      return;
    }
    setRenglonesEH((prev) => [
      ...prev,
      {
        id: `eh-${Date.now()}`,
        fecha: "",
        horario_programado: "14:00 a 18:00",
        horas_cumplidas: 4,
      },
    ]);
  };

  const handleRemoveRenglonEH = (id: string) => {
    if (renglonesEH.length <= 1) return;
    setRenglonesEH((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRenglonEH = (
    id: string,
    field: keyof RenglonExtensionHorariaDigital,
    value: any
  ) => {
    setRenglonesEH((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Solo se permiten archivos en formato PDF");
        e.target.value = "";
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("El archivo supera el límite máximo de 15MB");
        e.target.value = "";
        return;
      }
      setInvoiceFile(file);
    }
  };

  // Cálculo de totales y montos sugeridos según aranceles vigentes
  const totalHorasEH = renglonesEH.reduce(
    (sum, r) => sum + (Number(r.horas_cumplidas) || 0),
    0
  );

  const montoSugerido = useMemo(() => {
    if (serviceType === "guardia") {
      return renglonesGuardia.reduce((sum, g) => {
        if (!g.fecha) return sum;
        const d = new Date(`${g.fecha}T12:00:00`);
        const dayOfWeek = d.getDay(); // 0 es Domingo, 6 es Sábado
        const isInhabil = dayOfWeek === 0 || dayOfWeek === 6;
        if (g.tipo === "critica") {
          return sum + (isInhabil ? config.valor_guardia_critica_inhabil : config.valor_guardia_critica_habil);
        } else {
          return sum + (isInhabil ? config.valor_guardia_ordinaria_inhabil : config.valor_guardia_ordinaria_habil);
        }
      }, 0);
    } else {
      return totalHorasEH * config.valor_hora_extension;
    }
  }, [serviceType, renglonesGuardia, totalHorasEH, config]);

  const numInvoiceAmount = parseFloat(invoiceAmount) || 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Validación y confirmación
  const handlePromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Validar Conducta Fiscal
    if (!estadoConducta.valida) {
      toast.error(estadoConducta.mensaje);
      return;
    }

    // 1. Validar Asistencia Digital
    if (serviceType === "guardia") {
      if (renglonesGuardia.length === 0) {
        toast.error("Debes registrar al menos una guardia en la planilla digital.");
        return;
      }
      for (let i = 0; i < renglonesGuardia.length; i++) {
        const r = renglonesGuardia[i];
        if (!r.fecha) {
          toast.error(`Selecciona la fecha para la Guardia #${i + 1}`);
          return;
        }
        if (!r.hora_entrada || !r.hora_salida) {
          toast.error(`Ingresa horario de entrada y salida para la Guardia #${i + 1}`);
          return;
        }
      }
    } else {
      if (renglonesEH.length === 0) {
        toast.error("Debes registrar al menos un día en la planilla digital.");
        return;
      }
      for (let i = 0; i < renglonesEH.length; i++) {
        const r = renglonesEH[i];
        if (!r.fecha) {
          toast.error(`Selecciona la fecha para el Registro #${i + 1}`);
          return;
        }
        if (!r.horas_cumplidas || Number(r.horas_cumplidas) <= 0) {
          toast.error(`Ingresa las horas cumplidas para el Registro #${i + 1}`);
          return;
        }
      }
    }

    // 2. Validar Factura Única
    if (!invoiceNumber.trim()) {
      toast.error("Ingresa el número de tu comprobante fiscal");
      return;
    }
    if (!invoiceDate) {
      toast.error("Ingresa la fecha de emisión de la factura");
      return;
    }
    if (numInvoiceAmount <= 0) {
      toast.error("Ingresa un importe válido mayor a $0");
      return;
    }
    if (!observadaParaReenviar && !invoiceFile) {
      toast.error("Debes adjuntar el archivo PDF de la Factura");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    // Preparar objeto de formulario digital oficial
    let digitalFormData: FormularioDigitalData;
    let summaryDaysDetail = "";

    if (serviceType === "guardia") {
      digitalFormData = {
        tipo_formulario: "guardia",
        reemplazo_de: reemplazoDe.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesGuardia,
      };
      summaryDaysDetail = renglonesGuardia
        .map((g) => `${g.fecha.split("-").slice(1).reverse().join("/")} (${g.hora_entrada}-${g.hora_salida} ${g.tipo === "critica" ? "Crítica" : "Ordinaria"})`)
        .join(", ");
    } else {
      digitalFormData = {
        tipo_formulario: "extension_horaria",
        cargo_especialidad: cargoEspecialidad.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesEH,
      };
      summaryDaysDetail = renglonesEH
        .map((eh) => `${eh.fecha.split("-").slice(1).reverse().join("/")} (${eh.horas_cumplidas} hs - ${eh.horario_programado})`)
        .join(", ");
    }

    try {
      // Generar serie oficial en el momento exacto del submit
      const generatedFormNumber =
        observadaParaReenviar?.form_number ||
        (await getNextFormNumber(
          serviceType === "guardia" ? "guardia" : "extension_horaria",
          tenantCode
        ));

      const formData = new FormData();
      formData.append("tenant", tenantId);
      formData.append("period_month", String(periodMonth));
      formData.append("period_year", String(periodYear));
      formData.append("form_number", generatedFormNumber);
      formData.append("invoice_number", invoiceNumber.trim());
      formData.append("invoice_date", invoiceDate);
      formData.append("invoice_amount", String(numInvoiceAmount));
      formData.append("service_type", serviceType);
      formData.append("hospital_service", hospitalService);
      formData.append("service_days_type", "dias_especificos");
      formData.append("service_days_detail", summaryDaysDetail);
      formData.append("digital_form_data", JSON.stringify(digitalFormData));
      formData.append(
        "conducta_fiscal_due_date",
        perfil.conducta_fiscal_due_date || new Date().toISOString()
      );

      if (invoiceFile) {
        formData.append("file_invoice", invoiceFile);
      }

      let result: PrestacionPresentacion;
      if (observadaParaReenviar) {
        result = await resubmitPrestacion(observadaParaReenviar.id, formData);
        toast.success("Corrección reenviada a Tesorería exitosamente");
      } else {
        result = await submitPrestacion(formData);
        toast.success(`Trámite ${generatedFormNumber} remitido a Tesorería con éxito`);
      }

      onCreated(result);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la presentación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMonthLabel = MESES.find((m) => m.value === periodMonth)?.label || "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    serviceType === "guardia"
                      ? "bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400"
                      : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {serviceType === "guardia" ? (
                    <Activity className="w-5 h-5" />
                  ) : (
                    <CalendarClock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {serviceType === "guardia"
                      ? "Formulario Único de Guardias (G)"
                      : "Formulario Único de Extensión Horaria (EH)"}
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {serviceType === "guardia"
                      ? "Solicitud y certificación de guardias médicas activas"
                      : "Solicitud y certificación de horas asistenciales adicionales"}
                  </p>
                </div>
              </div>

              {/* Badges de Serie y Tipo */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {observadaParaReenviar?.form_number ? (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Nº Serie:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                      {observadaParaReenviar.form_number}
                    </span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                    Serie: {tenantCode}-{serviceType === "guardia" ? "G" : "EH"}-{currentYear}-AUTO
                  </div>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                    serviceType === "guardia"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800"
                  }`}
                >
                  {serviceType === "guardia" ? "Formulario G" : "Formulario EH"}
                </span>
              </div>
            </div>
          </DialogHeader>

          {observadaParaReenviar?.treasury_observation && (
            <div className="my-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Motivo de Observación de Tesorería:</span>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                  {observadaParaReenviar.treasury_observation}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handlePromptConfirm} className="space-y-4 py-2 text-left">
            {/* ESTADO DINÁMICO DE CONDUCTA FISCAL */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                estadoConducta.valida
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {estadoConducta.valida ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">{estadoConducta.mensaje}</span>
                  <span className="text-[11px] opacity-85">{estadoConducta.detalle}</span>
                </div>
              </div>

              {!estadoConducta.valida && onOpenPerfil && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenPerfil();
                  }}
                  className="h-7 text-xs bg-white dark:bg-slate-900 border-rose-300 text-rose-700 hover:bg-rose-50 shrink-0"
                >
                  Actualizar Perfil <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {/* SECCIÓN 1: DETALLE DE PRESENTACIÓN */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Período y Sector Asistencial
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Mes Devengado</Label>
                  <Select
                    value={String(periodMonth)}
                    onValueChange={(val) => setPeriodMonth(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900">
                      {MESES.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Año</Label>
                  <Input
                    type="number"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                    min={2020}
                    max={2030}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Servicio / Sector Hospitalario
                </Label>
                <Select
                  value={hospitalService}
                  onValueChange={(val: SectorServicio) => setHospitalService(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    {Object.entries(SECTORES_SERVICIO_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo específico según formulario */}
              {serviceType === "guardia" ? (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    En Reemplazo De (Opcional)
                  </Label>
                  <Input
                    placeholder="Ej. Dr. Juan Pérez (si corresponde)"
                    value={reemplazoDe}
                    onChange={(e) => setReemplazoDe(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Cargo / Función / Especialidad
                  </Label>
                  <Input
                    placeholder="Ej. Médico Consultorios Externos / Cirujano Asistencial"
                    value={cargoEspecialidad}
                    onChange={(e) => setCargoEspecialidad(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 2: PLANILLA DE ASISTENCIA Y CÁLCULO DE ARANCELES */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
                  Planilla de Asistencia ({serviceType === "guardia" ? "Guardias Médicas" : "Extensión Horaria"})
                </h4>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={serviceType === "guardia" ? handleAddRenglonGuardia : handleAddRenglonEH}
                  className="h-7 text-xs bg-white dark:bg-slate-900 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {serviceType === "guardia" ? "Agregar Guardia" : "Agregar Registro"}
                </Button>
              </div>

              {/* Renglones Formulario G */}
              {serviceType === "guardia" ? (
                <div className="space-y-2">
                  {renglonesGuardia.map((r, index) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-5 shrink-0">
                        #{index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px] text-slate-400 sm:hidden">Fecha</Label>
                          <Input
                            type="date"
                            value={r.fecha}
                            onChange={(e) => handleUpdateRenglonGuardia(r.id, "fecha", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Input
                            type="time"
                            value={r.hora_entrada}
                            onChange={(e) => handleUpdateRenglonGuardia(r.id, "hora_entrada", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 px-1"
                            title="Hora Entrada"
                          />
                          <span className="text-slate-400">a</span>
                          <Input
                            type="time"
                            value={r.hora_salida}
                            onChange={(e) => handleUpdateRenglonGuardia(r.id, "hora_salida", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 px-1"
                            title="Hora Salida"
                          />
                        </div>

                        <div>
                          <Select
                            value={r.tipo}
                            onValueChange={(val: "normal" | "critica") => handleUpdateRenglonGuardia(r.id, "tipo", val)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-950">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900">
                              <SelectItem value="normal" className="text-xs">
                                Ordinaria
                              </SelectItem>
                              <SelectItem value="critica" className="text-xs">
                                Crítica
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {renglonesGuardia.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRenglonGuardia(r.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Renglones Formulario EH */
                <div className="space-y-2">
                  {renglonesEH.map((r, index) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-5 shrink-0">
                        #{index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px] text-slate-400 sm:hidden">Fecha</Label>
                          <Input
                            type="date"
                            value={r.fecha}
                            onChange={(e) => handleUpdateRenglonEH(r.id, "fecha", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div>
                          <Input
                            placeholder="Ej. 14:00 a 18:00"
                            value={r.horario_programado}
                            onChange={(e) => handleUpdateRenglonEH(r.id, "horario_programado", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            value={r.horas_cumplidas}
                            onChange={(e) => handleUpdateRenglonEH(r.id, "horas_cumplidas", Number(e.target.value) || 0)}
                            className="h-8 text-xs font-bold bg-slate-50 dark:bg-slate-950 w-20"
                            required
                          />
                          <span className="text-[11px] text-slate-500">horas</span>
                        </div>
                      </div>

                      {renglonesEH.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRenglonEH(r.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Observaciones de la planilla (Opcional)
                </Label>
                <Textarea
                  placeholder="Información adicional o justificaciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 min-h-[50px]"
                />
              </div>
            </div>

            {/* SECCIÓN: FACTURACIÓN AFIP (1 FACTURA = 1 FORMULARIO) */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  Factura Electrónica (AFIP / ARCA)
                </h4>
              </div>

              {/* Banner de Total Calculado con botón Copiar */}
              {montoSugerido > 0 && (
                <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200/80 dark:border-sky-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-300">
                        Total calculado s/ aranceles vigentes:
                      </span>
                      <p className="text-sm font-extrabold text-sky-700 dark:text-sky-300">
                        {formatMoney(montoSugerido)}
                      </p>
                    </div>
                  </div>

                  {!invoiceAmount && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInvoiceAmount(String(montoSugerido))}
                      className="h-7 text-xs px-2.5 bg-sky-200/80 hover:bg-sky-300 text-sky-800 dark:bg-sky-900 dark:text-sky-200 font-semibold"
                    >
                      Copiar a Factura
                    </Button>
                  )}
                </div>
              )}

              {/* Formulario de Factura Única */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      N° de Factura <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="00001-00001234"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Fecha Emisión <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Monto ($) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 450000"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      className="h-9 text-xs font-semibold bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      PDF de la Factura <span className="text-rose-500">*</span>
                    </Label>
                    {invoiceFile && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {invoiceFile.name}
                      </span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleInvoiceFileChange}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !estadoConducta.valida}
                className={`w-full sm:w-auto text-white font-medium shadow-sm transition-colors ${
                  serviceType === "guardia"
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando a Tesorería...
                  </span>
                ) : observadaParaReenviar ? (
                  "Reenviar Corrección"
                ) : (
                  "Revisar y Enviar Planilla"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN PREVIA */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {observadaParaReenviar
                ? "¿Confirmar reenvío a Tesorería?"
                : `¿Confirmar envío del ${serviceType === "guardia" ? "Formulario G" : "Formulario EH"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Verifica el resumen de tu presentación antes de remitirla formalmente:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Trámite:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {serviceType === "guardia"
                  ? "Formulario G (Guardias Médicas)"
                  : "Formulario EH (Extensión Horaria)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Período:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedMonthLabel} {periodYear}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Servicio / Sector:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {SECTORES_SERVICIO_MAP[hospitalService]}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {serviceType === "guardia" ? "Guardias Registradas:" : "Horas Asistenciales:"}
              </span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {serviceType === "guardia"
                  ? `${renglonesGuardia.length} guardias activas`
                  : `${totalHorasEH} hs en ${renglonesEH.length} días`}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Factura Comprobante:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                N° {invoiceNumber}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Monto Total Facturado:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatMoney(numInvoiceAmount)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            * Al confirmar, se generará el número de trámite oficial correlativo y la planilla ingresará a la bandeja de Tesorería.
          </p>

          <AlertDialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setShowConfirmDialog(false)}
              className="w-full sm:w-auto text-xs"
            >
              Volver a revisar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSubmit}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm"
            >
              Sí, Confirmar y Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

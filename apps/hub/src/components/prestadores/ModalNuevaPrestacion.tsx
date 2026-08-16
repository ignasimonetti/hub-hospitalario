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
  MAX_INVOICE_AMOUNT,
  RenglonGuardiaDigital,
  RenglonExtensionHorariaDigital,
  FormularioDigitalData,
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import { submitPrestacion, resubmitPrestacion } from "@/lib/services/prestadoresService";
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
} from "lucide-react";

interface ModalNuevaPrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PrestadorPerfil;
  tenantId: string;
  onCreated: (prestacion: PrestacionPresentacion) => void;
  observadaParaReenviar?: PrestacionPresentacion | null;
  tipoInicial?: "guardia" | "extension_horaria";
}

interface FacturaFormItem {
  id: string;
  number: string;
  date: string;
  amount: string;
  file: File | null;
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
  onCreated,
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
    if (open && !observadaParaReenviar) {
      setServiceType(tipoInicial);
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

  // Facturas AFIP
  const [facturas, setFacturas] = useState<FacturaFormItem[]>([
    {
      id: "fac-1",
      number: observadaParaReenviar ? observadaParaReenviar.invoice_number : "",
      date: observadaParaReenviar ? observadaParaReenviar.invoice_date.split("T")[0] : "",
      amount: observadaParaReenviar ? String(observadaParaReenviar.invoice_amount) : "",
      file: null,
    },
  ]);

  // Conducta Fiscal
  const [conductaDueDate, setConductaDueDate] = useState<string>(
    observadaParaReenviar ? observadaParaReenviar.conducta_fiscal_due_date.split("T")[0] : ""
  );
  const [fileConducta, setFileConducta] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    value: string
  ) => {
    setRenglonesGuardia((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Handlers para renglones de Extensión Horaria
  const handleAddRenglonEH = () => {
    if (renglonesEH.length >= 15) {
      toast.error("El formulario oficial admite hasta 15 registros por planilla.");
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

  // Handlers para Facturas
  const handleAddFactura = () => {
    setFacturas((prev) => [
      ...prev,
      {
        id: `fac-${Date.now()}`,
        number: "",
        date: facturas[0]?.date || new Date().toISOString().split("T")[0],
        amount: "",
        file: null,
      },
    ]);
  };

  const handleRemoveFactura = (id: string) => {
    if (facturas.length <= 1) return;
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateFactura = (
    id: string,
    field: keyof FacturaFormItem,
    value: string | File | null
  ) => {
    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleInvoiceFileChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      handleUpdateFactura(id, "file", file);
    }
  };

  const handleConductaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFileConducta(file);
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

  const totalInvoiceAmount = facturas.reduce((sum, f) => {
    const val = parseFloat(f.amount);
    return sum + (isNaN(val) || val <= 0 ? 0 : val);
  }, 0);

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

    // 2. Validar Facturas y Tope configurable
    for (let i = 0; i < facturas.length; i++) {
      const fac = facturas[i];
      const facNum = i + 1;

      if (!fac.number.trim()) {
        toast.error(`Ingresa el número para el Comprobante #${facNum}`);
        return;
      }
      if (!fac.date) {
        toast.error(`Ingresa la fecha de emisión para el Comprobante #${facNum}`);
        return;
      }

      const numAmount = parseFloat(fac.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toast.error(`Ingresa un monto válido mayor a 0 para el Comprobante #${facNum}`);
        return;
      }

      if (numAmount > config.tope_maximo_factura) {
        toast.error(
          `El Comprobante #${facNum} (${formatMoney(numAmount)}) supera el límite normativo de ${formatMoney(
            config.tope_maximo_factura
          )}.`
        );
        return;
      }

      if (!observadaParaReenviar && !fac.file) {
        toast.error(`Debes adjuntar el archivo PDF del Comprobante #${facNum}`);
        return;
      }
    }

    // 3. Validar Conducta Fiscal
    if (!conductaDueDate) {
      toast.error("Ingresa la fecha de vencimiento de tu conducta fiscal");
      return;
    }
    if (!observadaParaReenviar && !fileConducta) {
      toast.error("Debes adjuntar el PDF de la Conducta Fiscal");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const invoiceNumbers = facturas.map((f) => f.number.trim()).join(", ");
    const primaryDate = facturas[0]?.date || new Date().toISOString().split("T")[0];

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

    const formPrefix = serviceType === "guardia" ? "G" : "EH";
    const formNumber =
      observadaParaReenviar?.form_number ||
      `${formPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const detail = facturas.map((f) => ({
      number: f.number.trim(),
      date: f.date,
      amount: parseFloat(f.amount) || 0,
      file_name: f.file?.name || "",
    }));

    const formData = new FormData();
    formData.append("tenant", tenantId);
    formData.append("period_month", String(periodMonth));
    formData.append("period_year", String(periodYear));
    formData.append("form_number", formNumber);
    formData.append("invoice_number", invoiceNumbers);
    formData.append("invoice_date", primaryDate);
    formData.append("invoice_amount", String(totalInvoiceAmount));
    formData.append("service_type", serviceType);
    formData.append("hospital_service", hospitalService);
    formData.append("service_days_type", "dias_especificos");
    formData.append("service_days_detail", summaryDaysDetail);
    formData.append("digital_form_data", JSON.stringify(digitalFormData));
    formData.append("conducta_fiscal_due_date", conductaDueDate);

    // Primera factura al campo principal
    if (facturas[0]?.file) {
      formData.append("file_invoice", facturas[0].file);
    }
    formData.append("invoices_detail", JSON.stringify(detail));

    if (fileConducta) {
      formData.append("file_conducta_fiscal", fileConducta);
    }

    try {
      let result: PrestacionPresentacion;
      if (observadaParaReenviar) {
        result = await resubmitPrestacion(observadaParaReenviar.id, formData);
        toast.success("Corrección reenviada a Tesorería exitosamente");
      } else {
        result = await submitPrestacion(formData);
        toast.success("Formulario y liquidación remitidos a Tesorería con éxito");
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
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  serviceType === "guardia"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {serviceType === "guardia" ? "Formulario G" : "Formulario EH"}
              </span>
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
            {/* SECCIÓN 1: DETALLE DE PRESENTACIÓN */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> 1. Detalle de Presentación
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Mes Devengado</Label>
                  <Select
                    value={String(periodMonth)}
                    onValueChange={(val) => setPeriodMonth(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                      <SelectValue />
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
                    min={2024}
                    max={2030}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Servicio / Sector Hospitalario <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={hospitalService}
                    onValueChange={(val: SectorServicio) => setHospitalService(val)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 max-h-56">
                      {Object.entries(SECTORES_SERVICIO_MAP).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {serviceType === "guardia" ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      En reemplazo de (opcional)
                    </Label>
                    <Input
                      placeholder="Nombre del colega a quien cubrió"
                      value={reemplazoDe}
                      onChange={(e) => setReemplazoDe(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Cargo / Especialidad
                    </Label>
                    <Input
                      placeholder="Ej. Médico Pediatra / Kinesiólogo"
                      value={cargoEspecialidad}
                      onChange={(e) => setCargoEspecialidad(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: CERTIFICACIÓN DE ASISTENCIA (GRILLA DIGITAL NATIVA) */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-sky-600" /> 2. Certificación de Asistencia
                </h4>
                {serviceType === "extension_horaria" && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Total: {totalHorasEH} hs cumplidas
                  </span>
                )}
              </div>

              {/* Formulario G: Grilla de Guardias */}
              {serviceType === "guardia" && (
                <div className="space-y-2.5">
                  {renglonesGuardia.map((renglon, index) => (
                    <div
                      key={renglon.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Guardia #{index + 1}
                        </span>
                        {renglonesGuardia.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRenglonGuardia(renglon.id)}
                            className="h-6 px-1.5 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Quitar
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Fecha</Label>
                          <Input
                            type="date"
                            value={renglon.fecha}
                            onChange={(e) =>
                              handleUpdateRenglonGuardia(renglon.id, "fecha", e.target.value)
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Hora Entrada</Label>
                          <Input
                            type="time"
                            value={renglon.hora_entrada}
                            onChange={(e) =>
                              handleUpdateRenglonGuardia(renglon.id, "hora_entrada", e.target.value)
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Hora Salida</Label>
                          <Input
                            type="time"
                            value={renglon.hora_salida}
                            onChange={(e) =>
                              handleUpdateRenglonGuardia(renglon.id, "hora_salida", e.target.value)
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Tipo de Guardia</Label>
                          <Select
                            value={renglon.tipo}
                            onValueChange={(val: "normal" | "critica") =>
                              handleUpdateRenglonGuardia(renglon.id, "tipo", val)
                            }
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
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRenglonGuardia}
                    className="h-8 text-xs border-dashed border-sky-400 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 w-full"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar otra guardia a la planilla
                  </Button>
                </div>
              )}

              {/* Formulario EH: Grilla de Extensión Horaria */}
              {serviceType === "extension_horaria" && (
                <div className="space-y-2.5">
                  {renglonesEH.map((renglon, index) => (
                    <div
                      key={renglon.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Día #{index + 1}
                        </span>
                        {renglonesEH.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRenglonEH(renglon.id)}
                            className="h-6 px-1.5 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Quitar
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Fecha</Label>
                          <Input
                            type="date"
                            value={renglon.fecha}
                            onChange={(e) =>
                              handleUpdateRenglonEH(renglon.id, "fecha", e.target.value)
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Horario Programado</Label>
                          <Input
                            placeholder="Ej. 14:00 a 18:00"
                            value={renglon.horario_programado}
                            onChange={(e) =>
                              handleUpdateRenglonEH(renglon.id, "horario_programado", e.target.value)
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Hs. Cumplidas</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            placeholder="Ej. 4"
                            value={renglon.horas_cumplidas}
                            onChange={(e) =>
                              handleUpdateRenglonEH(
                                renglon.id,
                                "horas_cumplidas",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-xs font-semibold bg-slate-50 dark:bg-slate-950"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRenglonEH}
                    className="h-8 text-xs border-dashed border-emerald-400 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 w-full"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar otro día a la planilla
                  </Button>
                </div>
              )}

              {/* Observaciones Generales */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Observaciones (opcional)
                </Label>
                <Textarea
                  placeholder="Detalles complementarios para Tesorería o Dirección..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  className="text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* SECCIÓN 3: FACTURACIÓN AFIP */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> 3. Facturación
                </h4>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Tope máx: {formatMoney(config.tope_maximo_factura)} por trámite
                </span>
              </div>

              {/* Banner con monto calculado automáticamente según aranceles vigentes */}
              {montoSugerido > 0 && (
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between text-xs text-sky-900 dark:text-sky-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Total estimado según aranceles vigentes:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-700 dark:text-sky-300">
                      {formatMoney(montoSugerido)}
                    </span>
                    {facturas.length === 1 && !facturas[0].amount && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateFactura(facturas[0].id, "amount", String(montoSugerido))}
                        className="h-6 text-[11px] px-2 bg-sky-200/70 hover:bg-sky-300 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                      >
                        Copiar a Factura
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {facturas.map((fac, index) => {
                  const facNum = index + 1;
                  const parsedAmt = parseFloat(fac.amount);
                  const isOverLimit = !isNaN(parsedAmt) && parsedAmt > config.tope_maximo_factura;

                  return (
                    <div
                      key={fac.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 relative shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-600" /> Factura AFIP #{facNum}
                        </span>

                        {facturas.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFactura(fac.id)}
                            className="h-6 px-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Quitar
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 dark:text-slate-400">
                            N° de Factura <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            placeholder="00001-00001234"
                            value={fac.number}
                            onChange={(e) => handleUpdateFactura(fac.id, "number", e.target.value)}
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
                            value={fac.date}
                            onChange={(e) => handleUpdateFactura(fac.id, "date", e.target.value)}
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
                            value={fac.amount}
                            onChange={(e) => handleUpdateFactura(fac.id, "amount", e.target.value)}
                            className={`h-9 text-xs font-semibold bg-slate-50 dark:bg-slate-950 ${
                              isOverLimit
                                ? "border-rose-500 focus-visible:ring-rose-500 text-rose-600 dark:text-rose-400"
                                : ""
                            }`}
                            required
                          />
                        </div>
                      </div>

                      {isOverLimit && (
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Tope superado:</strong> El monto individual no puede exceder {formatMoney(config.tope_maximo_factura)}. Por favor reduce este importe y presiona <strong>"+ Agregar otra factura"</strong> para distribuir el saldo.
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            PDF de la Factura #{facNum} <span className="text-rose-500">*</span>
                          </Label>
                          {fac.file && (
                            <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {fac.file.name}
                            </span>
                          )}
                        </div>
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleInvoiceFileChange(fac.id, e)}
                          className="h-9 text-xs bg-slate-50 dark:bg-slate-950 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFactura}
                  className="h-8 text-xs border-dashed border-sky-400 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar otra factura
                </Button>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-2">
                    Total ({facturas.length} {facturas.length === 1 ? "factura" : "facturas"}):
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(totalInvoiceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: CONDUCTA FISCAL (PDF + FECHA VTO) */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-sky-600" /> 4. Conducta Fiscal
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between h-5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Conducta Fiscal (PDF) <span className="text-rose-500">*</span>
                    </Label>
                    {fileConducta && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Listo
                      </span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleConductaFileChange}
                    className="h-9 text-xs bg-white dark:bg-slate-900 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between h-5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Vencimiento Conducta <span className="text-rose-500">*</span>
                    </Label>
                  </div>
                  <Input
                    type="date"
                    value={conductaDueDate}
                    onChange={(e) => setConductaDueDate(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                    required
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
                disabled={isSubmitting}
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

            <div className="py-1 border-b border-slate-200/60 dark:border-slate-800/60 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">
                Comprobantes adjuntos ({facturas.length}):
              </span>
              {facturas.map((f, idx) => (
                <div
                  key={f.id}
                  className="flex justify-between items-center text-[11px] pl-2 text-slate-700 dark:text-slate-300"
                >
                  <span>• Factura {f.number || `#${idx + 1}`}:</span>
                  <span className="font-semibold">{formatMoney(parseFloat(f.amount) || 0)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Monto Total a Liquidar:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalInvoiceAmount)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            * Al confirmar, el formulario digital y las facturas ingresarán a la bandeja de Tesorería para su autorización y liquidación.
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

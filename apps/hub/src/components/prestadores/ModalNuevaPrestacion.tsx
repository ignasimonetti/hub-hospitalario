"use client";

import { useState } from "react";
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
} from "@/types/prestadores";
import { submitPrestacion, resubmitPrestacion } from "@/lib/services/prestadoresService";
import { toast } from "sonner";
import {
  FileText,
  Upload,
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
} from "lucide-react";

interface ModalNuevaPrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PrestadorPerfil;
  tenantId: string;
  onCreated: (prestacion: PrestacionPresentacion) => void;
  observadaParaReenviar?: PrestacionPresentacion | null;
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
}: ModalNuevaPrestacionProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth(); // Mes anterior por defecto
  const currentYear = currentDate.getFullYear();

  // Estados del Formulario
  const [periodMonth, setPeriodMonth] = useState<number>(
    observadaParaReenviar ? observadaParaReenviar.period_month : currentMonth
  );
  const [periodYear, setPeriodYear] = useState<number>(
    observadaParaReenviar ? observadaParaReenviar.period_year : currentYear
  );

  // Lista de Facturas (soporta múltiples facturas para respetar el tope de $800.000)
  const [facturas, setFacturas] = useState<FacturaFormItem[]>([
    {
      id: "fac-1",
      number: observadaParaReenviar ? observadaParaReenviar.invoice_number : "",
      date: observadaParaReenviar ? observadaParaReenviar.invoice_date.split("T")[0] : "",
      amount: observadaParaReenviar ? String(observadaParaReenviar.invoice_amount) : "",
      file: null,
    },
  ]);

  const [serviceType, setServiceType] = useState<TipoPrestacion>(
    observadaParaReenviar ? observadaParaReenviar.service_type : "guardia_ordinaria"
  );
  const [hospitalService, setHospitalService] = useState<SectorServicio>(
    (observadaParaReenviar?.hospital_service as SectorServicio) || "clinica_medica"
  );
  const [serviceDaysType, setServiceDaysType] = useState<TipoDiasPrestacion>(
    observadaParaReenviar ? observadaParaReenviar.service_days_type : "mes_completo"
  );
  const [serviceDaysDetail, setServiceDaysDetail] = useState(
    observadaParaReenviar ? observadaParaReenviar.service_days_detail || "" : ""
  );
  const [conductaDueDate, setConductaDueDate] = useState(
    observadaParaReenviar ? observadaParaReenviar.conducta_fiscal_due_date.split("T")[0] : ""
  );

  // Archivos PDF fijos
  const [fileConducta, setFileConducta] = useState<File | null>(null);
  const [fileProof, setFileProof] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handlers para agregar / quitar / editar facturas
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

  const handleGenericFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
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
      setter(file);
    }
  };

  // Cálculo de totales
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

  const handlePromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cada factura
    for (let i = 0; i < facturas.length; i++) {
      const fac = facturas[i];
      const facNum = i + 1;

      if (!fac.number.trim()) {
        toast.error(`Ingresa el número para la Factura #${facNum}`);
        return;
      }
      if (!fac.date) {
        toast.error(`Ingresa la fecha de emisión para la Factura #${facNum}`);
        return;
      }

      const numAmount = parseFloat(fac.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toast.error(`Ingresa un monto válido mayor a 0 para la Factura #${facNum}`);
        return;
      }

      if (numAmount > MAX_INVOICE_AMOUNT) {
        toast.error(
          `La Factura #${facNum} (${formatMoney(numAmount)}) supera el límite normativo de ${formatMoney(
            MAX_INVOICE_AMOUNT
          )}. Reduce el importe y agrega otra factura con el botón '+ Agregar otra factura'.`
        );
        return;
      }

      if (!observadaParaReenviar && !fac.file) {
        toast.error(`Debes adjuntar el archivo PDF de la Factura #${facNum}`);
        return;
      }
    }

    if (!conductaDueDate) {
      toast.error("Ingresa la fecha de vencimiento de tu conducta fiscal");
      return;
    }

    // Validar archivos fijos
    if (!observadaParaReenviar) {
      if (!fileConducta) {
        toast.error("Debes adjuntar el PDF de la Conducta Fiscal");
        return;
      }
      if (!fileProof) {
        toast.error("Debes adjuntar la Constancia/Planilla de Prestación");
        return;
      }
    }

    // Validar detalle de días si no es mes completo
    if (serviceDaysType !== "mes_completo" && !serviceDaysDetail.trim()) {
      toast.error("Por favor especifica los días o el rango de fechas trabajadas");
      return;
    }

    // Abrir diálogo de confirmación
    setShowConfirmDialog(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const invoiceNumbers = facturas.map((f) => f.number.trim()).join(", ");
    const primaryDate = facturas[0]?.date || new Date().toISOString().split("T")[0];

    const formData = new FormData();
    formData.append("tenant", tenantId);
    formData.append("period_month", String(periodMonth));
    formData.append("period_year", String(periodYear));
    formData.append("invoice_number", invoiceNumbers);
    formData.append("invoice_date", primaryDate);
    formData.append("invoice_amount", String(totalInvoiceAmount));
    formData.append("service_type", serviceType);
    formData.append("hospital_service", hospitalService);
    formData.append("service_days_type", serviceDaysType);
    formData.append(
      "service_days_detail",
      serviceDaysType === "mes_completo"
        ? `Mes completo (${MESES.find((m) => m.value === periodMonth)?.label} ${periodYear})`
        : serviceDaysDetail.trim()
    );
    formData.append("conducta_fiscal_due_date", conductaDueDate);

    // Adjuntar primera factura al campo principal
    if (facturas[0]?.file) {
      formData.append("file_invoice", facturas[0].file);
    }

    // Guardar detalle estructurado de todas las facturas
    const detail = facturas.map((f) => ({
      number: f.number.trim(),
      date: f.date,
      amount: parseFloat(f.amount) || 0,
      file_name: f.file?.name || "",
    }));
    formData.append("invoices_detail", JSON.stringify(detail));

    if (fileConducta) formData.append("file_conducta_fiscal", fileConducta);
    if (fileProof) formData.append("file_service_proof", fileProof);

    try {
      let result: PrestacionPresentacion;
      if (observadaParaReenviar) {
        result = await resubmitPrestacion(observadaParaReenviar.id, formData);
        toast.success("Corrección reenviada a Tesorería exitosamente");
      } else {
        result = await submitPrestacion(formData);
        toast.success("Presentación de honorarios enviada con éxito");
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
      <DialogContent className="sm:max-w-[620px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {observadaParaReenviar ? "Corregir y Reenviar Presentación" : "Nueva Presentación de Honorarios"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {observadaParaReenviar
              ? "Reemplaza los documentos observados y reenvía tu liquidación para revisión."
              : "Completa los datos de tu comprobante y adjunta los 3 archivos PDF requeridos."}
          </DialogDescription>
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
          {/* Bloque 1: Período, Modalidad y Servicio Hospitalario */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> Período y Modalidad
            </h4>

            {/* Fila 1: Mes y Año */}
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

            {/* Fila 2: Modalidad de Prestación y Servicio / Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Tipo de Servicio</Label>
                <Select
                  value={serviceType}
                  onValueChange={(val: TipoPrestacion) => setServiceType(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    {Object.entries(TIPOS_PRESTACION_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            {/* Selector Ágil de Días de Prestación */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Días Trabajados
              </Label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setServiceDaysType("mes_completo")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                    serviceDaysType === "mes_completo"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Mes Completo
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDaysType("rango_fechas")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                    serviceDaysType === "rango_fechas"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Rango de Fechas
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDaysType("dias_especificos")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                    serviceDaysType === "dias_especificos"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Días Puntuales
                </button>
              </div>

              {serviceDaysType !== "mes_completo" && (
                <Input
                  placeholder={
                    serviceDaysType === "rango_fechas"
                      ? "Ej. Desde el 05/07 hasta el 20/07"
                      : "Ej. Guardias 24hs: 04, 11, 18 y 25 de Julio"
                  }
                  value={serviceDaysDetail}
                  onChange={(e) => setServiceDaysDetail(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                />
              )}
            </div>
          </div>

          {/* Bloque 2: Datos de la Factura AFIP */}
          {/* Bloque 2: Facturación AFIP (Tope máx: $800.000 por comprobante) */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Facturación AFIP
              </h4>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Tope máx: {formatMoney(MAX_INVOICE_AMOUNT)} por factura
              </span>
            </div>

            {/* Listado de Facturas (Repeater) */}
            <div className="space-y-3">
              {facturas.map((fac, index) => {
                const facNum = index + 1;
                const parsedAmt = parseFloat(fac.amount);
                const isOverLimit = !isNaN(parsedAmt) && parsedAmt > MAX_INVOICE_AMOUNT;

                return (
                  <div
                    key={fac.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 relative shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-600" /> Comprobante #{facNum}
                      </span>

                      {facturas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFactura(fac.id)}
                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
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

                    {/* Alerta si supera el límite de $800.000 */}
                    {isOverLimit && (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tope superado:</strong> El monto individual no puede exceder {formatMoney(MAX_INVOICE_AMOUNT)}. Por favor reduce este comprobante y presiona <strong>"+ Agregar otra factura"</strong> para distribuir el saldo.
                        </div>
                      </div>
                    )}

                    {/* Archivo PDF de esta factura */}
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

            {/* Botón para agregar otra factura */}
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

          {/* Bloque 3: Documentación Fiscal y Asistencial (PDFs) */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-sky-600" /> Documentación Digital Complementaria
            </h4>

            {/* 1. Conducta Fiscal PDF + Fecha Vto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
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
                  onChange={(e) => handleGenericFileChange(e, setFileConducta)}
                  className="h-9 text-xs bg-white dark:bg-slate-900 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Vencimiento Conducta <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={conductaDueDate}
                  onChange={(e) => setConductaDueDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                  required
                />
              </div>
            </div>

            {/* 2. Constancia de Prestación / Planilla Papel */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Constancia de Prestación / Planilla (PDF) <span className="text-rose-500">*</span>
                </Label>
                {fileProof && (
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {fileProof.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Certificación de servicios firmada o planilla escaneada de guardias / consultorios.
              </p>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleGenericFileChange(e, setFileProof)}
                className="h-9 text-xs bg-white dark:bg-slate-900 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
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
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando a Tesorería...
                </span>
              ) : observadaParaReenviar ? (
                "Reenviar Corrección"
              ) : (
                "Enviar Presentación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Diálogo de Confirmación Previa */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <AlertDialogHeader className="space-y-2 text-left">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            {observadaParaReenviar
              ? "¿Confirmar reenvío de corrección a Tesorería?"
              : "¿Confirmar envío de presentación de honorarios?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Por favor, revisa el resumen de tu presentación antes de remitirla formalmente:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Resumen Card */}
        <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Período Devengado:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {selectedMonthLabel} {periodYear}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tipo de Servicio:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {TIPOS_PRESTACION_MAP[serviceType]}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Servicio / Sector:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {SECTORES_SERVICIO_MAP[hospitalService]}
            </span>
          </div>

          {/* Desglose de Facturas */}
          <div className="py-1 border-b border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Comprobantes adjuntos ({facturas.length}):
            </span>
            {facturas.map((f, idx) => (
              <div key={f.id} className="flex justify-between items-center text-[11px] pl-2 text-slate-700 dark:text-slate-300">
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
          * Al confirmar, tu liquidación ingresará al circuito administrativo de Tesorería para su cotejo y autorización.
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

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
  TipoDiasPrestacion,
  TIPOS_PRESTACION_MAP,
  PrestacionPresentacion,
} from "@/types/prestadores";
import { submitPrestacion, resubmitPrestacion } from "@/lib/services/prestadoresService";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  FileCheck2,
  Paperclip,
  CheckCircle2,
} from "lucide-react";

interface ModalNuevaPrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PrestadorPerfil;
  tenantId: string;
  onCreated: (prestacion: PrestacionPresentacion) => void;
  observadaParaReenviar?: PrestacionPresentacion | null;
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
  const [invoiceNumber, setInvoiceNumber] = useState(
    observadaParaReenviar ? observadaParaReenviar.invoice_number : ""
  );
  const [invoiceDate, setInvoiceDate] = useState(
    observadaParaReenviar ? observadaParaReenviar.invoice_date.split("T")[0] : ""
  );
  const [invoiceAmount, setInvoiceAmount] = useState(
    observadaParaReenviar ? String(observadaParaReenviar.invoice_amount) : ""
  );
  const [serviceType, setServiceType] = useState<TipoPrestacion>(
    observadaParaReenviar ? observadaParaReenviar.service_type : "guardia"
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

  // Archivos PDF
  const [fileInvoice, setFileInvoice] = useState<File | null>(null);
  const [fileConducta, setFileConducta] = useState<File | null>(null);
  const [fileProof, setFileProof] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.error("Ingresa el número de factura");
      return;
    }
    if (!invoiceDate) {
      toast.error("Ingresa la fecha de emisión de la factura");
      return;
    }
    const numAmount = parseFloat(invoiceAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Ingresa un monto válido mayor a 0");
      return;
    }
    if (!conductaDueDate) {
      toast.error("Ingresa la fecha de vencimiento de tu conducta fiscal");
      return;
    }

    // Validar archivos obligatorios si es creación nueva
    if (!observadaParaReenviar) {
      if (!fileInvoice) {
        toast.error("Debes adjuntar el PDF de la Factura");
        return;
      }
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

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("tenant", tenantId);
    formData.append("period_month", String(periodMonth));
    formData.append("period_year", String(periodYear));
    formData.append("invoice_number", invoiceNumber.trim());
    formData.append("invoice_date", invoiceDate);
    formData.append("invoice_amount", String(numAmount));
    formData.append("service_type", serviceType);
    formData.append("service_days_type", serviceDaysType);
    formData.append(
      "service_days_detail",
      serviceDaysType === "mes_completo"
        ? `Mes completo (${MESES.find((m) => m.value === periodMonth)?.label} ${periodYear})`
        : serviceDaysDetail.trim()
    );
    formData.append("conducta_fiscal_due_date", conductaDueDate);

    if (fileInvoice) formData.append("file_invoice", fileInvoice);
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

  return (
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-left">
          {/* Bloque 1: Período y Tipo de Prestación */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> Período y Modalidad
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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

              <div className="col-span-2 sm:col-span-1 space-y-1">
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
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Facturación
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">N° de Factura</Label>
                <Input
                  placeholder="00001-00001234"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Fecha de Emisión</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Monto Total ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 450000"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Adjuntos PDF (100% PDF obligatorio) */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-sky-600" /> Documentación Digital (PDFs)
            </h4>

            {/* 1. Factura PDF */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  1. Factura Oficial (PDF) <span className="text-rose-500">*</span>
                </Label>
                {fileInvoice && (
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {fileInvoice.name}
                  </span>
                )}
              </div>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, setFileInvoice)}
                className="h-9 text-xs bg-white dark:bg-slate-900 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>

            {/* 2. Conducta Fiscal PDF + Fecha Vto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    2. Conducta Fiscal (PDF) <span className="text-rose-500">*</span>
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
                  onChange={(e) => handleFileChange(e, setFileConducta)}
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

            {/* 3. Constancia de Prestación / Planilla Papel */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  3. Constancia de Prestación / Planilla (PDF) <span className="text-rose-500">*</span>
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
                onChange={(e) => handleFileChange(e, setFileProof)}
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
  );
}

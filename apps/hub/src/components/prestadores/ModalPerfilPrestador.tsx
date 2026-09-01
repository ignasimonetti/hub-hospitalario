"use client";

import { useState, useEffect, useRef } from "react";
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
  ProfesionPrestador,
  CondicionFiscal,
  PROFESIONES_MAP,
  CONDICIONES_FISCALES_MAP,
} from "@/types/prestadores";
import { savePrestadorPerfil, getPerfilFileUrl } from "@/lib/services/prestadoresService";
import { toast } from "sonner";
import { FileUploadDropzone } from "@/components/ui/file-upload-dropzone";
import { UserCheck, ShieldCheck, Loader2, Sparkles, Eye, Trash2, FileText } from "lucide-react";

interface ModalPerfilPrestadorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfilActual: PrestadorPerfil | null;
  onSaved: (perfil: PrestadorPerfil) => void;
  isOnboarding?: boolean;
}

const normalizeDateStr = (dateStr?: string) => {
  if (!dateStr) return "";
  return dateStr.split(" ")[0].split("T")[0];
};

export function ModalPerfilPrestador({
  open,
  onOpenChange,
  perfilActual,
  onSaved,
  isOnboarding = false,
}: ModalPerfilPrestadorProps) {
  const [cuit, setCuit] = useState(perfilActual?.cuit || "");
  const [profession, setProfession] = useState<ProfesionPrestador>(
    perfilActual?.profession || "medico"
  );
  const [specialty, setSpecialty] = useState(perfilActual?.specialty || "");
  const [licenseNumber, setLicenseNumber] = useState(perfilActual?.license_number || "");
  const [taxCondition, setTaxCondition] = useState<CondicionFiscal>(
    perfilActual?.tax_condition || "monotributo"
  );
  const [cbuAlias, setCbuAlias] = useState(perfilActual?.cbu_alias || "");
  const [phone, setPhone] = useState(perfilActual?.phone || "");
  const [conductaDueDate, setConductaDueDate] = useState(
    normalizeDateStr(perfilActual?.conducta_fiscal_due_date)
  );
  const [fileConducta, setFileConducta] = useState<File | null>(null);
  const [removeExistingConducta, setRemoveExistingConducta] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado local cuando perfilActual cambia o se abre el modal
  useEffect(() => {
    if (open && perfilActual) {
      setCuit(perfilActual.cuit || "");
      setProfession(perfilActual.profession || "medico");
      setSpecialty(perfilActual.specialty || "");
      setLicenseNumber(perfilActual.license_number || "");
      setTaxCondition(perfilActual.tax_condition || "monotributo");
      setCbuAlias(perfilActual.cbu_alias || "");
      setPhone(perfilActual.phone || "");
      setConductaDueDate(normalizeDateStr(perfilActual.conducta_fiscal_due_date));
      setFileConducta(null);
      setRemoveExistingConducta(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, perfilActual]);

  const existingFilename =
    perfilActual?.file_conducta_fiscal && !removeExistingConducta
      ? perfilActual.file_conducta_fiscal
      : null;

  const existingFileUrl =
    perfilActual && existingFilename
      ? getPerfilFileUrl(perfilActual, existingFilename)
      : null;

  const formatDisplayDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const parts = isoStr.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return isoStr;
    } catch {
      return isoStr;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCuit = cuit.replace(/[^0-9]/g, "");
    if (cleanCuit.length < 10 || cleanCuit.length > 11) {
      toast.error("Ingresa un CUIT/CUIL válido (11 dígitos)");
      return;
    }

    if (!licenseNumber.trim()) {
      toast.error("La matrícula profesional es requerida");
      return;
    }

    // Validación de Conducta Fiscal: Si se adjunta o existe archivo, la fecha es requerida
    const hasConductaFile = (!removeExistingConducta && existingFilename) || !!fileConducta;
    if (hasConductaFile && !conductaDueDate) {
      toast.error("Debes indicar la fecha de vencimiento de tu Conducta Fiscal DGR");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("cuit", cleanCuit);
      formData.append("profession", profession);
      formData.append("specialty", specialty.trim());
      formData.append("license_number", licenseNumber.trim());
      formData.append("tax_condition", taxCondition);
      formData.append("cbu_alias", cbuAlias.trim());
      formData.append("phone", phone.trim());

      if (removeExistingConducta && !fileConducta) {
        // Limpiar archivo y fecha
        formData.append("file_conducta_fiscal", "");
        formData.append("conducta_fiscal_due_date", "");
      } else {
        // Siempre enviar la fecha (aunque no haya nuevo archivo, para actualizarla)
        formData.append("conducta_fiscal_due_date", conductaDueDate || "");
        if (fileConducta) formData.append("file_conducta_fiscal", fileConducta);
      }

      const saved = await savePrestadorPerfil(formData);

      toast.success("Perfil de prestador guardado exitosamente");
      onSaved(saved);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al guardar perfil prestador:", error);
      toast.error(error.message || "Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOnboarding ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {isOnboarding ? <Sparkles className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isOnboarding ? "Configuración Inicial de Prestador" : "Datos Fiscales y Profesionales"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isOnboarding
              ? "Completa estos datos por única vez. Se utilizarán automáticamente en todas tus presentaciones de honorarios."
              : "Mantén actualizados tus datos profesionales, condición fiscal y constancia DGR."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* CUIT & Profesión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cuit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CUIT / CUIL <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="cuit"
                placeholder="20345678909"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                maxLength={13}
                required
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profession" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Profesión / Rol <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={profession}
                onValueChange={(val: ProfesionPrestador) => setProfession(val)}
              >
                <SelectTrigger id="profession" className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white">
                  <SelectValue placeholder="Selecciona profesión" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {Object.entries(PROFESIONES_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Matrícula & Especialidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="license" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Matrícula Profesional <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="license"
                placeholder="MP 4521 / MN 1289"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Especialidad / Servicio (Opcional)
              </Label>
              <Input
                id="specialty"
                placeholder="Ej. Cardiología, UTI, Pediatría"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Condición Fiscal */}
          <div className="space-y-1.5">
            <Label htmlFor="tax_condition" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Condición Fiscal ARCA <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={taxCondition}
              onValueChange={(val: CondicionFiscal) => setTaxCondition(val)}
            >
              <SelectTrigger id="tax_condition" className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white">
                <SelectValue placeholder="Condición fiscal" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900">
                {Object.entries(CONDICIONES_FISCALES_MAP).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SECCIÓN CONDUCTA FISCAL (DGR / RENTAS) */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Conducta Fiscal / Rentas DGR
              </Label>
              {existingFilename && !removeExistingConducta && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Constancia Guardada
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="conducta_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fecha de Vencimiento de Constancia {(existingFilename || fileConducta) && <span className="text-rose-500">*</span>}
                </Label>
                {conductaDueDate && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                    Vence: {formatDisplayDate(conductaDueDate)}
                  </span>
                )}
              </div>
              <Input
                id="conducta_date"
                type="date"
                placeholder="DD/MM/AAAA"
                value={conductaDueDate}
                onChange={(e) => setConductaDueDate(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <FileUploadDropzone
              accept=".pdf"
              maxSizeMB={10}
              label="Adjuntar Constancia de Conducta Fiscal (PDF)"
              helperText="Formato PDF oficial de Rentas DGR (máx. 10MB)"
              currentFileName={!removeExistingConducta && existingFilename ? `Constancia adjunta (${existingFilename.slice(0, 20)}...)` : undefined}
              currentFileUrl={!removeExistingConducta ? existingFileUrl || undefined : undefined}
              onFileSelect={(file) => {
                setFileConducta(file);
                if (file) {
                  setRemoveExistingConducta(true);
                }
              }}
              onRemoveCurrent={() => {
                setRemoveExistingConducta(true);
                setFileConducta(null);
                setConductaDueDate("");
              }}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Se vinculará automáticamente a todas tus presentaciones mientras se encuentre vigente.
            </p>
          </div>

          {/* CBU / Alias & Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cbu" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CBU / Alias de Cobro
              </Label>
              <Input
                id="cbu"
                placeholder="Alias o 22 dígitos"
                value={cbuAlias}
                onChange={(e) => setCbuAlias(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teléfono de Contacto
              </Label>
              <Input
                id="phone"
                placeholder="385-154123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
            {!isOnboarding && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#08487A] hover:bg-[#053D6C] text-white font-medium shadow-sm transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </span>
              ) : (
                "Guardar Perfil de Prestador"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

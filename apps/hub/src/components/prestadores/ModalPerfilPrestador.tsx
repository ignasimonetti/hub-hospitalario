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
  ProfesionPrestador,
  CondicionFiscal,
  PROFESIONES_MAP,
  CONDICIONES_FISCALES_MAP,
} from "@/types/prestadores";
import { savePrestadorPerfil } from "@/lib/services/prestadoresService";
import { toast } from "sonner";
import { UserCheck, ShieldCheck, Loader2, Sparkles } from "lucide-react";

interface ModalPerfilPrestadorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfilActual: PrestadorPerfil | null;
  onSaved: (perfil: PrestadorPerfil) => void;
  isOnboarding?: boolean;
}

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
  const [isSaving, setIsSaving] = useState(false);

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

    setIsSaving(true);
    try {
      const saved = await savePrestadorPerfil({
        cuit: cleanCuit,
        profession,
        specialty: specialty.trim() || undefined,
        license_number: licenseNumber.trim(),
        tax_condition: taxCondition,
        cbu_alias: cbuAlias.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      toast.success("Perfil de prestador guardado exitosamente");
      onSaved(saved);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOnboarding ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
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
              : "Mantén actualizados tus datos de facturación y cobro para Tesorería."}
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
              Condición Fiscal AFIP/ARCA <span className="text-rose-500">*</span>
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
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition-colors"
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

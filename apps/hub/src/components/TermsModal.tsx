"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Lock, FileText, Building2 } from "lucide-react";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "terms" | "privacy" | null;
}

export function TermsModal({ open, onOpenChange, type }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {type === "terms" ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {type === "terms"
                  ? "Términos y Condiciones de Uso"
                  : "Política de Privacidad y Protección de Datos"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centro Integral de Salud Banda (CISB) · Normativa República Argentina
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="p-6 max-h-[calc(85vh-130px)] text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-5">
          {type === "terms" ? (
            <div className="space-y-4 pr-2">
              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  1. Ámbito de Aplicación e Identidad Institucional
                </h3>
                <p>
                  El presente sistema <strong>Hub Hospitalario</strong> constituye una plataforma
                  tecnológica de uso exclusivo e institucional para el personal autorizado del{" "}
                  <strong>Centro Integral de Salud Banda (CISB)</strong>, dependiente del Ministerio de Salud.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  2. Uso de Credenciales y Responsabilidad Individual
                </h3>
                <p>
                  Las credenciales de acceso (usuario, contraseña y firma digital en su caso) son personales,
                  secretas e indelegables. El usuario asume plena responsabilidad legal y administrativa por
                  las acciones realizadas dentro de la plataforma con sus credenciales institucionales.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  3. Ley de Derechos del Paciente (Ley N° 26.529)
                </h3>
                <p>
                  Toda la información asistencial, administrativa y de historia clínica guardada o procesada
                  se encuentra amparada por el secreto profesional y las regulaciones de la Ley Nacional N° 26.529.
                  Queda estrictamente prohibida la divulgación, copia o uso no autorizado de datos de pacientes.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  4. Auditoría y Trazabilidad
                </h3>
                <p>
                  El sistema registra logs de auditoría técnica que incluyen fecha, hora, dirección IP y
                  operaciones efectuadas para garantizar la integridad del sistema y la seguridad de la información.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  1. Ley de Protección de Datos Personales (Ley N° 25.326)
                </h3>
                <p>
                  En cumplimiento de la Ley Nacional N° 25.326 y sus normas complementarias, los datos personales
                  recolectados en esta plataforma son procesados con estricta confidencialidad y destinados
                  exclusivamente a fines de gestión hospitalaria y sanitaria.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  2. Tratamiento de Datos Sensibles
                </h3>
                <p>
                  Los datos de salud procesados en la intranet hospitalaria son considerados "datos sensibles"
                  según el Art. 2 de la Ley N° 25.326 y cuentan con medidas de seguridad técnica y organizativa
                  avanzadas para impedir su alteración, pérdida o acceso no autorizado.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  3. Derechos de Acceso, Rectificación y Supresión
                </h3>
                <p>
                  El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos
                  en forma gratuita a intervalos no inferiores a seis meses. Asimismo, podrá solicitar la
                  actualización o rectificación de sus datos conforme a los procedimientos institucionales vigentes.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  4. Autoridad de Control
                </h3>
                <p>
                  La Agencia de Acceso a la Información Pública (AAIP), en su carácter de Órgano de Control de la
                  Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con
                  relación al incumplimiento de las normas sobre protección de datos personales.
                </p>
              </section>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

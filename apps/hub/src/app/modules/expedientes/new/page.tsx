import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ExpedienteForm } from "@/components/modules/expedientes/ExpedienteForm";

export default function NewExpedientePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col space-y-2 mb-6">
                <Link
                    href="/modules/expedientes"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver / Nuevo Expediente
                </Link>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                    Crear Nuevo Expediente
                </h2>
                <p className="text-muted-foreground dark:text-slate-400">
                    Registra un nuevo expediente para iniciar su seguimiento.
                </p>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
                <ExpedienteForm />
            </div>
        </div>
    );
}

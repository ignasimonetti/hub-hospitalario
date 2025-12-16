
import { ExpedienteForm } from "@/components/modules/expedientes/ExpedienteForm";

export default function NewExpedientePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nuevo Expediente</h2>
                    <p className="text-muted-foreground">
                        Registra un nuevo expediente para iniciar su seguimiento.
                    </p>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
                <ExpedienteForm />
            </div>
        </div>
    );
}

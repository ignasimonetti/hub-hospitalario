
'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pocketbase } from "@/lib/auth";
import { ExpedienteRecord } from "@/types/expedientes";
import { ExpedienteForm } from "@/components/modules/expedientes/ExpedienteForm";
import { Loader2 } from "lucide-react";

export default function EditExpedientePage() {
    const params = useParams();
    const id = params.id as string;
    const [expediente, setExpediente] = useState<ExpedienteRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadExpediente() {
            try {
                const record = await pocketbase.collection("expedientes").getOne<ExpedienteRecord>(id, {
                    requestKey: null
                });
                setExpediente(record);
            } catch (error) {
                console.error("Error loading expediente:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadExpediente();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!expediente) {
        return <div className="p-8">Expediente no encontrado.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Editar Expediente</h2>
                    <p className="text-muted-foreground">
                        {expediente.numero}
                    </p>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
                <ExpedienteForm initialData={expediente} isEditing={true} />
            </div>
        </div>
    );
}

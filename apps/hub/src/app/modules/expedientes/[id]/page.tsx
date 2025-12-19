
'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pocketbase } from "@/lib/auth";
import { ExpedienteRecord } from "@/types/expedientes";
import { ExpedienteForm } from "@/components/modules/expedientes/ExpedienteForm";
import { Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

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
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!expediente) {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                    Expediente no encontrado.
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col space-y-2 mb-6">
                <Link
                    href="/modules/expedientes"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver / Editar Expediente
                </Link>
                <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                        Editar Expediente
                    </h2>
                    <span className="text-xl font-mono text-muted-foreground">
                        {expediente.numero}
                    </span>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
                <ExpedienteForm initialData={expediente} isEditing={true} />
            </div>
        </div>
    );
}

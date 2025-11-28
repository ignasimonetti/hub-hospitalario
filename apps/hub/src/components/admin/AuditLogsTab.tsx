"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function AuditLogsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Logs de Auditoría
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Registro de actividades y eventos del sistema.
                </p>
                {/* TODO: Implementar tabla de logs */}
            </CardContent>
        </Card>
    );
}


import { Badge } from "@/components/ui/badge";
import { ExpedienteEstado } from "@/types/expedientes";

interface ExpedienteStatusBadgeProps {
    status: ExpedienteEstado;
}

export function ExpedienteStatusBadge({ status }: ExpedienteStatusBadgeProps) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";

    switch (status) {
        case "En trámite":
            variant = "secondary";
            className = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
            break;
        case "Finalizado":
            variant = "default";
            className = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";
            break;
        case "Archivado":
            variant = "outline";
            className = "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
            break;
        case "Pendiente":
            variant = "destructive";
            // Using destructive for "Pendiente" as it implies action needed, or maybe just secondary? 
            // Let's use a blue-ish for Pendiente if not destructive.
            // But let's stick to standard map.
            className = "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
            break;
    }

    return (
        <Badge variant={variant} className={className}>
            {status}
        </Badge>
    );
}

import { ExpedientePrioridad } from "@/types/expedientes";

interface ExpedientePriorityBadgeProps {
    priority: ExpedientePrioridad;
}

export function ExpedientePriorityBadge({ priority }: ExpedientePriorityBadgeProps) {
    let className = "";

    switch (priority) {
        case "Alta":
            className = "text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
            break;
        case "Media":
            className = "text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
            break;
        case "Baja":
            className = "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
            break;
    }

    return (
        <Badge variant="outline" className={`${className} border`}>
            {priority}
        </Badge>
    );
}

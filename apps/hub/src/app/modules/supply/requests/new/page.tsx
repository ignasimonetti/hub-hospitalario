import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupplyRequestForm } from "./request-form";

export default function NewSupplyRequestPage() {
    return (
        <div className="container mx-auto py-8 max-w-[1400px] space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            {/* Breadcrumbs & Header */}
            <div className="shrink-0">
                <nav className="flex items-center text-sm font-medium mb-2 text-muted-foreground">
                    <Link href="/modules/supply" className="hover:text-primary transition-colors">Inicio</Link>
                    <span className="mx-2">/</span>
                    <Link href="/modules/supply/requests" className="hover:text-primary transition-colors">Solicitudes</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground font-semibold">Nueva Solicitud Interna</span>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href="/modules/supply/requests"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva Solicitud</h1>
                        <p className="text-muted-foreground">Complete los datos para requerir insumos a Farmacia/Depósito.</p>
                    </div>
                </div>
            </div>

            {/* Main Content (Full Height for Scroll) */}
            <div className="flex-1 min-h-0">
                <SupplyRequestForm />
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/profile/SignaturePad";
import { PenTool, Loader2, ShieldCheck } from "lucide-react";
import { pocketbase } from "@/lib/auth";

interface ModalFirmaObligatoriaProps {
  open: boolean;
  onSignatureSaved: () => void;
}

export function ModalFirmaObligatoria({
  open,
  onSignatureSaved,
}: ModalFirmaObligatoriaProps) {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSignature = async () => {
    if (!signatureData) return;

    setIsSaving(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (pocketbase.authStore.token) {
        headers["Authorization"] = `Bearer ${pocketbase.authStore.token}`;
      }
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({ signature_data: signatureData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al guardar la firma");
      }

      onSignatureSaved();
    } catch (err: any) {
      console.error("Error guardando firma:", err);
      setError(err.message || "No se pudo guardar la firma. Intente nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {/* Bloqueado: no se puede cerrar */}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <PenTool className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Registro de Firma Holográfica
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Por única vez, debe registrar su firma digital para continuar usando la plataforma.
            Puede usar el mouse (PC) o el dedo (dispositivos táctiles).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SignaturePad
            onSave={(base64) => {
              setSignatureData(base64);
              setError(null);
            }}
            onClear={() => setSignatureData(null)}
            height={200}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleSaveSignature}
            disabled={!signatureData || isSaving}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando firma...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Confirmar y guardar firma
              </>
            )}
          </Button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            Su firma será utilizada en documentos oficiales generados por la plataforma.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

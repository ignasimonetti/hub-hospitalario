"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  /** Palabra que el usuario debe escribir para confirmar (por defecto "ELIMINAR") */
  confirmWord?: string;
  /** Identificador del registro (se muestra como referencia) */
  recordLabel?: string;
}

/**
 * Modal de confirmación de borrado con doble factor:
 * El usuario debe escribir una palabra de confirmación para habilitar el botón de eliminar.
 */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmWord = "ELIMINAR",
  recordLabel,
}: ConfirmDeleteModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = inputValue.trim().toUpperCase() === confirmWord.toUpperCase();

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      setInputValue("");
      onClose();
    } catch (error) {
      // Error is handled by the caller
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInputValue("");
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <p>{description}</p>
            {recordLabel && (
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
                {recordLabel}
              </div>
            )}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Escriba <span className="text-red-600 font-bold">{confirmWord}</span> para confirmar:
              </p>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmWord}
                className="text-sm font-mono"
                autoFocus
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="text-xs">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Permanentemente
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

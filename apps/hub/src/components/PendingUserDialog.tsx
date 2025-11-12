"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Mail,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";

interface PendingUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export function PendingUserDialog({ open, onOpenChange, userEmail }: PendingUserDialogProps) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleUnderstood = () => {
    router.push('/');
  };

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <AlertDialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              ¡Cuenta Creada Exitosamente!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-300">
              Tu solicitud está siendo revisada por nuestro equipo
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Verificación en proceso</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Tiempo estimado: 24-48 horas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notificación por email</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Te avisaremos cuando esté lista</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Acceso limitado disponible</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Puedes explorar algunas funciones</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                  Estado: Pendiente
                </Badge>
              </div>
              {userEmail && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  Confirmación enviada a {userEmail}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter className="flex-col gap-2 pt-4">
            <Button onClick={handleUnderstood} className="w-full">
              Entendido
            </Button>
            <Button
              onClick={() => window.location.href = 'mailto:hubhospitalario@gmail.com?subject=Solicitud%20de%20aprobación%20de%20cuenta&body=Hola,%20mi%20cuenta%20está%20pendiente%20de%20aprobación.%20Mi%20email%20es:%20' + (userEmail || '')}
              variant="outline"
              className="w-full text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Contactar Soporte
            </Button>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
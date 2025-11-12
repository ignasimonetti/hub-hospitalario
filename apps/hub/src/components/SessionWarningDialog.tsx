"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionWarningDialogProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarningDialog({
  isOpen,
  timeRemaining,
  onExtend,
  onLogout
}: SessionWarningDialogProps) {
  // Auto-logout cuando llegue a 0
  useEffect(() => {
    if (timeRemaining <= 0 && isOpen) {
      onLogout();
    }
  }, [timeRemaining, isOpen, onLogout]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <Card className="border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-slate-100">
                    Sesión por Expirar
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-slate-400">
                    Tu sesión se cerrará automáticamente por seguridad
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Timer */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-lg font-mono font-semibold text-amber-800 dark:text-amber-200">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                      Tiempo restante
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={onLogout}
                      variant="outline"
                      className="flex-1 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      Cerrar Sesión
                    </Button>
                    <Button
                      onClick={onExtend}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Extender Sesión
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="text-xs text-gray-500 dark:text-slate-400 text-center space-y-1">
                    <p>• Las sesiones médicas tienen mayor duración por seguridad</p>
                    <p>• La actividad extiende automáticamente tu sesión</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
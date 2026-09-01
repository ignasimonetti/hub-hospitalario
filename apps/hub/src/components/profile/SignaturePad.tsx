"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, PenTool, Trash2 } from "lucide-react";

interface SignaturePadProps {
  initialSignature?: string | null;
  onSave: (signatureBase64: string) => void;
  onClear?: () => void;
  onDeleteSignature?: () => void;
  disabled?: boolean;
  height?: number;
  showSaveButton?: boolean;
}

export function SignaturePad({
  initialSignature,
  onSave,
  onClear,
  onDeleteSignature,
  disabled = false,
  height = 180,
  showSaveButton = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [previewMode, setPreviewMode] = useState(Boolean(initialSignature));

  // Sincronizar estado cuando se carga la firma asincrónicamente
  useEffect(() => {
    if (initialSignature) {
      setPreviewMode(true);
    }
  }, [initialSignature]);

  // Inicializar Canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar resolución retina / alta densidad
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#08487A"; // Azul institucional tinta de firma
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, previewMode]);

  // Obtener coordenadas normalizadas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || previewMode) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || previewMode) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Si no tiene botón de guardar explícito (por ej. dentro de un modal que tiene su propio botón de confirmar),
    // emitir el base64 al estado del padre
    if (!showSaveButton) {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
      }
    }
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setPreviewMode(false);
    if (onClear) onClear();
  };

  return (
    <div className="space-y-3 w-full">
      {/* Vista previa de firma existente */}
      {previewMode && initialSignature ? (
        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-4 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
            <img
              src={initialSignature}
              alt="Firma registrada"
              className="max-h-full max-w-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {onDeleteSignature && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDeleteSignature}
                disabled={disabled}
                className="text-xs h-7 px-2.5 rounded-lg border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 bg-white/90 dark:bg-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" />
                Eliminar firma
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewMode(false);
                setHasDrawn(false);
                setTimeout(setupCanvas, 50);
              }}
              disabled={disabled}
              className="text-xs h-7 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Redibujar firma
            </Button>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <Check className="w-3.5 h-3.5" /> Firma holográfica registrada
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Canvas de dibujo táctil / mouse */}
          <div
            className="relative border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-[#08487A]"
            style={{ height: `${height}px`, touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair block"
            />

            {/* Línea guía base de firma (estilo documento formal) */}
            <div className="absolute bottom-7 left-8 right-8 border-b border-slate-300/60 dark:border-slate-700/60 pointer-events-none flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-600 select-none">
                ✕ Firme aquí con mouse o dedo
              </span>
              <PenTool className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            </div>

            {/* Placeholder sutil si aún no dibujó */}
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400/80 dark:text-slate-600 text-xs">
                <span>Dibuje su trazo o garabato aquí</span>
              </div>
            )}
          </div>

          {/* Controles de firma */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!hasDrawn || disabled}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 h-8 px-2.5 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Limpiar trazo
            </Button>

            {showSaveButton && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={exportSignature}
                disabled={!hasDrawn || disabled}
                className="h-8 px-3.5 rounded-lg bg-[#08487A] hover:bg-[#06375c] text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar firma
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadDropzoneProps {
    onFileSelect: (file: File | null) => void;
    accept?: string;
    maxSizeMB?: number;
    currentFileName?: string;
    currentFileUrl?: string;
    onRemoveCurrent?: () => void;
    label?: string;
    helperText?: string;
    className?: string;
    disabled?: boolean;
}

export function FileUploadDropzone({
    onFileSelect,
    accept = ".pdf,image/*",
    maxSizeMB = 10,
    currentFileName,
    currentFileUrl,
    onRemoveCurrent,
    label = "Arrastrá y soltá tu archivo aquí",
    helperText = `Formatos permitidos: PDF, JPG, PNG (máx. ${maxSizeMB}MB)`,
    className,
    disabled = false,
}: FileUploadDropzoneProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const validateAndSetFile = (file: File) => {
        setError(null);
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`El archivo supera el límite de ${maxSizeMB}MB`);
            return;
        }
        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
        onFileSelect(null);
        if (onRemoveCurrent) onRemoveCurrent();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const hasFile = selectedFile || (currentFileName && !selectedFile);

    return (
        <div className={cn("w-full space-y-2", className)}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {!hasFile ? (
                <div
                    onClick={() => !disabled && inputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200",
                        isDragging
                            ? "border-[#08487A] bg-blue-50/50 dark:bg-[#08487A]/10 scale-[0.99]"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-900/60",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs text-slate-500 dark:text-slate-400 group-hover:text-[#08487A] dark:group-hover:text-blue-400 group-hover:scale-105 transition-all duration-200 mb-3">
                        <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        {label} <span className="text-[#08487A] dark:text-blue-400 font-normal">o explorar equipo</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 text-center">
                        {helperText}
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-[#08487A]/20 text-[#08487A] dark:text-blue-400 shrink-0">
                            {selectedFile?.type.includes("pdf") || currentFileName?.endsWith(".pdf") ? (
                                <FileText className="w-4 h-4" />
                            ) : (
                                <ImageIcon className="w-4 h-4" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {selectedFile ? selectedFile.name : currentFileName}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                                {selectedFile && formatFileSize(selectedFile.size)}
                                {selectedFile && <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Listo
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        {currentFileUrl && !selectedFile && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(currentFileUrl, "_blank")}
                                className="h-7 px-2 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                                Ver
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => inputRef.current?.click()}
                            className="h-7 px-2 text-[11px] text-[#08487A] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#08487A]/10"
                        >
                            Cambiar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleClear}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium animate-in fade-in-50">
                    {error}
                </p>
            )}
        </div>
    );
}

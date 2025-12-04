'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ImagePlus, X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: File | null;
    onChange: (file: File | null) => void;
    currentImageUrl?: string | null;
    className?: string;
    disabled?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    currentImageUrl,
    className,
    disabled = false
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (currentImageUrl) {
            setPreview(currentImageUrl);
        } else {
            setPreview(null);
        }
    }, [value, currentImageUrl]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onChange(file);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                onClick={!preview ? triggerClick : undefined}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative group flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
                    isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800/50",
                    preview ? "border-solid border-gray-200 dark:border-slate-700" : "cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={disabled}
                />

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={triggerClick}
                                disabled={disabled}
                            >
                                <ImagePlus className="h-4 w-4 mr-2" />
                                Cambiar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Quitar
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className={cn(
                            "p-4 rounded-full mb-3 transition-colors",
                            isDragging ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400"
                        )}>
                            <UploadCloud className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            {isDragging ? "Suelta la imagen aquí" : "Haz clic o arrastra una imagen"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">
                            SVG, PNG, JPG o GIF (max. 5MB)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

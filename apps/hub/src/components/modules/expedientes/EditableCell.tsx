
"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface EditableCellProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    className?: string;
    inputClassName?: string;
    isMono?: boolean;
}

export function EditableCell({ value, onSave, className, inputClassName, isMono }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (inputValue === value) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            await onSave(inputValue);
            setIsEditing(false);
        } catch (error) {
            // Keep editing on error
            console.error("Failed to save", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setInputValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    className={cn("h-8 py-1 px-2 text-sm", isMono && "font-mono", inputClassName)}
                />
                <div className="flex flex-col gap-0.5" >
                    <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-0.5 rounded hover:bg-green-50" disabled={saving}>
                        <Check className="h-3 w-3" />
                    </button>
                    <button onClick={handleCancel} className="text-red-500 hover:text-red-600 p-0.5 rounded hover:bg-red-50" disabled={saving}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "cursor-text hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 -m-1.5 rounded transition-colors group relative min-h-[24px] flex items-center",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
        >
            <span className={cn(
                "truncate block w-full",
                isMono && "font-mono"
            )}>
                {value || <span className="text-muted-foreground italic text-xs">Sin descripción</span>}
            </span>
            <PenIcon className="h-3 w-3 opacity-0 group-hover:opacity-30 absolute right-1 top-1/2 -translate-y-1/2" />
        </div>
    );
}

function PenIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
    )
}

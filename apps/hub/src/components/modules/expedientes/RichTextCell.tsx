
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/modules/RichTextEditor";
import { ScrollText, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextCellProps {
    value: string; // HTML string
    title?: string;
    onSave: (newValue: string) => Promise<void>;
    placeholder?: string;
}

export function RichTextCell({ value, title = "Editar Contenido", onSave, placeholder = "Sin observaciones" }: RichTextCellProps) {
    const [open, setOpen] = useState(false);
    const [editorContent, setEditorContent] = useState(value);
    const [saving, setSaving] = useState(false);

    // Helper to strip HTML for preview
    const getPreview = (html: string) => {
        if (!html) return placeholder;
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || "";
        return text.slice(0, 50) + (text.length > 50 ? "..." : "");
    };

    const handleSave = async () => {
        if (editorContent === value) {
            setOpen(false);
            return;
        }

        setSaving(true);
        try {
            await onSave(editorContent);
            setOpen(false);
        } catch (error) {
            console.error("Failed to save rich text", error);
        } finally {
            setSaving(false);
        }
    };

    // Reset content when opening if external value changed
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) setEditorContent(value);
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <div
                    className="group flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 -m-1.5 rounded transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex-1 truncate text-xs text-muted-foreground max-w-[150px] md:max-w-[200px]">
                        {value ? (
                            <span>{getPreview(value)}</span>
                        ) : (
                            <span className="italic opacity-50">{placeholder}</span>
                        )}
                    </div>
                    <ScrollText className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-2">
                    <RichTextEditor
                        content={editorContent}
                        onChange={setEditorContent}
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

interface Tag {
    id: string;
    Etiquetas: string;
}

interface TagSelectorProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // Load tags on mount
    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        setIsLoading(true);
        try {
            const { getTags } = await import('@/app/actions/blog/metadata');
            const result = await getTags();
            if (result.success) {
                setTags(result.data);
            } else {
                toast.error('Error al cargar etiquetas');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar etiquetas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTag = async (name: string) => {
        if (!name.trim()) return;
        // case‑sensitive duplicate check
        if (tags.some(t => t.Etiquetas === name.trim())) {
            toast.error(`La etiqueta "${name}" ya existe`);
            return;
        }
        setIsCreating(true);
        try {
            const { createTag } = await import('@/app/actions/blog/metadata');
            const result = await createTag(name.trim());
            if (result.success && result.data) {
                const newTag = result.data as Tag;
                setTags(prev => [...prev, newTag]);
                onTagsChange([...selectedTags, newTag.id]);
                toast.success(`Etiqueta "${newTag.Etiquetas}" creada`);
                setNewTagName('');
                setShowDialog(false);
            } else {
                toast.error(result.error || 'Error al crear etiqueta');
            }
        } catch (error) {
            toast.error('Error al crear etiqueta');
        } finally {
            setIsCreating(false);
        }
    };

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onTagsChange(selectedTags.filter(id => id !== tagId));
        } else {
            onTagsChange([...selectedTags, tagId]);
        }
    };

    const handleSelectChange = (value: string) => {
        if (value === 'new-tag') {
            setShowDialog(true);
        } else if (!selectedTags.includes(value)) {
            toggleTag(value);
        }
    };

    const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id));

    return (
        <div className="space-y-3">
            {/* Multi-select dropdown */}
            <Select onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar etiquetas..." />
                </SelectTrigger>
                <SelectContent>
                    {tags.map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center">
                                <Check className={`mr-2 h-4 w-4 ${selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-0'}`} />
                                {tag.Etiquetas}
                            </div>
                        </SelectItem>
                    ))}
                    <div className="border-t my-2" />
                    <SelectItem value="new-tag">
                        <div className="flex items-center text-primary">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear nueva etiqueta...
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Selected tags display */}
            <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
                {selectedTagObjects.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                        {tag.Etiquetas}
                        <button
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            {/* Dialog for creating a new tag */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crear nueva etiqueta</DialogTitle>
                        <DialogDescription>
                            Ingrese el nombre de la nueva etiqueta que desea crear.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Nombre de la etiqueta"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isCreating}>
                            Cancelar
                        </Button>
                        <Button onClick={() => handleCreateTag(newTagName)} disabled={isCreating || !newTagName.trim()}>
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

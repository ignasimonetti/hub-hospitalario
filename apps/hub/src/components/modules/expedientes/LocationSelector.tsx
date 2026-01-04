
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { pocketbase } from "@/lib/auth"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { toast } from "sonner"

interface LocationSelectorProps {
    value?: string;
    initialName?: string;
    onChange: (value: string) => void;
    className?: string;
}

interface UbicacionOption {
    id: string;
    nombre: string;
}

export function LocationSelector({ value, initialName, onChange, className }: LocationSelectorProps) {
    const { currentTenant } = useWorkspace();
    const [open, setOpen] = React.useState(false);
    const [ubicaciones, setUbicaciones] = React.useState<UbicacionOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Load locations
    const loadLocations = React.useCallback(async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const result = await pocketbase.collection('ubicaciones').getList(1, 100, {
                sort: 'nombre',
                requestKey: null,
            });
            setUbicaciones(result.items.map(i => ({ id: i.id, nombre: i.nombre })));
        } catch (error) {
            console.error("Error loading locations", error);
        } finally {
            setLoading(false);
        }
    }, [currentTenant]);

    React.useEffect(() => {
        if (open) {
            loadLocations();
        }
    }, [open, loadLocations]);

    const handleCreate = async (nameToCreate: string) => {
        const name = nameToCreate || searchValue;
        if (!name || !currentTenant) return;

        try {
            setIsCreating(true);
            const newLoc = await pocketbase.collection('ubicaciones').create({
                nombre: name,
                tenant: currentTenant.id
            });

            // Add to list and select
            const newOption = { id: newLoc.id, nombre: newLoc.nombre };
            setUbicaciones(prev => [...prev, newOption]);
            onChange(newLoc.id);
            setOpen(false);
            setSearchValue("");
            toast.success(`Ubicación "${newLoc.nombre}" creada.`);
        } catch (e) {
            console.error(e);
            toast.error("Error al crear la ubicación.");
        } finally {
            setIsCreating(false);
        }
    };

    const selectedName = ubicaciones.find((u) => u.id === value)?.nombre;
    const exactMatch = ubicaciones.find(u => u.nombre.toLowerCase() === searchValue.toLowerCase());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white dark:bg-slate-900 font-normal border-gray-200 dark:border-slate-800", className)}
                >
                    <span className="truncate">
                        {value
                            ? selectedName || initialName || "Cargando..."
                            : "Seleccionar ubicación..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 shadow-xl z-50 rounded-xl overflow-hidden">
                <Command className="bg-transparent" loop>
                    <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-3">
                        <CommandInput
                            placeholder="Buscar o crear ubicación..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                            className="h-10 border-0 focus:ring-0"
                        />
                    </div>
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty className="p-0">
                            {searchValue && !isCreating && (
                                <div className="p-1">
                                    <button
                                        type="button"
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium transition-colors"
                                        onClick={() => handleCreate(searchValue)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear "{searchValue}"
                                    </button>
                                </div>
                            )}
                            {!searchValue && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No se encontraron resultados.
                                </div>
                            )}
                        </CommandEmpty>

                        <CommandGroup>
                            {ubicaciones.map((ubicacion) => (
                                <CommandItem
                                    key={ubicacion.id}
                                    value={ubicacion.nombre}
                                    onSelect={() => {
                                        onChange(ubicacion.id);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center flex-1">
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === ubicacion.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{ubicacion.nombre}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {searchValue && !exactMatch && !loading && (
                            <CommandGroup className="border-t border-gray-100 dark:border-slate-800 mt-1 pt-1">
                                <CommandItem
                                    value={searchValue}
                                    onSelect={() => handleCreate(searchValue)}
                                    className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear "{searchValue}"
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {loading && (
                            <div className="py-2 text-center">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

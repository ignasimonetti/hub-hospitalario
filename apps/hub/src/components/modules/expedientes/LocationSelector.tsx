
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
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
    onChange: (value: string) => void;
    className?: string;
}

interface UbicacionOption {
    id: string;
    nombre: string;
}

export function LocationSelector({ value, onChange, className }: LocationSelectorProps) {
    const { currentTenant } = useWorkspace();
    const [open, setOpen] = React.useState(false);
    const [ubicaciones, setUbicaciones] = React.useState<UbicacionOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Load locations
    const loadLocations = React.useCallback(async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const result = await pocketbase.collection('ubicaciones').getList(1, 100, {
                sort: 'nombre',
                requestKey: null, // Avoid auto-cancellation
                // filter: `tenant = "${currentTenant.id}"` // Uncomment if filtering by tenant is needed
            });
            setUbicaciones(result.items.map(i => ({ id: i.id, nombre: i.nombre })));
        } catch (error) {
            console.error("Error loading locations", error);
        } finally {
            setLoading(false);
        }
    }, [currentTenant]);

    React.useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const handleCreate = async () => {
        if (!searchValue || !currentTenant) return;

        try {
            setLoading(true);
            const newLoc = await pocketbase.collection('ubicaciones').create({
                nombre: searchValue,
                tenant: currentTenant.id
            });

            // Add to list and select
            setUbicaciones(prev => [...prev, { id: newLoc.id, nombre: newLoc.nombre }]);
            onChange(newLoc.id);
            setOpen(false);
            toast.success(`Ubicación "${newLoc.nombre}" creada.`);
        } catch (e) {
            console.error(e);
            toast.error("Error al crear la ubicación.");
        } finally {
            setLoading(false);
        }
    };

    const selectedName = ubicaciones.find((u) => u.id === value)?.nombre;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white dark:bg-slate-900 font-normal", className)}
                >
                    {value
                        ? selectedName || "Cargando..."
                        : "Seleccionar ubicación..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 shadow-md z-50">
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder="Buscar ubicación..."
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            {searchValue ? (
                                <div className="flex flex-col items-center gap-2 px-4">
                                    <span>Ubicación no encontrada.</span>
                                    <Button
                                        size="sm"
                                        className="w-full mt-1 gap-2"
                                        onClick={handleCreate}
                                        disabled={loading}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Crear "{searchValue}"
                                    </Button>
                                </div>
                            ) : (
                                <span>No se encontraron resultados.</span>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {ubicaciones.map((ubicacion) => (
                                <CommandItem
                                    key={ubicacion.id}
                                    value={ubicacion.nombre}
                                    onSelect={(currentValue) => {
                                        // command returns the 'value' prop (nombre) normalized usually
                                        // so we search by id or original object
                                        onChange(ubicacion.id === value ? "" : ubicacion.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === ubicacion.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {ubicacion.nombre}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

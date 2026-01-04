"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Settings,
    Database,
    MapPin,
    Tags,
    Plus,
    Upload,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    importHospitalSectors,
    getSupplyCategories,
    getHubSectors,
    getTenants,
    fixSectorsTenant,
    getSupplyNodes,
    createSupplyNode,
    updateSupplyNode,
    createSupplyCategory,
    updateSupplyCategory,
    createBaseCategories,
    updateHubSector,
    deleteHubSector,
    deleteSupplyCategory,
    deleteSupplyNode
} from "@/app/actions/supply";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SupplySettingsPage() {
    const [isImporting, setIsImporting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [nodes, setNodes] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Node form state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingNode, setEditingNode] = useState<any>(null);
    const [nodeForm, setNodeForm] = useState({
        name: "",
        type: "Periferico",
        is_active: true,
        tenants: ""
    });

    // Category form state
    const [isCatSheetOpen, setIsCatSheetOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [catForm, setCatForm] = useState({
        name: "",
        is_active: true
    });

    // Sector management state
    const [sectorSearch, setSectorSearch] = useState("");
    const [isSectorSheetOpen, setIsSectorSheetOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<any>(null);
    const [sectorForm, setSectorForm] = useState({
        name: "",
        is_active: true,
        is_stock_hub: false
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [cats, sects, ts, ns] = await Promise.all([
                    getSupplyCategories(),
                    getHubSectors(),
                    getTenants(),
                    getSupplyNodes()
                ]);
                setCategories(cats);
                setSectors(sects);
                setTenants(ts);
                setNodes(ns);

                // Set default tenant if available
                if (ts.length > 0) {
                    const mainTenant = ts.find((t: any) => t.name.toLowerCase().includes('banda')) || ts[0];
                    setSelectedTenant(mainTenant.id);
                    setNodeForm(prev => ({ ...prev, tenants: mainTenant.id }));
                }
            } catch (error) {
                console.error("Error loading settings data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleBulkImport = async () => {
        // Feature removed after successful initial import
        toast.info("Importación deshabilitada");
    };

    const handleOpenNodeSheet = (node?: any) => {
        if (node) {
            setEditingNode(node);
            setNodeForm({
                name: node.name,
                type: node.type,
                is_active: node.is_active,
                tenants: node.tenants
            });
        } else {
            setEditingNode(null);
            setNodeForm({
                name: "",
                type: "Periferico",
                is_active: true,
                tenants: selectedTenant
            });
        }
        setIsSheetOpen(true);
    };

    const handleOpenCatSheet = (cat?: any) => {
        if (cat) {
            setEditingCategory(cat);
            setCatForm({ name: cat.name, is_active: cat.is_active });
        } else {
            setEditingCategory(null);
            setCatForm({ name: "", is_active: true });
        }
        setIsCatSheetOpen(true);
    };

    const handleNodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingNode) {
                await updateSupplyNode(editingNode.id, nodeForm);
                toast.success("Nodo actualizado correctamente");
            } else {
                await createSupplyNode(nodeForm);
                toast.success("Nodo creado correctamente");
            }
            const ns = await getSupplyNodes();
            setNodes(ns);
            setIsSheetOpen(false);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNode = async () => {
        if (!editingNode) return;
        if (!confirm(`¿Está seguro de eliminar el nodo "${editingNode.name}"?`)) return;

        setIsSaving(true);
        try {
            await deleteSupplyNode(editingNode.id);
            toast.success("Nodo eliminado");
            const ns = await getSupplyNodes();
            setNodes(ns);
            setIsSheetOpen(false);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingCategory) {
                await updateSupplyCategory(editingCategory.id, catForm);
                toast.success("Categoría actualizada");
            } else {
                await createSupplyCategory(catForm.name);
                toast.success("Categoría creada");
            }
            const cats = await getSupplyCategories();
            setCategories(cats);
            setIsCatSheetOpen(false);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateBaseCategories = async () => {
        setIsLoading(true);
        try {
            const res = await createBaseCategories();
            toast.success("Categorías base creadas", { description: `Se crearon ${res.created} nuevas categorías.` });
            const cats = await getSupplyCategories();
            setCategories(cats);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenSectorSheet = (sector: any) => {
        setEditingSector(sector);
        setSectorForm({
            name: sector.name,
            is_active: sector.is_active,
            is_stock_hub: sector.is_stock_hub || false
        });
        setIsSectorSheetOpen(true);
    };

    const handleSectorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateHubSector(editingSector.id, sectorForm);
            toast.success("Sector actualizado");
            const sects = await getHubSectors();
            setSectors(sects);
            setIsSectorSheetOpen(false);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSector = async () => {
        if (!editingSector) return;
        if (!confirm(`¿Está seguro de eliminar el sector "${editingSector.name}"? Esta acción no se puede deshacer.`)) return;

        setIsSaving(true);
        try {
            await deleteHubSector(editingSector.id);
            toast.success("Sector eliminado correctamente");
            const sects = await getHubSectors();
            setSectors(sects);
            setIsSectorSheetOpen(false);
        } catch (error: any) {
            toast.error("Error al eliminar", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!editingCategory) return;
        if (!confirm(`¿Está seguro de eliminar la categoría "${editingCategory.name}"?`)) return;

        setIsSaving(true);
        try {
            await deleteSupplyCategory(editingCategory.id);
            toast.success("Categoría eliminada");
            const cats = await getSupplyCategories();
            setCategories(cats);
            setIsCatSheetOpen(false);
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSectors = sectors.filter(s =>
        s.name.toLowerCase().includes(sectorSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(sectorSearch.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl px-4 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800/60 pb-8">
                <Link
                    href="/modules/supply"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        Configuración de Suministros
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Parámetros de negocio, depósitos y catálogo maestro.</p>
                </div>
            </div>

            <Tabs defaultValue="sectors" className="w-full space-y-8">
                <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex w-fit overflow-x-auto">
                    <TabsTrigger value="deposits" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-sm flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Nodos de Depósito
                    </TabsTrigger>
                    <TabsTrigger value="sectors" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Sectores Hospitalarios
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-sm flex items-center gap-2">
                        <Tags className="w-4 h-4" />
                        Categorías & Catálogo
                    </TabsTrigger>
                </TabsList>

                {/* TAB: DEPOSITS */}
                <TabsContent value="deposits">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nodes.map((node) => (
                            <Card
                                key={node.id}
                                onClick={() => handleOpenNodeSheet(node)}
                                className={`rounded-[2rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden group hover:-translate-y-1 transition-all border-l-4 cursor-pointer ${node.type === 'Central' ? 'border-l-blue-500' : 'border-l-indigo-400'
                                    }`}
                            >
                                <CardHeader className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <Database className={`w-10 h-10 ${node.type === 'Central' ? 'text-blue-600' : 'text-indigo-400'}`} />
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {node.type}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight">{node.name}</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium pt-2">
                                        {node.type === 'Central' ? 'Depósito principal de abastecimiento.' : 'Punto de entrega y gestión periférica.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 pt-0">
                                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest w-fit px-3 py-1.5 rounded-lg border ${node.is_active
                                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                                        : 'text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                        }`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        {node.is_active ? 'Nodo Activo' : 'Desactivado'}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <button
                            onClick={() => handleOpenNodeSheet()}
                            className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-all group min-h-[250px]"
                        >
                            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">Nuevo Nodo de Depósito</h3>
                                <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Crea sub-depósitos o depósitos de servicios (Farmacia, Periféricos).</p>
                            </div>
                        </button>
                    </div>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetContent className="sm:max-w-md border-l-gray-100 dark:border-l-slate-800/60 p-0 overflow-hidden flex flex-col">
                            <div className="p-10 border-b border-gray-50 dark:border-slate-800/50">
                                <SheetHeader className="text-left">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
                                        <Database className="w-8 h-8 text-white" />
                                    </div>
                                    <SheetTitle className="text-3xl font-black tracking-tight">{editingNode ? 'Editar Nodo' : 'Nuevo Nodo'}</SheetTitle>
                                    <SheetDescription className="text-slate-500 font-medium pt-1 text-base leading-relaxed">
                                        Configura los parámetros del punto logístico. Los depósitos centrales controlan el stock maestro.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            <form onSubmit={handleNodeSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 px-1 italic">Información Principal</Label>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="node-name" className="text-sm font-bold text-slate-900 dark:text-slate-100">Nombre del Depósito</Label>
                                            <Input
                                                id="node-name"
                                                placeholder="Ej: Depósito Central Banda"
                                                value={nodeForm.name}
                                                onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                                                className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-slate-900 dark:text-slate-100">Tipo de Nodo</Label>
                                            <Select value={nodeForm.type} onValueChange={(v) => setNodeForm({ ...nodeForm, type: v })}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 font-medium overflow-hidden">
                                                    <SelectValue placeholder="Seleccionar Tipo" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-2xl">
                                                    <SelectItem value="Central" className="font-bold p-3">Centro de Distribución (Central)</SelectItem>
                                                    <SelectItem value="Periferico" className="font-bold p-3">Punto de Entrega (Periférico)</SelectItem>
                                                    <SelectItem value="Especial" className="font-bold p-3">Unidad Especial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-slate-900 dark:text-slate-100">Hospital (Tenant)</Label>
                                            <Select value={nodeForm.tenants} onValueChange={(v) => setNodeForm({ ...nodeForm, tenants: v })}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 font-medium overflow-hidden">
                                                    <SelectValue placeholder="Seleccionar Hospital" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-2xl">
                                                    {tenants.map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="font-medium p-3">
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-black tracking-tight text-slate-900 dark:text-white">Estado del Nodo</Label>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{nodeForm.is_active ? 'Operativo' : 'Inactivo'}</p>
                                    </div>
                                    <Switch
                                        checked={nodeForm.is_active}
                                        onCheckedChange={(v) => setNodeForm({ ...nodeForm, is_active: v })}
                                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                                    />
                                </div>

                                <div className="space-y-4 pt-10 border-t border-gray-50 dark:border-slate-800/50">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            editingNode ? 'Guardar Cambios' : 'Crear Nodo logístico'
                                        )}
                                    </Button>

                                    {editingNode && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleDeleteNode}
                                            disabled={isSaving}
                                            className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Nodo (Super Admin)
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsSheetOpen(false)}
                                        className="w-full h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </TabsContent>

                {/* TAB: SECTORS */}
                <TabsContent value="sectors">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="rounded-[2.5rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl lg:col-span-1 h-fit">
                                <CardHeader className="p-10">
                                    <div className="p-4 w-fit rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-6 font-black tracking-tighter uppercase text-[10px] border border-blue-500/20">
                                        Contexto de Red
                                    </div>
                                    <CardTitle className="text-3xl font-black tracking-tight">Selección de Hospital</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed pt-2">
                                        Seleccione el establecimiento para el cual desea administrar los parámetros logísticos y sectores.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-10 pb-10 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Hospital Activo</label>
                                        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                                            <SelectTrigger className="h-16 rounded-2xl border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:ring-blue-500/10 focus:border-blue-500">
                                                <SelectValue placeholder="Seleccionar Hospital" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-2xl">
                                                {tenants.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="font-medium p-4 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/30 text-base">
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Los cambios realizados en los sectores afectarán únicamente a la configuración del hospital seleccionado.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden lg:col-span-2">
                                <CardHeader className="p-10 border-b border-gray-50 dark:border-slate-800/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <CardTitle className="text-2xl font-black">Sectores Registrados</CardTitle>
                                            <CardDescription>Lista de unidades operativas asistenciales ({filteredSectors.length} mostrados).</CardDescription>
                                        </div>
                                        <div className="relative w-full md:w-80 group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <Input
                                                placeholder="Buscar por nombre o ID..."
                                                value={sectorSearch}
                                                onChange={(e) => setSectorSearch(e.target.value)}
                                                className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-6">
                                        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                            {sectors.filter(s => s.is_active).length} Sectores Activos
                                        </div>
                                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                                            {sectors.filter(s => s.is_stock_hub).length} Depósitos de Insumos
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[700px] overflow-y-auto custom-scrollbar">
                                    {sectors.length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center">
                                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                                <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-400 italic">No hay sectores cargados.</h4>
                                        </div>
                                    ) : filteredSectors.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <p className="font-bold text-slate-400 uppercase tracking-widest">No se encontraron resultados para "{sectorSearch}"</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                            {filteredSectors.map((sector, idx) => (
                                                <div
                                                    key={sector.id}
                                                    onClick={() => handleOpenSectorSheet(sector)}
                                                    className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-sm shadow-sm transition-all ${sector.is_active
                                                            ? 'bg-blue-600 text-white shadow-blue-500/20'
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <h5 className={`font-black tracking-tight text-lg ${!sector.is_active && 'text-slate-400'}`}>
                                                                {sector.name}
                                                            </h5>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">PB-ID: {sector.id}</span>
                                                                {sector.is_stock_hub && (
                                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black rounded-lg border border-amber-500/20 uppercase tracking-tighter">
                                                                        <Database className="w-2.5 h-2.5" />
                                                                        Stock Hub
                                                                    </div>
                                                                )}
                                                                {!sector.is_active && (
                                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-black rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                                                                        Desactivado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                        <Settings className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Sheet open={isSectorSheetOpen} onOpenChange={setIsSectorSheetOpen}>
                        <SheetContent className="sm:max-w-md border-l-gray-100 dark:border-l-slate-800/60 p-0 overflow-hidden flex flex-col">
                            <div className="p-10 border-b border-gray-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                                <SheetHeader className="text-left">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
                                        <MapPin className="w-8 h-8 text-white" />
                                    </div>
                                    <SheetTitle className="text-3xl font-black tracking-tight">Editar Sector</SheetTitle>
                                    <SheetDescription className="text-slate-500 font-medium pt-1 text-base leading-relaxed">
                                        Administre el nombre y las capacidades logísticas de este sector hospitalario.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            <form onSubmit={handleSectorSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 px-1 italic">Parámetros del Sector</Label>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="sector-name" className="text-sm font-bold text-slate-900 dark:text-slate-100">Nombre del Área</Label>
                                            <Input
                                                id="sector-name"
                                                value={sectorForm.name}
                                                onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })}
                                                className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-lg"
                                                required
                                            />
                                        </div>

                                        <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-blue-600" />
                                                    <Label className="text-base font-black tracking-tight text-slate-900 dark:text-white">Capacidad de Stock</Label>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium pr-8">Permitir que este sector gestione su propio inventario interno.</p>
                                            </div>
                                            <Switch
                                                checked={sectorForm.is_stock_hub}
                                                onCheckedChange={(v) => setSectorForm({ ...sectorForm, is_stock_hub: v })}
                                                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                                            />
                                        </div>

                                        <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                            <div className="space-y-1">
                                                <Label className="text-base font-black tracking-tight text-slate-900 dark:text-white">Estado del Sector</Label>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{sectorForm.is_active ? 'Activo' : 'Inactivo'}</p>
                                            </div>
                                            <Switch
                                                checked={sectorForm.is_active}
                                                onCheckedChange={(v) => setSectorForm({ ...sectorForm, is_active: v })}
                                                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-gray-50 dark:border-slate-800/50">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
                                    </Button>

                                    {editingSector && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleDeleteSector}
                                            disabled={isSaving}
                                            className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Sector (Super Admin)
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsSectorSheetOpen(false)}
                                        className="w-full h-14 rounded-2xl text-slate-400 font-bold"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </TabsContent>

                {/* TAB: CATEGORIES */}
                <TabsContent value="categories">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center">
                                <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                                <p className="font-bold text-slate-400 uppercase tracking-widest">Cargando catálogo maestro...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2.5rem]">
                                <Tags className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="font-bold text-slate-400 text-xl tracking-tight">No hay categorías definidas.</p>
                                <Button
                                    variant="link"
                                    onClick={handleCreateBaseCategories}
                                    className="text-blue-600 mt-2 font-black underline text-lg"
                                >
                                    Crear categorías base
                                </Button>
                            </div>
                        ) : (
                            categories.map(cat => (
                                <Card
                                    key={cat.id}
                                    onClick={() => handleOpenCatSheet(cat)}
                                    className="rounded-[2rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600">
                                            <Tags className="w-6 h-6" />
                                        </div>
                                        <div className={`h-2 w-2 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <div className="mt-8 relative z-10">
                                        <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">{cat.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">ID: {cat.id}</p>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Tags className="w-24 h-24" />
                                    </div>
                                </Card>
                            ))
                        )}

                        <button
                            onClick={() => handleOpenCatSheet()}
                            className="border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-all group min-h-[200px]"
                        >
                            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-widest">Añadir Categoría</span>
                        </button>
                    </div>

                    <Sheet open={isCatSheetOpen} onOpenChange={setIsCatSheetOpen}>
                        <SheetContent className="sm:max-w-md border-l-gray-100 dark:border-l-slate-800/60 p-0 overflow-hidden flex flex-col">
                            <div className="p-10 border-b border-gray-50 dark:border-slate-800/50">
                                <SheetHeader className="text-left">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6">
                                        <Tags className="w-8 h-8 text-white" />
                                    </div>
                                    <SheetTitle className="text-3xl font-black tracking-tight">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</SheetTitle>
                                    <SheetDescription className="text-slate-500 font-medium pt-1 text-base leading-relaxed">
                                        Las categorías permiten agrupar los insumos por su naturaleza técnica y normativa.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            <form onSubmit={handleCatSubmit} className="flex-1 p-10 space-y-10">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="cat-name" className="text-sm font-bold text-slate-900 dark:text-slate-100">Nombre de la Categoría</Label>
                                        <Input
                                            id="cat-name"
                                            placeholder="Ej: Descartables Quirúrgicos"
                                            value={catForm.name}
                                            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                            className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-lg"
                                            required
                                        />
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-base font-black tracking-tight text-slate-900 dark:text-white">Estado de Categoría</Label>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{catForm.is_active ? 'Habilitada' : 'Inhabilitada'}</p>
                                        </div>
                                        <Switch
                                            checked={catForm.is_active}
                                            onCheckedChange={(v) => setCatForm({ ...catForm, is_active: v })}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-gray-50 dark:border-slate-800/50">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" /> : editingCategory ? 'Actualizar' : 'Guardar Categoría'}
                                    </Button>

                                    {editingCategory && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleDeleteCategory}
                                            disabled={isSaving}
                                            className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Categoría
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsCatSheetOpen(false)}
                                        className="w-full h-14 rounded-2xl text-slate-400 font-bold"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </TabsContent>
            </Tabs>
        </div>
    );
}

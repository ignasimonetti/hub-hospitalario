'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Edit, Trash2, Archive, CheckCircle, AlertTriangle, LayoutGrid, List, Calendar, User, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ActionType = 'delete' | 'publish' | 'archive';
type ViewMode = 'list' | 'grid';

interface Article {
    id: string;
    title: string;
    status: string;
    sections: string[];
    published_date: string;
    cover_image: string;
    collectionId?: string;
    summary?: string;
}

export function ArticlesTable() {
    const [articles, setArticles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sectionFilter, setSectionFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<ActionType | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<{ id: string; title: string } | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const { getArticles } = await import('@/app/actions/blog/articles');
            const result = await getArticles({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                section: sectionFilter !== 'all' ? sectionFilter : undefined,
                search: searchQuery || undefined,
            });

            if (result.success) {
                setArticles(result.data);
            } else {
                toast.error(result.error || "Error al cargar artículos");
            }
        } catch (error) {
            toast.error("Error al cargar artículos");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchArticles();
    }, [statusFilter, sectionFilter]);

    const handleSearch = () => {
        fetchArticles();
    };

    const openConfirm = (type: ActionType, article: { id: string; title: string }) => {
        setActionType(type);
        setSelectedArticle(article);
        setConfirmOpen(true);
    };

    const executeAction = async () => {
        if (!actionType || !selectedArticle) return;

        setIsActionLoading(true);
        try {
            let result;
            const actions = await import('@/app/actions/blog/articles');

            switch (actionType) {
                case 'delete':
                    result = await actions.deleteArticle(selectedArticle.id);
                    if (result.success) toast.success("Artículo eliminado correctamente");
                    break;
                case 'publish':
                    result = await actions.publishArticle(selectedArticle.id);
                    if (result.success) toast.success("Artículo publicado correctamente");
                    break;
                case 'archive':
                    result = await actions.archiveArticle(selectedArticle.id);
                    if (result.success) toast.success("Artículo archivado correctamente");
                    break;
            }

            if (result && !result.success) {
                toast.error(result.error || `Error al ${actionType === 'delete' ? 'eliminar' : actionType === 'publish' ? 'publicar' : 'archivar'}`);
            } else {
                fetchArticles();
                setConfirmOpen(false);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            borrador: <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">📝 Borrador</Badge>,
            en_revision: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">🔍 En Revisión</Badge>,
            publicado: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">✅ Publicado</Badge>,
            archivado: <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">📦 Archivado</Badge>,
        };
        return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
    };

    const getDialogContent = () => {
        switch (actionType) {
            case 'delete':
                return {
                    title: '¿Eliminar artículo?',
                    description: `Estás a punto de eliminar "${selectedArticle?.title}". Esta acción no se puede deshacer.`,
                    confirmText: 'Eliminar',
                    variant: 'destructive' as const
                };
            case 'publish':
                return {
                    title: '¿Publicar artículo?',
                    description: `El artículo "${selectedArticle?.title}" será visible para todos los usuarios.`,
                    confirmText: 'Publicar',
                    variant: 'default' as const
                };
            case 'archive':
                return {
                    title: '¿Archivar artículo?',
                    description: `El artículo "${selectedArticle?.title}" dejará de ser visible al público pero se mantendrá en el sistema.`,
                    confirmText: 'Archivar',
                    variant: 'secondary' as const
                };
            default:
                return { title: '', description: '', confirmText: '', variant: 'default' as const };
        }
    };

    const dialogContent = getDialogContent();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Blog</h2>
                    <p className="text-muted-foreground dark:text-slate-400">
                        Gestiona y publica noticias y artículos para el hospital.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Link href="/modules/content/stats">
                        <Button variant="outline" className="h-10 shadow-sm hover:shadow-md transition-all dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            <BarChart3 className="mr-2 h-4 w-4" /> Estadísticas
                        </Button>
                    </Link>
                    <Link href="/modules/content/new">
                        <Button className="h-10 border border-transparent shadow-sm hover:shadow-md transition-all dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Artículo
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm sticky top-0 z-10 transition-colors">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-400" />
                        <Input
                            placeholder="Buscar artículos..."
                            className="pl-9 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 dark:text-slate-200 dark:placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-gray-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="borrador">Borrador</SelectItem>
                            <SelectItem value="en_revision">En Revisión</SelectItem>
                            <SelectItem value="publicado">Publicado</SelectItem>
                            <SelectItem value="archivado">Archivado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-gray-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                            <SelectValue placeholder="Sección" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="Novedad">Novedad</SelectItem>
                            <SelectItem value="Maternidad">Maternidad</SelectItem>
                            <SelectItem value="Pediatría">Pediatría</SelectItem>
                            <SelectItem value="Adultos">Adultos</SelectItem>
                            <SelectItem value="OCD">OCD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-800 pl-4 ml-auto lg:ml-0">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                        title="Vista de cuadrícula"
                        className="dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                        title="Vista de lista"
                        className="dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-80 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
                        <FileText className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                        No hay artículos todavía
                    </h3>
                    <p className="text-muted-foreground max-w-sm mb-8">
                        Comienza a escribir historias increíbles para compartir con la comunidad del hospital.
                    </p>
                    <Link href="/modules/content/new">
                        <Button size="lg" className="shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> Crear mi primer artículo
                        </Button>
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => (
                        <div
                            key={article.id}
                            className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 dark:hover:border-blue-400/30"
                        >
                            {/* Image Area */}
                            <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-slate-800">
                                {article.cover_image ? (
                                    <img
                                        src={`https://pocketbase.manta.com.ar/api/files/${article.collectionId}/${article.id}/${article.cover_image}`}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600">
                                        <FileText className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(article.status)}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex flex-col flex-1 p-5">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {article.sections?.slice(0, 2).map((section: string) => (
                                        <Badge key={section} variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                            {section}
                                        </Badge>
                                    ))}
                                    {article.sections?.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">+{article.sections.length - 2}</Badge>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {article.title}
                                </h3>

                                <p className="text-sm text-muted-foreground dark:text-slate-300 line-clamp-3 mb-4 flex-1">
                                    {article.summary || "Sin resumen disponible..."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 mt-auto">
                                    <div className="flex items-center text-xs text-muted-foreground dark:text-slate-400">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        {format(new Date(article.published_date), 'd MMM, yyyy', { locale: es })}
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/modules/content/${article.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                            onClick={() => openConfirm('delete', article)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* LIST VIEW (Original Table) */
                <Card className="border-gray-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-slate-950/50 hover:bg-gray-50/50 dark:hover:bg-slate-950/50 border-gray-200 dark:border-slate-800">
                                    <TableHead className="w-[80px] dark:text-slate-400">Imagen</TableHead>
                                    <TableHead className="dark:text-slate-400">Título</TableHead>
                                    <TableHead className="dark:text-slate-400">Estado</TableHead>
                                    <TableHead className="hidden md:table-cell dark:text-slate-400">Secciones</TableHead>
                                    <TableHead className="hidden lg:table-cell dark:text-slate-400">Fecha</TableHead>
                                    <TableHead className="text-right dark:text-slate-400">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {articles.map((article) => (
                                    <TableRow key={article.id} className="group">
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                                                {article.cover_image ? (
                                                    <img
                                                        src={`https://pocketbase.manta.com.ar/api/files/${article.collectionId}/${article.id}/${article.cover_image}`}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FileText className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium dark:text-slate-200">
                                            <span className="line-clamp-1">{article.title}</span>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(article.status)}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {article.sections?.slice(0, 2).map((section: string) => (
                                                    <Badge key={section} variant="secondary" className="text-xs dark:bg-slate-800 dark:text-slate-200">
                                                        {section}
                                                    </Badge>
                                                ))}
                                                {article.sections?.length > 2 && (
                                                    <Badge variant="secondary" className="text-xs dark:bg-slate-800 dark:text-slate-200">
                                                        +{article.sections.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground dark:text-slate-400">
                                            {format(new Date(article.published_date), 'dd/MM/yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/modules/content/${article.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {article.status !== 'publicado' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openConfirm('publish', article)}
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        title="Publicar"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {article.status === 'publicado' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openConfirm('archive', article)}
                                                        className="h-8 w-8 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                                                        title="Archivar"
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                                    onClick={() => openConfirm('delete', article)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            {dialogContent.title}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogContent.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isActionLoading}>
                            Cancelar
                        </Button>
                        <Button
                            variant={dialogContent.variant}
                            onClick={executeAction}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? 'Procesando...' : dialogContent.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

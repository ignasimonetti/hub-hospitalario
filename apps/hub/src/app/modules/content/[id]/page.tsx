'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import Link from 'next/link';
import { RichTextEditor } from "@/components/modules/RichTextEditor";
import { ArticlePreview } from "@/components/modules/ArticlePreview";
import { TagSelector } from "@/components/modules/TagSelector";
import { ProtectedContent } from '@/components/ProtectedContent';
import { ModulesLayout } from '@/components/ModulesLayout';
import { ImageUpload } from "@/components/ui/image-upload";

const SECTIONS = ['Novedad', 'Maternidad', 'Pediatría', 'Adultos', 'OCD'];
const PLATFORMS = ['Web', 'YouTube', 'Instagram', 'Facebook', 'TikTok', 'X'];

function EditArticlePage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('borrador');
    const [publishedDate, setPublishedDate] = useState('');
    const [scheduledFor, setScheduledFor] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [currentCoverImage, setCurrentCoverImage] = useState('');

    useEffect(() => {
        loadArticle();
    }, [articleId]);

    const loadArticle = async () => {
        try {
            const { getArticle } = await import('@/app/actions/blog/articles');
            const result = await getArticle(articleId);

            if (result.success && result.data) {
                const article = result.data;
                setTitle(article.title);
                setSummary(article.summary || '');
                setContent(article.content);
                setStatus(article.status);
                // Handle published_date - ensure it's properly formatted
                const rawPublishedDate = article.published_date;
                let formattedPublishedDate = '';

                if (rawPublishedDate) {
                    if (typeof rawPublishedDate === 'string') {
                        // If it's already a string, try to parse and format it
                        try {
                            const dateObj = new Date(rawPublishedDate);
                            if (!isNaN(dateObj.getTime())) {
                                formattedPublishedDate = dateObj.toISOString().split('T')[0];
                            } else {
                                // If parsing fails, use the raw value as fallback
                                formattedPublishedDate = rawPublishedDate.split('T')[0] || rawPublishedDate;
                            }
                        } catch (e) {
                            formattedPublishedDate = rawPublishedDate.split('T')[0] || rawPublishedDate;
                        }
                    } else if (rawPublishedDate instanceof Date) {
                        // If it's a Date object, format it
                        formattedPublishedDate = rawPublishedDate.toISOString().split('T')[0];
                    } else {
                        // Fallback for any other type
                        formattedPublishedDate = String(rawPublishedDate).split('T')[0];
                    }
                }

                setPublishedDate(formattedPublishedDate);
                setScheduledFor(article.scheduled_for ? article.scheduled_for.slice(0, 16) : '');
                setVideoLink(article.video_link || '');
                setSelectedSections(article.sections || []);
                setSelectedPlatforms(article.platforms || []);
                setSelectedTags(article.tags?.map((t: any) => typeof t === 'string' ? t : t.id) || []);
                setCurrentCoverImage(article.cover_image || '');
            } else {
                toast.error('Error al cargar artículo');
                router.push('/modules/content');
            }
        } catch (error) {
            toast.error('Error al cargar artículo');
            router.push('/modules/content');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        console.log('Iniciando guardado de artículo...');
        const toastId = toast.loading('Guardando cambios...');

        try {
            if (!title.trim()) {
                toast.error('El título es obligatorio', { id: toastId });
                setIsSaving(false);
                return;
            }

            if (!publishedDate) {
                toast.error('La fecha de publicación es obligatoria', { id: toastId });
                setIsSaving(false);
                return;
            }

            if (selectedSections.length === 0) {
                toast.error('Debe seleccionar al menos una sección', { id: toastId });
                setIsSaving(false);
                return;
            }

            if (selectedPlatforms.length === 0) {
                toast.error('Debe seleccionar al menos una plataforma', { id: toastId });
                setIsSaving(false);
                return;
            }

            if (selectedTags.length === 0) {
                toast.error('Debe seleccionar al menos una etiqueta', { id: toastId });
                setIsSaving(false);
                return;
            }

            console.log('Validaciones pasadas, preparando datos...');

            const formData = new FormData();
            formData.append('title', title);
            formData.append('summary', summary);
            formData.append('content', content);
            formData.append('status', status);
            formData.append('published_date', publishedDate);
            formData.append('scheduled_for', scheduledFor);
            formData.append('video_link', videoLink);

            selectedSections.forEach(section => formData.append('sections', section));
            selectedPlatforms.forEach(platform => formData.append('platforms', platform));
            selectedTags.forEach(tag => formData.append('tags', tag));

            if (coverImage) {
                formData.append('cover_image', coverImage);
            }

            const { updateArticle } = await import('@/app/actions/blog/articles');
            const result = await updateArticle(articleId, formData);

            if (result.success) {
                toast.success('Artículo actualizado exitosamente', { id: toastId });
                router.push('/modules/content');
            } else {
                toast.error(result.error || 'Error al actualizar artículo', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar artículo', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSection = (section: string) => {
        setSelectedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const togglePlatform = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-10 px-4 max-w-4xl">
                <div className="text-center">Cargando artículo...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl pb-32">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Link href="/modules/content" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Editar Artículo</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 mb-2">
                            {title || 'Sin título'}
                        </h1>
                        <p className="text-muted-foreground">
                            Edita los detalles y el contenido de tu artículo.
                        </p>
                    </div>
                    <ArticlePreview
                        title={title}
                        content={content}
                        summary={summary}
                        coverImage={coverImage || currentCoverImage}
                        publishedDate={publishedDate}
                        sections={selectedSections}
                        articleId={articleId}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Principal (2/3) */}
                    {/* Columna Principal (2/3) - Estilo Documento Notion/Medium */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Área de Título y Resumen Limpia */}
                        <div className="space-y-4">
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título del artículo..."
                                className="text-4xl font-bold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 h-auto py-2"
                            />
                            <Textarea
                                id="summary"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Escribe un breve resumen o introducción..."
                                className="text-xl text-muted-foreground border-none shadow-none px-0 focus-visible:ring-0 bg-transparent resize-none min-h-[80px]"
                            />
                        </div>

                        {/* Editor de Texto Rico - Sin bordes externos, foco en el contenido */}
                        <div className="min-h-[500px]">
                            <RichTextEditor
                                content={content}
                                onChange={setContent}
                            />
                        </div>
                    </div>

                    {/* Columna Lateral (1/3) */}
                    <div className="space-y-6">
                        <Card className="border-gray-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Publicación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Estado</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="borrador">Borrador</SelectItem>
                                            <SelectItem value="en_revision">En Revisión</SelectItem>
                                            <SelectItem value="publicado">Publicado</SelectItem>
                                            <SelectItem value="archivado">Archivado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="published_date">Fecha de Publicación</Label>
                                    <Input
                                        id="published_date"
                                        type="date"
                                        value={publishedDate}
                                        onChange={(e) => setPublishedDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_for">Programar para (Opcional)</Label>
                                    <Input
                                        id="scheduled_for"
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                    />
                                </div>


                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Multimedia</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cover_image">Imagen de Portada</Label>
                                    <ImageUpload
                                        value={coverImage}
                                        onChange={setCoverImage}
                                        currentImageUrl={
                                            currentCoverImage
                                                ? `https://pocketbase.manta.com.ar/api/files/blog_articulos/${articleId}/${currentCoverImage}`
                                                : null
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="video_link">Link de Video</Label>
                                    <Input
                                        id="video_link"
                                        type="url"
                                        value={videoLink}
                                        onChange={(e) => setVideoLink(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Clasificación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Secciones *</Label>
                                    <div className="space-y-2">
                                        {SECTIONS.map(section => (
                                            <div key={section} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`section-${section}`}
                                                    checked={selectedSections.includes(section)}
                                                    onCheckedChange={() => toggleSection(section)}
                                                />
                                                <label
                                                    htmlFor={`section-${section}`}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {section}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Etiquetas *</Label>
                                    <TagSelector
                                        selectedTags={selectedTags}
                                        onTagsChange={setSelectedTags}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Plataformas *</Label>
                                    <div className="space-y-2">
                                        {PLATFORMS.map(platform => (
                                            <div key={platform} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`platform-${platform}`}
                                                    checked={selectedPlatforms.includes(platform)}
                                                    onCheckedChange={() => togglePlatform(platform)}
                                                />
                                                <label
                                                    htmlFor={`platform-${platform}`}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {platform}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sticky Footer Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 z-50 flex items-center justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:left-16 md:left-64 transition-all duration-300">
                    <div className="container max-w-5xl flex justify-end gap-4 px-4 md:px-8">
                        <Link href="/modules/content">
                            <Button type="button" variant="outline" size="lg">
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSaving} size="lg" className="min-w-[200px]">
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </form>
        </div >
    );
}

export default function EditArticlePageWrapper() {
    return (
        <ModulesLayout currentPage="blog">
            <ProtectedContent
                roles={['superadmin', 'editor_blog']}
                fallback={
                    <div className="container mx-auto py-10 px-4 max-w-5xl pb-32">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold mb-4">Acceso denegado</h2>
                            <p>No tienes permisos para editar artículos de blog.</p>
                            <p>Solo usuarios con roles de Superadministrador o Editor de Blog pueden acceder a esta función.</p>
                        </div>
                    </div>
                }
            >
                <EditArticlePage />
            </ProtectedContent>
        </ModulesLayout>
    );
}

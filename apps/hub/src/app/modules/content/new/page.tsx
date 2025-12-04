'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from 'next/link';
import { RichTextEditor } from "@/components/modules/RichTextEditor";
import { ArticlePreview } from "@/components/modules/ArticlePreview";
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea for summary
import { TagSelector } from "@/components/modules/TagSelector";
import { ProtectedContent } from '@/components/ProtectedContent';
import { ModulesLayout } from '@/components/ModulesLayout';
import { ImageUpload } from "@/components/ui/image-upload";

const SECTIONS = ['Novedad', 'Maternidad', 'Pediatría', 'Adultos', 'OCD'];
const PLATFORMS = ['Web', 'YouTube', 'Instagram', 'Facebook', 'TikTok', 'X'];

function NewArticlePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [authors, setAuthors] = useState<any[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('borrador');
    const [publishedDate, setPublishedDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduledFor, setScheduledFor] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Web']);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const { getAuthors } = await import('@/app/actions/blog/metadata');

            const authorsResult = await getAuthors();

            if (authorsResult.success) setAuthors(authorsResult.data);
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Creando artículo...');

        try {
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
            selectedAuthors.forEach(author => formData.append('author', author));
            selectedTags.forEach(tag => formData.append('tags', tag));

            if (coverImage) {
                formData.append('cover_image', coverImage);
            }

            const { createArticle } = await import('@/app/actions/blog/articles');
            const result = await createArticle(formData);

            if (result.success) {
                toast.dismiss(toastId);
                toast.success('Artículo creado exitosamente');
                router.push('/modules/content');
            } else {
                toast.dismiss(toastId);
                toast.error(result.error || 'Error al crear artículo');
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error('Error al crear artículo');
        } finally {
            setIsLoading(false);
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

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl pb-32">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Link href="/modules/content" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Nuevo Artículo</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 mb-2">
                            Crear Nuevo Artículo
                        </h1>
                        <p className="text-muted-foreground">
                            Escribe y publica una nueva historia para el hospital.
                        </p>
                    </div>
                    <ArticlePreview
                        title={title}
                        content={content}
                        summary={summary}
                        coverImage={coverImage}
                        publishedDate={publishedDate}
                        sections={selectedSections}
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
                                required
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
                                        required
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
                                    <p className="text-xs text-muted-foreground">
                                        Si se establece, se publicará automáticamente en esta fecha.
                                    </p>
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
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="video_link">Link de Video</Label>
                                    <Input
                                        id="video_link"
                                        type="url"
                                        value={videoLink}
                                        onChange={(e) => setVideoLink(e.target.value)}
                                        placeholder="https://youtube.com..."
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
                                    <Label>Secciones</Label>
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
                                    <Label>Etiquetas</Label>
                                    <TagSelector
                                        selectedTags={selectedTags}
                                        onTagsChange={setSelectedTags}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Plataformas</Label>
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
                        <Button type="submit" disabled={isLoading} size="lg" className="min-w-[200px]">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? 'Guardando...' : 'Guardar Artículo'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function NewArticlePageWrapper() {
    return (
        <ModulesLayout currentPage="blog">
            <ProtectedContent
                roles={['superadmin', 'editor_blog']}
                fallback={
                    <div className="container mx-auto py-10 px-4 max-w-5xl pb-32">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold mb-4">Acceso denegado</h2>
                            <p>No tienes permisos para crear artículos de blog.</p>
                            <p>Solo usuarios con roles de Superadministrador o Editor de Blog pueden acceder a esta función.</p>
                        </div>
                    </div>
                }
            >
                <NewArticlePage />
            </ProtectedContent>
        </ModulesLayout>
    );
}

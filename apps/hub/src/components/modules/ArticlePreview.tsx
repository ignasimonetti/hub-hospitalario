import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ArticlePreviewProps {
    title: string;
    content: string;
    summary: string;
    coverImage: File | string | null;
    publishedDate: string;
    sections: string[];
    articleId?: string; // Needed to construct PB URL for existing images
}

export function ArticlePreview({
    title,
    content,
    summary,
    coverImage,
    publishedDate,
    sections,
    articleId
}: ArticlePreviewProps) {

    // Helper to get image source
    const getImageUrl = () => {
        if (!coverImage) return null;

        // If it's a new file upload (File object)
        if (coverImage instanceof File) {
            return URL.createObjectURL(coverImage);
        }

        // If it's an existing image string (filename) and we have an ID
        if (typeof coverImage === 'string' && articleId) {
            return `https://pocketbase.manta.com.ar/api/files/blog_articulos/${articleId}/${coverImage}`;
        }

        return null;
    };

    const imageUrl = getImageUrl();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800">
                    <Eye className="h-4 w-4" />
                    Vista Previa
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b dark:border-slate-800">
                    <DialogTitle className="dark:text-slate-100">Vista Previa del Artículo</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <article className="max-w-3xl mx-auto space-y-8 pb-10">
                        {/* Header */}
                        <header className="space-y-4 text-center">
                            <div className="flex flex-wrap justify-center gap-2">
                                {sections.map(section => (
                                    <Badge key={section} variant="secondary" className="dark:bg-slate-800 dark:text-slate-200">
                                        {section}
                                    </Badge>
                                ))}
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                {title || "Sin título"}
                            </h1>

                            <div className="flex items-center justify-center text-sm text-muted-foreground dark:text-slate-400 gap-2">
                                <span>Por Autor (Tú)</span>
                                <span>•</span>
                                <time>
                                    {publishedDate ? format(new Date(publishedDate), "d 'de' MMMM, yyyy", { locale: es }) : "Fecha no definida"}
                                </time>
                            </div>
                        </header>

                        {/* Cover Image */}
                        {imageUrl ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video w-full rounded-xl border bg-muted dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-muted-foreground dark:text-slate-400">
                                Sin imagen de portada
                            </div>
                        )}

                        {/* Summary */}
                        {summary && (
                            <div className="text-xl text-muted-foreground dark:text-slate-300 leading-relaxed border-l-4 border-primary pl-4 italic">
                                {summary}
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: content || "<p>Sin contenido...</p>" }}
                        />
                    </article>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

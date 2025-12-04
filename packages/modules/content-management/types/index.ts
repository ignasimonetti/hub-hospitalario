export interface Article {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    content: string;
    status: 'borrador' | 'en_revision' | 'publicado' | 'archivado';
    published_date: string;
    cover_image?: string;
    video_link?: string;
    sections?: string[];
    platforms?: string[];
    author?: string[];
    tags?: string[];
    last_edited_by?: string;
    scheduled_for?: string;
    created: string;
    updated: string;
}

export interface Author {
    id: string;
    first_name: string;
    last_name: string;
    profession?: string;
    email?: string;
    avatar?: string;
    dni: number;
}

export interface Tag {
    id: string;
    Etiquetas: string;
    created: string;
    updated: string;
}

export interface ArticleFilters {
    status?: string;
    section?: string;
    author?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
}

export interface ArticleFormData {
    title: string;
    summary?: string;
    content: string;
    status: Article['status'];
    published_date: string;
    cover_image?: File | string;
    video_link?: string;
    sections?: string[];
    platforms?: string[];
    author?: string[];
    tags?: string[];
    scheduled_for?: string;
}

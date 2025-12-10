'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { Bug, Send } from 'lucide-react';
import { pocketbase } from '@/lib/auth';

export function ErrorReportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { createNotification } = useNotifications();

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast({
                title: 'Error',
                description: 'Por favor describe el problema',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSubmitting(true);

            // Get current URL
            const currentUrl = window.location.href;

            // Create error report in PocketBase
            const pb = pocketbase;
            if (!pb.authStore.isValid) {
                throw new Error('Usuario no autenticado');
            }

            const formData = new FormData();
            formData.append('description', description);
            formData.append('url', currentUrl);
            formData.append('status', 'pending');
            formData.append('priority', 'medium');
            formData.append('reporter', pb.authStore.model?.id || '');

            if (file) {
                formData.append('screenshot', file);
            }

            await pb.collection('hub_error_reports').create(formData);

            // Create notification for the user
            await createNotification({
                user: pb.authStore.model?.id,
                type: 'error_update',
                title: 'Reporte de error enviado',
                message: 'Tu reporte ha sido recibido y será revisado pronto',
                link: '',
                read: false,
            });

            // Create notification for admins (this would be handled by a backend trigger in production)
            // For now, we'll just show a success message
            toast({
                title: 'Reporte enviado',
                description: 'Gracias por reportar el problema. Nuestro equipo lo revisará pronto.',
                variant: 'default',
            });

            // Reset form and close dialog
            setDescription('');
            setFile(null);
            setIsOpen(false);

        } catch (error) {
            console.error('Error submitting error report:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo enviar el reporte',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-9 gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                    <Bug className="h-4 w-4" />
                    <span>Reportar problema</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 dark:text-slate-100">
                        <Bug className="h-5 w-5 text-red-500" />
                        Reportar un problema
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Describe el problema que estás experimentando. Incluye tantos detalles como sea posible.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="dark:text-slate-200">Descripción del problema</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: No puedo guardar los cambios en el formulario de pacientes..."
                            rows={5}
                            className="min-h-[100px] bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="screenshot" className="dark:text-slate-200">Captura de pantalla (Opcional)</Label>
                        <Input
                            id="screenshot"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 dark:text-slate-200 file:text-slate-700 dark:file:text-slate-300"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                        className="dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-700"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !description.trim()}
                        className="gap-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Enviar reporte
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
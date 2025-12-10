import { useState, useEffect } from 'react';
import { pocketbase } from '@/lib/auth';
import { X, Megaphone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Announcement {
    id: string;
    title: string;
    content: string; // HTML string from editor
    active: boolean;
    updated: string;
}

export function AnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                // Fetch the latest active announcement
                const record = await pocketbase.collection('hub_announcements').getFirstListItem<Announcement>(
                    'active = true',
                    { sort: '-updated' }
                );

                if (record) {
                    // Check local storage to see if dismissed
                    const dismissedId = localStorage.getItem('dismissed_announcement_id');
                    if (dismissedId !== record.id) {
                        setAnnouncement(record);
                        setIsVisible(true);
                    }
                }
            } catch (error: any) {
                // Ignore autocancellation errors (standard PB SDK behavior on strict mode/remounts)
                if (error.isAbort) return;

                // If 404, just means no active announcement
                if (error.status !== 404) {
                    console.error("Error fetching announcements", error);
                }
            }
        };

        fetchAnnouncement();
    }, []);

    const handleDismiss = () => {
        if (announcement) {
            localStorage.setItem('dismissed_announcement_id', announcement.id);
            setIsVisible(false);
        }
    };

    if (!announcement || !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-indigo-600 dark:bg-indigo-900 text-white relative z-50 overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex-1 flex items-start min-w-0">
                                <span className="flex p-2 rounded-lg bg-indigo-800 dark:bg-indigo-950 mr-3 mt-1">
                                    <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                                <div className="flex-1 pt-1 break-words">
                                    <p className="font-medium text-white truncate mb-1">
                                        {announcement.title}
                                    </p>
                                    <div
                                        className="text-indigo-100 text-sm prose prose-invert max-w-none prose-p:my-1 prose-headings:text-white prose-a:text-white prose-a:underline"
                                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                                    />
                                </div>
                            </div>
                            <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="-mr-1 flex p-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                                >
                                    <span className="sr-only">Cerrar</span>
                                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
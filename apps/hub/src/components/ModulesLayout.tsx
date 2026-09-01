'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';

interface ModulesLayoutProps {
    children: ReactNode;
    currentPage?: 'dashboard' | 'blog' | 'admin' | 'expedientes' | 'supply' | 'prestadores' | 'tesoreria';
}

export function ModulesLayout({ children, currentPage = 'blog' }: ModulesLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        // Load sidebar state from localStorage
        const savedSidebarState = localStorage.getItem('sidebar-collapsed');
        if (savedSidebarState !== null) {
            setSidebarCollapsed(JSON.parse(savedSidebarState));
        }

        // Listen for sidebar state changes
        const handleStorageChange = () => {
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState !== null) {
                setSidebarCollapsed(JSON.parse(savedState));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom events (for same-tab updates)
        const handleSidebarToggle = () => {
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState !== null) {
                setSidebarCollapsed(JSON.parse(savedState));
            }
        };

        window.addEventListener('sidebarToggle', handleSidebarToggle);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sidebarToggle', handleSidebarToggle);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#191919]">
            {/* Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
                <AppSidebar currentPage={currentPage} />
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-200 ease-in-out ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} ml-0`}>
                <div className="min-h-screen">
                    {children}
                </div>
            </div>
        </div>
    );
}
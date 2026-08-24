"use client";

import * as React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
    compact?: boolean;
}

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    className,
    compact = false,
}: EmptyStateProps) {
    const ActionIcon = action?.icon;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center select-none animate-in fade-in-50 duration-300",
                compact ? "py-8 px-4" : "py-14 px-6",
                className
            )}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 mb-3.5 border border-slate-200/60 dark:border-slate-700/50 shadow-xs">
                <Icon className="w-5 h-5 stroke-[1.75]" />
            </div>

            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                {title}
            </h3>

            {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                    {description}
                </p>
            )}

            {action && (
                <Button
                    size="sm"
                    onClick={action.onClick}
                    className="mt-4 h-8 px-3.5 text-xs font-medium bg-[#08487A] hover:bg-[#06375d] text-white shadow-xs rounded-lg transition-colors"
                >
                    {ActionIcon && <ActionIcon className="w-3.5 h-3.5 mr-1.5" />}
                    {action.label}
                </Button>
            )}
        </div>
    );
}

"use client";

import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: number | string;
        isPositive?: boolean;
        isNeutral?: boolean;
        label?: string;
    };
    variant?: "default" | "accent" | "subtle";
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = "default",
    className,
}: StatCardProps) {
    return (
        <Card
            className={cn(
                "rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-sm",
                variant === "accent"
                    ? "bg-[#08487A]/5 dark:bg-[#08487A]/15 border-[#08487A]/20 dark:border-[#08487A]/30"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
                className
            )}
        >
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {title}
                    </p>
                    {Icon && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            <Icon className="w-4 h-4 stroke-[1.75]" />
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {value}
                    </p>
                    {trend && (
                        <div
                            className={cn(
                                "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
                                trend.isNeutral
                                    ? "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
                                    : trend.isPositive
                                    ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                                    : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40"
                            )}
                        >
                            {trend.isNeutral ? (
                                <Minus className="w-3 h-3" />
                            ) : trend.isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>

                {(description || trend?.label) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {trend?.label || description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

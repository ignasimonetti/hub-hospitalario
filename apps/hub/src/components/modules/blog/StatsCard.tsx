'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    iconClassName?: string;
}

import { motion } from 'framer-motion';

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName,
}: StatsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card className={cn(
                'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800',
                'transition-all duration-200 hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-400/30',
                className
            )}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-lg">
                            <AvatarFallback className={cn(
                                'rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                iconClassName
                            )}>
                                <Icon className="size-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-slate-400 truncate">
                                {title}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                    {value}
                                </span>
                                {trend && (
                                    <span className={cn(
                                        'text-xs font-medium',
                                        trend.isPositive
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                    )}>
                                        {trend.isPositive ? '+' : ''}{trend.value}%
                                    </span>
                                )}
                            </div>
                            {description && (
                                <span className="text-xs text-gray-500 dark:text-slate-500 truncate">
                                    {description}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

'use client';

import { Pie, PieChart, Label, Cell } from 'recharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

interface StatusData {
    borrador: number;
    en_revision: number;
    publicado: number;
    archivado: number;
}

interface ArticleStatusChartProps {
    data: StatusData;
    total: number;
    className?: string;
}

const STATUS_CONFIG = {
    borrador: {
        label: 'Borrador',
        color: '#f59e0b', // amber-500
        darkColor: '#fbbf24', // amber-400
        emoji: '📝',
    },
    en_revision: {
        label: 'En Revisión',
        color: '#3b82f6', // blue-500
        darkColor: '#60a5fa', // blue-400
        emoji: '👁️',
    },
    publicado: {
        label: 'Publicado',
        color: '#22c55e', // green-500
        darkColor: '#4ade80', // green-400
        emoji: '✅',
    },
    archivado: {
        label: 'Archivado',
        color: '#6b7280', // gray-500
        darkColor: '#9ca3af', // gray-400
        emoji: '📦',
    },
} as const;

const chartConfig = {
    count: { label: 'Artículos' },
    borrador: { label: 'Borrador', color: STATUS_CONFIG.borrador.color },
    en_revision: { label: 'En Revisión', color: STATUS_CONFIG.en_revision.color },
    publicado: { label: 'Publicado', color: STATUS_CONFIG.publicado.color },
    archivado: { label: 'Archivado', color: STATUS_CONFIG.archivado.color },
} satisfies ChartConfig;

export function ArticleStatusChart({ data, total, className }: ArticleStatusChartProps) {
    // Transform data for the chart
    const chartData = Object.entries(data)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
            status,
            count,
            label: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label,
            fill: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color,
        }));

    // Calculate published percentage
    const publishedPercentage = total > 0
        ? Math.round((data.publicado / total) * 100)
        : 0;

    if (total === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        Estado de Artículos
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-gray-500 dark:text-slate-400">
                        No hay artículos
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Estado de Artículos
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="label"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            strokeWidth={0}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    className="transition-opacity hover:opacity-80"
                                />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 8}
                                                    className="fill-gray-900 dark:fill-slate-100 text-2xl font-bold"
                                                >
                                                    {total}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 14}
                                                    className="fill-gray-500 dark:fill-slate-400 text-xs"
                                                >
                                                    Total
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: config.color }}
                            />
                            <span className="text-xs text-gray-600 dark:text-slate-400 truncate">
                                {config.emoji} {config.label}
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-slate-200 ml-auto">
                                {data[key as keyof StatusData]}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                    Tasa de publicación
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {publishedPercentage}%
                </span>
            </CardFooter>
        </Card>
    );
}

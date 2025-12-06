'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

interface SectionData {
    sectionId: string;
    sectionName: string;
    count: number;
}

interface ArticlesBySectionChartProps {
    data: SectionData[];
    className?: string;
}

const chartConfig = {
    count: {
        label: 'Artículos',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

export function ArticlesBySectionChart({ data, className }: ArticlesBySectionChartProps) {
    // Transform data for the chart
    const chartData = data.map((item) => ({
        section: item.sectionName.length > 15
            ? item.sectionName.substring(0, 15) + '...'
            : item.sectionName,
        fullName: item.sectionName,
        count: item.count,
        fill: 'var(--color-count)',
    }));

    if (chartData.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        Artículos por Sección
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-gray-500 dark:text-slate-400">
                        No hay datos disponibles
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Artículos por Sección
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="section"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={120}
                            tick={{
                                fill: 'currentColor',
                                fontSize: 12,
                            }}
                            className="text-gray-600 dark:text-slate-400"
                        />
                        <ChartTooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name, item) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.payload.fullName}</span>
                                            <span>{value} artículos</span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="count"
                            fill="var(--primary)"
                            radius={[0, 4, 4, 0]}
                            className="fill-blue-500 dark:fill-blue-400"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

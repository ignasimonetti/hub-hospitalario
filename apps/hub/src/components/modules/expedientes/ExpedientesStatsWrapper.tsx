
'use client';

import { useEffect, useState } from 'react';
import { pocketbase } from '@/lib/auth';
import { ExpedientesStats } from './ExpedientesStats';

export function ExpedientesStatsWrapper() {
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        finalizados: 0,
        archivados: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                // This is a naive implementation. For large datasets, use PocketBase aggregation or separate calls efficiently.
                // Since this is "Seguimiento", usually active items are < 1000.

                // Fetch counts - In PocketBase, getting list with perPage=1 and skipTotal=false gives us count.
                // We need 4 calls: Total, Activos, Finalizados, Archivados.

                const p1 = pocketbase.collection('expedientes').getList(1, 1, { skipTotal: false, requestKey: null });
                const p2 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "En trámite"', skipTotal: false, requestKey: null });
                const p3 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "Finalizado"', skipTotal: false, requestKey: null });
                const p4 = pocketbase.collection('expedientes').getList(1, 1, { filter: 'estado = "Archivado"', skipTotal: false, requestKey: null });

                const [resTotal, resActivos, resFinal, resArch] = await Promise.all([p1, p2, p3, p4]);

                setStats({
                    total: resTotal.totalItems,
                    activos: resActivos.totalItems,
                    finalizados: resFinal.totalItems,
                    archivados: resArch.totalItems
                });
            } catch (e) {
                console.error("Error loading stats", e);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    return <ExpedientesStats {...stats} loading={loading} />;
}

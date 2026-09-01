"use client";

import { useState, useEffect } from "react";
import { pocketbase } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Database } from "lucide-react";

interface PurgeTarget {
  id: string;
  name: string;
  description: string;
  count: number;
}

export function PurgeTab() {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ lotes: number; prestaciones: number; expedientes: number }>({
    lotes: 0,
    prestaciones: 0,
    expedientes: 0,
  });
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [lotesRes, prestRes, expRes] = await Promise.all([
        pocketbase.collection("tesoreria_lotes").getList(1, 1, { requestKey: null }),
        pocketbase.collection("prestaciones_presentaciones").getList(1, 1, { requestKey: null }),
        pocketbase.collection("expedientes").getList(1, 1, { requestKey: null }),
      ]);

      setCounts({
        lotes: lotesRes.totalItems,
        prestaciones: prestRes.totalItems,
        expedientes: expRes.totalItems,
      });
    } catch (err: any) {
      console.error("Error fetching counts for purge:", err);
      toast.error("Error al obtener conteos de las colecciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const targets: PurgeTarget[] = [
    {
      id: "lotes",
      name: "Lotes de Tesorería (tesoreria_lotes)",
      description: "Elimina todos los lotes de expedientes de pago agrupados.",
      count: counts.lotes,
    },
    {
      id: "prestaciones",
      name: "Presentaciones y Facturas (prestaciones_presentaciones)",
      description: "Elimina los comprobantes, órdenes asistenciales cargadas y facturas cargadas de prueba.",
      count: counts.prestaciones,
    },
    {
      id: "expedientes",
      name: "Expedientes Generales (expedientes)",
      description: "Elimina los expedientes del módulo de mesa de entrada y seguimiento.",
      count: counts.expedientes,
    },
  ];

  const handleToggle = (id: string) => {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTargets.length === targets.length) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets(targets.map((t) => t.id));
    }
  };

  const executePurge = async () => {
    if (selectedTargets.length === 0) return;
    setIsPurging(true);

    try {
      const token = pocketbase.authStore.token;
      const res = await fetch("/api/admin/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "bulk_purge",
          targets: selectedTargets,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al purgar los registros.");
      }

      toast.success(data.message || "Purga realizada con éxito.");
      setSelectedTargets([]);
      await fetchCounts();
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error inesperado al purgar.");
    } finally {
      setIsPurging(false);
    }
  };

  const totalSelectedRecords = targets
    .filter((t) => selectedTargets.includes(t.id))
    .reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-rose-700 dark:text-rose-400">
                  Herramienta de Purga y Limpieza de Transacciones de Prueba
                </CardTitle>
                <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
                  Solo accesible para Superadmin. Permite restablecer transacciones ficticias antes de pasar a producción.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCounts}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Recargar Conteos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Información de Seguridad y Alcance
            </div>
            <p>
              Esta herramienta <strong>NO ELIMINARÁ</strong> usuarios, hospitales (tenants), roles, perfiles de prestadores registrados ni catálogos de aranceles.
              Solo purga las operaciones transaccionales marcadas a continuación.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Seleccionar tablas a vaciar
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7"
              >
                {selectedTargets.length === targets.length ? "Deseleccionar todo" : "Seleccionar todo"}
              </Button>
            </div>

            <div className="grid gap-3">
              {targets.map((t) => {
                const isSelected = selectedTargets.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleToggle(t.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-700"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(t.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                        {loading ? "..." : `${t.count} registros`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500">
              {selectedTargets.length > 0 ? (
                <span>
                  Total a purgar: <strong>{totalSelectedRecords}</strong> registros seleccionados.
                </span>
              ) : (
                <span>No has seleccionado ninguna categoría para purgar.</span>
              )}
            </div>

            <Button
              variant="destructive"
              disabled={selectedTargets.length === 0 || isPurging}
              onClick={() => setIsConfirmOpen(true)}
              className="gap-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
              Purgar Seleccionados ({selectedTargets.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executePurge}
        title="Confirmación de Purga Masiva"
        description="Esta acción eliminará de forma irreversible todas las transacciones y registros seleccionados. No se podrá recuperar la información."
        confirmWord="PURGAR"
        recordLabel={`Tablas seleccionadas: ${selectedTargets.join(", ")} (~${totalSelectedRecords} registros)`}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getCurrentUser } from "@/lib/auth";
import {
  PrestadorPerfil,
  PrestacionPresentacion,
  PROFESIONES_MAP,
} from "@/types/prestadores";
import {
  getPrestadorPerfil,
  getMisPrestaciones,
} from "@/lib/services/prestadoresService";
import { ModalPerfilPrestador } from "@/components/prestadores/ModalPerfilPrestador";
import { ModalNuevaPrestacion } from "@/components/prestadores/ModalNuevaPrestacion";
import { ModalDetallePrestacion } from "@/components/prestadores/ModalDetallePrestacion";
import { TarjetaPrestacion } from "@/components/prestadores/TarjetaPrestacion";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Sparkles,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

export default function PrestadoresPage() {
  const { currentTenant } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");

  // Estado de Datos
  const [perfil, setPerfil] = useState<PrestadorPerfil | null>(null);
  const [prestaciones, setPrestaciones] = useState<PrestacionPresentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [prestacionSeleccionada, setPrestacionSeleccionada] =
    useState<PrestacionPresentacion | null>(null);
  const [observadaParaEditar, setObservadaParaEditar] =
    useState<PrestacionPresentacion | null>(null);

  // Sidebar / Navegación
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtro de estado
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Extraer nombre de pila
      fetch("/api/auth/profile")
        .then((res) => res.json())
        .then((data) => {
          const profileUser = data.user || data;
          const rawName =
            profileUser.firstName ||
            profileUser.first_name ||
            currentUser.firstName ||
            "";
          if (rawName) {
            const first = rawName.split(" ")[0].replace(/[0-9]/g, "");
            setFirstName(first.charAt(0).toUpperCase() + first.slice(1).toLowerCase());
          }
        })
        .catch(() => {});
    }

    loadInitialData();

    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, [currentTenant]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [perfilData, prestacionesData] = await Promise.all([
        getPrestadorPerfil(),
        getMisPrestaciones(currentTenant?.id),
      ]);

      setPerfil(perfilData);
      setPrestaciones(prestacionesData);

      // Si no tiene perfil aún, abrir onboarding modal
      if (!perfilData) {
        setModalPerfilOpen(true);
      }
    } catch (error) {
      console.error("Error loading prestadores data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getMisPrestaciones(currentTenant?.id);
      setPrestaciones(data);
    } finally {
      setRefreshing(false);
    }
  };

  // KPIs Financieros
  const kpis = useMemo(() => {
    const pendiente = prestaciones
      .filter((p) => ["pendiente", "en_revision", "observado"].includes(p.status))
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);

    const cobrado = prestaciones
      .filter((p) => p.status === "pagado")
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);

    const observadasCount = prestaciones.filter((p) => p.status === "observado").length;

    return { pendiente, cobrado, observadasCount };
  }, [prestaciones]);

  // Lista filtrada
  const prestacionesFiltradas = useMemo(() => {
    if (filtroEstado === "todos") return prestaciones;
    if (filtroEstado === "pendientes") {
      return prestaciones.filter((p) =>
        ["pendiente", "en_revision", "observado"].includes(p.status)
      );
    }
    return prestaciones.filter((p) => p.status === filtroEstado);
  }, [prestaciones, filtroEstado]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar currentPage="prestadores" />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <AppSidebar
                  currentPage="prestadores"
                  isMobile={true}
                  onMobileClose={() => setIsMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Portal de Prestadores
              </h1>
              <p className="text-[11px] text-slate-400">
                {currentTenant?.name || "Hub Hospitalario"}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setModalNuevaOpen(true)}
            className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Facturar
          </Button>
        </div>

        {/* Content Container (Mobile-First Optimized) */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Saludo y Configuración */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {firstName ? `¡Hola, ${firstName}!` : "Portal de Prestadores"}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {perfil
                  ? `${PROFESIONES_MAP[perfil.profession]} • MP ${perfil.license_number} • CUIT ${perfil.cuit}`
                  : "Gestiona la liquidación y cobro de tus honorarios profesionales."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalPerfilOpen(true)}
                className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Mis Datos Fiscales
              </Button>

              <Button
                size="sm"
                onClick={() => setModalNuevaOpen(true)}
                className="hidden md:flex h-9 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Presentación
              </Button>
            </div>
          </div>

          {/* Banner si hay presentaciones observadas */}
          {kpis.observadasCount > 0 && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Tienes {kpis.observadasCount}{" "}
                    {kpis.observadasCount === 1 ? "presentación observada" : "presentaciones observadas"}
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    Tesorería solicitó corrección en la documentación. Toca la tarjeta para ver el detalle y corregirla.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KPIs Financieros (Mobile Grid) */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Pendiente de Cobro
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatMoney(kpis.pendiente)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">En proceso de revisión</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Total Cobrado
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(kpis.cobrado)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Liquidaciones abonadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y Lista de Presentaciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Historial de Presentaciones
              </h3>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>

                <div className="flex bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setFiltroEstado("todos")}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      filtroEstado === "todos"
                        ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroEstado("pendientes")}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      filtroEstado === "pendientes"
                        ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    En Curso
                  </button>
                  <button
                    onClick={() => setFiltroEstado("pagado")}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      filtroEstado === "pagado"
                        ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    Pagados
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de Tarjetas */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
                <p className="text-xs text-slate-400">Cargando tus liquidaciones...</p>
              </div>
            ) : prestacionesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No hay presentaciones registradas
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                  Presiona el botón de abajo para enviar tu primera factura de honorarios a Tesorería.
                </p>
                <Button
                  size="sm"
                  onClick={() => setModalNuevaOpen(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Crear Presentación
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {prestacionesFiltradas.map((prestacion) => (
                  <TarjetaPrestacion
                    key={prestacion.id}
                    prestacion={prestacion}
                    onClick={() => setPrestacionSeleccionada(prestacion)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modales de Gestión */}
      <ModalPerfilPrestador
        open={modalPerfilOpen}
        onOpenChange={setModalPerfilOpen}
        perfilActual={perfil}
        onSaved={(nuevoPerfil) => setPerfil(nuevoPerfil)}
        isOnboarding={!perfil}
      />

      {perfil && (
        <ModalNuevaPrestacion
          open={modalNuevaOpen || !!observadaParaEditar}
          onOpenChange={(open) => {
            setModalNuevaOpen(open);
            if (!open) setObservadaParaEditar(null);
          }}
          perfil={perfil}
          tenantId={currentTenant?.id || ""}
          observadaParaReenviar={observadaParaEditar}
          onCreated={(nueva) => {
            setPrestaciones((prev) => {
              const filtradas = prev.filter((p) => p.id !== nueva.id);
              return [nueva, ...filtradas];
            });
            setObservadaParaEditar(null);
          }}
        />
      )}

      <ModalDetallePrestacion
        open={!!prestacionSeleccionada}
        onOpenChange={(open) => {
          if (!open) setPrestacionSeleccionada(null);
        }}
        prestacion={prestacionSeleccionada}
        onEditarObservada={(pres) => {
          setObservadaParaEditar(pres);
        }}
      />
    </div>
  );
}

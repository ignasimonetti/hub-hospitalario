"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getCurrentUser } from "@/lib/auth";
import {
  PrestadorPerfil,
  PrestacionPresentacion,
  PROFESIONES_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  ESTADOS_PRESTACION_CONFIG,
  DIRECTORES_ADJUNTOS_AREAS,
} from "@/types/prestadores";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPrestadorPerfil,
  getMisPrestaciones,
  getTodasLasPrestaciones,
  getDirectoresAdjuntosDisponibles,
  visarMultiplesPrestaciones,
  aprobarMultiplesPrestaciones,
} from "@/lib/services/prestadoresService";
import { ModalPerfilPrestador } from "@/components/prestadores/ModalPerfilPrestador";
import { ModalSeleccionarTipoTramite } from "@/components/prestadores/ModalSeleccionarTipoTramite";
import { ModalNuevaPrestacion } from "@/components/prestadores/ModalNuevaPrestacion";
import { ModalDetallePrestacion } from "@/components/prestadores/ModalDetallePrestacion";
import { ModalAuditoriaDirector } from "@/components/prestadores/ModalAuditoriaDirector";
import { TarjetaPrestacion } from "@/components/prestadores/TarjetaPrestacion";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoles } from "@/hooks/usePermissions";
import { toast } from "sonner";
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
  ShieldCheck,
  Building2,
  UserCheck,
  Search,
  Filter,
  Check,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

export default function PrestadoresPage() {
  const { currentTenant } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");

  // Permisos y Roles
  const { hasRole } = useRoles(currentTenant?.id);
  const isDirector = hasRole("director_coordinador") || hasRole("director_adjunto") || hasRole("director") || hasRole("superadmin");

  // Modo de Vista: "mis_prestaciones" (médico) o "auditoria_direccion" (bandeja de directores)
  const [vistaActiva, setVistaActiva] = useState<"mis_prestaciones" | "auditoria_direccion">("mis_prestaciones");

  // Estado de Datos
  const [perfil, setPerfil] = useState<PrestadorPerfil | null>(null);
  const [misPrestaciones, setMisPrestaciones] = useState<PrestacionPresentacion[]>([]);
  const [todasPrestaciones, setTodasPrestaciones] = useState<PrestacionPresentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroDireccionEstado, setFiltroDireccionEstado] = useState<string>("pendientes");
  const [filtroDirectorId, setFiltroDirectorId] = useState<string>("todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [directoresList, setDirectoresList] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [searchDireccion, setSearchDireccion] = useState<string>("");

  // Selección múltiple y acciones masivas
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Ordenamiento de columnas
  type SortColumn = "form_number" | "prestador" | "servicio" | "periodo" | "monto" | "estado";
  type SortDir = "asc" | "desc";
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDir>("asc");

  // Roles para diferenciar acciones masivas
  const accionEsSoloVisa = hasRole("director_adjunto") && !hasRole("director_coordinador") && !hasRole("superadmin") && !hasRole("admin");

  // Modales
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  const [modalSelectorOpen, setModalSelectorOpen] = useState(false);
  const [tipoTramiteSeleccionado, setTipoTramiteSeleccionado] = useState<"guardia" | "extension_horaria">("guardia");
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [prestacionSeleccionada, setPrestacionSeleccionada] = useState<PrestacionPresentacion | null>(null);
  const [observadaParaEditar, setObservadaParaEditar] = useState<PrestacionPresentacion | null>(null);
  const [prestacionParaAuditar, setPrestacionParaAuditar] = useState<PrestacionPresentacion | null>(null);

  // Sidebar / Navegación
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
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
      const [perfilData, misData, todasData, dirsData] = await Promise.all([
        getPrestadorPerfil(),
        getMisPrestaciones(currentTenant?.id),
        getTodasLasPrestaciones(currentTenant?.id),
        getDirectoresAdjuntosDisponibles(currentTenant?.id),
      ]);

      setPerfil(perfilData);
      setMisPrestaciones(misData);
      setTodasPrestaciones(todasData);
      setDirectoresList(dirsData);

      // Si es director y no tiene prestaciones propias cargadas, por defecto mostrar auditoría
      if (isDirector && misData.length === 0 && todasData.length > 0) {
        setVistaActiva("auditoria_direccion");
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
      const [misData, todasData] = await Promise.all([
        getMisPrestaciones(currentTenant?.id),
        getTodasLasPrestaciones(currentTenant?.id),
      ]);
      setMisPrestaciones(misData);
      setTodasPrestaciones(todasData);
    } finally {
      setRefreshing(false);
    }
  };

  // KPIs Financieros (Mis Prestaciones)
  const kpis = useMemo(() => {
    // Total en Trámite: todo lo presentado que aún no fue pagado y no es borrador
    const pendiente = misPrestaciones
      .filter((p) =>
        [
          "pendiente",
          "en_revision",
          "visado_adjunto",
          "aprobado",
          "observado",
          "observado_tesoreria",
        ].includes(p.status)
      )
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);

    // Cobrado: liquidado y pagado efectivamente
    const cobrado = misPrestaciones
      .filter((p) => p.status === "pagado")
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);

    // Trámites que requieren subsanación/corrección del prestador
    const observadasCount = misPrestaciones.filter(
      (p) => p.status === "observado" || p.status === "observado_tesoreria"
    ).length;

    return { pendiente, cobrado, observadasCount };
  }, [misPrestaciones]);

  // KPIs de Dirección (Auditoría Hospitalaria)
  const kpisDireccion = useMemo(() => {
    const pendientesCount = todasPrestaciones.filter((p) => ["pendiente", "en_revision", "visado_adjunto"].includes(p.status)).length;
    const aprobadasCount = todasPrestaciones.filter((p) => p.status === "aprobado").length;
    const montoPendiente = todasPrestaciones
      .filter((p) => ["pendiente", "en_revision", "visado_adjunto"].includes(p.status))
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);

    return { pendientesCount, aprobadasCount, montoPendiente };
  }, [todasPrestaciones]);

  // Cantidad de borradores
  const borradoresCount = useMemo(() => {
    return misPrestaciones.filter((p) => p.status === "borrador").length;
  }, [misPrestaciones]);

  // Lista filtrada (Mis Prestaciones)
  const misPrestacionesFiltradas = useMemo(() => {
    if (filtroEstado === "todos") return misPrestaciones;
    if (filtroEstado === "borradores") {
      return misPrestaciones.filter((p) => p.status === "borrador");
    }
    if (filtroEstado === "pendientes") {
      return misPrestaciones.filter((p) =>
        ["pendiente", "en_revision", "visado_adjunto"].includes(p.status)
      );
    }
    if (filtroEstado === "observadas") {
      return misPrestaciones.filter((p) =>
        ["observado", "observado_tesoreria"].includes(p.status)
      );
    }
    return misPrestaciones.filter((p) => p.status === filtroEstado);
  }, [misPrestaciones, filtroEstado]);

  // Lista filtrada (Auditoría Dirección)
  const prestacionesDireccionFiltradas = useMemo(() => {
    let result = todasPrestaciones.filter((p) => {
      // Excluir borradores de la bandeja de dirección
      if (p.status === "borrador") return false;

      // Filtro de estado
      if (filtroDireccionEstado === "pendientes" && !["pendiente", "en_revision", "visado_adjunto"].includes(p.status)) {
        return false;
      }
      if (filtroDireccionEstado === "aprobadas" && p.status !== "aprobado") {
        return false;
      }
      if (filtroDireccionEstado === "observadas" && !["observado", "observado_tesoreria"].includes(p.status)) {
        return false;
      }

      // Filtro de Director Adjunto nominal asignado
      if (filtroDirectorId !== "todos" && p.director_adjunto_asignado && p.director_adjunto_asignado !== filtroDirectorId) {
        return false;
      }

      // Filtro por Servicio / Sector
      if (filtroServicio !== "todos") {
        const svc = p.hospital_service || "";
        if (svc !== filtroServicio) return false;
      }

      // Filtro por Período (mes/año)
      if (filtroPeriodo !== "todos") {
        const periodoKey = `${p.period_month}/${p.period_year}`;
        if (periodoKey !== filtroPeriodo) return false;
      }

      // Buscador por nombre, formulario, factura o sector
      if (searchDireccion.trim()) {
        const query = searchDireccion.toLowerCase();
        const userName = `${p.expand?.user?.firstName || ""} ${p.expand?.user?.lastName || ""}`.toLowerCase();
        const formNum = (p.form_number || "").toLowerCase();
        const invoiceNum = (p.invoice_number || "").toLowerCase();
        const sector = (p.hospital_service || "").toLowerCase();
        const sectorLabel = (SECTORES_SERVICIO_MAP[p.hospital_service as SectorServicio] || "").toLowerCase();
        return userName.includes(query) || formNum.includes(query) || invoiceNum.includes(query) || sector.includes(query) || sectorLabel.includes(query);
      }

      return true;
    });

    // Ordenamiento
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        switch (sortColumn) {
          case "form_number":
            valA = a.form_number || "";
            valB = b.form_number || "";
            break;
          case "prestador":
            valA = `${a.expand?.user?.firstName || ""} ${a.expand?.user?.lastName || ""}`.trim().toLowerCase();
            valB = `${b.expand?.user?.firstName || ""} ${b.expand?.user?.lastName || ""}`.trim().toLowerCase();
            break;
          case "servicio":
            valA = (SECTORES_SERVICIO_MAP[a.hospital_service as SectorServicio] || a.hospital_service || "").toLowerCase();
            valB = (SECTORES_SERVICIO_MAP[b.hospital_service as SectorServicio] || b.hospital_service || "").toLowerCase();
            break;
          case "periodo":
            valA = (a.period_year || 0) * 100 + (a.period_month || 0);
            valB = (b.period_year || 0) * 100 + (b.period_month || 0);
            break;
          case "monto":
            valA = a.invoice_amount || 0;
            valB = b.invoice_amount || 0;
            break;
          case "estado":
            valA = a.status;
            valB = b.status;
            break;
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [todasPrestaciones, filtroDireccionEstado, filtroDirectorId, filtroServicio, filtroPeriodo, searchDireccion, sortColumn, sortDirection]);

  // Períodos únicos disponibles para el filtro
  const periodosDisponibles = useMemo(() => {
    const periodos = new Set<string>();
    todasPrestaciones.forEach((p) => {
      if (p.status !== "borrador" && p.period_month && p.period_year) {
        periodos.add(`${p.period_month}/${p.period_year}`);
      }
    });
    return Array.from(periodos).sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return (yB * 100 + mB) - (yA * 100 + mA);
    });
  }, [todasPrestaciones]);

  // Servicios únicos presentes en los datos para el filtro
  const serviciosDisponibles = useMemo(() => {
    const servicios = new Set<string>();
    todasPrestaciones.forEach((p) => {
      if (p.status !== "borrador" && p.hospital_service) {
        servicios.add(p.hospital_service);
      }
    });
    return Array.from(servicios).sort((a, b) => {
      const labelA = SECTORES_SERVICIO_MAP[a as SectorServicio] || a;
      const labelB = SECTORES_SERVICIO_MAP[b as SectorServicio] || b;
      return labelA.localeCompare(labelB);
    });
  }, [todasPrestaciones]);

  // Helpers de selección
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableIds = prestacionesDireccionFiltradas
      .filter((p) => ["pendiente", "en_revision", "visado_adjunto"].includes(p.status))
      .map((p) => p.id);

    if (selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))) {
      // Deseleccionar todos
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Seleccionar todos
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Handler de sort por columna
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // Sort icon helper
  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === "asc"
      ? <ChevronUp className="w-3 h-3 text-slate-600 dark:text-slate-300" />
      : <ChevronDown className="w-3 h-3 text-slate-600 dark:text-slate-300" />;
  };

  // Acción masiva: visar o aprobar las seleccionadas
  const handleBulkAction = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkProcessing(true);

    try {
      const metaFirma = `${firstName || "Director"} (${accionEsSoloVisa ? "Director Adjunto" : "Director Coordinador"})`;

      const resultado = accionEsSoloVisa
        ? await visarMultiplesPrestaciones(ids, metaFirma)
        : await aprobarMultiplesPrestaciones(ids, metaFirma);

      if (resultado.exitosas > 0) {
        toast.success(
          accionEsSoloVisa
            ? `${resultado.exitosas} prestación(es) visada(s) correctamente`
            : `${resultado.exitosas} prestación(es) aprobada(s) y elevada(s) a Tesorería`
        );
      }
      if (resultado.fallidas > 0) {
        toast.error(`${resultado.fallidas} prestación(es) no pudieron procesarse`);
      }

      setSelectedIds(new Set());
      await handleRefresh();
    } catch (err) {
      toast.error("Error al procesar las prestaciones seleccionadas");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Monto total de seleccionadas
  const montoSeleccionado = useMemo(() => {
    return todasPrestaciones
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);
  }, [selectedIds, todasPrestaciones]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return new Date(dateStr).toLocaleDateString("es-AR");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <div className="hidden md:block shrink-0">
        <AppSidebar
          currentPage="prestadores"
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
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
            onClick={() => setModalSelectorOpen(true)}
            className="h-8 px-3 bg-[#08487A] hover:bg-[#053D6C] text-white font-medium text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Presentación
          </Button>
        </div>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Saludo y Selector de Modo (Prestador vs Director) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {firstName ? `¡Hola, ${firstName}!` : "Portal de Prestadores"}
                </h2>
                {isDirector && (
                  <Badge variant="outline" className="bg-sky-50 dark:bg-sky-950 text-[#08487A] dark:text-sky-300 border-sky-300 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Dirección Asistencial
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {perfil
                  ? `${PROFESIONES_MAP[perfil.profession]} • MP ${perfil.license_number} • CUIT ${perfil.cuit}`
                  : "Gestiona la liquidación y cobro de tus honorarios profesionales."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalPerfilOpen(true)}
                className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Mis Datos
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setObservadaParaEditar(null);
                  setModalSelectorOpen(true);
                }}
                className="h-9 px-4 bg-[#08487A] hover:bg-[#06375d] text-white font-medium text-xs rounded-xl shadow-sm transition-all hover:shadow"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Presentación
              </Button>
            </div>
          </div>

          {/* Switch de Vistas para Directores que también son Prestadores */}
          {isDirector && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVistaActiva("auditoria_direccion")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  vistaActiva === "auditoria_direccion"
                    ? "bg-white dark:bg-slate-800 text-[#08487A] dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Bandeja de Autorizaciones de Dirección</span>
                {kpisDireccion.pendientesCount > 0 && (
                  <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                    {kpisDireccion.pendientesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva("mis_prestaciones")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  vistaActiva === "mis_prestaciones"
                    ? "bg-white dark:bg-slate-800 text-[#08487A] dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Mis Presentaciones Personales ({misPrestaciones.length})</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 1: BANDEJA DE AUDITORÍA Y AUTORIZACIÓN DE DIRECCIÓN                */}
          {/* ========================================================================= */}
          {vistaActiva === "auditoria_direccion" && isDirector && (
            <div className="space-y-5 animate-in fade-in-50 duration-300">
              {/* KPIs de Dirección */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Pendientes de Visado</p>
                      <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                        {kpisDireccion.pendientesCount}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Requieren tu firma digital</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Monto a Autorizar</p>
                      <h3 className="text-2xl font-extrabold text-[#08487A] dark:text-sky-400 mt-0.5">
                        {formatMoney(kpisDireccion.montoPendiente)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">En trámites pendientes</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#08487A]/10 text-[#08487A] dark:text-sky-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Aprobadas para Pago</p>
                      <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {kpisDireccion.aprobadasCount}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Elevadas a Tesorería</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="space-y-2.5">
                {/* Fila 1: Tabs de Estado */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => { setFiltroDireccionEstado("pendientes"); setSelectedIds(new Set()); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        filtroDireccionEstado === "pendientes"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Pendientes ({kpisDireccion.pendientesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFiltroDireccionEstado("aprobadas"); setSelectedIds(new Set()); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        filtroDireccionEstado === "aprobadas"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Aprobadas ({kpisDireccion.aprobadasCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFiltroDireccionEstado("todos"); setSelectedIds(new Set()); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        filtroDireccionEstado === "todos"
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Todas ({todasPrestaciones.filter(p => p.status !== "borrador").length})
                    </button>
                  </div>

                  {/* Buscador */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar médico, N° formulario, factura..."
                      value={searchDireccion}
                      onChange={(e) => setSearchDireccion(e.target.value)}
                      className="w-full h-8 pl-8 pr-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    {searchDireccion && (
                      <button
                        type="button"
                        onClick={() => setSearchDireccion("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fila 2: Filtros Avanzados */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>

                  {/* Filtro Servicio */}
                  <Select value={filtroServicio} onValueChange={(v) => { setFiltroServicio(v); setSelectedIds(new Set()); }}>
                    <SelectTrigger className="h-7 text-[11px] w-auto min-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg">
                      <SelectValue placeholder="Servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos" className="text-xs">Todos los Servicios</SelectItem>
                      {serviciosDisponibles.map((svc) => (
                        <SelectItem key={svc} value={svc} className="text-xs">
                          {SECTORES_SERVICIO_MAP[svc as SectorServicio] || svc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro Período */}
                  <Select value={filtroPeriodo} onValueChange={(v) => { setFiltroPeriodo(v); setSelectedIds(new Set()); }}>
                    <SelectTrigger className="h-7 text-[11px] w-auto min-w-[120px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos" className="text-xs">Todos los Períodos</SelectItem>
                      {periodosDisponibles.map((per) => (
                        <SelectItem key={per} value={per} className="text-xs">{per}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro Director Adjunto Asignado */}
                  {directoresList.length > 0 && (
                    <Select value={filtroDirectorId} onValueChange={(v) => { setFiltroDirectorId(v); setSelectedIds(new Set()); }}>
                      <SelectTrigger className="h-7 text-[11px] w-auto min-w-[150px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg">
                        <SelectValue placeholder="Director Asignado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs">Todos los Directores</SelectItem>
                        {directoresList.map((dir) => (
                          <SelectItem key={dir.id} value={dir.id} className="text-xs">
                            {dir.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Limpiar Filtros */}
                  {(filtroServicio !== "todos" || filtroPeriodo !== "todos" || filtroDirectorId !== "todos") && (
                    <button
                      type="button"
                      onClick={() => { setFiltroServicio("todos"); setFiltroPeriodo("todos"); setFiltroDirectorId("todos"); setSelectedIds(new Set()); }}
                      className="h-7 px-2 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Limpiar
                    </button>
                  )}

                  {/* Conteo de resultados */}
                  <span className="ml-auto text-[11px] text-slate-400">
                    {prestacionesDireccionFiltradas.length} resultado{prestacionesDireccionFiltradas.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Tabla de Auditoría */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs relative">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando solicitudes hospitalarias...
                  </div>
                ) : prestacionesDireccionFiltradas.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      No hay solicitudes en esta sección
                    </h4>
                    <p className="text-xs text-slate-400">
                      Todas las presentaciones están al día o no coinciden con los filtros aplicados.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          {/* Checkbox Selección Masiva */}
                          <th className="p-3 w-10">
                            <Checkbox
                              checked={
                                prestacionesDireccionFiltradas
                                  .filter((p) => ["pendiente", "en_revision", "visado_adjunto"].includes(p.status))
                                  .length > 0 &&
                                prestacionesDireccionFiltradas
                                  .filter((p) => ["pendiente", "en_revision", "visado_adjunto"].includes(p.status))
                                  .every((p) => selectedIds.has(p.id))
                              }
                              onCheckedChange={() => toggleSelectAll()}
                              className="data-[state=checked]:bg-[#08487A] data-[state=checked]:border-[#08487A]"
                            />
                          </th>
                          <th className="p-3">
                            <button type="button" onClick={() => handleSort("form_number")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              Formulario <SortIcon col="form_number" />
                            </button>
                          </th>
                          <th className="p-3">
                            <button type="button" onClick={() => handleSort("prestador")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              Prestador <SortIcon col="prestador" />
                            </button>
                          </th>
                          <th className="p-3">
                            <button type="button" onClick={() => handleSort("servicio")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              Servicio <SortIcon col="servicio" />
                            </button>
                          </th>
                          <th className="p-3">
                            <button type="button" onClick={() => handleSort("periodo")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              Período <SortIcon col="periodo" />
                            </button>
                          </th>
                          <th className="p-3 text-right">
                            <button type="button" onClick={() => handleSort("monto")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-auto">
                              Monto <SortIcon col="monto" />
                            </button>
                          </th>
                          <th className="p-3 text-center">
                            <button type="button" onClick={() => handleSort("estado")} className="flex items-center gap-1.5 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors mx-auto">
                              Estado <SortIcon col="estado" />
                            </button>
                          </th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {prestacionesDireccionFiltradas.map((p) => {
                          const nombre = p.expand?.user
                            ? `${p.expand.user.firstName || ""} ${p.expand.user.lastName || ""}`.trim() || p.expand.user.email
                            : "Prestador Asistencial";
                          const stCfg = ESTADOS_PRESTACION_CONFIG[p.status];
                          const isSelectable = ["pendiente", "en_revision", "visado_adjunto"].includes(p.status);
                          const isSelected = selectedIds.has(p.id);

                          return (
                            <tr
                              key={p.id}
                              className={`group transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-sky-50/60 dark:bg-sky-950/20"
                                  : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                              }`}
                              onClick={() => setPrestacionParaAuditar(p)}
                            >
                              {/* Checkbox */}
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                {isSelectable ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(p.id)}
                                    className="data-[state=checked]:bg-[#08487A] data-[state=checked]:border-[#08487A]"
                                  />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 text-[11px]">
                                {p.form_number || "—"}
                              </td>
                              <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                {nombre}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {p.hospital_service
                                  ? (SECTORES_SERVICIO_MAP[p.hospital_service as SectorServicio] || p.hospital_service)
                                  : "Guardia Central"}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 tabular-nums">
                                {p.period_month}/{p.period_year}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {formatMoney(p.invoice_amount || 0)}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${stCfg.bgLight} ${stCfg.textDark}`}>
                                  {stCfg.label}
                                </span>
                              </td>
                              {/* Ícono Ojo */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPrestacionParaAuditar(p);
                                  }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Ver detalle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Barra flotante de Acciones Masivas */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="sticky bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({formatMoney(montoSeleccionado)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedIds(new Set())}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                          Deseleccionar
                        </button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={bulkProcessing}
                        onClick={handleBulkAction}
                        className={`text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 ${
                          accionEsSoloVisa
                            ? "bg-violet-600 hover:bg-violet-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {bulkProcessing ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {accionEsSoloVisa
                              ? `Visar ${selectedIds.size > 1 ? `${selectedIds.size} seleccionadas` : "seleccionada"}`
                              : `Aprobar ${selectedIds.size > 1 ? `${selectedIds.size} seleccionadas` : "seleccionada"}`}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 2: MIS PRESENTACIONES PERSONALES                                   */}
          {/* ========================================================================= */}
          {vistaActiva === "mis_prestaciones" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* KPIs de Prestador */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Pendiente */}
                <Card
                  onClick={() => setFiltroEstado("pendientes")}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroEstado === "pendientes"
                      ? "ring-2 ring-amber-500 border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total en Trámite</p>
                      <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatMoney(kpis.pendiente)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pendiente de pago</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Cobrado */}
                <Card
                  onClick={() => setFiltroEstado("pagado")}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroEstado === "pagado"
                      ? "ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Cobrado este Período</p>
                      <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatMoney(kpis.cobrado)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Liquidado por Tesorería</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Observaciones */}
                <Card
                  onClick={() => setFiltroEstado("observadas")}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroEstado === "observadas"
                      ? "ring-2 ring-rose-500 border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Observadas</p>
                      <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                        {kpis.observadasCount}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Requieren corrección</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setFiltroEstado("todos")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      filtroEstado === "todos"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Todas ({misPrestaciones.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEstado("borradores")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      filtroEstado === "borradores"
                        ? "bg-slate-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Borradores ({borradoresCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEstado("pendientes")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      filtroEstado === "pendientes"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    En Trámite
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEstado("aprobado")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      filtroEstado === "aprobado"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Aprobadas
                  </button>

                  {kpis.observadasCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroEstado("observadas")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        filtroEstado === "observadas"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      }`}
                    >
                      <span>Observadas</span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        filtroEstado === "observadas" ? "bg-white text-rose-600" : "bg-rose-100 text-rose-700"
                      }`}>
                        {kpis.observadasCount}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setFiltroEstado("pagado")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      filtroEstado === "pagado"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Pagadas
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 text-slate-400 hover:text-slate-600 shrink-0"
                  title="Actualizar datos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Lista de Tarjetas */}
              {loading ? (
                <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Cargando tus prestaciones...
                </div>
              ) : misPrestacionesFiltradas.length === 0 ? (
                <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No hay presentaciones en este estado
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Iniciá una nueva solicitud de guardias o extensión horaria presionando el botón superior.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setModalSelectorOpen(true)}
                    className="h-8 px-3 bg-[#08487A] hover:bg-[#06375d] text-white text-xs rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Crear Solicitud
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {misPrestacionesFiltradas.map((p) => (
                    <TarjetaPrestacion
                      key={p.id}
                      prestacion={p}
                      onClick={() => setPrestacionSeleccionada(p)}
                      
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modales del Sistema */}
      <ModalPerfilPrestador
        open={modalPerfilOpen}
        onOpenChange={setModalPerfilOpen}
        perfilActual={perfil}
        onSaved={(nuevo) => setPerfil(nuevo)}
      />

      <ModalSeleccionarTipoTramite
        open={modalSelectorOpen}
        onOpenChange={setModalSelectorOpen}
        onSelectTipo={(tipo) => {
          setTipoTramiteSeleccionado(tipo);
          setModalSelectorOpen(false);
          setModalNuevaOpen(true);
        }}
      />

      {perfil && (
        <ModalNuevaPrestacion
          open={modalNuevaOpen}
          onOpenChange={setModalNuevaOpen}
          tipoInicial={tipoTramiteSeleccionado}
          perfil={perfil}
          tenantId={currentTenant?.id || ""}
          tenantCode={currentTenant?.code || "CISB"}
          observadaParaReenviar={observadaParaEditar}
          onCreated={() => {
            setModalNuevaOpen(false);
            setObservadaParaEditar(null);
            handleRefresh();
          }}
        />
      )}

      {prestacionSeleccionada && (
        <ModalDetallePrestacion
          open={!!prestacionSeleccionada}
          onOpenChange={(open) => !open && setPrestacionSeleccionada(null)}
          prestacion={prestacionSeleccionada}
          perfil={perfil}
          onEliminarBorrador={(id) => {
            setMisPrestaciones((prev) => prev.filter((p) => p.id !== id));
            setTodasPrestaciones((prev) => prev.filter((p) => p.id !== id));
            setPrestacionSeleccionada(null);
          }}
          onRetomarBorrador={(borrador) => {
            setPrestacionSeleccionada(null);
            setObservadaParaEditar(borrador);
            setTipoTramiteSeleccionado(borrador.service_type as "guardia" | "extension_horaria");
            setModalNuevaOpen(true);
          }}
          onEditarObservada={(observada) => {
            setPrestacionSeleccionada(null);
            setObservadaParaEditar(observada);
            setTipoTramiteSeleccionado(observada.service_type as "guardia" | "extension_horaria");
            setModalNuevaOpen(true);
          }}
        />
      )}

      {/* Modal Auditoría para Directores */}
      {prestacionParaAuditar && (
        <ModalAuditoriaDirector
          open={!!prestacionParaAuditar}
          onOpenChange={(open) => !open && setPrestacionParaAuditar(null)}
          prestacion={prestacionParaAuditar}
          currentUserName={firstName || "Director Asistencial"}
          onActualizado={(actualizada) => {
            setTodasPrestaciones((prev) =>
              prev.map((p) => (p.id === actualizada.id ? actualizada : p))
            );
            setMisPrestaciones((prev) =>
              prev.map((p) => (p.id === actualizada.id ? actualizada : p))
            );
            setPrestacionParaAuditar(null);
          }}
        />
      )}
    </div>
  );
}

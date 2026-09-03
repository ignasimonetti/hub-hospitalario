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
  getDirectoresAdjuntosDisponibles,
  visarMultiplesPrestaciones,
  aprobarMultiplesPrestaciones,
  getMisPrestacionesPaginadas,
  getTodasPrestacionesPaginadas,
  getMisKpisLivianos,
  getDireccionKpisLivianos,
  type PrestacionPageResult,
  type ProyeccionKpisPrestaciones,
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
  History,
  FileEdit,
  Stethoscope,
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
  const [totalActivos, setTotalActivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  // Tabs del listado del prestador: activos (cards) vs historial (tabla)
  const [tabListado, setTabListado] = useState<"activos" | "historial">("activos");

  // Helper para evitar narrowing de TypeScript en JSX
  const isTabActivos = tabListado === "activos";
  const isTabHistorial = tabListado === "historial";
  const [misActivos, setMisActivos] = useState<PrestacionPresentacion[]>([]);
  const [historialData, setHistorialData] = useState<PrestacionPageResult>({
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 1,
    perPage: 25,
  });
  const [histPage, setHistPage] = useState(1);
  const [histAnio, setHistAnio] = useState<string>("todos");
  const [histEstado, setHistEstado] = useState<"todos" | "aprobado" | "pagado">("todos");
  const [kpisLivianos, setKpisLivianos] = useState<ProyeccionKpisPrestaciones | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }

    const handleSidebarToggle = () => {
      const state = localStorage.getItem("sidebar-collapsed");
      if (state !== null) {
        setSidebarCollapsed(JSON.parse(state));
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Bandeja de Dirección (server-driven)
  const [dirData, setDirData] = useState<PrestacionPageResult>({
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 1,
    perPage: 25,
  });
  const [dirPage, setDirPage] = useState(1);
  const [kpisDireccionData, setKpisDireccionData] = useState<ProyeccionKpisPrestaciones | null>(null);

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

  // Bandeja Dirección: recargar al cambiar filtros server-side
  useEffect(() => {
    if (loading) return;
    setSelectedIds(new Set());
    cargarBandejaDireccion(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroDireccionEstado, filtroDirectorId, filtroServicio, filtroPeriodo]);

  // Ordenamiento server-side (solo columnas directas de PB)
  const serverSortKey =
    sortColumn && ["form_number", "monto", "periodo"].includes(sortColumn)
      ? `${sortColumn}:${sortDirection}`
      : null;
  useEffect(() => {
    if (loading) return;
    if (!serverSortKey) return;
    setSelectedIds(new Set());
    cargarBandejaDireccion(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSortKey]);

  // Búsqueda con debounce (350ms)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      setSelectedIds(new Set());
      cargarBandejaDireccion(1, { search: searchDireccion });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDireccion]);

  const cargarBandejaDireccion = async (
    page = dirPage,
    overrides?: {
      estado?: string;
      directorId?: string;
      servicio?: string;
      periodo?: string;
      search?: string;
    }
  ) => {
    const estado = overrides?.estado ?? filtroDireccionEstado;
    const directorId = overrides?.directorId ?? filtroDirectorId;
    const servicio = overrides?.servicio ?? filtroServicio;
    const periodo = overrides?.periodo ?? filtroPeriodo;
    const search = overrides?.search ?? searchDireccion;

    // Grupo de estados según filtro de bandeja
    let grupo: "pendientes" | "aprobado" | "observadas" | undefined;
    if (estado === "pendientes") grupo = "pendientes";
    else if (estado === "aprobadas") grupo = "aprobado";
    else if (estado === "observadas") grupo = "observadas";

    // Ordenamiento server-side cuando el campo es columna directa de PB
    let sort = "-created";
    const dir = sortDirection === "asc" ? "" : "-";
    if (sortColumn === "form_number") sort = `${dir}form_number`;
    else if (sortColumn === "monto") sort = `${dir}invoice_amount`;
    else if (sortColumn === "periodo")
      sort = `${dir}period_year,${dir}period_month`;

    const [mes, anio] =
      periodo !== "todos" ? periodo.split("/") : [undefined, undefined];

    const res = await getTodasPrestacionesPaginadas({
      tenantId: currentTenant?.id,
      grupo,
      page,
      perPage: 25,
      sort,
      search: search.trim() || undefined,
      servicio: servicio !== "todos" ? servicio : undefined,
      periodoMes: mes ? Number(mes) : undefined,
      periodoAnio: anio ? Number(anio) : undefined,
      directorId: directorId !== "todos" ? directorId : undefined,
    });

    setDirData(res);
    setDirPage(res.page);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [perfilData, kpis, activosPage, historialPage, dirsData, kpisDir] =
        await Promise.all([
          getPrestadorPerfil(),
          getMisKpisLivianos(currentTenant?.id),
          getMisPrestacionesPaginadas({ tenantId: currentTenant?.id, grupo: "activos", perPage: 50 }),
          getMisPrestacionesPaginadas({ tenantId: currentTenant?.id, grupo: "historial", page: histPage }),
          getDirectoresAdjuntosDisponibles(currentTenant?.id),
          getDireccionKpisLivianos(currentTenant?.id),
        ]);

      setPerfil(perfilData);
      setKpisLivianos(kpis);
      setMisActivos(activosPage.items);
      setTotalActivos(activosPage.totalItems);
      setHistorialData(historialPage);
      setDirectoresList(dirsData);
      setKpisDireccionData(kpisDir);

      // Bandeja de dirección server-driven
      await cargarBandejaDireccion(1);

      // Si es director y no tiene prestaciones propias cargadas, por defecto mostrar auditoría
      if (
        isDirector &&
        activosPage.totalItems === 0 &&
        historialPage.totalItems === 0 &&
        kpisDir.totalRecords > 0
      ) {
        setVistaActiva("auditoria_direccion");
      }
    } catch (error) {
      console.error("Error loading prestadores data:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarListadoPrestador = async (
    tab: "activos" | "historial" = tabListado,
    page = tab === "historial" ? histPage : 1
  ) => {
    if (tab === "activos") {
      const res = await getMisPrestacionesPaginadas({
        tenantId: currentTenant?.id,
        grupo: "activos",
        perPage: 50,
      });
      setMisActivos(res.items);
      setTotalActivos(res.totalItems);
      const kpis = await getMisKpisLivianos(currentTenant?.id);
      setKpisLivianos(kpis);
    } else {
      const res = await getMisPrestacionesPaginadas({
        tenantId: currentTenant?.id,
        grupo: "historial",
        page,
        periodoAnio: histAnio !== "todos" ? Number(histAnio) : undefined,
      });
      setHistorialData(res);
      setHistPage(res.page);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [kpis, kpisDir] = await Promise.all([
        getMisKpisLivianos(currentTenant?.id),
        getDireccionKpisLivianos(currentTenant?.id),
        cargarListadoPrestador(),
      ]);
      setKpisLivianos(kpis);
      setKpisDireccionData(kpisDir);
      await cargarBandejaDireccion(dirPage);
    } finally {
      setRefreshing(false);
    }
  };

  // KPIs Financieros (Mis Prestaciones) — desde proyección liviana (sin payloads pesados)
  const kpis = useMemo(() => {
    const suma = kpisLivianos?.sumaPorEstado || {};
    const conteo = kpisLivianos?.conteoPorEstado || {};
    // Trámites en curso: todos los estados activos sin aprobar/pagar
    const enTramiteEstados = [
      "pendiente",
      "en_revision",
      "visado_adjunto",
      "observado",
      "observado_tesoreria",
    ];
    const pendiente = enTramiteEstados.reduce((sum, st) => sum + (suma[st] || 0), 0);
    const cobrado = suma["pagado"] || 0;
    const observadasCount =
      (conteo["observado"] || 0) + (conteo["observado_tesoreria"] || 0);
    return { pendiente, cobrado, observadasCount };
  }, [kpisLivianos]);

  // KPIs de Dirección (desde proyección liviana)
  const kpisDireccion = useMemo(() => {
    const conteo = kpisDireccionData?.conteoPorEstado || {};
    const suma = kpisDireccionData?.sumaPorEstado || {};
    const estadosTramite = ["pendiente", "en_revision", "visado_adjunto"];
    const pendientesCount = estadosTramite.reduce((s, st) => s + (conteo[st] || 0), 0);
    const aprobadasCount = conteo["aprobado"] || 0;
    const montoPendiente = estadosTramite.reduce((s, st) => s + (suma[st] || 0), 0);
    return { pendientesCount, aprobadasCount, montoPendiente };
  }, [kpisDireccionData]);

  // Cantidad de borradores (global, desde proyección liviana)
  const borradoresCount = kpisLivianos?.conteoPorEstado?.["borrador"] || 0;

  // Lista de Activos refinada client-side (ya viene server-filtrada, ≤50 items)
  const misPrestacionesFiltradas = useMemo(() => {
    if (filtroEstado === "borradores")
      return misActivos.filter((p) => p.status === "borrador");
    if (filtroEstado === "pendientes")
      return misActivos.filter((p) =>
        ["pendiente", "en_revision", "visado_adjunto", "observado", "observado_tesoreria"].includes(p.status)
      );
    if (filtroEstado === "observadas")
      return misActivos.filter((p) =>
        ["observado", "observado_tesoreria"].includes(p.status)
      );
    return misActivos;
  }, [misActivos, filtroEstado]);

  // Filas del Historial: filtro de estado aplicado sobre la página actual
  const historialFilas = useMemo(() => {
    if (histEstado === "todos") return historialData.items;
    return historialData.items.filter((p) => p.status === histEstado);
  }, [historialData.items, histEstado]);

  // Lista de la bandeja de Dirección: ya viene filtrada/paginada desde PocketBase.
  // Orden client-side residual solo para columnas no ordenables server-side (prestador, servicio, estado).
  const prestacionesDireccionFiltradas = useMemo(() => {
    if (!sortColumn || ["form_number", "periodo", "monto"].includes(sortColumn)) {
      return dirData.items;
    }
    const items = [...dirData.items];
    const dir = sortDirection === "asc" ? 1 : -1;
    items.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      switch (sortColumn) {
        case "prestador":
          valA = `${a.expand?.user?.lastName || ""} ${a.expand?.user?.firstName || ""}`.trim().toLowerCase();
          valB = `${b.expand?.user?.lastName || ""} ${b.expand?.user?.firstName || ""}`.trim().toLowerCase();
          break;
        case "servicio":
          valA = (SECTORES_SERVICIO_MAP[a.hospital_service as SectorServicio] || a.hospital_service || "").toLowerCase();
          valB = (SECTORES_SERVICIO_MAP[b.hospital_service as SectorServicio] || b.hospital_service || "").toLowerCase();
          break;
        case "estado":
          valA = a.status;
          valB = b.status;
          break;
      }
      if (typeof valA === "number" && typeof valB === "number") return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB)) * dir;
    });
    return items;
  }, [dirData.items, sortColumn, sortDirection]);

  // Períodos únicos disponibles (desde proyección liviana)
  const periodosDisponibles = kpisDireccionData?.periodos || [];

  // Servicios únicos presentes en los datos (ordenados por etiqueta)
  const serviciosDisponibles = useMemo(() => {
    return [...(kpisDireccionData?.servicios || [])].sort((a, b) => {
      const labelA = SECTORES_SERVICIO_MAP[a as SectorServicio] || a;
      const labelB = SECTORES_SERVICIO_MAP[b as SectorServicio] || b;
      return labelA.localeCompare(labelB);
    });
  }, [kpisDireccionData]);

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

  // Monto total de seleccionadas (sobre la página visible de la bandeja)
  const montoSeleccionado = useMemo(() => {
    return dirData.items
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + (p.invoice_amount || 0), 0);
  }, [selectedIds, dirData.items]);

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

  // Validación previa de Conducta Fiscal antes de iniciar carga
  const handleIniciarNuevaPresentacion = () => {
    if (!perfil) {
      setModalPerfilOpen(true);
      return;
    }

    if (!perfil.file_conducta_fiscal || !perfil.conducta_fiscal_due_date) {
      toast.error("Falta tu Constancia de Conducta Fiscal", {
        description: "Debes adjuntar la constancia DGR vigente en tu perfil para iniciar liquidaciones.",
        action: {
          label: "Actualizar en Mis Datos",
          onClick: () => setModalPerfilOpen(true),
        },
        duration: 8000,
      });
      return;
    }

    const dateOnly = perfil.conducta_fiscal_due_date.split(" ")[0].split("T")[0];
    const parts = dateOnly.split("-");
    if (parts.length === 3) {
      const dueDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!isNaN(dueDate.getTime()) && dueDate.getTime() < today.getTime()) {
        const formattedDue = `${parts[2]}/${parts[1]}/${parts[0]}`;
        toast.error(`Conducta Fiscal Vencida (${formattedDue})`, {
          description: "Tu constancia DGR ha caducado. Actualízala en tu perfil para poder liquidar.",
          action: {
            label: "Actualizar en Mis Datos",
            onClick: () => setModalPerfilOpen(true),
          },
          duration: 8000,
        });
        return;
      }
    }

    setObservadaParaEditar(null);
    setModalSelectorOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f6f5f4] dark:bg-[#191919]">
      {/* Sidebar Desktop */}
      <div className="hidden md:block shrink-0">
        <AppSidebar
          currentPage="prestadores"
        />
      </div>

      {/* Main Area con offset responsive para no encimarse con el Sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${sidebarCollapsed ? "md:pl-16" : "md:pl-64"}`}>
        {/* Header Superior Consistente */}
        <header className="h-14 border-b border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/90 dark:bg-[#191919]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                    <Menu className="h-4 w-4" />
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
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#0075de]/15 dark:bg-[#0075de]/20 rounded-md text-[#0075de]">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#000000] dark:text-white tracking-[-0.02em]">
                  Portal de Prestadores
                </h1>
                <p className="text-[11px] text-[#615d59] dark:text-[#a39e98] hidden sm:block">
                  {vistaActiva === "auditoria_direccion"
                    ? "Bandeja de Auditorías & Autorizaciones"
                    : "Mis Honorarios y Asistencias"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Saludo y Selector de Modo (Prestador vs Director) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-[#000000] dark:text-white tracking-[-0.03em]">
                  {firstName ? `¡Hola, ${firstName}!` : "Portal de Prestadores"}
                </h2>
                {isDirector && (
                  <Badge variant="outline" className="bg-[#62aef0]/15 dark:bg-[#62aef0]/20 text-[#0075de] dark:text-sky-300 border-[#62aef0]/40 font-medium text-[11px] rounded-md px-2 py-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Dirección Asistencial
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-[#615d59] dark:text-[#a39e98] mt-0.5">
                {perfil
                  ? `${PROFESIONES_MAP[perfil.profession] || perfil.profession} • MP ${perfil.license_number} • CUIT ${perfil.cuit}`
                  : "Gestiona la liquidación y cobro de tus honorarios profesionales."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalPerfilOpen(true)}
                className="h-9 text-xs"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-[#615d59]" />
                Mis Datos
              </Button>

              <Button
                size="sm"
                onClick={handleIniciarNuevaPresentacion}
                className="h-9 px-4 text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Presentación
              </Button>
            </div>
          </div>

          {/* Switch de Vistas para Directores que también son Prestadores */}
          {isDirector && (
            <div className="flex items-center gap-1.5 p-1 bg-[#eae8e6] dark:bg-[#262626] rounded-lg border border-[#e6e6e6] dark:border-[#383838]">
              <button
                type="button"
                onClick={() => setVistaActiva("auditoria_direccion")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  vistaActiva === "auditoria_direccion"
                    ? "bg-white dark:bg-[#333333] text-[#000000] dark:text-white shadow-xs border border-[#e6e6e6] dark:border-transparent"
                    : "text-[#615d59] hover:text-[#000000] dark:text-[#a39e98] dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#0075de]" />
                <span>Bandeja de Autorizaciones de Dirección</span>
                {kpisDireccion.pendientesCount > 0 && (
                  <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-[#dd5b00] text-white">
                    {kpisDireccion.pendientesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva("mis_prestaciones")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  vistaActiva === "mis_prestaciones"
                    ? "bg-white dark:bg-[#333333] text-[#000000] dark:text-white shadow-xs border border-[#e6e6e6] dark:border-transparent"
                    : "text-[#615d59] hover:text-[#000000] dark:text-[#a39e98] dark:hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#1aae39]" />
                <span>Mis Presentaciones Personales ({totalActivos})</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 1: BANDEJA DE AUDITORÍA Y AUTORIZACIÓN DE DIRECCIÓN                */}
          {/* ========================================================================= */}
          {vistaActiva === "auditoria_direccion" && isDirector && (
            <div className="space-y-5 animate-in fade-in-50 duration-300">
              {/* KPIs de Dirección - clickeables para consistencia con Mis Presentaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  onClick={() => { setFiltroDireccionEstado("pendientes"); setSelectedIds(new Set()); }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroDireccionEstado === "pendientes"
                      ? "ring-2 ring-amber-500 border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
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

                <Card
                  onClick={() => { setFiltroDireccionEstado("pendientes"); setSelectedIds(new Set()); }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroDireccionEstado === "pendientes"
                      ? "ring-2 ring-[#08487A] border-[#08487A]/40 dark:border-[#08487A]/60 bg-[#08487A]/5 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
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

                <Card
                  onClick={() => { setFiltroDireccionEstado("aprobadas"); setSelectedIds(new Set()); }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    filtroDireccionEstado === "aprobadas"
                      ? "ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
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
                      Todas ({kpisDireccionData?.totalRecords ?? 0})
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
                    {dirData.totalItems} resultado{dirData.totalItems !== 1 ? "s" : ""}
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
                  <>
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

                  {/* Paginación Bandeja Dirección */}
                  {dirData.totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400">
                        Página {dirData.page} de {dirData.totalPages} •{" "}
                        {dirData.totalItems} registros
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={dirData.page <= 1}
                          onClick={() => cargarBandejaDireccion(dirData.page - 1)}
                          className="h-7 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ‹ Anterior
                        </button>
                        {(() => {
                          const total = dirData.totalPages;
                          const cur = dirData.page;
                          const start = Math.max(1, Math.min(cur - 2, total - 4));
                          const end = Math.min(total, start + 4);
                          const paginas = [];
                          for (let i = start; i <= end; i++) paginas.push(i);
                          return paginas.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => cargarBandejaDireccion(n)}
                              className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                                n === cur
                                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {n}
                            </button>
                          ));
                        })()}
                        <button
                          type="button"
                          disabled={dirData.page >= dirData.totalPages}
                          onClick={() => cargarBandejaDireccion(dirData.page + 1)}
                          className="h-7 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Siguiente ›
                        </button>
                      </div>
                    </div>
                  )}
                  </>
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
                  onClick={() => {
                    setTabListado("activos");
                    setFiltroEstado("pendientes");
                  }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    tabListado === "activos" && filtroEstado === "pendientes"
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

                {/* 2. Borradores */}
                <Card
                  onClick={() => {
                    setTabListado("activos");
                    setFiltroEstado("borradores");
                  }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    tabListado === "activos" && filtroEstado === "borradores"
                      ? "ring-2 ring-slate-600 border-slate-400 dark:border-slate-600 bg-slate-100/60 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Borradores</p>
                      <h3 className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
                        {borradoresCount}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pendientes de envío</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                      <FileEdit className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Observaciones */}
                <Card
                  onClick={() => {
                    setTabListado("activos");
                    setFiltroEstado("observadas");
                  }}
                  className={`border transition-all rounded-2xl cursor-pointer hover:shadow-md ${
                    tabListado === "activos" && filtroEstado === "observadas"
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

              {/* Tabs principales simplificados: En Curso | Historial */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => { setTabListado("activos"); setFiltroEstado("todos"); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      tabListado === "activos"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    En Curso ({totalActivos})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabListado("historial")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      tabListado === "historial"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Historial ({historialData.totalItems})
                  </button>

                  {tabListado === "historial" && (
                    <>
                      <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

                      <Select
                        value={histAnio}
                        onValueChange={(v) => {
                          setHistAnio(v);
                          setHistPage(1);
                          getMisPrestacionesPaginadas({
                            tenantId: currentTenant?.id,
                            grupo: "historial",
                            page: 1,
                            periodoAnio: v !== "todos" ? Number(v) : undefined,
                          }).then(setHistorialData);
                        }}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos" className="text-xs">Todos los años</SelectItem>
                          {(kpisLivianos?.anios || []).map((a) => (
                            <SelectItem key={a} value={String(a)} className="text-xs">{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={histEstado}
                        onValueChange={(v) => setHistEstado(v as "todos" | "aprobado" | "pagado")}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                          <SelectItem value="aprobado" className="text-xs">Aprobadas</SelectItem>
                          <SelectItem value="pagado" className="text-xs">Pagadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>

{/* Breadcrumb / Estado actual - orientación visual */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {isTabActivos ? "En Curso" : "Historial"}
                  </span>
                  {isTabActivos && filtroEstado !== "todos" && (
                    <>
                      <span>/</span>
                      <span className="font-medium capitalize text-slate-600 dark:text-slate-300">
                        {filtroEstado === "borradores" && "Borradores"}
                        {filtroEstado === "pendientes" && "En Trámite"}
                        {filtroEstado === "observadas" && "Observadas"}
                      </span>
                    </>
                  )}
                  {isTabHistorial && (
                    <>
                      {histAnio !== "todos" && (
                        <>
                          <span>/</span>
                          <span className="font-medium capitalize text-slate-600 dark:text-slate-300">
                            {histAnio}
                          </span>
                        </>
                      )}
                      {histEstado !== "todos" && (
                        <>
                          <span>/</span>
                          <span className="font-medium capitalize text-slate-600 dark:text-slate-300">
                            {histEstado === "aprobado" ? "Aprobadas" : "Pagadas"}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </span>
                {(isTabActivos && filtroEstado !== "todos") || (isTabHistorial && (histAnio !== "todos" || histEstado !== "todos")) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isTabActivos) setFiltroEstado("todos");
                      else { setHistAnio("todos"); setHistEstado("todos"); setHistPage(1); getMisPrestacionesPaginadas({ tenantId: currentTenant?.id, grupo: "historial", page: 1 }).then(setHistorialData); }
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Limpiar filtros"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Contenido según tab */}
              {loading ? (
                <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Cargando tus prestaciones...
                </div>
              ) : tabListado === "activos" ? (
                misPrestacionesFiltradas.length === 0 ? (
                  <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      No hay trámites activos en este filtro
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Iniciá una nueva solicitud de guardias o extensión horaria presionando el botón superior.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleIniciarNuevaPresentacion}
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
                )
              ) : historialFilas.length === 0 ? (
                <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50 space-y-2">
                  <History className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Sin resultados en el Historial
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Probá cambiando el año o el estado. Las presentaciones aprobadas y pagadas se archivan aquí.
                  </p>
                </div>
              ) : (
                <>
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Trámite</th>
                            <th className="py-2.5 px-3">Período</th>
                            <th className="py-2.5 px-3">Factura</th>
                            <th className="py-2.5 px-3">Tipo</th>
                            <th className="py-2.5 px-3 text-right">Monto</th>
                            <th className="py-2.5 px-3 text-center">Estado</th>
                            <th className="py-2.5 px-3">Fecha de Pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {historialFilas.map((p) => {
                            const cfg = ESTADOS_PRESTACION_CONFIG[p.status];
                            
                            // Formateo seguro de fecha
                            const rawFecha = p.paid_at || p.treasury_paid_at;
                            let fechaPagoDisplay = "—";
                            if (rawFecha) {
                              try {
                                const d = new Date(rawFecha);
                                if (!isNaN(d.getTime())) {
                                  fechaPagoDisplay = d.toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  });
                                }
                              } catch {
                                fechaPagoDisplay = String(rawFecha).split(" ")[0];
                              }
                            }

                            return (
                              <tr
                                key={p.id}
                                onClick={() => setPrestacionSeleccionada(p)}
                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                              >
                                <td className="py-2.5 px-3 font-mono font-semibold text-gray-800 dark:text-slate-200">
                                  {p.form_number || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 dark:text-slate-400">
                                  {String(p.period_month).padStart(2, "0")}/{p.period_year}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {p.invoice_number || "—"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 dark:text-slate-400">
                                  {p.service_type === "guardia" ? "Guardias (G)" : "Extensión Horaria (EH)"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800 dark:text-slate-200">
                                  {formatMoney(p.invoice_amount)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg?.bgLight || "bg-slate-100 border-slate-200"} ${cfg?.textDark || "text-slate-600"}`}
                                  >
                                    {cfg?.label || p.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-slate-300">
                                  {fechaPagoDisplay}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Paginación */}
                  {historialData.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">
                        Página {historialData.page} de {historialData.totalPages} •{" "}
                        {historialData.totalItems} registros
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={historialData.page <= 1}
                          onClick={() => {
                            const target = historialData.page - 1;
                            setHistPage(target);
                            getMisPrestacionesPaginadas({
                              tenantId: currentTenant?.id,
                              grupo: "historial",
                              page: target,
                              periodoAnio: histAnio !== "todos" ? Number(histAnio) : undefined,
                            }).then(setHistorialData);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ‹ Anterior
                        </button>

                        {(() => {
                          const total = historialData.totalPages;
                          const cur = historialData.page;
                          const start = Math.max(1, Math.min(cur - 2, total - 4));
                          const end = Math.min(total, start + 4);
                          const paginas = [];
                          for (let i = start; i <= end; i++) paginas.push(i);
                          return paginas.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                setHistPage(n);
                                getMisPrestacionesPaginadas({
                                  tenantId: currentTenant?.id,
                                  grupo: "historial",
                                  page: n,
                                  periodoAnio: histAnio !== "todos" ? Number(histAnio) : undefined,
                                }).then(setHistorialData);
                              }}
                              className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                                n === cur
                                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {n}
                            </button>
                          ));
                        })()}

                        <button
                          type="button"
                          disabled={historialData.page >= historialData.totalPages}
                          onClick={() => {
                            const target = historialData.page + 1;
                            setHistPage(target);
                            getMisPrestacionesPaginadas({
                              tenantId: currentTenant?.id,
                              grupo: "historial",
                              page: target,
                              periodoAnio: histAnio !== "todos" ? Number(histAnio) : undefined,
                            }).then(setHistorialData);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Siguiente ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
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
          onOpenPerfil={() => setModalPerfilOpen(true)}
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
            setMisActivos((prev) => prev.filter((p) => p.id !== id));
            getMisKpisLivianos(currentTenant?.id).then(setKpisLivianos);
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
            setMisActivos((prev) =>
              prev.map((p) => (p.id === actualizada.id ? actualizada : p))
            );
            setHistorialData((prev) => ({
              ...prev,
              items: prev.items.map((p) =>
                p.id === actualizada.id ? actualizada : p
              ),
            }));
            getMisKpisLivianos(currentTenant?.id).then(setKpisLivianos);
            getDireccionKpisLivianos(currentTenant?.id).then(setKpisDireccionData);
            cargarBandejaDireccion(dirPage);
            setPrestacionParaAuditar(null);
          }}
        />
      )}
    </div>
  );
}

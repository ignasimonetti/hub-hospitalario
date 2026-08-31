"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getCurrentUser } from "@/lib/auth";
import {
  PrestacionTesoreriaItem,
  LoteTesoreria,
  RegistrarPagoPayload,
  LiquidarLotePayload,
  CrearLotePayload,
  ObservarFiscalPayload,
  ESTADOS_LOTE_CONFIG,
} from "@/types/tesoreria";
import {
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  ESTADOS_PRESTACION_CONFIG,
  FormularioDigitalData,
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import { getPrestadoresConfig } from "@/lib/services/parametersService";
import {
  getPrestacionesParaTesoreria,
  getLotesTesoreria,
  crearLoteTesoreria,
  agregarPrestacionesALote,
  ESTADOS_LOTE_ABIERTO,
  registrarPagoLiquidacion,
  liquidarLotePrestaciones,
  observarComprobanteFiscal,
  calcularKpisTesoreria,
  exportarLoteTransferenciasCSV,
  exportarReporteLiquidacionesCSV,
  isPrestacionBloqueada,
} from "@/lib/services/tesoreriaService";
import { VistaMetricasTesoreria } from "@/components/tesoreria/VistaMetricasTesoreria";
import { ModalControlDocumental } from "@/components/tesoreria/ModalControlDocumental";
import { ModalCrearLoteGDE } from "@/components/tesoreria/ModalCrearLoteGDE";
import { ModalDetalleLoteGDE } from "@/components/tesoreria/ModalDetalleLoteGDE";
import { ModalRegistrarPago } from "@/components/tesoreria/ModalRegistrarPago";
import { ModalLiquidarLote } from "@/components/tesoreria/ModalLiquidarLote";
import { ModalObservarFiscal } from "@/components/tesoreria/ModalObservarFiscal";
import { ModalDetalleLiquidacion } from "@/components/tesoreria/ModalDetalleLiquidacion";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/usePermissions";
import { toast } from "sonner";
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  RefreshCw,
  Loader2,
  Menu,
  Eye,
  ShieldCheck,
  X,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  Lock,
  Unlock,
  Edit3,
  BarChart3,
  Layers,
  Clock,
  FileCheck2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Building2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const MESES = [
  { id: 1, label: "Enero" },
  { id: 2, label: "Febrero" },
  { id: 3, label: "Marzo" },
  { id: 4, label: "Abril" },
  { id: 5, label: "Mayo" },
  { id: 6, label: "Junio" },
  { id: 7, label: "Julio" },
  { id: 8, label: "Agosto" },
  { id: 9, label: "Septiembre" },
  { id: 10, label: "Octubre" },
  { id: 11, label: "Noviembre" },
  { id: 12, label: "Diciembre" },
];

export default function TesoreriaPage() {
  const { currentTenant } = useWorkspace();
  const [user, setUser] = useState<any>(null);

  // Permisos y Guardia de Acceso
  const { hasRole, loading: loadingRoles } = useRoles(currentTenant?.id);
  const canAccessTesoreria =
    hasRole("tesoreria") ||
    hasRole("tesorer") ||
    hasRole("director") ||
    hasRole("director_coordinador") ||
    hasRole("admin") ||
    hasRole("superadmin");

  // Navegación de Submódulos: "galeria" (Hub principal), "operaciones" (Bandeja y Lotes), "metricas" (Estadísticas)
  const [vistaActiva, setVistaActiva] = useState<"galeria" | "operaciones" | "metricas">("galeria");

  // Estado de Datos
  const [prestaciones, setPrestaciones] = useState<PrestacionTesoreriaItem[]>([]);
  const [lotes, setLotes] = useState<LoteTesoreria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros de Operaciones
  const [tabActiva, setTabActiva] = useState<
    "control_documental" | "lotes_gde" | "pagados" | "observados" | "todos"
  >("control_documental");
  const [filtroMes, setFiltroMes] = useState<string>(String(new Date().getMonth() + 1));
  const [filtroAnio, setFiltroAnio] = useState<string>(String(new Date().getFullYear()));
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtroEstadoLotes, setFiltroEstadoLotes] = useState<"activos" | "pagados" | "todos">("activos");

  // Selección múltiple para armar Lote GDE
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modales
  const [itemControl, setItemControl] = useState<PrestacionTesoreriaItem | null>(null);
  const [itemParaPagar, setItemParaPagar] = useState<PrestacionTesoreriaItem | null>(null);
  const [itemParaObservar, setItemParaObservar] = useState<PrestacionTesoreriaItem | null>(null);
  const [itemDetalle, setItemDetalle] = useState<PrestacionTesoreriaItem | null>(null);
  const [loteDetalle, setLoteDetalle] = useState<LoteTesoreria | null>(null);
  const [isCrearLoteModalOpen, setIsCrearLoteModalOpen] = useState(false);
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  const [showAgregarALoteDropdown, setShowAgregarALoteDropdown] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    cargarDatos();
  }, [currentTenant]);

  const cargarDatos = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [items, lotesList] = await Promise.all([
        getPrestacionesParaTesoreria(currentTenant?.id),
        getLotesTesoreria(currentTenant?.id),
      ]);
      setPrestaciones(items);
      setLotes(lotesList);
      setSelectedIds(new Set());

      // Sincronizar el lote abierto actualmente en el modal
      setLoteDetalle((prev) => {
        if (!prev) return null;
        const actualizado = lotesList.find((l) => l.id === prev.id);
        return actualizado || prev;
      });
    } catch (err: any) {
      toast.error("Error al cargar datos de tesorería");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Configuración de aranceles vigente
  const [configPrestadores, setConfigPrestadores] = useState<ConfiguracionModuloPrestadores>(DEFAULT_CONFIGURACION_PRESTADORES);

  useEffect(() => {
    getPrestadoresConfig(currentTenant?.id).then(setConfigPrestadores);
  }, [currentTenant?.id]);

  // Helper para calcular devengado de una prestación
  const calcularDevengadoPrestacion = (p: PrestacionTesoreriaItem): number => {
    if (!p.digital_form_data) return Number(p.invoice_amount) || 0;
    try {
      const digitalForm: FormularioDigitalData =
        typeof p.digital_form_data === "string"
          ? JSON.parse(p.digital_form_data)
          : p.digital_form_data;

      if (digitalForm.tipo_formulario === "guardia") {
        return (digitalForm.renglones || []).reduce((sum, g) => {
          if (!g.fecha) return sum;
          if (typeof g.valor === "number" && g.valor > 0) return sum + g.valor;
          const horas = Math.max(1, Math.min(24, Number(g.duracion_horas) || 24));
          const dateObj = new Date(g.fecha + "T12:00:00Z");
          const dayOfWeek = dateObj.getUTCDay();
          const isInhabil = dayOfWeek === 0 || dayOfWeek === 6;
          let valor24hs = 0;
          if (g.tipo === "critica") {
            valor24hs = isInhabil
              ? configPrestadores.valor_guardia_critica_inhabil
              : configPrestadores.valor_guardia_critica_habil;
          } else {
            valor24hs = isInhabil
              ? configPrestadores.valor_guardia_ordinaria_inhabil
              : configPrestadores.valor_guardia_ordinaria_habil;
          }
          return sum + (valor24hs / 24) * horas;
        }, 0);
      } else if (digitalForm.tipo_formulario === "extension_horaria") {
        return (digitalForm.renglones || []).reduce((sum, r) => {
          if (typeof r.valor === "number" && r.valor > 0) return sum + r.valor;
          const horas = Number(r.horas_cumplidas) || 0;
          return sum + horas * configPrestadores.valor_hora_extension;
        }, 0);
      }
    } catch {
      // Fallback
    }
    return Number(p.invoice_amount) || 0;
  };

  // KPIs dinámicos
  const kpisData = useMemo(() => {
    const mesNum = filtroMes === "todos" ? undefined : parseInt(filtroMes, 10);
    const anioNum = filtroAnio === "todos" ? undefined : parseInt(filtroAnio, 10);
    return calcularKpisTesoreria(prestaciones, mesNum, anioNum);
  }, [prestaciones, filtroMes, filtroAnio]);

  // Métricas simplificadas para el empleado de tesorería (operativas y claras)
  const metricasSimples = useMemo(() => {
    const mesNum = filtroMes === "todos" ? undefined : parseInt(filtroMes, 10);
    const anioNum = filtroAnio === "todos" ? undefined : parseInt(filtroAnio, 10);

    const filtradas = prestaciones.filter((p) => {
      if (mesNum && p.period_month !== mesNum) return false;
      if (anioNum && p.period_year !== anioNum) return false;
      return true;
    });

    // 1. Pendientes de Control (aprobadas, sin asignar a lote y no conformadas aún) -> Calculado con Total Devengado
    const pendientesControl = filtradas.filter(
      (p) => p.status === "aprobado" && !p.lote_id && p.treasury_check_status !== "conformado"
    );
    const montoPendientesControl = pendientesControl.reduce(
      (acc, cur) => acc + calcularDevengadoPrestacion(cur),
      0
    );

    // 2. Conformadas listas para enviar a Lote (aprobadas, sin asignar a lote y ya conformadas)
    const listasParaLote = filtradas.filter(
      (p) => p.status === "aprobado" && !p.lote_id && p.treasury_check_status === "conformado"
    );
    const montoListasParaLote = listasParaLote.reduce(
      (acc, cur) => acc + (Number(cur.invoice_amount) || 0),
      0
    );

    // 3. En Lotes / Pendientes de Pago (en un lote pero aún no pagadas)
    const enLotesPendientesPago = filtradas.filter(
      (p) => p.status === "aprobado" && !!p.lote_id
    );
    const montoEnLotes = enLotesPendientesPago.reduce(
      (acc, cur) => acc + (Number(cur.invoice_amount) || 0),
      0
    );

    // 4. Observadas por Facturación
    const observadas = filtradas.filter(
      (p) => p.status === "observado_tesoreria" || p.status === "observado"
    );

    return {
      pendientesControlCount: pendientesControl.length,
      montoPendientesControl,
      listasParaLoteCount: listasParaLote.length,
      montoListasParaLote,
      enLotesCount: enLotesPendientesPago.length,
      montoEnLotes,
      observadasCount: observadas.length,
    };
  }, [prestaciones, filtroMes, filtroAnio, configPrestadores]);

  // Lista filtrada según pestaña y criterios (REGLA CLAVE: enviadas a lote NO aparecen en control_documental)
  const itemsFiltrados = useMemo(() => {
    return prestaciones.filter((item) => {
      // 1. Filtro por pestaña
      if (tabActiva === "control_documental") {
        // En control documental SOLO se muestran aprobadas que NO tengan lote asignado
        if (item.status !== "aprobado" || item.lote_id) return false;
      } else if (tabActiva === "pagados") {
        if (item.status !== "pagado") return false;
      } else if (tabActiva === "observados") {
        if (
          item.status !== "observado_tesoreria" &&
          item.status !== "observado"
        )
          return false;
      }

      // 2. Filtro por Período
      if (filtroMes !== "todos" && item.period_month !== parseInt(filtroMes, 10)) {
        return false;
      }
      if (filtroAnio !== "todos" && item.period_year !== parseInt(filtroAnio, 10)) {
        return false;
      }

      // 3. Filtro por Servicio Asistencial
      if (filtroServicio !== "todos" && item.hospital_service !== filtroServicio) {
        return false;
      }

      // 4. Buscador
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const user = item.expand?.user;
        const nombre = `${user?.lastName || ""} ${user?.firstName || ""}`.toLowerCase();
        const email = (user?.email || "").toLowerCase();
        const cuit = (item.perfilPrestador?.cuit || "").toLowerCase();
        const formNum = (item.form_number || "").toLowerCase();
        const invoiceNum = (item.invoice_number || "").toLowerCase();
        const cbu = (item.perfilPrestador?.cbu_alias || "").toLowerCase();
        const expte = (item.numero_expediente_gde || "").toLowerCase();
        const lote = (item.lote_numero || "").toLowerCase();

        return (
          nombre.includes(query) ||
          email.includes(query) ||
          cuit.includes(query) ||
          formNum.includes(query) ||
          invoiceNum.includes(query) ||
          cbu.includes(query) ||
          expte.includes(query) ||
          lote.includes(query)
        );
      }

      return true;
    });
  }, [prestaciones, tabActiva, filtroMes, filtroAnio, filtroServicio, searchQuery]);

  // Lotes filtrados con búsqueda profunda (por cabecera y por prestaciones hijas: médico, CUIT, factura, trámite)
  const lotesFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return lotes.filter((l) => {
      // Filtro por estado activo vs pagado
      if (filtroEstadoLotes === "activos") {
        if (l.estado === "pagado_bse" || Boolean(l.comprobante_pago_bse)) return false;
      } else if (filtroEstadoLotes === "pagados") {
        if (l.estado !== "pagado_bse" && !l.comprobante_pago_bse) return false;
      }

      if (filtroMes !== "todos" && l.periodo_mes !== parseInt(filtroMes, 10)) return false;
      if (filtroAnio !== "todos" && l.periodo_anio !== parseInt(filtroAnio, 10)) return false;

      if (q) {
        // 1. Coincidencia en cabecera del lote
        const matchCabecera =
          l.numero_lote.toLowerCase().includes(q) ||
          (l.numero_expediente_gde || "").toLowerCase().includes(q) ||
          (l.numero_resolucion || "").toLowerCase().includes(q) ||
          (l.numero_orden_pago || "").toLowerCase().includes(q) ||
          l.descripcion.toLowerCase().includes(q);

        if (matchCabecera) return true;

        // 2. Búsqueda profunda en prestaciones contenidas en este lote
        const matchPrestacionHija = prestaciones.some((p) => {
          if (p.lote_id !== l.id) return false;

          const user = p.expand?.user;
          const nombre = `${user?.lastName || ""} ${user?.firstName || ""}`.toLowerCase();
          const email = (user?.email || "").toLowerCase();
          const cuit = (p.perfilPrestador?.cuit || "").toLowerCase();
          const formNum = (p.form_number || "").toLowerCase();
          const invoiceNum = (p.invoice_number || "").toLowerCase();

          return (
            nombre.includes(q) ||
            email.includes(q) ||
            cuit.includes(q) ||
            formNum.includes(q) ||
            invoiceNum.includes(q)
          );
        });

        return matchPrestacionHija;
      }

      return true;
    });
  }, [lotes, prestaciones, filtroEstadoLotes, filtroMes, filtroAnio, searchQuery]);

  // Conteos para pestañas
  const counts = useMemo(() => {
    const mesNum = filtroMes === "todos" ? undefined : parseInt(filtroMes, 10);
    const anioNum = filtroAnio === "todos" ? undefined : parseInt(filtroAnio, 10);

    const filtradas = prestaciones.filter((p) => {
      if (mesNum && p.period_month !== mesNum) return false;
      if (anioNum && p.period_year !== anioNum) return false;
      return true;
    });

    return {
      control_documental: filtradas.filter((p) => p.status === "aprobado" && !p.lote_id).length,
      lotes_gde: lotes.length,
      pagados: filtradas.filter((p) => p.status === "pagado").length,
      observados: filtradas.filter(
        (p) => p.status === "observado_tesoreria" || p.status === "observado"
      ).length,
      todos: filtradas.length,
    };
  }, [prestaciones, lotes, filtroMes, filtroAnio]);

  // Selección múltiple: SOLO sobre prestaciones que ya estén 'conformado' (nunca pendientes de control)
  const prestacionesConformadasDisponibles = useMemo(() => {
    return itemsFiltrados.filter(
      (i) => i.status === "aprobado" && !i.lote_id && i.treasury_check_status === "conformado"
    );
  }, [itemsFiltrados]);

  const handleToggleSelectAll = () => {
    if (
      selectedIds.size === prestacionesConformadasDisponibles.length &&
      prestacionesConformadasDisponibles.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prestacionesConformadasDisponibles.map((i) => i.id)));
    }
  };

  const handleToggleSelectOne = (item: PrestacionTesoreriaItem) => {
    if (item.treasury_check_status !== "conformado") {
      toast.warning("Debe controlar y conformar el trámite antes de incorporarlo a un lote.");
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(item.id)) next.delete(item.id);
    else next.add(item.id);
    setSelectedIds(next);
  };

  const selectedItemsList = useMemo(() => {
    return prestaciones.filter((p) => selectedIds.has(p.id));
  }, [prestaciones, selectedIds]);

  // Creación de Lote
  const handleConfirmCrearLote = async (payload: CrearLotePayload) => {
    try {
      await crearLoteTesoreria(payload, prestaciones, currentTenant?.id);
      setSelectedIds(new Set());
      await cargarDatos();
      setTabActiva("lotes_gde");
    } catch (err: any) {
      toast.error(err?.message || "Error al crear el lote. Intente nuevamente.");
    }
  };

  // Lotes abiertos que admiten incorporar prestaciones
  const lotesAbiertos = useMemo(() => {
    return lotes.filter((l) => ESTADOS_LOTE_ABIERTO.includes(l.estado));
  }, [lotes]);

  // Agregar prestaciones seleccionadas a un lote existente
  const handleAgregarALoteExistente = async (loteId: string) => {
    setShowAgregarALoteDropdown(false);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning("Seleccione al menos una prestación conformada.");
      return;
    }
    try {
      await agregarPrestacionesALote(loteId, ids, prestaciones, currentTenant?.id);
      const loteTarget = lotes.find((l) => l.id === loteId);
      toast.success(
        `${ids.length} prestación(es) incorporadas al lote "${loteTarget?.numero_lote || loteId}".`
      );
      setSelectedIds(new Set());
      await cargarDatos();
    } catch (err: any) {
      toast.error(err?.message || "Error al agregar prestaciones al lote.");
    }
  };

  const handleConfirmSinglePayment = async (id: string, payload: RegistrarPagoPayload) => {
    await registrarPagoLiquidacion(id, payload);
    await cargarDatos();
  };

  const handleConfirmBatchPayment = async (ids: string[], payload: LiquidarLotePayload) => {
    await liquidarLotePrestaciones(ids, payload);
    await cargarDatos();
  };

  const handleConfirmFiscalObservation = async (id: string, payload: ObservarFiscalPayload) => {
    await observarComprobanteFiscal(id, payload);
    await cargarDatos();
  };

  const handleExportarLoteBancario = () => {
    const aExportar =
      selectedItemsList.length > 0
        ? selectedItemsList
        : itemsFiltrados.filter((i) => i.status === "aprobado" || i.status === "pagado");

    if (aExportar.length === 0) {
      toast.error("No hay prestaciones para exportar en el período seleccionado.");
      return;
    }

    const mesLabel =
      filtroMes === "todos"
        ? "Todos_Meses"
        : MESES.find((m) => m.id === parseInt(filtroMes, 10))?.label || filtroMes;
    exportarLoteTransferenciasCSV(
      aExportar,
      `Lote_Transferencias_BSE_CISB_${mesLabel}_${filtroAnio}.csv`
    );
    toast.success(`Lote de ${aExportar.length} transferencias exportado.`);
  };

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
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const periodoLabel = useMemo(() => {
    if (filtroMes === "todos" && filtroAnio === "todos") return "Histórico General";
    if (filtroMes === "todos") return `Año ${filtroAnio}`;
    const mesNombre = MESES.find((m) => m.id === parseInt(filtroMes, 10))?.label || "";
    return `${mesNombre} ${filtroAnio}`;
  }, [filtroMes, filtroAnio]);

  // Guardia de Acceso: Bloquear a usuarios sin rol autorizado de Tesorería o Dirección
  if (!loadingRoles && !canAccessTesoreria) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        <div className="hidden lg:block">
          <AppSidebar currentPage="tesoreria" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:pl-64">
          <div className="max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Acceso Restringido a Tesorería
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Su cuenta no posee permisos para acceder al módulo financiero y de pagos de Tesorería. Si es prestador asistencial, puede gestionar sus facturas y asistencias desde el Portal de Prestadores.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                asChild
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold"
              >
                <a href="/modules/prestadores">
                  Ir al Portal de Prestadores
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                className="text-xs"
              >
                <a href="/dashboard">
                  Volver al Inicio
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <AppSidebar currentPage="tesoreria" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
        {/* Header Superior */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SheetTitle className="sr-only">Navegación</SheetTitle>
                  <AppSidebar currentPage="tesoreria" isMobile />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  Tesorería
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 hidden sm:block">
                  {vistaActiva === "operaciones"
                    ? "Bandeja de Control Documental & Lotes GDE"
                    : vistaActiva === "metricas"
                    ? "Panel de Métricas & Estadísticas"
                    : "Módulos de Tesorería"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navegación rápida entre Hub, Bandeja y Métricas */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setVistaActiva("galeria")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  vistaActiva === "galeria"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Hub
              </button>
              <button
                onClick={() => setVistaActiva("operaciones")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  vistaActiva === "operaciones"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                Prestadores & Lotes
              </button>
              <button
                onClick={() => setVistaActiva("metricas")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  vistaActiva === "metricas"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Métricas
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => cargarDatos(true)}
              disabled={refreshing}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Actualizar</span>
            </Button>

            {selectedIds.size > 0 && vistaActiva === "operaciones" && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsCrearLoteModalOpen(true)}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Crear Lote ({selectedIds.size})
                </Button>

                {/* Botón Agregar a Lote Existente */}
                {lotesAbiertos.length > 0 && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAgregarALoteDropdown(!showAgregarALoteDropdown)}
                      className="h-8 text-xs font-semibold flex items-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      Agregar a Lote ({selectedIds.size})
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAgregarALoteDropdown ? "rotate-180" : ""}`} />
                    </Button>

                    {showAgregarALoteDropdown && (
                      <>
                        {/* Overlay para cerrar al hacer clic fuera */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowAgregarALoteDropdown(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Seleccionar Lote Abierto
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              Se agregarán {selectedIds.size} prestación(es) al lote seleccionado
                            </p>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {lotesAbiertos.map((lote) => (
                              <button
                                key={lote.id}
                                onClick={() => handleAgregarALoteExistente(lote.id)}
                                className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      {lote.numero_lote}
                                    </p>
                                    {lote.numero_expediente_gde && (
                                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {lote.numero_expediente_gde}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="text-[10px] px-1.5">
                                      {lote.cantidad_prestaciones} ítem(s)
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* VISTA 1: ANTESALA / HUB PRINCIPAL DE SUBMÓDULOS DE TESORERÍA */}
          {vistaActiva === "galeria" ? (
            <div className="space-y-4 max-w-5xl mx-auto py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Tarjeta 1: Liquidación a Prestadores Asistenciales */}
                <Card
                  onClick={() => setVistaActiva("operaciones")}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between rounded-xl"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                        <Receipt className="w-6 h-6" />
                      </div>
                      {metricasSimples.pendientesControlCount > 0 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-semibold">
                          {metricasSimples.pendientesControlCount} por auditar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                          Al día
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Pago a Prestadores Asistenciales
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                        Control documental de facturas, cálculo de retenciones (IIBB, Ganancias, SUSS), conformación de Lotes GDE y emisión de Órdenes de Pago.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <span>Ingresar a Bandeja Operativa</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* Tarjeta 2: Panel de Métricas & Estadísticas Financieras */}
                <Card
                  onClick={() => setVistaActiva("metricas")}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between rounded-xl"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500">
                        Analítica
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Tablero de Métricas & Gastos
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                        Análisis presupuestario, desglose de erogaciones por servicio hospitalario, evolución mensual de liquidaciones y KPIs de retenciones.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      <span>Ver Reportes & Gráficos</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* Tarjeta 3: Pago a Proveedores & Servicios Comerciales (Futura expansión) */}
                <Card className="border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-75 flex flex-col justify-between rounded-xl">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Próximamente
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-gray-700 dark:text-slate-300">
                        Proveedores & Bienes de Consumo
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">
                        Circuito de pago para órdenes de compra, droguería central, mantenimiento de aparatología e insumos médicos generales.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-gray-400">
                      En fase de diseño institucional
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : vistaActiva === "metricas" ? (
            /* VISTA 2: SUBMÓDULO DE MÉTRICAS ANALÍTICAS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVistaActiva("galeria")}
                  className="text-xs text-gray-600 hover:text-gray-900 gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver al Menú de Tesorería
                </Button>

                {/* Selector de Período para Métricas */}
                <div className="flex items-center gap-2">
                  <Select value={filtroMes} onValueChange={setFiltroMes}>
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos" className="text-xs">Todos los meses</SelectItem>
                      {MESES.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                      <SelectItem value="2026" className="text-xs">2026</SelectItem>
                      <SelectItem value="2025" className="text-xs">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <VistaMetricasTesoreria kpis={kpisData} periodoLabel={periodoLabel} />
            </div>
          ) : (
            /* VISTA 3: BANDEJA OPERATIVA ULTRA SIMPLIFICADA (PRESTADORES & LOTES) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVistaActiva("galeria")}
                  className="text-xs text-gray-600 hover:text-gray-900 gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver al Menú de Tesorería
                </Button>
              </div>

              {/* 3 Tarjetas de Métricas Esenciales para el Administrativo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pendientes de Control */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                      Pendientes de Control
                    </span>
                    <span className="text-xl font-extrabold text-amber-900 dark:text-amber-100 font-mono">
                      {metricasSimples.pendientesControlCount}{" "}
                      <span className="text-xs font-normal text-amber-700 dark:text-amber-300">
                        ({formatMoney(metricasSimples.montoPendientesControl)})
                      </span>
                    </span>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                {/* 2. Conformados Listos para Lote */}
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 block uppercase tracking-wider">
                      Listas para Lote
                    </span>
                    <span className="text-xl font-extrabold text-blue-900 dark:text-blue-100 font-mono">
                      {metricasSimples.listasParaLoteCount}{" "}
                      <span className="text-xs font-normal text-blue-700">
                        ({formatMoney(metricasSimples.montoListasParaLote)})
                      </span>
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-300">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                </div>

                {/* 3. En Lotes / Pendientes de Pago */}
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">
                      En Lote / A Pagar
                    </span>
                    <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100 font-mono">
                      {metricasSimples.enLotesCount}{" "}
                      <span className="text-xs font-normal text-emerald-700">
                        ({formatMoney(metricasSimples.montoEnLotes)})
                      </span>
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Barra de Filtros & Buscador */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-36">
                    <Select value={filtroMes} onValueChange={setFiltroMes}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs">Todos los meses</SelectItem>
                        {MESES.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-28">
                    <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                        <SelectItem value="2026" className="text-xs">2026</SelectItem>
                        <SelectItem value="2025" className="text-xs">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-48 hidden sm:block">
                    <Select value={filtroServicio} onValueChange={setFiltroServicio}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Servicio Hospitalario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs">Todos los servicios</SelectItem>
                        {Object.entries(SECTORES_SERVICIO_MAP).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buscador */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Buscar por médico, CUIT, factura, expediente GDE o Lote..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8 pr-7"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pestañas de Flujo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Pestaña 1: Control & Conformación (SIN las ya enviadas a lote) */}
                    <button
                      onClick={() => setTabActiva("control_documental")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        tabActiva === "control_documental"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      1. Bandeja de Control
                      <Badge
                        variant="secondary"
                        className={`ml-1 text-[10px] px-1.5 py-0 h-4 ${
                          tabActiva === "control_documental"
                            ? "bg-blue-700 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {counts.control_documental}
                      </Badge>
                    </button>

                    {/* Pestaña 2: Lotes & Expedientes GDE */}
                    <button
                      onClick={() => setTabActiva("lotes_gde")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        tabActiva === "lotes_gde"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      2. Lotes ({lotesFiltrados.length})
                    </button>

                    {/* Pestaña 3: Historial Liquidado */}
                    <button
                      onClick={() => setTabActiva("pagados")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        tabActiva === "pagados"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      3. Historial ({counts.pagados})
                    </button>

                    {/* Pestaña 4: Observaciones Fiscales */}
                    <button
                      onClick={() => setTabActiva("observados")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        tabActiva === "observados"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Observadas ({counts.observados})
                    </button>

                    <button
                      onClick={() => setTabActiva("todos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        tabActiva === "todos"
                          ? "bg-slate-800 dark:bg-slate-700 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Todos ({counts.todos})
                    </button>
                  </div>
                </div>

                {/* VISTA 1: TABLA DE LOTES GDE */}
                {tabActiva === "lotes_gde" ? (
                  <div className="space-y-4">
                    {/* Barra de Filtro de Estado de Lotes (Activos / Pagados / Todos) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFiltroEstadoLotes("activos")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            filtroEstadoLotes === "activos"
                              ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Lotes Activos / En Trámite
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {lotes.filter((l) => l.estado !== "pagado_bse" && !l.comprobante_pago_bse).length}
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFiltroEstadoLotes("pagados")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            filtroEstadoLotes === "pagados"
                              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Lotes Pagados / Concluidos
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {lotes.filter((l) => l.estado === "pagado_bse" || Boolean(l.comprobante_pago_bse)).length}
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFiltroEstadoLotes("todos")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            filtroEstadoLotes === "todos"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          Todos ({lotes.length})
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {filtroEstadoLotes === "activos"
                          ? "Mostrando expedientes abiertos y en proceso de pago"
                          : filtroEstadoLotes === "pagados"
                          ? "Mostrando expedientes con pagos y transferencias finalizadas"
                          : "Historial completo de lotes"}
                      </span>
                    </div>

                    {lotesFiltrados.length === 0 ? (
                      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-12 text-center text-gray-500 space-y-2">
                        <FolderOpen className="h-10 w-10 mx-auto text-slate-300" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                          {filtroEstadoLotes === "activos"
                            ? "No hay Lotes Activos pendientes de pago"
                            : filtroEstadoLotes === "pagados"
                            ? "No hay Lotes Pagados en este período"
                            : "No hay Lotes creados aún"}
                        </div>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          {filtroEstadoLotes === "activos"
                            ? "Todos los lotes creados ya han sido liquidados o no hay lotes en curso."
                            : "Vaya a la pestaña '1. Bandeja de Control' para conformar prestaciones y crear un lote."}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {lotesFiltrados.map((lote) => {
                          const estadoCfg = ESTADOS_LOTE_CONFIG[lote.estado] || {
                            label: lote.estado,
                            bgLight: "bg-slate-100 border-slate-200",
                            textDark: "text-slate-700",
                          };

                          return (
                            <Card
                              key={lote.id}
                              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setLoteDetalle(lote)}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                                      {lote.numero_lote}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 flex items-center gap-1 ${estadoCfg.bgLight} ${estadoCfg.textDark}`}
                                    >
                                      {lote.estado === "pagado_bse" || lote.numero_orden_pago ? (
                                        <FileCheck2 className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                                      ) : lote.estado === "cerrado" ? (
                                        <Lock className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                                      ) : (
                                        <Unlock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                      )}
                                      {estadoCfg.label}
                                    </span>
                                  </div>
                                  <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-100 font-mono mt-0.5 truncate">
                                    {lote.numero_expediente_gde || "Sin Expediente GDE"}
                                  </h3>
                                </div>

                                <p className="text-[11px] text-gray-500 line-clamp-2">
                                  {lote.descripcion}
                                </p>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-400 text-[10px] block">Trámites</span>
                                    <span className="font-bold text-gray-800 dark:text-slate-200">
                                      {lote.cantidad_prestaciones} profesionales
                                    </span>
                                    <span className="text-gray-400 text-[10px] block mt-1">
                                      Período: {String(lote.periodo_mes).padStart(2, "0")}/{lote.periodo_anio}
                                      {lote.created_by_name ? ` • ${lote.created_by_name}` : ""}
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-gray-400 text-[10px] block">Neto a Pagar</span>
                                    <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                      {formatMoney(lote.monto_neto_total)}
                                    </span>
                                  </div>
                                </div>

                                {lote.numero_resolucion && (
                                  <div className="p-1.5 rounded bg-purple-50 dark:bg-purple-950/30 text-[10px] text-purple-800 dark:text-purple-300 font-mono truncate">
                                    📜 {lote.numero_resolucion}
                                  </div>
                                )}

                                {Array.isArray(lote.comprobantes_bancarios) && lote.comprobantes_bancarios.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded border border-blue-200/50 dark:border-blue-900/50">
                                    <FileText className="w-3 h-3 text-blue-600" />
                                    <span>{lote.comprobantes_bancarios.length} comprobante(s) bancario(s)</span>
                                  </div>
                                )}

                                {Array.isArray(lote.comprobantes_retenciones) && lote.comprobantes_retenciones.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200/50 dark:border-amber-900/50">
                                    <FileCheck2 className="w-3 h-3 text-amber-600" />
                                    <span>{lote.comprobantes_retenciones.length} certificado(s) de retención</span>
                                  </div>
                                )}

                                {/* Indicador de Coincidencia por Búsqueda Profunda */}
                                {searchQuery.trim() && (() => {
                                  const q = searchQuery.trim().toLowerCase();
                                  const matches = prestaciones.filter((p) => {
                                    if (p.lote_id !== lote.id) return false;
                                    const user = p.expand?.user;
                                    const nombre = `${user?.lastName || ""} ${user?.firstName || ""}`.toLowerCase();
                                    const email = (user?.email || "").toLowerCase();
                                    const cuit = (p.perfilPrestador?.cuit || "").toLowerCase();
                                    const formNum = (p.form_number || "").toLowerCase();
                                    const invoiceNum = (p.invoice_number || "").toLowerCase();
                                    return (
                                      nombre.includes(q) ||
                                      email.includes(q) ||
                                      cuit.includes(q) ||
                                      formNum.includes(q) ||
                                      invoiceNum.includes(q)
                                    );
                                  });

                                  if (matches.length === 0) return null;

                                  const primerMatch = matches[0];
                                  const user = primerMatch.expand?.user;
                                  const nombre = user ? `${user.lastName || ""} ${user.firstName || ""}`.trim() : "Prestador";

                                  return (
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-700 text-[10px] text-amber-900 dark:text-amber-200 font-medium">
                                      <Search className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span className="truncate">
                                        Contiene a: <strong>{nombre}</strong> {primerMatch.invoice_number ? `(Fact. ${primerMatch.invoice_number})` : ""}
                                        {matches.length > 1 ? ` y ${matches.length - 1} más` : ""}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* VISTA 2: TABLA DE PRESTACIONES (SIN PRESTACIONES ENVIADAS A LOTE) */
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {loading ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                        <span className="text-xs">Cargando trámites de Tesorería...</span>
                      </div>
                    ) : itemsFiltrados.length === 0 ? (
                      <div className="py-16 text-center text-gray-500 dark:text-slate-400 space-y-2">
                        <Receipt className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                          {tabActiva === "control_documental"
                            ? "¡Bandeja al día! No hay trámites pendientes de incorporar a lotes"
                            : "No se encontraron trámites en esta vista"}
                        </div>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          {tabActiva === "control_documental"
                            ? "Todas las prestaciones aprobadas fueron enviadas a sus respectivos Lotes GDE o no hay nuevas facturas presentadas."
                            : "Pruebe modificando los filtros de período, servicio o término de búsqueda."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                            <tr>
                              {tabActiva === "control_documental" && (
                                <th className="py-3 px-3 w-10 text-center" title="Seleccionar todas las prestaciones conformadas">
                                  <Checkbox
                                    checked={
                                      selectedIds.size > 0 &&
                                      selectedIds.size === prestacionesConformadasDisponibles.length &&
                                      prestacionesConformadasDisponibles.length > 0
                                    }
                                    disabled={prestacionesConformadasDisponibles.length === 0}
                                    onCheckedChange={handleToggleSelectAll}
                                    aria-label="Seleccionar todas las conformadas"
                                  />
                                </th>
                              )}
                              <th className="py-3 px-3">Trámite & Período</th>
                              <th className="py-3 px-3">Beneficiario & CUIT</th>
                              <th className="py-3 px-3">Factura</th>
                              <th className="py-3 px-3">Lote Asignado</th>
                              <th className="py-3 px-3 text-right">Importe Bruto</th>
                              <th className="py-3 px-3 text-right">Importe Neto</th>
                              <th className="py-3 px-3 text-center">Estado</th>
                              <th className="py-3 px-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {itemsFiltrados.map((item) => {
                              const perfil = item.perfilPrestador;
                              const userExpand = item.expand?.user;
                              const nombrePrestador = userExpand
                                ? `${userExpand.lastName || ""} ${userExpand.firstName || ""}`.trim() ||
                                  userExpand.email
                                : "Prestador";

                              const lockInfo = isPrestacionBloqueada(item, user?.id);
                              const isSelected = selectedIds.has(item.id);

                              const montoBruto = Number(item.invoice_amount) || 0;
                              const retMonto = Number(item.retencion_monto) || 0;
                              const montoNeto =
                                item.monto_neto_liquidable !== undefined
                                  ? Number(item.monto_neto_liquidable)
                                  : montoBruto - retMonto;

                              const isConformado = item.treasury_check_status === "conformado";
                              const loteAsociado = lotes.find((l) => l.id === item.lote_id);
                              const numeroLoteDisplay = item.lote_numero || loteAsociado?.numero_lote;

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                    isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                                  } ${lockInfo.bloqueado ? "opacity-75 bg-amber-50/20" : ""}`}
                                >
                                  {tabActiva === "control_documental" && (
                                    <td className="py-3 px-3 text-center">
                                      <Checkbox
                                        checked={isSelected}
                                        disabled={!isConformado || lockInfo.bloqueado}
                                        onCheckedChange={() => handleToggleSelectOne(item)}
                                        title={
                                          !isConformado
                                            ? "Debe controlar y conformar el trámite antes de incorporarlo a un lote"
                                            : "Seleccionar para Lote GDE"
                                        }
                                        aria-label={`Seleccionar ${item.form_number}`}
                                      />
                                    </td>
                                  )}

                                  {/* Trámite y Período */}
                                  <td className="py-3 px-3">
                                    <div className="font-mono font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                                      <span>{item.form_number || item.id.slice(0, 8)}</span>
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 py-0 h-3.5 border-slate-300"
                                      >
                                        {item.service_type === "guardia" ? "G" : "EH"}
                                      </Badge>
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {String(item.period_month).padStart(2, "0")}/{item.period_year}
                                    </div>
                                  </td>

                                  {/* Beneficiario y CUIT */}
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-gray-900 dark:text-slate-100">
                                      {nombrePrestador}
                                    </div>
                                    <div className="text-[11px] text-gray-500 font-mono">
                                      CUIT: {perfil?.cuit || "Sin CUIT"}
                                    </div>
                                  </td>

                                  {/* Factura ARCA */}
                                  <td className="py-3 px-3">
                                    <div className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                                      {item.invoice_number || "S/N"}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                      {formatDate(item.invoice_date)}
                                    </div>
                                  </td>

                                  {/* Lote Asignado */}
                                  <td className="py-3 px-3">
                                    {numeroLoteDisplay ? (
                                      <div>
                                        <Badge
                                          variant="outline"
                                          className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                                        >
                                          {numeroLoteDisplay}
                                        </Badge>
                                        {item.numero_expediente_gde && (
                                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" title={item.numero_expediente_gde}>
                                            {item.numero_expediente_gde}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-[11px]">—</span>
                                    )}
                                  </td>

                                  {/* Bruto Facturado */}
                                  <td className="py-3 px-3 text-right">
                                    <span className="font-mono font-medium text-gray-900 dark:text-slate-100 text-xs">
                                      {formatMoney(montoBruto)}
                                    </span>
                                  </td>

                                  {/* Neto BSE */}
                                  <td className="py-3 px-3 text-right">
                                    <span className="font-extrabold font-mono text-emerald-700 dark:text-emerald-400 text-xs">
                                      {formatMoney(montoNeto)}
                                    </span>
                                  </td>

                                  {/* Estado de Control Documental & Locking */}
                                  <td className="py-3 px-3 text-center">
                                    {lockInfo.bloqueado ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] flex items-center gap-1 mx-auto w-fit"
                                      >
                                        <Lock className="h-3 w-3" />
                                        {lockInfo.porUsuario} ({lockInfo.minutosRestantes}m)
                                      </Badge>
                                    ) : isConformado ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] flex items-center gap-1 mx-auto w-fit font-semibold"
                                      >
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Conformado
                                      </Badge>
                                    ) : item.status === "pagado" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-teal-50 text-teal-800 border-teal-300 text-[10px] mx-auto w-fit font-semibold"
                                      >
                                        Pagado
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] text-gray-500 border-slate-200 mx-auto w-fit"
                                      >
                                        Pendiente Control
                                      </Badge>
                                    )}
                                  </td>

                                  {/* Acciones */}
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900"
                                        title="Ver detalle 360°"
                                        onClick={() => setItemDetalle(item)}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>

                                      {item.status === "aprobado" && (
                                        <>
                                          <Button
                                            size="sm"
                                            disabled={lockInfo.bloqueado}
                                            onClick={() => setItemControl(item)}
                                            variant={isConformado ? "outline" : "default"}
                                            className={`h-7 px-2.5 text-[11px] font-semibold flex items-center gap-1 ${
                                              isConformado
                                                ? "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                            }`}
                                          >
                                            {isConformado ? (
                                              <>
                                                <Edit3 className="h-3 w-3 text-slate-500" />
                                                Editar
                                              </>
                                            ) : (
                                              <>
                                                <ShieldCheck className="h-3 w-3" />
                                                Controlar
                                              </>
                                            )}
                                          </Button>

                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            title="Observar factura ARCA"
                                            onClick={() => setItemParaObservar(item)}
                                          >
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALES DEL FLUJO DE TESORERÍA */}
      <ModalControlDocumental
        isOpen={!!itemControl}
        onClose={() => setItemControl(null)}
        prestacion={itemControl}
        onConformado={cargarDatos}
        onObservar={(p) => setItemParaObservar(p)}
      />

      <ModalCrearLoteGDE
        isOpen={isCrearLoteModalOpen}
        onClose={() => setIsCrearLoteModalOpen(false)}
        selectedItems={selectedItemsList}
        onConfirm={handleConfirmCrearLote}
        periodoMes={filtroMes === "todos" ? new Date().getMonth() + 1 : parseInt(filtroMes, 10)}
        periodoAnio={filtroAnio === "todos" ? new Date().getFullYear() : parseInt(filtroAnio, 10)}
      />

      <ModalDetalleLoteGDE
        isOpen={!!loteDetalle}
        onClose={() => setLoteDetalle(null)}
        lote={loteDetalle}
        prestacionesDelLote={prestaciones.filter((p) =>
          loteDetalle?.prestaciones_ids?.includes(p.id)
        )}
        onRefresh={cargarDatos}
      />

      <ModalRegistrarPago
        isOpen={!!itemParaPagar}
        onClose={() => setItemParaPagar(null)}
        prestacion={itemParaPagar}
        onConfirm={handleConfirmSinglePayment}
      />

      <ModalLiquidarLote
        isOpen={isLoteModalOpen}
        onClose={() => setIsLoteModalOpen(false)}
        selectedItems={selectedItemsList}
        onConfirm={handleConfirmBatchPayment}
      />

      <ModalObservarFiscal
        isOpen={!!itemParaObservar}
        onClose={() => setItemParaObservar(null)}
        prestacion={itemParaObservar}
        onConfirm={handleConfirmFiscalObservation}
      />

      <ModalDetalleLiquidacion
        isOpen={!!itemDetalle}
        onClose={() => setItemDetalle(null)}
        prestacion={itemDetalle}
      />
    </div>
  );
}

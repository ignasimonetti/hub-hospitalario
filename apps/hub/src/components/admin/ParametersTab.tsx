"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
  DEFAULT_SECTORES_HABILITADOS,
  DEFAULT_FERIADOS_ARGENTINA_SDE,
  FeriadoConfig,
} from "@/types/prestadores";
import {
  getPrestadoresConfig,
  savePrestadoresConfig,
} from "@/lib/services/parametersService";
import { toast } from "sonner";
import {
  Sliders,
  Save,
  Activity,
  CalendarClock,
  ShieldCheck,
  HelpCircle,
  Calculator,
  Stethoscope,
  FolderOpen,
  Package,
  FileText,
  ChevronLeft,
  Settings2,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  X,
  Building2,
  Calendar,
  Receipt,
} from "lucide-react";
import { TesoreriaParametersTab } from "./TesoreriaParametersTab";

// Definición de Plugins del Hub Hospitalario
interface PluginDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  status: "configurable" | "coming_soon";
  parametersCount?: number;
}

const PLUGINS: PluginDefinition[] = [
  {
    id: "prestadores",
    name: "Portal de Prestadores",
    category: "Recursos Humanos y Asistencia",
    description: "Tarifas de guardias ordinarias y críticas, horas de extensión asistencial, catálogo de servicios/sectores y tope normativo de facturación.",
    icon: Stethoscope,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60",
    status: "configurable",
    parametersCount: 6,
  },
  {
    id: "tesoreria",
    name: "Tesorería & Expedientes GDE",
    category: "Gestión Económica y Bancaria",
    description: "Catálogo de observaciones fiscales ARCA, tiempos de bloqueo exclusivo, carátulas GDE y cuentas pagadoras para transferencias BSE.",
    icon: Receipt,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
    status: "configurable",
    parametersCount: 5,
  },
  {
    id: "expedientes",
    name: "Módulo de Expedientes",
    category: "Gestión Administrativa",
    description: "Configuración de numeración, alertas de vencimiento, plazos máximos de pase y foliatura.",
    icon: FolderOpen,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60",
    status: "coming_soon",
  },
  {
    id: "supply",
    name: "Gestión de Suministros y Stock",
    category: "Farmacia y Logística",
    description: "Límites de stock de seguridad, puntos de reorden, unidades de medida y alertas de insumos.",
    icon: Package,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60",
    status: "coming_soon",
  },
  {
    id: "content",
    name: "Contenidos y Portal Informativo",
    category: "Comunicación y Blog",
    description: "Configuración de plataformas de destino, moderación automática y límites de publicaciones.",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
    status: "coming_soon",
  },
];

export function ParametersTab() {
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);

  // Estados de Prestadores
  const [config, setConfig] = useState<ConfiguracionModuloPrestadores>(
    DEFAULT_CONFIGURACION_PRESTADORES
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del Simulador Rápido
  const [simCantGuardias, setSimCantGuardias] = useState<string>("1");
  const [simHorasEH, setSimHorasEH] = useState<string>("10");
  const [simTipoGuardia, setSimTipoGuardia] = useState<"ordinaria" | "critica">("ordinaria");
  const [simEsInhabil, setSimEsInhabil] = useState<boolean>(false);

  // Inputs decimales con edición libre de texto (admiten centavos)
  const topeFacturaIn = useDecimalInput("tope_maximo_factura", config, setConfig);
  const guardiaOrdHabilIn = useDecimalInput("valor_guardia_ordinaria_habil", config, setConfig);
  const guardiaOrdInhabilIn = useDecimalInput("valor_guardia_ordinaria_inhabil", config, setConfig);
  const guardiaCritHabilIn = useDecimalInput("valor_guardia_critica_habil", config, setConfig);
  const guardiaCritInhabilIn = useDecimalInput("valor_guardia_critica_inhabil", config, setConfig);
  const simGuardiasIn = useIntegerInput(simCantGuardias, setSimCantGuardias);
  const simHorasIn = useIntegerInput(simHorasEH, setSimHorasEH);

  // Estados para Gestor de Sectores / Servicios Hospitalarios
  const [nuevoSector, setNuevoSector] = useState<string>("");
  const [editingSectorIdx, setEditingSectorIdx] = useState<number | null>(null);
  const [editingSectorText, setEditingSectorText] = useState<string>("");

  const handleAddSector = () => {
    const clean = nuevoSector.trim();
    if (!clean) return;
    const current = config.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS;
    if (current.some(s => s.toLowerCase() === clean.toLowerCase())) {
      toast.error("Este servicio ya está en la lista");
      return;
    }
    setConfig(prev => ({
      ...prev,
      sectores_habilitados: [...(prev.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS), clean]
    }));
    setNuevoSector("");
    toast.success(`Servicio "${clean}" agregado`);
  };

  const handleRemoveSector = (sectorToRemove: string) => {
    const current = config.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS;
    if (current.length <= 1) {
      toast.error("Debe existir al menos un servicio habilitado");
      return;
    }
    setConfig(prev => ({
      ...prev,
      sectores_habilitados: (prev.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS).filter(s => s !== sectorToRemove)
    }));
    toast.success(`Servicio "${sectorToRemove}" eliminado`);
  };

  const handleStartEditSector = (idx: number, name: string) => {
    setEditingSectorIdx(idx);
    setEditingSectorText(name);
  };

  const handleSaveEditSector = (idx: number) => {
    const clean = editingSectorText.trim();
    if (!clean) return;
    setConfig(prev => {
      const list = [...(prev.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS)];
      list[idx] = clean;
      return { ...prev, sectores_habilitados: list };
    });
    setEditingSectorIdx(null);
    setEditingSectorText("");
    toast.success("Servicio actualizado");
  };

  // Manejo de Feriados e Inhábiles
  const [nuevoFeriadoFecha, setNuevoFeriadoFecha] = useState("");
  const [nuevoFeriadoMotivo, setNuevoFeriadoMotivo] = useState("");
  const [nuevoFeriadoTipo, setNuevoFeriadoTipo] = useState<"nacional" | "provincial" | "asueto">("nacional");

  const handleAddFeriado = () => {
    if (!nuevoFeriadoFecha) {
      toast.error("Selecciona la fecha del feriado");
      return;
    }
    if (!nuevoFeriadoMotivo.trim()) {
      toast.error("Ingresa el motivo del feriado / día inhábil");
      return;
    }

    const currentFeriados = config.feriados_config || DEFAULT_FERIADOS_ARGENTINA_SDE;
    if (currentFeriados.some(f => f.fecha === nuevoFeriadoFecha)) {
      toast.error("Ya existe un feriado configurado para esa fecha");
      return;
    }

    const nuevo: FeriadoConfig = {
      fecha: nuevoFeriadoFecha,
      motivo: nuevoFeriadoMotivo.trim(),
      tipo: nuevoFeriadoTipo,
    };

    const sorted = [...currentFeriados, nuevo].sort((a, b) => a.fecha.localeCompare(b.fecha));
    setConfig(prev => ({ ...prev, feriados_config: sorted }));
    setNuevoFeriadoFecha("");
    setNuevoFeriadoMotivo("");
    toast.success("Feriado agregado al calendario");
  };

  const handleRemoveFeriado = (fecha: string) => {
    const currentFeriados = config.feriados_config || DEFAULT_FERIADOS_ARGENTINA_SDE;
    const filtered = currentFeriados.filter(f => f.fecha !== fecha);
    setConfig(prev => ({ ...prev, feriados_config: filtered }));
    toast.success("Feriado eliminado del calendario");
  };

  const handleRestoreDefaultFeriados = () => {
    setConfig(prev => ({ ...prev, feriados_config: DEFAULT_FERIADOS_ARGENTINA_SDE }));
    toast.success("Calendario de feriados oficiales restablecido");
  };

  // Manejo del Módulo de 6hs para Extensión Horaria
  const [modulo6hsStr, setModulo6hsStr] = useState<string>(() => {
    const mod = config.valor_modulo_6hs_extension ?? (config.valor_hora_extension ? config.valor_hora_extension * 6 : 111000);
    return String(mod);
  });

  useEffect(() => {
    const mod = config.valor_modulo_6hs_extension ?? (config.valor_hora_extension ? config.valor_hora_extension * 6 : 111000);
    setModulo6hsStr(String(mod));
  }, [config.valor_modulo_6hs_extension]);

  const handleModulo6hsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^\d*(\.?\d{0,2})?$/.test(raw)) {
      setModulo6hsStr(raw);
      const modNum = raw === "" || raw === "." ? 0 : parseFloat(raw) || 0;
      const horaCalculada = Math.round((modNum / 6) * 100) / 100;
      setConfig((prev) => ({
        ...prev,
        valor_modulo_6hs_extension: modNum,
        valor_hora_extension: horaCalculada,
      }));
    }
  };

  const handleModulo6hsBlur = () => {
    const clean = modulo6hsStr === "" || modulo6hsStr === "." ? "0" : modulo6hsStr;
    const modNum = parseFloat(clean) || 0;
    const horaCalculada = Math.round((modNum / 6) * 100) / 100;
    setModulo6hsStr(String(modNum));
    setConfig((prev) => ({
      ...prev,
      valor_modulo_6hs_extension: modNum,
      valor_hora_extension: horaCalculada,
    }));
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getPrestadoresConfig();
      const moduloCalculado = data.valor_modulo_6hs_extension || (data.valor_hora_extension ? data.valor_hora_extension * 6 : 111000);
      const horaCalculada = data.valor_hora_extension || Math.round((moduloCalculado / 6) * 100) / 100;
      const sectores = (data.sectores_habilitados && data.sectores_habilitados.length > 0)
        ? data.sectores_habilitados
        : DEFAULT_SECTORES_HABILITADOS;
      setConfig({
        ...data,
        valor_modulo_6hs_extension: moduloCalculado,
        valor_hora_extension: horaCalculada,
        sectores_habilitados: sectores,
      });
      setModulo6hsStr(String(moduloCalculado));
    } catch (e) {
      console.error("Error loading parameters:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePrestadoresConfig(config);
      toast.success("Parámetros y aranceles guardados exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar parámetros");
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Cálculo del Simulador
  const valorUnitarioGuardia =
    simTipoGuardia === "ordinaria"
      ? simEsInhabil
        ? config.valor_guardia_ordinaria_inhabil
        : config.valor_guardia_ordinaria_habil
      : simEsInhabil
      ? config.valor_guardia_critica_inhabil
      : config.valor_guardia_critica_habil;

  const totalGuardiasSimuladas = (parseInt(simCantGuardias, 10) || 0) * valorUnitarioGuardia;
  const totalEHSimulado = (parseFloat(simHorasEH) || 0) * config.valor_hora_extension;

  const selectedPlugin = PLUGINS.find((p) => p.id === selectedPluginId);

  return (
    <div className="space-y-6">
      {/* VISTA 1: GALERÍA DE PLUGINS / MÓDULOS */}
      {!selectedPluginId ? (
        <div className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Parámetros de Plugins y Módulos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecciona el plugin o módulo del hospital cuyos parámetros de funcionamiento y tarifas deseas configurar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLUGINS.map((plugin) => {
              const Icon = plugin.icon;
              const isConfigurable = plugin.status === "configurable";

              return (
                <Card
                  key={plugin.id}
                  onClick={() => {
                    if (isConfigurable) {
                      setSelectedPluginId(plugin.id);
                    }
                  }}
                  className={`border transition-all duration-200 rounded-2xl ${
                    isConfigurable
                      ? "cursor-pointer hover:shadow-md hover:border-sky-500/50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 group"
                      : "opacity-75 bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 cursor-not-allowed"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${plugin.bgColor}`}
                        >
                          <Icon className={`w-5 h-5 ${plugin.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">
                            {plugin.name}
                          </CardTitle>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {plugin.category}
                          </span>
                        </div>
                      </div>

                      {isConfigurable ? (
                        <Badge
                          variant="secondary"
                          className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800 text-[10px] font-medium"
                        >
                          {plugin.parametersCount} Parámetros
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] flex items-center gap-1"
                        >
                          <Lock className="w-2.5 h-2.5" /> Próximamente
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {plugin.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5" />
                        {isConfigurable ? "Configuración disponible" : "Valores por defecto"}
                      </span>
                      {isConfigurable && (
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Configurar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : selectedPluginId === "tesoreria" ? (
        /* VISTA TESORERÍA: FORMULARIO DE PARÁMETROS DE TESORERÍA */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <button
                type="button"
                onClick={() => setSelectedPluginId(null)}
                className="flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors mb-1.5"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Volver a la galería de plugins
              </button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Tesorería & Expedientes GDE
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configuración global de motivos de observación ARCA, carátulas GDE y cuentas pagadoras BSE.
              </p>
            </div>
          </div>

          <TesoreriaParametersTab onBack={() => setSelectedPluginId(null)} />
        </div>
      ) : (
        /* VISTA 2: FORMULARIO DE PARÁMETROS DEL PLUGIN PRESTADORES */
        <div className="space-y-6">
          {/* Header con botón para volver a la galería */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <button
                type="button"
                onClick={() => setSelectedPluginId(null)}
                className="flex items-center text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors mb-1.5"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Volver a la galería de plugins
              </button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {selectedPlugin && (
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center ${selectedPlugin.bgColor}`}
                  >
                    <selectedPlugin.icon className={`w-4 h-4 ${selectedPlugin.color}`} />
                  </div>
                )}
                {selectedPlugin?.name || "Parámetros del Plugin"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configuración de parámetros para el Portal de Prestadores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? "Guardando..." : "Guardar Parámetros"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* BLOQUE 1: TOPE NORMATIVO DE TRÁMITE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Tope Normativo por Trámite / Factura
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Límite máximo permitido por comprobante individual de honorarios.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Monto Máximo Permitido ($)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={topeFacturaIn.val}
                      onChange={topeFacturaIn.onChange}
                      onBlur={topeFacturaIn.onBlur}
                      className="h-10 text-sm font-bold bg-white dark:bg-slate-900"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Valor actual configurado: <strong>{formatMoney(config.tope_maximo_factura)}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Impacto en el Portal:
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      Si un profesional intenta cargar prestaciones que supere este valor, el sistema le exigirá iniciar un nuevo formulario.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 2: ARANCELES DE GUARDIAS MÉDICAS (FORMULARIO G) */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Aranceles de Guardias Médicas (Formulario G)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Valores de referencia para liquidación de guardias presenciales de 24hs.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guardia Ordinaria - Día Hábil */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Guardia Ordinaria • Día Hábil ($)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={guardiaOrdHabilIn.val}
                      onChange={guardiaOrdHabilIn.onChange}
                      onBlur={guardiaOrdHabilIn.onBlur}
                      className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Lunes a Viernes: {formatMoney(config.valor_guardia_ordinaria_habil)}
                    </span>
                  </div>

                  {/* Guardia Ordinaria - Día Inhábil / Feriado */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Guardia Ordinaria • Inhábil / Fin de Semana / Feriado ($)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={guardiaOrdInhabilIn.val}
                      onChange={guardiaOrdInhabilIn.onChange}
                      onBlur={guardiaOrdInhabilIn.onBlur}
                      className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Sábados, Domingos y Feriados: {formatMoney(config.valor_guardia_ordinaria_inhabil)}
                    </span>
                  </div>

                  {/* Guardia Crítica - Día Hábil */}
                  <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                    <Label className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                      Guardia Crítica • Día Hábil ($)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={guardiaCritHabilIn.val}
                      onChange={guardiaCritHabilIn.onChange}
                      onBlur={guardiaCritHabilIn.onBlur}
                      className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                    <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                      Lunes a Viernes: {formatMoney(config.valor_guardia_critica_habil)}
                    </span>
                  </div>

                  {/* Guardia Crítica - Inhábil / Feriado */}
                  <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                    <Label className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                      Guardia Crítica • Inhábil / Feriado ($)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={guardiaCritInhabilIn.val}
                      onChange={guardiaCritInhabilIn.onChange}
                      onBlur={guardiaCritInhabilIn.onBlur}
                      className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                    <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                      Sábados, Domingos y Feriados: {formatMoney(config.valor_guardia_critica_inhabil)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 3: EXTENSIÓN HORARIA (FORMULARIO EH) */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Arancel de Extensión Horaria (Formulario EH)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ingresá el valor del módulo de 6 horas asistenciales. El sistema calcula y liquida automáticamente el valor proporcional por hora.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Input Principal: Módulo de 6hs */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Valor del Módulo de 6 Horas ($)</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Base 6hs
                      </span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={modulo6hsStr}
                      onChange={handleModulo6hsChange}
                      onBlur={handleModulo6hsBlur}
                      placeholder="Ej: 111000"
                      className="h-9 text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Módulo fijado: {formatMoney(config.valor_modulo_6hs_extension || (config.valor_hora_extension * 6))}
                    </span>
                  </div>

                  {/* Valor Calculado por Hora */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Valor Calculado por Hora
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        (Módulo ÷ 6 hs)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatMoney(config.valor_hora_extension)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ hora</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tarifa horaria aplicada automáticamente en cada hora de los formularios EH de los prestadores.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 4: GESTOR DE SERVICIOS Y SECTORES HOSPITALARIOS */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Servicios y Sectores Habilitados
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configurá las opciones de servicios/sectores que se desplegarán en los formularios de guardias y extensiones horarias.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input para agregar nuevo sector */}
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Nombre del nuevo servicio / sector (ej: Hemodinamia)"
                    value={nuevoSector}
                    onChange={(e) => setNuevoSector(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSector();
                      }
                    }}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSector}
                    className="h-9 px-3 text-xs bg-[#08487A] hover:bg-[#06375d] text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Agregar
                  </Button>
                </div>

                {/* Lista de pastillas/chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(config.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS).map((sec, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {editingSectorIdx === idx ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingSectorText}
                            onChange={(e) => setEditingSectorText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEditSector(idx);
                              }
                              if (e.key === "Escape") setEditingSectorIdx(null);
                            }}
                            className="h-6 w-44 text-xs px-1.5 py-0 bg-white dark:bg-slate-950"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditSector(idx)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSectorIdx(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate max-w-[200px]">{sec}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditSector(idx, sec)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-opacity"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSector(sec)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 5: CALENDARIO DE DÍAS INHÁBILES Y FERIADOS */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Calendario de Días Inhábiles y Feriados (Argentina / Santiago del Estero)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Las fechas aquí registradas se liquidan automáticamente con arancel de día inhábil cuando el prestador las selecciona en su planilla.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreDefaultFeriados}
                    className="h-7 text-[11px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restablecer Oficiales ({DEFAULT_FERIADOS_ARGENTINA_SDE.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formulario para agregar feriado / asueto local */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Agregar Feriado o Asueto Específico
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[10px] text-slate-500">Fecha</Label>
                      <Input
                        type="date"
                        value={nuevoFeriadoFecha}
                        onChange={(e) => setNuevoFeriadoFecha(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-5 space-y-1">
                      <Label className="text-[10px] text-slate-500">Motivo / Conmemoración</Label>
                      <Input
                        placeholder="Ej: Asueto Administrativo Municipal"
                        value={nuevoFeriadoMotivo}
                        onChange={(e) => setNuevoFeriadoMotivo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFeriado();
                          }
                        }}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] text-slate-500">Alcance</Label>
                      <select
                        value={nuevoFeriadoTipo}
                        onChange={(e: any) => setNuevoFeriadoTipo(e.target.value)}
                        className="h-8 w-full text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-slate-800 dark:text-slate-200"
                      >
                        <option value="nacional">Nacional</option>
                        <option value="provincial">Provincial</option>
                        <option value="asueto">Asueto</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddFeriado}
                        className="w-full h-8 text-xs bg-[#08487A] hover:bg-[#06375d] text-white"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de Feriados Configurados */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {(config.feriados_config || DEFAULT_FERIADOS_ARGENTINA_SDE).map((f) => {
                    const parts = f.fecha.split("-");
                    const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : f.fecha;
                    return (
                      <div
                        key={f.fecha}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200/60 dark:border-sky-800">
                            {dateFormatted}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {f.motivo}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                            f.tipo === "provincial"
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                              : f.tipo === "asueto"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}>
                            {f.tipo === "provincial" ? "Sgo. del Estero" : f.tipo === "asueto" ? "Asueto" : "Nacional"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeriado(f.fecha)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Eliminar feriado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SIMULADOR RÁPIDO INTERACTIVO */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Simulador de Liquidación de Prueba
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verifica en tiempo real los importes según los aranceles configurados ut supra.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Simulador Guardias */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Simular Guardias:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[11px] text-slate-500 font-medium">Cantidad:</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="1"
                          max="100"
                          value={simGuardiasIn.val}
                          onChange={simGuardiasIn.onChange}
                          onBlur={simGuardiasIn.onBlur}
                          className="h-7 w-16 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Filtros de Liquidación
                      </Label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={simTipoGuardia === "ordinaria" ? "default" : "outline"}
                          onClick={() => setSimTipoGuardia("ordinaria")}
                          className={`h-7 text-xs ${simTipoGuardia === "ordinaria" ? "bg-[#08487A] text-white hover:bg-[#06375d]" : ""}`}
                        >
                          Ordinaria
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={simTipoGuardia === "critica" ? "default" : "outline"}
                          onClick={() => setSimTipoGuardia("critica")}
                          className={`h-7 text-xs ${simTipoGuardia === "critica" ? "bg-[#08487A] text-white hover:bg-[#06375d]" : ""}`}
                        >
                          Crítica
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={simEsInhabil ? "secondary" : "outline"}
                          onClick={() => setSimEsInhabil(!simEsInhabil)}
                          className="h-7 text-xs"
                        >
                          {simEsInhabil ? "Inhábil / Feriado" : "Día Hábil"}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex flex-col">
                        <span className="text-slate-500">
                          Total {simCantGuardias || 0} {parseInt(simCantGuardias, 10) === 1 ? "guardia" : "guardias"}:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Tarifa unitaria: {formatMoney(valorUnitarioGuardia)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                        {formatMoney(totalGuardiasSimuladas)}
                      </span>
                    </div>
                  </div>

                  {/* Simulador EH */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Simular Extensión Horaria:
                    </span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-500">Cantidad de Hs:</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        min="1"
                        max="100"
                        value={simHorasIn.val}
                        onChange={simHorasIn.onChange}
                        onBlur={simHorasIn.onBlur}
                        className="h-7 w-20 text-xs font-bold"
                      />
                    </div>
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Total {simHorasEH || 0} hs:</span>
                        <span className="text-[10px] text-slate-400">
                          Equivale a {((parseFloat(simHorasEH) || 0) / 6).toFixed(2)} módulos (6hs)
                        </span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(totalEHSimulado)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * Hook interno: gestiona un input decimal con edición libre de texto.
 * - El estado del input es STRING (no derivado del number de config), por lo que
 *   el usuario puede teclear el punto decimal: 1250.50
 * - Admitir punto "." y hasta 2 dígitos decimales.
 * - Normaliza al blur (quita trailing dot, fuerza "0" si vacío) y persiste como number en config.
 * - Se sincroniza con config[key] cuando cambia externamente (fetch/reset).
 */
function useDecimalInput(
  key: keyof ConfiguracionModuloPrestadores,
  config: ConfiguracionModuloPrestadores,
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracionModuloPrestadores>>
) {
  const [val, setVal] = useState<string>(() => {
    const v = config[key];
    return typeof v === "number" ? String(v) : "";
  });

  useEffect(() => {
    const v = config[key];
    setVal(typeof v === "number" ? String(v) : "");
  }, [config[key], key]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^\d*(\.?\d{0,2})?$/.test(raw)) {
      setVal(raw);
      const num = raw === "" || raw === "." ? 0 : parseFloat(raw) || 0;
      setConfig((prev) => ({ ...prev, [key]: num }));
    }
  };

  const onBlur = () => {
    const clean = val === "" || val === "." ? "0" : val;
    setVal(clean);
    setConfig((prev) => ({ ...prev, [key]: parseFloat(clean) || 0 }));
  };

  return { val, onChange, onBlur };
}

/**
 * Hook interno: input entero libre de texto (ej. simulador de horas).
 */
function useIntegerInput(state: string, setState: (v: string) => void) {
  const [val, setVal] = useState<string>(state ?? "");
  useEffect(() => {
    setVal(state ?? "");
  }, [state]);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^\d*$/.test(raw)) {
      setVal(raw);
      setState(raw === "" ? "0" : raw);
    }
  };
  const onBlur = () => {
    const clean = val === "" ? "0" : val;
    setVal(clean);
    setState(clean);
  };
  return { val, onChange, onBlur };
}

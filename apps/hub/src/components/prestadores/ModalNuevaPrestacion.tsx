"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePickerInhabiles } from "./DatePickerInhabiles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PrestadorPerfil,
  TipoPrestacion,
  SectorServicio,
  TipoDiasPrestacion,
  TIPOS_PRESTACION_MAP,
  SECTORES_SERVICIO_MAP,
  PrestacionPresentacion,
  RenglonGuardiaDigital,
  RenglonExtensionHorariaDigital,
  FormularioDigitalData,
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
  DEFAULT_SECTORES_HABILITADOS,
  DIRECTORES_ADJUNTOS_AREAS,
} from "@/types/prestadores";
import {
  submitPrestacion,
  resubmitPrestacion,
  saveBorradorPrestacion,
  updateBorradorPrestacion,
  getNextFormNumber,
  getPerfilFileUrl,
  getPrestacionFileUrl,
  getDirectoresAdjuntosDisponibles,
} from "@/lib/services/prestadoresService";
import { getPrestadoresConfig } from "@/lib/services/parametersService";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Paperclip,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  Activity,
  CalendarClock,
  Clock,
  UserCheck,
  ClipboardList,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Eye,
} from "lucide-react";

interface ModalNuevaPrestacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PrestadorPerfil;
  tenantId: string;
  tenantCode?: string;
  onCreated: (prestacion: PrestacionPresentacion) => void;
  onOpenPerfil?: () => void;
  observadaParaReenviar?: PrestacionPresentacion | null;
  tipoInicial?: "guardia" | "extension_horaria";
}

const TIME_OPTIONS_30MIN = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function computeHoraSalida(horaEntrada: string, duracionHoras: number = 24): string {
  if (!horaEntrada) return "08:00";
  const [h, m] = horaEntrada.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "08:00";
  const safeDur = Math.max(1, Math.min(24, duracionHoras || 24));
  const totalMin = (h * 60 + m + safeDur * 60) % (24 * 60);
  const outH = Math.floor(totalMin / 60);
  const outM = totalMin % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export function ModalNuevaPrestacion({
  open,
  onOpenChange,
  perfil,
  tenantId,
  tenantCode = "CISB",
  onCreated,
  onOpenPerfil,
  observadaParaReenviar = null,
  tipoInicial = "guardia",
}: ModalNuevaPrestacionProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Tipo de Trámite
  const [serviceType, setServiceType] = useState<TipoPrestacion>(
    observadaParaReenviar
      ? (observadaParaReenviar.service_type as TipoPrestacion)
      : tipoInicial
  );

  // Sincronizar tipoInicial si cambia al abrir el modal
  useEffect(() => {
    if (open) {
      if (observadaParaReenviar) {
        setServiceType(observadaParaReenviar.service_type as TipoPrestacion);
      } else {
        setServiceType(tipoInicial);
      }
    }
  }, [open, tipoInicial, observadaParaReenviar]);

  // Período derivado automáticamente de las fechas cargadas en los renglones
  const [hospitalService, setHospitalService] = useState<string>(
    observadaParaReenviar?.hospital_service || DEFAULT_SECTORES_HABILITADOS[0]
  );

  // Configuración de aranceles y topes (dinámica desde SuperAdmin)
  const [config, setConfig] = useState<ConfiguracionModuloPrestadores>(
    DEFAULT_CONFIGURACION_PRESTADORES
  );

  // Directores Adjuntos disponibles para visar
  const [directoresDisponibles, setDirectoresDisponibles] = useState<{ id: string; nombre: string; email: string }[]>([]);

  useEffect(() => {
    if (open) {
      getPrestadoresConfig(tenantId).then((cfg) => {
        setConfig(cfg);
        const list = cfg.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS;
        if (!hospitalService || (hospitalService === "guardia_emergencias" && list.length > 0)) {
          setHospitalService(list[0]);
        }
      });

      // Cargar lista nominal de directores adjuntos
      getDirectoresAdjuntosDisponibles(tenantId).then((dirs) => {
        setDirectoresDisponibles(dirs);
        if (dirs.length > 0 && !directorAdjuntoAsignado) {
          setDirectorAdjuntoAsignado(dirs[0].id);
        }
      });
    }
  }, [open, tenantId]);

  // Campos específicos de Guardias (Formulario G)
  const [reemplazoDe, setReemplazoDe] = useState<string>("");
  const [renglonesGuardia, setRenglonesGuardia] = useState<RenglonGuardiaDigital[]>([
    {
      id: "g-1",
      fecha: "",
      hora_entrada: "08:00",
      hora_salida: "08:00",
      duracion_horas: 24,
      tipo: "normal",
    },
  ]);

  // Campos específicos de Extensión Horaria (Formulario EH)
  const [cargoEspecialidad, setCargoEspecialidad] = useState<string>(
    perfil.specialty || ""
  );
  const [renglonesEH, setRenglonesEH] = useState<RenglonExtensionHorariaDigital[]>([
    {
      id: "eh-1",
      fecha: "",
      horario_programado: "14:00 a 18:00",
      horas_cumplidas: 4,
    },
  ]);

  // ─── PERÍODO DEVENGADO AUTO-DETECTADO ───
  // Se deriva automáticamente del primer renglón con fecha cargada.
  // Todas las fechas de la planilla deben pertenecer al mismo mes/año.
  const periodoDetectado = useMemo(() => {
    const fechas = serviceType === "guardia"
      ? renglonesGuardia.map((r) => r.fecha).filter(Boolean)
      : renglonesEH.map((r) => r.fecha).filter(Boolean);

    if (fechas.length === 0) return null;

    const parts = fechas[0].split("-");
    if (parts.length !== 3) return null;

    const month = Number(parts[1]);
    const year = Number(parts[0]);
    if (!month || !year) return null;

    return { month, year };
  }, [serviceType, renglonesGuardia, renglonesEH]);

  const periodMonth = periodoDetectado?.month ?? currentMonth;
  const periodYear = periodoDetectado?.year ?? currentYear;

  const selectedMonthLabel = MESES.find((m) => m.value === periodMonth)?.label || "";

  // Validación de coherencia: todas las fechas deben pertenecer al mismo mes/año
  const fechasIncoherentes = useMemo(() => {
    if (!periodoDetectado) return false;
    const fechas = serviceType === "guardia"
      ? renglonesGuardia.map((r) => r.fecha).filter(Boolean)
      : renglonesEH.map((r) => r.fecha).filter(Boolean);

    return fechas.some((f) => {
      const p = f.split("-");
      return Number(p[1]) !== periodoDetectado.month || Number(p[0]) !== periodoDetectado.year;
    });
  }, [serviceType, renglonesGuardia, renglonesEH, periodoDetectado]);

  // Validación de superposición de turnos de guardia (Overlapping shifts detection)
  const superposicionGuardias = useMemo(() => {
    if (serviceType !== "guardia") return null;

    // Convertir cada guardia con fecha y hora en intervalos de tiempo [startMs, endMs]
    const intervalos: { index: number; start: number; end: number; fecha: string; duracion: number }[] = [];

    for (let i = 0; i < renglonesGuardia.length; i++) {
      const r = renglonesGuardia[i];
      if (!r.fecha || !r.hora_entrada) continue;

      const [h, m] = r.hora_entrada.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) continue;

      const dur = Math.max(1, Math.min(24, Number(r.duracion_horas) || 24));
      // Parsear fecha de inicio en hora local
      const [year, month, day] = r.fecha.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, h, m, 0, 0);
      const startMs = startDate.getTime();
      const endMs = startMs + dur * 60 * 60 * 1000;

      intervalos.push({
        index: i + 1,
        start: startMs,
        end: endMs,
        fecha: r.fecha,
        duracion: dur,
      });
    }

    // Verificar si algún par de intervalos se superpone
    for (let i = 0; i < intervalos.length; i++) {
      for (let j = i + 1; j < intervalos.length; j++) {
        const a = intervalos[i];
        const b = intervalos[j];
        // Dos intervalos [a.start, a.end] y [b.start, b.end] se superponen si a.start < b.end && b.start < a.end
        if (a.start < b.end && b.start < a.end) {
          return {
            guardiaA: a.index,
            guardiaB: b.index,
            mensaje: `Los horarios de la Guardia #${a.index} y la Guardia #${b.index} se superponen en el tiempo.`
          };
        }
      }
    }

    return null;
  }, [serviceType, renglonesGuardia]);

  // Observaciones comunes
  const [observaciones, setObservaciones] = useState<string>("");

  // Factura Única (Nuevo paradigma: 1 Formulario = 1 Factura)
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    observadaParaReenviar ? (observadaParaReenviar.invoice_number || "") : ""
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    if (!observadaParaReenviar?.invoice_date) return "";
    return observadaParaReenviar.invoice_date.split("T")[0].split(" ")[0];
  });
  const [invoiceAmount, setInvoiceAmount] = useState<string>(
    observadaParaReenviar?.invoice_amount ? String(observadaParaReenviar.invoice_amount) : ""
  );
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Director Adjunto asignado para visar la presentación
  const [directorAdjuntoAsignado, setDirectorAdjuntoAsignado] = useState<string>(
    observadaParaReenviar?.director_adjunto_asignado || ""
  );

  // Es una subsanación de observación fiscal originada por Tesorería
  const esObservacionTesoreria = useMemo(() => {
    return Boolean(
      observadaParaReenviar &&
      (observadaParaReenviar.status === "observado_tesoreria" ||
       observadaParaReenviar.origen_observacion === "tesoreria")
    );
  }, [observadaParaReenviar]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingBorrador, setIsSavingBorrador] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Validación de Conducta Fiscal desde el Perfil
  const estadoConducta = useMemo(() => {
    if (!perfil.file_conducta_fiscal || !perfil.conducta_fiscal_due_date) {
      return {
        valida: false,
        faltaArchivo: !perfil.file_conducta_fiscal,
        mensaje: !perfil.file_conducta_fiscal
          ? "Falta adjuntar tu Constancia de Conducta Fiscal"
          : "No has configurado la fecha de vencimiento de tu Conducta Fiscal",
        detalle: "Para poder presentar liquidaciones, es requisito normativo adjuntar la constancia de Conducta Fiscal DGR vigente en tu perfil.",
      };
    }

    const dateOnly = perfil.conducta_fiscal_due_date.split(" ")[0].split("T")[0];
    const parts = dateOnly.split("-");
    if (parts.length !== 3) {
      return {
        valida: false,
        mensaje: "Fecha de vencimiento de Conducta Fiscal no válida.",
        detalle: "Actualizá tu perfil de prestador en Mis Datos.",
      };
    }

    const dueDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dueDate.getTime())) {
      return {
        valida: false,
        mensaje: "Fecha de vencimiento de Conducta Fiscal no válida.",
        detalle: "Actualizá tu perfil de prestador en Mis Datos.",
      };
    }

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDue = `${parts[2]}/${parts[1]}/${parts[0]}`;

    if (diffDays < 0) {
      return {
        valida: false,
        vencida: true,
        mensaje: `Tu Conducta Fiscal está VENCIDA (${formattedDue})`,
        detalle: "Debés renovar y adjuntar la constancia vigente en Mis Datos para poder presentar liquidaciones.",
      };
    }

    return {
      valida: true,
      mensaje: `Conducta Fiscal vigente hasta el ${formattedDue}`,
      detalle: diffDays <= 7 ? `⚠️ Vence en ${diffDays} días` : "Documentación tributaria al día",
    };
  }, [perfil.conducta_fiscal_due_date, perfil.file_conducta_fiscal]);

  // Inicializar o resetear estado según sea una edición/corrección o una nueva presentación
  useEffect(() => {
    if (!open) return;

    if (observadaParaReenviar) {
      // Modo Edición / Corrección / Retoma de Borrador
      setInvoiceNumber(observadaParaReenviar.invoice_number || "");
      const rawDate = observadaParaReenviar.invoice_date || "";
      const cleanDate = rawDate ? rawDate.split("T")[0].split(" ")[0] : "";
      setInvoiceDate(cleanDate);
      setInvoiceAmount(observadaParaReenviar.invoice_amount ? String(observadaParaReenviar.invoice_amount) : "");
      setInvoiceFile(null);
      if (observadaParaReenviar.hospital_service) {
        setHospitalService(observadaParaReenviar.hospital_service);
      }

      if (observadaParaReenviar.digital_form_data) {
        try {
          const raw =
            typeof observadaParaReenviar.digital_form_data === "string"
              ? JSON.parse(observadaParaReenviar.digital_form_data)
              : observadaParaReenviar.digital_form_data;

          if (raw.tipo_formulario === "guardia") {
            setReemplazoDe(raw.reemplazo_de || "");
            setObservaciones(raw.observaciones || "");
            if (raw.renglones && raw.renglones.length > 0) {
              setRenglonesGuardia(raw.renglones);
            }
          } else if (raw.tipo_formulario === "extension_horaria") {
            setCargoEspecialidad(raw.cargo_especialidad || perfil.specialty || "");
            setObservaciones(raw.observaciones || "");
            if (raw.renglones && raw.renglones.length > 0) {
              setRenglonesEH(raw.renglones);
            }
          }
        } catch (e) {
          console.error("Error parsing digital form data:", e);
        }
      }
    } else {
      // Modo Nueva Presentación desde cero: resetear absolutamente todos los campos
      setInvoiceNumber("");
      setInvoiceDate("");
      setInvoiceAmount("");
      setInvoiceFile(null);
      setObservaciones("");
      setReemplazoDe("");
      setCargoEspecialidad(perfil.specialty || "");

      // Resetear planilla de Guardia a 1 fila vacía
      setRenglonesGuardia([
        {
          id: `g-${Date.now()}`,
          fecha: "",
          hora_entrada: "08:00",
          hora_salida: "08:00",
          duracion_horas: 24,
          tipo: "normal",
        },
      ]);

      // Resetear planilla de Extensión Horaria a 1 fila vacía
      setRenglonesEH([
        {
          id: `eh-${Date.now()}`,
          fecha: "",
          horario_programado: "14:00 a 18:00",
          horas_cumplidas: 4,
        },
      ]);
    }
  }, [open, observadaParaReenviar, perfil]);

  // Handlers para renglones de Guardias
  const handleAddRenglonGuardia = () => {
    if (montoSugerido >= maxTopeAutorizado) {
      toast.error("Tope máximo alcanzado: Para liquidar prestaciones adicionales, genera una nueva presentación con otra factura.");
      return;
    }
    if (renglonesGuardia.length >= 20) {
      toast.error("El formulario oficial admite hasta 20 guardias por planilla.");
      return;
    }
    setRenglonesGuardia((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        fecha: "",
        hora_entrada: "08:00",
        hora_salida: "08:00",
        duracion_horas: 24,
        tipo: "normal",
      },
    ]);
  };

  const handleRemoveRenglonGuardia = (id: string) => {
    if (renglonesGuardia.length <= 1) return;
    setRenglonesGuardia((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRenglonGuardia = (
    id: string,
    field: keyof RenglonGuardiaDigital,
    value: any
  ) => {
    setRenglonesGuardia((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "hora_entrada" || field === "duracion_horas") {
          let duracion = field === "duracion_horas" ? Number(value) : Number(updated.duracion_horas || 24);
          if (isNaN(duracion) || duracion <= 0) duracion = 1;
          if (duracion > 24) duracion = 24;
          const entrada = field === "hora_entrada" ? value : updated.hora_entrada;
          updated.duracion_horas = duracion;
          updated.hora_entrada = entrada;
          updated.hora_salida = computeHoraSalida(entrada, duracion);
        }
        return updated;
      })
    );
  };

  // Handlers para renglones de Extensión Horaria
  const handleAddRenglonEH = () => {
    if (montoSugerido >= maxTopeAutorizado) {
      toast.error("Tope máximo alcanzado: Para liquidar prestaciones adicionales, genera una nueva presentación con otra factura.");
      return;
    }
    if (renglonesEH.length >= 25) {
      toast.error("El formulario oficial admite hasta 25 registros por planilla.");
      return;
    }
    setRenglonesEH((prev) => [
      ...prev,
      {
        id: `eh-${Date.now()}`,
        fecha: "",
        horario_programado: "14:00 a 18:00",
        horas_cumplidas: 4,
      },
    ]);
  };

  const handleRemoveRenglonEH = (id: string) => {
    if (renglonesEH.length <= 1) return;
    setRenglonesEH((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRenglonEH = (
    id: string,
    field: keyof RenglonExtensionHorariaDigital,
    value: any
  ) => {
    setRenglonesEH((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Solo se permiten comprobantes en formato PDF");
        e.target.value = "";
        setInvoiceFile(null);
        return;
      }
      // Limitar a 3MB como máximo para optimización de almacenamiento
      const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
      if (file.size > MAX_BYTES) {
        toast.error(`El archivo supera el límite de 3MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Por favor comprime o sube una versión más liviana.`);
        e.target.value = "";
        setInvoiceFile(null);
        return;
      }
      setInvoiceFile(file);
      toast.success(`Archivo "${file.name}" cargado (${(file.size / 1024).toFixed(0)} KB)`);
    }
  };

  // Cálculo de totales y montos sugeridos según aranceles vigentes
  const totalHorasEH = renglonesEH.reduce(
    (sum, r) => sum + (Number(r.horas_cumplidas) || 0),
    0
  );

  // Helper para determinar si una fecha es inhábil (Fin de semana o Feriado configurado)
  const isFechaInhabil = useMemo(() => {
    return (fechaStr: string) => {
      if (!fechaStr) return { isInhabil: false, motivo: "" };
      const d = new Date(`${fechaStr}T12:00:00`);
      const dayOfWeek = d.getDay();
      const isFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
      const feriadoMatch = config.feriados_config?.find(f => f.fecha === fechaStr);

      if (feriadoMatch) {
        return { isInhabil: true, motivo: `Feriado: ${feriadoMatch.motivo}` };
      }
      if (isFinDeSemana) {
        return { isInhabil: true, motivo: dayOfWeek === 0 ? "Domingo" : "Sábado" };
      }
      return { isInhabil: false, motivo: "Día Hábil" };
    };
  }, [config.feriados_config]);

  const montoSugerido = useMemo(() => {
    if (serviceType === "guardia") {
      return renglonesGuardia.reduce((sum, g) => {
        if (!g.fecha) return sum;
        const { isInhabil } = isFechaInhabil(g.fecha);
        const horas = Math.max(1, Math.min(24, Number(g.duracion_horas) || 24));
        let valor24hs = 0;
        if (g.tipo === "critica") {
          valor24hs = isInhabil ? config.valor_guardia_critica_inhabil : config.valor_guardia_critica_habil;
        } else {
          valor24hs = isInhabil ? config.valor_guardia_ordinaria_inhabil : config.valor_guardia_ordinaria_habil;
        }
        const valorHora = valor24hs / 24;
        return sum + (valorHora * horas);
      }, 0);
    } else {
      return totalHorasEH * config.valor_hora_extension;
    }
  }, [serviceType, renglonesGuardia, totalHorasEH, config, isFechaInhabil]);

  // Generación dinámica del concepto para facturación oficial
  const conceptoSugerido = useMemo(() => {
    const mesNombre = selectedMonthLabel || (periodMonth ? MESES.find(m => m.value === periodMonth)?.label : "");
    const periodoTxt = mesNombre && periodYear ? `${mesNombre} ${periodYear}` : "";
    const sectorTxt = hospitalService ? `Servicio de ${hospitalService}` : "Servicio Médico";

    if (serviceType === "guardia") {
      const guardiasConFecha = renglonesGuardia.filter(g => g.fecha);
      if (guardiasConFecha.length === 0) {
        return `Honorarios por Guardias Médicas, ${sectorTxt}${periodoTxt ? `, Período ${periodoTxt}` : ""}.`;
      }
      
      // Ordenar fechas cronológicamente
      const diasDetalle = guardiasConFecha.map(g => {
        const parts = g.fecha.split("-");
        const dia = parts.length === 3 ? parts[2] : g.fecha;
        const dur = Math.max(1, Math.min(24, Number(g.duracion_horas) || 24));
        const tipoLabel = g.tipo === "critica" ? "Crítica" : "Ord.";
        return `${dia}/${parts[1]} (${dur}hs ${tipoLabel})`;
      }).join(", ");

      const totalHs = guardiasConFecha.reduce((acc, g) => acc + Math.max(1, Math.min(24, Number(g.duracion_horas) || 24)), 0);

      return `Honorarios por Guardias Médicas (${totalHs} hs en total): días ${diasDetalle}. ${sectorTxt}, Período ${periodoTxt}.`;
    } else {
      const ehConFecha = renglonesEH.filter(r => r.fecha);
      if (ehConFecha.length === 0) {
        return `Honorarios por Extensión Horaria (${totalHorasEH} hs), ${sectorTxt}${periodoTxt ? `, Período ${periodoTxt}` : ""}.`;
      }

      const diasDetalle = ehConFecha.map(r => {
        const parts = r.fecha.split("-");
        const dia = parts.length === 3 ? parts[2] : r.fecha;
        return `${dia}/${parts[1]} (${r.horas_cumplidas}hs)`;
      }).join(", ");

      return `Honorarios por Extensión Horaria (${totalHorasEH} hs en total): días ${diasDetalle}. ${sectorTxt}, Período ${periodoTxt}.`;
    }
  }, [serviceType, renglonesGuardia, renglonesEH, totalHorasEH, hospitalService, selectedMonthLabel, periodMonth, periodYear]);

  const maxTopeAutorizado = config.tope_maximo_factura || 800000;
  const topeAlcanzado = montoSugerido >= maxTopeAutorizado;
  const numInvoiceAmount = parseFloat(invoiceAmount) || 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Guardar como Borrador (sin número de formulario oficial y sin exigir factura completa)
  const handleSaveBorrador = async () => {
    setIsSavingBorrador(true);

    let digitalFormData: FormularioDigitalData;
    let summaryDaysDetail = "";

    if (serviceType === "guardia") {
      digitalFormData = {
        tipo_formulario: "guardia",
        reemplazo_de: reemplazoDe.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesGuardia,
      };
      summaryDaysDetail = renglonesGuardia
        .map((g) => `${g.fecha ? g.fecha.split("-").slice(1).reverse().join("/") : "s/f"} (${g.duracion_horas || 24}hs: ${g.hora_entrada}-${g.hora_salida} ${g.tipo === "critica" ? "Crítica" : "Ordinaria"})`)
        .join(", ");
    } else {
      digitalFormData = {
        tipo_formulario: "extension_horaria",
        cargo_especialidad: cargoEspecialidad.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesEH,
      };
      summaryDaysDetail = renglonesEH
        .map((eh) => `${eh.fecha ? eh.fecha.split("-").slice(1).reverse().join("/") : "s/f"} (${eh.horas_cumplidas} hs - ${eh.horario_programado})`)
        .join(", ");
    }

    try {
      const formData = new FormData();
      formData.append("tenant", tenantId);
      formData.append("period_month", String(periodMonth));
      formData.append("period_year", String(periodYear));
      formData.append("form_number", ""); // Vacío en borrador
      formData.append("invoice_number", invoiceNumber.trim());
      formData.append("invoice_date", invoiceDate ? invoiceDate.trim() : "");
      formData.append("invoice_amount", String(numInvoiceAmount || montoSugerido));
      formData.append("service_type", serviceType);
      formData.append("hospital_service", hospitalService);
      formData.append("service_days_type", "dias_especificos");
      formData.append("service_days_detail", summaryDaysDetail);
      formData.append("digital_form_data", JSON.stringify(digitalFormData));
      if (perfil.conducta_fiscal_due_date) {
        formData.append("conducta_fiscal_due_date", perfil.conducta_fiscal_due_date);
      }

      if (invoiceFile) {
        formData.append("file_invoice", invoiceFile);
      }

      let result: PrestacionPresentacion;
      if (observadaParaReenviar && observadaParaReenviar.status === "borrador") {
        result = await updateBorradorPrestacion(observadaParaReenviar.id, formData);
        toast.success("Borrador actualizado exitosamente");
      } else {
        result = await saveBorradorPrestacion(formData);
        toast.success("Planilla guardada como borrador");
      }

      onCreated(result);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar borrador");
    } finally {
      setIsSavingBorrador(false);
    }
  };

  // Validación y confirmación
  const handlePromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Validar Conducta Fiscal
    if (!estadoConducta.valida) {
      toast.error(estadoConducta.mensaje, {
        description: estadoConducta.detalle,
        action: onOpenPerfil ? {
          label: "Ir a Mis Datos",
          onClick: () => {
            onOpenChange(false);
            onOpenPerfil();
          },
        } : undefined,
        duration: 8000,
      });
      return;
    }

    // 1. Validar Coherencia de Período
    if (fechasIncoherentes) {
      toast.error("Todas las fechas de la planilla deben corresponder al mismo mes y año devengado.");
      return;
    }

    // 1.1 Validar Superposición de Guardias
    if (superposicionGuardias) {
      toast.error(superposicionGuardias.mensaje);
      return;
    }

    // 2. Validar Asistencia Digital
    if (serviceType === "guardia") {
      if (renglonesGuardia.length === 0) {
        toast.error("Debes registrar al menos una guardia en la planilla digital.");
        return;
      }
      for (let i = 0; i < renglonesGuardia.length; i++) {
        const r = renglonesGuardia[i];
        if (!r.fecha) {
          toast.error(`Selecciona la fecha para la Guardia #${i + 1}`);
          return;
        }
        if (!r.hora_entrada || !r.hora_salida) {
          toast.error(`Ingresa horario de entrada y salida para la Guardia #${i + 1}`);
          return;
        }
      }
    } else {
      if (renglonesEH.length === 0) {
        toast.error("Debes registrar al menos un día en la planilla digital.");
        return;
      }
      for (let i = 0; i < renglonesEH.length; i++) {
        const r = renglonesEH[i];
        if (!r.fecha) {
          toast.error(`Selecciona la fecha para el Registro #${i + 1}`);
          return;
        }
        if (!r.horas_cumplidas || Number(r.horas_cumplidas) <= 0) {
          toast.error(`Ingresa las horas cumplidas para el Registro #${i + 1}`);
          return;
        }
      }
    }

    // 2. Validar Factura Única
    if (!invoiceNumber.trim()) {
      toast.error("Ingresa el número de tu comprobante fiscal");
      return;
    }
    if (!invoiceDate) {
      toast.error("Ingresa la fecha de emisión de la factura");
      return;
    }
    if (numInvoiceAmount <= 0) {
      toast.error("Ingresa un importe válido mayor a $0");
      return;
    }
    if (numInvoiceAmount > maxTopeAutorizado) {
      toast.error(`Tope máximo alcanzado: Para liquidar prestaciones adicionales, genera una nueva presentación con otra factura.`);
      return;
    }
    // Si no es una edición con archivo preexistente en PocketBase, el PDF es estrictamente obligatorio
    const tieneArchivoPrevio = Boolean(observadaParaReenviar?.file_invoice);
    if (!invoiceFile && !tieneArchivoPrevio) {
      toast.error("Debes adjuntar obligatoriamente el archivo PDF de la Factura");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    // Preparar objeto de formulario digital oficial
    let digitalFormData: FormularioDigitalData;
    let summaryDaysDetail = "";

    if (serviceType === "guardia") {
      digitalFormData = {
        tipo_formulario: "guardia",
        reemplazo_de: reemplazoDe.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesGuardia,
      };
      summaryDaysDetail = renglonesGuardia
        .map((g) => `${g.fecha.split("-").slice(1).reverse().join("/")} (${g.duracion_horas || 24}hs: ${g.hora_entrada}-${g.hora_salida} ${g.tipo === "critica" ? "Crítica" : "Ordinaria"})`)
        .join(", ");
    } else {
      digitalFormData = {
        tipo_formulario: "extension_horaria",
        cargo_especialidad: cargoEspecialidad.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        renglones: renglonesEH,
      };
      summaryDaysDetail = renglonesEH
        .map((eh) => `${eh.fecha.split("-").slice(1).reverse().join("/")} (${eh.horas_cumplidas} hs - ${eh.horario_programado})`)
        .join(", ");
    }

    try {
      // Generar serie oficial en el momento exacto del submit
      const generatedFormNumber =
        observadaParaReenviar?.form_number ||
        (await getNextFormNumber(
          serviceType === "guardia" ? "guardia" : "extension_horaria",
          tenantCode
        ));

      const formData = new FormData();
      formData.append("tenant", tenantId);
      formData.append("period_month", String(periodMonth));
      formData.append("period_year", String(periodYear));
      formData.append("form_number", generatedFormNumber);
      formData.append("invoice_number", invoiceNumber.trim());
      formData.append("invoice_date", invoiceDate);
      formData.append("invoice_amount", String(numInvoiceAmount));
      formData.append("service_type", serviceType);
      formData.append("hospital_service", hospitalService);
      formData.append("director_adjunto_asignado", directorAdjuntoAsignado);
      formData.append("service_days_type", "dias_especificos");
      formData.append("service_days_detail", summaryDaysDetail);
      formData.append("digital_form_data", JSON.stringify(digitalFormData));
      formData.append(
        "conducta_fiscal_due_date",
        perfil.conducta_fiscal_due_date || new Date().toISOString()
      );

      if (invoiceFile) {
        formData.append("file_invoice", invoiceFile);
      }

      let result: PrestacionPresentacion;
      if (observadaParaReenviar) {
        result = await resubmitPrestacion(observadaParaReenviar.id, formData);
        if (esObservacionTesoreria) {
          toast.success("Corrección fiscal reenviada exitosamente. El trámite volvió directamente a Tesorería.");
        } else {
          toast.success("Corrección reenviada a Dirección para revisión exitosamente.");
        }
      } else {
        result = await submitPrestacion(formData);
        toast.success(`Trámite ${generatedFormNumber} presentado ante Dirección con éxito`);
      }

      onCreated(result);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la presentación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    serviceType === "guardia"
                      ? "bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400"
                      : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {serviceType === "guardia" ? (
                    <Activity className="w-5 h-5" />
                  ) : (
                    <CalendarClock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {serviceType === "guardia"
                      ? "Formulario Único de Guardias (G)"
                      : "Formulario Único de Extensión Horaria (EH)"}
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {serviceType === "guardia"
                      ? "Solicitud y certificación de guardias médicas activas"
                      : "Solicitud y certificación de horas asistenciales adicionales"}
                  </p>
                </div>
              </div>

              {/* Badges de Serie y Tipo */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {observadaParaReenviar?.form_number ? (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Nº Serie:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                      {observadaParaReenviar.form_number}
                    </span>
                  </div>
                ) : null}
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                    serviceType === "guardia"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800"
                  }`}
                >
                  {serviceType === "guardia" ? "Formulario G" : "Formulario EH"}
                </span>
              </div>
            </div>
          </DialogHeader>

          {(observadaParaReenviar?.director_observation || observadaParaReenviar?.treasury_observation) && (
            <div className={`my-2 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              observadaParaReenviar.status === "observado_tesoreria" || observadaParaReenviar.origen_observacion === "tesoreria"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                observadaParaReenviar.status === "observado_tesoreria" ? "text-amber-600" : "text-rose-600"
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between font-bold mb-0.5">
                  <span>
                    {observadaParaReenviar.status === "observado_tesoreria" || observadaParaReenviar.origen_observacion === "tesoreria"
                      ? "Motivo de Observación de Tesorería (Comprobante / Datos):"
                      : "Motivo de Observación de Dirección (Asistencial):"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 border border-slate-200 dark:border-slate-700">
                    {observadaParaReenviar.status === "observado_tesoreria" ? "Retorno directo a Tesorería" : "Revisión Dirección"}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {observadaParaReenviar.director_observation || observadaParaReenviar.treasury_observation}
                </p>
                <p className="mt-1.5 text-[11px] font-medium opacity-90 italic">
                  💡 Modifica los campos señalados y pulsa &quot;Reenviar Corrección&quot; para continuar el circuito.
                </p>
              </div>
            </div>
          )}

          {!estadoConducta.valida ? (
            <div className="my-4 py-8 px-6 flex flex-col items-center justify-center text-center bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-4 animate-in fade-in-50">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-7 h-7 stroke-[1.75]" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                  {estadoConducta.mensaje}
                </h3>
                <p className="text-xs text-rose-700/90 dark:text-rose-300 leading-relaxed">
                  {estadoConducta.detalle}
                </p>
              </div>

              {onOpenPerfil && (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenPerfil();
                  }}
                  className="h-9 px-4 text-xs font-semibold bg-[#08487A] hover:bg-[#06375d] text-white shadow-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Ir a "Mis Datos" para adjuntar / renovar Conducta Fiscal
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handlePromptConfirm} className="space-y-4 py-2 text-left">
              {/* ESTADO DINÁMICO DE CONDUCTA FISCAL */}
              <div className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">{estadoConducta.mensaje}</span>
                    <span className="text-[11px] opacity-85">{estadoConducta.detalle}</span>
                  </div>
                </div>

                {perfil.file_conducta_fiscal && (
                  <a
                    href={getPerfilFileUrl(perfil, perfil.file_conducta_fiscal)}
                    target="_blank"
                    rel="noreferrer"
                    className="h-7 px-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-semibold shrink-0 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver PDF
                  </a>
                )}
              </div>

            {/* SECCIÓN 1: DETALLE DE PRESENTACIÓN */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Período y Sector Asistencial
              </h4>

              {/* Período Devengado Auto-Detectado */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Período Devengado
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {periodoDetectado ? `${selectedMonthLabel} ${periodYear}` : "Pendiente de fecha"}
                    </span>
                    {periodoDetectado ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Auto-detectado
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        (se definirá con la 1ª fecha cargada)
                      </span>
                    )}
                  </div>
                </div>

                {fechasIncoherentes && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Fechas de meses distintos
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Servicio / Sector Hospitalario
                </Label>
                <Select
                  value={hospitalService}
                  onValueChange={(val: string) => setHospitalService(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    {(config.sectores_habilitados || DEFAULT_SECTORES_HABILITADOS).map((sec) => (
                      <SelectItem key={sec} value={sec} className="text-xs">
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo específico según formulario */}
              {serviceType === "guardia" ? (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    En Reemplazo De (Opcional)
                  </Label>
                  <Input
                    placeholder="Ej. Dr. Juan Pérez (si corresponde)"
                    value={reemplazoDe}
                    onChange={(e) => setReemplazoDe(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Cargo / Función / Especialidad
                  </Label>
                  <Input
                    placeholder="Ej. Médico Consultorios Externos / Cirujano Asistencial"
                    value={cargoEspecialidad}
                    onChange={(e) => setCargoEspecialidad(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 2: PLANILLA DE ASISTENCIA Y CÁLCULO DE ARANCELES */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
                  Planilla de Asistencia ({serviceType === "guardia" ? "Guardias Médicas" : "Extensión Horaria"})
                </h4>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={topeAlcanzado}
                  onClick={serviceType === "guardia" ? handleAddRenglonGuardia : handleAddRenglonEH}
                  className={`h-7 text-xs bg-white dark:bg-slate-900 transition-colors ${
                    topeAlcanzado
                      ? "opacity-50 cursor-not-allowed border-slate-300 text-slate-400"
                      : "border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50"
                  }`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {serviceType === "guardia" ? "Agregar Guardia" : "Agregar Registro"}
                </Button>
              </div>

              {topeAlcanzado && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in-50">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Tope máximo alcanzado:</strong> Para liquidar prestaciones adicionales, genera una nueva presentación con otra factura.
                  </span>
                </div>
              )}

              {superposicionGuardias && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in-50">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>
                    <strong>Conflicto de Horarios:</strong> {superposicionGuardias.mensaje} Por favor corrige la fecha, hora de entrada o duración.
                  </span>
                </div>
              )}

              {/* Renglones Formulario G */}
              {serviceType === "guardia" ? (
                <div className="space-y-2.5">
                  {renglonesGuardia.map((r, index) => {
                    const dur = Math.max(1, Math.min(24, Number(r.duracion_horas) || 24));
                    return (
                    <div
                      key={r.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            Guardia #{index + 1}
                          </span>
                        </div>

                        {/* Switch de Complejidad */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleUpdateRenglonGuardia(r.id, "tipo", "normal")}
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                              r.tipo === "normal"
                                ? "bg-white dark:bg-slate-900 text-[#08487A] dark:text-sky-400 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Ordinaria
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateRenglonGuardia(r.id, "tipo", "critica")}
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                              r.tipo === "critica"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Crítica
                          </button>
                        </div>

                        {renglonesGuardia.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRenglonGuardia(r.id)}
                            className="h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md shrink-0"
                            title="Eliminar guardia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                        {/* Fecha con sombreado de Feriados e Inhábiles */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-500">Fecha de Inicio</Label>
                          <DatePickerInhabiles
                            value={r.fecha}
                            onChange={(val) => handleUpdateRenglonGuardia(r.id, "fecha", val)}
                            feriados={config.feriados_config}
                            placeholder="Elegir fecha"
                          />
                        </div>

                        {/* Duración en Horas (Tope 24hs) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-semibold text-slate-500">Duración (hs)</Label>
                            <span className="text-[9px] text-slate-400 font-medium">máx 24</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={24}
                              step={1}
                              value={r.duracion_horas || 24}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleUpdateRenglonGuardia(r.id, "duracion_horas", val);
                              }}
                              className="h-8 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                              required
                            />
                            <span className="text-[11px] font-semibold text-slate-400">hs</span>
                          </div>
                        </div>

                        {/* Hora Entrada (fracciones de 30 min) */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-500">Entrada</Label>
                          <Select
                            value={r.hora_entrada}
                            onValueChange={(val) => handleUpdateRenglonGuardia(r.id, "hora_entrada", val)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-950">
                              <SelectValue placeholder="Entrada" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56 dark:bg-slate-900">
                              {TIME_OPTIONS_30MIN.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t} hs
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Hora Salida (Autocalculada) */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-500">Salida (Calculada)</Label>
                          <div className="h-8 px-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span>{r.hora_salida || computeHoraSalida(r.hora_entrada, dur)} hs</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {dur === 24 ? "+1 d" : `+${dur}hs`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                /* Renglones Formulario EH */
                <div className="space-y-2">
                  {renglonesEH.map((r, index) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-5 shrink-0">
                        #{index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px] text-slate-400 sm:hidden">Fecha</Label>
                          <DatePickerInhabiles
                            value={r.fecha}
                            onChange={(val) => handleUpdateRenglonEH(r.id, "fecha", val)}
                            feriados={config.feriados_config}
                            placeholder="Elegir fecha"
                          />
                        </div>

                        <div>
                          <Input
                            placeholder="Ej. 14:00 a 18:00"
                            value={r.horario_programado}
                            onChange={(e) => handleUpdateRenglonEH(r.id, "horario_programado", e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            value={r.horas_cumplidas}
                            onChange={(e) => handleUpdateRenglonEH(r.id, "horas_cumplidas", Number(e.target.value) || 0)}
                            className="h-8 text-xs font-bold bg-slate-50 dark:bg-slate-950 w-20"
                            required
                          />
                          <span className="text-[11px] text-slate-500">horas</span>
                        </div>
                      </div>

                      {renglonesEH.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRenglonEH(r.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Observaciones de la planilla (Opcional)
                </Label>
                <Textarea
                  placeholder="Información adicional o justificaciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 min-h-[50px]"
                />
              </div>
            </div>

            {/* SECCIÓN: FACTURACIÓN AFIP (1 FACTURA = 1 FORMULARIO) */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  Factura Electrónica (ARCA)
                </h4>
              </div>

              {/* Banner de Total y Concepto Calculado para emisión en ARCA/AFIP */}
              {montoSugerido > 0 && (
                <div className="p-3.5 bg-gradient-to-br from-sky-50/90 via-indigo-50/60 to-slate-50 dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-sky-200/80 dark:border-sky-800/80 rounded-xl space-y-2.5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                          Total liquidable s/ aranceles vigentes:
                        </span>
                        <p className="text-base font-extrabold text-[#08487A] dark:text-sky-300">
                          {formatMoney(montoSugerido)}
                        </p>
                      </div>
                    </div>

                    {!invoiceAmount && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setInvoiceAmount(String(montoSugerido))}
                        className="h-7 text-xs px-2.5 bg-sky-200/80 hover:bg-sky-300 text-sky-800 dark:bg-sky-900 dark:text-sky-200 font-semibold"
                      >
                        Copiar Monto
                      </Button>
                    )}
                  </div>

                  {/* Concepto Sugerido para copiar y pegar en la factura */}
                  <div className="pt-2 border-t border-sky-100 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-sky-100 dark:border-slate-800">
                    <div className="space-y-0.5 flex-1 pr-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-sky-600" /> Concepto sugerido para tu factura ARCA:
                      </span>
                      <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 select-all leading-snug">
                        {conceptoSugerido}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(conceptoSugerido);
                        toast.success("Concepto copiado al portapapeles");
                      }}
                      className="h-7 text-[11px] px-2.5 shrink-0 bg-white dark:bg-slate-900 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 font-semibold"
                    >
                      Copiar Concepto
                    </Button>
                  </div>
                </div>
              )}

              {/* Formulario de Factura Única */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      N° de Factura <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="00001-00001234"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Fecha Emisión <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Monto ($) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 450000"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      className="h-9 text-xs font-semibold bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      PDF de la Factura <span className="text-rose-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Máx. 3 MB)</span>
                    </Label>
                    {invoiceFile ? (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Nuevo archivo: {invoiceFile.name} ({(invoiceFile.size / 1024).toFixed(0)} KB)
                      </span>
                    ) : null}
                  </div>

                  {/* Si ya hay un archivo previo en la presentación observada y no se ha seleccionado uno nuevo */}
                  {!invoiceFile && observadaParaReenviar?.file_invoice && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {observadaParaReenviar.file_invoice}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Archivo de factura original cargado (se mantendrá si no subes uno nuevo)
                          </p>
                        </div>
                      </div>
                      <a
                        href={getPrestacionFileUrl(observadaParaReenviar, observadaParaReenviar.file_invoice)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 rounded-lg hover:bg-sky-50 shadow-2xs shrink-0 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver Factura
                      </a>
                    </div>
                  )}

                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleInvoiceFileChange}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {observadaParaReenviar?.file_invoice
                      ? "Si necesitas corregir o reemplazar el comprobante fiscal, selecciona un nuevo archivo PDF aquí."
                      : "Solo comprobantes fiscales oficiales emitidos por AFIP / ARCA en formato .pdf"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isSavingBorrador}
                className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </Button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveBorrador}
                  disabled={isSubmitting || isSavingBorrador || !estadoConducta.valida}
                  className="w-full sm:w-auto text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs"
                >
                  {isSavingBorrador ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </span>
                  ) : (
                    "Guardar como Borrador"
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || isSavingBorrador || !estadoConducta.valida || fechasIncoherentes}
                  className="w-full sm:w-auto text-xs font-semibold bg-[#08487A] hover:bg-[#06375d] text-white shadow-sm transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando a Dirección...
                    </span>
                  ) : observadaParaReenviar && (observadaParaReenviar.status === "observado" || observadaParaReenviar.status === "observado_tesoreria") ? (
                    "Reenviar Corrección"
                  ) : (
                    "Enviar a Dirección"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN PREVIA */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {observadaParaReenviar && (observadaParaReenviar.status === "observado" || observadaParaReenviar.status === "observado_tesoreria")
                ? "¿Confirmar reenvío de corrección?"
                : "¿Confirmar envío a Dirección?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              Verifica el resumen de tu presentación antes de remitirla formalmente para su control y visado:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Trámite:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {serviceType === "guardia"
                  ? "Formulario G (Guardias Médicas)"
                  : "Formulario EH (Extensión Horaria)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Período:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedMonthLabel} {periodYear}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Servicio / Sector:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {SECTORES_SERVICIO_MAP[hospitalService as SectorServicio] || hospitalService}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {serviceType === "guardia" ? "Guardias Registradas:" : "Horas Asistenciales:"}
              </span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {serviceType === "guardia"
                  ? `${renglonesGuardia.length} guardias activas`
                  : `${totalHorasEH} hs en ${renglonesEH.length} días`}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Factura Comprobante:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                N° {invoiceNumber}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Monto Total Facturado:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatMoney(numInvoiceAmount)}
              </span>
            </div>
          </div>

          {/* Selector de Director Nominal de Destino (Omitido cuando la subsanación es de Tesorería) */}
          {esObservacionTesoreria ? (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Retorno Directo a Tesorería
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Este trámite ya cuenta con las autorizaciones asistenciales de Dirección. Al confirmar, volverá directamente al panel de <strong>Tesorería</strong> en estado <em>Aprobado</em> para continuar con la liquidación y pago.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/80 space-y-1.5 text-left">
              <Label className="text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Director para Visado <span className="text-rose-500">*</span>
              </Label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona el Director que debe controlar y autorizar esta prestación:
              </p>
              <Select value={directorAdjuntoAsignado} onValueChange={setDirectorAdjuntoAsignado}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800">
                  <SelectValue placeholder="Selecciona un Director" />
                </SelectTrigger>
                <SelectContent>
                  {directoresDisponibles.length > 0 ? (
                    directoresDisponibles.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id} className="text-xs">
                        👤 {dir.nombre} <span className="text-[10px] text-slate-400">({(dir as any).rol || "Dirección"})</span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="direccion_general" className="text-xs">
                      🛡️ Dirección Médica Asistencial
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            {esObservacionTesoreria
              ? "* Las firmas médicas originales quedan debidamente preservadas en el historial."
              : "* Al confirmar, se generará el número de trámite correlativo y la planilla ingresará a la bandeja de auditoría del Director seleccionado."}
          </p>

          <AlertDialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setShowConfirmDialog(false)}
              className="w-full sm:w-auto text-xs"
            >
              Volver a revisar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSubmit}
              className="w-full sm:w-auto bg-[#08487A] hover:bg-[#06375d] text-white font-medium text-xs shadow-sm"
            >
              {esObservacionTesoreria ? "Confirmar y Reenviar a Tesorería" : "Sí, Confirmar y Presentar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

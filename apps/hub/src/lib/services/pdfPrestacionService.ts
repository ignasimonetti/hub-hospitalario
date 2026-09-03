import {
  PrestacionPresentacion,
  PrestadorPerfil,
  FormularioDigitalData,
  PROFESIONES_MAP,
  SECTORES_SERVICIO_MAP,
  SectorServicio,
} from "@/types/prestadores";
import { pocketbase } from "@/lib/auth";
import { CISB_LOGO_B64 } from "./logoAssets";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function generarPlanillaOficialHTML(
  prestacion: PrestacionPresentacion,
  perfil?: PrestadorPerfil | null,
  hospitalName: string = "Centro Integral de Salud Banda - Dr. Ricardo \"Pololo\" Abdala"
): string {
  const isGuardia = prestacion.service_type === "guardia";
  const mesNombre = MESES[prestacion.period_month - 1] || `Mes ${prestacion.period_month}`;
  
  let digitalForm: FormularioDigitalData | null = null;
  if (prestacion.digital_form_data) {
    try {
      digitalForm = typeof prestacion.digital_form_data === "string"
        ? JSON.parse(prestacion.digital_form_data)
        : prestacion.digital_form_data;
    } catch {
      digitalForm = null;
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renglonesGuardia = isGuardia && digitalForm && digitalForm.tipo_formulario === "guardia"
    ? digitalForm.renglones
    : [];

  const renglonesEH = !isGuardia && digitalForm && digitalForm.tipo_formulario === "extension_horaria"
    ? digitalForm.renglones
    : [];

  const now = new Date();
  const fechaHoyStr = `La Banda, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;

  // Obtener nombre del prestador: desde expand de la presentación, o desde el usuario logueado en pocketbase
  const authUser = pocketbase.authStore.model;
  let nombreCompleto = "";
  if (prestacion.expand?.user) {
    nombreCompleto = `${prestacion.expand.user.firstName || ""} ${prestacion.expand.user.lastName || ""}`.trim();
  }
  if (!nombreCompleto && authUser) {
    nombreCompleto = `${authUser.firstName || authUser.first_name || ""} ${authUser.lastName || authUser.last_name || ""}`.trim();
  }
  if (!nombreCompleto) {
    nombreCompleto = perfil?.cuit ? `Prestador CUIT ${perfil.cuit}` : "Prestador Asistencial";
  }

  // Resolver la profesión y especialidad con precisión sin forzar 'Médico'
  const profesionLabel = perfil?.profession
    ? (PROFESIONES_MAP[perfil.profession] || perfil.profession)
    : "Profesional Asistencial";
  const matriculaNum = perfil?.license_number || prestacion.expand?.user?.professional_id || (authUser as any)?.professional_id || "";
  const matricula = matriculaNum ? `M.P. ${matriculaNum}` : "";
  const cuit = perfil?.cuit ? `CUIT: ${perfil.cuit}` : "";
  const especialidad = perfil?.specialty || (authUser as any)?.specialty || profesionLabel;
  const signatureData = prestacion.expand?.user?.signature_data || (authUser as any)?.signature_data || null;
  const sectorTexto = prestacion.hospital_service
    ? (SECTORES_SERVICIO_MAP[prestacion.hospital_service as SectorServicio] || prestacion.hospital_service)
    : "Guardia Central / Servicio Asistencial";

  // Mapear días comprometidos para el recuadro 1 (15 casilleros)
  const fechasComprometidas = isGuardia
    ? renglonesGuardia.map(r => r.fecha)
    : renglonesEH.map(r => r.fecha);

  const totalFilas = Math.max(15, isGuardia ? renglonesGuardia.length : renglonesEH.length);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${isGuardia ? "Formulario Único de Guardias" : "Formulario Único de Extensión Horaria"} - ${prestacion.form_number || "Borrador"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 10px;
      line-height: 1.3;
      background: #fff;
    }
    .page-container {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }
    /* Cabecera solo con Logo CISB ampliado */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #08487A;
      margin-bottom: 6px;
      background-color: #f8fafc;
      border-radius: 4px;
    }
    .header-table td {
      padding: 6px 12px;
      vertical-align: middle;
    }
    .header-logo-left {
      width: 130px;
      text-align: left;
    }
    .header-center {
      text-align: center;
      padding-right: 20px;
    }
    .header-hospital {
      font-size: 11px;
      font-weight: bold;
      color: #08487A;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-title {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .meta-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      background: #e2e8f0;
      padding: 2.5px 6px;
      border: 1px solid #cbd5e1;
      margin-bottom: 4px;
      color: #0f172a;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      margin-bottom: 6px;
      font-size: 9.5px;
      background: #fff;
      line-height: 1.45;
    }
    .info-line {
      margin-bottom: 3px;
    }
    .underline-field {
      font-weight: bold;
      color: #08487A;
      border-bottom: 1px dotted #64748b;
      padding: 0 3px;
    }
    /* Grid de Fechas Comprometidas (Día 1 a Día 15) */
    .fechas-grid-box {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      background: #f8fafc;
      margin-top: 4px;
      margin-bottom: 4px;
    }
    .fechas-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 3px 6px;
      font-size: 9px;
    }
    .fecha-slot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px dotted #cbd5e1;
      padding: 1px 2px;
    }
    .fecha-slot-label {
      color: #64748b;
      font-size: 8.5px;
    }
    .fecha-slot-val {
      font-weight: bold;
      color: #08487A;
      font-family: monospace;
      font-size: 9px;
    }
    .legal-text {
      font-size: 9px;
      color: #334155;
      margin: 5px 0 6px 0;
      text-align: justify;
      line-height: 1.3;
    }
    .signatures-top-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 8px 0 10px 0;
    }
    .sign-box {
      border-top: 1px solid #0f172a;
      padding-top: 4px;
      text-align: center;
      font-size: 9px;
      color: #334155;
      line-height: 1.35;
    }
    .sign-box .sign-name {
      font-weight: bold;
      color: #08487A;
      font-size: 9.5px;
    }
    .sign-box .sign-meta {
      font-size: 8.5px;
      color: #475569;
    }
    .sign-box .sign-badge {
      display: inline-block;
      margin-top: 2px;
      font-size: 8px;
      font-weight: bold;
      color: #0369a1;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      padding: 0.5px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    /* Tabla oficial */
    table.official-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 9px;
    }
    table.official-table th, table.official-table td {
      border: 1px solid #475569;
      padding: 2.5px 3px;
      text-align: center;
    }
    table.official-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 8.5px;
    }
    table.official-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .row-filled {
      font-weight: 600;
      color: #0f172a;
    }
    .badge-digital {
      display: inline-block;
      font-size: 7.5px;
      font-weight: bold;
      color: #0369a1;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      padding: 0.5px 3px;
      border-radius: 2px;
    }
    .signature-img {
      max-height: 38px;
      max-width: 130px;
      object-fit: contain;
      display: block;
      margin: 0 auto 2px auto;
    }
    .signature-cell-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      padding: 1px 0;
    }
    .signature-cell-img {
      max-height: 24px;
      max-width: 90px;
      object-fit: contain;
      display: block;
    }
    .signature-cell-meta {
      font-size: 7px;
      color: #334155;
      line-height: 1.1;
      font-weight: normal;
    }
    .obs-box {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      min-height: 22px;
      font-size: 9px;
      margin-bottom: 8px;
      background: #fafafa;
    }
    .signatures-bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 14px;
    }
    .stamp-box {
      margin-top: 8px;
      padding: 5px 8px;
      background: #f8fafc;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      font-size: 8.5px;
      color: #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Botón flotante para imprimir en pantalla -->
  <div class="no-print" style="position: fixed; top: 12px; right: 12px; z-index: 1000; background: white; padding: 6px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 8px;">
    <button onclick="window.print()" style="background: #08487A; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
      🖨️ Imprimir / Guardar PDF
    </button>
    <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
      Cerrar
    </button>
  </div>

  <div class="page-container">
    <!-- Encabezado con Logo CISB ampliado -->
    <table class="header-table">
      <tr>
        <td class="header-logo-left">
          <img src="${CISB_LOGO_B64}" alt="CISB" style="max-height: 52px; width: auto; object-fit: contain;" />
        </td>
        <td class="header-center">
          <div class="header-hospital">Centro Integral de Salud Banda - Dr. Ricardo &quot;Pololo&quot; Abdala</div>
          <div class="header-title">
            ${isGuardia ? "FORMULARIO ÚNICO DE SOLICITUD Y AUTORIZACIÓN DE GUARDIAS" : "FORMULARIO ÚNICO DE SOLICITUD Y AUTORIZACIÓN DE EXTENSIÓN HORARIA"}
          </div>
        </td>
      </tr>
    </table>

    <div class="meta-top-row">
      <div>${fechaHoyStr}</div>
      <div>
        <strong>N° FORMULARIO: </strong> 
        <span class="underline-field">${prestacion.form_number || "BORRADOR EN TRÁMITE"}</span>
      </div>
    </div>

    <!-- 1. DETALLE DE PRESENTACIÓN -->
    <div class="section-title">DETALLE DE PRESENTACIÓN Y SOLICITUD PREVIA</div>
    <div class="info-card">
      <div class="info-line">
        <strong>TIPO: </strong>
        ${isGuardia ? "Guardia ACTIVA (con presencia física del prestador en el servicio asistencial)" : "EXTENSIÓN HORARIA (horas programadas adicionales a la carga horaria regular)"}
      </div>

      <!-- Fechas de Presentación Comprometidas (Día 1 a Día 15) -->
      <div class="fechas-grid-box">
        <div style="font-size: 8.5px; font-weight: bold; color: #475569; margin-bottom: 2px;">
          FECHAS DE PRESENTACIÓN COMPROMETIDAS:
        </div>
        <div class="fechas-grid">
          ${Array.from({ length: 15 }).map((_, idx) => {
            const f = fechasComprometidas[idx];
            const displayVal = f ? formatDate(f) : "___/___/______";
            return `
            <div class="fecha-slot">
              <span class="fecha-slot-label">Día ${idx + 1}:</span>
              <span class="fecha-slot-val">${displayVal}</span>
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="info-line" style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
        <div>
          <strong>Mes Devengado: </strong>
          <span class="underline-field">${mesNombre} de ${prestacion.period_year}</span>
        </div>
        <div>
          <strong>Servicio / Sector: </strong>
          <span class="underline-field">${sectorTexto}</span>
        </div>
      </div>

      <div class="info-line" style="margin-top: 3px;">
        <strong>PRESTADOR: </strong>
        <span class="underline-field">${nombreCompleto}</span>
        <span style="margin-left: 6px; color: #475569;">(${matricula ? matricula + " • " : ""}${cuit ? cuit + " • " : ""}${especialidad})</span>
      </div>

      ${isGuardia && digitalForm?.tipo_formulario === "guardia" && digitalForm.reemplazo_de ? `
      <div class="info-line" style="margin-top: 2px;">
        <strong>En reemplazo de (en caso de corresponder): </strong>
        <span class="underline-field">${digitalForm.reemplazo_de}</span>
      </div>` : ""}

      ${!isGuardia && digitalForm?.tipo_formulario === "extension_horaria" && digitalForm.cargo_especialidad ? `
      <div class="info-line" style="margin-top: 2px;">
        <strong>Cargo / Función Específica: </strong>
        <span class="underline-field">${digitalForm.cargo_especialidad}</span>
      </div>` : ""}
    </div>

    <div class="legal-text">
      ${isGuardia
        ? "Teniendo en cuenta que la presente solicitud es a fin de cubrir o reforzar los días y horarios en que no se cuenta con personal asistencial de guardia en el servicio, solicito al Sr. Director la autorización previa para realizar guardia/s según detalle ut supra.-"
        : "Teniendo en cuenta la necesidad de cubrir demandas asistenciales programadas que exceden la carga horaria regular del servicio, solicito al Sr. Director la autorización previa para realizar la extensión horaria detallada infra.-"}
    </div>

    <!-- Firmas Superiores de Autorización Previa -->
    <div class="signatures-top-grid">
      <div class="sign-box">
        ${signatureData ? `
          <div style="min-height: 38px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <img src="${signatureData}" alt="Firma Prestador" class="signature-img" />
          </div>
        ` : `
          <div style="height: 16px;"></div>
        `}
        <div class="sign-name">${nombreCompleto}</div>
        <div class="sign-meta">${profesionLabel} ${matricula ? "• " + matricula : ""} ${cuit ? "• " + cuit : ""}</div>
        <div style="font-weight: bold; margin-top: 1px;">Firma y Aclaración del Prestador</div>
        <div><span class="sign-badge">✓ Firmado Digitalmente</span></div>
      </div>
      <div class="sign-box">
        <div style="height: 20px;"></div>
        <div style="font-weight: bold;">Firma y Aclaración del Coordinador / Director Adjunto</div>
        <div class="sign-meta">Autorización Previa de Cobertura</div>
        <div><span class="sign-badge">✓ Autorizado en Plataforma</span></div>
      </div>
    </div>

    <!-- 2. TABLA A - CERTIFICACIÓN DE ASISTENCIA -->
    <div class="section-title">A - CERTIFICACIÓN DE ASISTENCIA Y PRESTACIONES CUMPLIDAS</div>
    
    ${isGuardia ? `
    <table class="official-table">
      <thead>
        <tr>
          <th style="width: 25px;">N°</th>
          <th style="width: 70px;">Fecha</th>
          <th style="width: 65px;">Hora Entrada</th>
          <th>Certificación Entrada</th>
          <th style="width: 70px;">Hora Salida</th>
          <th>Certificación Salida</th>
          <th style="width: 80px;">Tipo / Complejidad</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: totalFilas }).map((_, idx) => {
          const r = renglonesGuardia[idx];
          if (r) {
            const dur = Math.max(1, Math.min(24, Number(r.duracion_horas) || 24));
            const tipoStr = r.tipo === "critica" ? "Crítica" : "Ordinaria";
            return `
            <tr class="row-filled">
              <td><strong>${idx + 1}</strong></td>
              <td>${formatDate(r.fecha)}</td>
              <td>${r.hora_entrada} hs</td>
              <td style="padding: 1px 3px;">
                <div class="signature-cell-container">
                  ${signatureData ? `
                    <img src="${signatureData}" alt="Firma" class="signature-cell-img" />
                  ` : `
                    <span class="badge-digital">Validado Digital</span>
                  `}
                  <div class="signature-cell-meta">
                    <strong>${nombreCompleto}</strong>
                    ${matricula ? `<span> • ${matricula}</span>` : ""}
                  </div>
                </div>
              </td>
              <td>${r.hora_salida} hs (${dur}hs)</td>
              <td style="padding: 1px 3px;">
                <div class="signature-cell-container">
                  ${signatureData ? `
                    <img src="${signatureData}" alt="Firma" class="signature-cell-img" />
                  ` : `
                    <span class="badge-digital">Validado Digital</span>
                  `}
                  <div class="signature-cell-meta">
                    <strong>${nombreCompleto}</strong>
                    ${matricula ? `<span> • ${matricula}</span>` : ""}
                  </div>
                </div>
              </td>
              <td><strong>${tipoStr}</strong></td>
            </tr>`;
          } else {
            return `
            <tr>
              <td style="color: #94a3b8;">${idx + 1}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>`;
          }
        }).join("")}
      </tbody>
    </table>
    ` : `
    <table class="official-table">
      <thead>
        <tr>
          <th style="width: 30px;">N°</th>
          <th style="width: 85px;">Fecha</th>
          <th>Horario Programado</th>
          <th style="width: 85px;">Hs. Cumplidas</th>
          <th style="width: 150px;">Certificación Prestador</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: totalFilas }).map((_, idx) => {
          const r = renglonesEH[idx];
          if (r) {
            return `
            <tr class="row-filled">
              <td><strong>${idx + 1}</strong></td>
              <td>${formatDate(r.fecha)}</td>
              <td>${r.horario_programado || "Según cronograma"}</td>
              <td><strong>${r.horas_cumplidas} hs</strong></td>
              <td style="padding: 2px 4px;">
                <div class="signature-cell-container">
                  ${signatureData ? `
                    <img src="${signatureData}" alt="Firma" class="signature-cell-img" />
                  ` : `
                    <span class="badge-digital">Validado Digital</span>
                  `}
                  <div class="signature-cell-meta">
                    <strong>${nombreCompleto}</strong>
                    ${matricula ? `<span> • ${matricula}</span>` : ""}
                  </div>
                </div>
              </td>
            </tr>`;
          } else {
            return `
            <tr>
              <td style="color: #94a3b8;">${idx + 1}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>`;
          }
        }).join("")}
      </tbody>
    </table>
    `}

    <!-- Observaciones -->
    <div style="font-size: 9px; font-weight: bold; margin-bottom: 2px;">OBSERVACIONES:</div>
    <div class="obs-box">
      ${digitalForm?.observaciones || "Sin observaciones adicionales registradas."}
    </div>

    <!-- Firmas Inferiores de Dirección (Doble Firma Jerárquica) -->
    <div class="signatures-bottom-grid">
      <div class="sign-box">
        ${prestacion.adjunto_approved_at ? `
          <div class="sign-name">${prestacion.adjunto_signature_meta || "Dirección Adjunta"}</div>
          <div class="sign-meta">Visado el ${formatDate(prestacion.adjunto_approved_at)}</div>
          <div style="font-weight: bold; margin-top: 1px;">Director Adjunto</div>
          <div><span class="sign-badge" style="background: #dcfce7; color: #15803d; border-color: #86efac;">✓ Visado & Aprobado Digitalmente</span></div>
        ` : `
          <div style="height: 14px;"></div>
          <div style="font-weight: bold;">Director Adjunto</div>
          <div class="sign-meta">Revisión Asistencial Hospitalaria</div>
          <div><span class="sign-badge">Pendiente de Firma</span></div>
        `}
      </div>

      <div class="sign-box">
        ${prestacion.director_approved_at ? `
          <div class="sign-name">${prestacion.director_signature_meta || "Dirección Coordinadora"}</div>
          <div class="sign-meta">Aprobado el ${formatDate(prestacion.director_approved_at)}</div>
          <div style="font-weight: bold; margin-top: 1px;">Director Coordinador</div>
          <div><span class="sign-badge" style="background: #dcfce7; color: #15803d; border-color: #86efac;">✓ Aprobación Final Concedida</span></div>
        ` : `
          <div style="height: 14px;"></div>
          <div style="font-weight: bold;">Director Coordinador</div>
          <div class="sign-meta">Aprobación Final de Liquidación</div>
          <div><span class="sign-badge">${prestacion.status === "visado_adjunto" ? "Pendiente Firma Final" : "En Trámite"}</span></div>
        `}
      </div>
    </div>

    <!-- Pie de Estado y Emisión -->
    <div class="stamp-box">
      <div>
        <strong>ESTADO: </strong> ${prestacion.status.toUpperCase()}
      </div>
      <div>
        <strong>Emisión: </strong> ${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function abrirPlanillaOficialEnNuevaPestana(
  prestacion: PrestacionPresentacion,
  perfil?: PrestadorPerfil | null,
  tenantName?: string
): void {
  const html = generarPlanillaOficialHTML(prestacion, perfil, tenantName);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

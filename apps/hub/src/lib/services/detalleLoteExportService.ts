/**
 * Motor de exportación de Detalle de Lote (multi-modo / multi-formato).
 *
 * Modos:
 *  - bancario -> columnas mínimas para transferencias (home banking)
 *  - contable -> trazabilidad completa con retenciones desglosadas
 *
 * Formatos: csv | xlsx | pdf
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  PrestacionTesoreriaItem,
} from "@/types/tesoreria";
import {
  SECTORES_SERVICIO_MAP,
  SectorServicio,
  CONDICIONES_FISCALES_MAP,
} from "@/types/prestadores";

export type ModoExportDetalle = "bancario" | "contable";
export type FormatoExportDetalle = "csv" | "xlsx" | "pdf";

interface DetalleLoteColumn {
  key: string;
  label: string;
  /** true si la celda es numérica (alineación derecha + totalizable) */
  numeric?: boolean;
}

interface DetalleLoteDataset {
  columns: DetalleLoteColumn[];
  /** filas crudas: strings para texto, numbers para montos */
  rows: (string | number)[][];
  /** fila TOTAL con sumas en las columnas numéricas */
  totalsRow: (string | number)[];
}

/** Formatea un número al estilo es-AR: 1.234,56 */
function fmtNumAR(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Fecha YYYY-MM-DD desde ISO; "-" si no hay */
function fechaCortaISO(iso?: string): string {
  if (!iso) return "-";
  return iso.split("T")[0];
}

/** Construye el dataset del detalle según el modo elegido */
function buildDetalleLoteDataset(
  prestaciones: PrestacionTesoreriaItem[],
  modo: ModoExportDetalle
): DetalleLoteDataset {
  const col = (
    key: string,
    label: string,
    numeric = false
  ): DetalleLoteColumn => ({ key, label, numeric });

  const columns: DetalleLoteColumn[] =
    modo === "bancario"
      ? [
          col("orden", "Orden"),
          col("cuit", "CUIT"),
          col("beneficiario", "Beneficiario"),
          col("cbu", "CBU / Alias"),
          col("condicion", "Condición Fiscal"),
          col("neto", "Importe Neto $", true),
        ]
      : [
          col("orden", "Orden"),
          col("cuit", "CUIT"),
          col("beneficiario", "Beneficiario"),
          col("cbu", "CBU / Alias"),
          col("condicion", "Condición Fiscal"),
          col("servicio", "Servicio Hospitalario"),
          col("tipoForm", "Tipo de Formulario"),
          col("tramite", "Nº Trámite"),
          col("expteGde", "Expte GDE"),
          col("factura", "Factura"),
          col("periodo", "Período"),
          col("bruto", "Bruto $", true),
          col("retIibb", "Ret. IIBB $", true),
          col("retGan", "Ret. Ganancias $", true),
          col("retSuss", "Ret. SUSS $", true),
          col("retOtras", "Ret. Otras $", true),
          col("retOtrasConcepto", "Concepto Ret. Otras"),
          col("retTotal", "Total Retenciones $", true),
          col("neto", "Neto $", true),
          col("estado", "Estado"),
          col("fAprobacion", "F. Aprobación Dirección"),
          col("fPago", "F. Pago"),
        ];

  const rows: (string | number)[][] = prestaciones.map((p, i) => {
    const perfil = p.perfilPrestador;
    const user = p.expand?.user;
    const nombre = user
      ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
      : "Prestador Asistencial";

    const condicion = perfil?.tax_condition
      ? CONDICIONES_FISCALES_MAP[perfil.tax_condition] || perfil.tax_condition
      : "Monotributista";

    const srvKey = (p.hospital_service as string) || "";
    const srvLabel =
      SECTORES_SERVICIO_MAP[srvKey as SectorServicio] ||
      (srvKey ? srvKey.replace(/_/g, " ") : "Servicio Médico");

    const bruto = Number(p.invoice_amount) || 0;
    const retIibb = Number(p.retencion_iibb) || 0;
    const retGan = Number(p.retencion_ganancias) || 0;
    const retSuss = Number(p.retencion_suss) || 0;
    const retOtras = Number(p.retencion_otras) || 0;
    const retTotal =
      Number(p.retencion_monto) || retIibb + retGan + retSuss + retOtras;
    const neto =
      p.monto_neto_liquidable !== undefined
        ? Number(p.monto_neto_liquidable)
        : bruto - retTotal;

    const base: Record<string, string | number> = {
      orden: `ORD-${String(i + 1).padStart(4, "0")}`,
      cuit: perfil?.cuit || "Sin CUIT",
      beneficiario: nombre,
      cbu: perfil?.cbu_alias || "Sin CBU/Alias",
      condicion,
      servicio: srvLabel,
      tipoForm:
        p.service_type === "guardia"
          ? "Guardias (Form. G)"
          : "Extensión Horaria (Form. EH)",
      tramite: p.form_number || p.id,
      expteGde: p.numero_expediente_gde || p.lote_numero || "Sin Asignar",
      factura: p.invoice_number || "S/N",
      periodo: `${String(p.period_month).padStart(2, "0")}/${p.period_year}`,
      bruto,
      retIibb,
      retGan,
      retSuss,
      retOtras,
      retOtrasConcepto: p.retencion_otras_concepto || "",
      retTotal,
      neto,
      estado: p.status.toUpperCase(),
      fAprobacion: fechaCortaISO(p.director_approved_at),
      fPago: fechaCortaISO(p.paid_at || p.treasury_paid_at),
    };

    return columns.map((c) => base[c.key]);
  });

  // Fila de totales: suma solo columnas numéricas
  const totalsRow: (string | number)[] = columns.map((c, ci) => {
    if (!c.numeric) return "";
    const sum = rows.reduce((acc, r) => acc + (Number(r[ci]) || 0), 0);
    return sum;
  });
  const firstTextIdx = totalsRow.findIndex((v) => v === "");
  if (firstTextIdx >= 0) totalsRow[firstTextIdx] = "TOTAL GENERAL";

  return { columns, rows, totalsRow };
}

/* ---------- Utilidades de archivo ---------- */

function slugifyNombreArchivo(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fechaHoyCompacta(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ---------- Exportadores por formato ---------- */

function exportDetalleCSV(dataset: DetalleLoteDataset, filename: string) {
  const data: (string | number)[][] = [
    ...dataset.rows.map((r) =>
      r.map((cell) => (typeof cell === "number" ? fmtNumAR(cell) : cell))
    ),
    dataset.totalsRow.map((c) => (typeof c === "number" ? fmtNumAR(c) : c)),
  ];

  const csv = Papa.unparse(
    {
      fields: dataset.columns.map((c) => c.label),
      data,
    },
    { delimiter: ";", header: true }
  );

  // BOM para compatibilidad con Excel en español
  descargarBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`
  );
}

function exportDetalleXLSX(dataset: DetalleLoteDataset, filename: string) {
  const aoa: (string | number)[][] = [
    dataset.columns.map((c) => c.label),
    ...dataset.rows,
    [],
    dataset.totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Anchos de columna aproximados por longitud máxima de contenido
  ws["!cols"] = dataset.columns.map((c, ci) => {
    let maxLen = c.label.length;
    for (const r of dataset.rows) {
      maxLen = Math.max(maxLen, String(r[ci] ?? "").length);
    }
    maxLen = Math.max(maxLen, String(dataset.totalsRow[ci] ?? "").length);
    return { wch: Math.min(Math.max(maxLen + 2, 10), 42) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detalle Lote");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportDetallePDF(
  dataset: DetalleLoteDataset,
  filename: string,
  meta: { lote: string; expediente: string; modo: ModoExportDetalle }
) {
  const ths = dataset.columns
    .map(
      (c) =>
        `<th style="text-align:${c.numeric ? "right" : "left"}">${c.label}</th>`
    )
    .join("");

  const renderCell = (cell: string | number) =>
    typeof cell === "number" ? fmtNumAR(cell) : String(cell);

  const trs = dataset.rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (cell, ci) =>
              `<td style="text-align:${
                dataset.columns[ci].numeric ? "right" : "left"
              }">${renderCell(cell)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const tfoot = `<tr>${dataset.totalsRow
    .map(
      (cell, ci) =>
        `<td style="text-align:${
          dataset.columns[ci].numeric ? "right" : "left"
        };font-weight:bold">${renderCell(cell)}</td>`
    )
    .join("")}</tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${filename}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 24px; }
  .head { border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  .org { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; }
  h1 { font-size: 16px; margin: 6px 0 2px; }
  .meta { font-size: 11px; color: #333; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
  td { border: 1px solid #e2e8f0; padding: 4px 6px; }
  tfoot td { background: #f8fafc; font-size: 11px; }
  @media print { @page { size: A4 ${
    meta.modo === "bancario" ? "portrait" : "landscape"
  }; margin: 12mm; } body { margin: 0; } }
</style>
</head>
<body>
  <div class="head">
    <div class="org">Provincia de Santiago del Estero — Ministerio de Salud</div>
    <h1>Detalle del Lote — ${meta.lote}</h1>
    <div class="meta">
      Expediente GDE: ${meta.expediente} &nbsp;•&nbsp;
      Modo: ${
        meta.modo === "bancario"
          ? "Bancario (Transferencias)"
          : "Contable Completo"
      } &nbsp;•&nbsp;
      Registros: ${dataset.rows.length} &nbsp;•&nbsp;
      Generado: ${new Date().toLocaleString("es-AR")}
    </div>
  </div>
  <table>
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
    <tfoot><tr>${tfoot}</tr></tfoot>
  </table>
</body>
</html>`;

  // Mismo patrón que las planillas oficiales: abrir pestaña e imprimir/guardar como PDF
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/* ---------- API pública ---------- */

/**
 * Punto de entrada único para exportar el detalle de un lote.
 * El usuario elige modo (bancario/contable) y formato (csv/xlsx/pdf).
 */
export function exportarDetalleLote(opts: {
  prestaciones: PrestacionTesoreriaItem[];
  numeroLote: string;
  expedienteGde?: string;
  modo: ModoExportDetalle;
  formato: FormatoExportDetalle;
}): void {
  const { prestaciones, numeroLote, expedienteGde, modo, formato } = opts;

  const dataset = buildDetalleLoteDataset(prestaciones, modo);
  const filename = `Detalle_${slugifyNombreArchivo(numeroLote)}_${fechaHoyCompacta()}`;

  switch (formato) {
    case "csv":
      exportDetalleCSV(dataset, filename);
      break;
    case "xlsx":
      exportDetalleXLSX(dataset, filename);
      break;
    case "pdf":
      exportDetallePDF(dataset, filename, {
        lote: numeroLote,
        expediente: expedienteGde || "Sin carátula",
        modo,
      });
      break;
  }
}

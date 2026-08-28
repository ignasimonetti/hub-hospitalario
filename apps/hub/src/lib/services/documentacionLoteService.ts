import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import saveAs from "file-saver";
import { PrestacionTesoreriaItem, LoteTesoreria } from "@/types/tesoreria";
import { getPresentacionFileUrl, getPerfilFileUrl } from "@/lib/services/prestadoresService";

/**
 * Convierte los datos de la certificación asistencial en una página PDF elegante
 */
async function generarPDFPlanillaAsistencial(
  pdfDoc: PDFDocument,
  p: PrestacionTesoreriaItem,
  numeroOrden: number
): Promise<void> {
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();

  const user = p.expand?.user;
  const nombrePrestador = user
    ? `${user.lastName || ""} ${user.firstName || ""}`.trim().toUpperCase() || user.email.toUpperCase()
    : "PROFESIONAL PRESTADOR";
  const cuit = p.perfilPrestador?.cuit || "Sin CUIT";
  const tipoServicio = p.service_type === "guardia" ? "PLANILLA DE GUARDIAS MÉDICAS (FORM G)" : "PLANILLA DE EXTENSIÓN HORARIA (FORM EH)";
  const srvNombre = (p.hospital_service as string) || "Servicio Asistencial Hospitalario";
  const mesNombre = `${String(p.period_month).padStart(2, "0")}/${p.period_year}`;

  // Encabezado
  page.drawRectangle({
    x: 30,
    y: height - 60,
    width: width - 60,
    height: 35,
    color: rgb(0.05, 0.28, 0.48),
  });

  page.drawText("CENTRO INTEGRAL DE SALUD LA BANDA — DR. RICARDO POLOLO ABDALA", {
    x: 40,
    y: height - 42,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("CERTIFICACIÓN ASISTENCIAL DE PRESTACIÓN — EXPEDIENTE DE PAGO", {
    x: 40,
    y: height - 54,
    size: 8,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Datos del Profesional y Trámite
  let y = height - 85;

  page.drawText(`ORDEN EN NÓMINA: #${String(numeroOrden).padStart(2, "0")}  |  TRÁMITE N°: ${p.form_number || p.id}`, {
    x: 35,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 18;
  page.drawRectangle({
    x: 30,
    y: y - 65,
    width: width - 60,
    height: 75,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText(`PROFESIONAL: ${nombrePrestador}`, { x: 40, y: y - 10, size: 10, font: fontBold });
  page.drawText(`CUIT: ${cuit}    |    CONDICIÓN: ${p.perfilPrestador?.tax_condition || "Monotributo"}`, { x: 40, y: y - 24, size: 9, font: fontRegular });
  page.drawText(`SERVICIO: ${srvNombre}    |    PERÍODO: ${mesNombre}`, { x: 40, y: y - 38, size: 9, font: fontRegular });
  page.drawText(`TIPO DE CONTRATACIÓN: ${tipoServicio}`, { x: 40, y: y - 52, size: 9, font: fontRegular });

  // Desglose de Guardias / Extensión
  y -= 85;
  page.drawText("DETALLE DE DÍAS Y HORAS CERTIFICADAS", { x: 35, y, size: 10, font: fontBold, color: rgb(0.05, 0.28, 0.48) });
  y -= 15;

  let digitalForm: any = null;
  if (p.digital_form_data) {
    try {
      digitalForm = typeof p.digital_form_data === "string" ? JSON.parse(p.digital_form_data) : p.digital_form_data;
    } catch {}
  }

  if (digitalForm && Array.isArray(digitalForm.renglones) && digitalForm.renglones.length > 0) {
    page.drawRectangle({
      x: 30,
      y: y - 14,
      width: width - 60,
      height: 18,
      color: rgb(0.9, 0.92, 0.95),
    });

    page.drawText("FECHA / DÍA", { x: 40, y: y - 10, size: 8, font: fontBold });
    page.drawText("DURACIÓN (HS)", { x: 160, y: y - 10, size: 8, font: fontBold });
    page.drawText("CARÁCTER / TIPO", { x: 260, y: y - 10, size: 8, font: fontBold });
    page.drawText("SECTOR / ÁREA", { x: 390, y: y - 10, size: 8, font: fontBold });

    y -= 16;
    const renglones = digitalForm.renglones.slice(0, 20);
    for (const r of renglones) {
      y -= 14;
      const fecha = r.fecha || "-";
      const duracion = r.duracion_horas ? `${r.duracion_horas} hs` : (r.horas_cumplidas ? `${r.horas_cumplidas} hs` : "24 hs");
      const tipo = r.tipo === "critica" ? "Crítica (UTI/Guardia)" : "Ordinaria / Extensión";
      const sector = r.sector || srvNombre;

      page.drawText(fecha, { x: 40, y, size: 8, font: fontRegular });
      page.drawText(duracion, { x: 160, y, size: 8, font: fontRegular });
      page.drawText(tipo, { x: 260, y, size: 8, font: fontRegular });
      page.drawText(sector.slice(0, 28), { x: 390, y, size: 8, font: fontRegular });

      page.drawLine({
        start: { x: 30, y: y - 3 },
        end: { x: width - 30, y: y - 3 },
        color: rgb(0.9, 0.9, 0.9),
        thickness: 0.5,
      });
    }
  } else {
    page.drawText("Certificación asistencial registrada en sistema (detalle digital consolidado).", {
      x: 40,
      y: y - 10,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 20;
  }

  // Firmas de Dirección Asistencial
  const signY = 120;
  page.drawRectangle({
    x: 30,
    y: signY - 50,
    width: width - 60,
    height: 70,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.7, 0.8, 0.9),
    borderWidth: 1,
  });

  page.drawText("VISADO Y APROBACIÓN DE DIRECCIÓN ASISTENCIAL (CONFORME DÍAS Y HORAS)", {
    x: 40,
    y: signY + 8,
    size: 8,
    font: fontBold,
    color: rgb(0.05, 0.28, 0.48),
  });

  page.drawText(`Director Adjunto: ${p.adjunto_signature_meta || "Visado Digitalmente"}`, {
    x: 40,
    y: signY - 12,
    size: 8,
    font: fontRegular,
  });
  page.drawText(`Fecha Visado: ${p.adjunto_approved_at ? p.adjunto_approved_at.split("T")[0] : "Conforme"}`, {
    x: 40,
    y: signY - 24,
    size: 8,
    font: fontRegular,
  });

  page.drawText(`Director Coordinador: ${p.director_signature_meta || "Aprobación Final Concedida"}`, {
    x: 300,
    y: signY - 12,
    size: 8,
    font: fontRegular,
  });
  page.drawText(`Fecha Aprobación: ${p.director_approved_at ? p.director_approved_at.split("T")[0] : "Conforme"}`, {
    x: 300,
    y: signY - 24,
    size: 8,
    font: fontRegular,
  });

  // Pie
  page.drawText(`Ficha Asistencial Oficial — Legajo Lote GDE — Emitido el ${new Date().toLocaleDateString("es-AR")}`, {
    x: 35,
    y: 35,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/**
 * Descarga un archivo binario desde una URL como ArrayBuffer
 */
async function fetchFileArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (err) {
    console.warn("No se pudo descargar el archivo:", url, err);
    return null;
  }
}

export interface ProgresoDescargaDocumentacion {
  totalItems: number;
  currentItem: number;
  prestadorNombre: string;
  paso: string;
}

/**
 * Genera y descarga el PDF Consolidado de Documentación Respaldatoria para Archivos de Trabajo de GDE.
 * Respeta el orden exacto 1:1 de la nómina del lote.
 * Estructura por cada profesional:
 *   1. Planilla Asistencial Digital
 *   2. Factura Electrónica ARCA (si está adjunta)
 *   3. Certificado de Conducta Fiscal DGR (si está adjunto)
 */
export async function descargarDocumentacionRespaldatoriaLotePDF(
  lote: LoteTesoreria,
  prestaciones: PrestacionTesoreriaItem[],
  onProgreso?: (progreso: ProgresoDescargaDocumentacion) => void
): Promise<void> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < prestaciones.length; i++) {
    const p = prestaciones[i];
    const user = p.expand?.user;
    const nombre = user
      ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
      : `Prestador ${i + 1}`;

    // 1. Planilla Asistencial
    if (onProgreso) {
      onProgreso({
        totalItems: prestaciones.length,
        currentItem: i + 1,
        prestadorNombre: nombre,
        paso: "Generando Ficha Asistencial...",
      });
    }
    await generarPDFPlanillaAsistencial(mergedPdf, p, i + 1);

    // 2. Factura ARCA
    if (p.file_invoice) {
      if (onProgreso) {
        onProgreso({
          totalItems: prestaciones.length,
          currentItem: i + 1,
          prestadorNombre: nombre,
          paso: "Incorporando Factura ARCA...",
        });
      }
      const facturaUrl = getPresentacionFileUrl(p, p.file_invoice);
      const facturaBuffer = await fetchFileArrayBuffer(facturaUrl);
      if (facturaBuffer) {
        try {
          const facturaPdf = await PDFDocument.load(facturaBuffer);
          const copiedPages = await mergedPdf.copyPages(facturaPdf, facturaPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (e) {
          console.warn(`Factura de ${nombre} no es un PDF válido o está protegida:`, e);
        }
      }
    }

    // 3. Conducta Fiscal DGR
    const fileConducta = p.file_conducta_fiscal || p.perfilPrestador?.file_conducta_fiscal;
    if (fileConducta) {
      if (onProgreso) {
        onProgreso({
          totalItems: prestaciones.length,
          currentItem: i + 1,
          prestadorNombre: nombre,
          paso: "Incorporando Certificado DGR...",
        });
      }
      const conductaUrl = p.file_conducta_fiscal
        ? getPresentacionFileUrl(p, p.file_conducta_fiscal)
        : p.perfilPrestador?.file_conducta_fiscal
        ? getPerfilFileUrl(p.perfilPrestador, p.perfilPrestador.file_conducta_fiscal)
        : "";

      if (conductaUrl) {
        const conductaBuffer = await fetchFileArrayBuffer(conductaUrl);
        if (conductaBuffer) {
          try {
            const conductaPdf = await PDFDocument.load(conductaBuffer);
            copiedPagesWrapper: {
              const copiedPages = await mergedPdf.copyPages(conductaPdf, conductaPdf.getPageIndices());
              copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
          } catch (e) {
            console.warn(`Conducta fiscal de ${nombre} no es un PDF válido o está protegida:`, e);
          }
        }
      }
    }
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const numeroLoteSanitizado = (lote.numero_lote || "LOTE").replace(/[\/\\]/g, "_");
  const fileName = `DOCUMENTACION_RESPALDATORIA_${numeroLoteSanitizado}.pdf`;
  saveAs(blob, fileName);
}

/**
 * Genera y descarga un archivo ZIP con todas las carpetas y archivos por separado
 */
export async function descargarDocumentacionRespaldatoriaLoteZIP(
  lote: LoteTesoreria,
  prestaciones: PrestacionTesoreriaItem[],
  onProgreso?: (progreso: ProgresoDescargaDocumentacion) => void
): Promise<void> {
  const zip = new JSZip();
  const numeroLoteSanitizado = (lote.numero_lote || "LOTE").replace(/[\/\\]/g, "_");
  const rootFolder = zip.folder(`DOCUMENTACION_${numeroLoteSanitizado}`) || zip;

  for (let i = 0; i < prestaciones.length; i++) {
    const p = prestaciones[i];
    const user = p.expand?.user;
    const nombre = user
      ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || user.email
      : `Prestador_${i + 1}`;
    const cuit = p.perfilPrestador?.cuit || "SinCUIT";
    const carpetaPrestadorName = `${String(i + 1).padStart(2, "0")}_${nombre.replace(/[^a-zA-Z0-9_-]/g, "_")}_${cuit}`;
    const folder = rootFolder.folder(carpetaPrestadorName) || rootFolder;

    if (onProgreso) {
      onProgreso({
        totalItems: prestaciones.length,
        currentItem: i + 1,
        prestadorNombre: nombre,
        paso: "Empaquetando archivos...",
      });
    }

    // 1. Planilla Asistencial PDF
    const fichaDoc = await PDFDocument.create();
    await generarPDFPlanillaAsistencial(fichaDoc, p, i + 1);
    const fichaBytes = await fichaDoc.save();
    folder.file(`01_Planilla_Asistencial_${p.form_number || p.id}.pdf`, fichaBytes);

    // 2. Factura ARCA
    if (p.file_invoice) {
      const facturaUrl = getPresentacionFileUrl(p, p.file_invoice);
      const facturaBuffer = await fetchFileArrayBuffer(facturaUrl);
      if (facturaBuffer) {
        folder.file(`02_Factura_ARCA_${p.invoice_number || "SN"}.pdf`, facturaBuffer);
      }
    }

    // 3. Conducta Fiscal DGR
    const fileConducta = p.file_conducta_fiscal || p.perfilPrestador?.file_conducta_fiscal;
    if (fileConducta) {
      const conductaUrl = p.file_conducta_fiscal
        ? getPresentacionFileUrl(p, p.file_conducta_fiscal)
        : p.perfilPrestador?.file_conducta_fiscal
        ? getPerfilFileUrl(p.perfilPrestador, p.perfilPrestador.file_conducta_fiscal)
        : "";
      if (conductaUrl) {
        const conductaBuffer = await fetchFileArrayBuffer(conductaUrl);
        if (conductaBuffer) {
          folder.file(`03_Conducta_Fiscal_DGR_${cuit}.pdf`, conductaBuffer);
        }
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `DOCUMENTACION_RESPALDATORIA_${numeroLoteSanitizado}.zip`);
}

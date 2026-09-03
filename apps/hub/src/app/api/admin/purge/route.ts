import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/pocketbase-admin";
import { getServerPocketBase } from "@/lib/pocketbase-server";

/**
 * POST /api/admin/purge
 * 
 * Handles two modes:
 * 1. Individual delete: { action: "delete_record", collection, recordId }
 * 2. Bulk purge:        { action: "bulk_purge", targets: string[] }
 * 
 * Only accessible by superadmin users.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract token from Authorization header or cookies
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/pb_auth=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          token = parsed.token || "";
        } catch {
          // ignore cookie parse error
        }
      }
    }

    // 2. Initialize admin PB client
    const adminPb = await createAdminClient();

    // 3. Verify user identity & Superadmin status
    let isSuperAdmin = false;
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      try {
        // Decode PocketBase JWT token payload (format: header.payload.signature)
        const parts = token.split(".");
        if (parts.length >= 2) {
          const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          userId = payload.id || null;
        }
      } catch (e) {
        console.warn("[PURGE API] Error decoding JWT token:", e);
      }
    }

    // Also fallback to server PB auth store if token wasn't in header
    if (!userId) {
      const userPb = await getServerPocketBase();
      const model = userPb.authStore.model;
      if (model) {
        userId = model.id;
        userEmail = model.email;
        if (model.is_super_admin) isSuperAdmin = true;
      }
    }

    if (userId) {
      try {
        // Check user record in auth_users or users with admin client
        let userRecord: any = null;
        try {
          userRecord = await adminPb.collection("auth_users").getOne(userId, { requestKey: null });
        } catch {
          try {
            userRecord = await adminPb.collection("users").getOne(userId, { requestKey: null });
          } catch {
            // Record not found in standard collections
          }
        }

        if (userRecord) {
          userEmail = userRecord.email || userEmail;
          if (userRecord.is_super_admin) {
            isSuperAdmin = true;
          }
        }

        // Email check fallback for system administrators
        if (userEmail && (
          userEmail.toLowerCase() === "ignaciosimonetti1984@gmail.com" ||
          userEmail.toLowerCase().includes("superadmin")
        )) {
          isSuperAdmin = true;
        }

        // Role check via hub_user_roles
        if (!isSuperAdmin) {
          try {
            const userRoles = await adminPb.collection("hub_user_roles").getList(1, 10, {
              filter: `user = "${userId}"`,
              expand: "role",
              requestKey: null,
            });

            for (const ur of userRoles.items) {
              const role = ur.expand?.role;
              const roleSlug = (role?.slug || "").toLowerCase();
              const roleName = (role?.name || "").toLowerCase();
              if (
                roleSlug === "superadmin" ||
                roleSlug === "super_admin" ||
                roleSlug === "admin" ||
                roleName.includes("superadmin") ||
                roleName.includes("super admin") ||
                roleName.includes("administrador")
              ) {
                isSuperAdmin = true;
                break;
              }
            }
          } catch (roleErr) {
            console.warn("[PURGE API] Could not check hub_user_roles:", roleErr);
          }
        }
      } catch (err) {
        console.error("[PURGE API] Error verifying user permissions:", err);
      }
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado. Se requiere rol Superadmin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "delete_record") {
      return await handleDeleteRecord(adminPb, body);
    } else if (action === "bulk_purge") {
      return await handleBulkPurge(adminPb, body);
    } else {
      return NextResponse.json(
        { success: false, error: "Acción no reconocida." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[PURGE API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * Delete a single record with cascade logic:
 * - Lotes: also unlink all prestaciones that reference this lote
 * - Prestaciones: direct delete
 * - Expedientes: direct delete
 */
async function handleDeleteRecord(adminPb: any, body: any) {
  const { collection, recordId } = body;

  if (!collection || !recordId) {
    return NextResponse.json(
      { success: false, error: "Faltan parámetros: collection y recordId son obligatorios." },
      { status: 400 }
    );
  }

  const ALLOWED_COLLECTIONS = [
    "tesoreria_lotes",
    "prestaciones_presentaciones",
    "expedientes",
  ];

  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json(
      { success: false, error: `Colección '${collection}' no permitida para eliminación.` },
      { status: 400 }
    );
  }

  let cascadeCount = 0;

  // Cascade: if deleting a lote, first unlink all its prestaciones
  if (collection === "tesoreria_lotes") {
    try {
      const lote = await adminPb.collection("tesoreria_lotes").getOne(recordId);
      const prestacionesIds: string[] = lote.prestaciones_ids || [];

      for (const pId of prestacionesIds) {
        try {
          await adminPb.collection("prestaciones_presentaciones").update(pId, {
            lote_id: "",
            lote_numero: "",
            numero_expediente_gde: "",
            numero_resolucion: "",
            numero_orden_pago: "",
          }, { requestKey: null });
          cascadeCount++;
        } catch (e: any) {
          // If the prestacion was already deleted, skip
          if (e?.status !== 404) {
            console.warn(`[PURGE] Could not unlink prestacion ${pId}:`, e?.message);
          }
        }
      }
    } catch (e: any) {
      if (e?.status === 404) {
        return NextResponse.json(
          { success: false, error: "El registro ya no existe." },
          { status: 404 }
        );
      }
      throw e;
    }
  }

  // Delete the record
  await adminPb.collection(collection).delete(recordId);

  return NextResponse.json({
    success: true,
    message: `Registro eliminado correctamente.${cascadeCount > 0 ? ` Se desvincularon ${cascadeCount} prestación(es) del lote.` : ""}`,
    cascadeCount,
  });
}

/**
 * Bulk purge of test data across multiple collections.
 * targets is an array of keys: "lotes", "prestaciones", "expedientes"
 */
async function handleBulkPurge(adminPb: any, body: any) {
  const { targets } = body;

  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    return NextResponse.json(
      { success: false, error: "Debe seleccionar al menos un tipo de datos a purgar." },
      { status: 400 }
    );
  }

  const VALID_TARGETS = ["lotes", "prestaciones", "expedientes"];
  const invalidTargets = targets.filter((t: string) => !VALID_TARGETS.includes(t));
  if (invalidTargets.length > 0) {
    return NextResponse.json(
      { success: false, error: `Targets inválidos: ${invalidTargets.join(", ")}` },
      { status: 400 }
    );
  }

  const results: Record<string, { deleted: number; errors: number }> = {};

  // Order matters: lotes first (to unlink prestaciones), then prestaciones, then expedientes
  if (targets.includes("lotes")) {
    results.lotes = await purgeCollection(adminPb, "tesoreria_lotes");
  }

  if (targets.includes("prestaciones")) {
    // If lotes were also purged, first unlink any remaining prestaciones
    if (targets.includes("lotes")) {
      try {
        const allPrestaciones = await adminPb.collection("prestaciones_presentaciones").getFullList({
          filter: 'lote_id != ""',
          requestKey: null,
        });
        for (const p of allPrestaciones) {
          try {
            await adminPb.collection("prestaciones_presentaciones").update(p.id, {
              lote_id: "",
              lote_numero: "",
              numero_expediente_gde: "",
              numero_resolucion: "",
              numero_orden_pago: "",
            }, { requestKey: null });
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    results.prestaciones = await purgeCollection(adminPb, "prestaciones_presentaciones");
  }

  if (targets.includes("expedientes")) {
    results.expedientes = await purgeCollection(adminPb, "expedientes");
  }

  const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.deleted, 0);
  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

  return NextResponse.json({
    success: true,
    message: `Purga completada. ${totalDeleted} registro(s) eliminados.${totalErrors > 0 ? ` ${totalErrors} error(es).` : ""}`,
    results,
    totalDeleted,
    totalErrors,
  });
}

async function purgeCollection(adminPb: any, collectionName: string) {
  let deleted = 0;
  let errors = 0;

  try {
    const records = await adminPb.collection(collectionName).getFullList({
      requestKey: null,
      batch: 200,
    });

    for (const record of records) {
      try {
        await adminPb.collection(collectionName).delete(record.id, { requestKey: null });
        deleted++;
      } catch (e: any) {
        errors++;
        console.warn(`[PURGE] Error deleting ${collectionName}/${record.id}:`, e?.message);
      }
    }
  } catch (e: any) {
    console.error(`[PURGE] Error fetching ${collectionName}:`, e?.message);
    errors++;
  }

  return { deleted, errors };
}

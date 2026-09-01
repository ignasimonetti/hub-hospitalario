import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pocketbase-admin';

export async function GET() {
  try {
    const pb = await createAdminClient();
    const results: any = {};

    // 0. Asegurar que 'auth_users' tenga el campo 'signature_data'
    try {
      const authUsersCol = await pb.collections.getOne('auth_users');
      const isV23 = Array.isArray((authUsersCol as any).fields);
      const currentFields = (authUsersCol as any).fields || (authUsersCol as any).schema || [];
      const hasSignature = currentFields.some((f: any) => f.name === 'signature_data');

      if (!hasSignature) {
        const updatedFields = [...currentFields, {
          name: 'signature_data',
          type: 'editor',
          required: false,
        }];
        const updatePayload: any = {};
        if (isV23) {
          updatePayload.fields = updatedFields;
        } else {
          updatePayload.schema = updatedFields;
        }
        await pb.collections.update(authUsersCol.id, updatePayload);
        results.auth_users = 'Campo signature_data agregado a auth_users';
      } else {
        results.auth_users = 'auth_users ya tiene el campo signature_data';
      }
    } catch (e: any) {
      results.auth_users_error = e.message;
    }

    // 1. Actualizar o crear colección 'prestadores_perfiles'
    try {
      const existing = await pb.collections.getOne('prestadores_perfiles');
      
      // En PocketBase v0.23+, los campos están en fields en lugar de schema
      // Soportamos tanto fields como schema según la versión
      const isV23 = Array.isArray((existing as any).fields);
      const currentFields = (existing as any).fields || (existing as any).schema || [];

      const hasFile = currentFields.some((f: any) => f.name === 'file_conducta_fiscal');
      const hasDate = currentFields.some((f: any) => f.name === 'conducta_fiscal_due_date');

      let updatedFields = [...currentFields];

      if (!hasFile) {
        updatedFields.push({
          name: 'file_conducta_fiscal',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        });
      }

      if (!hasDate) {
        updatedFields.push({
          name: 'conducta_fiscal_due_date',
          type: 'date',
          required: false,
        });
      }

      if (!hasFile || !hasDate) {
        const updatePayload: any = {
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
        };
        if (isV23) {
          updatePayload.fields = updatedFields;
        } else {
          updatePayload.schema = updatedFields;
        }

        await pb.collections.update(existing.id, updatePayload);
        results.prestadores_perfiles = 'Campos agregados exitosamente';
      } else {
        results.prestadores_perfiles = 'Ya cuenta con los campos necesarios';
      }
    } catch (e: any) {
      results.prestadores_perfiles_error = e.message;
    }

    // 2. Comprobar / Crear colección 'prestaciones_presentaciones'
    try {
      await pb.collections.getOne('prestaciones_presentaciones');
      results.prestaciones_presentaciones = 'Ya existe';
    } catch (e) {
      try {
        await pb.collections.create({
          name: 'prestaciones_presentaciones',
          type: 'base',
          schema: [
            { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
            { name: 'tenant', type: 'relation', required: false, collectionId: 'tenants', maxSelect: 1 },
            { name: 'periodo', type: 'text', required: true },
            { name: 'tipo_prestacion', type: 'text', required: true },
            { name: 'cantidad_turnos', type: 'number', required: false },
            { name: 'monto_facturado', type: 'number', required: false },
            { name: 'estado', type: 'select', required: true, options: { values: ['borrador', 'presentado', 'aprobado', 'observado', 'pagado'] } },
            { name: 'file_factura', type: 'file', required: false, maxSelect: 1, maxSize: 10485760 },
            { name: 'file_informe', type: 'file', required: false, maxSelect: 1, maxSize: 10485760 },
            { name: 'file_conducta_fiscal', type: 'file', required: false, maxSelect: 1, maxSize: 10485760 },
            { name: 'observaciones', type: 'text', required: false }
          ],
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
        });
        results.prestaciones_presentaciones = 'Creada exitosamente';
      } catch (errCreate: any) {
        results.prestaciones_presentaciones_error = errCreate.message;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

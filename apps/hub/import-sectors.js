const PocketBase = require('pocketbase/cjs');
require('dotenv').config({ path: '.env.local' });

async function importSectors() {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar');

    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set');
        return;
    }

    try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('Authenticated as Admin');

        // Get target tenant
        const tenants = await pb.collection('hub_tenants').getFullList(1);
        if (tenants.length === 0) {
            console.error('No tenants found');
            return;
        }
        const targetTenant = tenants[0].id;
        console.log(`Target Tenant: ${tenants[0].name} (${targetTenant})`);

        const sectors = [
            "Consultorio Neurodesarrollo uti pediatrica",
            "Coordinación de enfermería (dirección)",
            "Administativo Rayos X",
            "Administracion",
            "Administración Deposito",
            "Admision Adulto",
            "Admision de guardia",
            "Admision de laboratorio",
            "Admision gral.",
            "Admision Imagenes",
            "Admision Maternidad",
            "Admisión Obstetricia",
            "Admision Pediatria",
            "Ambulancia",
            "Archivo",
            "Area Monitoreo",
            "Auto Gestion",
            "Bienes patrimoniales",
            "Casa Hogar",
            "Centro de Computos",
            "Centro de Cómputos",
            "Centro Obstetrico quirofano",
            "Choferes",
            "Comedor",
            "Consultorio Adulto",
            "Consultorio Adulto DBT",
            "Consultorio de Alto Riesgo",
            "Consultorio Maternidad",
            "Consultorio Neuro desarrollo",
            "Consultorio Pediatria",
            "Departamento contable",
            "Departamento de compras",
            "Departamento Personal",
            "Deposito central",
            "Diálisis",
            "Diálisis Peritoneal",
            "Direccion",
            "Docencia e Investigación",
            "Enfermería Maternidad",
            "Epidemiologia",
            "Ergometria",
            "Ergonometría",
            "Escuela Hospitalaria",
            "Estadistica",
            "esteri",
            "Esterilizacion",
            "Farmacia",
            "GUARDIA",
            "Guardia Central",
            "Guardia de Obstetricia",
            "guardia obstetricia",
            "Habilitación",
            "Hemoterapia",
            "Identificador del recién nacido",
            "Imagenes",
            "Internacion Adulto A",
            "Internacion Adulto B",
            "Internacion Maternidad",
            "Internacion maternidad B",
            "Internacion Pediatria",
            "Internacion pediatria B",
            "Kinesiología",
            "Laboratorio",
            "Lavadero",
            "Legales",
            "Limpieza",
            "Mantenimiento Informático",
            "Mantenimiento y Logística",
            "Mesa de Entrada",
            "Monitoreo de Internaciones",
            "Morgue",
            "Neonatologia",
            "Nutrición",
            "OCD",
            "Odontologia Adulto",
            "Odontologia Maternidad",
            "Odontologia Pediatria",
            "Oficina de Auditoria",
            "Oficina de Habilitacion",
            "Oftalmología",
            "Paramédicos",
            "Personal 1° piso",
            "Personal PB",
            "Programa Flap",
            "Psiquiatría",
            "Quirofano Central",
            "Radio Operador",
            "Recupero de Gastos",
            "Ropería",
            "Secretaria de maternidad sec A y B",
            "Secretaria sala Adulto sec A y B",
            "Secretaria sala Pediatría sec A y B",
            "Servicios Social",
            "Shock Room 3",
            "Shock Room 4",
            "Supervision de Enfermeria",
            "Supervision de Obstetricia",
            "taller de pin",
            "Tesoreria",
            "Traumatologia",
            "UTI",
            "Vacunatorio"
        ];

        let imported = 0;
        let skipped = 0;

        for (const name of sectors) {
            const existing = await pb.collection('ubicaciones').getList(1, 1, {
                filter: `nombre = "${name.replace(/"/g, '\\"')}" && tenant = "${targetTenant}"`
            });

            if (existing.totalItems === 0) {
                await pb.collection('ubicaciones').create({
                    nombre: name,
                    tenant: targetTenant
                });
                imported++;
            } else {
                skipped++;
            }
        }

        console.log(`Success: ${imported} imported, ${skipped} skipped.`);

    } catch (error) {
        console.error('Import failed:', error);
    }
}

importSectors();

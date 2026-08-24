import { pocketbase } from "@/lib/auth";
import {
  ConfiguracionModuloPrestadores,
  DEFAULT_CONFIGURACION_PRESTADORES,
} from "@/types/prestadores";
import {
  ConfiguracionModuloTesoreria,
  DEFAULT_CONFIGURACION_TESORERIA,
} from "@/types/tesoreria";

const STORAGE_KEY = "hub_config_modulo_prestadores";

/**
 * Obtiene la configuración de aranceles y topes para el módulo de Prestadores y Tesorería
 */
export async function getPrestadoresConfig(tenantId?: string): Promise<ConfiguracionModuloPrestadores> {
  // 1. Intentar obtener desde PocketBase
  try {
    const filter = `key = "prestadores_config"`;
    const record = await pocketbase
      .collection("sys_config")
      .getFirstListItem(filter, { requestKey: null });

    if (record && record.value) {
      const parsed = typeof record.value === "string" ? JSON.parse(record.value) : record.value;
      return { ...DEFAULT_CONFIGURACION_PRESTADORES, ...parsed };
    }
  } catch (error) {
    // Si no existe la colección o el registro en PB, probar localStorage
  }

  // 2. Fallback a localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_CONFIGURACION_PRESTADORES, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
  }

  return DEFAULT_CONFIGURACION_PRESTADORES;
}

/**
 * Guarda la configuración de aranceles y topes para el módulo de Prestadores
 */
export async function savePrestadoresConfig(
  config: ConfiguracionModuloPrestadores,
  tenantId?: string
): Promise<ConfiguracionModuloPrestadores> {
  const updatedConfig: ConfiguracionModuloPrestadores = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  // 1. Guardar en localStorage inmediatamente para reactividad instantánea
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
    } catch (e) {
      console.warn("Could not save config to localStorage", e);
    }
  }

  // 2. Persistir en PocketBase si existe la colección
  try {
    const filter = `key = "prestadores_config"`;
    let existingRecord = null;
    try {
      existingRecord = await pocketbase
        .collection("sys_config")
        .getFirstListItem(filter, { requestKey: null });
    } catch {
      existingRecord = null;
    }

    if (existingRecord) {
      await pocketbase.collection("sys_config").update(
        existingRecord.id,
        {
          value: JSON.stringify(updatedConfig),
        },
        { requestKey: null }
      );
    } else {
      await pocketbase.collection("sys_config").create(
        {
          key: "prestadores_config",
          value: JSON.stringify(updatedConfig),
          description: "Configuracion general de aranceles de prestadores",
        },
        { requestKey: null }
      );
    }
  } catch (error) {
    console.info("Info: Configuración guardada en caché local del sistema.", error);
  }

  return updatedConfig;
}

const TESORERIA_STORAGE_KEY = "hub_config_modulo_tesoreria";

/**
 * Obtiene la configuración global del módulo de Tesorería
 */
export async function getTesoreriaConfig(tenantId?: string): Promise<ConfiguracionModuloTesoreria> {
  // 1. Intentar obtener desde PocketBase
  try {
    const filter = `key = "tesoreria_config"`;
    const record = await pocketbase
      .collection("sys_config")
      .getFirstListItem(filter, { requestKey: null });

    if (record && record.value) {
      const parsed = typeof record.value === "string" ? JSON.parse(record.value) : record.value;
      return { ...DEFAULT_CONFIGURACION_TESORERIA, ...parsed };
    }
  } catch (error) {
    // Si no existe la colección o el registro en PB, probar localStorage
  }

  // 2. Fallback a localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(TESORERIA_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_CONFIGURACION_TESORERIA, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
  }

  return DEFAULT_CONFIGURACION_TESORERIA;
}

/**
 * Guarda la configuración global del módulo de Tesorería
 */
export async function saveTesoreriaConfig(
  config: ConfiguracionModuloTesoreria,
  tenantId?: string
): Promise<ConfiguracionModuloTesoreria> {
  const updatedConfig: ConfiguracionModuloTesoreria = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  // 1. Guardar en localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TESORERIA_STORAGE_KEY, JSON.stringify(updatedConfig));
    } catch (e) {
      console.warn("Could not save tesoreria config to localStorage", e);
    }
  }

  // 2. Persistir en PocketBase si existe la colección sys_config
  try {
    const filter = `key = "tesoreria_config"`;
    let existingRecord = null;
    try {
      existingRecord = await pocketbase
        .collection("sys_config")
        .getFirstListItem(filter, { requestKey: null });
    } catch {
      existingRecord = null;
    }

    if (existingRecord) {
      await pocketbase.collection("sys_config").update(
        existingRecord.id,
        {
          value: JSON.stringify(updatedConfig),
        },
        { requestKey: null }
      );
    } else {
      await pocketbase.collection("sys_config").create(
        {
          key: "tesoreria_config",
          value: JSON.stringify(updatedConfig),
          description: "Configuración global de Tesorería y Expedientes GDE",
        },
        { requestKey: null }
      );
    }
  } catch (error) {
    console.info("Info: Configuración de Tesorería guardada en caché local.", error);
  }

  return updatedConfig;
}

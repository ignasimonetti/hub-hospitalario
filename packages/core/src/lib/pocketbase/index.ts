/**
 * PocketBase - Cliente y utilidades de conectividad
 * 
 * Este archivo centraliza toda la lógica relacionada con la conexión y 
 * operaciones de base de datos con PocketBase.
 */
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase.manta.com.ar'; // URL corregida

/**
 * Instancia singleton de PocketBase
 */
export const pb = new PocketBase(POCKETBASE_URL);

/**
 * Autenticación con credenciales de administrador
 */
export async function authenticateAdmin(): Promise<any> {
  try {
    const authData = await pb.admins.authWithPassword(
      'ignaciosimonetti1984@gmail.com',
      'Millonarios10$'
    );
    console.log('Autenticación de administrador exitosa:', authData);
    return authData;
  } catch (error) {
    console.error('Error al autenticar como administrador:', error);
    throw error;
  }
}

/**
 * Autenticación de usuarios regulares
 */
export async function authenticateUser(email: string, password: string): Promise<any> {
  try {
    const authData = await pb.collection('hub_users').authWithPassword(email, password);
    return authData;
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    throw error;
  }
}

/**
 * Operaciones básicas para la colección hub_hospitals
 */
export const hospitals = {
  /**
   * Obtener lista de hospitales
   */
  getList: async (page = 1, perPage = 50) => {
    try {
      return await pb.collection('hub_hospitals').getList(page, perPage);
    } catch (error) {
      console.error('Error al obtener lista de hospitales:', error);
      throw error;
    }
  },

  /**
   * Obtener hospital por ID
   */
  getOne: async (id: string) => {
    try {
      return await pb.collection('hub_hospitals').getOne(id);
    } catch (error) {
      console.error(`Error al obtener hospital con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear nuevo hospital
   */
  create: async (data: Record<string, any>) => {
    try {
      return await pb.collection('hub_hospitals').create(data);
    } catch (error) {
      console.error('Error al crear hospital:', error);
      throw error;
    }
  },

  /**
   * Actualizar hospital
   */
  update: async (id: string, data: Record<string, any>) => {
    try {
      return await pb.collection('hub_hospitals').update(id, data);
    } catch (error) {
      console.error(`Error al actualizar hospital con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar hospital
   */
  delete: async (id: string) => {
    try {
      return await pb.collection('hub_hospitals').delete(id);
    } catch (error) {
      console.error(`Error al eliminar hospital con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Buscar hospitales
   */
  search: async (searchTerm: string) => {
    try {
      const result = await pb.collection('hub_hospitals').getList(1, 50, {
        filter: `name ~ "${searchTerm}" || city ~ "${searchTerm}"`,
        sort: 'name'
      });
      return result.items;
    } catch (error) {
      console.error(`Error al buscar hospitales con término "${searchTerm}":`, error);
      throw error;
    }
  }
};

/**
 * Operaciones básicas para la colección hub_users
 */
export const users = {
  /**
   * Obtener lista de usuarios
   */
  getList: async (page = 1, perPage = 50) => {
    try {
      return await pb.collection('hub_users').getList(page, perPage);
    } catch (error) {
      console.error('Error al obtener lista de usuarios:', error);
      throw error;
    }
  },

  /**
   * Obtener usuario por ID
   */
  getOne: async (id: string) => {
    try {
      return await pb.collection('hub_users').getOne(id);
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear nuevo usuario
   */
  create: async (data: Record<string, any>) => {
    try {
      return await pb.collection('hub_users').create(data);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  /**
   * Actualizar usuario
   */
  update: async (id: string, data: Record<string, any>) => {
    try {
      return await pb.collection('hub_users').update(id, data);
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar usuario
   */
  delete: async (id: string) => {
    try {
      return await pb.collection('hub_users').delete(id);
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener usuarios de un hospital específico
   */
  getByHospital: async (hospitalId: string) => {
    try {
      const result = await pb.collection('hub_users').getFullList(1000, {
        filter: `hospital.id = "${hospitalId}"`
      });
      return result;
    } catch (error) {
      console.error(`Error al obtener usuarios del hospital ${hospitalId}:`, error);
      throw error;
    }
  }
};

/**
 * Suscripción en tiempo real a cambios en una colección
 */
export function subscribeToCollection(
  collection: string,
  callback: (e: any) => void,
  filter?: string
) {
  try {
    return pb.collection(collection).subscribe(filter || '*', callback);
  } catch (error) {
    console.error(`Error al suscribirse a cambios en ${collection}:`, error);
    throw error;
  }
}

/**
 * Cancelar suscripción a una colección
 */
export function unsubscribeFromCollection(collection: string) {
  try {
    return pb.collection(collection).unsubscribe();
  } catch (error) {
    console.error(`Error al cancelar suscripción a ${collection}:`, error);
    throw error;
  }
}

/**
 * Funciones para manejo de autenticación JWT
 */
export const auth = {
  /**
   * Obtener el token JWT del usuario actual
   */
  getToken: () => {
    return pb.authStore.token;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: () => {
    return pb.authStore.isValid;
  },

  /**
   * Cerrar sesión
   */
  logout: () => {
    pb.authStore.clear();
  }
};

/**
 * Función de prueba para verificar la conectividad con PocketBase
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Intenta autenticar como administrador
    await authenticateAdmin();

    // Intenta listar hospitales
    const hospitals = await pb.collection('hub_hospitals').getList(1, 10);
    console.log(`Conexión exitosa. Se encontraron ${hospitals.totalItems} hospitales.`);

    return true;
  } catch (error) {
    console.error('Error de conexión:', error.message);
    return false;
  }
}

/**
 * Exportación por defecto de la instancia de PocketBase
 */
export default pb;
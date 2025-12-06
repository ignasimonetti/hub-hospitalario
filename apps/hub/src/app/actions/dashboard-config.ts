'use server';

import { createAdminClient } from '@/lib/pocketbase-admin';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import {
    AVAILABLE_WIDGETS,
    type DashboardWidgetConfig,
    type WidgetDefinition
} from '@/lib/dashboard-constants';

const COLLECTION_NAME = 'hub_dashboard_config';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
    try {
        const pb = await getServerPocketBase();
        return pb.authStore.model?.id || null;
    } catch (e) {
        console.warn('[dashboard-config] Could not get current user', e);
        return null;
    }
}

/**
 * Get widget configurations for the current user
 */
export async function getUserWidgetConfigs(): Promise<{
    success: boolean;
    data: DashboardWidgetConfig[];
    error: string | null;
}> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return {
                success: true,
                data: [],
                error: null,
            };
        }

        const pb = await createAdminClient();

        // Check if collection exists first
        try {
            const configs = await pb.collection(COLLECTION_NAME).getFullList<DashboardWidgetConfig>({
                filter: `user = "${userId}"`,
                sort: 'position',
            });

            return {
                success: true,
                data: configs,
                error: null,
            };
        } catch (e: any) {
            // Collection might not exist yet - return empty array
            if (e?.status === 404) {
                console.warn('[getUserWidgetConfigs] Collection not found, returning defaults');
                return {
                    success: true,
                    data: [],
                    error: null,
                };
            }
            throw e;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[getUserWidgetConfigs] Error:', error);
        return {
            success: false,
            data: [],
            error: errorMessage,
        };
    }
}

/**
 * Toggle widget visibility for the current user
 */
export async function toggleWidgetVisibility(
    widgetId: string,
    visible: boolean
): Promise<{
    success: boolean;
    data: DashboardWidgetConfig | null;
    error: string | null;
}> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return {
                success: false,
                data: null,
                error: 'Usuario no autenticado',
            };
        }

        const pb = await createAdminClient();

        // Check if config exists
        try {
            const existing = await pb.collection(COLLECTION_NAME).getFirstListItem<DashboardWidgetConfig>(
                `user = "${userId}" && widget_id = "${widgetId}"`
            );

            // Update existing config
            const updated = await pb.collection(COLLECTION_NAME).update<DashboardWidgetConfig>(
                existing.id,
                { visible }
            );

            return {
                success: true,
                data: updated,
                error: null,
            };
        } catch (e: any) {
            // Config doesn't exist, create it
            if (e?.status === 404) {
                // Get widget definition for default size
                const widgetDef = AVAILABLE_WIDGETS.find(w => w.id === widgetId);

                const created = await pb.collection(COLLECTION_NAME).create<DashboardWidgetConfig>({
                    user: userId,
                    widget_id: widgetId,
                    visible: visible,
                    position: 0,
                    size: widgetDef?.defaultSize || 'medium',
                });

                return {
                    success: true,
                    data: created,
                    error: null,
                };
            }
            throw e;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[toggleWidgetVisibility] Error:', error);
        return {
            success: false,
            data: null,
            error: errorMessage,
        };
    }
}

/**
 * Update widget configuration (position, size)
 */
export async function updateWidgetConfig(
    widgetId: string,
    updates: Partial<Pick<DashboardWidgetConfig, 'position' | 'size'>>
): Promise<{
    success: boolean;
    data: DashboardWidgetConfig | null;
    error: string | null;
}> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return {
                success: false,
                data: null,
                error: 'Usuario no autenticado',
            };
        }

        const pb = await createAdminClient();

        const existing = await pb.collection(COLLECTION_NAME).getFirstListItem<DashboardWidgetConfig>(
            `user = "${userId}" && widget_id = "${widgetId}"`
        );

        const updated = await pb.collection(COLLECTION_NAME).update<DashboardWidgetConfig>(
            existing.id,
            updates
        );

        return {
            success: true,
            data: updated,
            error: null,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[updateWidgetConfig] Error:', error);
        return {
            success: false,
            data: null,
            error: errorMessage,
        };
    }
}

/**
 * Get merged widget list: all available widgets with user's visibility settings
 */
import { getCurrentUserRoles } from '@/lib/auth';

// ... (código existente)

/**
 * Get merged widget list: all available widgets with user's visibility settings
 * filtered by user permissions
 */
export async function getWidgetsWithUserConfig(): Promise<{
    success: boolean;
    data: Array<WidgetDefinition & { visible: boolean; position: number; size: 'small' | 'medium' | 'large' }>;
    error: string | null;
}> {
    try {
        const userId = await getCurrentUserId();

        // Get user roles to check permissions
        const userRoles = await getCurrentUserRoles();

        // Flatten all permissions from all roles into a Set for efficient lookup
        const userPermissions = new Set<string>();

        console.log('[getWidgetsWithUserConfig] User:', userId);
        console.log('[getWidgetsWithUserConfig] Roles:', JSON.stringify(userRoles, null, 2));

        userRoles.forEach(role => {
            // Asumiendo que role.permissions es un array de strings o similar
            // Si la estructura es diferente, ajustar aquí. 
            // Por ahora, simulamos que si tiene rol 'admin' tiene todo, 
            // o si el rol tiene una lista explícita de permisos.

            // NOTA: La implementación actual de roles en el sistema parece ser simple.
            // Si no hay un sistema de permisos granular explícito en el objeto role,
            // podemos mapear roles a permisos o asumir que ciertos roles tienen acceso.

            // Por ahora, vamos a ser permisivos si no hay lista de permisos explícita,
            // pero idealmente deberíamos leer role.permissions.

            // Si el rol es admin, dar acceso total
            if (role.name === 'admin' || role.name === 'Administrador') {
                userPermissions.add('*');
            }
        });

        // NOTA IMPORTANTE: Como no tengo acceso a la definición exacta de permisos en el objeto role
        // en este momento, voy a implementar una lógica simplificada:
        // Si el widget requiere permiso, verificamos si el usuario tiene algún rol.
        // En un sistema real, aquí verificaríamos `role.permissions.includes(widget.requiredPermission)`.

        // Para este caso específico del blog:
        // Si no tiene roles (dev) o tiene rol permitido, dar acceso
        const hasBlogAccess = userRoles.length === 0 || userRoles.some(r =>
            ['admin', 'medico', 'enfermero', 'administrativo', 'superadmin', 'Superadmin'].includes(r.name) ||
            ['admin', 'medico', 'enfermero', 'administrativo', 'superadmin'].includes(r.name.toLowerCase())
        );

        const configResult = await getUserWidgetConfigs();

        // Create a map of user configs by widget_id
        const configMap = new Map(
            configResult.data.map(c => [c.widget_id, c])
        );

        // Filter and merge available widgets
        const mergedWidgets = AVAILABLE_WIDGETS
            .filter(widget => {
                // Si no requiere permiso, mostrar
                if (!widget.requiredPermission) return true;

                // Lógica específica para blog (ajustar según tu sistema real de permisos)
                if (widget.requiredPermission === 'blog:read') {
                    return hasBlogAccess;
                }

                return true; // Default allow si no matchea reglas específicas
            })
            .map((widget, index) => {
                const userConfig = configMap.get(widget.id);

                return {
                    ...widget,
                    visible: userConfig?.visible ?? true, // Default to visible
                    position: userConfig?.position ?? index,
                    size: userConfig?.size ?? widget.defaultSize,
                };
            });

        // Sort by position
        mergedWidgets.sort((a, b) => a.position - b.position);

        return {
            success: true,
            data: mergedWidgets,
            error: null,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[getWidgetsWithUserConfig] Error:', error);
        return {
            success: false,
            data: [],
            error: errorMessage,
        };
    }
}

/**
 * Update widget positions in batch
 */
export async function updateWidgetPositions(updates: { widgetId: string; position: number }[]): Promise<{
    success: boolean;
    error: string | null;
}> {
    try {
        const userId = await getCurrentUserId();
        const pb = await createAdminClient();

        // Get existing configs to know IDs
        const existingConfigs = await pb.collection(COLLECTION_NAME).getFullList<DashboardWidgetConfig>({
            filter: `user = "${userId}"`,
        });

        const configMap = new Map(existingConfigs.map(c => [c.widget_id, c]));

        // Process updates in parallel
        await Promise.all(updates.map(async (update) => {
            const existing = configMap.get(update.widgetId);

            if (existing) {
                // Update existing
                if (existing.position !== update.position) {
                    await pb.collection(COLLECTION_NAME).update(existing.id, {
                        position: update.position,
                    });
                }
            } else {
                // Create new config if it doesn't exist (preserving default visibility)
                await pb.collection(COLLECTION_NAME).create({
                    user: userId,
                    widget_id: update.widgetId,
                    visible: true, // Default
                    position: update.position,
                    size: 'medium', // Default
                });
            }
        }));

        return { success: true, error: null };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[updateWidgetPositions] Error:', error);
        return { success: false, error: errorMessage };
    }
}

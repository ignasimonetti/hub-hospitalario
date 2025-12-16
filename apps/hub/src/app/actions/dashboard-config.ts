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
/**
 * Helper to fetch user roles server-side
 */
async function fetchUserRoles(userId: string) {
    try {
        const pb = await createAdminClient();
        const records = await pb.collection('hub_user_roles').getFullList({
            filter: `user = "${userId}"`,
            expand: 'role'
        });

        // Extract the actual role objects
        return records.map(r => r.expand?.role).filter(Boolean);
    } catch (e) {
        console.error('Error fetching user roles:', e);
        return [];
    }
}

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
        // We must fetch this server-side using the admin client or server context
        // reusing client-side auth.ts functions here won't work due to empty authStore on server actions
        const userRoles = userId ? await fetchUserRoles(userId) : [];

        // Flatten all permissions from all roles into a Set for efficient lookup
        const userPermissions = new Set<string>();

        // console.log('[getWidgetsWithUserConfig] User:', userId);
        // console.log('[getWidgetsWithUserConfig] Roles:', JSON.stringify(userRoles, null, 2));

        userRoles.forEach((role: any) => {
            // Si el rol es admin, dar acceso total
            if (['admin', 'administrator', 'administrador', 'superadmin', 'super_admin', 'super_usuario', 'sysadmin', 'root'].includes(role.slug) ||
                ['admin', 'administrator', 'administrador', 'superadmin', 'super admin', 'super usuario', 'sysadmin', 'sistema'].includes(role.name?.toLowerCase())) {
                userPermissions.add('*');
            }
        });

        // Para este caso específico del blog:
        // Si no tiene roles (dev) o tiene rol permitido, dar acceso
        const hasBlogAccess = userRoles.length === 0 || userRoles.some((r: any) =>
            ['admin', 'medico', 'enfermero', 'administrativo', 'superadmin', 'super_admin', 'editor_blog', 'editor blog'].includes(r.slug) ||
            ['admin', 'medico', 'enfermero', 'administrativo', 'superadmin', 'editor'].some(allowed => r.name?.toLowerCase().includes(allowed))
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

                // Lógica específica para blog
                if (widget.requiredPermission === 'blog:read') {
                    return hasBlogAccess;
                }

                // Lógica para expedientes
                if (widget.requiredPermission === 'expedientes:read') {
                    // Check logic similar to Sidebar: isAdmin or isMesaEntrada
                    const isMesaEntrada = userRoles.some((r: any) =>
                        ['mesa_entrada', 'mesa de entrada', 'mesa de entradas'].includes(r.slug || '') ||
                        (r.name || '').toLowerCase().includes('mesa de entrada')
                    );

                    const isAdmin = userRoles.some((r: any) =>
                        ['superadmin', 'super_admin', 'admin', 'administrador', 'super_usuario', 'sysadmin', 'root'].includes(r.slug || '') ||
                        ['superadmin', 'super admin', 'administrador', 'admin', 'super usuario', 'sysadmin', 'sistema'].includes((r.name || '').toLowerCase())
                    );

                    return isAdmin || isMesaEntrada;
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

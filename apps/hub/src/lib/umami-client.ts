
const UMAMI_API_URL = process.env.UMAMI_API_URL || '';
const UMAMI_USER = process.env.UMAMI_API_USER || '';
const UMAMI_PASSWORD = process.env.UMAMI_API_PASSWORD || '';
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        console.log('Authenticating with Umami...');
        const response = await fetch(`${UMAMI_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: UMAMI_USER,
                password: UMAMI_PASSWORD,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Umami Login Failed [${response.status}]:`, errorText);
            throw new Error(`Umami Login Failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Estrategia 1: Token en el cuerpo JSON (Umami v1 / algunas v2)
        let token = data.token;

        // Estrategia 2: Token en User Object
        if (!token && data.user && data.user.token) {
            token = data.user.token;
        }

        // Estrategia 3: Token en Cookies (Umami v2.9+)
        // Nota: En servidor Next.js, 'set-cookie' puede venir en headers
        if (!token) {
            const setCookieHeader = response.headers.get('set-cookie');
            if (setCookieHeader) {
                // Buscamos algo tipo "umami.auth=eyJ..."
                const match = setCookieHeader.match(/umami\.auth=([^;]+)/);
                if (match) {
                    token = match[1];
                    console.log('Token encontrado en cookies');
                }
            }
        }

        if (!token) {
            console.error('No se encontró token en la respuesta de login (JSON ni Cookies). Estructura recibida:', JSON.stringify(data, null, 2));
            return null;
        }

        console.log('Umami Authentication Successful');
        cachedToken = token;
        tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

        return cachedToken;
    } catch (error) {
        console.error('Error authenticating with Umami:', error);
        return null;
    }
}

export async function getRealtimeVisitors() {
    const token = await getAuthToken();
    if (!token) return null;

    try {
        const endAt = Date.now();
        const startAt = endAt - (30 * 24 * 60 * 60 * 1000); // 30 días

        // 1. Petición de Estadísticas Generales
        const statsPromise = fetch(
            `${UMAMI_API_URL}/api/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
            {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                cache: 'no-store'
            }
        );

        // 2. Petición de Métricas Bibliográficas (Ciudades) - Top 5
        const countriesPromise = fetch(
            `${UMAMI_API_URL}/api/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=city&limit=5`,
            {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                cache: 'no-store'
            }
        );

        const [statsResponse, countriesResponse] = await Promise.all([statsPromise, countriesPromise]);

        if (!statsResponse.ok) {
            console.error('Error fetching stats:', await statsResponse.text());
            return null;
        }

        const rawStats = await statsResponse.json();

        // Procesar lista de países
        let locations: { code: string; count: number }[] = [];
        if (countriesResponse.ok) {
            const countries = await countriesResponse.json();



            // Mapa de ciudades conocidas para fallback de banderas
            const KNOWN_CITIES: Record<string, string> = {
                'Santiago del Estero': 'AR',
                'Santiago del Estero Capital': 'AR',
                'La Banda': 'AR',
                'Buenos Aires': 'AR',
                'CABA': 'AR',
                'Cordoba': 'AR',
                'Córdoba': 'AR',
                'Rosario': 'AR',
                'Mendoza': 'AR',
                'San Miguel de Tucuman': 'AR',
                'Tucumán': 'AR'
            };

            // Umami devuelve array [{ x: 'AR', y: 154 }, ...]
            if (Array.isArray(countries)) {
                locations = countries.map((c: any) => {
                    const cityName = c.x; // 'Santiago del Estero', etc.
                    // Intentar obtener país de la API (c.country) o del mapa conocido
                    let countryCode = c.country || KNOWN_CITIES[cityName] || KNOWN_CITIES[cityName.split(',')[0].trim()];

                    return {
                        code: cityName,
                        country: countryCode,
                        count: Math.round(c.y)
                    };
                });
            }
        }

        // Calcular métricas derivadas
        const totalVisits = Number(rawStats.visits?.value || rawStats.visits || 0);
        // const totalBounces = Number(rawStats.bounces?.value || rawStats.bounces || 0);
        const totalTime = Number(rawStats.totalTime?.value || rawStats.totaltime?.value || rawStats.total_time?.value || 0);

        // const calculatedBounceRate = totalVisits > 0 ? Math.round((totalBounces / totalVisits) * 100) : 0;
        const averageTime = totalVisits > 0 ? Math.round(totalTime / totalVisits) : 0;

        const stats = {
            pageviews: {
                value: Number(rawStats.pageviews?.value || rawStats.pageviews || 0),
                change: 0
            },
            visitors: {
                value: Number(rawStats.visitors?.value || rawStats.visitors || 0),
                change: 0
            },
            visits: {
                value: totalVisits,
                change: 0
            },
            locations: locations, // Array de { code, count }
            totalTime: {
                value: averageTime,
                change: 0
            }
        };

        return stats;

    } catch (error) {
        console.error('Error fetching Umami stats:', error);
        return null;
    }
}

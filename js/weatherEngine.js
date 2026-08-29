/**
 * ============================================================================
 * AURA WEATHER — WEATHER & AIR QUALITY ENGINE (js/weatherEngine.js)
 * ----------------------------------------------------------------------------
 * Handles all REST API requests to Open-Meteo (100% Free, Global, No API Key):
 * 1. Geocoding API: Global City/State/Country search with latitude & longitude.
 * 2. Forecast API: Real-time temperature, wind, humidity, UV, pressure, 24h timeline.
 * 3. Air Quality API: Real-time PM2.5, PM10, NO2, Ozone, and US AQI index.
 * 4. WMO Weather Code Transformer: Translates weather codes into animation states.
 * ============================================================================
 */

class WeatherEngine {
    constructor() {
        // Base API URLs for Open-Meteo Services
        this.GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
        this.FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
        this.AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

        // Logger callback for developer diagnostic drawer
        this.onLogCallback = null;
    }

    /**
     * Internal helper to send status logs to developer diagnostic console
     * @param {string} message - Log message text
     * @param {boolean} isError - True if error status
     */
    log(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        const logLine = `[${timestamp}] ${isError ? 'ERROR: ' : 'INFO: '}${message}`;
        console.log(logLine);
        if (this.onLogCallback) {
            this.onLogCallback(logLine, isError);
        }
    }

    /**
     * Search for cities worldwide using Open-Meteo Geocoding API
     * @param {string} query - Search string (e.g. "Tokyo", "London", "New York")
     * @returns {Promise<Array>} List of location objects with name, country, lat, lon
     */
    async searchLocation(query) {
        if (!query || query.trim().length < 2) return [];

        try {
            this.log(`Querying Geocoding API for: "${query}"...`);
            const response = await fetch(`${this.GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            
            if (!response.ok) {
                throw new Error(`Geocoding HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                this.log(`No location matches found for "${query}".`, false);
                return [];
            }

            this.log(`Found ${data.results.length} location candidate(s) for "${query}".`);
            return data.results.map(loc => ({
                name: loc.name,
                country: loc.country || '',
                admin1: loc.admin1 || '', // State / Region
                latitude: loc.latitude,
                longitude: loc.longitude,
                countryCode: loc.country_code || ''
            }));
        } catch (error) {
            this.log(`Failed to fetch location data: ${error.message}`, true);
            throw error;
        }
    }

    /**
     * Fetch complete weather dataset (Forecast + Air Quality) for given coordinates
     * @param {number} latitude - Target latitude
     * @param {number} longitude - Target longitude
     * @returns {Promise<Object>} Formatted unified weather payload
     */
    async fetchWeatherData(latitude, longitude) {
        try {
            this.log(`Fetching live weather & air quality for lat: ${latitude}, lon: ${longitude}...`);

            // Build forecast API parameters query
            const weatherParams = new URLSearchParams({
                latitude: latitude,
                longitude: longitude,
                current: [
                    'temperature_2m',
                    'relative_humidity_2m',
                    'apparent_temperature',
                    'is_day',
                    'precipitation',
                    'rain',
                    'showers',
                    'snowfall',
                    'weather_code',
                    'surface_pressure',
                    'wind_speed_10m',
                    'wind_direction_10m',
                    'uv_index'
                ].join(','),
                hourly: [
                    'temperature_2m',
                    'relative_humidity_2m',
                    'precipitation_probability',
                    'weather_code',
                    'uv_index'
                ].join(','),
                daily: [
                    'weather_code',
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'sunrise',
                    'sunset',
                    'precipitation_probability_max',
                    'uv_index_max'
                ].join(','),
                timezone: 'auto'
            });

            // Build Air Quality API parameters query
            const aqiParams = new URLSearchParams({
                latitude: latitude,
                longitude: longitude,
                current: ['us_aqi', 'pm10', 'pm2_5', 'nitrogen_dioxide', 'ozone'].join(',')
            });

            // Fetch both Weather and Air Quality concurrently for speed
            const [weatherRes, aqiRes] = await Promise.all([
                fetch(`${this.FORECAST_URL}?${weatherParams.toString()}`),
                fetch(`${this.AIR_QUALITY_URL}?${aqiParams.toString()}`)
            ]);

            if (!weatherRes.ok) throw new Error(`Weather API Error (Status: ${weatherRes.status})`);
            if (!aqiRes.ok) throw new Error(`Air Quality API Error (Status: ${aqiRes.status})`);

            const weatherData = await weatherRes.json();
            const aqiData = await aqiRes.json();

            this.log(`Successfully received atmospheric payload.`);

            // Parse and return structured object
            return this.transformPayload(weatherData, aqiData);

        } catch (error) {
            this.log(`Weather Data Fetch Error: ${error.message}`, true);
            throw error;
        }
    }

    /**
     * Transform raw Open-Meteo payloads into clean application weather model
     * @param {Object} rawWeather - Raw weather JSON response
     * @param {Object} rawAqi - Raw air quality JSON response
     * @returns {Object} Structured UI-ready weather model
     */
    transformPayload(rawWeather, rawAqi) {
        const cur = rawWeather.current;
        const curUnits = rawWeather.current_units;
        const daily = rawWeather.daily;
        const hourly = rawWeather.hourly;
        const aqiCur = rawAqi.current || {};

        // WMO Code translation
        const weatherInfo = this.getWmoInfo(cur.weather_code, cur.is_day);

        // US Air Quality Safety Rating
        const aqiVal = Math.round(aqiCur.us_aqi || 0);
        const aqiRating = this.getAqiRating(aqiVal);

        // Hourly 24-Hour Forecast array (taking first 24 items starting from current hour)
        const hourlyItems = [];
        if (hourly && hourly.time) {
            const now = new Date();
            const currentHourIso = now.toISOString().slice(0, 13);
            let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourIso));
            if (startIndex < 0) startIndex = 0;

            for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
                const hourDate = new Date(hourly.time[i]);
                hourlyItems.push({
                    timeLabel: hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    tempC: Math.round(hourly.temperature_2m[i]),
                    weatherCode: hourly.weather_code[i],
                    pop: hourly.precipitation_probability[i] || 0,
                    iconName: this.getWmoInfo(hourly.weather_code[i], 1).iconName
                });
            }
        }

        // 7-Day Extended Forecast array
        const dailyItems = [];
        if (daily && daily.time) {
            for (let i = 0; i < daily.time.length && i < 7; i++) {
                const dateObj = new Date(daily.time[i] + 'T00:00:00');
                const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                dailyItems.push({
                    dayName: dayName,
                    dateLabel: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    weatherCode: daily.weather_code[i],
                    tempMaxC: Math.round(daily.temperature_2m_max[i]),
                    tempMinC: Math.round(daily.temperature_2m_min[i]),
                    rainChance: daily.precipitation_probability_max[i] || 0,
                    info: this.getWmoInfo(daily.weather_code[i], 1)
                });
            }
        }

        return {
            current: {
                tempC: Math.round(cur.temperature_2m),
                feelsLikeC: Math.round(cur.apparent_temperature),
                humidity: Math.round(cur.relative_humidity_2m),
                windSpeedKm: Math.round(cur.wind_speed_10m),
                windDirectionDeg: Math.round(cur.wind_direction_10m),
                pressureHpa: Math.round(cur.surface_pressure),
                uvIndex: cur.uv_index !== undefined ? cur.uv_index.toFixed(1) : '0',
                isDay: cur.is_day === 1,
                weatherCode: cur.weather_code,
                weatherText: weatherInfo.description,
                animState: weatherInfo.animState, // Canvas render key: clear, cloudy, rain, snow, thunderstorm, fog
                iconName: weatherInfo.iconName,
                highTempC: Math.round(daily.temperature_2m_max[0] || cur.temperature_2m),
                lowTempC: Math.round(daily.temperature_2m_min[0] || cur.temperature_2m),
                rainChance: daily.precipitation_probability_max[0] || 0,
                sunriseTime: daily.sunrise[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                sunsetTime: daily.sunset[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
            },
            aqi: {
                value: aqiVal,
                status: aqiRating.status,
                description: aqiRating.description,
                colorVar: aqiRating.colorVar,
                pm25: aqiCur.pm2_5 ? aqiCur.pm2_5.toFixed(1) : '--',
                pm10: aqiCur.pm10 ? aqiCur.pm10.toFixed(1) : '--',
                no2: aqiCur.nitrogen_dioxide ? aqiCur.nitrogen_dioxide.toFixed(1) : '--',
                o3: aqiCur.ozone ? aqiCur.ozone.toFixed(1) : '--'
            },
            hourly: hourlyItems,
            daily: dailyItems,
            timezone: rawWeather.timezone
        };
    }

    /**
     * Map WMO Weather Codes to text, icon names, and canvas particle animation state
     * Standard WMO Code reference: https://open-meteo.com/en/docs
     * @param {number} code - WMO weather code number
     * @param {number} isDay - 1 for daytime, 0 for nighttime
     */
    getWmoInfo(code, isDay = 1) {
        // Default clear state
        let info = { description: 'Clear Sky', iconName: isDay ? 'sun' : 'moon', animState: 'clear' };

        switch (code) {
            case 0: // Clear sky
                info = { description: 'Clear Sky', iconName: isDay ? 'sun' : 'moon', animState: 'clear' };
                break;
            case 1: // Mainly clear
            case 2: // Partly cloudy
                info = { description: 'Partly Cloudy', iconName: isDay ? 'cloud-sun' : 'cloud-moon', animState: 'cloudy' };
                break;
            case 3: // Overcast
                info = { description: 'Overcast', iconName: 'cloud', animState: 'cloudy' };
                break;
            case 45: // Fog
            case 48: // Depositing rime fog
                info = { description: 'Fog & Foggy Mist', iconName: 'cloud-fog', animState: 'fog' };
                break;
            case 51: case 53: case 55: // Drizzle
            case 56: case 57: // Freezing drizzle
                info = { description: 'Light Drizzle', iconName: 'cloud-drizzle', animState: 'rain' };
                break;
            case 61: case 63: case 65: // Rain
            case 66: case 67: // Freezing rain
            case 80: case 81: case 82: // Rain showers
                info = { description: 'Rain Showers', iconName: 'cloud-rain', animState: 'rain' };
                break;
            case 71: case 73: case 75: // Snow fall
            case 77: // Snow grains
            case 85: case 86: // Snow showers
                info = { description: 'Snowfall', iconName: 'snowflake', animState: 'snow' };
                break;
            case 95: case 96: case 99: // Thunderstorm
                info = { description: 'Thunderstorm', iconName: 'cloud-lightning', animState: 'thunderstorm' };
                break;
            default:
                info = { description: 'Atmospheric Conditions', iconName: 'cloud', animState: 'cloudy' };
        }
        return info;
    }

    /**
     * Map US AQI value to health status description and color variable
     * @param {number} aqi - US AQI integer value
     */
    getAqiRating(aqi) {
        if (aqi <= 50) {
            return {
                status: 'Good',
                description: 'Air quality is satisfactory and poses little or no health risk.',
                colorVar: 'var(--aqi-good)'
            };
        } else if (aqi <= 100) {
            return {
                status: 'Moderate',
                description: 'Air quality is acceptable; sensitive individuals may experience mild discomfort.',
                colorVar: 'var(--aqi-moderate)'
            };
        } else if (aqi <= 150) {
            return {
                status: 'Unhealthy (Sensitive)',
                description: 'Members of sensitive groups may experience health effects.',
                colorVar: 'var(--aqi-unhealthy)'
            };
        } else if (aqi <= 200) {
            return {
                status: 'Unhealthy',
                description: 'Everyone may begin to experience health effects.',
                colorVar: 'var(--aqi-unhealthy)'
            };
        } else {
            return {
                status: 'Hazardous',
                description: 'Health warning of emergency conditions. Entire population is affected.',
                colorVar: 'var(--aqi-hazardous)'
            };
        }
    }
}

// Export singleton instance to global scope
window.weatherEngine = new WeatherEngine();

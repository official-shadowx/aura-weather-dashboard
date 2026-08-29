/**
 * ============================================================================
 * AURA WEATHER — APPLICATION ENTRY POINT & ORCHESTRATOR (js/app.js)
 * ----------------------------------------------------------------------------
 * Bootstraps the application, connects WeatherEngine API calls with UIManager
 * DOM updates, binds quick prompt cards, handles GPS geolocation requests,
 * and manages search auto-complete events.
 * ============================================================================
 */

class WeatherApp {
    constructor() {
        this.engine = window.weatherEngine;
        this.ui = window.uiManager;
        this.defaultLocation = {
            name: 'Tokyo',
            country: 'Japan',
            latitude: 35.6762,
            longitude: 139.6503
        };
        this.cachedData = null;
    }

    /**
     * Application Initialization Sequence
     */
    init() {
        console.log('Initializing AURA Weather Application...');

        // Bind UI Action Events
        this.bindEvents();

        // Pre-fetch Tokyo weather data in background without opening dashboard automatically
        this.preloadDefaultLocation();
    }

    /**
     * Pre-fetch default location weather in background so initial click is instant
     */
    async preloadDefaultLocation() {
        try {
            this.cachedData = await this.engine.fetchWeatherData(this.defaultLocation.latitude, this.defaultLocation.longitude);
        } catch (err) {
            console.warn('Preload weather failed:', err);
        }
    }

    /**
     * Bind all interactive DOM event handlers
     */
    bindEvents() {
        const ui = window.uiManager;
        if (!ui) return;

        // 1. Theme Toggle Button Listener
        if (ui.themeToggleBtn) {
            ui.themeToggleBtn.addEventListener('click', () => ui.toggleTheme());
        }

        // 2. Temperature Unit Switcher (°C / °F) Listener
        if (ui.unitToggleBtn) {
            ui.unitToggleBtn.addEventListener('click', () => ui.toggleUnit());
        }

        // 3. Brand Logo click -> Smooth Transition back to Landing Page Hero
        if (ui.brandLogoBtn) {
            ui.brandLogoBtn.addEventListener('click', () => {
                ui.transitionToLanding();
            });
        }

        // 4. Primary CTA "Launch Weather Dashboard" Button Handler
        if (ui.enterDashboardBtn) {
            ui.enterDashboardBtn.addEventListener('click', async () => {
                if (this.cachedData) {
                    ui.renderDashboard(this.cachedData, this.defaultLocation);
                } else {
                    await this.loadLocation(this.defaultLocation);
                }
            });
        }

        // 5. Developer Diagnostic Console Modal Triggers
        if (ui.devConsoleBtn) {
            ui.devConsoleBtn.addEventListener('click', () => {
                if (ui.devModalOverlay) ui.devModalOverlay.classList.add('active');
            });
        }
        if (ui.closeDevModalBtn) {
            ui.closeDevModalBtn.addEventListener('click', () => {
                if (ui.devModalOverlay) ui.devModalOverlay.classList.remove('active');
            });
        }
        if (ui.devModalOverlay) {
            ui.devModalOverlay.addEventListener('click', (e) => {
                if (e.target === ui.devModalOverlay) {
                    ui.devModalOverlay.classList.remove('active');
                }
            });
        }

        // 6. GPS Geolocation Button Event Handler
        if (ui.geoBtn) {
            ui.geoBtn.addEventListener('click', () => this.useCurrentLocation());
        }

        // 7. Global City Search Input Auto-Complete (Debounced 300ms)
        if (ui.cityInput) {
            ui.cityInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(ui.searchDebounceTimer);

                if (query.length < 2) {
                    ui.renderSearchDropdown([]);
                    return;
                }

                ui.searchDebounceTimer = setTimeout(async () => {
                    try {
                        const candidates = await this.engine.searchLocation(query);
                        ui.renderSearchDropdown(candidates);
                    } catch (error) {
                        console.error('Search query error:', error);
                    }
                }, 300);
            });

            // Enter key press triggers first search match immediately
            ui.cityInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    const query = ui.cityInput.value.trim();
                    if (!query) return;
                    try {
                        ui.showLoading();
                        const candidates = await this.engine.searchLocation(query);
                        if (candidates && candidates.length > 0) {
                            ui.searchDropdown.classList.remove('active');
                            await this.loadLocation(candidates[0]);
                        }
                    } catch (err) {
                        console.error('Enter key search failure:', err);
                    } finally {
                        ui.hideLoading();
                    }
                }
            });
        }

        // Hide search dropdown if user clicks outside input box
        document.addEventListener('click', (e) => {
            if (ui.searchDropdown && !e.target.closest('.search-wrapper')) {
                ui.searchDropdown.classList.remove('active');
            }
        });

        // 8. Quick Location Prompt Pills Handler
        document.querySelectorAll('.prompt-pill').forEach(pill => {
            pill.addEventListener('click', async () => {
                const cityName = pill.getAttribute('data-city');
                if (!cityName) return;
                try {
                    ui.showLoading();
                    const candidates = await this.engine.searchLocation(cityName);
                    if (candidates && candidates.length > 0) {
                        await this.loadLocation(candidates[0]);
                    }
                } catch (err) {
                    console.error('Prompt pill click error:', err);
                } finally {
                    ui.hideLoading();
                }
            });
        });

        // 9. Scenario Prompt Cards Handler
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', async () => {
                const promptKey = card.getAttribute('data-prompt');
                try {
                    ui.showLoading();
                    if (promptKey === 'current-geo') {
                        await this.useCurrentLocation();
                    } else if (promptKey === 'city-beach') {
                        // Beach & Sun -> Miami Beach 🇺🇸
                        const res = await this.engine.searchLocation('Miami Beach');
                        if (res && res[0]) await this.loadLocation(res[0]);
                    } else if (promptKey === 'city-aqi') {
                        // Air Quality Alert -> New Delhi 🇮🇳
                        const res = await this.engine.searchLocation('New Delhi');
                        if (res && res[0]) await this.loadLocation(res[0]);
                    } else if (promptKey === 'city-snow') {
                        // Alpine Snow -> Zurich 🇨🇭
                        const res = await this.engine.searchLocation('Zurich');
                        if (res && res[0]) await this.loadLocation(res[0]);
                    }
                } catch (err) {
                    console.error('Scenario card error:', err);
                } finally {
                    ui.hideLoading();
                }
            });
        });
    }

    /**
     * Request HTML5 Geolocation coordinates from user's device
     */
    async useCurrentLocation() {
        const ui = window.uiManager;
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your current browser.');
            return;
        }

        if (ui) ui.showLoading();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const locationInfo = {
                    name: 'Current Location',
                    country: 'GPS Detected',
                    latitude: lat,
                    longitude: lon
                };

                await this.loadLocation(locationInfo);
                if (ui) ui.hideLoading();
            },
            (error) => {
                console.warn('Geolocation denied or failed:', error.message);
                if (ui) {
                    ui.hideLoading();
                    alert('Unable to access GPS location. Defaulting to city search.');
                }
            },
            { timeout: 10000 }
        );
    }

    /**
     * Fetch weather data for target location and update UI & Canvas
     * @param {Object} location - Location object containing name, country, latitude, longitude
     */
    async loadLocation(location) {
        const ui = window.uiManager;
        if (!location || !location.latitude || !location.longitude) return;

        try {
            if (ui) ui.showLoading();

            // Fetch live payload from Open-Meteo
            const data = await this.engine.fetchWeatherData(location.latitude, location.longitude);
            this.cachedData = data;

            // Render dashboard DOM with transition
            if (ui) {
                ui.renderDashboard(data, location);
            }

        } catch (error) {
            console.error('Failed to load weather for location:', location, error);
        } finally {
            if (ui) ui.hideLoading();
        }
    }
}

// Bootstrap Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WeatherApp();
    window.app.init();
});

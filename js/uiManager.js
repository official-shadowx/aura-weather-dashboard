/**
 * ============================================================================
 * AURA WEATHER — UI MANAGER & INTERACTION ENGINE (js/uiManager.js)
 * ----------------------------------------------------------------------------
 * Controls UI DOM rendering, event listeners, scroll reveal animations,
 * search auto-complete dropdown, unit conversions (°C/°F), theme toggles,
 * and the Developer Diagnostic Console modal.
 * ============================================================================
 */

class UIManager {
    constructor() {
        // Temperature unit state ('C' or 'F')
        this.currentUnit = 'C';

        // Current weather data reference
        this.weatherData = null;

        // Current city details reference
        this.currentLocation = { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 };

        // Debounce timer for search auto-complete
        this.searchDebounceTimer = null;

        // IntersectionObserver for scroll reveal animations
        this.scrollObserver = null;

        this.initDOM();
        this.initScrollReveal();
    }

    /**
     * Cache key DOM element references
     */
    initDOM() {
        // Navigation Elements
        this.cityInput = document.getElementById('city-search-input');
        this.searchDropdown = document.getElementById('search-dropdown');
        this.geoBtn = document.getElementById('geo-location-btn');
        this.unitToggleBtn = document.getElementById('unit-toggle-btn');
        this.unitCLabel = document.getElementById('unit-c-label');
        this.unitFLabel = document.getElementById('unit-f-label');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeIcon = document.getElementById('theme-icon');
        this.brandLogoBtn = document.getElementById('brand-logo-btn');

        // Landing & Dashboard Sections
        this.landingSection = document.getElementById('landing-section');
        this.dashboardSection = document.getElementById('dashboard-section');
        this.loadingOverlay = document.getElementById('loading-overlay');

        // Hero Weather Card Elements
        this.cityNameEl = document.getElementById('weather-city-name');
        this.countryNameEl = document.getElementById('weather-country-name');
        this.localTimeEl = document.getElementById('weather-local-time');
        this.conditionTextEl = document.getElementById('weather-condition-text');
        this.mainTempEl = document.getElementById('main-temperature');
        this.mainTempUnitEl = document.getElementById('main-temp-unit');
        this.heroIconEl = document.getElementById('hero-weather-icon');
        this.feelsLikeEl = document.getElementById('feels-like-temp');
        this.heroHighEl = document.getElementById('hero-high-temp');
        this.heroLowEl = document.getElementById('hero-low-temp');
        this.heroRainEl = document.getElementById('hero-rain-chance');

        // AQI Card Elements
        this.aqiNumberEl = document.getElementById('aqi-number');
        this.aqiStatusPill = document.getElementById('aqi-status-pill');
        this.aqiBarFill = document.getElementById('aqi-bar-fill');
        this.aqiDescEl = document.getElementById('aqi-description');
        this.pm25El = document.getElementById('pm25-val');
        this.pm10El = document.getElementById('pm10-val');
        this.no2El = document.getElementById('no2-val');
        this.o3El = document.getElementById('o3-val');

        // Hourly & Daily Containers
        this.hourlyContainer = document.getElementById('hourly-scroll-container');
        this.dailyContainer = document.getElementById('daily-list-container');

        // Highlight Metric Elements
        this.windSpeedEl = document.getElementById('wind-speed-val');
        this.windUnitEl = document.getElementById('wind-unit-label');
        this.windDirText = document.getElementById('wind-direction-text');
        this.compassIcon = document.getElementById('compass-icon');
        this.humidityEl = document.getElementById('humidity-val');
        this.dewPointText = document.getElementById('dew-point-text');
        this.uvIndexEl = document.getElementById('uv-index-val');
        this.uvRiskText = document.getElementById('uv-risk-level');
        this.pressureEl = document.getElementById('pressure-val');
        this.visibilityEl = document.getElementById('visibility-val');
        this.sunriseEl = document.getElementById('sunrise-time');
        this.sunsetEl = document.getElementById('sunset-time');

        // CTA Enter Button
        this.enterDashboardBtn = document.getElementById('enter-dashboard-btn');

        // Developer Modal Elements
        this.devConsoleBtn = document.getElementById('dev-console-btn');
        this.devModalOverlay = document.getElementById('dev-modal-overlay');
        this.closeDevModalBtn = document.getElementById('close-dev-modal-btn');
        this.devStatusBanner = document.getElementById('dev-status-banner');
        this.devStatusSummary = document.getElementById('dev-status-summary');
        this.devLogOutput = document.getElementById('dev-log-output');

        // Bind Developer Log output to WeatherEngine logger
        if (window.weatherEngine) {
            window.weatherEngine.onLogCallback = (msg, isError) => this.appendDevLog(msg, isError);
        }
    }

    /**
     * Smooth 2-phase transition from Landing Page to Main Dashboard
     */
    transitionToDashboard() {
        if (!this.landingSection || !this.dashboardSection) return;

        // Phase 1: Fade out landing section with smooth scale + blur
        this.landingSection.classList.add('fade-out');

        setTimeout(() => {
            // Phase 2: Hide landing section and reveal dashboard grid
            this.landingSection.classList.add('hidden');
            this.dashboardSection.classList.remove('hidden');
            this.dashboardSection.classList.add('reveal-animation');

            // Re-trigger scroll reveal observer for dashboard cards
            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                if (this.scrollObserver) this.scrollObserver.observe(el);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 450);
    }

    /**
     * Smooth transition from Dashboard back to Landing Page (Brand logo click)
     */
    transitionToLanding() {
        if (!this.landingSection || !this.dashboardSection) return;

        this.dashboardSection.classList.add('hidden');
        this.dashboardSection.classList.remove('reveal-animation');

        this.landingSection.classList.remove('hidden');
        this.landingSection.classList.remove('fade-out');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Setup native IntersectionObserver to animate cards smoothly as user scrolls
     */
    initScrollReveal() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, options);

        // Observe all cards with .reveal-on-scroll class
        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            this.scrollObserver.observe(el);
        });
    }

    /**
     * Show loading overlay spinner during API fetch
     */
    showLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.add('active');
    }

    /**
     * Hide loading overlay spinner after API fetch completes
     */
    hideLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.remove('active');
    }

    /**
     * Toggle Theme state (Dark Shader <-> Light Shader)
     */
    toggleTheme() {
        const isDark = document.body.classList.contains('theme-dark');
        if (isDark) {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            if (this.themeIcon) this.themeIcon.setAttribute('data-lucide', 'sun');
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            if (this.themeIcon) this.themeIcon.setAttribute('data-lucide', 'moon');
        }

        if (window.lucide) lucide.createIcons();

        // Update canvas particle theme color
        if (window.motionCanvasEngine) {
            window.motionCanvasEngine.createParticles();
        }
    }

    /**
     * Toggle Temperature Unit (°C <-> °F) and re-render dashboard
     */
    toggleUnit() {
        this.currentUnit = this.currentUnit === 'C' ? 'F' : 'C';

        if (this.currentUnit === 'C') {
            this.unitCLabel.classList.add('active-unit');
            this.unitFLabel.classList.remove('active-unit');
        } else {
            this.unitCLabel.classList.remove('active-unit');
            this.unitFLabel.classList.add('active-unit');
        }

        // Re-render dashboard with converted units if weather data is loaded
        if (this.weatherData) {
            this.renderDashboard(this.weatherData, this.currentLocation);
        }
    }

    /**
     * Convert Celsius temperature to Fahrenheit if unit is set to 'F'
     * @param {number} tempC - Temperature in Celsius
     */
    formatTemp(tempC) {
        if (this.currentUnit === 'F') {
            const tempF = Math.round((tempC * 9 / 5) + 32);
            return tempF;
        }
        return Math.round(tempC);
    }

    /**
     * Render entire weather dashboard grid with newly fetched data
     * @param {Object} data - Structured weather model from WeatherEngine
     * @param {Object} location - Location info (name, country, etc.)
     */
    renderDashboard(data, location) {
        this.weatherData = data;
        this.currentLocation = location;

        // Transition from Landing to Dashboard grid
        this.transitionToDashboard();

        const cur = data.current;
        const unitSymbol = `°${this.currentUnit}`;

        // 1. Render Hero Weather Card
        this.cityNameEl.textContent = location.name;
        this.countryNameEl.textContent = location.country ? `${location.admin1 ? location.admin1 + ', ' : ''}${location.country}` : '';
        this.localTimeEl.innerHTML = `<i data-lucide="clock"></i> Local Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        this.conditionTextEl.textContent = cur.weatherText;
        this.mainTempEl.textContent = this.formatTemp(cur.tempC);
        this.mainTempUnitEl.textContent = unitSymbol;

        this.feelsLikeEl.textContent = `${this.formatTemp(cur.feelsLikeC)}${unitSymbol}`;
        this.heroHighEl.textContent = `${this.formatTemp(cur.highTempC)}${unitSymbol}`;
        this.heroLowEl.textContent = `${this.formatTemp(cur.lowTempC)}${unitSymbol}`;
        this.heroRainEl.textContent = `${cur.rainChance}%`;

        // Hero Icon update
        if (this.heroIconEl) {
            this.heroIconEl.setAttribute('data-lucide', cur.iconName);
        }

        // Update Motion Graphics Canvas state
        if (window.motionCanvasEngine) {
            window.motionCanvasEngine.setMode(cur.animState);
        }

        // 2. Render AQI Card
        const aqi = data.aqi;
        this.aqiNumberEl.textContent = aqi.value;
        this.aqiStatusPill.textContent = aqi.status;
        this.aqiStatusPill.style.backgroundColor = aqi.colorVar;
        this.aqiBarFill.style.backgroundColor = aqi.colorVar;
        this.aqiBarFill.style.width = `${Math.min(100, (aqi.value / 300) * 100)}%`;
        this.aqiDescEl.textContent = aqi.description;

        this.pm25El.textContent = `${aqi.pm25} µg/m³`;
        this.pm10El.textContent = `${aqi.pm10} µg/m³`;
        this.no2El.textContent = `${aqi.no2} µg/m³`;
        this.o3El.textContent = `${aqi.o3} µg/m³`;

        // 3. Render 24-Hour Timeline
        this.hourlyContainer.innerHTML = '';
        data.hourly.forEach(item => {
            const card = document.createElement('div');
            card.className = 'hourly-item-card';
            card.innerHTML = `
                <span class="hourly-time">${item.timeLabel}</span>
                <i data-lucide="${item.iconName}" class="hourly-icon"></i>
                <span class="hourly-temp">${this.formatTemp(item.tempC)}°</span>
                <span class="hourly-pop"><i data-lucide="droplet" style="width:10px;height:10px;"></i> ${item.pop}%</span>
            `;
            this.hourlyContainer.appendChild(card);
        });

        // 4. Render 7-Day Daily Forecast
        this.dailyContainer.innerHTML = '';
        data.daily.forEach(item => {
            const row = document.createElement('div');
            row.className = 'daily-row-item';
            row.innerHTML = `
                <span class="daily-day-name">${item.dayName}</span>
                <div class="daily-weather-info">
                    <i data-lucide="${item.info.iconName}" class="daily-icon"></i>
                    <span class="daily-condition-name">${item.info.description}</span>
                </div>
                <div class="daily-temps">
                    <span class="daily-max">${this.formatTemp(item.tempMaxC)}°</span>
                    <span class="daily-min">${this.formatTemp(item.tempMinC)}°</span>
                </div>
            `;
            this.dailyContainer.appendChild(row);
        });

        // 5. Render Metric Cards
        this.windSpeedEl.textContent = cur.windSpeedKm;
        this.windDirText.textContent = `Direction: ${cur.windDirectionDeg}°`;
        if (this.compassIcon) {
            this.compassIcon.style.transform = `rotate(${cur.windDirectionDeg}deg)`;
        }

        this.humidityEl.textContent = cur.humidity;
        const dewPointC = Math.round(cur.tempC - ((100 - cur.humidity) / 5));
        this.dewPointText.textContent = `Dew Point: ${this.formatTemp(dewPointC)}${unitSymbol}`;

        this.uvIndexEl.textContent = cur.uvIndex;
        const uvNum = parseFloat(cur.uvIndex);
        let uvRisk = 'Low';
        if (uvNum >= 8) uvRisk = 'Very High';
        else if (uvNum >= 6) uvRisk = 'High';
        else if (uvNum >= 3) uvRisk = 'Moderate';
        this.uvRiskText.textContent = `Risk Level: ${uvRisk}`;

        this.pressureEl.textContent = cur.pressureHpa;
        this.visibilityEl.textContent = '10+'; // Standard high visibility default
        this.sunriseEl.textContent = cur.sunriseTime;
        this.sunsetEl.textContent = cur.sunsetTime;

        // Re-initialize dynamic Lucide icons
        if (window.lucide) lucide.createIcons();

        // Trigger scroll reveal observer for newly injected elements
        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            this.scrollObserver.observe(el);
        });
    }

    /**
     * Render search auto-complete dropdown candidates
     * @param {Array} results - Location candidates list
     */
    renderSearchDropdown(results) {
        this.searchDropdown.innerHTML = '';
        if (!results || results.length === 0) {
            this.searchDropdown.classList.remove('active');
            return;
        }

        results.forEach(loc => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <div>
                    <div class="dropdown-item-title">${loc.name}</div>
                    <div class="dropdown-item-sub">${loc.admin1 ? loc.admin1 + ', ' : ''}${loc.country}</div>
                </div>
                <i data-lucide="arrow-up-left" style="width:16px;height:16px;color:var(--text-muted);"></i>
            `;

            item.addEventListener('click', () => {
                this.searchDropdown.classList.remove('active');
                this.cityInput.value = `${loc.name}, ${loc.country}`;
                if (window.app) {
                    window.app.loadLocation(loc);
                }
            });

            this.searchDropdown.appendChild(item);
        });

        if (window.lucide) lucide.createIcons();
        this.searchDropdown.classList.add('active');
    }

    /**
     * Append log entries to developer diagnostic drawer
     */
    appendDevLog(msg, isError = false) {
        if (!this.devLogOutput) return;
        this.devLogOutput.textContent += `\n${msg}`;
        this.devLogOutput.scrollTop = this.devLogOutput.scrollHeight;

        if (isError) {
            this.devStatusBanner.classList.add('error');
            this.devStatusSummary.textContent = 'System Status: Warning/Error detected in API cycle.';
        }
    }
}

// Export instance to window
window.uiManager = null;
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});

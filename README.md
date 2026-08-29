# 🌦️ AURA Weather — Atmospheric Motion & Real-Time AQI Dashboard

![Developer Credit](https://img.shields.io/badge/Developer-SHADOW%20X-black?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)

A high-performance, responsive weather dashboard web application built by **SHADOW X**. Features live procedural 2D Canvas atmospheric motion graphics, real-time weather & Air Quality Index (AQI) data via Open-Meteo REST APIs, glassmorphism UI/UX, minimalist dot cursor physics, and smooth 2-phase page transition animations.

---

## ✨ Features & Highlights

- 🎨 **Monochrome Shader Glassmorphism**: Frosted glass cards with `backdrop-filter: blur(20px)`, rounded smooth corners (`border-radius: 24px`), and soft ambient shaders.
- 🚀 **Landing Page First Architecture**: Launches directly into a sleek landing page with interactive location pills (*Tokyo 🇯🇵*, *London 🇬🇧*, *New York 🇺🇸*, *Paris 🇫🇷*, *Dubai 🇦🇪*, *Sydney 🇦🇺*) and quick scenario prompt cards before smoothly transitioning into the main dashboard grid.
- 🎆 **Procedural HTML5 Canvas Motion Graphics**: Live atmospheric graphics engine adapting in real time to current weather conditions:
  - ☀️ **Clear / Sunny**: Warm sunlight rays & ambient floating light specks.
  - ☁️ **Cloudy / Overcast**: Volumetric atmospheric cloud particles drifting across the viewport.
  - 🌧️ **Rain / Drizzle**: Falling rain streaks with ground splash physics.
  - ⚡ **Thunderstorm**: Dark storm cloud layers, rain streaks, and random lightning background flashes.
  - ❄️ **Snow**: Drifting snowflake particles with sinusoidal sway physics.
  - 🌫️ **Fog / Mist**: Rolling atmospheric fog bands with gentle opacity waves.
- 🍃 **Real-Time Air Quality (AQI)**: Tracks PM2.5, PM10, NO2, O3, and US AQI index with color-coded safety rating indicators (*Good*, *Moderate*, *Unhealthy*, *Hazardous*).
- 🔍 **Global Search Auto-Complete**: Search any city, state, or country worldwide with 300ms debounced auto-complete suggestions.
- 📍 **1-Click GPS Location**: Instant current coordinate detection via HTML5 Geolocation.
- 🌡️ **Interactive Controls**: Temperature unit switcher (°C / °F), Dark/Light shader toggle, and Developer Diagnostic Console Drawer.
- 📱 **100% Mobile Responsive**: Dedicated mobile screen layouts with custom cursor auto-hidden for native touch navigation.

---

## 🛠️ Technology Stack

- **HTML5 & CSS3**: Native semantic structure, CSS Variables, Flexbox/Grid, Glassmorphism backdrop-blur.
- **Vanilla JavaScript (ES6+)**: Zero framework overhead, lightweight, modular architecture.
- **HTML5 2D Canvas**: Procedural particle rendering with `requestAnimationFrame` loop.
- **REST APIs**: Open-Meteo Weather, Air Quality, and Geocoding APIs (100% Free, No API key required).
- **Lucide Icons**: SVG icons CDN.

---

## 🚀 How to Run Locally

1. Clone or download the repository:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/aura-weather-dashboard.git
   cd aura-weather-dashboard
   ```
2. Open `index.html` directly in any web browser, or launch a simple local HTTP server:
   ```bash
   python -m http.server 3000
   ```
3. Visit `http://localhost:3000` in your web browser.

---

## 👨‍💻 Developer & Credits

Crafted with ❤️ by **SHADOW X**.

- **GitHub**: [@SHADOW-X](https://github.com)
- **Project**: AURA Weather Atmospheric Motion Dashboard

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

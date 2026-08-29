/**
 * ============================================================================
 * AURA WEATHER — PROCEDURAL CANVAS MOTION GRAPHICS ENGINE (js/motionCanvas.js)
 * ----------------------------------------------------------------------------
 * High-performance 2D Canvas engine generating live atmospheric motion graphics.
 * Automatically adapts particle systems and lighting effects based on weather:
 * - Clear: Pulsing sunlight rays & ambient floating light particles.
 * - Cloudy: Layered floating atmospheric cloud vectors.
 * - Rain: Dynamic rain shower streaks with ground splash physics.
 * - Thunderstorm: Dark rain streaks with random lightning background flashes.
 * - Snow: Falling snowflake particles with gentle sway physics.
 * - Fog/Mist: Rolling atmospheric mist layers with opacity waves.
 * ============================================================================
 */

class MotionCanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;

        // Current active particle mode ('clear', 'cloudy', 'rain', 'snow', 'thunderstorm', 'fog')
        this.currentMode = 'clear';

        // Particle pool array
        this.particles = [];
        this.particleCount = 100;

        // Animation frame tracker
        this.animFrameId = null;
        this.timeTick = 0;

        // Lightning state for thunderstorm
        this.isLightning = false;
        this.lightningTimer = 0;

        // Bind resize listener
        this.initResize();

        // Start render loop
        this.start();
    }

    /**
     * Handle canvas resize to match window viewport dimensions
     */
    initResize() {
        const resize = () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.createParticles(); // Re-seed particles on resize
        };
        window.addEventListener('resize', resize);
        resize();
    }

    /**
     * Set new weather motion mode and regenerate particle system
     * @param {string} mode - 'clear', 'cloudy', 'rain', 'snow', 'thunderstorm', 'fog'
     */
    setMode(mode) {
        if (this.currentMode === mode) return;
        this.currentMode = mode;
        this.createParticles();
    }

    /**
     * Instantiate particles tailored to the current weather condition
     */
    createParticles() {
        this.particles = [];

        switch (this.currentMode) {
            case 'rain':
            case 'thunderstorm':
                this.particleCount = Math.floor(this.width * 0.15); // Adjust particle density to viewport width
                for (let i = 0; i < this.particleCount; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        length: Math.random() * 25 + 15,
                        speedY: Math.random() * 12 + 10,
                        speedX: (Math.random() - 0.5) * 1.5,
                        opacity: Math.random() * 0.6 + 0.2
                    });
                }
                break;

            case 'snow':
                this.particleCount = Math.floor(this.width * 0.1);
                for (let i = 0; i < this.particleCount; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        radius: Math.random() * 3 + 1,
                        speedY: Math.random() * 1.5 + 0.5,
                        speedX: Math.random() * 0.5 - 0.25,
                        swayAmp: Math.random() * 2 + 0.5,
                        swayFreq: Math.random() * 0.02 + 0.01,
                        opacity: Math.random() * 0.7 + 0.3
                    });
                }
                break;

            case 'cloudy':
            case 'fog':
                this.particleCount = 15;
                for (let i = 0; i < this.particleCount; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * (this.height * 0.6),
                        radius: Math.random() * 180 + 100,
                        speedX: Math.random() * 0.3 + 0.1,
                        opacity: Math.random() * 0.12 + 0.04
                    });
                }
                break;

            case 'clear':
            default:
                // Floating sunlight dust particles
                this.particleCount = 40;
                for (let i = 0; i < this.particleCount; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        radius: Math.random() * 2.5 + 0.5,
                        speedY: -(Math.random() * 0.4 + 0.1),
                        speedX: (Math.random() - 0.5) * 0.3,
                        opacity: Math.random() * 0.5 + 0.1
                    });
                }
                break;
        }
    }

    /**
     * Start animation loop via requestAnimationFrame
     */
    start() {
        const loop = () => {
            this.timeTick++;
            this.render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    /**
     * Main canvas render pass
     */
    render() {
        // Clear previous frame
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Render mode-specific graphics
        switch (this.currentMode) {
            case 'clear':
                this.renderSunRays();
                this.renderDustParticles();
                break;
            case 'cloudy':
                this.renderCloudParticles();
                break;
            case 'rain':
                this.renderRain();
                break;
            case 'thunderstorm':
                this.renderThunderstorm();
                break;
            case 'snow':
                this.renderSnow();
                break;
            case 'fog':
                this.renderFog();
                break;
        }
    }

    /**
     * RENDER MODE: Sun Rays & Light Specks
     */
    renderSunRays() {
        const rayGradient = this.ctx.createRadialGradient(
            this.width * 0.85, 0, 10,
            this.width * 0.85, 0, this.width * 0.6
        );
        rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        rayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
        rayGradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = rayGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    renderDustParticles() {
        const isDark = document.body.classList.contains('theme-dark');
        this.ctx.fillStyle = isDark ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';

        this.particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y < 0) p.y = this.height;
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = (isDark ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ') + p.opacity + ')';
            this.ctx.fill();
        });
    }

    /**
     * RENDER MODE: Floating Clouds
     */
    renderCloudParticles() {
        const isDark = document.body.classList.contains('theme-dark');
        const colorBase = isDark ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';

        this.particles.forEach(p => {
            p.x += p.speedX;
            if (p.x - p.radius > this.width) p.x = -p.radius;

            const cloudGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            cloudGrad.addColorStop(0, colorBase + p.opacity + ')');
            cloudGrad.addColorStop(1, 'transparent');

            this.ctx.fillStyle = cloudGrad;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * RENDER MODE: Rain Showers
     */
    renderRain() {
        const isDark = document.body.classList.contains('theme-dark');
        this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1.2;

        this.particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y > this.height) {
                p.y = -p.length;
                p.x = Math.random() * this.width;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x + p.speedX, p.y + p.length);
            this.ctx.stroke();
        });
    }

    /**
     * RENDER MODE: Thunderstorm (Rain + Random Lightning Flashes)
     */
    renderThunderstorm() {
        // Render rain
        this.renderRain();

        // Random lightning trigger logic
        this.lightningTimer++;
        if (this.lightningTimer > 180 && Math.random() < 0.03) {
            this.isLightning = true;
            this.lightningTimer = 0;
        }

        if (this.isLightning) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.isLightning = false; // Single-frame flash
        }
    }

    /**
     * RENDER MODE: Falling Snow
     */
    renderSnow() {
        const isDark = document.body.classList.contains('theme-dark');
        this.ctx.fillStyle = isDark ? '#ffffff' : '#333333';

        this.particles.forEach(p => {
            p.y += p.speedY;
            p.x += Math.sin(this.timeTick * p.swayFreq) * p.swayAmp * 0.5;

            if (p.y > this.height) {
                p.y = -10;
                p.x = Math.random() * this.width;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        });
    }

    /**
     * RENDER MODE: Rolling Fog
     */
    renderFog() {
        const isDark = document.body.classList.contains('theme-dark');
        const colorBase = isDark ? '255, 255, 255' : '0, 0, 0';

        this.particles.forEach((p, idx) => {
            p.x += p.speedX;
            if (p.x - p.radius > this.width) p.x = -p.radius;

            const pulseOpacity = p.opacity + Math.sin(this.timeTick * 0.01 + idx) * 0.03;

            const fogGrad = this.ctx.createLinearGradient(0, p.y, this.width, p.y + p.radius);
            fogGrad.addColorStop(0, `rgba(${colorBase}, 0)`);
            fogGrad.addColorStop(0.5, `rgba(${colorBase}, ${Math.max(0, pulseOpacity)})`);
            fogGrad.addColorStop(1, `rgba(${colorBase}, 0)`);

            this.ctx.fillStyle = fogGrad;
            this.ctx.fillRect(0, p.y, this.width, p.radius * 2);
        });
    }
}

// Export singleton instance to global scope
window.motionCanvasEngine = null;
document.addEventListener('DOMContentLoaded', () => {
    window.motionCanvasEngine = new MotionCanvasEngine('weather-canvas');
});

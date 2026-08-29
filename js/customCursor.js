/**
 * ============================================================================
 * AURA WEATHER — MINIMALIST CUSTOM DOT CURSOR ENGINE (js/customCursor.js)
 * ----------------------------------------------------------------------------
 * Features a minimalist dot cursor with smooth physics trailing interpolation.
 * - Auto-hides completely on touch screens and mobile viewports (<= 900px).
 * - Dynamic color contrast matching pure Black / White theme states.
 * - Magnifies smoothly on interactive elements (buttons, inputs, glass cards).
 * ============================================================================
 */

class CustomCursorEngine {
    constructor() {
        this.cursor = document.getElementById('custom-cursor');
        this.follower = document.getElementById('custom-cursor-follower');

        if (!this.cursor || !this.follower) return;

        // Target pointer coordinates
        this.mousePos = { x: -100, y: -100 };
        // Follower interpolated position
        this.followerPos = { x: -100, y: -100 };
        this.lerpAmount = 0.18;

        // Check device capabilities & viewport width
        this.checkDevice();

        // Listen for screen resize / orientation changes
        window.addEventListener('resize', () => this.checkDevice());

        if (this.isMobileOrTouch) {
            this.hideCursor();
            return;
        }

        this.init();
    }

    /**
     * Check whether device is touch-based or on mobile viewport
     */
    checkDevice() {
        this.isMobileOrTouch = 'ontouchstart' in window || 
                               navigator.maxTouchPoints > 0 || 
                               window.innerWidth <= 900 ||
                               window.matchMedia('(pointer: coarse)').matches ||
                               window.matchMedia('(hover: none)').matches;

        if (this.isMobileOrTouch) {
            this.hideCursor();
        } else {
            this.showCursor();
        }
    }

    /**
     * Hide custom cursor and restore standard browser pointer for mobile
     */
    hideCursor() {
        if (this.cursor) this.cursor.style.display = 'none';
        if (this.follower) this.follower.style.display = 'none';
        document.body.classList.remove('custom-cursor-active');
    }

    /**
     * Show custom cursor for desktop pointer users
     */
    showCursor() {
        if (this.cursor) this.cursor.style.display = 'block';
        if (this.follower) this.follower.style.display = 'block';
        document.body.classList.add('custom-cursor-active');
    }

    init() {
        // Track pointer movement
        window.addEventListener('mousemove', (e) => {
            if (this.isMobileOrTouch) return;

            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;

            // Direct position update for main inner dot
            this.cursor.style.left = `${this.mousePos.x}px`;
            this.cursor.style.top = `${this.mousePos.y}px`;
        });

        // Add hover triggers on interactive elements
        this.bindHoverTriggers();

        // Start smooth lerp render loop
        this.render();
    }

    /**
     * Bind hover scale events on interactive elements (buttons, cards, links, inputs)
     */
    bindHoverTriggers() {
        const interactiveElements = 'a, button, input, .prompt-pill, .scenario-card, .glass-card, .brand-logo, .dropdown-item';

        document.addEventListener('mouseover', (e) => {
            if (this.isMobileOrTouch) return;
            if (e.target.closest(interactiveElements)) {
                document.body.classList.add('custom-cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (this.isMobileOrTouch) return;
            if (e.target.closest(interactiveElements)) {
                document.body.classList.remove('custom-cursor-hover');
            }
        });
    }

    /**
     * Smooth linear interpolation (lerp) animation loop for outer ring follower
     */
    render() {
        const loop = () => {
            if (!this.isMobileOrTouch) {
                // Lerp math formula: current + (target - current) * factor
                this.followerPos.x += (this.mousePos.x - this.followerPos.x) * this.lerpAmount;
                this.followerPos.y += (this.mousePos.y - this.followerPos.y) * this.lerpAmount;

                this.follower.style.left = `${this.followerPos.x}px`;
                this.follower.style.top = `${this.followerPos.y}px`;
            }

            requestAnimationFrame(loop);
        };
        loop();
    }
}

// Export singleton instance to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.customCursorEngine = new CustomCursorEngine();
});

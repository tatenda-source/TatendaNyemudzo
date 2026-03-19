/**
 * OS Selector - Pre-boot OS selection with starfield background
 * Handles Vista/Mac selection, keyboard navigation, and persistence
 */

(function() {
    'use strict';

    const OSSelector = {
        currentSelection: 0,
        options: null,
        canvas: null,
        ctx: null,
        stars: [],
        animationId: null,

        init() {
            this.canvas = document.getElementById('starfield');
            this.ctx = this.canvas.getContext('2d');
            this.options = document.querySelectorAll('.os-option');
            
            // Check for saved OS preference — pre-highlight, don't auto-boot
            const savedOS = localStorage.getItem('nostalgiaOS');

            // Starfield replaced by CSS ambient glow — skip canvas animation
            this.setupEventListeners();
            // Pre-select saved OS if returning visitor
            const defaultIndex = savedOS === 'mac' ? 1 : 0;
            this.updateSelection(defaultIndex);
        },

        setupStarfield() {
            // Set canvas size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Create stars
            const starCount = 200;
            for (let i = 0; i < starCount; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    z: Math.random() * this.canvas.width,
                    speed: Math.random() * 2 + 1
                });
            }

            this.animateStarfield();

            // Handle window resize
            window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            });
        },

        animateStarfield() {
            const animate = () => {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;

                this.stars.forEach(star => {
                    // Calculate star position
                    const k = 128.0 / star.z;
                    const px = (star.x - centerX) * k + centerX;
                    const py = (star.y - centerY) * k + centerY;

                    // Star size based on depth
                    const size = (1 - star.z / this.canvas.width) * 2;

                    // Draw star
                    const opacity = (1 - star.z / this.canvas.width) * 2;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.fillRect(px, py, size, size);

                    // Move star forward
                    star.z -= star.speed;

                    // Reset star if it goes past screen
                    if (star.z <= 0) {
                        star.z = this.canvas.width;
                        star.x = Math.random() * this.canvas.width;
                        star.y = Math.random() * this.canvas.height;
                    }
                });

                this.animationId = requestAnimationFrame(animate);
            };

            animate();
        },

        setupEventListeners() {
            // Click events
            this.options.forEach((option, index) => {
                option.addEventListener('click', () => {
                    this.selectOS(option.dataset.os);
                });

                option.addEventListener('mouseenter', () => {
                    this.updateSelection(index);
                });
            });

            // Keyboard navigation (store handler for cleanup)
            this._keyHandler = (e) => {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.updateSelection(0);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.updateSelection(1);
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        const selectedOS = this.options[this.currentSelection].dataset.os;
                        this.selectOS(selectedOS);
                        break;
                }
            };
            document.addEventListener('keydown', this._keyHandler);
        },

        updateSelection(index) {
            // Remove previous selection
            this.options.forEach(opt => opt.classList.remove('selected'));
            
            // Update selection
            this.currentSelection = index;
            this.options[this.currentSelection].classList.add('selected');
            this.options[this.currentSelection].focus();
        },

        selectOS(osType) {
            // Save OS preference
            localStorage.setItem('nostalgiaOS', osType);

            // Stop starfield animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            // Remove keyboard handler to prevent leaks on desktop
            if (this._keyHandler) {
                document.removeEventListener('keydown', this._keyHandler);
                this._keyHandler = null;
            }

            // Fade out selector
            const selector = document.getElementById('os-selector');
            selector.classList.add('fade-out');

            setTimeout(() => {
                selector.classList.add('hidden');
                
                // Trigger boot sequence
                if (window.BootLoader) {
                    window.BootLoader.start(osType);
                }
            }, 500);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => OSSelector.init());
    } else {
        OSSelector.init();
    }

    // Expose to global scope for testing
    window.OSSelector = OSSelector;
})();

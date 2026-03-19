/**
 * Boot Loader - OS boot sequences for Vista and Mac
 * Handles boot animations with no-skip policy
 */

(function () {
    'use strict';

    const BootLoader = {
        currentOS: null,
        bootDuration: {
            vista: 4000, // 4 seconds
            mac: 3500    // 3.5 seconds
        },

        start(osType) {
            this.currentOS = osType;
            const bootLoader = document.getElementById('boot-loader');
            bootLoader.classList.remove('hidden');

            if (osType === 'vista') {
                this.bootVista();
            } else if (osType === 'mac') {
                this.bootMac();
            }
        },

        bootVista() {
            const vistaBootScreen = document.getElementById('vista-boot');
            vistaBootScreen.classList.remove('hidden');

            // Boot sequence cannot be skipped
            setTimeout(() => {
                this.transitionToDesktop('vista');
            }, this.bootDuration.vista);
        },

        bootMac() {
            const macBootScreen = document.getElementById('mac-boot');
            macBootScreen.classList.remove('hidden');

            // Boot sequence cannot be skipped
            setTimeout(() => {
                this.transitionToDesktop('mac');
            }, this.bootDuration.mac);
        },

        transitionToDesktop(osType) {
            if (osType === 'vista') {
                // White flash transition for Vista
                this.whiteFlashTransition(() => {
                    this.showDesktop(osType);
                });
            } else {
                // Fade transition for Mac
                const bootLoader = document.getElementById('boot-loader');
                bootLoader.classList.add('fade-out');

                setTimeout(() => {
                    bootLoader.classList.add('hidden');
                    this.showDesktop(osType);
                }, 500);
            }
        },

        whiteFlashTransition(callback) {
            // Create white flash element
            const flash = document.createElement('div');
            flash.className = 'white-flash';
            document.body.appendChild(flash);

            // Trigger flash animation
            setTimeout(() => {
                flash.classList.add('active');
            }, 10);

            // Remove flash and show desktop
            setTimeout(() => {
                const bootLoader = document.getElementById('boot-loader');
                bootLoader.classList.add('hidden');
                flash.remove();
                callback();
            }, 800);
        },

        showDesktop(osType) {
            const desktop = document.getElementById('desktop');
            desktop.classList.remove('hidden');

            if (osType === 'vista') {
                const vistaDesktop = document.getElementById('vista-desktop');
                vistaDesktop.classList.remove('hidden');
                vistaDesktop.classList.add('fade-in');

                // Initialize Vista adapter
                if (window.VistaAdapter) {
                    window.VistaAdapter.init();
                }
            } else if (osType === 'mac') {
                const macDesktop = document.getElementById('mac-desktop');
                macDesktop.classList.remove('hidden');
                macDesktop.classList.add('fade-in');

                // Initialize Mac adapter
                if (window.MacAdapter) {
                    window.MacAdapter.init();
                }
            }

            // Update system time
            this.startSystemClock();

            // Initialize window manager
            if (window.WindowManager) {
                window.WindowManager.init(osType);
            }
        },

        startSystemClock() {
            // Clear any existing clock interval
            if (this._clockInterval) {
                clearInterval(this._clockInterval);
            }

            const updateTime = () => {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                const timeElements = document.querySelectorAll('.system-time');
                timeElements.forEach(el => {
                    el.textContent = timeString;
                });
            };

            updateTime();
            this._clockInterval = setInterval(updateTime, 1000);
        }
    };

    // Expose to global scope
    window.BootLoader = BootLoader;
})();

/**
 * Main entry point
 * Initializes the Nostalgia OS experience
 */

(function () {
    'use strict';

    console.log('Nostalgia OS Portfolio initialized');
    console.log('Vanilla HTML/CSS/JS architecture - no framework dependencies');
    console.log('Phase 2: Desktop environments loaded');

    // Log available modules
    const modules = ['EventBus', 'OSSelector', 'BootLoader', 'WindowManager', 'AppLauncher', 'VistaAdapter', 'MacAdapter'];
    modules.forEach(name => {
        if (window[name]) {
            console.log(`  [OK] ${name}`);
        } else {
            console.warn(`  [--] ${name} not loaded`);
        }
    });
})();

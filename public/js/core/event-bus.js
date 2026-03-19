/**
 * Event Bus - Simple pub/sub system for decoupled communication
 * between Window Manager, Shell Adapters, and App Launcher.
 *
 * Events emitted:
 *   window:created   { windowId, appId, title }
 *   window:focused    { windowId }
 *   window:minimized  { windowId }
 *   window:maximized  { windowId }
 *   window:restored   { windowId }
 *   window:closed     { windowId }
 *   window:titleChanged { windowId, title }
 *   app:launched      { appId }
 *   app:closed        { appId }
 *   shell:ready       { os }
 *   desktop:click     { x, y }
 *   desktop:contextmenu { x, y }
 *   startmenu:toggle  {}
 *   startmenu:close   {}
 */

(function () {
    'use strict';

    const EventBus = {
        _listeners: {},

        /**
         * Subscribe to an event.
         * @param {string} event - Event name
         * @param {Function} callback - Handler function
         * @returns {Function} Unsubscribe function
         */
        on(event, callback) {
            if (!this._listeners[event]) {
                this._listeners[event] = [];
            }
            this._listeners[event].push(callback);

            // Return unsubscribe function
            return () => {
                this._listeners[event] = this._listeners[event].filter(
                    cb => cb !== callback
                );
            };
        },

        /**
         * Subscribe to an event once only.
         * @param {string} event - Event name
         * @param {Function} callback - Handler function
         */
        once(event, callback) {
            const unsub = this.on(event, (data) => {
                unsub();
                callback(data);
            });
        },

        /**
         * Emit an event to all subscribers.
         * @param {string} event - Event name
         * @param {*} data - Event payload
         */
        emit(event, data) {
            const listeners = this._listeners[event];
            if (!listeners) return;
            // Iterate over a copy in case a listener unsubscribes during emit
            [...listeners].forEach(cb => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`EventBus error in "${event}" handler:`, err);
                }
            });
        },

        /**
         * Remove all listeners for an event, or all events if no name given.
         * @param {string} [event] - Event name
         */
        off(event) {
            if (event) {
                delete this._listeners[event];
            } else {
                this._listeners = {};
            }
        }
    };

    window.EventBus = EventBus;
})();

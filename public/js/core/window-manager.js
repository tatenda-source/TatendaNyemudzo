/**
 * Window Manager - OS-agnostic window management
 * Handles creation, focus, drag, resize, minimize, maximize, close.
 * Delegates chrome rendering to the active adapter (Vista/Mac).
 */

(function () {
    'use strict';

    let windowIdCounter = 0;

    const WindowManager = {
        currentOS: null,
        windows: new Map(),       // windowId -> windowState
        zIndexCounter: 100,
        activeWindowId: null,
        container: null,

        /* --------------------------------------------------------
         * Initialisation
         * ------------------------------------------------------ */
        init(osType) {
            this.currentOS = osType;
            const desktopId = osType === 'vista' ? 'vista-desktop' : 'mac-desktop';
            this.container = document.querySelector(`#${desktopId} .windows-container`);

            // Click on desktop (outside windows) clears focus
            const desktopEl = document.getElementById(desktopId);
            desktopEl.addEventListener('mousedown', (e) => {
                if (e.target === desktopEl || e.target.classList.contains('desktop-icons')) {
                    this.blurAll();
                }
            });

            // Escape key closes active window
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeWindowId) {
                    this.closeWindow(this.activeWindowId);
                }
            });

            console.log(`Window Manager initialized for ${osType}`);
        },

        /* --------------------------------------------------------
         * createWindow
         * ------------------------------------------------------ */

        /**
         * @param {Object} config
         * @param {string} config.appId   - Unique app identifier
         * @param {string} config.title   - Window title text
         * @param {string|HTMLElement} config.content - innerHTML or DOM node
         * @param {number} [config.width=640]
         * @param {number} [config.height=480]
         * @param {number} [config.x]     - Left position (default: cascade)
         * @param {number} [config.y]     - Top position (default: cascade)
         * @param {boolean} [config.resizable=true]
         * @param {number} [config.minWidth=320]
         * @param {number} [config.minHeight=240]
         * @returns {string} windowId
         */
        createWindow(config) {
            const id = `win-${++windowIdCounter}`;
            const cascade = this.windows.size * 28;
            const state = {
                id,
                appId: config.appId || 'unknown',
                title: config.title || 'Untitled',
                width: config.width || 640,
                height: config.height || 480,
                x: config.x !== undefined ? config.x : 80 + (cascade % 200),
                y: config.y !== undefined ? config.y : 60 + (cascade % 160),
                resizable: config.resizable !== false,
                minWidth: config.minWidth || 320,
                minHeight: config.minHeight || 240,
                maximized: false,
                minimized: false,
                // Save pre-maximize geometry for restore
                preMaxRect: null,
            };

            // Build DOM
            const el = this._buildWindowDOM(id, state, config.content);
            this.container.appendChild(el);
            state.el = el;

            this.windows.set(id, state);
            this.focusWindow(id);

            // Emit event
            if (window.EventBus) {
                EventBus.emit('window:created', { windowId: id, appId: state.appId, title: state.title });
            }

            return id;
        },

        /* --------------------------------------------------------
         * DOM Construction
         * ------------------------------------------------------ */
        _buildWindowDOM(id, state, content) {
            const win = document.createElement('div');
            win.className = `os-window ${this.currentOS}-window`;
            win.id = id;
            win.setAttribute('role', 'dialog');
            win.setAttribute('aria-label', state.title);
            win.style.width = state.width + 'px';
            win.style.height = state.height + 'px';
            win.style.left = state.x + 'px';
            win.style.top = state.y + 'px';
            win.style.position = 'absolute';
            win.dataset.appId = state.appId;

            // Title bar
            const titleBar = document.createElement('div');
            titleBar.className = 'window-titlebar';

            if (this.currentOS === 'mac') {
                // Mac: traffic lights on the left, title centred
                const trafficLights = document.createElement('div');
                trafficLights.className = 'traffic-lights';

                const btnClose = this._makeBtn('window-btn-close', 'close', id);
                const btnMin = this._makeBtn('window-btn-minimize', 'minimize', id);
                const btnMax = this._makeBtn('window-btn-maximize', 'maximize', id);

                trafficLights.append(btnClose, btnMin, btnMax);
                titleBar.appendChild(trafficLights);

                const titleText = document.createElement('span');
                titleText.className = 'window-title';
                titleText.textContent = state.title;
                titleBar.appendChild(titleText);
            } else {
                // Vista: icon + title on left, buttons on right
                const icon = document.createElement('span');
                icon.className = 'window-icon';
                icon.textContent = this._getAppIcon(state.appId);
                titleBar.appendChild(icon);

                const titleText = document.createElement('span');
                titleText.className = 'window-title';
                titleText.textContent = state.title;
                titleBar.appendChild(titleText);

                const btns = document.createElement('div');
                btns.className = 'window-controls';
                btns.appendChild(this._makeBtn('window-btn-minimize', 'minimize', id));
                btns.appendChild(this._makeBtn('window-btn-maximize', 'maximize', id));
                btns.appendChild(this._makeBtn('window-btn-close', 'close', id));
                titleBar.appendChild(btns);
            }

            // Content area
            const body = document.createElement('div');
            body.className = 'window-body';
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.appendChild(content);
            }

            win.appendChild(titleBar);
            win.appendChild(body);

            // Resize handles (8-directional)
            if (state.resizable) {
                const dirs = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
                dirs.forEach(dir => {
                    const handle = document.createElement('div');
                    handle.className = `resize-handle resize-${dir}`;
                    handle.dataset.dir = dir;
                    win.appendChild(handle);
                });
            }

            // Event delegation
            win.addEventListener('mousedown', (e) => {
                this.focusWindow(id);
            });

            // Drag by title bar
            this._enableDrag(titleBar, id);

            // Resize handles
            if (state.resizable) {
                this._enableResize(win, id);
            }

            return win;
        },

        _makeBtn(className, action, windowId) {
            const btn = document.createElement('button');
            btn.className = className;
            btn.setAttribute('aria-label', action);
            btn.addEventListener('mousedown', (e) => e.stopPropagation());
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                switch (action) {
                    case 'close': this.closeWindow(windowId); break;
                    case 'minimize': this.minimizeWindow(windowId); break;
                    case 'maximize': this.toggleMaximize(windowId); break;
                }
            });
            return btn;
        },

        _getAppIcon(appId) {
            const icons = {
                'my-computer': '\uD83D\uDCBB',
                projects: '\uD83D\uDCC2',
                about: '\uD83D\uDC64',
                cv: '\uD83D\uDCC4',
                contact: '\u2709\uFE0F',
                'recycle-bin': '\uD83D\uDDD1\uFE0F',
                pacman: '\uD83D\uDC7E',
                chess: '\u265A',
                finder: '\uD83D\uDCC1',
            };
            return icons[appId] || '\uD83D\uDCCB';
        },

        /* --------------------------------------------------------
         * Focus / Z-index
         * ------------------------------------------------------ */
        focusWindow(windowId) {
            const state = this.windows.get(windowId);
            if (!state) return;

            // Remove active from previous
            if (this.activeWindowId && this.activeWindowId !== windowId) {
                const prev = this.windows.get(this.activeWindowId);
                if (prev && prev.el) {
                    prev.el.classList.remove('window-active');
                    prev.el.classList.add('window-inactive');
                }
            }

            state.el.style.zIndex = Math.min(++this.zIndexCounter, 8999);
            state.el.classList.add('window-active');
            state.el.classList.remove('window-inactive');
            this.activeWindowId = windowId;

            if (window.EventBus) {
                EventBus.emit('window:focused', { windowId, appId: state.appId, title: state.title });
            }
        },

        blurAll() {
            this.windows.forEach(state => {
                state.el.classList.remove('window-active');
                state.el.classList.add('window-inactive');
            });
            this.activeWindowId = null;
            if (window.EventBus) {
                EventBus.emit('window:focused', { windowId: null });
            }
        },

        /* --------------------------------------------------------
         * Minimize
         * ------------------------------------------------------ */
        minimizeWindow(windowId) {
            const state = this.windows.get(windowId);
            if (!state) return;

            state.minimized = true;
            state.el.classList.add('window-minimizing');

            // After animation, hide (cancel on rapid restore)
            if (state._minimizeTimer) clearTimeout(state._minimizeTimer);
            state._minimizeTimer = setTimeout(() => {
                state._minimizeTimer = null;
                state.el.classList.remove('window-minimizing');
                state.el.classList.add('hidden');
            }, 400);

            // Focus next window
            this._focusTopWindow(windowId);

            if (window.EventBus) {
                EventBus.emit('window:minimized', { windowId, appId: state.appId });
            }
        },

        restoreWindow(windowId) {
            const state = this.windows.get(windowId);
            if (!state) return;

            if (state._minimizeTimer) {
                clearTimeout(state._minimizeTimer);
                state._minimizeTimer = null;
            }
            state.minimized = false;
            state.el.classList.remove('hidden', 'window-minimizing');
            state.el.classList.add('window-restoring');
            this.focusWindow(windowId);

            setTimeout(() => {
                state.el.classList.remove('window-restoring');
            }, 300);

            if (window.EventBus) {
                EventBus.emit('window:restored', { windowId, appId: state.appId });
            }
        },

        /* --------------------------------------------------------
         * Maximize / Restore
         * ------------------------------------------------------ */
        toggleMaximize(windowId) {
            const state = this.windows.get(windowId);
            if (!state) return;

            if (state.maximized) {
                // Restore from maximize
                const r = state.preMaxRect;
                state.el.style.left = r.x + 'px';
                state.el.style.top = r.y + 'px';
                state.el.style.width = r.w + 'px';
                state.el.style.height = r.h + 'px';
                state.el.classList.remove('window-maximized');
                state.maximized = false;
                if (window.EventBus) {
                    EventBus.emit('window:restored', { windowId, appId: state.appId });
                }
            } else {
                // Save current rect and maximize
                state.preMaxRect = {
                    x: state.el.offsetLeft,
                    y: state.el.offsetTop,
                    w: state.el.offsetWidth,
                    h: state.el.offsetHeight,
                };

                // Account for taskbar/menubar
                let top = 0, bottom = 0;
                if (this.currentOS === 'vista') {
                    bottom = 40; // taskbar height
                } else {
                    top = 25;   // menu bar height
                    bottom = 64; // dock height
                }

                state.el.style.left = '0px';
                state.el.style.top = top + 'px';
                state.el.style.width = '100%';
                state.el.style.height = `calc(100% - ${top + bottom}px)`;
                state.el.classList.add('window-maximized');
                state.maximized = true;

                if (window.EventBus) {
                    EventBus.emit('window:maximized', { windowId, appId: state.appId });
                }
            }
        },

        /* --------------------------------------------------------
         * Close
         * ------------------------------------------------------ */
        closeWindow(windowId) {
            const state = this.windows.get(windowId);
            if (!state) return;

            // End any in-progress drag/resize
            document.dispatchEvent(new MouseEvent('mouseup'));

            // Clean up game apps
            if (state.appId === 'pacman' && window.PacManApp && window.PacManApp.destroy) {
                window.PacManApp.destroy();
            }
            if (state.appId === 'chess' && window.ChessApp && window.ChessApp.destroy) {
                window.ChessApp.destroy();
            }

            state.el.classList.add('window-closing');

            setTimeout(() => {
                state.el.remove();
                this.windows.delete(windowId);
                this._focusTopWindow(windowId);

                if (window.EventBus) {
                    EventBus.emit('window:closed', { windowId, appId: state.appId });
                }
            }, 200);
        },

        /* --------------------------------------------------------
         * Drag
         * ------------------------------------------------------ */
        _enableDrag(titleBar, windowId) {
            let startX, startY, origX, origY;
            let dragging = false;

            const onMouseDown = (e) => {
                // Only drag on the title bar itself, not buttons
                if (e.target.closest('button')) return;
                const state = this.windows.get(windowId);
                if (!state || state.maximized) return;

                dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                origX = state.el.offsetLeft;
                origY = state.el.offsetTop;

                document.body.classList.add('no-select');
                document.body.style.cursor = 'move';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            const onMouseMove = (e) => {
                if (!dragging) return;
                const state = this.windows.get(windowId);
                if (!state) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                let newX = origX + dx;
                let newY = origY + dy;

                // Clamp: keep title bar reachable
                const minVisible = 100;
                const minTop = this.currentOS === 'mac' ? 22 : 0;
                newX = Math.max(-(state.el.offsetWidth - minVisible), Math.min(newX, window.innerWidth - minVisible));
                newY = Math.max(minTop, Math.min(newY, window.innerHeight - 40));

                state.el.style.left = newX + 'px';
                state.el.style.top = newY + 'px';
            };

            const onMouseUp = () => {
                dragging = false;
                document.body.classList.remove('no-select');
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            titleBar.addEventListener('mousedown', onMouseDown);

            // Double click title bar to maximize/restore
            titleBar.addEventListener('dblclick', (e) => {
                if (e.target.closest('button')) return;
                this.toggleMaximize(windowId);
            });
        },

        /* --------------------------------------------------------
         * Resize (8-directional)
         * ------------------------------------------------------ */
        _enableResize(winEl, windowId) {
            winEl.querySelectorAll('.resize-handle').forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const state = this.windows.get(windowId);
                    if (!state || state.maximized) return;

                    const dir = handle.dataset.dir;
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const origW = winEl.offsetWidth;
                    const origH = winEl.offsetHeight;
                    const origL = winEl.offsetLeft;
                    const origT = winEl.offsetTop;

                    document.body.classList.add('no-select');

                    const onMove = (ev) => {
                        const dx = ev.clientX - startX;
                        const dy = ev.clientY - startY;

                        let newW = origW, newH = origH, newL = origL, newT = origT;

                        if (dir.includes('e')) newW = Math.max(state.minWidth, origW + dx);
                        if (dir.includes('w')) {
                            newW = Math.max(state.minWidth, origW - dx);
                            newL = origL + (origW - newW);
                        }
                        if (dir.includes('s')) newH = Math.max(state.minHeight, origH + dy);
                        if (dir.includes('n')) {
                            newH = Math.max(state.minHeight, origH - dy);
                            newT = origT + (origH - newH);
                        }

                        winEl.style.width = newW + 'px';
                        winEl.style.height = newH + 'px';
                        winEl.style.left = newL + 'px';
                        winEl.style.top = newT + 'px';
                    };

                    const onUp = () => {
                        document.body.classList.remove('no-select');
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };

                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            });
        },

        /* --------------------------------------------------------
         * Helpers
         * ------------------------------------------------------ */
        _focusTopWindow(excludeId) {
            let topZ = 0;
            let topId = null;
            this.windows.forEach((s, id) => {
                if (id !== excludeId && !s.minimized) {
                    const z = parseInt(s.el.style.zIndex) || 0;
                    if (z > topZ) { topZ = z; topId = id; }
                }
            });
            if (topId) {
                this.focusWindow(topId);
            } else {
                this.activeWindowId = null;
                if (window.EventBus) EventBus.emit('window:focused', { windowId: null });
            }
        },

        /** Get all non-closed window states (for taskbar/dock rendering). */
        getWindows() {
            return [...this.windows.values()];
        },

        /** Get window by appId (for single-instance apps). */
        getWindowByApp(appId) {
            for (const [id, state] of this.windows) {
                if (state.appId === appId) return state;
            }
            return null;
        }
    };

    window.WindowManager = WindowManager;
})();

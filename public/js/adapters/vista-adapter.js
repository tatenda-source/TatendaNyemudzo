/**
 * Vista Adapter - Windows Vista shell: taskbar, start menu, desktop icons,
 * context menu, and window chrome integration.
 */

(function () {
    'use strict';

    const DESKTOP_ICONS = [
        { id: 'my-computer', label: 'My Computer', icon: '\uD83D\uDCBB' },
        { id: 'projects',    label: 'Projects',    icon: '\uD83D\uDCC2' },
        { id: 'about',       label: 'About Me',    icon: '\uD83D\uDC64' },
        { id: 'cv',          label: 'My CV',       icon: '\uD83D\uDCC4' },
        { id: 'contact',     label: 'Contact',     icon: '\u2709\uFE0F' },
        { id: 'recycle-bin', label: 'Recycle Bin',  icon: '\uD83D\uDDD1\uFE0F' },
    ];

    const START_MENU_APPS = [
        { id: 'projects', label: 'Projects',     icon: '\uD83D\uDCC2' },
        { id: 'about',    label: 'About Me',     icon: '\uD83D\uDC64' },
        { id: 'cv',       label: 'My CV',        icon: '\uD83D\uDCC4' },
        { id: 'contact',  label: 'Contact',      icon: '\u2709\uFE0F' },
        { id: 'pacman',   label: 'Pac-Man',      icon: '\uD83D\uDC7E' },
        { id: 'chess',    label: 'Chess',         icon: '\u265A' },
    ];

    const START_MENU_PLACES = [
        { id: 'my-computer', label: 'Computer',     icon: '\uD83D\uDCBB' },
        { id: 'projects',    label: 'Documents',    icon: '\uD83D\uDCC1' },
        { id: 'cv',          label: 'Recent Items', icon: '\uD83D\uDD52' },
    ];

    const CONTEXT_MENU_ITEMS = [
        { label: 'View', submenu: true },
        { label: 'Sort by', submenu: true },
        { label: 'Refresh', action: 'refresh' },
        { type: 'separator' },
        { label: 'Paste', action: 'paste', disabled: true },
        { label: 'Paste shortcut', action: 'paste-shortcut', disabled: true },
        { type: 'separator' },
        { label: 'New', submenu: true },
        { type: 'separator' },
        { label: 'Personalize', action: 'personalize' },
    ];

    const VistaAdapter = {
        startMenuOpen: false,
        selectedIcons: new Set(),

        init() {
            this.setupDesktopIcons();
            this.setupTaskbar();
            this.setupStartMenu();
            this.setupContextMenu();
            this.subscribeToEvents();
            console.log('Vista Adapter initialized');
        },

        /* --------------------------------------------------------
         * Desktop Icons
         * ------------------------------------------------------ */
        setupDesktopIcons() {
            const container = document.querySelector('#vista-desktop .desktop-icons');
            container.innerHTML = '';

            DESKTOP_ICONS.forEach((icon, index) => {
                const el = document.createElement('div');
                el.className = 'desktop-icon vista-icon';
                el.dataset.appId = icon.id;
                el.tabIndex = 0;
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', icon.label);

                el.innerHTML = `
                    <div class="icon-image">${icon.icon}</div>
                    <span class="icon-label">${icon.label}</span>
                `;

                // Position in column-first grid (2 columns from top-left)
                const col = Math.floor(index / 4);
                const row = index % 4;
                el.style.gridRow = row + 1;
                el.style.gridColumn = col + 1;

                // Single click: select
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectIcon(el, e.ctrlKey || e.metaKey);
                });

                // Double click: open
                el.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.openApp(icon.id, icon.label);
                });

                // Keyboard: Enter to open
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') this.openApp(icon.id, icon.label);
                });

                container.appendChild(el);
            });

            // Click on desktop to deselect all icons
            const desktop = document.getElementById('vista-desktop');
            desktop.addEventListener('click', (e) => {
                if (e.target === desktop || e.target.classList.contains('desktop-icons')) {
                    this.clearSelection();
                    this.closeStartMenu();
                }
            });
        },

        selectIcon(el, multi) {
            if (!multi) {
                document.querySelectorAll('#vista-desktop .desktop-icon.selected').forEach(
                    ic => ic.classList.remove('selected')
                );
                this.selectedIcons.clear();
            }
            el.classList.toggle('selected');
            if (el.classList.contains('selected')) {
                this.selectedIcons.add(el.dataset.appId);
            } else {
                this.selectedIcons.delete(el.dataset.appId);
            }
        },

        clearSelection() {
            document.querySelectorAll('#vista-desktop .desktop-icon.selected').forEach(
                ic => ic.classList.remove('selected')
            );
            this.selectedIcons.clear();
        },

        openApp(appId, title) {
            if (!window.WindowManager) {
                console.error('WindowManager not available');
                return;
            }
            // Single-instance: if already open, focus it
            const existing = window.WindowManager.getWindowByApp(appId);
            if (existing) {
                if (existing.minimized) {
                    window.WindowManager.restoreWindow(existing.id);
                } else {
                    window.WindowManager.focusWindow(existing.id);
                }
                return;
            }

            const content = this._getAppContent(appId);
            window.WindowManager.createWindow({
                appId,
                title: title || appId,
                content,
                width: 700,
                height: 500,
            });
        },

        _getAppContent(appId) {
            // Placeholder content; Phase 3 will provide real app content
            const map = {
                'my-computer': '<div class="app-placeholder"><h2>My Computer</h2><p>System information and drives.</p></div>',
                projects: '<div class="app-placeholder"><h2>Projects</h2><p>Portfolio projects showcase.</p></div>',
                about: '<div class="app-placeholder"><h2>About Me</h2><p>Learn more about Tatenda Nyemudzo.</p></div>',
                cv: '<div class="app-placeholder"><h2>My CV</h2><p>Professional experience and skills.</p></div>',
                contact: '<div class="app-placeholder"><h2>Contact</h2><p>Get in touch.</p></div>',
                'recycle-bin': '<div class="app-placeholder"><h2>Recycle Bin</h2><p>Empty.</p></div>',
                pacman: '<div class="app-placeholder"><h2>Pac-Man</h2><p>Game coming in Phase 4.</p></div>',
                chess: '<div class="app-placeholder"><h2>Chess</h2><p>Game coming in Phase 4.</p></div>',
            };
            return map[appId] || '<div class="app-placeholder"><p>Application loading...</p></div>';
        },

        /* --------------------------------------------------------
         * Taskbar
         * ------------------------------------------------------ */
        setupTaskbar() {
            const startBtn = document.querySelector('#vista-desktop .vista-start-button');
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStartMenu();
            });

            // Quick launch icons
            const quickLaunch = document.querySelector('#vista-desktop .vista-quick-launch');
            if (quickLaunch) {
                const qlApps = [
                    { id: 'projects', icon: '\uD83D\uDCC2', label: 'Projects' },
                    { id: 'about', icon: '\uD83D\uDC64', label: 'About' },
                    { id: 'contact', icon: '\u2709\uFE0F', label: 'Contact' },
                ];
                qlApps.forEach(app => {
                    const btn = document.createElement('button');
                    btn.className = 'quick-launch-btn';
                    btn.title = app.label;
                    btn.textContent = app.icon;
                    btn.addEventListener('click', () => this.openApp(app.id, app.label));
                    quickLaunch.appendChild(btn);
                });
            }

            // Initial taskbar window list render
            this.updateTaskbarWindows();
        },

        updateTaskbarWindows() {
            const container = document.querySelector('#vista-desktop .vista-taskbar-windows');
            if (!container) return;
            container.innerHTML = '';

            const wins = window.WindowManager.getWindows();
            wins.forEach(state => {
                const btn = document.createElement('button');
                btn.className = 'taskbar-window-btn';
                if (state.id === window.WindowManager.activeWindowId && !state.minimized) {
                    btn.classList.add('active');
                }
                if (state.minimized) {
                    btn.classList.add('minimized');
                }
                btn.innerHTML = `<span class="taskbar-btn-icon">${window.WindowManager._getAppIcon(state.appId)}</span>
                                 <span class="taskbar-btn-label">${state.title}</span>`;
                btn.addEventListener('click', () => {
                    if (state.minimized) {
                        window.WindowManager.restoreWindow(state.id);
                    } else if (state.id === window.WindowManager.activeWindowId) {
                        window.WindowManager.minimizeWindow(state.id);
                    } else {
                        window.WindowManager.focusWindow(state.id);
                    }
                });
                container.appendChild(btn);
            });
        },

        /* --------------------------------------------------------
         * Start Menu
         * ------------------------------------------------------ */
        setupStartMenu() {
            const menu = document.getElementById('vista-start-menu');
            if (!menu) return;

            // Populate left column (apps)
            const appsContainer = menu.querySelector('.start-menu-apps');
            START_MENU_APPS.forEach(app => {
                const item = document.createElement('button');
                item.className = 'start-menu-item';
                item.innerHTML = `<span class="start-item-icon">${app.icon}</span>
                                  <span class="start-item-label">${app.label}</span>`;
                item.addEventListener('click', () => {
                    this.closeStartMenu();
                    this.openApp(app.id, app.label);
                });
                appsContainer.appendChild(item);
            });

            // Populate right column (places)
            const placesContainer = menu.querySelector('.start-menu-places');
            START_MENU_PLACES.forEach(place => {
                const item = document.createElement('button');
                item.className = 'start-menu-item start-menu-place';
                item.innerHTML = `<span class="start-item-icon">${place.icon}</span>
                                  <span class="start-item-label">${place.label}</span>`;
                item.addEventListener('click', () => {
                    this.closeStartMenu();
                    this.openApp(place.id, place.label);
                });
                placesContainer.appendChild(item);
            });

            // Actions (Shut Down = back to OS selector)
            const actionsContainer = menu.querySelector('.start-menu-actions');
            const shutDown = document.createElement('button');
            shutDown.className = 'start-menu-item start-menu-shutdown';
            shutDown.innerHTML = `<span class="start-item-icon">\u23FB</span>
                                  <span class="start-item-label">Shut Down</span>`;
            shutDown.addEventListener('click', () => {
                this.closeStartMenu();
                this.shutDown();
            });
            actionsContainer.appendChild(shutDown);

            // Close start menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.startMenuOpen && !menu.contains(e.target) &&
                    !e.target.closest('.vista-start-button')) {
                    this.closeStartMenu();
                }
            });

            // Escape closes start menu and context menu
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (this.startMenuOpen) {
                        this.closeStartMenu();
                        e.stopPropagation();
                        return;
                    }
                    const ctxMenu = document.getElementById('vista-context-menu');
                    if (ctxMenu && !ctxMenu.classList.contains('hidden')) {
                        ctxMenu.classList.add('hidden');
                        e.stopPropagation();
                    }
                }
            });
        },

        toggleStartMenu() {
            if (this.startMenuOpen) {
                this.closeStartMenu();
            } else {
                this.openStartMenu();
            }
        },

        openStartMenu() {
            const menu = document.getElementById('vista-start-menu');
            menu.classList.remove('hidden');
            menu.classList.add('start-menu-open');
            this.startMenuOpen = true;
            document.querySelector('.vista-start-button').classList.add('active');
        },

        closeStartMenu() {
            const menu = document.getElementById('vista-start-menu');
            if (!menu) return;
            menu.classList.add('hidden');
            menu.classList.remove('start-menu-open');
            this.startMenuOpen = false;
            const btn = document.querySelector('.vista-start-button');
            if (btn) btn.classList.remove('active');
        },

        shutDown() {
            // Clear preference and reload to OS selector
            localStorage.removeItem('nostalgiaOS');
            location.reload();
        },

        /* --------------------------------------------------------
         * Context Menu
         * ------------------------------------------------------ */
        setupContextMenu() {
            const desktop = document.getElementById('vista-desktop');
            const menu = document.getElementById('vista-context-menu');

            desktop.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                // Only show on desktop background / icons area
                if (e.target.closest('.os-window') || e.target.closest('.vista-taskbar') ||
                    e.target.closest('.vista-start-menu')) return;

                this.showContextMenu(menu, e.clientX, e.clientY);
            });

            document.addEventListener('click', () => {
                menu.classList.add('hidden');
            });
        },

        showContextMenu(menu, x, y) {
            menu.innerHTML = '';
            CONTEXT_MENU_ITEMS.forEach(item => {
                if (item.type === 'separator') {
                    const sep = document.createElement('div');
                    sep.className = 'context-separator';
                    menu.appendChild(sep);
                    return;
                }
                const el = document.createElement('button');
                el.className = 'context-item';
                if (item.disabled) el.classList.add('disabled');
                el.textContent = item.label;
                if (item.submenu) {
                    el.innerHTML += ' <span class="context-arrow">\u25B6</span>';
                }
                if (item.action === 'refresh') {
                    el.addEventListener('click', () => location.reload());
                }
                menu.appendChild(el);
            });

            // Position, ensuring menu stays on screen
            menu.classList.remove('hidden');
            const menuW = menu.offsetWidth;
            const menuH = menu.offsetHeight;
            if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 4;
            if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 4;

            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
        },

        /* --------------------------------------------------------
         * Event Bus Subscriptions
         * ------------------------------------------------------ */
        subscribeToEvents() {
            if (!window.EventBus) return;

            EventBus.on('window:created', () => this.updateTaskbarWindows());
            EventBus.on('window:closed', () => this.updateTaskbarWindows());
            EventBus.on('window:minimized', () => this.updateTaskbarWindows());
            EventBus.on('window:restored', () => this.updateTaskbarWindows());
            EventBus.on('window:focused', () => this.updateTaskbarWindows());
            EventBus.on('window:maximized', () => this.updateTaskbarWindows());
        },
    };

    window.VistaAdapter = VistaAdapter;
})();

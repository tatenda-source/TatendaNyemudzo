/**
 * Mac Adapter - Mac OS X Leopard-era shell: menu bar, dock with magnification,
 * desktop icons, context menu, and window chrome integration.
 */

(function () {
    'use strict';

    const DESKTOP_ICONS = [
        { id: 'my-computer', label: 'Macintosh HD', icon: '\uD83D\uDCBB' },
        { id: 'projects',    label: 'Projects',     icon: '\uD83D\uDCC2' },
        { id: 'about',       label: 'About Me',     icon: '\uD83D\uDC64' },
        { id: 'cv',          label: 'My CV',        icon: '\uD83D\uDCC4' },
        { id: 'contact',     label: 'Contact',      icon: '\u2709\uFE0F' },
    ];

    const DOCK_APPS = [
        { id: 'finder',   label: 'Finder',    icon: '\uD83D\uDCC1' },
        { id: 'projects', label: 'Projects',  icon: '\uD83D\uDCC2' },
        { id: 'about',    label: 'About Me',  icon: '\uD83D\uDC64' },
        { id: 'cv',       label: 'My CV',     icon: '\uD83D\uDCC4' },
        { id: 'contact',  label: 'Contact',   icon: '\u2709\uFE0F' },
        { id: 'pacman',   label: 'Pac-Man',   icon: '\uD83D\uDC7E' },
        { id: 'chess',    label: 'Chess',      icon: '\u265A' },
    ];

    const CONTEXT_MENU_ITEMS = [
        { label: 'New Folder', action: 'new-folder' },
        { label: 'Get Info', action: 'get-info' },
        { type: 'separator' },
        { label: 'Change Desktop Background...', action: 'background' },
        { type: 'separator' },
        { label: 'Clean Up Selection', action: 'cleanup' },
        { label: 'Sort By', submenu: true },
        { label: 'Show View Options', action: 'view-options' },
    ];

    const MacAdapter = {
        selectedIcons: new Set(),

        init() {
            this.setupMenuBar();
            this.setupDesktopIcons();
            this.setupDock();
            this.setupContextMenu();
            this.subscribeToEvents();
            console.log('Mac Adapter initialized');
        },

        /* --------------------------------------------------------
         * Menu Bar
         * ------------------------------------------------------ */
        setupMenuBar() {
            const appleMenu = document.querySelector('#mac-desktop .mac-apple-menu');
            if (appleMenu) {
                appleMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleAppleMenu();
                });
            }
            // Wire up menu bar items (File, Edit, View, etc.)
            this.setupMenuItems();

            // Close any open menu dropdown on outside click
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('apple-menu-dropdown');
                if (dropdown && !dropdown.contains(e.target) && !e.target.closest('.mac-apple-menu')) {
                    dropdown.remove();
                }
                this.closeMenuDropdown(e);
            });
            // Escape closes context menu and apple menu
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    // Close menu bar dropdowns
                    const menuDropdown = document.querySelector('.mac-menu-dropdown');
                    if (menuDropdown) {
                        menuDropdown.remove();
                        document.querySelectorAll('#mac-desktop .mac-menu-item').forEach(mi => mi.classList.remove('active'));
                        e.stopPropagation();
                        return;
                    }
                    const dropdown = document.getElementById('apple-menu-dropdown');
                    if (dropdown) { dropdown.remove(); e.stopPropagation(); return; }
                    const ctxMenu = document.getElementById('mac-context-menu');
                    if (ctxMenu && !ctxMenu.classList.contains('hidden')) {
                        ctxMenu.classList.add('hidden');
                        e.stopPropagation();
                    }
                }
            });
        },

        toggleAppleMenu() {
            let dropdown = document.getElementById('apple-menu-dropdown');
            if (dropdown) { dropdown.remove(); return; }

            dropdown = document.createElement('div');
            dropdown.id = 'apple-menu-dropdown';
            dropdown.className = 'apple-menu-dropdown';
            dropdown.setAttribute('role', 'menu');
            dropdown.innerHTML = `
                <button class="context-item" role="menuitem" data-action="about-mac">About This Mac</button>
                <div class="context-separator"></div>
                <button class="context-item" role="menuitem" data-action="restart">Restart...</button>
                <button class="context-item" role="menuitem" data-action="shut-down">Shut Down...</button>
            `;
            dropdown.querySelector('[data-action="about-mac"]').addEventListener('click', () => {
                dropdown.remove();
                this.openApp('about', 'About This Mac');
            });
            dropdown.querySelector('[data-action="shut-down"]').addEventListener('click', () => {
                localStorage.removeItem('nostalgiaOS');
                location.reload();
            });
            dropdown.querySelector('[data-action="restart"]').addEventListener('click', () => {
                location.reload();
            });
            const menubar = document.querySelector('#mac-desktop .mac-menubar');
            menubar.appendChild(dropdown);
        },

        /* --------------------------------------------------------
         * Menu Bar Items (File, Edit, View, Go, Window, Help)
         * ------------------------------------------------------ */
        _menuDefinitions: {
            'File': [
                { label: 'New Finder Window', action: 'finder' },
                { type: 'separator' },
                { label: 'Open...', disabled: true },
                { label: 'Close Window', action: 'close-window' },
                { type: 'separator' },
                { label: 'Get Info', disabled: true },
            ],
            'Edit': [
                { label: 'Undo', disabled: true },
                { label: 'Redo', disabled: true },
                { type: 'separator' },
                { label: 'Cut', disabled: true },
                { label: 'Copy', disabled: true },
                { label: 'Paste', disabled: true },
                { label: 'Select All', disabled: true },
            ],
            'View': [
                { label: 'as Icons', disabled: true },
                { label: 'as List', disabled: true },
                { label: 'as Columns', disabled: true },
                { label: 'as Cover Flow', disabled: true },
                { type: 'separator' },
                { label: 'Show Path Bar', disabled: true },
                { label: 'Show Status Bar', disabled: true },
            ],
            'Go': [
                { label: 'Computer', action: 'my-computer' },
                { label: 'Home', disabled: true },
                { label: 'Documents', action: 'projects' },
                { type: 'separator' },
                { label: 'Applications', disabled: true },
            ],
            'Window': [
                { label: 'Minimize', action: 'minimize-window' },
                { label: 'Zoom', action: 'maximize-window' },
                { type: 'separator' },
                { label: 'Bring All to Front', disabled: true },
            ],
            'Help': [
                { label: 'About Tatenda', action: 'about' },
                { label: 'View CV', action: 'cv' },
                { label: 'Contact', action: 'contact' },
            ],
        },

        setupMenuItems() {
            const items = document.querySelectorAll('#mac-desktop .mac-menu-item');
            items.forEach(item => {
                item.style.cursor = 'default';
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const label = item.textContent;
                    this.toggleMenuDropdown(label, item);
                });
                // Hover-to-switch: if a dropdown is open and you hover another item, switch
                item.addEventListener('mouseenter', () => {
                    const existing = document.querySelector('.mac-menu-dropdown');
                    if (existing) {
                        const label = item.textContent;
                        this.toggleMenuDropdown(label, item, true);
                    }
                });
            });
        },

        toggleMenuDropdown(menuName, anchorEl, forceOpen) {
            // Close existing
            const existing = document.querySelector('.mac-menu-dropdown');
            if (existing) {
                const wasThisMenu = existing.dataset.menuName === menuName;
                existing.remove();
                if (wasThisMenu && !forceOpen) return;
            }

            const items = this._menuDefinitions[menuName];
            if (!items) return;

            const dropdown = document.createElement('div');
            dropdown.className = 'mac-menu-dropdown apple-menu-dropdown';
            dropdown.dataset.menuName = menuName;
            dropdown.setAttribute('role', 'menu');

            items.forEach(item => {
                if (item.type === 'separator') {
                    const sep = document.createElement('div');
                    sep.className = 'context-separator';
                    dropdown.appendChild(sep);
                    return;
                }
                const btn = document.createElement('button');
                btn.className = 'context-item';
                btn.setAttribute('role', 'menuitem');
                btn.textContent = item.label;
                if (item.disabled) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.addEventListener('click', () => {
                        dropdown.remove();
                        this._handleMenuAction(item.action);
                    });
                }
                dropdown.appendChild(btn);
            });

            // Position below the anchor menu item
            const rect = anchorEl.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.top = rect.bottom + 'px';

            document.body.appendChild(dropdown);

            // Highlight the active menu item
            document.querySelectorAll('#mac-desktop .mac-menu-item').forEach(mi => mi.classList.remove('active'));
            anchorEl.classList.add('active');
        },

        _handleMenuAction(action) {
            document.querySelectorAll('#mac-desktop .mac-menu-item').forEach(mi => mi.classList.remove('active'));
            switch (action) {
                case 'close-window':
                    if (window.WindowManager && window.WindowManager.activeWindowId) {
                        window.WindowManager.closeWindow(window.WindowManager.activeWindowId);
                    }
                    break;
                case 'minimize-window':
                    if (window.WindowManager && window.WindowManager.activeWindowId) {
                        window.WindowManager.minimizeWindow(window.WindowManager.activeWindowId);
                    }
                    break;
                case 'maximize-window':
                    if (window.WindowManager && window.WindowManager.activeWindowId) {
                        window.WindowManager.toggleMaximize(window.WindowManager.activeWindowId);
                    }
                    break;
                default:
                    if (action) this.openApp(action, action.charAt(0).toUpperCase() + action.slice(1));
                    break;
            }
        },

        closeMenuDropdown(e) {
            const dropdown = document.querySelector('.mac-menu-dropdown');
            if (dropdown && !dropdown.contains(e.target) && !e.target.closest('.mac-menu-items')) {
                dropdown.remove();
                document.querySelectorAll('#mac-desktop .mac-menu-item').forEach(mi => mi.classList.remove('active'));
            }
        },

        /** Update menu bar app name when a window gains focus. */
        updateMenuBarAppName(title) {
            const appName = document.querySelector('#mac-desktop .mac-app-name');
            if (appName) {
                appName.innerHTML = `<strong>${title || 'Finder'}</strong>`;
            }
        },

        /* --------------------------------------------------------
         * Desktop Icons (Finder-style, right-aligned columns)
         * ------------------------------------------------------ */
        setupDesktopIcons() {
            const container = document.querySelector('#mac-desktop .desktop-icons');
            container.innerHTML = '';

            DESKTOP_ICONS.forEach((icon, index) => {
                const el = document.createElement('div');
                el.className = 'desktop-icon mac-icon';
                el.dataset.appId = icon.id;
                el.tabIndex = 0;
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', icon.label);

                el.innerHTML = `
                    <div class="icon-image">${icon.icon}</div>
                    <span class="icon-label">${icon.label}</span>
                `;

                // Mac icons positioned right-to-left, top-to-bottom
                const col = Math.floor(index / 5);
                const row = index % 5;
                el.style.gridRow = row + 1;
                el.style.gridColumn = col + 1;

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectIcon(el, e.metaKey || e.ctrlKey);
                });

                el.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.openApp(icon.id, icon.label);
                });

                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') this.openApp(icon.id, icon.label);
                });

                container.appendChild(el);
            });

            // Deselect on desktop click
            const desktop = document.getElementById('mac-desktop');
            desktop.addEventListener('click', (e) => {
                if (e.target === desktop || e.target.classList.contains('desktop-icons')) {
                    this.clearSelection();
                }
            });
        },

        selectIcon(el, multi) {
            if (!multi) {
                document.querySelectorAll('#mac-desktop .desktop-icon.selected').forEach(
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
            document.querySelectorAll('#mac-desktop .desktop-icon.selected').forEach(
                ic => ic.classList.remove('selected')
            );
            this.selectedIcons.clear();
        },

        openApp(appId, title) {
            if (!window.WindowManager) {
                console.error('WindowManager not available');
                return;
            }
            // Single-instance enforcement
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
            const map = {
                'my-computer': '<div class="app-placeholder"><h2>Macintosh HD</h2><p>System information.</p></div>',
                finder: '<div class="app-placeholder"><h2>Finder</h2><p>Browse files.</p></div>',
                projects: '<div class="app-placeholder"><h2>Projects</h2><p>Portfolio projects showcase.</p></div>',
                about: '<div class="app-placeholder"><h2>About Me</h2><p>Learn more about Tatenda Nyemudzo.</p></div>',
                cv: '<div class="app-placeholder"><h2>My CV</h2><p>Professional experience and skills.</p></div>',
                contact: '<div class="app-placeholder"><h2>Contact</h2><p>Get in touch.</p></div>',
                pacman: '<div class="app-placeholder"><h2>Pac-Man</h2><p>Game coming in Phase 4.</p></div>',
                chess: '<div class="app-placeholder"><h2>Chess</h2><p>Game coming in Phase 4.</p></div>',
            };
            return map[appId] || '<div class="app-placeholder"><p>Application loading...</p></div>';
        },

        /* --------------------------------------------------------
         * Dock with Magnification Effect
         * ------------------------------------------------------ */
        setupDock() {
            const dockApps = document.querySelector('#mac-desktop .dock-apps');
            const dockTrash = document.querySelector('#mac-desktop .dock-trash');
            if (!dockApps) return;
            dockApps.innerHTML = '';

            DOCK_APPS.forEach(app => {
                const el = this._createDockIcon(app);
                dockApps.appendChild(el);
            });

            // Trash icon
            if (dockTrash) {
                dockTrash.innerHTML = '';
                const trash = this._createDockIcon({
                    id: 'recycle-bin', label: 'Trash', icon: '\uD83D\uDDD1\uFE0F'
                });
                dockTrash.appendChild(trash);
            }

            // Magnification effect on the entire dock
            const dock = document.querySelector('#mac-desktop .mac-dock');
            if (dock) {
                dock.addEventListener('mousemove', (e) => this._magnifyDock(e, dock));
                dock.addEventListener('mouseleave', () => this._resetDockMagnification(dock));
            }

            this.updateDockIndicators();
        },

        _createDockIcon(app) {
            const el = document.createElement('button');
            el.className = 'dock-icon';
            el.dataset.appId = app.id;
            el.dataset.label = app.label;
            el.innerHTML = `<span class="dock-icon-img">${app.icon}</span>
                            <span class="dock-indicator"></span>`;
            el.addEventListener('click', () => {
                this.openApp(app.id, app.label);
            });
            return el;
        },

        _magnifyDock(e, dock) {
            const icons = dock.querySelectorAll('.dock-icon');
            const dockRect = dock.getBoundingClientRect();
            const mouseX = e.clientX;

            icons.forEach(icon => {
                const iconRect = icon.getBoundingClientRect();
                const iconCenterX = iconRect.left + iconRect.width / 2;
                const distance = Math.abs(mouseX - iconCenterX);
                const maxDist = 120;

                if (distance < maxDist) {
                    const scale = 1 + 0.5 * (1 - distance / maxDist);
                    icon.style.transform = `scale(${scale}) translateY(${-(scale - 1) * 20}px)`;
                } else {
                    icon.style.transform = 'scale(1) translateY(0)';
                }
            });
        },

        _resetDockMagnification(dock) {
            dock.querySelectorAll('.dock-icon').forEach(icon => {
                icon.style.transform = 'scale(1) translateY(0)';
            });
        },

        /** Show running-app indicators (dots) under dock icons. */
        updateDockIndicators() {
            const wins = window.WindowManager ? window.WindowManager.getWindows() : [];
            const runningApps = new Set(wins.map(w => w.appId));

            document.querySelectorAll('#mac-desktop .dock-icon').forEach(icon => {
                const indicator = icon.querySelector('.dock-indicator');
                if (runningApps.has(icon.dataset.appId)) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        },

        /* --------------------------------------------------------
         * Context Menu
         * ------------------------------------------------------ */
        setupContextMenu() {
            const desktop = document.getElementById('mac-desktop');
            const menu = document.getElementById('mac-context-menu');

            desktop.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (e.target.closest('.os-window') || e.target.closest('.mac-menubar') ||
                    e.target.closest('.mac-dock')) return;

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
                el.textContent = item.label;
                if (item.submenu) {
                    el.innerHTML += ' <span class="context-arrow">\u25B6</span>';
                }
                menu.appendChild(el);
            });

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

            EventBus.on('window:created', () => this.updateDockIndicators());
            EventBus.on('window:closed', () => this.updateDockIndicators());
            EventBus.on('window:focused', (data) => {
                this.updateDockIndicators();
                if (data && data.title) {
                    this.updateMenuBarAppName(data.title);
                } else {
                    this.updateMenuBarAppName('Finder');
                }
            });
            EventBus.on('window:minimized', () => this.updateDockIndicators());
            EventBus.on('window:restored', () => this.updateDockIndicators());
        },
    };

    window.MacAdapter = MacAdapter;
})();

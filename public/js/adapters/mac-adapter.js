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
            const isGame = content === 'GAME_PACMAN' || content === 'GAME_CHESS';
            const winConfig = {
                appId,
                title: title || appId,
                content: isGame ? '' : content,
                width: isGame ? (appId === 'chess' ? 520 : 480) : 700,
                height: isGame ? (appId === 'chess' ? 580 : 560) : 500,
            };
            const winId = window.WindowManager.createWindow(winConfig);

            if (content === 'GAME_PACMAN' && window.PacManApp) {
                const state = window.WindowManager.windows.get(winId);
                if (state) window.PacManApp.init(state.el.querySelector('.window-body'));
            } else if (content === 'GAME_CHESS' && window.ChessApp) {
                const state = window.WindowManager.windows.get(winId);
                if (state) window.ChessApp.init(state.el.querySelector('.window-body'));
            }
        },

        _getAppContent(appId) {
            const d = window.PortfolioData || {};
            const map = {
                'my-computer': `<div class="app-content" style="padding:16px;">
                    <h3 style="margin-bottom:12px;color:#333;">Macintosh HD</h3>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f5f5f5;border-radius:6px;">
                        <span style="font-size:32px;">💾</span>
                        <div><strong>Macintosh HD</strong><br><span style="color:#888;font-size:12px;">Portfolio System Drive</span></div>
                    </div>
                </div>`,
                finder: '<div class="app-content" style="padding:16px;"><h3 style="color:#333;">Finder</h3><p style="color:#888;margin-top:8px;">Browse files on this Mac.</p></div>',
                projects: this._buildProjectsContent(d),
                about: this._buildAboutContent(d),
                cv: this._buildCVContent(d),
                contact: this._buildContactContent(d),
                pacman: 'GAME_PACMAN',
                chess: 'GAME_CHESS',
            };
            return map[appId] || '<div class="app-content"><p>Application loading...</p></div>';
        },

        _buildAboutContent(d) {
            return `<div class="app-content" style="font-family:'Lucida Grande',sans-serif;">
                <div style="background:linear-gradient(135deg,#4878a8,#5eb5d4);padding:24px;color:#fff;">
                    <h2 style="font-size:22px;font-weight:400;margin-bottom:4px;">${d.name || 'Tatenda Nyemudzo'}</h2>
                    <p style="opacity:0.85;font-size:13px;">${d.title || 'Full Stack Developer'} — ${d.location || ''}</p>
                </div>
                <div style="padding:16px;">
                    <p style="line-height:1.7;color:#333;font-size:13px;margin-bottom:16px;">${d.summary || ''}</p>
                    <h3 style="font-size:12px;color:#555;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Skills</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
                        ${(d.skills?.languages || []).concat(d.skills?.frameworks || []).map(s =>
                            `<span style="background:#f0f0f0;color:#333;padding:3px 10px;border-radius:10px;font-size:11px;">${s}</span>`
                        ).join('')}
                    </div>
                    <div style="font-size:12px;color:#555;line-height:2;">
                        📧 ${d.email || ''}<br>📱 ${d.phone || ''}<br>🔗 ${d.github || ''}
                    </div>
                </div>
            </div>`;
        },

        _buildProjectsContent(d) {
            const projects = d.projects || [];
            return `<div class="app-content" style="font-family:'Lucida Grande',sans-serif;">
                <div style="background:#f5f5f5;padding:8px 16px;border-bottom:1px solid #ddd;font-size:12px;color:#666;">
                    📁 Projects (${projects.length} items)
                </div>
                <div style="padding:16px;">
                    ${projects.length ? projects.map(p => `
                        <div style="border:1px solid #e8e8e8;border-radius:6px;padding:16px;margin-bottom:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:start;">
                                <h3 style="font-size:14px;color:#333;">${p.title}</h3>
                                <span style="background:#f0f0f0;padding:2px 8px;border-radius:10px;font-size:10px;color:#666;">${p.category}</span>
                            </div>
                            <p style="font-size:11px;color:#888;margin:4px 0 8px;">${p.role}</p>
                            <p style="font-size:13px;color:#333;line-height:1.6;">${p.description}</p>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                                ${p.technologies.map(t => `<span style="background:#e8e8e8;padding:2px 8px;border-radius:10px;font-size:10px;color:#555;">${t}</span>`).join('')}
                            </div>
                        </div>
                    `).join('') : '<p style="color:#888;text-align:center;padding:40px;">No projects yet.</p>'}
                </div>
            </div>`;
        },

        _buildCVContent(d) {
            return `<div class="app-content" style="font-family:'Lucida Grande',sans-serif;">
                <div style="background:#f5f5f5;padding:8px 16px;border-bottom:1px solid #ddd;display:flex;gap:8px;">
                    <button onclick="window.print()" style="padding:4px 12px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:11px;font-family:inherit;">🖨️ Print</button>
                </div>
                <div style="max-width:580px;margin:20px auto;padding:28px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,0.06);border-radius:4px;font-size:13px;">
                    <h2 style="font-size:20px;font-weight:500;color:#1a1a1a;margin-bottom:2px;">${d.name || ''}</h2>
                    <p style="color:#666;margin-bottom:4px;">${d.title || ''}</p>
                    <p style="font-size:11px;color:#999;margin-bottom:16px;">${d.location || ''} · ${d.email || ''} · ${d.phone || ''}</p>
                    <hr style="border:none;border-top:1px solid #eee;margin-bottom:16px;">
                    <p style="line-height:1.7;color:#333;margin-bottom:16px;">${d.summary || ''}</p>
                    <h3 style="font-size:12px;color:#555;margin-bottom:8px;text-transform:uppercase;">Skills</h3>
                    <div style="margin-bottom:16px;line-height:1.8;font-size:12px;">
                        <strong>Languages:</strong> ${(d.skills?.languages || []).join(', ')}<br>
                        <strong>Frameworks:</strong> ${(d.skills?.frameworks || []).join(', ')}<br>
                        <strong>Web:</strong> ${(d.skills?.webTechnologies || []).join(', ')}<br>
                        <strong>Tools:</strong> ${(d.skills?.devOpsTools || []).join(', ')}
                    </div>
                </div>
            </div>`;
        },

        _buildContactContent(d) {
            return `<div class="app-content" style="padding:24px;max-width:440px;margin:0 auto;font-family:'Lucida Grande',sans-serif;">
                <h2 style="font-size:17px;font-weight:500;color:#333;margin-bottom:16px;">✉️ Contact</h2>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f5f5f5;border-radius:6px;">
                        <span style="font-size:20px;">📧</span>
                        <div><strong style="font-size:11px;color:#888;">Email</strong><br><a href="mailto:${d.email}" style="color:#2968C8;text-decoration:none;font-size:13px;">${d.email || ''}</a></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f5f5f5;border-radius:6px;">
                        <span style="font-size:20px;">📱</span>
                        <div><strong style="font-size:11px;color:#888;">Phone</strong><br><span style="font-size:13px;">${d.phone || ''}</span></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f5f5f5;border-radius:6px;">
                        <span style="font-size:20px;">🔗</span>
                        <div><strong style="font-size:11px;color:#888;">GitHub</strong><br><a href="https://${d.github}" target="_blank" style="color:#2968C8;text-decoration:none;font-size:13px;">${d.github || ''}</a></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f5f5f5;border-radius:6px;">
                        <span style="font-size:20px;">📍</span>
                        <div><strong style="font-size:11px;color:#888;">Location</strong><br><span style="font-size:13px;">${d.location || ''}</span></div>
                    </div>
                </div>
            </div>`;
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

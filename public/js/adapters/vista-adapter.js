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
            const isGame = content === 'GAME_PACMAN' || content === 'GAME_CHESS';
            const winConfig = {
                appId,
                title: title || appId,
                content: isGame ? '' : content,
                width: isGame ? (appId === 'chess' ? 520 : 480) : 700,
                height: isGame ? (appId === 'chess' ? 580 : 560) : 500,
            };
            const winId = window.WindowManager.createWindow(winConfig);

            // Init games after window is created
            if (content === 'GAME_PACMAN' && window.PacManApp) {
                const state = window.WindowManager.windows.get(winId);
                if (state) {
                    const body = state.el.querySelector('.window-body');
                    window.PacManApp.init(body);
                }
            } else if (content === 'GAME_CHESS' && window.ChessApp) {
                const state = window.WindowManager.windows.get(winId);
                if (state) {
                    const body = state.el.querySelector('.window-body');
                    window.ChessApp.init(body);
                }
            }
        },

        _getAppContent(appId) {
            const d = window.PortfolioData || {};
            const map = {
                'my-computer': `<div class="app-content vista-explorer">
                    <div class="explorer-sidebar">
                        <div class="sidebar-section"><strong>System</strong></div>
                        <div class="sidebar-item">💻 Computer</div>
                        <div class="sidebar-item">📂 Documents</div>
                        <div class="sidebar-item">🖼️ Pictures</div>
                    </div>
                    <div class="explorer-main">
                        <h3 style="margin-bottom:12px;color:#1a3a5c;">Computer</h3>
                        <div class="drive-list">
                            <div class="drive-item" style="display:flex;align-items:center;gap:12px;padding:8px;border-radius:4px;background:rgba(80,140,220,0.05);">
                                <span style="font-size:32px;">💾</span>
                                <div><strong>Local Disk (C:)</strong><br><span style="color:#666;font-size:12px;">Portfolio System Drive</span></div>
                            </div>
                        </div>
                    </div>
                </div>`,
                projects: this._buildProjectsContent(d),
                about: this._buildAboutContent(d),
                cv: this._buildCVContent(d),
                contact: this._buildContactContent(d),
                'recycle-bin': '<div class="app-content" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#888;"><span style="font-size:64px;">🗑️</span><p style="margin-top:12px;">Recycle Bin is empty.</p></div>',
                pacman: 'GAME_PACMAN',
                chess: 'GAME_CHESS',
            };
            return map[appId] || '<div class="app-content"><p>Application loading...</p></div>';
        },

        _buildAboutContent(d) {
            return `<div class="app-content vista-about">
                <div style="background:linear-gradient(135deg,#1a4d80,#2c6faa);padding:24px;color:#fff;border-radius:0;">
                    <h2 style="font-size:24px;font-weight:300;margin-bottom:4px;">${d.name || 'Tatenda Nyemudzo'}</h2>
                    <p style="opacity:0.8;font-size:14px;">${d.title || 'Full Stack Developer'} — ${d.location || ''}</p>
                </div>
                <div style="padding:16px;">
                    <p style="line-height:1.7;color:#333;font-size:13px;margin-bottom:16px;">${d.summary || ''}</p>
                    <h3 style="font-size:13px;color:#1a3a5c;margin-bottom:8px;">Technical Skills</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
                        ${(d.skills?.languages || []).concat(d.skills?.frameworks || []).map(s =>
                            `<span style="background:#e8f0fe;color:#1a4d80;padding:3px 10px;border-radius:3px;font-size:11px;">${s}</span>`
                        ).join('')}
                    </div>
                    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#555;">
                        <span>📧 ${d.email || ''}</span>
                        <span>📱 ${d.phone || ''}</span>
                        <span>🔗 ${d.github || ''}</span>
                    </div>
                </div>
            </div>`;
        },

        _buildProjectsContent(d) {
            const projects = d.projects || [];
            return `<div class="app-content vista-projects">
                <div style="background:#f0f4f8;padding:10px 16px;border-bottom:1px solid #ddd;font-size:12px;color:#555;">
                    📁 Portfolio &gt; Projects (${projects.length} items)
                </div>
                <div style="padding:16px;">
                    ${projects.length ? projects.map(p => `
                        <div style="border:1px solid #e0e6ed;border-radius:4px;padding:16px;margin-bottom:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:start;">
                                <h3 style="font-size:15px;color:#1a3a5c;margin-bottom:4px;">${p.title}</h3>
                                <span style="background:#e8f0fe;color:#1a4d80;padding:2px 8px;border-radius:3px;font-size:10px;">${p.category}</span>
                            </div>
                            <p style="font-size:12px;color:#666;margin-bottom:8px;">${p.role}</p>
                            <p style="font-size:13px;color:#333;line-height:1.6;margin-bottom:8px;">${p.description}</p>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                ${p.technologies.map(t => `<span style="background:#f0f0f0;padding:2px 8px;border-radius:2px;font-size:11px;color:#555;">${t}</span>`).join('')}
                            </div>
                        </div>
                    `).join('') : '<p style="color:#888;text-align:center;padding:40px;">No projects yet. Check back soon!</p>'}
                </div>
            </div>`;
        },

        _buildCVContent(d) {
            return `<div class="app-content vista-cv">
                <div style="background:#f8f8f8;padding:8px 16px;border-bottom:1px solid #ddd;display:flex;gap:8px;">
                    <button onclick="window.print()" style="padding:4px 12px;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;font-size:11px;">🖨️ Print</button>
                </div>
                <div style="max-width:600px;margin:20px auto;padding:32px;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,0.08);font-size:13px;">
                    <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin-bottom:2px;">${d.name || ''}</h2>
                    <p style="color:#555;margin-bottom:4px;">${d.title || ''}</p>
                    <p style="font-size:11px;color:#888;margin-bottom:16px;">${d.location || ''} · ${d.email || ''} · ${d.phone || ''}</p>
                    <hr style="border:none;border-top:1px solid #eee;margin-bottom:16px;">
                    <h3 style="font-size:13px;color:#1a3a5c;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Summary</h3>
                    <p style="line-height:1.7;color:#333;margin-bottom:16px;">${d.summary || ''}</p>
                    <h3 style="font-size:13px;color:#1a3a5c;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Skills</h3>
                    <div style="margin-bottom:16px;line-height:1.8;">
                        <strong style="font-size:12px;">Languages:</strong> <span style="color:#555;">${(d.skills?.languages || []).join(', ')}</span><br>
                        <strong style="font-size:12px;">Frameworks:</strong> <span style="color:#555;">${(d.skills?.frameworks || []).join(', ')}</span><br>
                        <strong style="font-size:12px;">Web:</strong> <span style="color:#555;">${(d.skills?.webTechnologies || []).join(', ')}</span><br>
                        <strong style="font-size:12px;">Tools:</strong> <span style="color:#555;">${(d.skills?.devOpsTools || []).join(', ')}</span>
                    </div>
                    <h3 style="font-size:13px;color:#1a3a5c;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Projects</h3>
                    ${(d.projects || []).map(p => `
                        <div style="margin-bottom:12px;">
                            <strong>${p.title}</strong> <span style="color:#888;font-size:11px;">— ${p.role}</span>
                            <p style="color:#555;margin-top:4px;">${p.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        },

        _buildContactContent(d) {
            return `<div class="app-content vista-contact">
                <div style="padding:24px;max-width:480px;margin:0 auto;">
                    <h2 style="font-size:18px;font-weight:400;color:#1a3a5c;margin-bottom:16px;">✉️ Get In Touch</h2>
                    <div style="margin-bottom:20px;">
                        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:8px;">
                            <span style="font-size:20px;">📧</span>
                            <div><strong style="font-size:12px;color:#888;">Email</strong><br><a href="mailto:${d.email}" style="color:#1a4d80;text-decoration:none;">${d.email || ''}</a></div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:8px;">
                            <span style="font-size:20px;">📱</span>
                            <div><strong style="font-size:12px;color:#888;">Phone</strong><br>${d.phone || ''}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:8px;">
                            <span style="font-size:20px;">🔗</span>
                            <div><strong style="font-size:12px;color:#888;">GitHub</strong><br><a href="https://${d.github}" target="_blank" style="color:#1a4d80;text-decoration:none;">${d.github || ''}</a></div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e8e8e8;border-radius:4px;">
                            <span style="font-size:20px;">📍</span>
                            <div><strong style="font-size:12px;color:#888;">Location</strong><br>${d.location || ''}</div>
                        </div>
                    </div>
                </div>
            </div>`;
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

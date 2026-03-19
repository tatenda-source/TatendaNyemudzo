# Nostalgia OS Portfolio - Phase 2 Changelog

## Phase 2: Desktop Environments (2026-03-19)

### Overview

Phase 2 transforms the portfolio from a boot screen into a fully interactive desktop operating system experience. A multi-agent team of UI/UX experts, architecture reviewers, and frontend engineers collaborated to implement and then audit every component for visual authenticity, accessibility, and robustness.

---

### New Features

#### Event Bus (`public/js/core/event-bus.js`) — NEW FILE
- Lightweight pub/sub system for decoupled communication between modules
- Methods: `on()`, `once()`, `emit()`, `off()`
- Events: `window:created`, `window:focused`, `window:minimized`, `window:maximized`, `window:restored`, `window:closed`
- Error-safe: catches and logs handler exceptions without breaking the event chain

#### Window Manager (`public/js/core/window-manager.js`) — COMPLETE REWRITE
- `createWindow(config)` — builds OS-specific DOM (Vista Aero / Mac brushed metal)
- Focus management with z-index stacking (capped at 8999 to stay below shell)
- Drag by title bar with boundary clamping (title bar always reachable)
- 8-directional resize handles (n, ne, e, se, s, sw, w, nw) with min-size enforcement
- Minimize with animation → hide, with race-condition-safe timer tracking
- Maximize accounting for taskbar (Vista) and menu bar + dock (Mac)
- Close with fade-out animation, dispatches `mouseup` to clean up any in-progress drag
- Double-click title bar to toggle maximize/restore
- Escape key closes the active window
- All windows created with `role="dialog"` and `aria-label` for screen readers

#### Vista Desktop (`public/js/adapters/vista-adapter.js`) — COMPLETE REWRITE
- **Desktop Icons**: My Computer, Projects, About Me, My CV, Contact, Recycle Bin
  - Column-first grid layout from top-left
  - Single-click to select (with Ctrl/Cmd multi-select), double-click to open
  - Keyboard: Enter to open, Tab to navigate
- **Taskbar**: Aero glass with backdrop-filter blur
  - Green Start orb with Windows flag glyph (corrected from blue per UI review)
  - Quick launch bar (Projects, About, Contact)
  - Window list that syncs with WindowManager via EventBus
  - System tray with volume/network icons and live clock
- **Start Menu**: Two-column frosted glass panel
  - Left: app list (Projects, About, CV, Contact, Pac-Man, Chess)
  - Right: places (Computer, Documents, Recent Items)
  - User avatar area with name
  - Shut Down button returns to OS selector (clears localStorage, reloads)
  - Escape key closes the start menu
- **Context Menu**: Right-click on desktop background
  - View, Sort by, Refresh, Paste, New, Personalize
  - Solid blue gradient hover highlights (corrected per UI review)
  - Edge-aware positioning
  - Escape key dismisses
- **Single-instance windows**: Re-focuses existing window instead of opening duplicates
- **Null guard**: Gracefully handles missing WindowManager

#### Mac Desktop (`public/js/adapters/mac-adapter.js`) — COMPLETE REWRITE
- **Menu Bar**: Frosted glass with backdrop-filter blur + saturate
  - Apple icon with click-to-open dropdown menu
  - Dynamic app name (updates to focused window's title, defaults to "Finder")
  - File, Edit, View, Go, Window, Help items with blue gradient hover
  - Status icons and live clock
- **Apple Menu Dropdown** — NEW
  - "About This Mac" opens the About app
  - "Restart..." reloads the page
  - "Shut Down..." clears localStorage and returns to OS selector
  - Escape key dismisses
- **Dock**: Leopard-era flat glass shelf (corrected from modern pill shape)
  - 7 app icons + Trash, separated by dividers
  - Magnification effect: mouse proximity scaling up to 1.5x with vertical lift
  - Running-app indicator dots (bright white with glow)
  - Tooltip labels via `data-label` attribute (no double-tooltip bug)
  - Bounce animation for app launch (3 bounces, 0.6s each)
- **Desktop Icons**: Right-aligned column layout (Finder style)
  - Macintosh HD, Projects, About Me, My CV, Contact
- **Context Menu**: Mac-styled with rounded corners and blur background
- **Escape key**: Closes Apple menu, context menu

---

### CSS Implementation

#### Vista Shell (`public/css/vista/shell.css`) — COMPLETE REWRITE
- Aero glass taskbar: translucent blue gradient + backdrop-filter blur(12px)
- Green Start orb with radial gradient, hover glow, active press state, and flag glyph
- Quick launch bar with separator
- Taskbar window buttons: glass style, active/minimized states
- System tray with icon spacing and time display
- Start menu: frosted glass, two-column layout, slide-up animation
- Desktop icon grid with blue glow hover and selection highlight
- Context menu with blur background and blue gradient hover bars

#### Vista Window Chrome (`public/css/vista/window.css`) — COMPLETE REWRITE
- Aero glass frame: reduced opacity (0.72) with backdrop-filter for authentic see-through
- Title bar: translucent gradient with midpoint split at 49/50%
- Active window: blue border glow (`0 0 12px rgba(70,140,220,0.25)`)
- Inactive window: desaturated grey title bar and border
- Control buttons: minimize (line), maximize (box), close (red gradient with X)
- 8-directional resize handles with correct cursor states
- Animations: minimize (scale down + slide), restore (reverse), close (fade + shrink)
- `pointer-events: none` during animations to prevent state corruption

#### Mac Shell (`public/css/mac/shell.css`) — COMPLETE REWRITE
- Aurora wallpaper: multi-layer gradient with purple and teal radial overlays
- Frosted glass menu bar: 22px height, blur(20px) + saturate(1.5), z-index 9100
- Menu item hover: blue gradient pill (`#4A90D9` → `#2968C8`)
- Leopard dock shelf: flat bottom (`border-radius: 5px 5px 0 0`), glass gradient
- Dock icons: 40px emoji, `will-change: transform`, 0.08s transition for smooth magnification
- Running indicator dots: bright white with double glow
- CSS tooltips via `data-label` attribute (avoids native tooltip conflict)
- Bounce animation: 3 bounces, -30px jump, 0.6s duration
- Apple menu dropdown: positioned below menu bar, blur background, gradient hover
- Desktop icons: right-aligned, Finder-style column layout
- Context menu: translucent (0.88 opacity), rounded corners, gradient hover

#### Mac Window Chrome (`public/css/mac/window.css`) — COMPLETE REWRITE
- Brushed metal frame: `border-radius: 5px 5px 0 0` (square bottom, Leopard-accurate)
- Title bar: gradient with hard ridge at 50/51% for metallic effect
- Traffic light buttons: 12px circles, 6px gap
  - Close: `#FF5F57` → `#E8433A` red gradient
  - Minimize: `#FFBD2E` → `#E09E14` yellow gradient
  - Maximize: `#28C840` → `#12A726` green gradient with **+** symbol (corrected from box)
  - Symbols hidden until hovering the traffic-lights group
  - Inactive: all buttons grey, symbols permanently hidden
- Title text: centered, bold (700), embossed with white text-shadow
- Genie minimize animation: 0.5s (corrected from 0.4s to match timer)
- `pointer-events: none` during minimize/close animations

#### Components (`public/css/vista/components.css`, `public/css/mac/components.css`)
- Vista: gradient buttons with primary variant, styled scrollbars
- Mac: Aqua-style buttons with pulsing default animation, styled scrollbars

---

### Bug Fixes

| Bug | Severity | Fix |
|-----|----------|-----|
| Mac users permanently trapped (no Shut Down) | Critical | Added Apple menu dropdown with Shut Down/Restart |
| Windows draggable off-screen (unrecoverable) | Critical | Boundary clamping: min 100px visible, min-top respects menu bar |
| `window-inactive` class never applied | Critical | Focus handler now adds `window-inactive` to previous window |
| Adapters crash if WindowManager missing | Critical | Null guards in both `openApp()` methods |
| Minimize/restore race condition | Critical | Timer stored on state, cleared on restore |
| Clicks during animations cause state corruption | High | `pointer-events: none` on minimizing/closing animations |
| Z-index could surpass taskbar (after 8900+ windows) | High | Capped at 8999 |
| localStorage auto-boot trap | High | Changed to pre-highlight only, no auto-boot |
| Keyboard listener leak from OS selector | High | Handler stored and removed on OS selection |
| System clock interval never cleared | Medium | Stored as `_clockInterval`, cleared before re-create |
| Dock tooltip double-display | Medium | Changed `title` to `data-label`, CSS reads `attr(data-label)` |
| Mac minimize timer mismatch (300ms vs 400ms animation) | Medium | Aligned to 400ms |
| No drag cursor feedback | Low | `cursor: move` applied during drag |
| Orphaned listeners on close-during-drag | Low | `mouseup` dispatched before close animation |

---

### Accessibility Improvements

| Element | Before | After |
|---------|--------|-------|
| Starfield canvas | Announced by screen readers | `aria-hidden="true"` |
| Boot loader | Silent during boot | `role="alert" aria-live="assertive"` |
| Windows | No semantic meaning | `role="dialog" aria-label="[title]"` |
| Vista taskbar | No landmark | `role="toolbar" aria-label="Taskbar"` |
| Mac menu bar | No landmark | `role="menubar" aria-label="Menu bar"` |
| Mac dock | No landmark | `role="toolbar" aria-label="Dock"` |
| System tray icons | `title` only | Added `aria-label` + `role="img"` |
| System time | Unlabeled | `aria-label="System time" role="timer"` |
| Escape key | No effect | Closes active window, start menu, context menus, Apple menu |

---

### Architecture

```
User selects OS
  → OSSelector emits to BootLoader
    → Boot completes → BootLoader.showDesktop()
      → Adapter.init() sets up shell (taskbar/dock, icons, menus)
      → WindowManager.init() prepares window container
        → User interacts with icons/dock/start menu
          → Adapter calls WindowManager.createWindow()
            → WindowManager emits 'window:created' via EventBus
              → Adapter listens, updates taskbar/dock indicators
```

**Module communication**: EventBus pub/sub (not direct `window.*` calls)
**Window lifecycle**: create → focus → drag/resize → minimize/maximize → close
**Single-instance enforcement**: `getWindowByApp()` check before creating

---

### Files Changed

| File | Status | Lines |
|------|--------|-------|
| `public/js/core/event-bus.js` | NEW | 93 |
| `public/js/core/window-manager.js` | Rewritten | 521 |
| `public/js/adapters/vista-adapter.js` | Rewritten | 406 |
| `public/js/adapters/mac-adapter.js` | Rewritten | 380 |
| `public/css/vista/shell.css` | Rewritten | 465 |
| `public/css/vista/window.css` | Rewritten | 293 |
| `public/css/mac/shell.css` | Rewritten | 396 |
| `public/css/mac/window.css` | Rewritten | 356 |
| `public/css/vista/components.css` | Rewritten | 67 |
| `public/css/mac/components.css` | Rewritten | 76 |
| `public/js/core/os-selector.js` | Modified | +15 -8 |
| `public/js/core/boot-loader.js` | Modified | +7 -2 |
| `public/js/main.js` | Modified | +11 |
| `index.html` | Modified | +67 -12 |

---

### What's Next (Phase 3)

- **Portfolio app content**: About Me (Welcome Center / About This Mac), Projects (Explorer / Cover Flow), CV (WordPad / Preview), Contact (Windows Mail / Mail.app)
- **ES module migration**: Convert IIFEs to ES modules to leverage Vite bundling
- **Games**: Pac-Man and Chess as embedded canvas apps
- **Responsive design**: Mobile breakpoints with card-based window layout
- **Sound effects**: Boot sounds, window open/close, Start menu

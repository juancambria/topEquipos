document.addEventListener('DOMContentLoaded', () => {
    const isEmbeddedWindow = document.body.classList.contains('window-embedded');
    if (isEmbeddedWindow && !window.__embeddedWindowPatched) {
        window.__embeddedWindowPatched = true;

        const ensureEmbeddedParam = formEl => {
            if (!(formEl instanceof HTMLFormElement)) {
                return;
            }

            let windowInput = formEl.querySelector('input[name="window"]');
            if (!windowInput) {
                windowInput = document.createElement('input');
                windowInput.type = 'hidden';
                windowInput.name = 'window';
                formEl.appendChild(windowInput);
            }
            windowInput.value = '1';
        };

        document.querySelectorAll('form').forEach(ensureEmbeddedParam);
        document.addEventListener('submit', event => {
            ensureEmbeddedParam(event.target);
        }, true);

        const nativeSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function() {
            ensureEmbeddedParam(this);
            return nativeSubmit.call(this);
        };

        /**
         * Sin ?window=1, una navegación dentro del iframe carga el layout completo (shell + escritorio)
         * y se ve la aplicación duplicada. Misma idea que ensureEmbeddedParam en formularios.
         */
        document.addEventListener(
            'click',
            event => {
                if (event.defaultPrevented) {
                    return;
                }
                const anchor = event.target.closest('a[href]');
                if (!anchor) {
                    return;
                }
                if (anchor.dataset.skipEmbeddedWindow === 'true') {
                    return;
                }
                if (anchor.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                }
                const hrefAttr = anchor.getAttribute('href');
                if (!hrefAttr || hrefAttr.startsWith('#') || hrefAttr.toLowerCase().startsWith('javascript:')) {
                    return;
                }
                let url;
                try {
                    url = new URL(anchor.href);
                } catch {
                    return;
                }
                if (url.origin !== window.location.origin) {
                    return;
                }
                if (!/^https?:$/i.test(url.protocol)) {
                    return;
                }
                if (url.searchParams.get('window') === '1') {
                    return;
                }
                url.searchParams.set('window', '1');
                event.preventDefault();
                window.location.assign(url.pathname + url.search + url.hash);
            },
            true
        );
    }

    const links = document.querySelectorAll('.app-nav-link, .app-menu-panel a');
    const shortcutLinks = document.querySelectorAll('.topbar-shortcut');
    const menuToggles = document.querySelectorAll('.app-menu-toggle');
    const currentUrl = window.location.href;

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentUrl.includes(href) || (currentUrl.includes('/dashboard') && href.includes('/dashboard')))) {
            link.classList.add('sidebar-link-open');
        }
    });

    const desktop = document.getElementById('desktopArea');
    const taskbarWindows = document.getElementById('taskbarWindows');

    if (!desktop || !taskbarWindows) {
        return;
    }

    const isHomeDesktop = desktop.dataset.isHome === 'true';

    let zIndex = 20;
    let cascadeIndex = 0;
    let currentWindowId = 0;
    let activeModalWindowId = null;
    const windows = new Map();

    const closeMenus = () => {
        document.querySelectorAll('.app-menu.is-open').forEach(menu => {
            menu.classList.remove('is-open');
        });
    };

    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', event => {
            event.preventDefault();
            if (activeModalWindowId !== null) {
                return;
            }

            const menu = toggle.closest('.app-menu');
            const isOpen = menu.classList.contains('is-open');
            closeMenus();
            if (!isOpen) {
                menu.classList.add('is-open');
            }
        });
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('.app-menu')) {
            closeMenus();
        }
    });

    const createWindowId = () => `app-window-${++currentWindowId}`;

    const normalizeUrl = url => {
        try {
            const parsedUrl = new URL(url, window.location.origin);
            parsedUrl.searchParams.delete('window');
            return parsedUrl.pathname;
        } catch {
            return url;
        }
    };

    const buildEmbeddedUrl = url => {
        const parsedUrl = new URL(url, window.location.origin);
        parsedUrl.searchParams.set('window', '1');
        return `${parsedUrl.pathname}${parsedUrl.search}`;
    };

    const nextWindowBounds = () => {
        const offset = cascadeIndex % 8;
        cascadeIndex += 1;

        const width = Math.max(720, Math.min(1120, desktop.clientWidth - 120));
        const height = Math.max(420, Math.min(760, desktop.clientHeight - 90));

        return {
            width,
            height,
            left: 24 + (offset * 28),
            top: 24 + (offset * 24),
        };
    };

    const applyBounds = (windowEl, bounds) => {
        windowEl.style.left = `${bounds.left}px`;
        windowEl.style.top = `${bounds.top}px`;
        windowEl.style.width = `${bounds.width}px`;
        windowEl.style.height = `${bounds.height}px`;
    };

    const updateWindowDensity = windowEl => {
        const width = windowEl.offsetWidth;
        windowEl.classList.toggle('is-compact', width < 980);
        windowEl.classList.toggle('is-tight', width < 760);
    };

    const captureBounds = windowEl => ({
        left: windowEl.offsetLeft,
        top: windowEl.offsetTop,
        width: windowEl.offsetWidth,
        height: windowEl.offsetHeight,
    });

    const isInteractionBlocked = windowEl =>
        activeModalWindowId !== null && activeModalWindowId !== windowEl.dataset.windowId;

    const areWindowControlsBlocked = () => activeModalWindowId !== null;

    const syncDesktopLockState = () => {
        const hasModalLock = activeModalWindowId !== null;
        document.body.classList.toggle('has-modal-lock', hasModalLock);
        desktop.classList.toggle('has-modal-lock', hasModalLock);

        windows.forEach(({ windowEl }) => {
            const isLockedOwner = hasModalLock && windowEl.dataset.windowId === activeModalWindowId;
            const isBlocked = hasModalLock && !isLockedOwner;
            windowEl.classList.toggle('has-modal-lock', isLockedOwner);
            windowEl.classList.toggle('is-blocked-by-modal', isBlocked);

            windowEl.querySelectorAll('.window-btn').forEach(button => {
                button.disabled = hasModalLock;
            });
            const resizeHandle = windowEl.querySelector('.window-resize-handle');
            if (resizeHandle) {
                resizeHandle.disabled = hasModalLock;
            }
        });
    };

    const setMaximizedState = (windowEl, shouldMaximize, { rememberBounds = true } = {}) => {
        if (!windowEl) {
            return;
        }

        if (shouldMaximize) {
            if (rememberBounds && windowEl.dataset.maximized !== 'true') {
                windowEl.dataset.previousBounds = JSON.stringify(captureBounds(windowEl));
            }

            windowEl.dataset.maximized = 'true';
            windowEl.dataset.state = 'normal';
            windowEl.classList.remove('is-minimized');
            windowEl.classList.add('is-maximized');
            applyBounds(windowEl, {
                left: 12,
                top: 12,
                width: desktop.clientWidth - 24,
                height: desktop.clientHeight - 24,
            });
            updateWindowDensity(windowEl);
            return;
        }

        windowEl.dataset.maximized = 'false';
        windowEl.dataset.state = 'normal';
        windowEl.classList.remove('is-minimized');
        windowEl.classList.remove('is-maximized');

        const previousBounds = windowEl.dataset.previousBounds;
        if (previousBounds) {
            applyBounds(windowEl, JSON.parse(previousBounds));
        }
        updateWindowDensity(windowEl);
    };

    const hasOpenModal = doc => {
        if (!doc) {
            return false;
        }

        const candidates = doc.querySelectorAll('.modal-overlay, .modal-antiguo, .modal');
        return [...candidates].some(element => {
            const computed = doc.defaultView?.getComputedStyle(element);
            const isVisible = computed && computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0';
            const isAriaOpen = element.getAttribute('aria-hidden') === 'false';
            const isExplicitlyShown = element.classList.contains('show') && !element.classList.contains('modal-oculto');
            return isVisible || isAriaOpen || isExplicitlyShown;
        });
    };

    const unlockModalFlow = windowEl => {
        if (!windowEl || activeModalWindowId !== windowEl.dataset.windowId) {
            return;
        }

        activeModalWindowId = null;
        if (windowEl.dataset.modalAutoMaximized === 'true') {
            setMaximizedState(windowEl, false, { rememberBounds: false });
        }
        windowEl.dataset.modalAutoMaximized = 'false';
        syncDesktopLockState();
        bringToFront(windowEl);
    };

    const lockModalFlow = windowEl => {
        if (!windowEl || activeModalWindowId === windowEl.dataset.windowId) {
            syncDesktopLockState();
            return;
        }

        activeModalWindowId = windowEl.dataset.windowId;
        const shouldRestoreSize = windowEl.dataset.maximized !== 'true';
        windowEl.dataset.modalAutoMaximized = shouldRestoreSize ? 'true' : 'false';

        if (shouldRestoreSize) {
            setMaximizedState(windowEl, true, { rememberBounds: true });
        }

        bringToFront(windowEl);
        syncDesktopLockState();
    };

    const evaluateModalState = windowEl => {
        const windowData = windows.get(windowEl.dataset.windowId);
        if (!windowData) {
            return;
        }

        const modalOpen = hasOpenModal(windowData.modalDocument);
        if (modalOpen) {
            lockModalFlow(windowEl);
            return;
        }

        unlockModalFlow(windowEl);
    };

    const watchModalState = (windowEl, modalDocument) => {
        const windowData = windows.get(windowEl.dataset.windowId);
        if (!windowData || !modalDocument?.body) {
            return;
        }

        windowData.modalDocument = modalDocument;
        windowData.modalObserver?.disconnect();

        const observer = new MutationObserver(() => evaluateModalState(windowEl));
        observer.observe(modalDocument.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'aria-hidden'],
        });

        windowData.modalObserver = observer;
        evaluateModalState(windowEl);
    };

    const updateTaskbarState = activeId => {
        windows.forEach(({ taskbarButton, windowEl }) => {
            const isActive = windowEl.dataset.state !== 'minimized' && windowEl.dataset.windowId === activeId;
            taskbarButton.classList.toggle('is-active', isActive);
            taskbarButton.classList.toggle('is-minimized', windowEl.dataset.state === 'minimized');
        });
    };

    const bringToFront = windowEl => {
        if (!windowEl || windowEl.dataset.state === 'closed' || isInteractionBlocked(windowEl)) {
            return;
        }

        zIndex += 1;
        windowEl.style.zIndex = String(zIndex);
        desktop.querySelectorAll('.app-window').forEach(otherWindow => {
            otherWindow.classList.toggle('is-focused', otherWindow === windowEl);
        });
        updateTaskbarState(windowEl.dataset.windowId);
    };

    /**
     * Tras cerrar/minimizar otra ventana (o cambiar cuál tiene el foco), el foco del teclado
     * debe quedar dentro de la página embebida (iframe), no en el escritorio padre sin ruta Tab.
     */
    const focusEmbeddedWindowContent = windowEl => {
        if (!windowEl) {
            return;
        }

        const frame = windowEl.querySelector('iframe.window-frame');
        if (!frame?.contentWindow) {
            const inlinePage = windowEl.querySelector('.embedded-page');
            if (inlinePage) {
                window.requestAnimationFrame(() => {
                    const first =
                        inlinePage.querySelector(
                            '#searchInput, #buscar, [data-window-autofocus], input.input-buscar, input[type="search"]'
                        ) || inlinePage.querySelector('button:not([disabled]), a[href], input:not([disabled])');
                    first?.focus();
                });
            }
            return;
        }

        window.requestAnimationFrame(() => {
            try {
                frame.focus();
                const apply = frame.contentWindow.__applyEmbeddedInitialFocus;
                if (typeof apply === 'function') {
                    apply(true);
                }
            } catch (error) {
                console.debug('No se pudo enfocar el contenido embebido.', error);
            }
        });
    };

    const restoreWindow = windowEl => {
        if (!windowEl) {
            return;
        }

        windowEl.dataset.state = 'normal';
        windowEl.classList.remove('is-minimized');

        if (windowEl.dataset.maximized === 'true') {
            setMaximizedState(windowEl, true, { rememberBounds: false });
        } else {
            const previousBounds = windowEl.dataset.previousBounds;
            if (previousBounds) {
                applyBounds(windowEl, JSON.parse(previousBounds));
            }
        }

        bringToFront(windowEl);
        updateWindowDensity(windowEl);
        focusEmbeddedWindowContent(windowEl);
    };

    const minimizeWindow = windowEl => {
        if (areWindowControlsBlocked()) {
            return;
        }

        windowEl.dataset.state = 'minimized';
        windowEl.classList.remove('is-focused');
        windowEl.classList.add('is-minimized');

        const visibleWindows = [...windows.values()]
            .map(item => item.windowEl)
            .filter(item => item !== windowEl && item.dataset.state !== 'minimized' && item.dataset.state !== 'closed');

        const nextFocused = visibleWindows.sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
        updateTaskbarState(nextFocused ? nextFocused.dataset.windowId : '');

        if (nextFocused) {
            bringToFront(nextFocused);
            focusEmbeddedWindowContent(nextFocused);
        }
    };

    const toggleMaximize = windowEl => {
        if (areWindowControlsBlocked()) {
            return;
        }

        const isMaximized = windowEl.dataset.maximized === 'true';

        if (isMaximized) {
            setMaximizedState(windowEl, false, { rememberBounds: false });
            bringToFront(windowEl);
            return;
        }

        setMaximizedState(windowEl, true, { rememberBounds: true });
        bringToFront(windowEl);
    };

    const closeWindow = windowEl => {
        if (areWindowControlsBlocked()) {
            return;
        }

        const { taskbarButton, routeKey } = windows.get(windowEl.dataset.windowId) || {};

        if (routeKey) {
            const sidebarLink = document.querySelector(`.sidebar a[data-route-key="${routeKey}"]`);
            if (sidebarLink) {
                sidebarLink.classList.remove('sidebar-link-open');
            }
        }

        taskbarButton?.remove();
        windows.get(windowEl.dataset.windowId)?.modalObserver?.disconnect();
        windows.delete(windowEl.dataset.windowId);
        windowEl.dataset.state = 'closed';
        windowEl.remove();

        const topWindow = [...windows.values()]
            .map(item => item.windowEl)
            .filter(item => item.dataset.state !== 'minimized' && item.dataset.state !== 'closed')
            .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];

        if (topWindow) {
            bringToFront(topWindow);
            focusEmbeddedWindowContent(topWindow);
        }
    };

    const createTaskbarButton = (windowId, title) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'taskbar-item';
        button.dataset.windowId = windowId;
        button.innerHTML = `<span class="taskbar-item-label">${title}</span>`;
        taskbarWindows.appendChild(button);
        return button;
    };

    const setupDragging = (windowEl, handle) => {
        handle.addEventListener('pointerdown', event => {
            if (event.target.closest('.window-actions') || windowEl.dataset.maximized === 'true' || areWindowControlsBlocked()) {
                return;
            }

            event.preventDefault();
            bringToFront(windowEl);

            const rect = windowEl.getBoundingClientRect();
            const desktopRect = desktop.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            const onMove = moveEvent => {
                const maxLeft = desktop.clientWidth - windowEl.offsetWidth;
                const maxTop = desktop.clientHeight - windowEl.offsetHeight;
                const left = Math.min(Math.max(moveEvent.clientX - desktopRect.left - offsetX, 0), Math.max(maxLeft, 0));
                const top = Math.min(Math.max(moveEvent.clientY - desktopRect.top - offsetY, 0), Math.max(maxTop, 0));

                windowEl.style.left = `${left}px`;
                windowEl.style.top = `${top}px`;
                windowEl.dataset.previousBounds = JSON.stringify({
                    left,
                    top,
                    width: windowEl.offsetWidth,
                    height: windowEl.offsetHeight,
                });
                updateWindowDensity(windowEl);
            };

            const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        });
    };

    const setupResize = (windowEl, handle) => {
        handle.addEventListener('pointerdown', event => {
            if (windowEl.dataset.maximized === 'true' || areWindowControlsBlocked()) {
                return;
            }

            event.preventDefault();
            bringToFront(windowEl);

            const pointerId = event.pointerId;
            try {
                handle.setPointerCapture(pointerId);
            } catch {
                /* noop: seguimos con listeners en el handle */
            }

            const startX = event.clientX;
            const startY = event.clientY;
            const startWidth = windowEl.offsetWidth;
            const startHeight = windowEl.offsetHeight;
            const startLeft = windowEl.offsetLeft;
            const startTop = windowEl.offsetTop;
            let frameRequest = null;
            let pendingWidth = startWidth;
            let pendingHeight = startHeight;
            let ended = false;

            windowEl.classList.add('is-resizing');

            const onMove = moveEvent => {
                if (moveEvent.pointerId !== pointerId) {
                    return;
                }

                pendingWidth = Math.max(520, Math.min(startWidth + (moveEvent.clientX - startX), desktop.clientWidth - startLeft));
                pendingHeight = Math.max(320, Math.min(startHeight + (moveEvent.clientY - startY), desktop.clientHeight - startTop));

                if (frameRequest !== null) {
                    return;
                }

                frameRequest = window.requestAnimationFrame(() => {
                    windowEl.style.width = `${pendingWidth}px`;
                    windowEl.style.height = `${pendingHeight}px`;
                    windowEl.dataset.previousBounds = JSON.stringify({
                        left: startLeft,
                        top: startTop,
                        width: pendingWidth,
                        height: pendingHeight,
                    });
                    updateWindowDensity(windowEl);
                    frameRequest = null;
                });
            };

            const endResize = () => {
                if (ended) {
                    return;
                }
                ended = true;

                if (frameRequest !== null) {
                    window.cancelAnimationFrame(frameRequest);
                    frameRequest = null;
                }

                windowEl.style.width = `${pendingWidth}px`;
                windowEl.style.height = `${pendingHeight}px`;
                windowEl.dataset.previousBounds = JSON.stringify({
                    left: startLeft,
                    top: startTop,
                    width: pendingWidth,
                    height: pendingHeight,
                });
                windowEl.classList.remove('is-resizing');
                updateWindowDensity(windowEl);
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
                handle.removeEventListener('pointercancel', onUp);
                try {
                    if (handle.hasPointerCapture(pointerId)) {
                        handle.releasePointerCapture(pointerId);
                    }
                } catch {
                    /* noop */
                }
            };

            const onUp = upEvent => {
                if (upEvent.pointerId !== pointerId) {
                    return;
                }
                endResize();
            };

            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
            handle.addEventListener('pointercancel', onUp);
        });
    };

    const buildWindow = ({ title, routeKey, contentNode, iframeUrl }) => {
        const windowId = createWindowId();
        const bounds = nextWindowBounds();
        const windowEl = document.createElement('article');
        windowEl.className = 'app-window';
        windowEl.dataset.windowId = windowId;
        windowEl.dataset.routeKey = routeKey || '';
        windowEl.dataset.state = 'normal';
        windowEl.dataset.maximized = 'false';
        windowEl.dataset.previousBounds = JSON.stringify(bounds);
        applyBounds(windowEl, bounds);

        const titlebar = document.createElement('div');
        titlebar.className = 'window-titlebar';
        titlebar.innerHTML = `
            <div class="window-title">${title}</div>
            <div class="window-actions">
                <button type="button" class="window-btn" data-action="minimize" aria-label="Minimizar">_</button>
                <button type="button" class="window-btn" data-action="maximize" aria-label="Maximizar">□</button>
                <button type="button" class="window-btn is-close" data-action="close" aria-label="Cerrar">×</button>
            </div>
        `;

        const body = document.createElement('div');
        body.className = 'window-body';

        if (contentNode) {
            contentNode.classList.add('window-page-content');
            body.appendChild(contentNode);
        } else if (iframeUrl) {
            const frame = document.createElement('iframe');
            frame.className = 'window-frame';
            frame.src = buildEmbeddedUrl(iframeUrl);
            frame.setAttribute('title', title);
            frame.addEventListener('load', () => {
                try {
                    const frameTitle = frame.contentDocument?.querySelector('h1')?.textContent?.trim();
                    const nextTitle = frameTitle || frame.contentDocument?.title || title;
                    const titleNode = titlebar.querySelector('.window-title');
                    const taskbarLabel = taskbarButton.querySelector('.taskbar-item-label');

                    titleNode.textContent = nextTitle;
                    taskbarLabel.textContent = nextTitle;
                    watchModalState(windowEl, frame.contentDocument);
                } catch (error) {
                    console.debug('No se pudo leer el título de la ventana embebida.', error);
                }
            });
            body.appendChild(frame);
        }

        const resizeHandle = document.createElement('button');
        resizeHandle.type = 'button';
        resizeHandle.className = 'window-resize-handle';
        resizeHandle.setAttribute('aria-label', 'Redimensionar ventana');

        windowEl.appendChild(titlebar);
        windowEl.appendChild(body);
        windowEl.appendChild(resizeHandle);
        desktop.appendChild(windowEl);

        const taskbarButton = createTaskbarButton(windowId, title);
        windows.set(windowId, { windowEl, taskbarButton, routeKey, modalDocument: null, modalObserver: null });
        updateWindowDensity(windowEl);
        if (contentNode) {
            watchModalState(windowEl, document);
        }

        windowEl.addEventListener('pointerdown', () => bringToFront(windowEl));
        setupDragging(windowEl, titlebar);
        setupResize(windowEl, resizeHandle);

        titlebar.querySelector('[data-action="minimize"]').addEventListener('click', () => minimizeWindow(windowEl));
        titlebar.querySelector('[data-action="maximize"]').addEventListener('click', () => toggleMaximize(windowEl));
        titlebar.querySelector('[data-action="close"]').addEventListener('click', () => closeWindow(windowEl));
        titlebar.addEventListener('dblclick', event => {
            if (!event.target.closest('.window-actions')) {
                toggleMaximize(windowEl);
            }
        });

        taskbarButton.addEventListener('click', () => {
            if (activeModalWindowId !== null) {
                return;
            }

            if (windowEl.dataset.state === 'minimized') {
                restoreWindow(windowEl);
                return;
            }

            const focused = taskbarButton.classList.contains('is-active');
            if (focused) {
                minimizeWindow(windowEl);
                return;
            }

            bringToFront(windowEl);
            focusEmbeddedWindowContent(windowEl);
        });

        setMaximizedState(windowEl, true, { rememberBounds: true });
        bringToFront(windowEl);
        focusEmbeddedWindowContent(windowEl);
        return windowEl;
    };

    const existingRoot = [...desktop.children].find(child => !child.classList.contains('desktop-placeholder'));
    if (existingRoot && !isHomeDesktop) {
        const pageTitle = existingRoot.querySelector('h1')?.textContent?.trim() || document.title || 'Ventana';
        buildWindow({
            title: pageTitle,
            routeKey: normalizeUrl(window.location.href),
            contentNode: existingRoot,
        });
    }

    const interactiveLinks = [...links, ...shortcutLinks];

    const openRouteInWindow = link => {
        const routeKey = normalizeUrl(link.href);
        link.dataset.routeKey = routeKey;

        const existingWindow = [...windows.values()].find(item => item.routeKey === routeKey)?.windowEl;
        if (existingWindow) {
            if (existingWindow.dataset.state === 'minimized') {
                restoreWindow(existingWindow);
            } else {
                bringToFront(existingWindow);
                focusEmbeddedWindowContent(existingWindow);
            }
            return;
        }

        link.classList.add('sidebar-link-open');
        buildWindow({
            title: link.textContent.trim(),
            routeKey,
            iframeUrl: link.href,
        });
    };

    interactiveLinks.forEach(link => {
        link.addEventListener('click', event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const isHomeLink = link.dataset.homeLink === 'true' || normalizeUrl(link.href) === '/dashboard';
            if (isHomeLink) {
                return;
            }

            event.preventDefault();
            if (activeModalWindowId !== null) {
                return;
            }

            closeMenus();
            openRouteInWindow(link);
        });
    });

    window.addEventListener('resize', () => {
        windows.forEach(({ windowEl }) => {
            if (windowEl.dataset.maximized === 'true') {
                setMaximizedState(windowEl, true, { rememberBounds: false });
                return;
            }

            const maxLeft = Math.max(desktop.clientWidth - windowEl.offsetWidth, 0);
            const maxTop = Math.max(desktop.clientHeight - windowEl.offsetHeight, 0);
            const left = Math.min(windowEl.offsetLeft, maxLeft);
            const top = Math.min(windowEl.offsetTop, maxTop);
            windowEl.style.left = `${left}px`;
            windowEl.style.top = `${top}px`;
            updateWindowDensity(windowEl);
        });
    });

    /**
     * Abre una ruta en una ventana del escritorio (iframe embebido), sin nueva pestaña del navegador.
     * Uso: openAppWindow({ title: 'Texto en barra de título', url: '/ruta' o URL absoluta })
     */
    window.openAppWindow = function({ title, url }) {
        if (!url) {
            return null;
        }
        if (activeModalWindowId !== null) {
            if (typeof mostrarToast === 'function') {
                mostrarToast('Cerrá el modal abierto para usar otra ventana.', 'error');
            }
            return null;
        }
        const absUrl = new URL(url, window.location.origin).href;
        const routeKey = normalizeUrl(absUrl);
        const existing = [...windows.values()].find(item => item.routeKey === routeKey)?.windowEl;
        if (existing) {
            if (existing.dataset.state === 'minimized') {
                restoreWindow(existing);
            } else {
                bringToFront(existing);
                focusEmbeddedWindowContent(existing);
            }
            return existing;
        }
        return buildWindow({
            title: title || 'Ventana',
            routeKey,
            iframeUrl: absUrl,
        });
    };
});

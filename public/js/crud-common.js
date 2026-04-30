(function() {
    'use strict';

    function getCsrfToken() {
        var token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : '';
    }

    /** Cabeceras típicas para fetch JSON (Accept + X-CSRF-TOKEN si existe). */
    function jsonHeaders(extra) {
        var h = Object.assign({ 'Accept': 'application/json' }, extra || {});
        var t = getCsrfToken();
        if (t) {
            h['X-CSRF-TOKEN'] = t;
        }
        return h;
    }

    /**
     * Parsea el cuerpo de una respuesta como JSON. Cuerpo vacío → null.
     * Texto no vacío e inválido → Error('Respuesta inválida del servidor') como en los formularios legacy.
     */
    function parseResponseJsonText(text) {
        var raw = text == null ? '' : String(text);
        var trimmed = raw.trim();
        if (!trimmed) {
            return null;
        }
        try {
            return JSON.parse(trimmed);
        } catch (parseErr) {
            var err = new Error('Respuesta inválida del servidor');
            err.rawText = raw;
            throw err;
        }
    }

    function responseJson(response) {
        return response.text().then(function(text) {
            return parseResponseJsonText(text);
        });
    }

    function initSearchInput(options) {
        var settings = Object.assign({
            selector: '#searchInput',
            param: 'search',
            delay: 500,
        }, options || {});

        var input = document.querySelector(settings.selector);
        if (!input) return;

        var timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                var url = new URL(window.location.href);
                url.searchParams.set(settings.param, input.value.trim());
                window.location.href = url.toString();
            }, settings.delay);
        });
    }

    function initSortableHeaders(selector) {
        document.querySelectorAll(selector).forEach(function(th) {
            th.addEventListener('click', function() {
                var column = th.dataset.column;
                var currentOrder = th.dataset.order;
                var newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
                var url = new URL(window.location.href);
                url.searchParams.set('column', column);
                url.searchParams.set('order', newOrder);
                window.location.href = url.toString();
            });
            th.style.cursor = 'pointer';
            th.title = 'Click para ordenar';
        });
    }

    function submitHiddenPost(action, extraFields) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = action;

        var tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = '_token';
        tokenInput.value = getCsrfToken();
        form.appendChild(tokenInput);

        Object.keys(extraFields || {}).forEach(function(name) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = extraFields[name];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }

    function isTypingFocusContext(el) {
        if (!el || el.nodeType !== 1) return false;
        var tag = el.tagName;
        if (tag === 'TEXTAREA') return true;
        if (tag === 'SELECT') return true;
        if (tag === 'INPUT') {
            var t = (el.type || '').toLowerCase();
            if (t === 'checkbox' || t === 'radio' || t === 'button' || t === 'submit' || t === 'reset' || t === 'file' || t === 'range' || t === 'color') {
                return false;
            }
            return true;
        }
        return el.isContentEditable;
    }

    function isInsideVisibleModal(el) {
        if (!el || !el.closest) return false;
        var modal = el.closest('.modal-overlay, .modal-antiguo, .modal, .modal-confirmacion-overlay');
        if (!modal) return false;
        if (modal.classList.contains('modal-confirmacion-overlay')) {
            return modal.classList.contains('activo');
        }
        if (modal.getAttribute('aria-hidden') === 'true') return false;
        if (modal.classList.contains('modal-oculto')) return false;
        var s = window.getComputedStyle(modal);
        return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity || '1') !== 0;
    }

    function bindArrowRowNavigation(options) {
        var settings = Object.assign({
            rowSelector: '',
            getSelectedRow: function() { return null; },
            onSelectRow: function() {},
        }, options || {});

        if (!settings.rowSelector) return;

        bindArrowRowNavigation._seen = bindArrowRowNavigation._seen || {};
        if (bindArrowRowNavigation._seen[settings.rowSelector]) return;
        bindArrowRowNavigation._seen[settings.rowSelector] = true;

        function allRows() {
            return Array.prototype.slice.call(document.querySelectorAll(settings.rowSelector));
        }

        document.addEventListener('keydown', function(e) {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            var ae = document.activeElement;
            if (isTypingFocusContext(ae)) return;
            if (isInsideVisibleModal(ae)) return;

            var rows = allRows();
            if (!rows.length) return;

            e.preventDefault();
            var current = settings.getSelectedRow();
            var idx = current && rows.indexOf(current) !== -1 ? rows.indexOf(current) : -1;

            if (e.key === 'ArrowDown') {
                if (idx < rows.length - 1) {
                    idx++;
                } else if (idx === -1) {
                    idx = 0;
                }
            } else {
                if (idx > 0) {
                    idx--;
                } else if (idx === -1) {
                    idx = rows.length - 1;
                }
            }

            var row = rows[idx];
            if (!row) return;
            settings.onSelectRow(row);
            row.focus();
            row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }, true);
    }

    function createRowSelection(options) {
        var settings = Object.assign({
            rowSelector: '',
            ignoreSelector: '.td-acciones',
            outsideIgnoreSelectors: [],
            selectedClass: 'seleccionado',
            clearOnOutsideClick: true,
            selectedInfo: null,
            formatInfo: null,
            buttons: [],
            onDoubleClick: null,
            arrowKeys: true,
        }, options || {});

        var selectedRow = null;

        function allRows() {
            return Array.prototype.slice.call(document.querySelectorAll(settings.rowSelector));
        }

        function ensureRowTabindex() {
            allRows().forEach(function(row) {
                if (!row.hasAttribute('tabindex')) {
                    row.setAttribute('tabindex', '-1');
                }
            });
        }

        function update() {
            ensureRowTabindex();
            allRows().forEach(function(row) {
                var isSelected = row === selectedRow;
                row.classList.toggle(settings.selectedClass, isSelected);
                row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            });

            settings.buttons.forEach(function(button) {
                if (button) {
                    button.disabled = !selectedRow;
                }
            });

            if (settings.selectedInfo && typeof settings.formatInfo === 'function') {
                settings.selectedInfo.textContent = settings.formatInfo(selectedRow);
            }
        }

        function select(row) {
            selectedRow = selectedRow === row ? null : row;
            update();
            return selectedRow;
        }

        function applyRowSelection(row) {
            selectedRow = row || null;
            update();
        }

        allRows().forEach(function(row) {
            row.addEventListener('click', function(event) {
                if (settings.ignoreSelector && event.target.closest(settings.ignoreSelector)) return;
                select(row);
            });

            if (typeof settings.onDoubleClick === 'function') {
                row.addEventListener('dblclick', function(event) {
                    if (settings.ignoreSelector && event.target.closest(settings.ignoreSelector)) return;
                    settings.onDoubleClick(row, event);
                });
            }
        });

        if (settings.clearOnOutsideClick) {
            document.addEventListener('click', function(event) {
                if (!selectedRow) return;
                if (event.target.closest(settings.rowSelector)) return;
                if (settings.ignoreSelector && event.target.closest(settings.ignoreSelector)) return;
                if (settings.outsideIgnoreSelectors.some(function(selector) {
                    return event.target.closest(selector);
                })) {
                    return;
                }
                selectedRow = null;
                update();
            });
        }

        update();

        if (settings.arrowKeys) {
            bindArrowRowNavigation({
                rowSelector: settings.rowSelector,
                getSelectedRow: function() {
                    return selectedRow;
                },
                onSelectRow: applyRowSelection,
            });
        }

        return {
            getSelectedRow: function() {
                return selectedRow;
            },
            getSelectedId: function() {
                return selectedRow ? selectedRow.dataset.id : null;
            },
            clear: function() {
                selectedRow = null;
                update();
            },
            select: select,
            update: update,
        };
    }

    function confirmSelectedRow(options) {
        var settings = Object.assign({
            getRow: null,
            emptyMessage: 'Selecciona un registro primero',
            alertType: 'alert',
            title: '',
            message: '',
            onConfirm: function() {},
            requireObservacion: false,
        }, options || {});

        var row = settings.getRow ? settings.getRow() : null;
        if (!row) {
            if (settings.alertType === 'toast' && typeof window.mostrarToast === 'function') {
                window.mostrarToast(settings.emptyMessage, 'error');
            } else {
                window.alert(settings.emptyMessage);
            }
            return null;
        }

        window.abrirModalConfirmacion(
            settings.title,
            typeof settings.message === 'function' ? settings.message(row) : settings.message,
            function() {
                settings.onConfirm(row);
            },
            settings.requireObservacion
        );

        return row;
    }

    function bindConfirmForms(selector, options) {
        var settings = Object.assign({
            title: 'Confirmar acción',
            message: function() { return '¿Continuar?'; },
            onConfirm: function(form) { form.submit(); },
            requireObservacion: false,
        }, options || {});

        document.querySelectorAll(selector).forEach(function(form) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                window.abrirModalConfirmacion(
                    settings.title,
                    typeof settings.message === 'function' ? settings.message(form) : settings.message,
                    function() {
                        settings.onConfirm(form);
                    },
                    settings.requireObservacion
                );
            });
        });
    }

    window.CrudCommon = {
        bindArrowRowNavigation: bindArrowRowNavigation,
        bindConfirmForms: bindConfirmForms,
        confirmSelectedRow: confirmSelectedRow,
        createRowSelection: createRowSelection,
        getCsrfToken: getCsrfToken,
        initSearchInput: initSearchInput,
        initSortableHeaders: initSortableHeaders,
        jsonHeaders: jsonHeaders,
        parseResponseJsonText: parseResponseJsonText,
        responseJson: responseJson,
        submitHiddenPost: submitHiddenPost,
    };
})();

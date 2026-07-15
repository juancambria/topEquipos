/**
 * Sistema de notificaciones Toast y Modal de Confirmación
 */

(function() {
    'use strict';

    if (!window.AppLogger) {
        window.AppLogger = {
            view: function(nombreVista) {
                console.log('[APP][VISTA] ' + (nombreVista || 'Sin nombre'));
            },
            success: function(mensaje) {
                console.log('[APP][OK] ' + (mensaje || 'Operacion exitosa'));
            },
            error: function(mensaje) {
                console.error('[APP][ERROR] ' + (mensaje || 'Error'));
            },
            info: function(mensaje) {
                console.log('[APP][INFO] ' + (mensaje || 'Info'));
            }
        };
    }

    // Crear contenedor de toasts
    function crearContenedorToast() {
        if (document.getElementById('toast-container')) return;
        
        var container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Mostrar toast
    window.mostrarToast = function(mensaje, tipo) {
        if (typeof tipo === 'undefined') tipo = 'success';
        
        crearContenedorToast();
        
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + tipo;
        toast.textContent = mensaje;
        
        document.getElementById('toast-container').appendChild(toast);

        if (window.AppLogger) {
            if (tipo === 'error') {
                window.AppLogger.error(mensaje);
            } else if (tipo === 'success') {
                window.AppLogger.success(mensaje);
            } else {
                window.AppLogger.info(mensaje);
            }
        }
        
        // Eliminar después de la animación (3.5 segundos)
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3500);
    };

    /**
     * Ejecuta una acción que destruye/recarga la página (p. ej. location.reload)
     * después de un margen por defecto, para que el toast de éxito sea visible.
     * @param {function(): void} callback
     * @param {number} [delayMs] — si se omite, usa TOAST_MS_ANTES_ACCION_DESTRUCTIVA
     */
    window.TOAST_MS_ANTES_ACCION_DESTRUCTIVA = 2200;
    window.ejecutarTrasToastVisible = function(callback, delayMs) {
        var ms = typeof delayMs === 'number' ? delayMs : (window.TOAST_MS_ANTES_ACCION_DESTRUCTIVA || 2200);
        setTimeout(function() {
            if (typeof callback === 'function') {
                callback();
            }
        }, ms);
    };

    // Modal de confirmación
    var modalConfirmacion = null;
    var callbackConfirmacion = null;

    function obtenerMaxZIndexVisible() {
        var maxZIndex = 100000;
        document.querySelectorAll('body *').forEach(function(el) {
            if (!el || el.id === 'modal-confirmacion-overlay') return;
            var style = window.getComputedStyle(el);
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                parseFloat(style.opacity || '1') === 0 ||
                style.position === 'static'
            ) {
                return;
            }
            var zIndex = parseInt(style.zIndex, 10);
            if (!isNaN(zIndex)) maxZIndex = Math.max(maxZIndex, zIndex);
        });
        return maxZIndex;
    }

    function crearModalConfirmacion() {
        var overlay = document.getElementById('modal-confirmacion-overlay');

        // 🔥 Si no existe, lo creamos
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modal-confirmacion-overlay';
            overlay.className = 'modal-confirmacion-overlay';
            overlay.setAttribute('data-modal-focus', '#modal-confirmacion-confirmar');

            overlay.innerHTML =
                '<div class="modal-confirmacion">' +
                    '<div class="modal-confirmacion-titulo" id="modal-confirmacion-titulo">Confirmar acción</div>' +
                    '<div class="modal-confirmacion-mensaje" id="modal-confirmacion-mensaje"></div>' +
                    '<div class="modal-confirmacion-observacion">' +
                        '<label for="modal-confirmacion-observacion">Observación (obligatoria)</label>' +
                        '<textarea id="modal-confirmacion-observacion" placeholder="Ingrese el motivo..."></textarea>' +
                    '</div>' +
                    '<div class="modal-confirmacion-botones">' +
                        '<button type="button" class="btn btn-cancelar" id="modal-confirmacion-cancelar" aria-keyshortcuts="Alt+C" title="Cancelar (Alt+C)">' +
                            '<span class="modal-btn-accesskey-word">Cancelar</span></button>' +
                        '<button type="button" class="btn btn-confirmar" id="modal-confirmacion-confirmar" aria-keyshortcuts="Alt+G" title="Guardar (Alt+G)">' +
                            '<span class="modal-btn-accesskey-word">Guardar</span></button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);

            // Eventos
            document.getElementById('modal-confirmacion-cancelar')
                .addEventListener('click', cerrarModalConfirmacion);

            function getConfirmCharFromKeyEvent(e) {
                if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return null;
                if (e.key && e.key.length === 1) {
                    return e.key.toLowerCase();
                }
                if (e.code && e.code.indexOf('Key') === 0) {
                    return e.code.slice(3).toLowerCase();
                }
                return null;
            }

            document.addEventListener('keydown', function(e) {
                var overlay = document.getElementById('modal-confirmacion-overlay');
                if (!overlay || !overlay.classList.contains('activo')) return;

                var ch = getConfirmCharFromKeyEvent(e);
                var mode = overlay.getAttribute('data-confirm-mode') || 'save-cancel';
                var isYesNo = mode === 'yes-no';
                var cancelKey = isYesNo ? 'n' : 'c';
                var confirmKey = isYesNo ? 's' : 'g';
                if (ch !== cancelKey && ch !== confirmKey) return;

                e.preventDefault();
                e.stopPropagation();

                if (ch === cancelKey) {
                    cerrarModalConfirmacion();
                    return;
                }

                var confirmarBtn = document.getElementById('modal-confirmacion-confirmar');
                if (!confirmarBtn || confirmarBtn.disabled) return;
                confirmarBtn.click();
            }, true);
        }

        // 🔥 CLAVE TOTAL: SIEMPRE lo mandamos al body
        if (overlay.parentNode !== document.body) {
            document.body.appendChild(overlay);
        }
    }

window.abrirModalConfirmacion = function(titulo, mensaje, callback, requireObservacion, esPeligro) {
        crearModalConfirmacion();

        var overlay = document.getElementById('modal-confirmacion-overlay');

        // 🔥 CLAVE TOTAL: forzarlo al body SIEMPRE
        if (overlay && overlay.parentNode !== document.body) {
            document.body.appendChild(overlay);
        }

        var maxZIndex = obtenerMaxZIndexVisible();
        overlay.style.zIndex = String(maxZIndex + 10);

        if (typeof requireObservacion === 'undefined') {
            requireObservacion = false;
        }
        if (typeof esPeligro === 'undefined') {
            esPeligro = false;
        }

        var mensajeSeguro = mensaje == null ? '' : String(mensaje);
        document.getElementById('modal-confirmacion-titulo').textContent = titulo;
        document.getElementById('modal-confirmacion-mensaje').textContent = mensajeSeguro;

        var obsDiv = document.querySelector('.modal-confirmacion-observacion');
        var confirmarBtn = document.getElementById('modal-confirmacion-confirmar');
        var textarea = document.getElementById('modal-confirmacion-observacion');

        var btnCancelar = document.getElementById('modal-confirmacion-cancelar');
        var btnConfirmar = document.getElementById('modal-confirmacion-confirmar');
        var lblCancelar = btnCancelar ? btnCancelar.querySelector('.modal-btn-accesskey-word') : null;
        var lblConfirmar = btnConfirmar ? btnConfirmar.querySelector('.modal-btn-accesskey-word') : null;
        var usarSiNo = /¿\s*desea\s+continuar\?/i.test(mensajeSeguro);

        if (usarSiNo) {
            overlay.setAttribute('data-confirm-mode', 'yes-no');
            if (btnCancelar) {
                btnCancelar.setAttribute('aria-keyshortcuts', 'Alt+N');
                btnCancelar.setAttribute('title', 'No (Alt+N)');
            }
            if (btnConfirmar) {
                btnConfirmar.setAttribute('aria-keyshortcuts', 'Alt+S');
                btnConfirmar.setAttribute('title', 'Sí (Alt+S)');
            }
            if (lblCancelar) lblCancelar.textContent = 'No';
            if (lblConfirmar) lblConfirmar.textContent = 'Sí';
        } else {
            overlay.setAttribute('data-confirm-mode', 'save-cancel');
            if (btnCancelar) {
                btnCancelar.setAttribute('aria-keyshortcuts', 'Alt+C');
                btnCancelar.setAttribute('title', 'Cancelar (Alt+C)');
            }
            if (btnConfirmar) {
                btnConfirmar.setAttribute('aria-keyshortcuts', 'Alt+G');
                btnConfirmar.setAttribute('title', 'Guardar (Alt+G)');
            }
            if (lblCancelar) lblCancelar.textContent = 'Cancelar';
            if (lblConfirmar) lblConfirmar.textContent = 'Guardar';
        }

        overlay.classList.toggle('modal-confirmacion--peligro', !!esPeligro);

        obsDiv.style.display = requireObservacion ? 'block' : 'none';
        textarea.value = '';

        callbackConfirmacion = callback;

        if (requireObservacion) {
            confirmarBtn.disabled = true;
            textarea.oninput = function() {
                confirmarBtn.disabled = this.value.trim() === '';
            };
            textarea.focus();
        } else {
            confirmarBtn.disabled = false;
            textarea.oninput = null;
        }

        overlay.classList.add('activo');
    };

    function cerrarModalConfirmacion() {
        var overlay = document.getElementById('modal-confirmacion-overlay');
        if (overlay) {
            overlay.classList.remove('activo');
            overlay.classList.remove('modal-confirmacion--peligro');
            var btn = document.getElementById('modal-confirmacion-confirmar');
            if (btn) {
                btn.disabled = false;
            }
            callbackConfirmacion = null;
        }
    }

    window.cerrarModalConfirmacion = cerrarModalConfirmacion;

    // Handler del botón confirmar
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'modal-confirmacion-confirmar') {
            var confirmarBtn = e.target;
            if (!callbackConfirmacion || confirmarBtn.disabled) {
                return;
            }

            confirmarBtn.disabled = true;
            var callback = callbackConfirmacion;
            callbackConfirmacion = null;

            var obsDiv = document.querySelector('.modal-confirmacion-observacion');
            var requireObs = obsDiv.style.display !== 'none';

            if (requireObs) {
                var observacion = document.getElementById('modal-confirmacion-observacion').value.trim();
                callback(observacion);
            } else {
                callback();
            }
            cerrarModalConfirmacion();
        }
    });

    // Inicialización diferida: reduce HTML visible en Elements
    // Los nodos se crean recién cuando se usan.

})();

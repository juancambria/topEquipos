/**
 * Sistema de notificaciones Toast y Modal de Confirmación
 */

(function() {
    'use strict';

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
        
        // Eliminar después de la animación (3.5 segundos)
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3500);
    };

    // Modal de confirmación
    var modalConfirmacion = null;
    var callbackConfirmacion = null;

    function crearModalConfirmacion() {
        if (document.getElementById('modal-confirmacion-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'modal-confirmacion-overlay';
        overlay.className = 'modal-confirmacion-overlay';

        overlay.innerHTML =
            '<div class="modal-confirmacion">' +
                '<div class="modal-confirmacion-titulo" id="modal-confirmacion-titulo">Confirmar acción</div>' +
                '<div class="modal-confirmacion-mensaje" id="modal-confirmacion-mensaje"></div>' +
                '<div class="modal-confirmacion-observacion">' +
                    '<label for="modal-confirmacion-observacion">Observación (obligatoria)</label>' +
                    '<textarea id="modal-confirmacion-observacion" placeholder="Ingrese el motivo..."></textarea>' +
                '</div>' +
                '<div class="modal-confirmacion-botones">' +
                    '<button type="button" class="btn btn-cancelar" id="modal-confirmacion-cancelar">Cancelar</button>' +
                    '<button type="button" class="btn btn-confirmar" id="modal-confirmacion-confirmar">Confirmar</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Eventos
        document.getElementById('modal-confirmacion-cancelar').addEventListener('click', cerrarModalConfirmacion);
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) cerrarModalConfirmacion();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') cerrarModalConfirmacion();
        });

        // El textarea debe vaciarse cada vez que se abre
        var textarea = document.getElementById('modal-confirmacion-observacion');
        var confirmarBtn = document.getElementById('modal-confirmacion-confirmar');
        
        textarea.addEventListener('input', function() {
            confirmarBtn.disabled = this.value.trim() === '';
        });
    }

    window.abrirModalConfirmacion = function(titulo, mensaje, callback) {
        crearModalConfirmacion();
        
        document.getElementById('modal-confirmacion-titulo').textContent = titulo;
        document.getElementById('modal-confirmacion-mensaje').textContent = mensaje;
        document.getElementById('modal-confirmacion-observacion').value = '';
        document.getElementById('modal-confirmacion-confirmar').disabled = true;
        
        callbackConfirmacion = callback;
        
        var overlay = document.getElementById('modal-confirmacion-overlay');
        overlay.classList.add('activo');
        document.getElementById('modal-confirmacion-observacion').focus();
    };

    function cerrarModalConfirmacion() {
        var overlay = document.getElementById('modal-confirmacion-overlay');
        if (overlay) {
            overlay.classList.remove('activo');
            callbackConfirmacion = null;
        }
    }

    window.cerrarModalConfirmacion = cerrarModalConfirmacion;

    // Handler del botón confirmar
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'modal-confirmacion-confirmar') {
            if (callbackConfirmacion) {
                var observacion = document.getElementById('modal-confirmacion-observacion').value.trim();
                callbackConfirmacion(observacion);
                cerrarModalConfirmacion();
            }
        }
    });

    // Inicializar
    crearContenedorToast();
    crearModalConfirmacion();

})();


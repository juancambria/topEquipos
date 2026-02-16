(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalTipo');
    var form = document.getElementById('formTipo');
    var titulo = document.getElementById('modalTipoTitulo');
    var inputNombre = document.getElementById('tipoNombre');
    var submitBtn = document.getElementById('modalTipoSubmit');

    window.abrirModalTipo = function(mode, id, nombre) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Tipo';
            form.action = '/tipos/crear';
            inputNombre.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Tipo';
            form.action = '/tipos/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalTipo = function() { overlay.setAttribute('aria-hidden', 'true'); };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalTipo(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalTipo();
    });

    document.querySelectorAll('.btn-editar-tipo').forEach(function(btn) {
        btn.addEventListener('click', function() { abrirModalTipo('editar', btn.dataset.id, btn.dataset.nombre); });
    });

    document.getElementById('buscador')?.addEventListener('input', function() {
        var f = this.value.toLowerCase().trim();
        document.querySelectorAll('#tablaTipos tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
        });
    });

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaTipos th.sortable').forEach(function(th) {
        th.addEventListener('click', function() {
            var column = this.dataset.column;
            var currentOrder = this.dataset.order;
            var newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
            var url = new URL(window.location.href);
            url.searchParams.set('column', column);
            url.searchParams.set('order', newOrder);
            window.location.href = url.toString();
        });
        th.style.cursor = 'pointer';
        th.title = 'Click para ordenar';
    });

    /* --- Botones de baja con modal de confirmación --- */
    document.querySelectorAll('#tablaTipos .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var tipoNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja tipo',
                '¿Estás seguro de dar de baja el tipo "' + tipoNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja el tipo...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaTipos .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var tipoNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar tipo',
                '¿Estás seguro de activar el tipo "' + tipoNombre + '"?',
                function() {
                    mostrarToast('Activando el tipo...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();

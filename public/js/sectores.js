(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalSector');
    var form = document.getElementById('formSector');
    var titulo = document.getElementById('modalSectorTitulo');
    var inputNombre = document.getElementById('sectorNombre');
    var selectUbicacion = document.getElementById('sectorUbicacionId');
    var submitBtn = document.getElementById('modalSectorSubmit');

    window.abrirModalSector = function(mode, id, nombre, ubicacionId) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Sector';
            form.action = '/sectores/crear';
            inputNombre.value = '';
            if (selectUbicacion.options.length) selectUbicacion.selectedIndex = 0;
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Sector';
            form.action = '/sectores/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            selectUbicacion.value = String(ubicacionId || '');
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalSector = function() {
        overlay.setAttribute('aria-hidden', 'true');
    };

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalSector();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
            cerrarModalSector();
        }
    });

    document.querySelectorAll('.btn-editar-sector').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalSector('editar', this.dataset.id, this.dataset.nombre, this.dataset.ubicacionId);
        });
    });

    var buscador = document.getElementById('buscador');
    if (buscador) {
        buscador.addEventListener('input', function() {
            var f = this.value.toLowerCase().trim();
            var filas = document.querySelectorAll('#tablaSectores tbody tr');
            filas.forEach(function(tr) {
                if (tr.querySelector('.td-vacio')) return;
                var txt = tr.innerText.toLowerCase();
                tr.style.display = txt.indexOf(f) >= 0 ? '' : 'none';
            });
        });
    }

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaSectores th.sortable').forEach(function(th) {
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
    document.querySelectorAll('#tablaSectores .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var sectorNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja sector',
                '¿Estás seguro de dar de baja el sector "' + sectorNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja el sector...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaSectores .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var sectorNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar sector',
                '¿Estás seguro de activar el sector "' + sectorNombre + '"?',
                function() {
                    mostrarToast('Activando el sector...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();


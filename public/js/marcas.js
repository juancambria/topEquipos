(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalMarca');
    var form = document.getElementById('formMarca');
    var titulo = document.getElementById('modalMarcaTitulo');
    var inputMarca = document.getElementById('marcaNombre');
    var submitBtn = document.getElementById('modalMarcaSubmit');

    window.abrirModalMarca = function(mode, id, marca) {
        if (mode === 'crear') {
            titulo.textContent = 'Nueva Marca';
            form.action = '/marcas/crear';
            inputMarca.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Marca';
            form.action = '/marcas/' + id + '/actualizar';
            inputMarca.value = marca || '';
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalMarca = function() { overlay.setAttribute('aria-hidden', 'true'); };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalMarca(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalMarca();
    });

    document.querySelectorAll('.btn-editar-marca').forEach(function(btn) {
        btn.addEventListener('click', function() { abrirModalMarca('editar', btn.dataset.id, btn.dataset.marca); });
    });

    document.getElementById('buscador')?.addEventListener('input', function() {
        var f = this.value.toLowerCase().trim();
        document.querySelectorAll('#tablaMarcas tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
        });
    });

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaMarcas th.sortable').forEach(function(th) {
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
    document.querySelectorAll('#tablaMarcas .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var marcaNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja marca',
                '¿Estás seguro de dar de baja la marca "' + marcaNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja la marca...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaMarcas .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var marcaNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar marca',
                '¿Estás seguro de activar la marca "' + marcaNombre + '"?',
                function() {
                    mostrarToast('Activando la marca...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();

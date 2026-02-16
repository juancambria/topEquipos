(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalModelo');
    var form = document.getElementById('formModelo');
    var titulo = document.getElementById('modalModeloTitulo');
    var inputModelo = document.getElementById('modeloNombre');
    var selectMarca = document.getElementById('modeloIdMarca');
    var selectTipo = document.getElementById('modeloIdTipo');
    var submitBtn = document.getElementById('modalModeloSubmit');

    window.abrirModalModelo = function(mode, id, modelo, idMarca, idTipo) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Modelo';
            form.action = '/modelos/crear';
            inputModelo.value = '';
            if (selectMarca.options.length) selectMarca.selectedIndex = 0;
            selectTipo.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Modelo';
            form.action = '/modelos/' + id + '/actualizar';
            inputModelo.value = modelo || '';
            selectMarca.value = idMarca || '';
            selectTipo.value = idTipo || '';
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalModelo = function() { overlay.setAttribute('aria-hidden', 'true'); };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalModelo(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalModelo();
    });

    document.querySelectorAll('.btn-editar-modelo').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalModelo('editar', btn.dataset.id, btn.dataset.modelo, btn.dataset.idMarca, btn.dataset.idTipo);
        });
    });

    document.getElementById('buscador')?.addEventListener('input', function() {
        var f = this.value.toLowerCase().trim();
        document.querySelectorAll('#tablaModelos tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
        });
    });

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaModelos th.sortable').forEach(function(th) {
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
    document.querySelectorAll('#tablaModelos .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var modeloNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja modelo',
                '¿Estás seguro de dar de baja el modelo "' + modeloNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja el modelo...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaModelos .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var modeloNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar modelo',
                '¿Estás seguro de activar el modelo "' + modeloNombre + '"?',
                function() {
                    mostrarToast('Activando el modelo...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();

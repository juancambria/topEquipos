(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalContacto');
    var form = document.getElementById('formContacto');
    var titulo = document.getElementById('modalContactoTitulo');
    var inputNombre = document.getElementById('contactoNombre');
    var inputTelefono = document.getElementById('contactoTelefono');
    var inputCargo = document.getElementById('contactoCargo');
    var inputProveedor = document.getElementById('contactoIdProveedor');
    var submitBtn = document.getElementById('modalContactoSubmit');

    window.abrirModalContacto = function(mode, id, nombre, telefono, cargo, idProveedor) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Contacto';
            form.action = '/contactos/crear';
            inputNombre.value = '';
            inputTelefono.value = '';
            inputCargo.value = '';
            inputProveedor.value = idProveedor;
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Contacto';
            form.action = '/contactos/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            inputTelefono.value = telefono || '';
            inputCargo.value = cargo || '';
            inputProveedor.value = idProveedor;
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalContacto = function() {
        overlay.setAttribute('aria-hidden', 'true');
    };

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalContacto();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
            cerrarModalContacto();
        }
    });

    document.querySelectorAll('.btn-editar-contacto').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalContacto('editar', btn.dataset.id, btn.dataset.nombre, btn.dataset.telefono, btn.dataset.cargo, btn.dataset.idProveedor);
        });
    });

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaContactos th.sortable').forEach(function(th) {
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
    document.querySelectorAll('#tablaContactos .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var contactoNombre = btn.closest('tr').querySelector('td').textContent;

            abrirModalConfirmacion(
                'Dar de baja contacto',
                '¿Estás seguro de dar de baja el contacto "' + contactoNombre + '"?',
                function(observacion) {
                    // Crear input hidden con la observación
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    // Submit del formulario
                    mostrarToast('Dando de baja el contacto...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaContactos .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var contactoNombre = btn.closest('tr').querySelector('td').textContent;

            abrirModalConfirmacion(
                'Activar contacto',
                '¿Estás seguro de activar el contacto "' + contactoNombre + '"?',
                function() {
                    mostrarToast('Activando el contacto...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Contactos General: también agregar modal de confirmación --- */
    document.querySelectorAll('#tablaContactosGeneral .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var contactoNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja contacto',
                '¿Estás seguro de dar de baja el contacto "' + contactoNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja el contacto...', 'warning');
                    form.submit();
                }
            );
        });
    });

    document.querySelectorAll('#tablaContactosGeneral .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var contactoNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar contacto',
                '¿Estás seguro de activar el contacto "' + contactoNombre + '"?',
                function() {
                    mostrarToast('Activando el contacto...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();

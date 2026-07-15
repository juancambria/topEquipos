(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalContactoGeneral');
    var form = document.getElementById('formContactoGeneral');
    var titulo = document.getElementById('modalContactoGeneralTitulo');
    var inputNombre = document.getElementById('contactoNombreGeneral');
    var inputTelefono = document.getElementById('contactoTelefonoGeneral');
    var inputCargo = document.getElementById('contactoCargoGeneral');
    var selectProveedor = document.getElementById('contactoProveedorSelect');
    var submitBtn = document.getElementById('modalContactoGeneralSubmit');

    window.abrirModalContactoGeneral = function(mode, id, nombre, telefono, cargo, proveedor) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Contacto';
            form.action = '/contactos/crear';
            inputNombre.value = '';
            inputTelefono.value = '';
            inputCargo.value = '';
            selectProveedor.value = '';
            submitBtn.textContent = 'Guardar';
        } else {
            titulo.textContent = 'Editar Contacto';
            form.action = '/contactos/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            inputTelefono.value = telefono || '';
            inputCargo.value = cargo || '';
            selectProveedor.value = proveedor || '';
            submitBtn.textContent = 'Guardar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalContactoGeneral = function() {
        overlay.setAttribute('aria-hidden', 'true');
    };

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalContactoGeneral();
    });

    document.querySelectorAll('.btn-editar-contacto-general').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalContactoGeneral('editar', btn.dataset.id, btn.dataset.nombre, btn.dataset.telefono, btn.dataset.cargo, btn.dataset.proveedor);
        });
    });

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                var url = new URL(window.location.href);
                url.searchParams.set('search', this.value.trim());
                window.location.href = url.toString();
            }, 500);
        });
    }

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

    }); // Fin DOMContentLoaded

})();

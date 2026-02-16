(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalProveedor');
    var form = document.getElementById('formProveedor');
    var titulo = document.getElementById('modalProveedorTitulo');
    var inputProveedor = document.getElementById('proveedorNombre');
    var inputMail = document.getElementById('proveedorMail');
    var inputDireccion = document.getElementById('proveedorDireccion');
    var inputCiudad = document.getElementById('proveedorCiudad');
    var inputProvincia = document.getElementById('proveedorProvincia');
    var inputCodigoPostal = document.getElementById('proveedorCodigoPostal');
    var submitBtn = document.getElementById('modalProveedorSubmit');

    window.abrirModalProveedor = function(mode, id, proveedor, mail, provincia, ciudad, codigo_postal, direccion) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Proveedor';
            form.action = '/proveedores/crear';
            inputProveedor.value = '';
            inputMail.value = '';
            inputDireccion.value = '';
            inputCiudad.value = '';
            inputProvincia.value = '';
            inputCodigoPostal.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Proveedor';
            form.action = '/proveedores/' + id + '/actualizar';
            inputProveedor.value = proveedor || '';
            inputMail.value = mail || '';
            inputDireccion.value = direccion || '';
            inputCiudad.value = ciudad || '';
            inputProvincia.value = provincia || '';
            inputCodigoPostal.value = codigo_postal || '';
            submitBtn.textContent = 'Actualizar';
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalProveedor = function() {
        overlay.setAttribute('aria-hidden', 'true');
    };

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalProveedor();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
            cerrarModalProveedor();
        }
    });

    document.querySelectorAll('.btn-editar-proveedor').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalProveedor('editar', btn.dataset.id, btn.dataset.proveedor, btn.dataset.mail, btn.dataset.provincia, btn.dataset.ciudad, btn.dataset.codigo_postal, btn.dataset.direccion);
        });
    });

    document.querySelectorAll('.btn-contactos-proveedor').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.location.href = '/contactos/proveedor/' + btn.dataset.id;
        });
    });

    var buscador = document.getElementById('buscador');
    if (buscador) {
        buscador.addEventListener('input', function() {
            var f = this.value.toLowerCase().trim();
            document.querySelectorAll('#tablaProveedores tbody tr').forEach(function(tr) {
                if (tr.querySelector('.td-vacio')) return;
                tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
            });
        });
    }

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaProveedores th.sortable').forEach(function(th) {
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
    document.querySelectorAll('#tablaProveedores .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var provNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja proveedor',
                '¿Estás seguro de dar de baja el proveedor "' + provNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja el proveedor...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaProveedores .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var provNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar proveedor',
                '¿Estás seguro de activar el proveedor "' + provNombre + '"?',
                function() {
                    mostrarToast('Activando el proveedor...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();

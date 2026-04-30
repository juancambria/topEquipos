(function() {
    'use strict';
    if (!document.getElementById('tablaProveedores')) return;
    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalProveedor');
    var form = document.getElementById('formProveedor');
    var titulo = document.getElementById('modalProveedorTitulo');
    var inputProveedor = document.getElementById('proveedorNombre');
    var inputMail = document.getElementById('proveedorMail');
    var inputTelefono = document.getElementById('proveedorTelefono');
    var inputDireccion = document.getElementById('proveedorDireccion');
    var inputCiudad = document.getElementById('proveedorCiudad');
    var inputProvincia = document.getElementById('proveedorProvincia');
    var inputCodigoPostal = document.getElementById('proveedorCodigoPostal');
    var submitBtn = document.getElementById('modalProveedorSubmit');
    var selectedInfo = document.getElementById('selectedProveedorInfo');
    var btnEditar = document.getElementById('btnEditarProveedor');
    var btnEliminar = document.getElementById('btnEliminarProveedor');
    var btnContactos = document.getElementById('btnContactosProveedor');
    var btnAlta = document.getElementById('btnAltaProveedor');
    var cerrarModalBtn = overlay ? overlay.querySelector('[data-close-modal]') : null;

    /**
     * El escritorio (openAppWindow) vive en el documento del shell, no en iframes embebidos (?window=1).
     * Sin esto, el botón Contactos hacía location.href y reemplazaba el iframe de proveedores.
     */
    function getOpenAppWindow() {
        var candidates = [window, window.parent, window.top];
        var seen = new Set();
        for (var i = 0; i < candidates.length; i++) {
            var w = candidates[i];
            if (!w || seen.has(w)) {
                continue;
            }
            seen.add(w);
            try {
                if (typeof w.openAppWindow === 'function') {
                    return w.openAppWindow;
                }
            } catch (e) {
                /* orígenes distintos u otro acceso a parent */
            }
        }
        return null;
    }

    // Estado para detectar cambios
    var valoresOriginales = {};
    var hayModificaciones = false;
    var modoActual = 'crear'; // 'crear' o 'editar'

    if (!overlay || !form) return;

    // Función para guardar valores originales
    function guardarValoresOriginales() {
        valoresOriginales = {
            nombre: inputProveedor.value,
            mail: inputMail.value,
            telefono: inputTelefono.value,
            direccion: inputDireccion.value,
            ciudad: inputCiudad.value,
            provincia: inputProvincia.value,
            codigoPostal: inputCodigoPostal.value
        };
        hayModificaciones = false;
        actualizarEstadoBotonSubmit();
    }

    // Función para detectar cambios
    function verificarCambios() {
        hayModificaciones = valoresOriginales.nombre !== inputProveedor.value ||
                          valoresOriginales.mail !== inputMail.value ||
                          valoresOriginales.telefono !== inputTelefono.value ||
                          valoresOriginales.direccion !== inputDireccion.value ||
                          valoresOriginales.ciudad !== inputCiudad.value ||
                          valoresOriginales.provincia !== inputProvincia.value ||
                          valoresOriginales.codigoPostal !== inputCodigoPostal.value;
        actualizarEstadoBotonSubmit();
    }

    // Función para actualizar el estado del botón
    function actualizarEstadoBotonSubmit() {
        if (modoActual === 'crear') {
            // En modo crear, el botón siempre está habilitado
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.title = '';
            submitBtn.classList.remove('disabled-button');
        } else if (modoActual === 'editar') {
            // En modo editar, depende de si hay modificaciones
            if (hayModificaciones) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
                submitBtn.title = '';
                submitBtn.classList.remove('disabled-button');
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.title = 'No hay cambios para guardar';
                submitBtn.classList.add('disabled-button');
            }
        }
    }

    // Agregar listeners a todos los inputs
    var inputsProveedor = [inputProveedor, inputMail, inputTelefono, inputDireccion, inputCiudad, inputProvincia, inputCodigoPostal];
    inputsProveedor.forEach(input => {
        if (input) {
            input.addEventListener('input', verificarCambios);
            input.addEventListener('change', verificarCambios);
        }
    });

        window.abrirModalProveedor = function(mode, id, proveedor, mail, telefono, provincia, ciudad, codigo_postal, direccion) {
        modoActual = mode;
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Proveedor';
            form.action = '/proveedores/crear';
            inputProveedor.value = '';
            inputMail.value = '';
            inputTelefono.value = '';
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
            inputTelefono.value = telefono || '';
            inputDireccion.value = direccion || '';
            inputCiudad.value = ciudad || '';
            inputProvincia.value = provincia || '';
            inputCodigoPostal.value = codigo_postal || '';
            submitBtn.textContent = 'Actualizar';
        }
        guardarValoresOriginales();
        overlay.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalProveedor() {
        overlay.setAttribute('aria-hidden', 'true');
    }

    window.cerrarModalProveedor = function() {
        if (!hayModificaciones) {
            // Si no hay cambios, cerramos sin preguntar
            forceCerrarModalProveedor();
        } else {
            // Si hay cambios, pedimos confirmación
            abrirModalConfirmacion(
                'Cerrar proveedor',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                function() {
                    forceCerrarModalProveedor();
                },
                false
            );
        }
    };

    var seleccion = CrudCommon.createRowSelection({
        rowSelector: '#tablaProveedores tbody tr[data-id]',
        selectedInfo: selectedInfo,
        buttons: [btnEditar, btnEliminar, btnContactos],
        outsideIgnoreSelectors: ['#btnEditarProveedor', '#btnEliminarProveedor', '#btnContactosProveedor'],
        formatInfo: function(row) {
            return row
                ? 'Proveedor "' + row.dataset.proveedor + '" (' + row.dataset.id + ') seleccionado'
                : 'Ningún proveedor seleccionado';
        },
        onDoubleClick: function(row) {
            if (!btnEditar) return;
            abrirModalProveedor('editar', row.dataset.id, row.dataset.proveedor, row.dataset.mail, row.dataset.telefono, row.dataset.provincia, row.dataset.ciudad, row.dataset.codigo_postal, row.dataset.direccion);
        },
    });

    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return alert('Selecciona un proveedor primero');
            if (!row) return;
            abrirModalProveedor('editar', row.dataset.id, row.dataset.proveedor, row.dataset.mail, row.dataset.telefono, row.dataset.provincia, row.dataset.ciudad, row.dataset.codigo_postal, row.dataset.direccion);
        });
    }

    if (btnContactos) {
        btnContactos.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return alert('Selecciona un proveedor primero');
            var url = '/contactos/proveedor/' + row.dataset.id;
            var titulo = 'Contactos: ' + (row.dataset.proveedor || 'proveedor');
            var openAppWindow = getOpenAppWindow();
            if (openAppWindow) {
                openAppWindow({ title: titulo, url: url });
            } else {
                window.location.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'window=1';
            }
        });
    }

    if (btnEliminar) {
        btnEliminar.addEventListener('click', async function() {
            var row = seleccion.getSelectedRow();
            if (!row) return alert('Selecciona un proveedor primero');
            
            // Chequeo AJAX de equipos vinculados
            try {
                const response = await fetch(`/proveedores/${row.dataset.id}/tiene-equipos`);
                const data = await response.json();
                
                if (data.tieneEquipos) {
                    mostrarToast('No se puede eliminar. Primero elimine los equipos vinculados a este proveedor.', 'error');
                    return;
                }
                
                abrirModalConfirmacion(
                    'Eliminar proveedor',
                    '¿Estás por eliminar el proveedor "' + row.dataset.proveedor + '"? ¿Desea continuar?',
                    function() {
                    let form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/proveedores/' + row.dataset.id + '/baja';
                    form.innerHTML = '<input type="hidden" name="_token" value="' + CrudCommon.getCsrfToken() + '"><input type="hidden" name="_method" value="DELETE">';
                    document.body.appendChild(form);
                    form.submit();
                    },
                    true  // peligro = true
                );
            } catch (error) {
                mostrarToast('Error al verificar equipos: ' + error.message, 'error');
            }
        });
    }

    // btnAlta eliminado - no hay reactivación
    CrudCommon.initSearchInput();
    CrudCommon.initSortableHeaders('#tablaProveedores th.sortable');

    // AJAX handler para crear proveedor
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const esCrear = form.action.includes('/crear') || titulo.textContent.includes('Nuevo');
        const nombre = inputProveedor.value || 'sin nombre';

        const tituloConfirmacion = esCrear ? 'Crear proveedor' : 'Actualizar proveedor';
        const mensaje = esCrear
            ? `¿Confirmás la creación del proveedor "${nombre}"?`
            : `Estás por actualizar el proveedor "${nombre}". ¿Desea continuar?`;

        abrirModalConfirmacion(
            tituloConfirmacion,
            mensaje,
            function() {

                // FORCE ACTION CORRECTO (lo dejamos como lo tenías)
                if (esCrear) {
                    form.action = '/proveedores/crear';
                }

                const tokenVal = CrudCommon.getCsrfToken();
                if (!tokenVal) {
                    mostrarToast('Error de seguridad', 'error');
                    return;
                }

                const formData = new FormData(form);
                formData.append('_token', tokenVal);

                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';

                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarToast(data.message, 'success');
                        forceCerrarModalProveedor();
                        location.reload();
                    } else {
                        mostrarToast('Error: ' + (data.message || 'Error desconocido'), 'error');
                    }
                })
                .catch(error => {
                    mostrarToast('Error de conexión', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = esCrear ? 'Crear' : 'Actualizar';
                });

            },
            false
        );
    });

    }); // Fin DOMContentLoaded

})();

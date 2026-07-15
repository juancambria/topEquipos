(function() {
    'use strict';
    if (!document.getElementById('tablaContactos') && !document.getElementById('tablaContactosGeneral')) return;
    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalContacto');
    var form = document.getElementById('formContacto');
    var titulo = document.getElementById('modalContactoTitulo');
    var inputNombre = document.getElementById('contactoNombre');
    var inputTelefono = document.getElementById('contactoTelefono');
    var inputMail = document.getElementById('contactoMail');
    var inputObservacion = document.getElementById('contactoObservacion');
    var inputCargo = document.getElementById('contactoCargo');
    var inputProveedor = document.getElementById('contactoIdProveedor');
    var inputProveedorHidden = document.getElementById('contactoIdProveedorHidden');
    var submitBtn = document.getElementById('modalContactoSubmit');
    var selectedInfo = document.getElementById('selectedContactoInfo');
    var btnEditar = document.getElementById('btnEditarContacto');
    var btnEliminar = document.getElementById('btnEliminarContacto');
    var btnAlta = document.getElementById('btnAltaContacto');

    // Estado para detectar cambios
    var valoresOriginales = {};
    var hayModificaciones = false;
    var modoActual = 'crear'; // 'crear' o 'editar'
    var proveedorContexto = document.querySelector('.page-container')?.dataset.contextIdProveedor || '';

    if (!overlay || !form) return;

    // Función para guardar valores originales
    function guardarValoresOriginales() {
        valoresOriginales = {
            nombre: inputNombre.value,
            telefono: inputTelefono.value,
            mail: inputMail.value,
            observacion: inputObservacion.value,
            cargo: inputCargo.value,
            proveedor: inputProveedor.value
        };
        hayModificaciones = false;
        actualizarEstadoBotonSubmit();
    }

    // Función para detectar cambios
    function verificarCambios() {
        hayModificaciones = valoresOriginales.nombre !== inputNombre.value ||
                          valoresOriginales.telefono !== inputTelefono.value ||
                          valoresOriginales.mail !== inputMail.value ||
                          valoresOriginales.observacion !== inputObservacion.value ||
                          valoresOriginales.cargo !== inputCargo.value ||
                          valoresOriginales.proveedor !== inputProveedor.value;
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
    var inputsContacto = [inputNombre, inputTelefono, inputMail, inputObservacion, inputCargo, inputProveedor];
    inputsContacto.forEach(input => {
        if (input) {
            input.addEventListener('input', verificarCambios);
            input.addEventListener('change', verificarCambios);
        }
    });

    // AJAX para form submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const esCrear = form.action.includes('/crear');
        const selectedOption = inputProveedor.options[inputProveedor.selectedIndex];
        const proveedorNombre = selectedOption ? selectedOption.textContent : 'desconocido';

        abrirModalConfirmacion(
            esCrear ? 'Crear contacto' : 'Actualizar contacto',
            esCrear 
                ? `Estás por crear un nuevo contacto para el proveedor ${proveedorNombre}. ¿Desea continuar?` 
                : `Estás por actualizar el contacto del proveedor ${proveedorNombre}. ¿Desea continuar?`,
            async function() {

                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';

                try {
                    const formData = new FormData(form);

                    // Debug: log the form data
                    console.log('Form data being sent:');
                    for (let [key, value] of formData.entries()) {
                        console.log(`${key}: ${value}`);
                    }

                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('Failed to parse response:', text);
                        mostrarToast('Error: Respuesta inválida del servidor', 'error');
                        return;
                    }

                    console.log('Response status:', response.status);
                    console.log('Response data:', data);

                    if (!response.ok) {
                        // Mostrar errores de validación específicos
                        if (data.errors) {
                            const errores = Object.entries(data.errors)
                                .map(([campo, mensajes]) => `${campo}: ${mensajes.join(', ')}`)
                                .join('\n');
                            mostrarToast(errores || 'Error de validación', 'error');
                        } else {
                            mostrarToast(data.message || 'Error en el servidor', 'error');
                        }
                        return;
                    }

                    mostrarToast(data.message || 'Operación completada', 'success');
                    if (esCrear && data.id != null && typeof CrudCommon.setPersistedSelection === 'function') {
                        CrudCommon.setPersistedSelection('table[id^="tablaContactos"] tbody tr[data-id]', data.id);
                    }
                    forceCerrarModalContacto();
                    ejecutarTrasToastVisible(function() {
                        location.reload();
                    });

                } catch (error) {
                    console.error('Fetch error:', error);
                    mostrarToast('Error: ' + error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = esCrear ? 'Crear' : 'Actualizar';
                }

            },
            false,
            false
        );
    });

    window.abrirModalContacto = function(mode, id, nombre, telefono, mail, observacion, cargo, idProveedor) {
        modoActual = mode;
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Contacto';
            form.action = '/contactos/crear';
            inputNombre.value = '';
            inputTelefono.value = '';
            inputMail.value = '';
            inputObservacion.value = '';
            inputCargo.value = '';
            
            // Si hay idProveedor específico (desde vista de proveedor), hacerlo fijo/solo visual
            if (idProveedor) {
                inputProveedor.value = idProveedor;
                if (inputProveedorHidden) {
                    inputProveedorHidden.value = idProveedor;
                }
                inputProveedor.disabled = true;
                const selectedOption = inputProveedor.options[inputProveedor.selectedIndex];
                const proveedorNombre = selectedOption ? selectedOption.textContent : 'Proveedor';
                inputProveedor.previousElementSibling.textContent = `Proveedor: ${proveedorNombre}`;
            } else {
                // Si no hay proveedor específico, no preseleccionar ninguno
                inputProveedor.value = '';
                if (inputProveedorHidden) {
                    inputProveedorHidden.value = '';
                }
                inputProveedor.disabled = false;
                inputProveedor.previousElementSibling.textContent = 'Proveedor';
            }
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Contacto';
            form.action = '/contactos/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            inputTelefono.value = telefono || '';
            inputMail.value = mail || '';
            inputObservacion.value = observacion || '';
            inputCargo.value = cargo || '';
            inputProveedor.value = idProveedor;
            if (inputProveedorHidden) {
                inputProveedorHidden.value = idProveedor;
            }
            inputProveedor.disabled = true;
            inputProveedor.previousElementSibling.textContent = 'Proveedor';
            submitBtn.textContent = 'Actualizar';
        }
        guardarValoresOriginales();
        overlay.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalContacto() {
        overlay.setAttribute('aria-hidden', 'true');
    }

    window.cerrarModalContacto = function() {
        if (!hayModificaciones) {
            // Si no hay cambios, cerramos sin preguntar
            forceCerrarModalContacto();
        } else {
            // Si hay cambios, pedimos confirmación
            abrirModalConfirmacion(
                'Cerrar contacto',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                function() {
                    forceCerrarModalContacto();
                },
                false,
                true
            );
        }
    };

    function getTablaContactos() {
        return document.getElementById('tablaContactos') || document.getElementById('tablaContactosGeneral');
    }

    var seleccion = CrudCommon.createRowSelection({
        rowSelector: 'table[id^="tablaContactos"] tbody tr[data-id]',
        selectedInfo: selectedInfo,
        buttons: [btnEditar, btnEliminar],
        outsideIgnoreSelectors: ['#btnEditarContacto', '#btnEliminarContacto'],
        formatInfo: function(row) {
            return row ? 'Contacto "' + row.dataset.nombre + '" seleccionado' : 'Ningún contacto seleccionado';
        },
        onDoubleClick: function(row) {
            if (!btnEditar) return;
            abrirModalContacto('editar', row.dataset.id, row.dataset.nombre, row.dataset.telefono, row.dataset.mail, row.dataset.observacion, row.dataset.cargo, row.dataset.idProveedor);
        },
    });

    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return mostrarToast('Selecciona un contacto primero', 'warning');
            if (!row) return;
            abrirModalContacto('editar', row.dataset.id, row.dataset.nombre, row.dataset.telefono, row.dataset.mail, row.dataset.observacion, row.dataset.cargo, row.dataset.idProveedor);
        });
    }

    if (btnEliminar) {
        btnEliminar.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return mostrarToast('Selecciona un contacto primero', 'warning');
            if (!row) return;
            abrirModalConfirmacion(
                'Eliminar contacto',
                'Estás por eliminar el contacto "' + row.dataset.nombre + '". ¿Desea continuar?',
                function() {
                    // Eliminar contacto con AJAX + refresh tabla
                    fetch('/contactos/' + row.dataset.id + '/baja', {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': CrudCommon.getCsrfToken(),
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            mostrarToast(data.message, 'success');
                            ejecutarTrasToastVisible(function() {
                                location.reload();
                            });
                        } else {
                            mostrarToast(data.error || 'Error desconocido', 'error');
                        }
                    })
                    .catch(error => {
                        mostrarToast('Error: ' + error.message, 'error');
                    });
                },
                false,
                true
            );
        });
    }

    // btnAlta eliminado - no hay reactivación


    CrudCommon.initSearchInput();
    CrudCommon.initSortableHeaders('table[id^="tablaContactos"] th.sortable');

    }); // Fin DOMContentLoaded

})();

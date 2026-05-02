(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var overlay = document.getElementById('modalSector');
        var form = document.getElementById('formSector');
        var titulo = document.getElementById('modalSectorTitulo');
        var inputNombre = document.getElementById('sectorNombre');
        var submitBtn = document.getElementById('modalSectorSubmit');

        var overlayUbicaciones = document.getElementById('modalUbicacionesSector');
        var tituloUbicaciones = document.getElementById('tituloUbicacionesSector');
        var bodyUbicaciones = document.getElementById('bodyUbicacionesSector');
        var btnAgregarUbicacion = document.getElementById('btnAgregarUbicacionDesdeSector');

        var btnEditar = document.getElementById('btnEditarSector');
        var btnEliminar = document.getElementById('btnEliminarSector');
        var btnVerUbicaciones = document.getElementById('btnVerUbicacionesSector');
        var selectedInfo = document.getElementById('selectedSectorInfo');

        if (!overlay || !form || !inputNombre || !submitBtn) {
            return;
        }
        if (form.dataset.boundBy && form.dataset.boundBy !== 'sectores') {
            return;
        }
        form.dataset.boundBy = 'sectores';

        var sectorOriginalNombre = '';
        var sectorHasChanges = false;
        var sectorEditMode = false;
        var sectorSubmitting = false;
        var currentSector = { id: null, nombre: '' };
        var ubicacionesEstadoInicial = {};

        function actualizarEstadoSubmit() {
            if (sectorSubmitting) {
                submitBtn.disabled = true;
                return;
            }

            if (!sectorEditMode) {
                sectorHasChanges = inputNombre.value.trim() !== '';
                submitBtn.disabled = !sectorHasChanges;
                submitBtn.classList.toggle('disabled', !sectorHasChanges);
                return;
            }

            sectorHasChanges = inputNombre.value.trim() !== sectorOriginalNombre.trim();
            submitBtn.disabled = !sectorHasChanges;
            submitBtn.classList.toggle('disabled', !sectorHasChanges);
        }

        function forceCerrarModalSector() {
            overlay.setAttribute('aria-hidden', 'true');
            sectorOriginalNombre = '';
            sectorHasChanges = false;
            sectorEditMode = false;
            sectorSubmitting = false;
            submitBtn.textContent = 'Crear';
            submitBtn.classList.remove('disabled');
        }

        function recargarVista() {
            window.location.reload();
        }

        async function guardarSector() {
            sectorSubmitting = true;
            submitBtn.disabled = true;
            submitBtn.textContent = sectorEditMode ? 'Actualizando...' : 'Creando...';

            try {
                var formData = new FormData(form);
                formData.set('_token', CrudCommon.getCsrfToken());

                var response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                var data = await response.json();
                if (!response.ok || !data.success) {
                    var errorMessage = data?.errors?.nombre?.[0] || data?.message || 'No se pudo guardar el sector';
                    mostrarToast(errorMessage, 'error');
                    return;
                }

                mostrarToast(data.message || 'Sector guardado correctamente', 'success');
                forceCerrarModalSector();

                if (overlayUbicaciones && overlayUbicaciones.getAttribute('aria-hidden') === 'false' && currentSector.id) {
                    setTimeout(function() {
                        abrirModalUbicacionesSector(currentSector.id, currentSector.nombre);
                    }, 100);
                    return;
                }

                var modalSectoresUbicacion = document.getElementById('modalSectores');
                if (!sectorEditMode && modalSectoresUbicacion && modalSectoresUbicacion.style.display === 'flex') {
                    window.dispatchEvent(new CustomEvent('sectorCreado'));
                    return;
                }

                setTimeout(recargarVista, 250);
            } catch (error) {
                console.error(error);
                mostrarToast('Error al guardar el sector', 'error');
            } finally {
                sectorSubmitting = false;
                submitBtn.textContent = sectorEditMode ? 'Actualizar' : 'Crear';
                actualizarEstadoSubmit();
            }
        }

        window.abrirModalSector = function(mode, id, nombre) {
            sectorEditMode = mode === 'editar';
            sectorOriginalNombre = sectorEditMode ? (nombre || '') : '';
            sectorHasChanges = false;
            sectorSubmitting = false;

            if (sectorEditMode) {
                titulo.textContent = 'Editar Sector';
                form.action = '/sectores/' + id + '/actualizar';
                inputNombre.value = sectorOriginalNombre;
                submitBtn.textContent = 'Actualizar';
            } else {
                titulo.textContent = 'Nuevo Sector';
                form.action = '/sectores/crear';
                inputNombre.value = '';
                submitBtn.textContent = 'Crear';
            }

            actualizarEstadoSubmit();
            overlay.setAttribute('aria-hidden', 'false');
            inputNombre.focus();
            inputNombre.select();
        };

        window.cerrarModalSector = function() {
            if (sectorSubmitting) {
                return;
            }

            if (!sectorHasChanges) {
                forceCerrarModalSector();
                return;
            }

            abrirModalConfirmacion(
                sectorEditMode ? 'Cerrar edición de sector' : 'Cerrar creación de sector',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                forceCerrarModalSector,
                false,
                true
            );
        };

        inputNombre.addEventListener('input', actualizarEstadoSubmit);

        overlay.addEventListener('click', function(event) {
            if (event.target === overlay) {
                window.cerrarModalSector();
            }
        });

        form.addEventListener('submit', function(event) {
            event.preventDefault();

            if (submitBtn.disabled || sectorSubmitting) {
                return;
            }

            var nombreActual = inputNombre.value.trim();
            var tituloConfirmacion = sectorEditMode ? 'Actualizar sector' : 'Crear sector';
            var mensaje = sectorEditMode
                ? '¿Desea actualizar el sector a "' + nombreActual + '"?'
                : '¿Desea crear el sector "' + nombreActual + '"?';

            abrirModalConfirmacion(
                tituloConfirmacion,
                mensaje,
                guardarSector,
                false,
                false
            );
        });

        var seleccion = CrudCommon.createRowSelection({
            rowSelector: '#tablaSectores tbody tr[data-id]',
            selectedInfo: selectedInfo,
            buttons: [btnEditar, btnEliminar, btnVerUbicaciones],
            outsideIgnoreSelectors: ['#btnEditarSector', '#btnEliminarSector', '#btnVerUbicacionesSector'],
            formatInfo: function(row) {
                return row
                    ? 'Sector seleccionado: ' + row.dataset.nombre + ' (ID ' + row.dataset.id + ')'
                    : 'Ningún sector seleccionado';
            },
            onDoubleClick: function(row) {
                window.abrirModalSector('editar', row.dataset.id, row.dataset.nombre);
            }
        });

        if (btnEditar) {
            btnEditar.addEventListener('click', function() {
                var row = seleccion.getSelectedRow();
                if (!row) {
                    return;
                }
                window.abrirModalSector('editar', row.dataset.id, row.dataset.nombre);
            });
        }

        if (btnEliminar) {
            btnEliminar.addEventListener('click', function() {
                CrudCommon.confirmSelectedRow({
                    getRow: seleccion.getSelectedRow,
                    emptyMessage: 'Selecciona un sector primero',
                    alertType: 'toast',
                    title: 'Eliminar sector',
                    message: function(row) {
                        return '¿Desea eliminar el sector "' + row.dataset.nombre + '"?';
                    },
                    onConfirm: async function(row) {
                        try {
                            var response = await fetch('/sectores/' + row.dataset.id + '/baja', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'X-CSRF-TOKEN': CrudCommon.getCsrfToken()
                                }
                            });
                            var data = await response.json();

                            if (!response.ok || !data.success) {
                                mostrarToast(data.message || 'No se pudo eliminar el sector', 'error');
                                return;
                            }

                            mostrarToast(data.message || 'Sector eliminado correctamente', 'success');
                            setTimeout(recargarVista, 250);
                        } catch (error) {
                            console.error(error);
                            mostrarToast('Error al eliminar el sector', 'error');
                        }
                    }
                });
            });
        }

        function forceCerrarModalUbicacionesSector() {
            if (overlayUbicaciones) {
                overlayUbicaciones.setAttribute('aria-hidden', 'true');
            }
            if (bodyUbicaciones) {
                bodyUbicaciones.innerHTML = '';
            }
        }

        window.cerrarModalUbicacionesSector = function() {
            forceCerrarModalUbicacionesSector();
        };

        async function syncUbicaciones() {
            var ids = Array.from(bodyUbicaciones.querySelectorAll('.ubicacion-checkbox:checked')).map(function(input) {
                return input.value;
            });

            try {
                var response = await fetch('/sectores/' + currentSector.id + '/sync-ubicaciones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': CrudCommon.getCsrfToken()
                    },
                    body: JSON.stringify({ ubicacion_ids: ids })
                });
                var data = await response.json();

                if (!response.ok || !data.success) {
                    mostrarToast(data.message || 'No se pudieron actualizar las ubicaciones', 'error');
                    return false;
                }

                mostrarToast(data.message || 'Ubicaciones actualizadas', 'success');
                return true;
            } catch (error) {
                console.error(error);
                mostrarToast('Error al actualizar ubicaciones', 'error');
                return false;
            }
        }

        async function abrirModalUbicacionesSector(sectorId, sectorNombre) {
            currentSector.id = sectorId;
            currentSector.nombre = sectorNombre || '';
            tituloUbicaciones.textContent = 'Ubicaciones del sector: ' + currentSector.nombre;
            overlayUbicaciones.setAttribute('aria-hidden', 'false');
            bodyUbicaciones.innerHTML = '<tr><td colspan="2">Cargando...</td></tr>';

            try {
                var response = await fetch('/sectores/' + sectorId + '/ubicaciones', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                var ubicaciones = await response.json();

                if (!response.ok) {
                    throw new Error('Error al cargar ubicaciones');
                }

                ubicacionesEstadoInicial = {};
                bodyUbicaciones.innerHTML = '';

                if (!ubicaciones.length) {
                    bodyUbicaciones.innerHTML = '<tr><td colspan="2">No hay ubicaciones disponibles.</td></tr>';
                    if (typeof window.__refocusModal === 'function') {
                        window.__refocusModal(overlayUbicaciones);
                    }
                    return;
                }

                ubicaciones.forEach(function(ubicacion) {
                    ubicacionesEstadoInicial[String(ubicacion.id)] = !!ubicacion.asociado;

                    var tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <input
                                type="checkbox"
                                class="ubicacion-checkbox"
                                value="${ubicacion.id}"
                                ${ubicacion.asociado ? 'checked' : ''}
                            >
                        </td>
                        <td>${ubicacion.nombre || ''}</td>
                    `;
                    bodyUbicaciones.appendChild(tr);
                });
            } catch (error) {
                console.error(error);
                bodyUbicaciones.innerHTML = '<tr><td colspan="2">No se pudieron cargar las ubicaciones.</td></tr>';
            }
            if (typeof window.__refocusModal === 'function') {
                window.__refocusModal(overlayUbicaciones);
            }
        }

        if (btnVerUbicaciones) {
            btnVerUbicaciones.addEventListener('click', function() {
                var row = seleccion.getSelectedRow();
                if (!row) {
                    return;
                }
                abrirModalUbicacionesSector(row.dataset.id, row.dataset.nombre);
            });
        }

        if (overlayUbicaciones) {
            overlayUbicaciones.addEventListener('click', function(event) {
                if (event.target === overlayUbicaciones) {
                    forceCerrarModalUbicacionesSector();
                }
            });
        }

        if (btnAgregarUbicacion) {
            btnAgregarUbicacion.addEventListener('click', function() {
                if (typeof window.abrirModalUbicacion !== 'function') {
                    mostrarToast('No se pudo abrir el modal de ubicación', 'error');
                    return;
                }
                window.abrirModalUbicacion('crear');
            });
        }

        if (bodyUbicaciones) {
            bodyUbicaciones.addEventListener('change', function(event) {
                if (!event.target.classList.contains('ubicacion-checkbox')) {
                    return;
                }
                syncUbicaciones();
            });
        }

        CrudCommon.initSearchInput();
    });
})();

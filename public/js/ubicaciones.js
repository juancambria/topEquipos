(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlayUbicacion = document.getElementById('modalUbicacionPagina') || document.getElementById('modalUbicacion');
    var formUbicacion = document.getElementById('formUbicacionPagina') || document.getElementById('formUbicacion');
    var tituloUbicacion = document.getElementById('modalUbicacionTituloPagina') || document.getElementById('modalUbicacionTitulo');
    var inputId = document.getElementById('ubicacionIdPagina') || document.getElementById('ubicacionId');
    var inputNombre = document.getElementById('ubicacionNombrePagina') || document.getElementById('ubicacionNombre');
    var inputCodigo = document.getElementById('ubicacionCodigoPagina') || document.getElementById('ubicacionCodigo');
    var inputCiudad = document.getElementById('ubicacionCiudadPagina') || document.getElementById('ubicacionCiudad');
    var inputProvincia = document.getElementById('ubicacionProvinciaPagina') || document.getElementById('ubicacionProvincia');
    var inputTelefono = document.getElementById('ubicacionTelefonoPagina') || document.getElementById('ubicacionTelefono');
    var inputDireccion = document.getElementById('ubicacionDireccionPagina') || document.getElementById('ubicacionDireccion');
    var inputCodigoPostal = document.getElementById('ubicacionCodigoPostalPagina') || document.getElementById('ubicacionCodigoPostal');
    var submitBtn = document.getElementById('modalUbicacionSubmitPagina') || document.getElementById('modalUbicacionSubmit');
    var modalSectores = document.getElementById('modalSectores');
    var bodySectores = document.getElementById('bodySectores');
    var tituloSectores = document.getElementById('tituloSectores');
    var btnAgregarSectorDesdeUbicacion = document.getElementById('btnAgregarSectorDesdeUbicacion');
    var modalSector = document.getElementById('modalSector');
    var formSector = document.getElementById('formSector');
    var currentUbicacion = { id: null, nombre: '' };
    var sectoresEstadoInicial = {};

    /* NUEVO: Variables para dirty state del modal ubicacion */
    let ubicacionIsDirty = false;
    let ubicacionOriginalValues = {};
    let isUbicacionEditMode = false;
    const ubicacionInputs = [inputId, inputNombre, inputCodigo, inputCiudad, inputProvincia, inputTelefono, inputDireccion, inputCodigoPostal].filter(Boolean);

    function resetUbicacionListeners() {
        ubicacionInputs.forEach(input => {
            input.removeEventListener('input', checkUbicacionDirty);
        });
        ubicacionInputs.forEach(input => {
            input.addEventListener('input', checkUbicacionDirty);
        });
    }

    function checkUbicacionDirty() {
        if (!isUbicacionEditMode) {
            // Para crear, siempre habilitado si hay algún valor, pero simplificado: siempre enable
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.classList.remove('disabled');
              submitBtn.removeAttribute('title');
            }
            ubicacionIsDirty = inputNombre.value.trim() !== '';
            return;
        }

        let dirty = false;
        Object.keys(ubicacionOriginalValues).forEach(key => {
            const input = ubicacionInputs.find(i => i.name === key || i.id.toLowerCase().includes(key));
            if (input && input.value !== ubicacionOriginalValues[key]) {
                dirty = true;
            }
        });
        ubicacionIsDirty = dirty;
        if (submitBtn) {
  submitBtn.disabled = !dirty;
  if (dirty) {
    submitBtn.classList.remove('disabled');
    submitBtn.removeAttribute('title');
  } else {
    submitBtn.classList.add('disabled');
    submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
  }
}
    }

    /* --- Verificar que los elementos existen antes de usarlos --- */
    if (!overlayUbicacion || !formUbicacion) return;
    if (formUbicacion.dataset.boundBy && formUbicacion.dataset.boundBy !== 'ubicaciones') return;
    formUbicacion.dataset.boundBy = 'ubicaciones';

    /* --- Modal crear/editar Ubicación --- */
    window.abrirModalUbicacion = function(mode, id, nombre, codigo, ciudad, provincia, telefono, direccion, codigoPostal) {
        if (!overlayUbicacion || !formUbicacion) {
            console.error('No se encontró el modal o formulario de ubicación');
            return;
        }
        
        if (mode === 'crear') {
            tituloUbicacion.textContent = 'Nueva Ubicación';
            formUbicacion.action = '/ubicaciones/crear';
            if (inputId) {
                inputId.disabled = false;
                inputId.value = '';
            }
            if (inputNombre) inputNombre.value = '';
            if (inputCodigo) inputCodigo.value = '';
            if (inputCiudad) inputCiudad.value = '';
            if (inputProvincia) inputProvincia.value = '';
            if (inputTelefono) inputTelefono.value = '';
            if (inputDireccion) inputDireccion.value = '';
            if (inputCodigoPostal) inputCodigoPostal.value = '';
            if (submitBtn) submitBtn.textContent = 'Guardar';
            // Reset estado para crear
            isUbicacionEditMode = false;
            ubicacionOriginalValues = {};
            ubicacionIsDirty = false;
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.classList.remove('disabled');
              submitBtn.removeAttribute('title');
            }
        } else {
            tituloUbicacion.textContent = 'Editar Ubicación: ' + (nombre || '') + '';
            formUbicacion.action = '/ubicaciones/' + id + '/actualizar';
            if (inputId) {
                inputId.value = '';
                inputId.disabled = true;
            }
            if (inputNombre) inputNombre.value = nombre || '';
            if (inputCodigo) inputCodigo.value = codigo || '';
            if (inputCiudad) inputCiudad.value = ciudad || '';
            if (inputProvincia) inputProvincia.value = provincia || '';
            if (inputTelefono) inputTelefono.value = telefono || '';
            if (inputDireccion) inputDireccion.value = direccion || '';
            if (inputCodigoPostal) inputCodigoPostal.value = codigoPostal || '';
            if (submitBtn) submitBtn.textContent = 'Guardar';
            // Configurar dirty state para edit
            isUbicacionEditMode = true;
            ubicacionOriginalValues = {
                id: inputId ? inputId.value : '',
                nombre: inputNombre ? inputNombre.value : '',
                codigo: inputCodigo ? inputCodigo.value : '',
                ciudad: inputCiudad ? inputCiudad.value : '',
                provincia: inputProvincia ? inputProvincia.value : '',
                telefono: inputTelefono ? inputTelefono.value : '',
                direccion: inputDireccion ? inputDireccion.value : '',
                codigo_postal: inputCodigoPostal ? inputCodigoPostal.value : ''
            };
            ubicacionIsDirty = false;
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.classList.add('disabled');
              submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
            }
        }
        resetUbicacionListeners();
        overlayUbicacion.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalUbicacion() {
        // Reset estado
        ubicacionIsDirty = false;
        isUbicacionEditMode = false;
        ubicacionOriginalValues = {};
        overlayUbicacion.setAttribute('aria-hidden', 'true');
        if (inputId) inputId.disabled = false;
    }

    window.cerrarModalUbicacion = function() {
        if (ubicacionIsDirty) {
            abrirModalConfirmacion(
                'Cerrar ubicación',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                function() {
                    forceCerrarModalUbicacion();
                },
                false,
                true
            );
        } else {
            forceCerrarModalUbicacion();
        }
    };

    // Resto del código sin cambios...
    const selectedInfo = document.getElementById('selectedUbicacionInfo');
    const btnEditar = document.getElementById('btnEditarUbicacion');
    const btnEliminar = document.getElementById('btnEliminarUbicacion');
    const btnVerSectores = document.getElementById('btnVerSectoresUbicacion');
    const seleccion = CrudCommon.createRowSelection({
        rowSelector: '#tablaUbicaciones tbody tr[data-id]',
        selectedInfo: selectedInfo,
        buttons: [btnEditar, btnEliminar, btnVerSectores],
        outsideIgnoreSelectors: ['#btnEditarUbicacion', '#btnEliminarUbicacion', '#btnVerSectoresUbicacion'],
        formatInfo: function(row) {
            return row
                ? 'Ubicación "' + row.dataset.nombre + '" (' + row.dataset.id + ') seleccionada'
                : 'Ninguna ubicación seleccionada';
        },
        onDoubleClick: function(row) {
            abrirModalUbicacion(
                'editar',
                row.dataset.id,
                row.dataset.nombre,
                row.dataset.codigo,
                row.dataset.ciudad,
                row.dataset.provincia,
                row.dataset.telefono,
                row.dataset.direccion,
                row.dataset.codigoPostal
            );
        },
    });
    
    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            const row = seleccion.getSelectedRow();
            if (!row) {
                mostrarToast('Selecciona una ubicación primero', 'warning');
                return;
            }
            if (row) {
                abrirModalUbicacion(
                    'editar',
                    row.dataset.id,
                    row.dataset.nombre,
                    row.dataset.codigo,
                    row.dataset.ciudad,
                    row.dataset.provincia,
                    row.dataset.telefono,
                    row.dataset.direccion,
                    row.dataset.codigoPostal
                );
            }
        });
    }
    
    if (btnEliminar) {
        btnEliminar.addEventListener('click', function() {
            const row = seleccion.getSelectedRow();
            if (!row) {
                mostrarToast('Selecciona una ubicación primero', 'warning');
                return;
            }
            const nombre = row.dataset.nombre;
            abrirModalConfirmacion(
                `Eliminar ubicación ${nombre}`,
                `Estás por eliminar la ubicación "${nombre}". ¿Desea continuar?`,
                function() {
                    const form = row.querySelector('.form-baja');
                    if (form) form.submit();
                },
                false,
                true
            );
        });
    }
    if (btnVerSectores) {
        // Mantiene estado disabled del HTML hasta selección de fila
        btnVerSectores.addEventListener('click', function() {
            const row = seleccion.getSelectedRow();
            if (!row) {
                mostrarToast('Selecciona una ubicación primero', 'warning');
                return;
            }
            abrirModalSectoresUbicacion(row.dataset.id, row.dataset.nombre); 
        });
    }

    CrudCommon.initSearchInput();
    CrudCommon.initSortableHeaders('#tablaUbicaciones th.sortable');

    /* --- Flujo "Ver sectores": modales con display flex --- */
    window.abrirModal = function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'flex';
        if (el.classList.contains('modal-antiguo')) {
            el.setAttribute('aria-hidden', 'false');
        }
    };

    window.cerrarModal = function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';
        if (el.classList.contains('modal-antiguo')) {
            el.setAttribute('aria-hidden', 'true');
        }
    };

    window.cerrarModalSectores = function() {
        abrirModalConfirmacion(
            'Cerrar sectores de: ' + (currentUbicacion.nombre || ''),
            'Estás por cerrar el modal de sectores. ¿Desea continuar?',
            function() {
                cerrarModal('modalSectores');
            },
            false,
            false
        );
    };

    function abrirModalSectoresUbicacion(ubicacionId, ubicacionNombre) {
        currentUbicacion.id = ubicacionId;
        currentUbicacion.nombre = ubicacionNombre || '';

        abrirModal('modalSectores');
        if (tituloSectores) {
            tituloSectores.innerHTML = `Sectores de: ${ubicacionNombre || '—'}`; 
        }

        if (!bodySectores) return;
        
        // Limpiar tabla completa + añadir thead único
        const table = bodySectores.parentNode;
        table.innerHTML = '';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="width: 40px;"><input type="checkbox" id="selectAllSectores"></th>
                <th><label for="selectAllSectores" style="cursor: pointer; margin: 0;">Seleccionar todo</label></th>
            </tr>
        `;
        const tbody = document.createElement('tbody');
        tbody.id = 'bodySectores';
        table.appendChild(thead);
        table.appendChild(tbody);
        bodySectores = tbody; // Re-asignar ref

        fetch('/api/ubicaciones/' + ubicacionId + '/sectores-vinculacion')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var sectoresUnicos = [];
                var vistos = new Set();

                data.forEach(function(sector) {
                    if (!sector || vistos.has(sector.id)) return;
                    vistos.add(sector.id);
                    sectoresUnicos.push(sector);
                });

                sectoresEstadoInicial = {};

                sectoresUnicos.forEach(function(sector) {
                    sectoresEstadoInicial[String(sector.id)] = !!sector.asociado;
                    var tr = document.createElement('tr');
                    var checked = sector.asociado ? 'checked' : '';
                    tr.innerHTML = '<td>' +
                        '<input type="checkbox" class="sector-checkbox" data-sector-id="' + sector.id + '" ' + checked + '>' +
                        '</td>' +
                        '<td>' + (sector.nombre || '') + '</td>';
                    bodySectores.appendChild(tr);
                });

                // Individual listeners
                document.querySelectorAll('.sector-checkbox').forEach(function(checkbox) {
                    checkbox.addEventListener('change', function() {
                        var sectorId = this.dataset.sectorId;
                        var asociado = this.checked ? 1 : 0;
                        asociarSector(currentUbicacion.id, sectorId, asociado);
                    });
                });

                // Select-all handler
                const selectAll = document.getElementById('selectAllSectores');
                if (selectAll) {
                selectAll.addEventListener('change', function() {
                    window.currentToggleMassive = true;
                    window.targetToggleState = this.checked;
                    window.toggleMassiveErrors = 0;
                    window.toggleMassiveTotal = 0;
                    const checkboxes = document.querySelectorAll('.sector-checkbox');
                    const targetState = this.checked;
                    checkboxes.forEach(cb => {
                        const sectorId = String(cb.dataset.sectorId || '');
                        const desiredState = targetState ? true : !!sectoresEstadoInicial[sectorId];
                        if (cb.checked !== desiredState) {
                            cb.checked = desiredState;
                            window.toggleMassiveTotal += 1;
                            cb.dispatchEvent(new Event('change', { 
                                bubbles: true
                            }));
                        }
                    });
                    setTimeout(() => {
                        window.currentToggleMassive = false;
                        const errores = window.toggleMassiveErrors || 0;
                        const total = window.toggleMassiveTotal || 0;
                        const exitosos = total - errores;
                        if (total > 0) {
                            const accion = targetState ? 'vinculados' : 'restaurados';
                            mostrarToast(`${exitosos} sectores ${accion}${errores ? `, ${errores} bloqueados por equipos` : ''}.`, errores ? 'warning' : 'success');
                        }
                        window.toggleMassiveErrors = 0;
                        window.toggleMassiveTotal = 0;
                        window.targetToggleState = undefined;
                    }, 1500);
                });
                    
                    // Update state (incl indeterminate)
                    const updateSelectAll = () => {
                        const checkboxes = document.querySelectorAll('.sector-checkbox');
                        const checkedCount = document.querySelectorAll('.sector-checkbox:checked').length;
                        if (checkedCount === 0) {
                            selectAll.indeterminate = false;
                            selectAll.checked = false;
                        } else if (checkedCount === checkboxes.length) {
                            selectAll.indeterminate = false;
                            selectAll.checked = true;
                        } else {
                            selectAll.indeterminate = true;
                            selectAll.checked = false;
                        }
                    };
                    updateSelectAll();
                    
                    // Listen individual changes
                    document.querySelectorAll('.sector-checkbox').forEach(cb => {
                        cb.addEventListener('change', updateSelectAll);
                    });
                }
                if (typeof window.__refocusModal === 'function') {
                    window.__refocusModal('modalSectores');
                }
            });
    }

    /* --- Ver sectores con checkboxes --- */
    var btnsVerSectores = document.querySelectorAll('.btn-ver-sectores');
    if (btnsVerSectores.length > 0) {
        btnsVerSectores.forEach(function(btn) {
            btn.addEventListener('click', function() {
                abrirModalSectoresUbicacion(btn.dataset.id, btn.dataset.nombre);
            });
        });
    }

    if (btnAgregarSectorDesdeUbicacion) {
        btnAgregarSectorDesdeUbicacion.addEventListener('click', function() {
            if (!currentUbicacion.id || typeof window.abrirModalSector !== 'function') return;
            // Abrir modal sector encima del modal sectores (sin cerrarlo)
            window.abrirModalSector('crear', null, null, currentUbicacion.id);
        });
    }

    /* --- Asociar/desasociar sector a ubicación via AJAX --- */
    function asociarSector(ubicacionId, sectorId, asociado) {
        var formData = new FormData();
        formData.append('sector_id', sectorId);
        formData.append('ubicacion_id', ubicacionId);
        formData.append('asociado', asociado ? '1' : '0');
        
        var token = CrudCommon.getCsrfToken();
        if (token) {
            formData.append('_token', token);
        }

        fetch('/sectores/asociar', {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            return response.text().then(function(text) {
                throw new Error(text || 'Error en el servidor');
            });
        })
        .then(function(data) {
            // Silencioso éxito en masivo, log solo individual
            if (!window.currentToggleMassive) {
                console.log('Sector asociado correctamente');
            }
        })
        .catch(function(error) {
            // Contar errores masivos (sin console.error spam)
            if (window.currentToggleMassive) {
                window.toggleMassiveErrors = (window.toggleMassiveErrors || 0) + 1;
                var massiveCheckbox = document.querySelector('.sector-checkbox[data-sector-id="' + sectorId + '"]');
                if (massiveCheckbox) {
                    massiveCheckbox.checked = !massiveCheckbox.checked;
                }
                return;
            }
            
            // Individual: parse + toast + revert
            var msg = 'Error al asociar el sector';
            if (error.message) {
                try {
                    const data = JSON.parse(error.message);
                    if (data.message) msg = data.message;
                } catch (e) {
                    if (error.message.includes('<!DOCTYPE') || error.message.includes('<html')) {
                        var match = error.message.match(/class="exception-message"[^>]*>([^<]+)/);
                        if (match) msg = match[1].trim();
                    }
                }
            }
            var checkbox = document.querySelector('.sector-checkbox[data-sector-id="' + sectorId + '"]');
            if (checkbox) checkbox.checked = !checkbox.checked;
            mostrarToast(msg, 'error');
        });
    }

    formUbicacion.addEventListener('submit', function(e) {
        e.preventDefault();

        const esCrear = formUbicacion.action && formUbicacion.action.includes('/crear');
        const nombre = (inputNombre && inputNombre.value) ? inputNombre.value : 'sin nombre';

        const tituloConfirmacion = esCrear ? 'Crear ubicación' : 'Actualizar ubicación: "' + nombre + '"';
        const mensaje = esCrear
            ? `¿Confirmás la creación de la ubicación "${nombre}"?`
            : `¿Confirmás la actualización de la ubicación "${nombre}"?`;

        abrirModalConfirmacion(
            tituloConfirmacion,
            mensaje,
            function() {
                // 🆕 Z-INDEX BOOST for nested sectores→ubicacion flow
                setTimeout(() => {
                    const confirmOverlay = document.getElementById('modal-confirmacion-overlay');
                    if (confirmOverlay) {
                        confirmOverlay.style.zIndex = '130000';
                    }
                }, 10);

                // Reset dirty after confirm
                ubicacionIsDirty = false;

                // 🔹 CASO CREAR (AJAX)
                if (esCrear) {

                    var formData = new FormData(formUbicacion);

                    fetch(formUbicacion.action, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': CrudCommon.getCsrfToken()
                        },
                        body: formData
                    })
                    .then(function(response) {
                        return response.text().then(function(text) {
                            var data = {};
                            try {
                                data = text ? JSON.parse(text) : {};
                            } catch (e) {
                                data = { message: text || 'Respuesta inválida del servidor' };
                            }
                            return { ok: response.ok, data: data };
                        });
                    })
                    .then(function(result) {
                        if (!result.ok || !result.data.success) {
                            var errors = result.data.errors || {};
                            var firstField = Object.keys(errors)[0];
                            var firstMessage = firstField && Array.isArray(errors[firstField]) ? errors[firstField][0] : null;
                            throw new Error(firstMessage || result.data.message || 'No se pudo crear la ubicación');
                        }

                        var msgOk = result.data.message || 'Ubicación creada correctamente';
                        mostrarToast(msgOk, 'success');
                        if (result.data.id != null && typeof CrudCommon.setPersistedSelection === 'function') {
                            CrudCommon.setPersistedSelection('#tablaUbicaciones tbody tr[data-id]', result.data.id);
                        }
                        var url = new URL(window.location.href);
                        url.searchParams.set('abrirSectores', String(result.data.id));
                        url.searchParams.set('ubicacionNombre', result.data.nombre || '');
                        ejecutarTrasToastVisible(function() {
                            window.location.href = url.toString();
                        });
                    })
                    .catch(function(error) {
                        mostrarToast(error.message || 'Error al crear la ubicación', 'error');
                    });

                } 
                // 🔹 CASO EDITAR (submit normal)
                else {
                    formUbicacion.submit();
                }

            },
            false,
            false
        );
    });

    /* Listener para refrescar modalSectores post-creación de sector */
    window.addEventListener('sectorCreado', function(event) {
        if (currentUbicacion.id && modalSectores && modalSectores.style.display === 'flex') {
            if (typeof window.cerrarModalSector === 'function') {
                window.cerrarModalSector();
            }
            abrirModalSectoresUbicacion(currentUbicacion.id, currentUbicacion.nombre);
        }
    });

    var params = new URLSearchParams(window.location.search);
    var abrirSectores = params.get('abrirSectores');
    var ubicacionNombreParam = params.get('ubicacionNombre');
    if (abrirSectores) {
        abrirModalSectoresUbicacion(abrirSectores, ubicacionNombreParam || 'Ubicación');
        params.delete('abrirSectores');
        params.delete('ubicacionNombre');
        var nuevaUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', nuevaUrl);
    }

    /* --- Botones de baja con modal de confirmación --- */
    var formsBaja = document.querySelectorAll('#tablaUbicaciones .form-baja');
    if (formsBaja.length > 0) {
        formsBaja.forEach(function(form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var ubicacionNombre = form.closest('tr').querySelector('td:nth-child(2)').textContent;

                abrirModalConfirmacion(
                    'Eliminar ubicación',
                    '¿Estás seguro de eliminar la ubicación "' + ubicacionNombre + '"?',
                    function() {
                        mostrarToast('Eliminando la ubicación...', 'warning');
                        form.submit();
                    },
                    false,
                    true
                );
            });
        });
    }

    }); // Fin DOMContentLoaded

})();

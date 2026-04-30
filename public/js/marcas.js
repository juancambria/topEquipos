(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalMarca');
    var form = document.getElementById('formMarca');
    var titulo = document.getElementById('modalMarcaTitulo');
    var inputMarca = document.getElementById('marcaNombre');
    var submitBtn = document.getElementById('modalMarcaSubmit');
    var marcaCreada = false;
    var marcaOriginalNombre = '';
    var marcaHasChanges = false;
    var marcaEditMode = false;
    var marcaIsSubmitting = false;
    
    if (!overlay || !form) return;
    if (form.dataset.boundBy && form.dataset.boundBy !== 'marcas') return;

    function actualizarEstadoSubmitMarca() {
        if (!submitBtn || !inputMarca) return;
        if (!marcaEditMode) {
            marcaHasChanges = inputMarca.value.trim() !== '';
            submitBtn.disabled = !marcaHasChanges;
            submitBtn.classList.toggle('disabled', !marcaHasChanges);
            if (marcaHasChanges) {
                submitBtn.removeAttribute('title');
            } else {
                submitBtn.title = 'Bloqueado: completa el nombre para habilitar';
            }
            return;
        }

        marcaHasChanges = inputMarca.value.trim() !== marcaOriginalNombre.trim();
        submitBtn.disabled = !marcaHasChanges;
        submitBtn.classList.toggle('disabled', !marcaHasChanges);
        if (marcaHasChanges) {
            submitBtn.removeAttribute('title');
        } else {
            submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
        }
    }

    // AJAX para form submit - Solo una vez
    if (form.dataset.listenerAttached) return;
    form.dataset.boundBy = 'marcas';
    form.dataset.listenerAttached = 'true';

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (form.dataset.submitting === 'true') return;
        if (marcaCreada) return;

        const esCrear = form.action.includes('/crear');
        const nombre = inputMarca.value || 'sin nombre';
        if (submitBtn.disabled || marcaIsSubmitting) return;

        const tituloConfirmacion = esCrear ? 'Crear marca' : 'Actualizar marca';
        const mensaje = esCrear
            ? `¿Desea crear la marca "${nombre}"?`
            : `¿Desea actualizar la marca a "${nombre}"?`;

        form.dataset.submitting = 'true';

        abrirModalConfirmacion(
            tituloConfirmacion,
            mensaje,
            async function() {

                if (window.enviandoMarca) return;
                window.enviandoMarca = true;
                marcaIsSubmitting = true;

                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';

                try {
                    const formData = new FormData(form);

                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                        headers: CrudCommon.jsonHeaders()
                    });

                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch {
                        console.error('JSON parse error:', text);
                        throw new Error('Respuesta inválida del servidor');
                    }

                    if (!response.ok) {
                        if (response.status === 422 && data.errors?.marca) {
                            mostrarToast(data.errors.marca[0] || 'Error de validación', 'error');
                        } else {
                            mostrarToast('Error del servidor', 'error');
                        }
                        return;
                    }

                    mostrarToast('Marca guardada correctamente', 'success');
                    if (esCrear) marcaCreada = true;
                    forceCerrarModalMarca();
                    if (data.id) {
                        setTimeout(() => abrirModalTiposMarca(data.id, data.nombre), 300);
                    }

                } catch (error) {
                    console.error('Submit error:', error);
                    mostrarToast(error.message || 'Error de conexión', 'error');
                } finally {
                    marcaIsSubmitting = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = esCrear ? 'Crear' : 'Actualizar';
                    window.enviandoMarca = false;
                    form.dataset.submitting = 'false';
                }

            },
            false
        );
    });
    
    var modalMarcaTipos = document.getElementById('modalMarcaTipos');
    var tituloMarcaTipos = document.getElementById('tituloMarcaTipos');
    var bodyMarcaTipos = document.getElementById('bodyMarcaTipos');
    var marcaActual = { id: null, nombre: '' };

    // Verificar que los elementos existen antes de usarlos
    if (!overlay || !form) return;

    window.abrirModalMarca = function(mode, id, marca) {
        if (!overlay || !form) {
            console.error('No se encontró el modal o formulario de marca');
            return;
        }
        
        // Limpiar estado anterior
        form.dataset.submitting = 'false';
        window.enviandoMarca = false;
        
        if (mode === 'crear') {
            titulo.textContent = 'Nueva Marca';
            form.action = '/marcas/crear';
            if (inputMarca) inputMarca.value = '';
            if (submitBtn) submitBtn.textContent = 'Crear';
            marcaOriginalNombre = '';
            marcaHasChanges = false;
            marcaEditMode = false;
            marcaCreada = false;
        } else {
            titulo.textContent = 'Editar Marca';
            form.action = '/marcas/' + id + '/actualizar';
            if (inputMarca) inputMarca.value = marca || '';
            if (submitBtn) submitBtn.textContent = 'Actualizar';
            marcaOriginalNombre = marca || '';
            marcaHasChanges = false;
            marcaEditMode = true;
        }
        actualizarEstadoSubmitMarca();
        overlay.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalMarca() {
        marcaOriginalNombre = '';
        marcaHasChanges = false;
        marcaEditMode = false;
        overlay.setAttribute('aria-hidden', 'true');
    }

    window.cerrarModalMarca = function() {
        if (marcaIsSubmitting) {
            forceCerrarModalMarca();
            return;
        }
        if (marcaHasChanges) {
            abrirModalConfirmacion(
                'Cerrar marca',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                forceCerrarModalMarca,
                false
            );
        } else {
            forceCerrarModalMarca();
        }
    };
    window.cerrarModalTiposMarca = function() {
        if (modalMarcaTipos) modalMarcaTipos.setAttribute('aria-hidden', 'true');
    };

    window.abrirModalTiposMarca = function(idMarca, nombreMarca) {
        if (!modalMarcaTipos || !bodyMarcaTipos) return;

        marcaActual.id = idMarca;
        marcaActual.nombre = nombreMarca || '';
        tituloMarcaTipos.textContent = 'Tipos de ' + marcaActual.nombre;
        
        // Limpiar tabla completa + añadir thead único
        const table = bodyMarcaTipos.parentNode;
        table.innerHTML = '';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="width: 40px;"><input type="checkbox" id="selectAllTiposMarca"></th>
                <th><label for="selectAllTiposMarca" style="cursor: pointer; margin: 0;">Seleccionar todo</label></th>
            </tr>
        `;
        const tbody = document.createElement('tbody');
        tbody.id = 'bodyMarcaTipos';
        table.appendChild(thead);
        table.appendChild(tbody);
        bodyMarcaTipos = tbody; // Re-asignar ref
        modalMarcaTipos.setAttribute('aria-hidden', 'false');

        fetch('/marcas/' + idMarca + '/tipos-vinculacion')
            .then(function(response) { return response.json(); })
            .then(function(tipos) {
                tipos.forEach(function(tipo) {
                    var tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td><input type="checkbox" class="marca-tipo-checkbox" data-id-tipo="' + tipo.idTipo + '" ' + (tipo.asociado ? 'checked' : '') + '></td>' +
                        '<td>' + tipo.nombreTipo + '</td>';
                    bodyMarcaTipos.appendChild(tr);
                });
                // Prevent bubbling
                bodyMarcaTipos.addEventListener('click', function(e) {
                    e.stopPropagation();
                }, true);

                // Individual listeners
                bodyMarcaTipos.querySelectorAll('.marca-tipo-checkbox').forEach(function(checkbox) {
                    checkbox.addEventListener('change', function() {
                        var formData = new FormData();
                        formData.append('idMarca', marcaActual.id);
                        formData.append('idTipo', this.dataset.idTipo);
                        formData.append('asociado', this.checked ? '1' : '0');
                        formData.append('_token', CrudCommon.getCsrfToken());

                        fetch('/marcas/asociar-tipo', {
                            method: 'POST',
                            body: formData
                        })
                        .then(function(response) {
                            if (!response.ok) {
                                throw new Error('No se pudo actualizar la relación.');
                            }
                            return response.json();
                        })
                        .catch(function(error) {
                            if (window.currentToggleMassive) {
                                window.toggleMassiveErrors = (window.toggleMassiveErrors || 0) + 1;
                                return;
                            }
                            checkbox.checked = !checkbox.checked;
                            mostrarToast(error.message || 'Error al vincular tipo', 'error');
                        });
                    });
                });

                // Select-all handler
                const selectAll = document.getElementById('selectAllTiposMarca');
                if (selectAll) {
                selectAll.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.marca-tipo-checkbox');
                    const targetState = this.checked;
                    let isToggleMassive = true;
                    checkboxes.forEach(cb => {
                        if (cb.checked !== targetState) {
                            cb.checked = targetState;
                            cb.dispatchEvent(new Event('change', { 
                                bubbles: true,
                                detail: { isToggleMassive }
                            }));
                        }
                    });
                });
                    
                    // Update state (incl indeterminate)
                    const updateSelectAll = () => {
                        const checkboxes = document.querySelectorAll('.marca-tipo-checkbox');
                        const checkedCount = document.querySelectorAll('.marca-tipo-checkbox:checked').length;
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
                    document.querySelectorAll('.marca-tipo-checkbox').forEach(cb => {
                        cb.addEventListener('change', updateSelectAll);
                    });
                }
            });
    };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalMarca(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalMarca();
        if (e.key === 'Escape' && modalMarcaTipos && modalMarcaTipos.getAttribute('aria-hidden') === 'false') cerrarModalTiposMarca();
    });

    var selectedMarcaInfo = document.getElementById('selectedMarcaInfo');
    var btnEditarMarca = document.getElementById('btnEditarMarca');
    var btnEliminarMarca = document.getElementById('btnEliminarMarca');
    var formEliminarMarca = document.getElementById('formEliminarMarca');
    var seleccion = CrudCommon.createRowSelection({
        rowSelector: '#tablaMarcas tbody tr[data-id]',
        selectedInfo: selectedMarcaInfo,
        buttons: [btnEditarMarca, btnEliminarMarca],
        outsideIgnoreSelectors: ['#btnEliminarMarca', '#btnEditarMarca'],
        formatInfo: function(row) {
            return row
                ? 'Marca seleccionada: ' + row.dataset.marca + ' (ID ' + row.dataset.id + ')'
                : 'Ninguna marca seleccionada';
        },
        onDoubleClick: function(row) {
            abrirModalMarca('editar', row.dataset.id, row.dataset.marca);
        },
    });

    if (btnEditarMarca) {
        btnEditarMarca.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return;
            abrirModalMarca('editar', row.dataset.id, row.dataset.marca);
        });
    }

    if (btnEliminarMarca) {
        btnEliminarMarca.addEventListener('click', function() {
            CrudCommon.confirmSelectedRow({
                getRow: seleccion.getSelectedRow,
                emptyMessage: 'Selecciona una marca válida primero',
                alertType: 'toast',
                title: 'Eliminar marca',
                message: function(row) {
                    return '¿Estás seguro de eliminar la marca "' + row.dataset.marca + '"?';
                },
                onConfirm: function(row) {
                    var idNum = parseInt(row.dataset.id, 10);
                    mostrarToast('Eliminando la marca...', 'warning');
                    formEliminarMarca.action = '/marcas/' + idNum + '/baja';
                    formEliminarMarca.submit();
                },
            });
        });
    }

    document.querySelectorAll('.btn-ver-tipos-marca').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalTiposMarca(btn.dataset.id, btn.dataset.nombre);
        });
    });

    if (modalMarcaTipos) {
        modalMarcaTipos.addEventListener('click', function(e) {
            if (e.target === modalMarcaTipos) cerrarModalTiposMarca();
        });
    }

    if (inputMarca) {
        inputMarca.addEventListener('input', actualizarEstadoSubmitMarca);
    }

    CrudCommon.initSearchInput();

    var params = new URLSearchParams(window.location.search);
    var abrirTiposMarca = params.get('abrirTiposMarca');
    var marcaNombre = params.get('marcaNombre');
    if (abrirTiposMarca) {
        abrirModalTiposMarca(abrirTiposMarca, marcaNombre || 'Marca');
        params.delete('abrirTiposMarca');
        params.delete('marcaNombre');
        var nuevaUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', nuevaUrl);
    }

    CrudCommon.initSortableHeaders('#tablaMarcas th.sortable');
    CrudCommon.bindConfirmForms('#tablaMarcas .form-baja', {
        title: 'Eliminar marca',
        message: function(form) {
            var marcaNombre = form.closest('tr').querySelector('td:nth-child(2)').textContent;
            return '¿Estás seguro de eliminar la marca "' + marcaNombre + '"?';
        },
        onConfirm: function(form) {
            mostrarToast('Eliminando la marca...', 'warning');
            form.submit();
        },
    });

    }); // Fin DOMContentLoaded

})();

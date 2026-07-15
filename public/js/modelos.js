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
    var modeloOriginalValues = {};
    var modeloHasChanges = false;
    var modeloEditMode = false;
    var modeloIsSubmitting = false;
    
    if (!overlay || !form) return;
    if (form.dataset.boundBy && form.dataset.boundBy !== 'modelos') return;

    function leerEstadoModelo() {
        return {
            modelo: inputModelo ? inputModelo.value : '',
            idMarca: selectMarca ? selectMarca.value : '',
            idTipo: selectTipo ? selectTipo.value : '',
        };
    }

    function actualizarEstadoSubmitModelo() {
        if (!submitBtn) return;
        var actual = leerEstadoModelo();
        var tieneDatosMinimos = !!(actual.modelo.trim() && actual.idMarca && actual.idTipo);

        modeloHasChanges = Object.keys(modeloOriginalValues).some(function(key) {
            return (actual[key] || '') !== (modeloOriginalValues[key] || '');
        });
        if (!modeloEditMode) {
            submitBtn.disabled = !tieneDatosMinimos;
            submitBtn.classList.toggle('disabled', !tieneDatosMinimos);
            if (tieneDatosMinimos) {
                submitBtn.removeAttribute('title');
            } else {
                submitBtn.title = 'Bloqueado: completa modelo, marca y tipo';
            }
            return;
        }

        submitBtn.disabled = !modeloHasChanges;
        submitBtn.classList.toggle('disabled', !modeloHasChanges);
        if (modeloHasChanges) {
            submitBtn.removeAttribute('title');
        } else {
            submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
        }
    }

    async function ejecutarSubmitModelo() {
        modeloIsSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardar';
        
        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                mostrarToast('Operación completada correctamente', 'success');
                forceCerrarModalModelo();
                ejecutarTrasToastVisible(function() {
                    location.reload();
                });
                return;
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en el servidor');
            }
            
            mostrarToast(data.message || 'Operación completada', 'success');
            if (form.action.includes('/crear') && data && data.id != null && typeof CrudCommon.setPersistedSelection === 'function') {
                CrudCommon.setPersistedSelection('#tablaModelos tbody tr[data-id]', data.id);
            }
            forceCerrarModalModelo();
            ejecutarTrasToastVisible(function() {
                location.reload();
            });
        } catch (error) {
            mostrarToast('Error: ' + error.message, 'error');
        } finally {
            modeloIsSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar';
        }
    }

// AJAX para form submit - maneja HTML/JSON
    form.dataset.boundBy = 'modelos';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (submitBtn.disabled || modeloIsSubmitting) return;
        var esCrear = form.action.includes('/crear');
        var nombreActual = inputModelo ? inputModelo.value.trim() : '';
        abrirModalConfirmacion(
            esCrear ? 'Crear modelo' : 'Actualizar modelo',
            esCrear
                ? '¿Desea crear el modelo "' + nombreActual + '"?'
                : '¿Desea actualizar el modelo a "' + nombreActual + '"?',
            function() {
                ejecutarSubmitModelo();
            },
            false,
            false
        );
    });

    // Verificar que los elementos existen antes de usarlos
    if (!overlay || !form) return;

    function cargarMarcasPorTipo(idTipo, previousMarcaValue) {
        if (!selectMarca) return Promise.resolve();

        var url = '/marcas/api';
        if (idTipo) {
            url += '?idTipo=' + encodeURIComponent(idTipo);
        }

        return fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                var previousValue = previousMarcaValue || '';
                selectMarca.innerHTML = '<option value="">— Seleccionar marca —</option>';
                marcas.forEach(function(marca) {
                    var option = document.createElement('option');
                    option.value = marca.idMarca;
                    option.textContent = marca.marca;
                    selectMarca.appendChild(option);
                });
                // Restaurar valor anterior si existe en la nueva lista
                if (previousValue && Array.from(selectMarca.options).some(opt => opt.value === previousValue)) {
                    selectMarca.value = previousValue;
                }
            });
    }

    function cargarTiposPorMarca(idMarca, previousTipoValue) {
        if (!selectTipo) return Promise.resolve();

        var url = '/tipos/api';
        if (idMarca) {
            url += '?idMarca=' + encodeURIComponent(idMarca);
        }

        return fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(tipos) {
                var previousValue = previousTipoValue || '';
                selectTipo.innerHTML = '<option value="">— Seleccionar tipo —</option>';
                tipos.forEach(function(tipo) {
                    var option = document.createElement('option');
                    option.value = tipo.idTipo;
                    option.textContent = tipo.nombreTipo;
                    selectTipo.appendChild(option);
                });
                // Restaurar valor anterior si existe en la nueva lista
                if (previousValue && Array.from(selectTipo.options).some(opt => opt.value === previousValue)) {
                    selectTipo.value = previousValue;
                }
            });
    }

    window.abrirModalModelo = function(mode, id, modelo, idMarca, idTipo) {
        if (!overlay || !form) {
            console.error('No se encontró el modal o formulario de modelo');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Modelo';
            form.action = '/modelos/crear';
            if (inputModelo) inputModelo.value = '';
            // Cargar listas completas inicialmente
            cargarTiposPorMarca('', '');
            cargarMarcasPorTipo('', '');
            if (submitBtn) submitBtn.textContent = 'Guardar';
            modeloOriginalValues = {
                modelo: '',
                idMarca: '',
                idTipo: '',
            };
            modeloHasChanges = false;
            modeloEditMode = false;
        } else {
            titulo.textContent = 'Editar Modelo';
            form.action = '/modelos/' + id + '/actualizar';
            if (inputModelo) inputModelo.value = modelo || '';
            cargarTiposPorMarca(idMarca || '', idTipo || '');
            cargarMarcasPorTipo(idTipo || '', idMarca || '');
            if (submitBtn) submitBtn.textContent = 'Guardar';
            modeloOriginalValues = {
                modelo: modelo || '',
                idMarca: String(idMarca || ''),
                idTipo: String(idTipo || ''),
            };
            modeloHasChanges = false;
            modeloEditMode = true;
        }
        setTimeout(actualizarEstadoSubmitModelo, 0);
        overlay.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalModelo() {
        modeloOriginalValues = {};
        modeloHasChanges = false;
        modeloEditMode = false;
        overlay.setAttribute('aria-hidden', 'true');
    }

    window.cerrarModalModelo = function() {
        if (modeloIsSubmitting) {
            forceCerrarModalModelo();
            return;
        }
        if (!modeloHasChanges) {
            forceCerrarModalModelo();
            return;
        }
        abrirModalConfirmacion(
            'Cerrar modelo',
            'Se van a perder los cambios realizados. ¿Desea continuar?',
            forceCerrarModalModelo,
            false,
            true
        );
    };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalModelo(); });

    var selectedModeloInfo = document.getElementById('selectedModeloInfo');
    var btnEditarModelo = document.getElementById('btnEditarModelo');
    var btnEliminarModelo = document.getElementById('btnEliminarModelo');
    var formEliminarModelo = document.getElementById('formEliminarModelo');
    var seleccion = CrudCommon.createRowSelection({
        rowSelector: '#tablaModelos tbody tr[data-id]',
        selectedInfo: selectedModeloInfo,
        buttons: [btnEditarModelo, btnEliminarModelo],
        outsideIgnoreSelectors: ['#btnEliminarModelo', '#btnEditarModelo'],
        formatInfo: function(row) {
            return row
                ? 'Modelo seleccionado: ' + row.dataset.modelo + ' (ID ' + row.dataset.id + ')'
                : 'Ningún modelo seleccionado';
        },
        onDoubleClick: function(row) {
            abrirModalModelo('editar', row.dataset.id, row.dataset.modelo, row.dataset.idMarca, row.dataset.idTipo);
        },
    });

    if (btnEditarModelo) {
        btnEditarModelo.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return;
            abrirModalModelo('editar', row.dataset.id, row.dataset.modelo, row.dataset.idMarca, row.dataset.idTipo);
        });
    }

    if (btnEliminarModelo) {
        btnEliminarModelo.addEventListener('click', function() {
            CrudCommon.confirmSelectedRow({
                getRow: seleccion.getSelectedRow,
                emptyMessage: 'Selecciona un modelo válido primero',
                alertType: 'toast',
                title: 'Eliminar modelo',
                message: function(row) {
                    return '¿Estás seguro de eliminar el modelo "' + row.dataset.modelo + '"?';
                },
                onConfirm: function(row) {
                    mostrarToast('Eliminando el modelo...', 'warning');
                    formEliminarModelo.action = '/modelos/' + parseInt(row.dataset.id, 10) + '/baja';
                    formEliminarModelo.submit();
                },
            });
        });
    }

    if (selectTipo && selectTipo.dataset.modeloTipoBound !== '1') {
        selectTipo.dataset.modeloTipoBound = '1';
        selectTipo.addEventListener('change', function() {
            var previousMarcaValue = selectMarca ? selectMarca.value : '';
            cargarMarcasPorTipo(this.value, previousMarcaValue);
            setTimeout(actualizarEstadoSubmitModelo, 0);
        });
    }

    // Removido: filtrado bidireccional para evitar conflicto de valores
    // if (selectMarca && selectMarca.dataset.modeloMarcaBound !== '1') {
    //     selectMarca.dataset.modeloMarcaBound = '1';
    //     selectMarca.addEventListener('change', function() {
    //         var previousTipoValue = selectTipo ? selectTipo.value : '';
    //         cargarTiposPorMarca(this.value, previousTipoValue);
    //         setTimeout(actualizarEstadoSubmitModelo, 0);
    //     });
    // }

    if (inputModelo) inputModelo.addEventListener('input', actualizarEstadoSubmitModelo);
    if (selectMarca) selectMarca.addEventListener('change', actualizarEstadoSubmitModelo);
    if (selectTipo) selectTipo.addEventListener('change', actualizarEstadoSubmitModelo);

    CrudCommon.initSearchInput();
    CrudCommon.initSortableHeaders('#tablaModelos th.sortable');
    CrudCommon.bindConfirmForms('#tablaModelos .form-baja', {
        title: 'Eliminar modelo',
        message: function(form) {
            var modeloNombre = form.closest('tr').querySelector('td:nth-child(2)').textContent;
            return '¿Estás seguro de eliminar el modelo "' + modeloNombre + '"?';
        },
        onConfirm: function(form) {
            mostrarToast('Eliminando el modelo...', 'warning');
            form.submit();
        },
    });

    }); // Fin DOMContentLoaded

})();

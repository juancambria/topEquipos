(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlay = document.getElementById('modalTipo');
    var form = document.getElementById('formTipo');
    var titulo = document.getElementById('modalTipoTitulo');
    var inputNombre = document.getElementById('tipoNombre');
    var submitBtn = document.getElementById('modalTipoSubmit');
    var tipoOriginalNombre = '';
    var tipoHasChanges = false;
    var tipoEditMode = false;
    var tipoIsSubmitting = false;

    if (!overlay || !form) return;
    if (form.dataset.boundBy && form.dataset.boundBy !== 'tipos') return;
    form.dataset.boundBy = 'tipos';

    function actualizarEstadoSubmitTipo() {
        if (!submitBtn) return;
        if (!tipoEditMode) {
            tipoHasChanges = inputNombre.value.trim() !== '';
            submitBtn.disabled = !tipoHasChanges;
            submitBtn.classList.toggle('disabled', !tipoHasChanges);
            if (tipoHasChanges) {
                submitBtn.removeAttribute('title');
            } else {
                submitBtn.title = 'Bloqueado: completa el nombre para habilitar';
            }
            return;
        }

        tipoHasChanges = inputNombre.value.trim() !== tipoOriginalNombre.trim();
        submitBtn.disabled = !tipoHasChanges;
        submitBtn.classList.toggle('disabled', !tipoHasChanges);
        if (tipoHasChanges) {
            submitBtn.removeAttribute('title');
        } else {
            submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
        }
    }

    async function ejecutarSubmitTipo() {
        tipoIsSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        try {
            const formData = new FormData(form);
            formData.append('_token', CrudCommon.getCsrfToken());
            await fetch(form.action, {
                method: 'POST',
                body: formData
            });
            // mostrarToast('Operación completada correctamente', 'success');
            forceCerrarModalTipo();
        } catch (error) {
            console.error('Submit error:', error);
            mostrarToast('Error al guardar', 'error');
        } finally {
            tipoIsSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = form.action.includes('/crear') ? 'Crear' : 'Actualizar';
            setTimeout(() => location.reload(), 1500);
        }
    }

    // AJAX para form submit - SOLO fallback toast + refresh
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (submitBtn.disabled || tipoIsSubmitting) return;
        var esCrear = form.action.includes('/crear');
        var nombreActual = inputNombre.value.trim();

        abrirModalConfirmacion(
            esCrear ? 'Crear tipo' : 'Actualizar tipo',
            esCrear
                ? '¿Desea crear el tipo "' + nombreActual + '"?'
                : '¿Desea actualizar el tipo a "' + nombreActual + '"?',
            function() {
                ejecutarSubmitTipo();
            },
            false,
            false
        );
    });

    window.abrirModalTipo = function(mode, id, nombre) {
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Tipo';
            form.action = '/tipos/crear';
            inputNombre.value = '';
            submitBtn.textContent = 'Crear';
            tipoOriginalNombre = '';
            tipoHasChanges = false;
            tipoEditMode = false;
        } else {
            titulo.textContent = 'Editar Tipo';
            form.action = '/tipos/' + id + '/actualizar';
            inputNombre.value = nombre || '';
            submitBtn.textContent = 'Actualizar';
            tipoOriginalNombre = nombre || '';
            tipoHasChanges = false;
            tipoEditMode = true;
        }
        actualizarEstadoSubmitTipo();
        overlay.setAttribute('aria-hidden', 'false');
    };

    function forceCerrarModalTipo() {
        tipoOriginalNombre = '';
        tipoHasChanges = false;
        tipoEditMode = false;
        overlay.setAttribute('aria-hidden', 'true');
    }

    window.cerrarModalTipo = function() {
        if (tipoIsSubmitting) {
            forceCerrarModalTipo();
            return;
        }
        if (!tipoHasChanges) {
            forceCerrarModalTipo();
            return;
        }
        abrirModalConfirmacion(
            'Cerrar tipo',
            'Se van a perder los cambios realizados. ¿Desea continuar?',
            forceCerrarModalTipo,
            false,
            true
        );
    };

    inputNombre.addEventListener('input', actualizarEstadoSubmitTipo);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalTipo(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalTipo();
    });

    var btnEliminarTipo = document.getElementById('btnEliminarTipo');
    var formEliminarTipo = document.getElementById('formEliminarTipo');
    var selectedTipoInfo = document.getElementById('selectedTipoInfo');

    var btnEditarTipo = document.getElementById('btnEditarTipo');
    var seleccion = CrudCommon.createRowSelection({
        rowSelector: '#tablaTipos tbody tr[data-id]',
        selectedInfo: selectedTipoInfo,
        buttons: [btnEliminarTipo, btnEditarTipo],
        outsideIgnoreSelectors: ['#btnEliminarTipo', '#btnEditarTipo'],
        formatInfo: function(row) {
            return row
                ? 'Tipo seleccionado: ' + row.dataset.nombre + ' (ID ' + row.dataset.id + ')'
                : 'Ningún tipo seleccionado';
        },
        onDoubleClick: function(row) {
            abrirModalTipo('editar', row.dataset.id, row.dataset.nombre);
        },
    });

    if (btnEditarTipo) {
        btnEditarTipo.addEventListener('click', function() {
            var row = seleccion.getSelectedRow();
            if (!row) return;
            abrirModalTipo('editar', row.dataset.id, row.dataset.nombre);
        });
    }

    if (btnEliminarTipo) {
        btnEliminarTipo.addEventListener('click', function() {
            CrudCommon.confirmSelectedRow({
                getRow: seleccion.getSelectedRow,
                emptyMessage: 'Selecciona un tipo válido primero',
                alertType: 'toast',
                title: 'Eliminar tipo',
                message: function(row) {
                    return '¿Estás seguro de eliminar el tipo "' + row.dataset.nombre + '"?';
                },
                onConfirm: function(row) {
                    mostrarToast('Eliminando el tipo...', 'warning');
                    formEliminarTipo.action = '/tipos/' + parseInt(row.dataset.id, 10) + '/baja';
                    formEliminarTipo.submit();
                },
            });
        });
    }

    CrudCommon.initSearchInput();
    CrudCommon.initSortableHeaders('#tablaTipos th.sortable');
    CrudCommon.bindConfirmForms('#tablaTipos .form-baja', {
        title: 'Eliminar tipo',
        message: function(form) {
            var tipoNombre = form.closest('tr').querySelector('td:nth-child(2)').textContent;
            return '¿Estás seguro de eliminar el tipo "' + tipoNombre + '"?';
        },
        onConfirm: function(form) {
            mostrarToast('Eliminando el tipo...', 'warning');
            form.submit();
        },
    });

    }); // Fin DOMContentLoaded

})();

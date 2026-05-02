(function() {
    'use strict';

    // ============================================================
    // GUARDAR REFERENCIA AL FETCH ORIGINAL (ANTES DE INTERCEPTORES)
    // ============================================================
    var originalFetch = window.fetch;

    // ============================================================
    // VARIABLES GLOBALES PARA RASTREAR LA ÚLTIMA ENTIDAD CREADA
    // ============================================================
    window.ultimaMarcaCreada = null;
    window.ultimoModeloCreado = null;
    window.ultimoTipoCreado = null;
    window.ultimaUbicacionCreada = null;
    window.ultimoSectorCreado = null;
    window.overlayEquipoOculto = false;
    var contextoEntidadesInline = !!document.getElementById('modalEquipo') || !!document.getElementById('modalEquipoFactura');

    /** En vista embebida (?window=1) el servidor debe servir solo el contenido, sin topbar/barra de tareas duplicada. */
    function urlHistorialEquipo(equipoId) {
        var path = '/historial/equipo/' + equipoId;
        if (document.body && document.body.classList.contains('window-embedded')) {
            path += (path.indexOf('?') >= 0 ? '&' : '?') + 'window=1';
        }
        return path;
    }

    window.__modalEntidadState = window.__modalEntidadState || {
        marca: { editMode: false, hasChanges: false, original: {}, saving: false },
        modelo: { editMode: false, hasChanges: false, original: {}, saving: false },
        tipo: { editMode: false, hasChanges: false, original: {}, saving: false }
    };

    function setEntidadSubmitState(submitBtn, enabled) {
        if (!submitBtn) return;
        submitBtn.disabled = !enabled;
        submitBtn.classList.toggle('disabled', !enabled);
        if (enabled) {
            submitBtn.removeAttribute('title');
        } else {
            submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
        }
    }

    function restoreOverlayEquipoIfNeeded() {
        if (window.overlayEquipoOculto) {
            var overlayEquipo = document.getElementById('modalEquipo');
            if (overlayEquipo) {
                overlayEquipo.style.display = 'flex';
                overlayEquipo.classList.add('show');
                overlayEquipo.setAttribute('aria-hidden', 'false');
            }
            window.overlayEquipoOculto = false;
        }
    }

    function forceCerrarEntidadModal(nombre, modalId) {
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        if (window.__modalEntidadState[nombre]) {
            window.__modalEntidadState[nombre].editMode = false;
            window.__modalEntidadState[nombre].hasChanges = false;
            window.__modalEntidadState[nombre].original = {};
            window.__modalEntidadState[nombre].saving = false;
        }
        restoreOverlayEquipoIfNeeded();
    }

    function confirmarOCerrarEntidad(nombre, modalId, titulo) {
        var state = window.__modalEntidadState[nombre];
        if (state && state.saving) {
            forceCerrarEntidadModal(nombre, modalId);
            return;
        }
        if (!state || !state.hasChanges) {
            forceCerrarEntidadModal(nombre, modalId);
            return;
        }
        abrirModalConfirmacion(
            titulo,
            'Se van a perder los cambios realizados. ¿Desea continuar?',
            function() { forceCerrarEntidadModal(nombre, modalId); },
            false,
            true
        );
    }

    function confirmarActualizarEntidad(titulo, callback) {
        abrirModalConfirmacion(
            titulo,
            '¿Estás seguro de guardar los cambios?',
            callback,
            false,
            false
        );
    }

    function actualizarDirtyMarcaEquipo() {
        var inputMarca = document.getElementById('marcaNombre');
        var submitBtn = document.getElementById('modalMarcaSubmit');
        var state = window.__modalEntidadState.marca;
        if (!inputMarca || !submitBtn || !state) return;
        if (!state.editMode) {
            state.hasChanges = inputMarca.value.trim() !== '';
            setEntidadSubmitState(submitBtn, true);
            return;
        }
        state.hasChanges = inputMarca.value.trim() !== String(state.original.marca || '').trim();
        setEntidadSubmitState(submitBtn, state.hasChanges);
    }

    function leerEstadoModeloEquipo() {
        return {
            modelo: document.getElementById('modeloNombre') ? document.getElementById('modeloNombre').value : '',
            idMarca: document.getElementById('modeloIdMarca') ? document.getElementById('modeloIdMarca').value : '',
            idTipo: document.getElementById('modeloIdTipo') ? document.getElementById('modeloIdTipo').value : ''
        };
    }

    function obtenerContextoModeloDesdeEquipo() {
        var modalFacturaAbierto = document.getElementById('modalEquipoFactura')?.getAttribute('aria-hidden') === 'false';
        if (modalFacturaAbierto) {
            return {
                idTipo: document.getElementById('equipoFacturaIdTipo') ? document.getElementById('equipoFacturaIdTipo').value : '',
                idMarca: document.getElementById('equipoFacturaIdMarca') ? document.getElementById('equipoFacturaIdMarca').value : ''
            };
        }

        return {
            idTipo: document.getElementById('equipoIdTipo') ? document.getElementById('equipoIdTipo').value : '',
            idMarca: document.getElementById('equipoIdMarca') ? document.getElementById('equipoIdMarca').value : ''
        };
    }

    function actualizarDirtyModeloEquipo() {
        var submitBtn = document.getElementById('modalModeloSubmit');
        var state = window.__modalEntidadState.modelo;
        if (!submitBtn || !state) return;
        if (!state.editMode) {
            var inputModelo = document.getElementById('modeloNombre');
            state.hasChanges = !!(inputModelo && inputModelo.value.trim() !== '');
            setEntidadSubmitState(submitBtn, true);
            return;
        }
        var actual = leerEstadoModeloEquipo();
        state.hasChanges = Object.keys(state.original).some(function(key) {
            return String(actual[key] || '') !== String(state.original[key] || '');
        });
        setEntidadSubmitState(submitBtn, state.hasChanges);
    }

    function actualizarDirtyTipoEquipo() {
        var inputTipo = document.getElementById('tipoNombre');
        var submitBtn = document.getElementById('modalTipoSubmit');
        var state = window.__modalEntidadState.tipo;
        if (!inputTipo || !submitBtn || !state) return;
        if (!state.editMode) {
            state.hasChanges = inputTipo.value.trim() !== '';
            setEntidadSubmitState(submitBtn, true);
            return;
        }
        state.hasChanges = inputTipo.value.trim() !== String(state.original.nombre || '').trim();
        setEntidadSubmitState(submitBtn, state.hasChanges);
    }

    // ============================================================
    // FUNCIONES GLOBALES PARA CERRAR MODALES DE ENTIDADES
    // Estas funciones deben estar disponibles antes de ser usadas
    // ============================================================
    
window.cerrarModalMarca = function() {
        confirmarOCerrarEntidad('marca', 'modalMarca', 'Cerrar marca');
    };

    window.cerrarModalModelo = function() {
        confirmarOCerrarEntidad('modelo', 'modalModelo', 'Cerrar modelo');
    };

    window.cerrarModalUbicacion = function() {
        var modal = document.getElementById('modalUbicacion');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        // Restaurar overlay del equipo si estaba oculto
        if (window.overlayEquipoOculto) {
            var overlayEquipo = document.getElementById('modalEquipo');
            if (overlayEquipo) {
                overlayEquipo.style.display = 'flex';
                overlayEquipo.classList.add('show');
                overlayEquipo.setAttribute('aria-hidden', 'false');
            }
            window.overlayEquipoOculto = false;
        }
    };

    window.cerrarModalSector = function() {
        var modal = document.getElementById('modalSector');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        // Restaurar overlay del equipo si estaba oculto
        if (window.overlayEquipoOculto) {
            var overlayEquipo = document.getElementById('modalEquipo');
            if (overlayEquipo) {
                overlayEquipo.style.display = 'flex';
                overlayEquipo.classList.add('show');
                overlayEquipo.setAttribute('aria-hidden', 'false');
            }
            window.overlayEquipoOculto = false;
        }
    };

    window.cerrarModalTipo = function() {
        confirmarOCerrarEntidad('tipo', 'modalTipo', 'Cerrar tipo');
    };

    // Funciones para abrir modales de entidades

    if (contextoEntidadesInline) {
    window.abrirModalMarca = function(mode, id, marca) {
        // Cerrar cualquier otro modal de entidad primero
        window.cerrarModalModelo();
        window.cerrarModalUbicacion();
        window.cerrarModalSector();
        window.cerrarModalTipo();
        
        // Ocultar overlay del modal de equipo si existe
        var overlayEquipo = document.getElementById('modalEquipo');
        if (overlayEquipo && overlayEquipo.classList.contains('show')) {
            overlayEquipo.style.display = 'none';
            window.overlayEquipoOculto = true;
        }
        
        var modal = document.getElementById('modalMarca');
        var form = document.getElementById('formMarca');
        var titulo = document.getElementById('modalMarcaTitulo');
        var inputMarca = document.getElementById('marcaNombre');
        var submitBtn = document.getElementById('modalMarcaSubmit');
        
        if (!modal || !form) {
            console.error('No se encontró el modal o formulario de marca');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nueva Marca';
            form.reset();
            submitBtn.textContent = 'Crear';
            window.__modalEntidadState.marca = { editMode: false, hasChanges: false, original: {}, saving: false };
        } else {
            titulo.textContent = 'Editar Marca';
            if (inputMarca) inputMarca.value = marca || '';
            submitBtn.textContent = 'Actualizar';
            window.__modalEntidadState.marca = { editMode: true, hasChanges: false, original: { marca: marca || '' }, saving: false };
        }
        actualizarDirtyMarcaEquipo();
        
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.style.zIndex = '130000';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };


    window.abrirModalModelo = function(mode, id, modelo, idMarca, idTipo) {
        // Cerrar cualquier otro modal de entidad primero
        window.cerrarModalMarca();
        window.cerrarModalUbicacion();
        window.cerrarModalSector();
        window.cerrarModalTipo();
        
        // Ocultar overlay del modal de equipo si existe
        var overlayEquipo = document.getElementById('modalEquipo');
        if (overlayEquipo && overlayEquipo.classList.contains('show')) {
            overlayEquipo.style.display = 'none';
            window.overlayEquipoOculto = true;
        }
        
        var modal = document.getElementById('modalModelo');
        var form = document.getElementById('formModelo');
        var titulo = document.getElementById('modalModeloTitulo');
        var inputModelo = document.getElementById('modeloNombre');
        var selectMarca = document.getElementById('modeloIdMarca');
        var selectTipo = document.getElementById('modeloIdTipo');
        var submitBtn = document.getElementById('modalModeloSubmit');
        
        if (!modal || !form) {
            console.error('No se encontró el modal o formulario de modelo');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Modelo';
            form.reset();
            var contextoModelo = obtenerContextoModeloDesdeEquipo();
            var idTipoActual = contextoModelo.idTipo || '';
            var idMarcaActual = contextoModelo.idMarca || '';
            cargarTiposEnSelectModelo(idMarcaActual || '', idTipoActual || '');
            cargarMarcasEnSelectModelo(idTipoActual || '', idMarcaActual || '');
            if (inputModelo) inputModelo.value = '';
            submitBtn.textContent = 'Crear';
            window.__modalEntidadState.modelo = {
                editMode: false,
                hasChanges: false,
                original: {
                    modelo: '',
                    idMarca: String(idMarcaActual || ''),
                    idTipo: String(idTipoActual || '')
                },
                saving: false
            };
        } else {
            titulo.textContent = 'Editar Modelo';
            cargarTiposEnSelectModelo(idMarca || '', idTipo || '');
            cargarMarcasEnSelectModelo(idTipo || '', idMarca || '');
            if (inputModelo) inputModelo.value = modelo || '';
            submitBtn.textContent = 'Actualizar';
            window.__modalEntidadState.modelo = {
                editMode: true,
                hasChanges: false,
                original: {
                    modelo: modelo || '',
                    idMarca: String(idMarca || ''),
                    idTipo: String(idTipo || '')
                },
                saving: false
            };
        }
        setTimeout(actualizarDirtyModeloEquipo, 0);
        
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.style.zIndex = '130000';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };
    }

    // Función para cargar marcas en el select del modal de modelo
    function cargarMarcasEnSelectModelo(idTipo, idMarcaSeleccionada) {
        var selectMarca = document.getElementById('modeloIdMarca');
        if (!selectMarca) return;

        var url = '/marcas/api';
        if (idTipo) {
            url += '?idTipo=' + encodeURIComponent(idTipo);
        }

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                var marcaObjetivo = String(idMarcaSeleccionada || '');
                selectMarca.innerHTML = '<option value="">— Seleccionar marca —</option>';
                marcas.forEach(function(marca) {
                    var option = document.createElement('option');
                    option.value = marca.idMarca;
                    option.textContent = marca.marca;
                    selectMarca.appendChild(option);
                });
                if (marcaObjetivo && Array.from(selectMarca.options).some(function(option) {
                    return option.value === marcaObjetivo;
                })) {
                    selectMarca.value = marcaObjetivo;
                }
            })
            .catch(function(error) {
                console.error('Error al cargar marcas:', error);
            });
    }

    // Función para cargar tipos en el select del modal de modelo
    function cargarTiposEnSelectModelo(idMarca, idTipoSeleccionado) {
        var selectTipo = document.getElementById('modeloIdTipo');
        if (!selectTipo) return;

        var url = '/tipos/api';
        if (idMarca) {
            url += '?idMarca=' + encodeURIComponent(idMarca);
        }

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(tipos) {
                var tipoObjetivo = String(idTipoSeleccionado || '');
                selectTipo.innerHTML = '<option value="">— Seleccionar tipo —</option>';
                tipos.forEach(function(tipo) {
                    var option = document.createElement('option');
                    option.value = tipo.idTipo;
                    option.textContent = tipo.nombreTipo;
                    selectTipo.appendChild(option);
                });
                if (tipoObjetivo && Array.from(selectTipo.options).some(function(option) {
                    return option.value === tipoObjetivo;
                })) {
                    selectTipo.value = tipoObjetivo;
                }
            })
            .catch(function(error) {
                console.error('Error al cargar tipos:', error);
            });
    }

    var selectMarcaModelo = document.getElementById('modeloIdMarca');
    var selectTipoModelo = document.getElementById('modeloIdTipo');

    if (contextoEntidadesInline && selectTipoModelo && selectTipoModelo.dataset.equiposModeloTipoBound !== '1') {
        selectTipoModelo.dataset.equiposModeloTipoBound = '1';
        selectTipoModelo.addEventListener('change', function() {
            var marcaActual = selectMarcaModelo ? selectMarcaModelo.value : '';
            cargarMarcasEnSelectModelo(this.value, marcaActual);
            setTimeout(actualizarDirtyModeloEquipo, 0);
        });
    }

    if (contextoEntidadesInline && selectMarcaModelo && selectMarcaModelo.dataset.equiposModeloMarcaBound !== '1') {
        selectMarcaModelo.dataset.equiposModeloMarcaBound = '1';
        selectMarcaModelo.addEventListener('change', function() {
            var tipoActual = selectTipoModelo ? selectTipoModelo.value : '';
            cargarTiposEnSelectModelo(this.value, tipoActual);
            setTimeout(actualizarDirtyModeloEquipo, 0);
        });
    }

    var inputMarcaModalEquipo = document.getElementById('marcaNombre');
    if (inputMarcaModalEquipo && inputMarcaModalEquipo.dataset.equiposDirtyBound !== '1') {
        inputMarcaModalEquipo.dataset.equiposDirtyBound = '1';
        inputMarcaModalEquipo.addEventListener('input', actualizarDirtyMarcaEquipo);
    }
    var inputModeloModalEquipo = document.getElementById('modeloNombre');
    if (inputModeloModalEquipo && inputModeloModalEquipo.dataset.equiposDirtyBound !== '1') {
        inputModeloModalEquipo.dataset.equiposDirtyBound = '1';
        inputModeloModalEquipo.addEventListener('input', actualizarDirtyModeloEquipo);
    }
    if (selectMarcaModelo && selectMarcaModelo.dataset.equiposDirtyBound !== '1') {
        selectMarcaModelo.dataset.equiposDirtyBound = '1';
        selectMarcaModelo.addEventListener('change', actualizarDirtyModeloEquipo);
    }
    if (selectTipoModelo && selectTipoModelo.dataset.equiposDirtyBound !== '1') {
        selectTipoModelo.dataset.equiposDirtyBound = '1';
        selectTipoModelo.addEventListener('change', actualizarDirtyModeloEquipo);
    }


    window.abrirModalUbicacion = function(mode, id, nombre) {
        // Cerrar cualquier otro modal de entidad primero
        window.cerrarModalMarca();
        window.cerrarModalModelo();
        window.cerrarModalSector();
        window.cerrarModalTipo();
        
        // Ocultar overlay del modal de equipo si existe
        var overlayEquipo = document.getElementById('modalEquipo');
        if (overlayEquipo && overlayEquipo.classList.contains('show')) {
            overlayEquipo.style.display = 'none';
            window.overlayEquipoOculto = true;
        }
        
        var modal = document.getElementById('modalUbicacion');
        var form = document.getElementById('formUbicacion');
        var titulo = document.getElementById('modalUbicacionTitulo');
        var inputNombre = document.getElementById('ubicacionNombre');
        var submitBtn = document.getElementById('modalUbicacionSubmit');
        
        if (!modal || !form) {
            console.error('No se encontró el modal o formulario de ubicación');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nueva Ubicación';
            form.reset();
            if (document.getElementById('ubicacionCodigo')) document.getElementById('ubicacionCodigo').value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Ubicación';
            if (inputNombre) inputNombre.value = nombre || '';
            submitBtn.textContent = 'Actualizar';
        }
        
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.style.zIndex = '130000';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };


    window.abrirModalSector = function(mode, id, nombre, ubicacionId) {
        // Cerrar cualquier otro modal de entidad primero
        window.cerrarModalMarca();
        window.cerrarModalModelo();
        window.cerrarModalUbicacion();
        window.cerrarModalTipo();
        
        // Ocultar overlay del modal de equipo si existe
        var overlayEquipo = document.getElementById('modalEquipo');
        if (overlayEquipo && overlayEquipo.classList.contains('show')) {
            overlayEquipo.style.display = 'none';
            window.overlayEquipoOculto = true;
        }
        
        var modal = document.getElementById('modalSector');
        var form = document.getElementById('formSector');
        var titulo = document.getElementById('modalSectorTitulo');
        var inputNombre = document.getElementById('sectorNombre');
        var selectUbicacion = document.getElementById('sectorUbicacionId');
        var submitBtn = document.getElementById('modalSectorSubmit');
        
        if (!modal || !form) {
            console.error('No se encontró el modal o formulario de sector');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Sector';
            form.reset();
            // Cargar dropdown de ubicaciones vía AJAX
            cargarUbicacionesEnSelectSector();
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Sector';
            // Cargar dropdown de ubicaciones vía AJAX
            cargarUbicacionesEnSelectSector();
            if (inputNombre) inputNombre.value = nombre || '';
            setTimeout(function() {
                if (selectUbicacion) selectUbicacion.value = String(ubicacionId || '');
            }, 100);
            submitBtn.textContent = 'Actualizar';
        }
        
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.style.zIndex = '130000';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };

    window.abrirModalTipo = function(mode, id, nombre) {
        // Cerrar cualquier otro modal de entidad primero
        window.cerrarModalMarca();
        window.cerrarModalModelo();
        window.cerrarModalUbicacion();
        window.cerrarModalSector();
        
        // Ocultar overlay del modal de equipo si existe
        var overlayEquipo = document.getElementById('modalEquipo');
        if (overlayEquipo && overlayEquipo.classList.contains('show')) {
            overlayEquipo.style.display = 'none';
            window.overlayEquipoOculto = true;
        }
        
        var modal = document.getElementById('modalTipo');
        var form = document.getElementById('formTipo');
        var titulo = document.getElementById('modalTipoTitulo');
        var inputNombre = document.getElementById('tipoNombre');
        var submitBtn = document.getElementById('modalTipoSubmit');
        
        if (!modal || !form) {
            console.error('No se encontró el modal o formulario de tipo');
            return;
        }
        
        if (mode === 'crear') {
            titulo.textContent = 'Nuevo Tipo';
            form.reset();
            submitBtn.textContent = 'Crear';
            window.__modalEntidadState.tipo = { editMode: false, hasChanges: false, original: {}, saving: false };
        } else {
            titulo.textContent = 'Editar Tipo';
            if (inputNombre) inputNombre.value = nombre || '';
            submitBtn.textContent = 'Actualizar';
            window.__modalEntidadState.tipo = { editMode: true, hasChanges: false, original: { nombre: nombre || '' }, saving: false };
        }
        actualizarDirtyTipoEquipo();
        
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.style.zIndex = '130000';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };

    var inputTipoModalEquipo = document.getElementById('tipoNombre');
    if (inputTipoModalEquipo && inputTipoModalEquipo.dataset.equiposDirtyBound !== '1') {
        inputTipoModalEquipo.dataset.equiposDirtyBound = '1';
        inputTipoModalEquipo.addEventListener('input', actualizarDirtyTipoEquipo);
    }

    // Función para cargar ubicaciones en el select del modal de sector
    function formatearUbicacionLabel(ubicacion) {
        var codigo = (ubicacion && ubicacion.codigo ? String(ubicacion.codigo).trim() : '');
        var nombre = (ubicacion && ubicacion.nombre ? String(ubicacion.nombre).trim() : '');
        return codigo ? (codigo + ' - ' + nombre) : nombre;
    }

    function cargarUbicacionesEnSelectSector() {
        var selectUbicacion = document.getElementById('sectorUbicacionId');
        if (!selectUbicacion) return;
        
        var ubicacionActual = selectUbicacion.value;
        
        fetch('/ubicaciones/api')
            .then(function(response) { return response.json(); })
            .then(function(ubicaciones) {
                selectUbicacion.innerHTML = '<option value="">— Seleccionar ubicación —</option>';
                ubicaciones.forEach(function(ubicacion) {
                    var option = document.createElement('option');
                    option.value = ubicacion.id;
                    option.textContent = formatearUbicacionLabel(ubicacion);
                    selectUbicacion.appendChild(option);
                });
                // Restaurar selección si existía
                if (ubicacionActual) {
                    selectUbicacion.value = ubicacionActual;
                }
            })
            .catch(function(error) {
                console.error('Error al cargar ubicaciones:', error);
            });
    }

    // Código ejecutado inmediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initEquipos();
        });
    } else {
        initEquipos();
    }

    function initEquipos() {

    var overlay = document.getElementById('modalEquipo');
    var form = document.getElementById('formEquipo');
    var titulo = document.getElementById('modalEquipoTitulo');
    var submitBtn = document.getElementById('modalEquipoSubmit');
    var imagenInput = document.getElementById('equipoImagen');
    var previewImagen = document.getElementById('previewImagen');
    var previewImgTag = document.getElementById('previewImgTag');
    var previewPlaceholder = document.getElementById('previewPlaceholder');
    var btnEliminarImagen = document.getElementById('btnEliminarImagen');
    var imagenActualInput = document.getElementById('imagenActual');
    var selectTipo = document.getElementById('equipoIdTipo');
    var selectMarca = document.getElementById('equipoIdMarca');
    var selectModelo = document.getElementById('equipoIdModelo');

    function getEl(id) { return document.getElementById(id); }
    function toNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
    function toDateSafe(iso) {
        if (!iso) return null;
        var d = new Date(iso + 'T00:00:00');
        return isNaN(d.getTime()) ? null : d;
    }

    function toast(msg, type) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(msg, type || 'info');
        } else if (typeof window.toast === 'function' && window.toast !== toast) {
            window.toast(msg, type || 'info');
        } else {
            console.log('[' + (type || 'info') + '] ' + msg);
            alert(msg);
        }
    }

    var equipoOriginalValues = {};
    var equipoHasChanges = false;
    var equipoEditMode = false;
    var equipoIsSubmitting = false;

    function leerEstadoEquipo() {
        return {
            serie: getEl('equipoSerie') ? getEl('equipoSerie').value : '',
            observacion: getEl('equipoObservacion') ? getEl('equipoObservacion').value : '',
            idTipo: getEl('equipoIdTipo') ? getEl('equipoIdTipo').value : '',
            idMarca: getEl('equipoIdMarca') ? getEl('equipoIdMarca').value : '',
            idModelo: getEl('equipoIdModelo') ? getEl('equipoIdModelo').value : '',
            idProveedor: getEl('equipoIdProveedor') ? getEl('equipoIdProveedor').value : '',
            ubicacionId: getEl('equipoUbicacionId') ? getEl('equipoUbicacionId').value : '',
            sectorId: getEl('equipoSectorId') ? getEl('equipoSectorId').value : '',
            vtoGarantia: getEl('equipoVtoGarantia') ? getEl('equipoVtoGarantia').value : '',
            precio: getEl('equipoPrecio') ? getEl('equipoPrecio').value : '',
            informaSeguro: getEl('equipoInformaSeguro') ? (getEl('equipoInformaSeguro').checked ? '1' : '0') : '0',
            imagenActual: imagenActualInput ? imagenActualInput.value : '',
            imagenNueva: imagenInput && imagenInput.files && imagenInput.files.length > 0 ? '1' : '0',
        };
    }

    function tieneDatosCargaEquipo(actual) {
        return Boolean(
            (actual.serie || '').trim() ||
            (actual.observacion || '').trim() ||
            actual.idTipo ||
            actual.idMarca ||
            actual.idModelo ||
            actual.idProveedor ||
            actual.ubicacionId ||
            actual.sectorId ||
            (actual.vtoGarantia || '').trim() ||
            (actual.precio || '').trim() ||
            actual.imagenNueva === '1'
        );
    }

    function actualizarEstadoSubmitEquipo() {
        if (!submitBtn) return;
        var actual = leerEstadoEquipo();

        if (!equipoEditMode) {
            equipoHasChanges = tieneDatosCargaEquipo(actual);
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
            submitBtn.removeAttribute('title');
            return;
        }

        equipoHasChanges = Object.keys(equipoOriginalValues).some(function(key) {
            return (actual[key] || '') !== (equipoOriginalValues[key] || '');
        });
        submitBtn.disabled = !equipoHasChanges;
        submitBtn.classList.toggle('disabled', !equipoHasChanges);
        if (equipoHasChanges) {
            submitBtn.removeAttribute('title');
        } else {
            submitBtn.title = 'Bloqueado: haz un cambio para habilitar';
        }
    }

    async function serieExiste(serie) {
        if (!serie || !serie.trim()) return false;
        try {
            var response = await fetch('/equipos/serie-existe?serie=' + encodeURIComponent(serie.trim()), {
                headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
            });
            if (!response.ok) return false;
            var data = await response.json();
            return Boolean(data.exists);
        } catch (error) {
            console.error('Error comprobando serie existente:', error);
            return false;
        }
    }

    function setSerieError(msg) {
        var errorEl = getEl('equipoSerieError');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    function clearSerieError() {
        var errorEl = getEl('equipoSerieError');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    function manejarSerieExistente(serieInput) {
        setSerieError('Número de serie ya existente');
        if (serieInput) {
            serieInput.classList.add('input-error');
            serieInput.focus();
            serieInput.select();
        }
    }

    if (form) {
        var serieInput = getEl('equipoSerie');
        if (serieInput) {
            serieInput.addEventListener('input', function() {
                if (serieInput.classList.contains('input-error')) {
                    serieInput.classList.remove('input-error');
                }
                clearSerieError();
            });
        }

form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (submitBtn.disabled || equipoIsSubmitting) return;

            // Chequeo serie solo en crear
            if (form.action.endsWith('/crear')) {
                var serie = serieInput?.value?.trim() || '';
                if (serie) {
                    var existe = await serieExiste(serie);
                    if (existe) {
                        manejarSerieExistente(serieInput);
                        return;
                    }
                }
            }

            // Confirm before save
            abrirModalConfirmacion(
                equipoEditMode ? 'Actualizar equipo' : 'Crear equipo',
                equipoEditMode
                    ? '¿Desea actualizar este equipo con los cambios realizados?'
                    : '¿Desea crear este equipo con los datos cargados?',
                function() {
                    equipoIsSubmitting = true;
                    updateGarantiaEquipoDesdeDias();
                    if (form.action.endsWith('/crear')) {
                        form.submit();
                    } else {
                        // AJAX for update like proveedores.js
                        const formData = new FormData(form);
                        formData.append('_token', CrudCommon.getCsrfToken());

                        fetch(form.action, {
                            method: 'POST',
                            body: formData,
                            headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                        })
                        .then(function(response) {
                            return response.text().then(function(text) {
                                var data = null;
                                try {
                                    var raw = text == null ? '' : String(text).trim();
                                    if (raw) {
                                        data = JSON.parse(raw);
                                    }
                                } catch (parseErr) {
                                    if (!response.ok) {
                                        return {
                                            success: false,
                                            message: 'Error del servidor (' + response.status + ')',
                                        };
                                    }
                                    return { success: true, _legacyNonJsonOk: true };
                                }
                                if (!response.ok) {
                                    var msg = (data && data.message) ? data.message : 'Error al actualizar';
                                    if (data && data.errors) {
                                        var errs = Object.values(data.errors).flat();
                                        if (errs.length) {
                                            msg = String(errs[0] || msg);
                                        }
                                    }
                                    return { success: false, message: msg };
                                }
                                if (!data || typeof data !== 'object') {
                                    return { success: true, message: 'Actualizado correctamente' };
                                }
                                if (typeof data.success === 'undefined') {
                                    return { success: true, message: data.message || 'Actualizado correctamente' };
                                }
                                return data;
                            });
                        })
                        .then(function(data) {
                            if (data._legacyNonJsonOk) {
                                mostrarToast('Operación completada', 'success');
                                forceCerrarModalEquipo();
                                location.reload();
                                return;
                            }
                            if (data.success) {
                                mostrarToast(data.message || 'Actualizado correctamente', 'success');
                                forceCerrarModalEquipo();
                                location.reload();
                            } else {
                                mostrarToast(data.message || 'Error desconocido', 'error');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            mostrarToast('Error de conexión', 'error');
                        })
                        .finally(() => {
                            equipoIsSubmitting = false;
                        });
                    }
                },
                false,
                false
            );
        });
    }
    function addDaysToISO(baseIso, days) {
        var d = toDateSafe(baseIso);
        if (!d) return '';
        d.setDate(d.getDate() + Math.max(0, Math.trunc(days)));
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    function formatDateAr(iso) {
        var d = toDateSafe(iso);
        return d ? d.toLocaleDateString('es-AR') : '—';
    }
    function diffDaysIso(baseIso, targetIso) {
        var a = toDateSafe(baseIso);
        var b = toDateSafe(targetIso);
        if (!a || !b) return 0;
        return Math.max(0, Math.round((b - a) / 86400000));
    }

        function updateGarantiaEquipoDesdeDias() {
        var diasEl = getEl('equipoGarantiaDias');
        var baseEl = getEl('equipoGarantiaBase');
        var vtoEl = getEl('equipoVtoGarantia');
        var previewEl = getEl('equipoGarantiaPreview');
        if (!diasEl || !baseEl || !vtoEl || !previewEl) return;
        if (!String(baseEl.value || '').trim()) {
            baseEl.value = new Date().toISOString().slice(0, 10);
        }
        var raw = String(diasEl.value || '').replace(/\D/g, '').slice(0, 3);
        var dias = raw === '' ? 0 : parseInt(raw, 10);
        diasEl.value = raw;
        var vto = addDaysToISO(baseEl.value, dias);
        vtoEl.value = vto;
        previewEl.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(vence: ' + formatDateAr(vto) + ')';
    }

function setGarantiaEquipo(baseIso, vtoIso) {
        var diasEl = getEl('equipoGarantiaDias');
        var baseEl = getEl('equipoGarantiaBase');
        if (!diasEl || !baseEl) return;
        baseEl.value = baseIso || new Date().toISOString().slice(0, 10);
        if (vtoIso) {
            diasEl.value = String(diffDaysIso(baseEl.value, vtoIso));
        } else {
            diasEl.value = '';
        }
        updateGarantiaEquipoDesdeDias();
    }


    function initBuscadorSelect(inputId, selectId) {
        var input = document.getElementById(inputId);
        var select = document.getElementById(selectId);
        if (!input || !select || input.dataset.equiposBound === '1') return;
        input.dataset.equiposBound = '1';

        var snapshot = function() {
            return Array.from(select.options).map(function(opt) {
                return { value: opt.value, text: opt.textContent };
            });
        };
        var originales = snapshot();

        var render = function(filtro) {
            var q = (filtro || '').toLowerCase().trim();
            var prev = select.value;
            var filtradas = !q ? originales : originales.filter(function(o) {
                return o.text.toLowerCase().indexOf(q) !== -1;
            });
            select.innerHTML = '';
            filtradas.forEach(function(o) {
                var opt = document.createElement('option');
                opt.value = o.value;
                opt.textContent = o.text;
                select.appendChild(opt);
            });
            if (Array.from(select.options).some(function(o) { return o.value === prev; })) {
                select.value = prev;
            }
        };

        var timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                render(input.value);
            }, 180);
        });

        var observer = new MutationObserver(function() {
            originales = snapshot();
            if (input.value.trim()) render(input.value);
        });
        observer.observe(select, { childList: true, subtree: false });
    }

    function cargarMarcasPorTipo(idTipo, idMarcaSeleccionar, callback) {
        var marcaSelect = document.getElementById('equipoIdMarca') || selectMarca;

        if (!marcaSelect) return;

        var url = '/marcas/api';
        if (idTipo) {
            url += '?idTipo=' + encodeURIComponent(idTipo);
        }

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                marcaSelect.innerHTML = '<option value="">— Seleccionar marca —</option>';
                marcas.forEach(function(marca) {
                    var option = document.createElement('option');
                    option.value = marca.idMarca;
                    option.textContent = marca.marca;
                    marcaSelect.appendChild(option);
                });
                if (idMarcaSeleccionar) {
                    marcaSelect.value = String(idMarcaSeleccionar);
                }
                if (callback) callback();
            })
            .catch(function(error) {
                console.error('Error al cargar marcas:', error);
            });
    }

    // Función para cargar modelos por marca via AJAX
    window.cargarModelosPorMarcaYTipo = function(idMarca, idTipo, callback) {
        var modeloSelect = document.getElementById('equipoIdModelo') || selectModelo;
        
        if (!modeloSelect) return;
        
        modeloSelect.innerHTML = '<option value="">— Seleccionar modelo —</option>';
        
        if (idMarca && idTipo) {
            fetch('/modelos/marca/' + idMarca + '/tipo/' + idTipo)
                .then(response => response.json())
                .then(modelos => {
                    modelos.forEach(modelo => {
                        var option = document.createElement('option');
                        option.value = modelo.idModelo;
                        option.textContent = modelo.modelo;
                        modeloSelect.appendChild(option);
                    });
                    if (callback) callback();
                })
                .catch(error => {
                    console.error('Error al cargar modelos:', error);
                });
        }
    };

    // Backward compatibility
    window.cargarModelosPorMarca = function(idMarca, callback) {
        window.cargarModelosPorMarcaYTipo(idMarca, '', callback);
    };

    // Event listener para cuando cambia la marca
    if (selectMarca && selectModelo) {
        selectMarca.addEventListener('change', function() {
            var idMarca = this.value;
            var idTipo = selectTipo ? selectTipo.value : '';
            cargarModelosPorMarcaYTipo(idMarca, idTipo);
        });
    }

    if (selectTipo && selectTipo.dataset.equiposTipoMarcaBound !== '1') {
        selectTipo.dataset.equiposTipoMarcaBound = '1';
        selectTipo.addEventListener('change', function() {
            cargarMarcasPorTipo(this.value, '');
            if (selectModelo) {
                selectModelo.innerHTML = '<option value="">— Seleccionar modelo —</option>';
            }
        });
    }

    initBuscadorSelect('buscarEquipoProveedor', 'equipoIdProveedor');
    initBuscadorSelect('buscarEquipoTipo', 'equipoIdTipo');
    initBuscadorSelect('buscarEquipoMarca', 'equipoIdMarca');
    initBuscadorSelect('buscarEquipoModelo', 'equipoIdModelo');
    initBuscadorSelect('buscarEquipoUbicacion', 'equipoUbicacionId');
    initBuscadorSelect('buscarEquipoSector', 'equipoSectorId');

    var garantiaDiasInput = getEl('equipoGarantiaDias');
    if (garantiaDiasInput && garantiaDiasInput.dataset.equiposBound !== '1') {
        garantiaDiasInput.dataset.equiposBound = '1';
        garantiaDiasInput.addEventListener('input', updateGarantiaEquipoDesdeDias);
        garantiaDiasInput.addEventListener('change', updateGarantiaEquipoDesdeDias);
    }
    var vtoInitEl = getEl('equipoVtoGarantia');
    setGarantiaEquipo(new Date().toISOString().slice(0, 10), vtoInitEl ? vtoInitEl.value : '');

    // Función para previsualizar imagen
    window.previsualizarImagen = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                previewImgTag.src = e.target.result;
                previewImagen.classList.add('has-image');
                previewPlaceholder.style.display = 'none';
                btnEliminarImagen.style.display = 'flex';
                imagenActualInput.value = '';
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // Función para eliminar imagen
    window.eliminar_imagen = function() {
        imagenInput.value = '';
        previewImgTag.src = '';
        previewImagen.classList.remove('has-image');
        previewPlaceholder.style.display = 'block';
        btnEliminarImagen.style.display = 'none';
    };

    // Event listener para selección de imagen
    if (imagenInput) {
        imagenInput.addEventListener('change', function() {
            previsualizarImagen(this);
        });
    }

    // Event listener para eliminar imagen
    if (btnEliminarImagen) {
        btnEliminarImagen.addEventListener('click', function(e) {
            e.stopPropagation();
            eliminar_imagen();
        });
    }

    // Click en preview para abrir selector de archivos
    if (previewImagen) {
        previewImagen.addEventListener('click', function() {
            imagenInput.click();
        });
    }

    window.abrirModalEquipo = function(mode, element) {
        if (!overlay || !form || !titulo || !submitBtn) {
            console.warn('Modal de equipo no disponible en esta vista');
            return;
        }
        var dataset = null;
        
        // Si es un TR, usar sus data attributes
        if (element && element.tagName === 'TR') {
            dataset = element.dataset;
        }
        // Si es un botón con data attributes, usar esos
        else if (element && element.dataset && Object.keys(element.dataset).length > 0) {
            dataset = element.dataset;
        }
        
        if (mode === 'crear' || !dataset) {
            titulo.textContent = 'Nuevo Equipo';
            form.action = '/equipos/crear';
            getEl('equipoSerie').value = '';
            getEl('equipoObservacion').value = '';
            getEl('equipoIdTipo').value = '';
            cargarMarcasPorTipo('', '');
            getEl('equipoIdModelo').innerHTML = '<option value="">— Seleccionar modelo —</option>';
            getEl('equipoIdProveedor').value = '';
            getEl('equipoUbicacionId').value = '';
            getEl('equipoSectorId').value = '';
            getEl('equipoVtoGarantia').value = '';
            if (getEl('equipoInformaSeguro')) getEl('equipoInformaSeguro').checked = true;
            setGarantiaEquipo(new Date().toISOString().slice(0, 10), '');
            getEl('equipoPrecio').value = '';
            // Resetear imagen
            imagenInput.value = '';
            previewImgTag.src = '';
            previewImagen.classList.remove('has-image');
            previewPlaceholder.style.display = 'block';
            btnEliminarImagen.style.display = 'none';
            imagenActualInput.value = '';
            submitBtn.textContent = 'Crear';
            equipoOriginalValues = {};
            equipoHasChanges = false;
            equipoEditMode = false;
            equipoIsSubmitting = false;
            // Asegurar que el selector de sectores se actualiza según ubicación (vista equipos y factura)
            document.getElementById('equipoUbicacionId')?.addEventListener('change', function() {
                recargarSelectSectores(this.value, '');
            });
            document.getElementById('equipoFacturaUbicacionId')?.addEventListener('change', function() {
                recargarSelectSectores(this.value, '');
            });
        } else {
            titulo.textContent = 'Editar Equipo';
            form.action = '/equipos/' + (dataset.id || '') + '/actualizar';
            getEl('equipoSerie').value = dataset.serie || '';
            getEl('equipoObservacion').value = dataset.observacion || '';
            getEl('equipoIdTipo').value = dataset.idTipo || '';
            getEl('equipoIdMarca').value = dataset.idMarca || '';
            getEl('equipoIdModelo').value = dataset.idModelo || '';
            getEl('equipoPrecio').value = dataset.precio || '';
            getEl('equipoVtoGarantia').value = dataset.vtoGarantia || '';
            getEl('equipoNumeroFactura').value = dataset.numeroFactura || '';
            var baseGarantia = dataset.fechaInicioGarantia || new Date().toISOString().slice(0, 10);
            setGarantiaEquipo(baseGarantia, dataset.vtoGarantia || '');
            var informaCheckbox = getEl('equipoInformaSeguro');
            if (informaCheckbox) {
                informaCheckbox.checked = dataset.informaSeguro === '1' || dataset.informaSeguro === 'true';
            }
            getEl('equipoIdProveedor').value = dataset.idProveedor || '';
            var idUbicacionEquipo = dataset.ubicacionId || '';
            var idSectorEquipo = dataset.sectorId || '';
            getEl('equipoUbicacionId').value = idUbicacionEquipo;
            getEl('equipoSectorId').value = idSectorEquipo;
            recargarSelectSectores(idUbicacionEquipo, idSectorEquipo);

            // Manejar imagen
            var imagenUrl = dataset.imagen || '';
            if (imagenUrl) {
                // Prepend /storage/ para acceder correctamente a las imágenes almacenadas
                previewImgTag.src = '/storage/' + imagenUrl;
                previewImagen.classList.add('has-image');
                previewPlaceholder.style.display = 'none';
                btnEliminarImagen.style.display = 'flex';
                imagenActualInput.value = imagenUrl;
            } else {
                previewImgTag.src = '';
                previewImagen.classList.remove('has-image');
                previewPlaceholder.style.display = 'block';
                btnEliminarImagen.style.display = 'none';
                imagenActualInput.value = '';
            }
            imagenInput.value = '';
            submitBtn.textContent = 'Actualizar';
            equipoOriginalValues = {
                serie: dataset.serie || '',
                observacion: dataset.observacion || '',
                idTipo: String(dataset.idTipo || ''),
                idMarca: String(dataset.idMarca || ''),
                idModelo: String(dataset.idModelo || ''),
                idProveedor: String(dataset.idProveedor || ''),
                ubicacionId: String(idUbicacionEquipo || ''),
                sectorId: String(idSectorEquipo || ''),
                vtoGarantia: dataset.vtoGarantia || '',
                precio: dataset.precio || '',
                informaSeguro: dataset.informaSeguro === '1' || dataset.informaSeguro === 'true' ? '1' : '0',
                imagenActual: imagenUrl || '',
                imagenNueva: '0',
            };
            equipoHasChanges = false;
            equipoEditMode = true;
            equipoIsSubmitting = false;
        }
        actualizarEstadoSubmitEquipo();
        
        // Usar clase .show para mostrar el modal
        overlay.classList.add('show');
        overlay.classList.remove('modal-oculto');
        overlay.setAttribute('aria-hidden', 'false');
    };

function forceCerrarModalEquipo() {
        if (!overlay) return;
        equipoOriginalValues = {};
        equipoHasChanges = false;
        equipoEditMode = false;
        equipoIsSubmitting = false;
        overlay.classList.remove('show');
        overlay.classList.add('modal-oculto');
        overlay.setAttribute('aria-hidden', 'true'); 
    }

    window.cerrarModalEquipo = function() {
        if (equipoIsSubmitting) {
            forceCerrarModalEquipo();
            return;
        }
        if (!equipoHasChanges) {
            forceCerrarModalEquipo();
            return;
        }
        abrirModalConfirmacion(
            'Cerrar equipo',
            'Se van a perder los cambios realizados. ¿Desea continuar?',
            forceCerrarModalEquipo,
            false,
            true
        );
    };

    if (overlay) {
        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalEquipo(); });
    }

    document.querySelectorAll('#tablaEquipos .fila-equipo-editar').forEach(function(row) {
        row.addEventListener('dblclick', function(e) {
            if (e.target.closest('.td-acciones')) return;
            abrirModalEquipo('editar', row);
        });
    });

    document.querySelectorAll('.btn-ver-historial').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var equipoId = this.dataset.id;
            if (equipoId) {
                window.location.href = urlHistorialEquipo(equipoId);
            }
        });
    });

    [
        'equipoSerie',
        'equipoObservacion',
        'equipoIdTipo',
        'equipoIdMarca',
        'equipoIdModelo',
        'equipoIdProveedor',
        'equipoUbicacionId',
        'equipoSectorId',
        'equipoGarantiaDias',
        'equipoPrecio',
        'equipoVtoGarantia',
        'imagenActual'
    ].forEach(function(id) {
        var el = getEl(id);
        if (!el) return;
        el.addEventListener('input', actualizarEstadoSubmitEquipo);
        el.addEventListener('change', actualizarEstadoSubmitEquipo);
    });
    if (imagenInput) imagenInput.addEventListener('change', actualizarEstadoSubmitEquipo);
    if (btnEliminarImagen) {
        btnEliminarImagen.addEventListener('click', function() {
            setTimeout(actualizarEstadoSubmitEquipo, 0);
        });
    }
    if (getEl('equipoInformaSeguro')) {
        getEl('equipoInformaSeguro').addEventListener('change', actualizarEstadoSubmitEquipo);
    }

    var selectedRow = null;
    var selectedEquipoId = null;
    var selectedEquipoSerie = null;
    var selectedEquipoInfo = document.getElementById('selectedEquipoInfo');
    var btnEditarEquipo = document.getElementById('btnEditarEquipo');
    var btnBajaEquipo = document.getElementById('btnBajaEquipo');
    var btnHistorialEquipo = document.getElementById('btnHistorialEquipo');
    var formBajaEquipo = document.getElementById('formBajaEquipo');

    function actualizarSeleccion() {
        document.querySelectorAll('#tablaEquipos tbody tr').forEach(function(r) {
            var isSelected = r === selectedRow;
            r.classList.toggle('seleccionado', isSelected);
            r.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
        if (btnBajaEquipo) {
            btnBajaEquipo.disabled = !selectedEquipoId;
        }
        if (btnEditarEquipo) {
            btnEditarEquipo.disabled = !selectedEquipoId;
        }
        if (btnHistorialEquipo) {
            btnHistorialEquipo.disabled = !selectedEquipoId;
        }
        if (selectedEquipoInfo) {
            selectedEquipoInfo.textContent = selectedEquipoId
                ? 'Equipo seleccionado: ' + selectedEquipoSerie + ' (ID ' + selectedEquipoId + ')'
                : 'Ningún equipo seleccionado';
        }
    }

    document.querySelectorAll('#tablaEquipos tbody tr[data-id]').forEach(function(row) {
        row.addEventListener('click', function() {
            if (selectedRow === row) {
                selectedRow = null;
                selectedEquipoId = null;
                selectedEquipoSerie = null;
            } else {
                selectedRow = row;
                selectedEquipoId = row.dataset.id;
                selectedEquipoSerie = row.dataset.serie;
            }
            actualizarSeleccion();
        });

row.addEventListener('dblclick', function() {
            abrirModalEquipo('editar', row);
        });
        if (!row.hasAttribute('tabindex')) {
            row.setAttribute('tabindex', '-1');
        }
    });

    if (window.CrudCommon && typeof window.CrudCommon.bindArrowRowNavigation === 'function') {
        window.CrudCommon.bindArrowRowNavigation({
            rowSelector: '#tablaEquipos tbody tr[data-id]',
            getSelectedRow: function() {
                return selectedRow;
            },
            onSelectRow: function(row) {
                selectedRow = row;
                selectedEquipoId = row ? row.dataset.id : null;
                selectedEquipoSerie = row ? row.dataset.serie : null;
                actualizarSeleccion();
            },
        });
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('#tablaEquipos') && !e.target.closest('#btnBajaEquipo') && !e.target.closest('#btnEditarEquipo') && !e.target.closest('#btnHistorialEquipo')) {
            selectedRow = null;
            selectedEquipoId = null;
            selectedEquipoSerie = null;
            actualizarSeleccion();
        }
    });

    if (btnEditarEquipo) {
        btnEditarEquipo.addEventListener('click', function() {
            if (!selectedRow) return;
            abrirModalEquipo('editar', selectedRow);
        });
    }

if (btnBajaEquipo) {
btnBajaEquipo.addEventListener('click', function() {
    if (!selectedRow || !selectedEquipoId || selectedEquipoId === null || selectedEquipoId === 'null' || selectedEquipoId === '0' || selectedEquipoId === 'NaN' || isNaN(Number(selectedEquipoId)) || Number(selectedEquipoId) <= 0) {
        mostrarToast('Selecciona un equipo válido primero (ID: ' + (selectedEquipoId || 'null') + ')', 'error');
        return;
    }
    var idNum = parseInt(selectedEquipoId, 10);
    if (isNaN(idNum) || idNum <= 0) {
        mostrarToast('ID inválido: ' + selectedEquipoId, 'error');
        return;
    }
    abrirModalConfirmacion(
        'Dar baja equipo',
        '¿Estás seguro de dar baja el equipo "' + (selectedEquipoSerie || 'sin serie') + '" (ID ' + idNum + ')?',
        function(observacion) {
            var inputObs = document.createElement('input');
            inputObs.type = 'hidden';
            inputObs.name = 'observacion';
            inputObs.value = observacion || '';
            var inputs = formBajaEquipo.querySelectorAll('input');
                inputs.forEach(function(input) { input.remove(); });
            var tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = CrudCommon.getCsrfToken();
            formBajaEquipo.appendChild(tokenInput);
            formBajaEquipo.appendChild(inputObs);
            mostrarToast('Dando baja el equipo ID ' + idNum + '...', 'warning');
            formBajaEquipo.action = '/equipos/' + idNum + '/baja';
            formBajaEquipo.submit();
        },
        true,
        true
    );
});
    }

    if (btnHistorialEquipo) {
        btnHistorialEquipo.addEventListener('click', function() {
            if (!selectedEquipoId) return;
            window.location.href = urlHistorialEquipo(selectedEquipoId);
        });
    }

    var searchInput = document.getElementById('searchInput');
    var searchColumn = document.getElementById('searchColumn');
    if (searchInput && searchColumn) {
        let timeout;
        var columnIndexMap = {
            id: 0,
            serie: 1,
            tipo: 2,
            marca: 3,
            modelo: 4,
            proveedor: 5,
            numeroFactura: 6,
            ubicacion: 7,
            sector: 8,
        };

        function normalizarTexto(valor) {
            return String(valor || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function filtrarTabla() {
            var termino = normalizarTexto(searchInput.value.trim());
            var columna = searchColumn.value;
            document.querySelectorAll('#tablaEquipos tbody tr').forEach(function(tr) {
                if (tr.querySelector('.td-vacio')) {
                    tr.style.display = '';
                    return;
                }

                var valorCelda = '';
                if (columna) {
                    var cellIndex = columnIndexMap[columna];
                    var td = typeof cellIndex === 'number' ? tr.cells[cellIndex] : null;
                    valorCelda = normalizarTexto(td ? td.textContent : '');
                } else {
                    valorCelda = normalizarTexto(tr.textContent);
                }

                tr.style.display = valorCelda.includes(termino) ? '' : 'none';
            });
        }
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(filtrarTabla, 300);
        });
        searchColumn.addEventListener('change', filtrarTabla);
        filtrarTabla();
    }

    document.getElementById('filtroUbicacion')?.addEventListener('change', function() {
        var v = this.value.toLowerCase();
        document.querySelectorAll('#tablaEquipos tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            var n = (tr.dataset.ubicacionNombre || '').toLowerCase();
            tr.style.display = !v || n.indexOf(v) >= 0 ? '' : 'none';
        });
    });

    document.getElementById('filtroSector')?.addEventListener('change', function() {
        var v = this.value.toLowerCase();
        document.querySelectorAll('#tablaEquipos tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            var n = (tr.dataset.sectorNombre || '').toLowerCase();
            tr.style.display = !v || n.indexOf(v) >= 0 ? '' : 'none';
        });
    });

    /* --- Ordenar por columnas (click en headers) — mismo comportamiento que otras entidades --- */
    if (window.CrudCommon && typeof window.CrudCommon.initSortableHeaders === 'function') {
        window.CrudCommon.initSortableHeaders('#tablaEquipos th.sortable');
    } else {
        document.querySelectorAll('#tablaEquipos th.sortable').forEach(function(th) {
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
    }

    /* --- Botones de baja con modal de confirmación (filas que incluyan .form-baja oculto) --- */
    document.querySelectorAll('#tablaEquipos .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var m = form.action.match(/\/equipos\/(\d+)\/baja/);
            if (!m) {
                return;
            }
            var btn = form.querySelector('.btn-baja');
            var tr = btn ? btn.closest('tr') : null;
            var labelSerie = (tr && tr.dataset && tr.dataset.serie) ? tr.dataset.serie : ((btn && btn.closest('tr') && btn.closest('tr').cells[1]) ? btn.closest('tr').cells[1].textContent.trim() : m[1]);

            abrirModalConfirmacion(
                'Dar de baja equipo',
                '¿Estás seguro de dar de baja el equipo "' + labelSerie + '"?',
                function(observacion) {
                    // Crear input hidden con la observación
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    // Submit del formulario
                    mostrarToast('Dando de baja el equipo...', 'warning');
                    form.submit();
                },
                true,
                true
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaEquipos .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var tr = btn ? btn.closest('tr') : null;
            var labelSerie = (tr && tr.dataset && tr.dataset.serie) ? tr.dataset.serie : ((tr && tr.cells[1]) ? tr.cells[1].textContent.trim() : '');

            abrirModalConfirmacion(
                'Activar equipo',
                '¿Estás seguro de activar el equipo "' + labelSerie + '"?',
                function() {
                    mostrarToast('Activando el equipo...', 'warning');
                    form.submit();
                },
                false,
                false
            );
        });
    });

    // Inicializar selects buscables
    if (typeof initBusquedaSelects === 'function') {
        initBusquedaSelects();
    }

    // Función para recargar el select de marcas
    function recargarSelectMarcas(idMarcaSeleccionar, idTipoFiltrar) {
        var selects = [
            document.getElementById('equipoIdMarca'),
            document.getElementById('equipoFacturaIdMarca')
        ];

        var url = '/marcas/api';
        if (idTipoFiltrar) {
            url += '?idTipo=' + encodeURIComponent(idTipoFiltrar);
        }

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                selects.forEach(function(select) {
                    if (!select) return;
                    var selectedValue = select.value;
                    select.innerHTML = '<option value="">— Seleccionar marca —</option>';
                    marcas.forEach(function(marca) {
                        var option = document.createElement('option');
                        option.value = marca.idMarca;
                        option.textContent = marca.marca;
                        select.appendChild(option);
                    });
                    // Seleccionar la nueva marca creada
                    if (idMarcaSeleccionar) {
                        select.value = idMarcaSeleccionar;
                    } else if (selectedValue) {
                        select.value = selectedValue;
                    }
                });
            })
            .catch(function(error) {
                console.error('Error al recargar marcas:', error);
            });
    }

    function buscarMarcaPorNombreYSeleccionar(nombreMarca, idTipoFiltrar) {
        if (!nombreMarca || !nombreMarca.trim()) return;
        var query = encodeURIComponent(nombreMarca.trim());
        var url = '/marcas/api?buscar=' + query;
        // No filtrar por idTipo al buscar, para encontrar marcas existentes aunque no estén asociadas al tipo actual

        originalFetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                if (!Array.isArray(marcas) || marcas.length === 0) return;
                var exact = marcas.find(function(marca) {
                    return String(marca.marca || '').trim().toLowerCase() === String(nombreMarca).trim().toLowerCase();
                });
                var marca = exact || marcas[0];
                if (idTipoFiltrar) {
                    // Asociar la marca con el tipo actual si no lo está ya
                    originalFetch('/marcas/asociar-tipo', {
                        method: 'POST',
                        headers: CrudCommon.jsonHeaders({
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }),
                        body: JSON.stringify({
                            idMarca: marca.idMarca,
                            idTipo: idTipoFiltrar,
                            asociado: true
                        })
                    }).then(function() {
                        // Después de asociar, recargar el select filtrado por tipo y seleccionar la marca
                        recargarSelectMarcas(marca.idMarca, idTipoFiltrar);
                        if (exact) {
                            mostrarToast('Marca existente seleccionada automáticamente.', 'success');
                        }
                    }).catch(function(err) {
                        console.error('Error al asociar tipo a marca existente:', err);
                        // Intentar seleccionar de todos modos
                        recargarSelectMarcas(marca.idMarca, idTipoFiltrar);
                        if (exact) {
                            mostrarToast('Marca existente seleccionada automáticamente.', 'success');
                        }
                    });
                } else {
                    // Sin tipo seleccionado, recargar sin filtro y seleccionar
                    recargarSelectMarcas(marca.idMarca, null);
                    if (exact) {
                        mostrarToast('Marca existente seleccionada automáticamente.', 'success');
                    }
                }
            })
            .catch(function(error) {
                console.error('Error al buscar marca existente:', error);
            });
    }

    // Función para recargar el select de modelos
    function recargarSelectModelos(idMarca, idTipo, idModeloSeleccionar) {
        var selects = [
            document.getElementById('equipoIdModelo'),
            document.getElementById('equipoFacturaIdModelo')
        ];

        if (!idMarca || !idTipo) {
            selects.forEach(function(select) {
                if (!select) return;
                select.innerHTML = '<option value="">— Seleccionar modelo —</option>';
            });
            return;
        }

        fetch('/modelos/marca/' + idMarca + '/tipo/' + idTipo)
            .then(function(response) { return response.json(); })
            .then(function(modelos) {
                selects.forEach(function(select) {
                    if (!select) return;
                    var selectedValue = select.value;
                    select.innerHTML = '<option value="">— Seleccionar modelo —</option>';
                    modelos.forEach(function(modelo) {
                        var option = document.createElement('option');
                        option.value = modelo.idModelo;
                        option.textContent = modelo.modelo;
                        select.appendChild(option);
                    });
                    if (idModeloSeleccionar) {
                        select.value = idModeloSeleccionar;
                    } else if (selectedValue) {
                        select.value = selectedValue;
                    }
                });
            })
            .catch(function(error) {
                console.error('Error al recargar modelos:', error);
            });
    }

    // Función para recargar el select de ubicaciones
    function recargarSelectUbicaciones(idSeleccionar) {
        var selects = [
            document.getElementById('equipoUbicacionId'),
            document.getElementById('equipoFacturaUbicacionId')
        ];

        fetch('/ubicaciones/api')
            .then(function(response) { return response.json(); })
            .then(function(ubicaciones) {
                selects.forEach(function(select) {
                    if (!select) return;
                    var selectedValue = select.value;
                    select.innerHTML = '<option value="">— Sin especificar —</option>';
                    ubicaciones.forEach(function(ubicacion) {
                        var option = document.createElement('option');
                        option.value = ubicacion.id;
                        option.textContent = formatearUbicacionLabel(ubicacion);
                        select.appendChild(option);
                    });
                    // Seleccionar la nueva ubicación creada
                    if (idSeleccionar) {
                        select.value = idSeleccionar;
                    } else if (selectedValue) {
                        select.value = selectedValue;
                    }
                });
            })
            .catch(function(error) {
                console.error('Error al recargar ubicaciones:', error);
            });
    }

    // Función para recargar el select de sectores
    function recargarSelectSectores(idUbicacion, idSeleccionar) {
        var selects = [
            document.getElementById('equipoSectorId'),
            document.getElementById('equipoFacturaSectorId')
        ];

        function clear() {
            selects.forEach(function(select) {
                if (!select) return;
                select.innerHTML = '<option value="">— Sin especificar —</option>';
            });
        }

        function fill(sectores) {
            selects.forEach(function(select) {
                if (!select) return;
                var selectedValue = select.value;
                select.innerHTML = '<option value="">— Sin especificar —</option>';
                sectores.forEach(function(sector) {
                    var option = document.createElement('option');
                    option.value = sector.idSector || sector.id || '';
                    option.textContent = sector.nombre || sector.nombreSector || '';
                    select.appendChild(option);
                });
                if (idSeleccionar) select.value = idSeleccionar;
                else if (selectedValue && Array.from(select.options).some(function(o){ return o.value === selectedValue; })) {
                    select.value = selectedValue;
                }
            });
        }

        function filtrarPorUbicacion(sectores) {
            var filtered = sectores.filter(function(sector) {
                var sectorUb = String(sector.idUbicacion || sector.ubicacionId || sector.id_ubicacion || sector.ubicacion || '');
                if (!sectorUb) return true;
                return idUbicacion && sectorUb === String(idUbicacion);
            });
            return filtered.length ? filtered : sectores;
        }

        if (!idUbicacion) {
            clear();
            return;
        }

        var endpoints = [
            '/api/sectores/ubicacion/' + encodeURIComponent(idUbicacion),
            '/api/ubicaciones/' + encodeURIComponent(idUbicacion) + '/sectores-vinculacion',
            '/sectores/ubicacion/' + encodeURIComponent(idUbicacion),
            '/sectores',
        ];

        var idx = 0;
        function tryNext(responseData) {
            if (responseData) {
                var sectores = Array.isArray(responseData) ? responseData : [];
                fill(filtrarPorUbicacion(sectores));
                return;
            }
            if (idx >= endpoints.length) {
                clear();
                return;
            }
            var url = endpoints[idx++];
            fetch(url)
                .then(function(response) {
                    // Verificar si la respuesta es JSON antes de parsear
                    var contentType = response.headers.get('content-type') || '';
                    if (!response.ok || !contentType.includes('application/json')) {
                        // Si no es JSON, intentar el siguiente endpoint
                        throw new Error('No JSON');
                    }
                    return response.json();
                })
                .then(function(data) {
                    tryNext(data);
                })
                .catch(function(err) {
                    // Si no es JSON o hay error, intentar el siguiente endpoint
                    if (idx < endpoints.length) {
                        tryNext();
                    } else {
                        // No mostrar error de parseo, solo limpiar
                        clear();
                    }
                });
        }

        tryNext();
    }

    // Función para recargar el select de tipos
    function recargarSelectTipos(idTipoSeleccionar) {
        var selects = [
            document.getElementById('equipoIdTipo'),
            document.getElementById('equipoFacturaIdTipo')
        ];

        fetch('/tipos/api')
            .then(function(response) { return response.json(); })
            .then(function(tipos) {
                selects.forEach(function(select) {
                    if (!select) return;
                    var selectedValue = select.value;
                    select.innerHTML = '<option value="">— Sin especificar —</option>';
                    tipos.forEach(function(tipo) {
                        var option = document.createElement('option');
                        option.value = tipo.idTipo;
                        option.textContent = tipo.nombreTipo;
                        select.appendChild(option);
                    });
                    // Seleccionar el nuevo tipo creado
                    if (idTipoSeleccionar) {
                        select.value = idTipoSeleccionar;
                    } else if (selectedValue) {
                        select.value = selectedValue;
                    }
                });
            })
            .catch(function(error) {
                console.error('Error al recargar tipos:', error);
            });
    }

        // Manejar el submit de los formularios de creación de entidades
        // Estos formularios están en los modales que se abren desde el modal de equipos
        var formMarca = document.getElementById('formMarca');
    if (contextoEntidadesInline && formMarca && !formMarca.dataset.boundBy) {
        formMarca.dataset.boundBy = 'equipos';
        formMarca.addEventListener('submit', async function(e) {
            e.preventDefault();
            var ejecutar = async function() {
                try {
                    window.__modalEntidadState.marca.saving = true;
                    var formData = new FormData(formMarca);
                    var nombreMarca = document.getElementById('marcaNombre').value.trim();
                    var selectTipo = document.getElementById('equipoIdTipo') || document.getElementById('equipoFacturaIdTipo');
                    var idTipoActual = selectTipo ? selectTipo.value : '';
                    formData.append('tipo_id', idTipoActual);
                    
                    const response = await originalFetch(formMarca.action, {
                        method: 'POST',
                        body: formData,
                        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                    });
                    
                    const text = await response.text();
                    const contentType = response.headers.get('content-type') || '';
                    let data = null;
                    if (contentType.includes('application/json')) {
                        try {
                            data = JSON.parse(text);
                        } catch (err) {
                            console.error('Error parseando JSON:', err, text);
                        }
                    }

                    let marcaIdToSelect = null;
                    let successHandled = false;

                    if (!response.ok) {
                        if (response.status === 422 && data && data.errors && data.errors.marca) {
                            const errorMsg = String(data.errors.marca[0] || '').toLowerCase();
                            if (errorMsg.includes('existe') || errorMsg.includes('taken')) {
                                // Buscar y seleccionar existente
                                await buscarMarcaPorNombreYSeleccionar(nombreMarca, idTipoActual);
                                successHandled = true;
                                mostrarToast('Marca existente seleccionada automáticamente', 'success');
                            } else {
                                mostrarToast(data.errors.marca[0] || 'Error de validación', 'error');
                            }
                        } else {
                            mostrarToast((data && data.message) ? data.message : 'Error del servidor (HTTP ' + response.status + ')', 'error');
                        }
                    } else {
                        // Éxito
                        if (data && (data.success || data.idMarca || data.id)) {
                            marcaIdToSelect = data.idMarca || data.id || null;
                            successHandled = true;
                            mostrarToast('Marca creada correctamente', 'success');
                            window.ultimaMarcaCreada = marcaIdToSelect;
                        }
                    }

                    // SIEMPRE refrescar select post-operación
                    recargarSelectMarcas(marcaIdToSelect || null, idTipoActual);

                    // Cerrar modal si handled
                    if (successHandled) {
                        forceCerrarEntidadModal('marca', 'modalMarca');
                        if (typeof window.abrirModalTiposMarca === 'function' && marcaIdToSelect) {
                            window.abrirModalTiposMarca(marcaIdToSelect, data?.nombre || nombreMarca);
                        }
                    }

                } catch (error) {
                    console.error('Error al procesar marca:', error);
                    mostrarToast('Error de conexión: ' + (error.message || 'Intente nuevamente'), 'error');
                } finally {
                    if (window.__modalEntidadState.marca) {
                        window.__modalEntidadState.marca.saving = false;
                    }
                }
            };

            if (formMarca.action.includes('/actualizar')) {
                confirmarActualizarEntidad('Actualizar marca', ejecutar);
            } else {
                await ejecutar();
            }
        });
    }

    var formModelo = document.getElementById('formModelo');
    if (contextoEntidadesInline && formModelo && !formModelo.dataset.boundBy) {
        formModelo.dataset.boundBy = 'equipos';
        formModelo.addEventListener('submit', function(e) {
            e.preventDefault();
            var ejecutar = function() {
                window.__modalEntidadState.modelo.saving = true;
                var formData = new FormData(formModelo);
                var idMarca = document.getElementById('modeloIdMarca').value;
                var idTipo = document.getElementById('modeloIdTipo').value;
                fetch(formModelo.action, {
                    method: 'POST',
                    body: formData,
                    headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                })
                .then(async response => {
                    const text = await response.text();
                    const contentType = response.headers.get('content-type') || '';
                    let data = null;
                    if (contentType.includes('application/json')) {
                        try {
                            data = JSON.parse(text);
                        } catch (err) {
                            console.error('Error parseando respuesta JSON:', err, text);
                        }
                    }

                    if (!response.ok) {
                        if (response.status === 422 && data && data.errors) {
                            const errorMessage = Object.values(data.errors).flat()[0] || 'Error de validación';
                            mostrarToast(errorMessage, 'error');
                        } else {
                            mostrarToast((data && data.message) ? data.message : 'Error del servidor', 'error');
                        }
                        return null;
                    }

                    if (!data && contentType.includes('application/json')) {
                        try {
                            data = JSON.parse(text);
                        } catch (err) {
                            console.error('Error parseando respuesta JSON:', err, text);
                        }
                    }

                    return data;
                })
                .then(function(data) {
                    if (!data) return;
                    if (data.success || data.idModelo) {
                        mostrarToast('Operación completada correctamente', 'success');
                        window.ultimoModeloCreado = data.idModelo || data.id;
                        forceCerrarEntidadModal('modelo', 'modalModelo');
                        recargarSelectModelos(idMarca, idTipo, data.idModelo || data.id);
                    } else {
                        mostrarToast('Error: ' + ((data && data.message) || 'Error desconocido'), 'error');
                    }
                })
                .catch(function(error) {
                    mostrarToast('Error al crear modelo: ' + (error.message || 'Error desconocido'), 'error');
                })
                .finally(function() {
                    if (window.__modalEntidadState.modelo) window.__modalEntidadState.modelo.saving = false;
                });
            };

            if (formModelo.action.includes('/actualizar')) {
                confirmarActualizarEntidad('Actualizar modelo', ejecutar);
                return;
            }
            ejecutar();
        });
    }

    var formUbicacion = document.getElementById('formUbicacion');
    if (contextoEntidadesInline && formUbicacion && !formUbicacion.dataset.boundBy) {
        formUbicacion.dataset.boundBy = 'equipos';
        formUbicacion.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
            })
            .then(async function(response) {
                const text = await response.text();
                const contentType = response.headers.get('content-type') || '';
                let data = null;
                if (contentType.includes('application/json')) {
                    try {
                        data = JSON.parse(text);
                    } catch (err) {
                        console.error('Error parseando respuesta JSON:', err, text);
                    }
                }

                if (!response.ok) {
                    if (response.status === 422 && data && data.errors) {
                        const errorMessage = Object.values(data.errors).flat()[0] || 'Error de validación';
                        mostrarToast(errorMessage, 'error');
                    } else {
                        mostrarToast((data && data.message) ? data.message : 'Error del servidor', 'error');
                    }
                    return null;
                }

                return data;
            })
            .then(function(data) {
                if (!data) return;
                if (data.success || data.id) {
                    mostrarToast('Operación completada correctamente', 'success');
                    window.ultimaUbicacionCreada = data.id;
                    cerrarModalUbicacion();
                    recargarSelectUbicaciones(data.id);
                } else {
                    mostrarToast('Error: ' + ((data && data.message) || 'Error desconocido'), 'error');
                }
            })
            .catch(function(error) {
                mostrarToast('Error al crear ubicación: ' + (error.message || 'Error desconocido'), 'error');
            });
        });
    }

    var formSector = document.getElementById('formSector');
    if (contextoEntidadesInline && formSector && !formSector.dataset.boundBy) {
        formSector.dataset.boundBy = 'equipos';
        formSector.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            var ejecutar = async function() {
                try {
                    var formData = new FormData(formSector);
                    var nombreSector = document.getElementById('sectorNombre').value.trim();
                    var selectUbicacion = document.getElementById('equipoUbicacionId') || document.getElementById('equipoFacturaUbicacionId') || document.getElementById('sectorUbicacionId');
                    var idUbicacionActual = selectUbicacion ? selectUbicacion.value : '';
                    formData.append('ubicacion_id', idUbicacionActual);
                    
                    const response = await fetch(formSector.action, {
                        method: 'POST',
                        body: formData,
                        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                    });
                    
                    const text = await response.text();
                    const contentType = response.headers.get('content-type') || '';
                    let data = null;
                    if (contentType.includes('application/json')) {
                        try {
                            data = JSON.parse(text);
                        } catch (err) {
                            console.error('Error parseando JSON:', err, text);
                        }
                    }

                    let sectorIdToSelect = null;
                    let successHandled = false;

                    if (!response.ok) {
                        if (response.status === 422 && data && data.errors && data.errors.nombre) {
                            mostrarToast(data.errors.nombre[0] || 'Error de validación', 'error');
                        } else {
                            mostrarToast((data && data.message) ? data.message : 'Error del servidor', 'error');
                        }
                    } else {
                        if (data && (data.success || data.id)) {
                            sectorIdToSelect = data.id || null;
                            successHandled = true;
                            mostrarToast('Sector creado correctamente', 'success');
                            window.ultimoSectorCreado = sectorIdToSelect;
                        }
                    }

                    // Refrescar select sectores
                    recargarSelectSectores(idUbicacionActual, sectorIdToSelect);

                    if (successHandled) {
                        window.cerrarModalSector();
                    }

                } catch (error) {
                    console.error('Error al procesar sector:', error);
                    mostrarToast('Error de conexión', 'error');
                }
            };
            await ejecutar();
        });
    }
    /* Handler formSector.submit removido para evitar duplicados. Dejar solo en sectores.js */

    var formTipo = document.getElementById('formTipo');
    if (contextoEntidadesInline && formTipo && !formTipo.dataset.boundBy) {
        formTipo.dataset.boundBy = 'equipos';
        formTipo.addEventListener('submit', function(e) {
            e.preventDefault();
            var ejecutar = function() {
                window.__modalEntidadState.tipo.saving = true;
                var formData = new FormData(formTipo);
                fetch(formTipo.action, {
                    method: 'POST',
                    body: formData,
                    headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                })
                    .then(async function(response) {
                        const text = await response.text();
                        const contentType = response.headers.get('content-type') || '';
                        let data = null;
                        if (contentType.includes('application/json')) {
                            try {
                                data = JSON.parse(text);
                            } catch (err) {
                                console.error('Error parseando respuesta JSON:', err, text);
                            }
                        }

                        if (!response.ok) {
                            if (response.status === 422 && data && data.errors) {
                                const errorMessage = Object.values(data.errors).flat()[0] || 'Error de validación';
                                mostrarToast(errorMessage, 'error');
                            } else {
                                mostrarToast((data && data.message) ? data.message : 'Error del servidor', 'error');
                            }
                            return null;
                        }

                        return data;
                    })
                    .then(function(data) {
                        if (!data) return;
                        if (data.success || data.idTipo) {
                            mostrarToast('Operación completada correctamente', 'success');
                            window.ultimoTipoCreado = data.idTipo || data.id;
                            forceCerrarEntidadModal('tipo', 'modalTipo');
                            recargarSelectTipos(data.idTipo || data.id);
                            if (window.overlayEquipoOculto) {
                                var overlayEquipo = document.getElementById('modalEquipo');
                                if (overlayEquipo) {
                                    overlayEquipo.style.display = 'flex';
                                    overlayEquipo.classList.add('show');
                                    overlayEquipo.setAttribute('aria-hidden', 'false');
                                }
                                window.overlayEquipoOculto = false;
                            }
                        } else {
                            mostrarToast('Error: ' + ((data && data.message) || 'Error desconocido'), 'error');
                        }
                    })
                    .catch(function(error) {
                        mostrarToast('Error al crear tipo: ' + (error.message || 'Error desconocido'), 'error');
                    })
                    .finally(function() {
                        if (window.__modalEntidadState.tipo) window.__modalEntidadState.tipo.saving = false;
                    });
            };

            if (formTipo.action.includes('/actualizar')) {
                confirmarActualizarEntidad('Actualizar tipo', ejecutar);
                return;
            }
            ejecutar();
        });
    }
    // Fin initEquipos
    }

})();

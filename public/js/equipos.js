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
            submitBtn.textContent = 'Guardar';
            window.__modalEntidadState.marca = { editMode: false, hasChanges: false, original: {}, saving: false };
        } else {
            titulo.textContent = 'Editar Marca';
            if (inputMarca) inputMarca.value = marca || '';
            submitBtn.textContent = 'Guardar';
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
            submitBtn.textContent = 'Guardar';
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
            submitBtn.textContent = 'Guardar';
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
            submitBtn.textContent = 'Guardar';
        } else {
            titulo.textContent = 'Editar Ubicación';
            if (inputNombre) inputNombre.value = nombre || '';
            submitBtn.textContent = 'Guardar';
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
            submitBtn.textContent = 'Guardar';
        } else {
            titulo.textContent = 'Editar Sector';
            // Cargar dropdown de ubicaciones vía AJAX
            cargarUbicacionesEnSelectSector();
            if (inputNombre) inputNombre.value = nombre || '';
            setTimeout(function() {
                if (selectUbicacion) selectUbicacion.value = String(ubicacionId || '');
            }, 100);
            submitBtn.textContent = 'Guardar';
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
            submitBtn.textContent = 'Guardar';
            window.__modalEntidadState.tipo = { editMode: false, hasChanges: false, original: {}, saving: false };
        } else {
            titulo.textContent = 'Editar Tipo';
            if (inputNombre) inputNombre.value = nombre || '';
            submitBtn.textContent = 'Guardar';
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
    var equipoAtributosBlock = document.getElementById('equipoAtributosBlock');
    var equipoAtributosContainer = document.getElementById('equipoAtributosContainer');
    var btnAbrirGestorAtributosEquipo = document.getElementById('btnAbrirGestorAtributosEquipo');
    var modalAtributoEquipo = document.getElementById('modalAtributoEquipo');
    var formAtributoEquipo = document.getElementById('formAtributoEquipo');
    var inputAtributoEquipoNombre = document.getElementById('equipoNuevoAtributoNombre');
    var modalOpcionAtributoEquipo = document.getElementById('modalOpcionAtributoEquipo');
    var formOpcionAtributoEquipo = document.getElementById('formOpcionAtributoEquipo');
    var inputOpcionAtributoEquipoId = document.getElementById('equipoOpcionAtributoId');
    var inputOpcionAtributoEquipoNombre = document.getElementById('equipoOpcionAtributoNombre');
    var inputNuevaOpcionAtributoValor = document.getElementById('equipoNuevaOpcionAtributoValor');
    var equipoAtributosFetchGen = 0;
    var equipoAtributosValoresActuales = {};

    function getEl(id) { return document.getElementById(id); }

    function parseJsonObjectSafe(raw) {
        if (!raw) return {};
        try {
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_e) {
            return {};
        }
    }

    function getRutaAtributosTipoEquipo(idTipo) {
        if (!overlay || !overlay.dataset.routeAtributosTipo) {
            return '/equipos/tipos/' + idTipo + '/atributos';
        }
        return String(overlay.dataset.routeAtributosTipo).replace('__ID__', String(idTipo));
    }

    function openGestionAtributosEquipo() {
        if (!selectTipo || !selectTipo.value) {
            toast('Seleccioná primero un tipo para crear atributos', 'warning');
            return;
        }
        window.abrirModalAtributoEquipo();
    }

    function getRutaCrearAtributoPorTipo(idTipo) {
        var template = overlay && overlay.dataset.routeCrearAtributoTipo
            ? String(overlay.dataset.routeCrearAtributoTipo)
            : '/atributos-tipos-equipos/tipos/__TIPO__/atributos/crear';
        return template.replace('__TIPO__', String(idTipo));
    }

    function getRutaCrearOpcionAtributo(idTipo, idAtributo) {
        var template = overlay && overlay.dataset.routeCrearOpcionAtributo
            ? String(overlay.dataset.routeCrearOpcionAtributo)
            : '/atributos-tipos-equipos/tipos/__TIPO__/atributos/__ATTR__/opciones/crear';
        return template
            .replace('__TIPO__', String(idTipo))
            .replace('__ATTR__', String(idAtributo));
    }

    function cerrarModalConOverlay(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('show');
        modal.style.display = 'none';
        if (window.overlayEquipoOculto && overlay) {
            overlay.style.display = 'flex';
            overlay.classList.add('show');
            overlay.classList.remove('modal-oculto');
            overlay.setAttribute('aria-hidden', 'false');
            window.overlayEquipoOculto = false;
        }
    }

    function bindStrictTabTrap(modal) {
        if (!modal || modal.dataset.strictTrapBound === '1') return;
        modal.dataset.strictTrapBound = '1';
        modal.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var focusables = Array.prototype.slice.call(modal.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter(function (el) {
                var st = window.getComputedStyle(el);
                return st.display !== 'none' && st.visibility !== 'hidden' && el.getClientRects().length > 0;
            });
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
                return;
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }, true);
    }

    window.cerrarModalAtributoEquipo = function () {
        if (formAtributoEquipo) formAtributoEquipo.reset();
        cerrarModalConOverlay('modalAtributoEquipo');
    };

    window.cerrarModalOpcionAtributoEquipo = function () {
        if (formOpcionAtributoEquipo) formOpcionAtributoEquipo.reset();
        cerrarModalConOverlay('modalOpcionAtributoEquipo');
    };

    window.abrirModalAtributoEquipo = function () {
        if (!modalAtributoEquipo) return;
        window.overlayEquipoOculto = false;
        modalAtributoEquipo.setAttribute('aria-hidden', 'false');
        modalAtributoEquipo.classList.add('show');
        modalAtributoEquipo.style.display = 'flex';
        modalAtributoEquipo.style.zIndex = '130000';
        if (inputAtributoEquipoNombre) {
            inputAtributoEquipoNombre.value = '';
        }
        if (typeof window.__refocusModal === 'function') {
            window.__refocusModal(modalAtributoEquipo);
        }
        if (typeof window.__scheduleModalFooterAccents === 'function') {
            window.__scheduleModalFooterAccents();
        }
        if (inputAtributoEquipoNombre) {
            setTimeout(function () {
                inputAtributoEquipoNombre.focus();
                inputAtributoEquipoNombre.select();
            }, 10);
        }
    };

    window.abrirModalOpcionAtributoEquipo = function (idAtributo, nombreAtributo) {
        if (!modalOpcionAtributoEquipo) return;
        if (!selectTipo || !selectTipo.value) {
            toast('Seleccioná primero un tipo', 'warning');
            return;
        }
        window.overlayEquipoOculto = false;
        if (inputOpcionAtributoEquipoId) {
            inputOpcionAtributoEquipoId.value = String(idAtributo || '');
        }
        if (inputOpcionAtributoEquipoNombre) {
            inputOpcionAtributoEquipoNombre.value = String(nombreAtributo || '');
        }
        if (inputNuevaOpcionAtributoValor) {
            inputNuevaOpcionAtributoValor.value = '';
        }
        modalOpcionAtributoEquipo.setAttribute('aria-hidden', 'false');
        modalOpcionAtributoEquipo.classList.add('show');
        modalOpcionAtributoEquipo.style.display = 'flex';
        modalOpcionAtributoEquipo.style.zIndex = '130000';
        if (typeof window.__refocusModal === 'function') {
            window.__refocusModal(modalOpcionAtributoEquipo);
        }
        if (typeof window.__scheduleModalFooterAccents === 'function') {
            window.__scheduleModalFooterAccents();
        }
    }

    function snapshotAtributosEquipoActual() {
        if (!equipoAtributosContainer) return '{}';
        var values = {};
        equipoAtributosContainer.querySelectorAll('select[data-atributo-id]').forEach(function(sel) {
            var idAtributo = String(sel.dataset.atributoId || '').trim();
            if (!idAtributo) return;
            var value = String(sel.value || '').trim();
            if (value) values[idAtributo] = value;
        });
        return JSON.stringify(values);
    }

    function renderAtributosEquipo(atributos, valoresIniciales) {
        if (!equipoAtributosBlock || !equipoAtributosContainer) return;

        var lista = Array.isArray(atributos) ? atributos : [];
        var tipoActual = selectTipo ? String(selectTipo.value || '').trim() : '';
        if (!lista.length) {
            equipoAtributosBlock.hidden = !tipoActual;
            equipoAtributosContainer.innerHTML = '';
            equipoAtributosValoresActuales = {};
            return;
        }

        equipoAtributosBlock.hidden = false;
        equipoAtributosContainer.innerHTML = '';
        var valores = valoresIniciales && typeof valoresIniciales === 'object' ? valoresIniciales : {};
        equipoAtributosValoresActuales = valores;

        lista.forEach(function(attr) {
            var row = document.createElement('div');
            row.className = 'equipo-atributo-item';

            var label = document.createElement('div');
            label.className = 'equipo-atributo-label';
            label.textContent = String(attr.nombre || ('Atributo #' + attr.idAtributo));

            var btnOpcion = document.createElement('button');
            btnOpcion.type = 'button';
            btnOpcion.className = 'btn btn-agregar-entidad equipo-atributo-add-opcion';
            btnOpcion.textContent = '+';
            btnOpcion.title = 'Crear opción para este atributo';
            btnOpcion.addEventListener('click', function () {
                window.abrirModalOpcionAtributoEquipo(attr.idAtributo, attr.nombre || ('Atributo #' + attr.idAtributo));
            });

            var select = document.createElement('select');
            select.className = 'form-control';
            select.name = 'atributo_valores[' + String(attr.idAtributo) + ']';
            select.dataset.atributoId = String(attr.idAtributo);

            var optionEmpty = document.createElement('option');
            optionEmpty.value = '';
            optionEmpty.textContent = '— Seleccionar opción —';
            select.appendChild(optionEmpty);

            var opciones = Array.isArray(attr.opciones) ? attr.opciones : [];
            opciones.forEach(function(op) {
                var option = document.createElement('option');
                option.value = String(op);
                option.textContent = String(op);
                select.appendChild(option);
            });

            var valorGuardado = valores[String(attr.idAtributo)] || '';
            if (valorGuardado) {
                select.value = String(valorGuardado);
            }

            select.addEventListener('change', actualizarEstadoSubmitEquipo);

            var controlRow = document.createElement('div');
            controlRow.className = 'equipo-atributo-control-row';
            controlRow.appendChild(select);
            controlRow.appendChild(btnOpcion);

            row.appendChild(label);
            row.appendChild(controlRow);
            equipoAtributosContainer.appendChild(row);
        });
    }

    function cargarAtributosPorTipoEquipo(idTipo, valoresIniciales) {
        if (!equipoAtributosBlock || !equipoAtributosContainer) return;
        if (!idTipo) {
            renderAtributosEquipo([], {});
            actualizarEstadoSubmitEquipo();
            return;
        }

        var gen = ++equipoAtributosFetchGen;
        fetch(getRutaAtributosTipoEquipo(idTipo), {
            headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
        })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (gen !== equipoAtributosFetchGen) return;
                if (!data || !data.success) {
                    renderAtributosEquipo([], {});
                    return;
                }
                renderAtributosEquipo(data.atributos || [], valoresIniciales || {});
                actualizarEstadoSubmitEquipo();
            })
            .catch(function(error) {
                console.error('Error al cargar atributos por tipo:', error);
                if (gen !== equipoAtributosFetchGen) return;
                renderAtributosEquipo([], {});
                actualizarEstadoSubmitEquipo();
            });
    }

    function formatPrecioPanelEquipo(v) {
        if (v === '' || v == null) return '—';
        var n = Number(String(v).replace(',', '.'));
        if (!isFinite(n)) return '$ ' + String(v);
        return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    var equipoPanelFacturaProveedorId = '';
    var equipoPanelFacturaProveedorNombre = '';
    var equipoPanelFacturaFecha = '';
    var equipoPanelFacturaPrecio = '';
    var equipoMostrarPanelFactura = false;

    function refreshEquipoPanelFacturaMain() {
        var panel = document.getElementById('equipoPanelFactura');
        if (!panel) return;
        if (!equipoMostrarPanelFactura) {
            panel.hidden = true;
            return;
        }
        var numInp = getEl('equipoNumeroFactura');
        var num = numInp && numInp.value ? String(numInp.value).trim() : '';
        if (!num) {
            panel.hidden = true;
            return;
        }
        panel.hidden = false;
        var fechaDd = getEl('equipoPanelFacturaFecha');
        if (fechaDd) fechaDd.textContent = equipoPanelFacturaFecha ? formatDateAr(equipoPanelFacturaFecha) : '—';
        var provText = equipoPanelFacturaProveedorNombre || '—';
        if (equipoPanelFacturaProveedorId && equipoPanelFacturaProveedorNombre) {
            provText = String(equipoPanelFacturaProveedorId) + ' - ' + equipoPanelFacturaProveedorNombre;
        }
        var provDd = getEl('equipoPanelFacturaProveedor');
        if (provDd) provDd.textContent = provText;
        var numDd = getEl('equipoPanelFacturaNumero');
        if (numDd) numDd.textContent = num || '—';
        var precDd = getEl('equipoPanelFacturaPrecio');
        if (precDd) precDd.textContent = formatPrecioPanelEquipo(equipoPanelFacturaPrecio);
    }

    function bindPanelFacturaEquipoListeners() {
        // El panel depende de datos de factura; no necesita listeners del precio del equipo.
    }

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
            ubicacionId: getEl('equipoUbicacionId') ? getEl('equipoUbicacionId').value : '',
            sectorId: getEl('equipoSectorId') ? getEl('equipoSectorId').value : '',
            vtoGarantia: getEl('equipoVtoGarantia') ? getEl('equipoVtoGarantia').value : '',
            precio: getEl('equipoPrecio') ? getEl('equipoPrecio').value : '',
            informaSeguro: getEl('equipoInformaSeguro') ? (getEl('equipoInformaSeguro').checked ? '1' : '0') : '0',
            imagenActual: imagenActualInput ? imagenActualInput.value : '',
            imagenNueva: imagenInput && imagenInput.files && imagenInput.files.length > 0 ? '1' : '0',
            atributosJson: snapshotAtributosEquipoActual(),
        };
    }

    function normalizeAtributosEquipoJson(raw) {
        var parsed = parseJsonObjectSafe(raw);
        var normalized = {};
        Object.keys(parsed).sort().forEach(function(key) {
            var cleanKey = String(key || '').trim();
            if (!cleanKey) return;
            var value = parsed[key];
            var cleanValue = value == null ? '' : String(value).trim();
            if (cleanValue) {
                normalized[cleanKey] = cleanValue;
            }
        });
        return JSON.stringify(normalized);
    }

    function normalizePrecioEquipo(raw) {
        var value = String(raw || '').trim();
        if (!value) return '';
        var normalized = Number(value.replace(',', '.'));
        if (!isFinite(normalized)) return value;
        return String(normalized);
    }

    function normalizeEstadoEquipoValue(key, value) {
        if (key === 'atributosJson') {
            return normalizeAtributosEquipoJson(value);
        }
        if (key === 'precio') {
            return normalizePrecioEquipo(value);
        }
        if (key === 'informaSeguro') {
            return String(value) === '1' ? '1' : '0';
        }
        if (key === 'serie' || key === 'observacion' || key === 'vtoGarantia') {
            return String(value || '').trim();
        }
        return String(value || '');
    }

    function tieneDatosCargaEquipo(actual) {
        return Boolean(
            (actual.serie || '').trim() ||
            (actual.observacion || '').trim() ||
            actual.idTipo ||
            actual.idMarca ||
            actual.idModelo ||
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
            return normalizeEstadoEquipoValue(key, actual[key]) !== normalizeEstadoEquipoValue(key, equipoOriginalValues[key]);
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

            if (form.action.endsWith('/crear')) {
                var precioInput = getEl('equipoPrecio');
                var precioRaw = String(precioInput?.value || '').trim();
                if (precioRaw === '') {
                    toast('Ingresá un precio mayor a $ 0,00', 'warning');
                    if (precioInput) {
                        precioInput.focus();
                    }
                    return;
                }
                var precioValue = Number(precioRaw.replace(',', '.'));
                if (!isFinite(precioValue) || precioValue <= 0) {
                    toast('El precio del equipo debe ser mayor a $ 0,00', 'warning');
                    if (precioInput) {
                        precioInput.focus();
                        precioInput.select();
                    }
                    return;
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
                        try {
                            var serieNueva = String(getEl('equipoSerie')?.value || '').trim();
                            if (serieNueva) {
                                sessionStorage.setItem(equipoPendingSerieStorageKey, serieNueva);
                            } else {
                                sessionStorage.removeItem(equipoPendingSerieStorageKey);
                            }
                        } catch (e) {}
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
                                ejecutarTrasToastVisible(function() {
                                    location.reload();
                                });
                                return;
                            }
                            if (data.success) {
                                mostrarToast(data.message || 'Actualizado correctamente', 'success');
                                forceCerrarModalEquipo();
                                ejecutarTrasToastVisible(function() {
                                    location.reload();
                                });
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
        previewEl.textContent = '(vence: ' + formatDateAr(vto) + ')';
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

    /** Evita que respuestas AJAX viejas pisen la UI si hubo varias cargas seguidas (p. ej. change + callback). */
    var equipoMarcasFetchGen = 0;
    var equipoModelosFetchGen = 0;

    function cargarMarcasPorTipo(idTipo, idMarcaSeleccionar, callback) {
        var marcaSelect = document.getElementById('equipoIdMarca') || selectMarca;

        if (!marcaSelect) return;

        var gen = ++equipoMarcasFetchGen;

        var url = '/marcas/api';
        if (idTipo) {
            url += '?idTipo=' + encodeURIComponent(idTipo);
        }

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(marcas) {
                if (gen !== equipoMarcasFetchGen) return;
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

        var gen = ++equipoModelosFetchGen;

        modeloSelect.innerHTML = '<option value="">— Seleccionar modelo —</option>';

        if (!idMarca || !idTipo) {
            if (callback) callback();
            return;
        }

        fetch('/modelos/marca/' + idMarca + '/tipo/' + idTipo)
            .then(function(response) { return response.json(); })
            .then(function(modelos) {
                if (gen !== equipoModelosFetchGen) return;
                modelos.forEach(function(modelo) {
                    var option = document.createElement('option');
                    option.value = modelo.idModelo;
                    option.textContent = modelo.modelo;
                    modeloSelect.appendChild(option);
                });
                if (callback) callback();
            })
            .catch(function(error) {
                console.error('Error al cargar modelos:', error);
            });
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
            cargarAtributosPorTipoEquipo(this.value, {});
        });
    }

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
            var hasImage = previewImagen.classList.contains('has-image') && previewImgTag && previewImgTag.src;
            if (hasImage) {
                var zoomModal = getEl('modalImagenEquipo');
                var zoomImg = getEl('modalImagenEquipoImg');
                if (!zoomModal || !zoomImg) return;
                zoomImg.src = previewImgTag.src;
                zoomModal.classList.add('show');
                zoomModal.setAttribute('aria-hidden', 'false');
                return;
            }
            imagenInput.click();
        });
    }

    (function bindModalImagenEquipo() {
        var zoomModal = getEl('modalImagenEquipo');
        var zoomImg = getEl('modalImagenEquipoImg');
        if (!zoomModal || zoomModal.dataset.bound === '1') return;
        zoomModal.dataset.bound = '1';

        function cerrarZoom() {
            zoomModal.classList.remove('show');
            zoomModal.setAttribute('aria-hidden', 'true');
            if (zoomImg) zoomImg.src = '';
        }

        var btnCerrar = getEl('modalImagenEquipoCerrar');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarZoom);
        }

        zoomModal.addEventListener('click', function(e) {
            if (e.target === zoomModal) {
                cerrarZoom();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && zoomModal.classList.contains('show')) {
                cerrarZoom();
            }
        });
    })();

    window.abrirModalEquipo = function(mode, element) {
        if (!overlay || !form || !titulo || !submitBtn) {
            console.warn('Modal de equipo no disponible en esta vista');
            return;
        }
        ['buscarEquipoTipo', 'buscarEquipoMarca', 'buscarEquipoModelo'].forEach(function(inpId) {
            var inp = getEl(inpId);
            if (inp) inp.value = '';
        });
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
            cargarAtributosPorTipoEquipo('', {});
            getEl('equipoIdModelo').innerHTML = '<option value="">— Seleccionar modelo —</option>';
            getEl('equipoUbicacionId').value = '';
            getEl('equipoSectorId').value = '';
            getEl('equipoVtoGarantia').value = '';
            if (getEl('equipoInformaSeguro')) getEl('equipoInformaSeguro').checked = true;
            setGarantiaEquipo(new Date().toISOString().slice(0, 10), '');
            getEl('equipoPrecio').value = '';
            if (getEl('equipoNumeroFactura')) getEl('equipoNumeroFactura').value = '';
            equipoPanelFacturaProveedorId = '';
            equipoPanelFacturaProveedorNombre = '';
            equipoPanelFacturaFecha = '';
            equipoPanelFacturaPrecio = '';
            equipoMostrarPanelFactura = false;
            // Resetear imagen
            imagenInput.value = '';
            previewImgTag.src = '';
            previewImagen.classList.remove('has-image');
            previewPlaceholder.style.display = 'block';
            btnEliminarImagen.style.display = 'none';
            imagenActualInput.value = '';
            submitBtn.textContent = 'Guardar';
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
            var idTipoEdit = dataset.idTipo || '';
            var idMarcaEdit = dataset.idMarca || '';
            var idModeloEdit = dataset.idModelo || '';
            var atributosValoresEdit = parseJsonObjectSafe(dataset.atributosValores || '{}');
            getEl('equipoPrecio').value = dataset.precio || '';
            getEl('equipoVtoGarantia').value = dataset.vtoGarantia || '';
            getEl('equipoNumeroFactura').value = dataset.numeroFactura || '';
            equipoPanelFacturaProveedorId = dataset.facturaProveedorId || '';
            equipoPanelFacturaProveedorNombre = dataset.proveedorNombre || '';
            if (dataset.facturaProveedorNombre) {
                equipoPanelFacturaProveedorNombre = dataset.facturaProveedorNombre;
            }
            equipoPanelFacturaFecha = dataset.facturaFecha || '';
            equipoPanelFacturaPrecio = dataset.facturaPrecioEquipo || dataset.precio || '';
            var numeroFacturaEdit = String(dataset.numeroFactura || '').trim();
            var idEquipoEdit = String(dataset.id || '').trim();
            var idProveedorEdit = String(dataset.idProveedor || '').trim();
            // No mostrar el panel para registros heredados con numeroFactura = ID.
            equipoMostrarPanelFactura = Boolean(
                numeroFacturaEdit && (numeroFacturaEdit !== idEquipoEdit || idProveedorEdit)
            );
            var baseGarantia = dataset.fechaInicioGarantia || new Date().toISOString().slice(0, 10);
            setGarantiaEquipo(baseGarantia, dataset.vtoGarantia || '');
            var informaCheckbox = getEl('equipoInformaSeguro');
            if (informaCheckbox) {
                informaCheckbox.checked = dataset.informaSeguro === '1' || dataset.informaSeguro === 'true';
            }
            var idUbicacionEquipo = dataset.ubicacionId || '';
            var idSectorEquipo = dataset.sectorId || '';
            getEl('equipoUbicacionId').value = idUbicacionEquipo;
            getEl('equipoSectorId').value = idSectorEquipo;
            recargarSelectSectores(idUbicacionEquipo, idSectorEquipo);
            refreshEquipoPanelFacturaMain();

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
            submitBtn.textContent = 'Guardar';
            equipoOriginalValues = {
                serie: dataset.serie || '',
                observacion: dataset.observacion || '',
                idTipo: String(dataset.idTipo || ''),
                idMarca: String(dataset.idMarca || ''),
                idModelo: String(dataset.idModelo || ''),
                ubicacionId: String(idUbicacionEquipo || ''),
                sectorId: String(idSectorEquipo || ''),
                vtoGarantia: dataset.vtoGarantia || '',
                precio: dataset.precio || '',
                informaSeguro: dataset.informaSeguro === '1' || dataset.informaSeguro === 'true' ? '1' : '0',
                imagenActual: imagenUrl || '',
                imagenNueva: '0',
                atributosJson: JSON.stringify(atributosValoresEdit),
            };
            equipoHasChanges = false;
            equipoEditMode = true;
            equipoIsSubmitting = false;

            cargarMarcasPorTipo(idTipoEdit, idMarcaEdit, function() {
                cargarModelosPorMarcaYTipo(idMarcaEdit, idTipoEdit, function() {
                    var selModelo = getEl('equipoIdModelo');
                    if (selModelo && idModeloEdit) {
                        selModelo.value = String(idModeloEdit);
                    }
                    refreshEquipoPanelFacturaMain();
                    actualizarEstadoSubmitEquipo();
                });
            });
            cargarAtributosPorTipoEquipo(idTipoEdit, atributosValoresEdit);
        }
        if (mode === 'crear' || !dataset) {
            refreshEquipoPanelFacturaMain();
        }
        if (!(equipoEditMode && dataset)) {
            actualizarEstadoSubmitEquipo();
        }
        
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
        bindPanelFacturaEquipoListeners();
    }

    if (modalAtributoEquipo && modalAtributoEquipo.dataset.bound !== '1') {
        modalAtributoEquipo.dataset.bound = '1';
        bindStrictTabTrap(modalAtributoEquipo);
        modalAtributoEquipo.addEventListener('click', function (e) {
            if (e.target === modalAtributoEquipo) {
                window.cerrarModalAtributoEquipo();
            }
        });
    }

    if (modalOpcionAtributoEquipo && modalOpcionAtributoEquipo.dataset.bound !== '1') {
        modalOpcionAtributoEquipo.dataset.bound = '1';
        modalOpcionAtributoEquipo.addEventListener('click', function (e) {
            if (e.target === modalOpcionAtributoEquipo) {
                window.cerrarModalOpcionAtributoEquipo();
            }
        });
    }

    if (formAtributoEquipo && formAtributoEquipo.dataset.bound !== '1') {
        formAtributoEquipo.dataset.bound = '1';
        formAtributoEquipo.addEventListener('submit', function (e) {
            e.preventDefault();
            var idTipoActual = selectTipo ? String(selectTipo.value || '').trim() : '';
            var nombre = inputAtributoEquipoNombre ? String(inputAtributoEquipoNombre.value || '').slice(0, 30).trim() : '';
            if (!idTipoActual) {
                toast('Seleccioná un tipo antes de crear atributos', 'warning');
                return;
            }
            if (!nombre) {
                toast('Ingresá un nombre de atributo', 'warning');
                return;
            }

            fetch(getRutaCrearAtributoPorTipo(idTipoActual), {
                method: 'POST',
                headers: CrudCommon.jsonHeaders({
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ nombre: nombre }),
            })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (!data || !data.success) {
                    var errorNombre = data && data.errors && Array.isArray(data.errors.nombre) ? data.errors.nombre[0] : '';
                    toast(errorNombre || (data && data.message ? data.message : 'No se pudo crear el atributo'), 'error');
                    return;
                }
                toast(data.message || 'Atributo creado correctamente', 'success');
                window.cerrarModalAtributoEquipo();
                var snapshot = parseJsonObjectSafe(snapshotAtributosEquipoActual());
                if (selectTipo && selectTipo.value) {
                    cargarAtributosPorTipoEquipo(selectTipo.value, snapshot);
                }
            })
            .catch(function () {
                toast('Error al crear el atributo', 'error');
            });
        });
    }

    if (formOpcionAtributoEquipo && formOpcionAtributoEquipo.dataset.bound !== '1') {
        formOpcionAtributoEquipo.dataset.bound = '1';
        formOpcionAtributoEquipo.addEventListener('submit', function (e) {
            e.preventDefault();
            var idTipoActual = selectTipo ? String(selectTipo.value || '').trim() : '';
            var idAtributo = inputOpcionAtributoEquipoId ? String(inputOpcionAtributoEquipoId.value || '').trim() : '';
            var valor = inputNuevaOpcionAtributoValor ? String(inputNuevaOpcionAtributoValor.value || '').slice(0, 30).trim() : '';
            if (!idTipoActual || !idAtributo) {
                toast('No se pudo identificar el atributo seleccionado', 'error');
                return;
            }
            if (!valor) {
                toast('Ingresá una opción válida', 'warning');
                return;
            }

            fetch(getRutaCrearOpcionAtributo(idTipoActual, idAtributo), {
                method: 'POST',
                headers: CrudCommon.jsonHeaders({
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ valor: valor }),
            })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (!data || !data.success) {
                    var errorValor = data && data.errors && Array.isArray(data.errors.valor) ? data.errors.valor[0] : '';
                    toast(errorValor || (data && data.message ? data.message : 'No se pudo crear la opción'), 'error');
                    return;
                }
                toast(data.message || 'Opción creada correctamente', 'success');
                window.cerrarModalOpcionAtributoEquipo();
                var snapshot = parseJsonObjectSafe(snapshotAtributosEquipoActual());
                snapshot[String(idAtributo)] = valor;
                if (selectTipo && selectTipo.value) {
                    cargarAtributosPorTipoEquipo(selectTipo.value, snapshot);
                }
            })
            .catch(function () {
                toast('Error al crear la opción', 'error');
            });
        });
    }

    if (btnAbrirGestorAtributosEquipo && btnAbrirGestorAtributosEquipo.dataset.bound !== '1') {
        btnAbrirGestorAtributosEquipo.dataset.bound = '1';
        btnAbrirGestorAtributosEquipo.addEventListener('click', openGestionAtributosEquipo);
    }

    if (typeof window.debugClick === 'function') {
        var originalDebugClick = window.debugClick;
        if (!originalDebugClick.__equipoAttrsWrapped) {
            window.debugClick = function(tipo) {
                if (String(tipo || '').toLowerCase() === 'atributo') {
                    openGestionAtributosEquipo();
                    return;
                }
                return originalDebugClick.apply(this, arguments);
            };
            window.debugClick.__equipoAttrsWrapped = true;
        }
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
    var equipoRowSelector = '#tablaEquipos tbody tr[data-id]';
    var equipoSelectionStorageKey = 'crud-selection::' + window.location.pathname + '::' + equipoRowSelector;
    var equipoPendingSerieStorageKey = 'crud-pending-created::' + window.location.pathname + '::equipo-serie';
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
        try {
            if (selectedEquipoId) {
                sessionStorage.setItem(equipoSelectionStorageKey, String(selectedEquipoId));
            } else {
                sessionStorage.removeItem(equipoSelectionStorageKey);
            }
        } catch (e) {}
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

    (function restoreEquipoSelection() {
        try {
            var pendingSerie = (sessionStorage.getItem(equipoPendingSerieStorageKey) || '').trim();
            if (pendingSerie) {
                sessionStorage.removeItem(equipoPendingSerieStorageKey);
                var rowBySerie = Array.from(document.querySelectorAll(equipoRowSelector)).find(function(row) {
                    return String(row.dataset.serie || '').trim() === pendingSerie;
                });
                if (rowBySerie) {
                    selectedRow = rowBySerie;
                    selectedEquipoId = rowBySerie.dataset.id || null;
                    selectedEquipoSerie = rowBySerie.dataset.serie || null;
                    actualizarSeleccion();
                    return;
                }
            }
            var persistedId = sessionStorage.getItem(equipoSelectionStorageKey) || '';
            if (!persistedId) return;
            var rowById = Array.from(document.querySelectorAll(equipoRowSelector)).find(function(row) {
                return String(row.dataset.id || '') === String(persistedId);
            });
            if (!rowById) return;
            selectedRow = rowById;
            selectedEquipoId = rowById.dataset.id || null;
            selectedEquipoSerie = rowById.dataset.serie || null;
            actualizarSeleccion();
        } catch (e) {}
    })();

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
            var sectoresOrdenados = (Array.isArray(sectores) ? sectores.slice() : []).sort(function(a, b) {
                var nombreA = String(a?.nombre || a?.nombreSector || '').toLocaleLowerCase('es');
                var nombreB = String(b?.nombre || b?.nombreSector || '').toLocaleLowerCase('es');
                return nombreA.localeCompare(nombreB, 'es');
            });
            selects.forEach(function(select) {
                if (!select) return;
                var selectedValue = select.value;
                select.innerHTML = '<option value="">— Sin especificar —</option>';
                sectoresOrdenados.forEach(function(sector) {
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


(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

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
    var selectMarca = document.getElementById('equipoIdMarca');
    var selectModelo = document.getElementById('equipoIdModelo');

    function getEl(id) { return document.getElementById(id); }

    // Función para cargar modelos por marca via AJAX
    window.cargarModelosPorMarca = function(idMarca, callback) {
        var modeloSelect = selectModelo;
        
        // Guardar el valor actual del modelo seleccionado
        var modeloActual = modeloSelect ? modeloSelect.value : '';
        
        // Limpiar opciones actuales (mantener solo la primera opción por defecto)
        if (modeloSelect) {
            modeloSelect.innerHTML = '<option value="">— Sin especificar —</option>';
            
            if (idMarca) {
                // Hacer petición AJAX para obtener modelos de la marca
                fetch('/modelos/marca/' + idMarca)
                    .then(function(response) { return response.json(); })
                    .then(function(modelos) {
                        modelos.forEach(function(modelo) {
                            var option = document.createElement('option');
                            option.value = modelo.idModelo;
                            option.textContent = modelo.modelo;
                            modeloSelect.appendChild(option);
                        });
                        
                        // Si hay un callback, ejecutarlo
                        if (callback) {
                            callback();
                        }
                    })
                    .catch(function(error) {
                        console.error('Error al cargar modelos:', error);
                    });
            }
        }
    };

    // Event listener para cuando cambia la marca
    if (selectMarca && selectModelo) {
        selectMarca.addEventListener('change', function() {
            var idMarca = this.value;
            cargarModelosPorMarca(idMarca);
        });
    }

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
            getEl('equipoIdMarca').value = '';
            getEl('equipoIdTipo').value = '';
            getEl('equipoIdModelo').value = '';
            getEl('equipoIdProveedor').value = '';
            getEl('equipoUbicacionId').value = '';
            getEl('equipoSectorId').value = '';
            getEl('equipoVtoGarantia').value = '';
            getEl('equipoPrecio').value = '';
            // Resetear imagen
            imagenInput.value = '';
            previewImgTag.src = '';
            previewImagen.classList.remove('has-image');
            previewPlaceholder.style.display = 'block';
            btnEliminarImagen.style.display = 'none';
            imagenActualInput.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            titulo.textContent = 'Editar Equipo';
            form.action = '/equipos/' + (dataset.id || '') + '/actualizar';
            getEl('equipoSerie').value = dataset.serie || '';
            getEl('equipoObservacion').value = dataset.observacion || '';
            getEl('equipoIdTipo').value = dataset.idTipo || '';
            getEl('equipoIdProveedor').value = dataset.idProveedor || '';
            getEl('equipoUbicacionId').value = dataset.ubicacionId || '';
            getEl('equipoSectorId').value = dataset.sectorId || '';
            getEl('equipoVtoGarantia').value = dataset.vtoGarantia || '';
            getEl('equipoPrecio').value = dataset.precio || '';
            
            // Guardar el idModelo antes de establecer la marca
            var idModeloEquipo = dataset.idModelo || '';
            
            // Establecer la marca y luego cargar sus modelos
            getEl('equipoIdMarca').value = dataset.idMarca || '';
            
            // Cargar modelos de la marca y luego seleccionar el modelo del equipo
            var idMarcaEquipo = dataset.idMarca || '';
            if (idMarcaEquipo) {
                cargarModelosPorMarca(idMarcaEquipo, function() {
                    // Después de cargar los modelos, seleccionar el del equipo
                    getEl('equipoIdModelo').value = idModeloEquipo;
                });
            } else {
                getEl('equipoIdModelo').value = '';
            }
            
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
        }
        overlay.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalEquipo = function() { overlay.setAttribute('aria-hidden', 'true'); };

    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModalEquipo(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') cerrarModalEquipo();
    });

    document.querySelectorAll('.btn-editar-equipo').forEach(function(btn) {
        btn.addEventListener('click', function() { abrirModalEquipo('editar', this); });
    });

    document.querySelectorAll('.btn-ver-historial').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var equipoId = this.dataset.id;
            if (equipoId) {
                window.location.href = '/historial/equipo/' + equipoId;
            }
        });
    });

    document.getElementById('buscadorEquipos')?.addEventListener('input', function() {
        var f = this.value.toLowerCase().trim();
        document.querySelectorAll('#tablaEquipos tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
        });
    });

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

    /* --- Ordenar por columnas (click en headers) --- */
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

    /* --- Botones de baja con modal de confirmación --- */
    document.querySelectorAll('#tablaEquipos .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var equipoId = form.action.match(/\/equipos\/(\d+)\/baja/)[1];
            var equipoSerie = btn.closest('tr').querySelector('td').textContent;

            abrirModalConfirmacion(
                'Dar de baja equipo',
                '¿Estás seguro de dar de baja el equipo "' + equipoSerie + '"?',
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
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaEquipos .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var equipoSerie = btn.closest('tr').querySelector('td').textContent;

            abrirModalConfirmacion(
                'Activar equipo',
                '¿Estás seguro de activar el equipo "' + equipoSerie + '"?',
                function() {
                    mostrarToast('Activando el equipo...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();


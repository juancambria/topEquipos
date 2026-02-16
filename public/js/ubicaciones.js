(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {

    var overlayUbicacion = document.getElementById('modalUbicacion');
    var formUbicacion = document.getElementById('formUbicacion');
    var tituloUbicacion = document.getElementById('modalUbicacionTitulo');
    var inputId = document.getElementById('ubicacionId');
    var inputNombre = document.getElementById('ubicacionNombre');
    var submitBtn = document.getElementById('modalUbicacionSubmit');

    /* --- Modal crear/editar Ubicación --- */
    window.abrirModalUbicacion = function(mode, id, nombre) {
        if (mode === 'crear') {
            tituloUbicacion.textContent = 'Nueva Ubicación';
            formUbicacion.action = '/ubicaciones/crear';
            inputId.value = '';
            inputNombre.value = '';
            submitBtn.textContent = 'Crear';
        } else {
            tituloUbicacion.textContent = 'Editar Ubicación';
            formUbicacion.action = '/ubicaciones/' + id + '/actualizar';
            inputId.value = '';
            inputId.disabled = true;
            inputNombre.value = nombre || '';
            submitBtn.textContent = 'Actualizar';
        }
        overlayUbicacion.setAttribute('aria-hidden', 'false');
    };

    window.cerrarModalUbicacion = function() {
        overlayUbicacion.setAttribute('aria-hidden', 'true');
        inputId.disabled = false;
    };

    overlayUbicacion.addEventListener('click', function(e) {
        if (e.target === overlayUbicacion) cerrarModalUbicacion();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        if (overlayUbicacion.getAttribute('aria-hidden') === 'false') { cerrarModalUbicacion(); return; }
        var ms = document.getElementById('modalSectores');
        if (ms && ms.style.display === 'flex') cerrarModalSectores();
    });

    document.querySelectorAll('.btn-editar-ubicacion').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModalUbicacion('editar', btn.dataset.id, btn.dataset.nombre);
        });
    });

    /* --- Buscador ubicaciones --- */
    document.getElementById('buscadorUbicaciones')?.addEventListener('input', function() {
        var f = this.value.toLowerCase().trim();
        document.querySelectorAll('#tablaUbicaciones tbody tr').forEach(function(tr) {
            if (tr.querySelector('.td-vacio')) return;
            tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
        });
    });

    /* --- Ordenar por columnas (click en headers) --- */
    document.querySelectorAll('#tablaUbicaciones th.sortable').forEach(function(th) {
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

    /* --- Flujo "Ver sectores": modales con display flex --- */
    window.abrirModal = function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    };

    window.cerrarModal = function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
    };

    window.cerrarModalSectores = function() {
        cerrarModal('modalSectores');
    };

    document.querySelectorAll('.modal-antiguo').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (e.target !== el) return;
            if (el.id === 'modalSectores') cerrarModalSectores();
            else cerrarModal(el.id);
        });
    });

    /* --- Ver sectores con checkboxes --- */
    document.querySelectorAll('.btn-ver-sectores').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var ubicacionId = btn.dataset.id;
            var ubicacionNombre = btn.dataset.nombre;

            abrirModal('modalSectores');
            document.getElementById('tituloSectores').textContent = 'Sectores de ' + ubicacionNombre;

            var tbody = document.getElementById('bodySectores');
            tbody.innerHTML = '';

            fetch('/api/sectores/ubicacion/' + ubicacionId)
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    data.forEach(function(sector) {
                        var tr = document.createElement('tr');
                        var badgeClass = sector.estado === 'activo' ? 'badge-activo' : 'badge-baja';
                        var checked = sector.asociado ? 'checked' : '';
                        tr.innerHTML = '<td>' +
                            '<input type="checkbox" class="sector-checkbox" data-sector-id="' + sector.id + '" ' + checked + '>' +
                            '</td>' +
                            '<td>' + (sector.nombre || '') + '</td>' +
                            '<td><span class="badge ' + badgeClass + '">' + (sector.estado || '') + '</span></td>';
                        tbody.appendChild(tr);
                    });

                    // Agregar eventos a los checkboxes
                    document.querySelectorAll('.sector-checkbox').forEach(function(checkbox) {
                        checkbox.addEventListener('change', function() {
                            var sectorId = this.dataset.sectorId;
                            var asociado = this.checked ? 1 : 0;
                            asociarSector(ubicacionId, sectorId, asociado);
                        });
                    });
                });
        });
    });

    /* --- Asociar/desasociar sector a ubicación via AJAX --- */
    function asociarSector(ubicacionId, sectorId, asociado) {
        var formData = new FormData();
        formData.append('sector_id', sectorId);
        formData.append('ubicacion_id', ubicacionId);
        
        var token = document.querySelector('meta[name="csrf-token"]');
        if (token) {
            formData.append('_token', token.getAttribute('content'));
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
            console.log('Sector asociado correctamente');
        })
        .catch(function(error) {
            console.error('Error completo:', error);
            // Revertir el checkbox
            var checkbox = document.querySelector('.sector-checkbox[data-sector-id="' + sectorId + '"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            // Mostrar error más descriptivo
            var msg = error.message;
            // Si es HTML (página de error de Laravel), extraer solo el mensaje relevante
            if (msg.includes('<!DOCTYPE') || msg.includes('<html')) {
                // Buscar mensaje de error en la página
                var match = msg.match(/class="exception-message"[^>]*>([^<]+)/);
                if (match) {
                    msg = match[1].trim();
                } else {
                    msg = 'Error del servidor (revisa la consola del navegador)';
                }
            }
            alert('Error al asociar el sector: ' + msg);
            console.log('Respuesta del servidor:', msg);
        });
    }

    /* --- Botones de baja con modal de confirmación --- */
    document.querySelectorAll('#tablaUbicaciones .form-baja').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-baja');
            var ubicacionNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Dar de baja ubicación',
                '¿Estás seguro de dar de baja la ubicación "' + ubicacionNombre + '"?',
                function(observacion) {
                    var inputObs = document.createElement('input');
                    inputObs.type = 'hidden';
                    inputObs.name = 'observacion';
                    inputObs.value = observacion;
                    form.appendChild(inputObs);

                    mostrarToast('Dando de baja la ubicación...', 'warning');
                    form.submit();
                }
            );
        });
    });

    /* --- Botón de alta con confirmación normal --- */
    document.querySelectorAll('#tablaUbicaciones .form-alta').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.btn-alta');
            var ubicacionNombre = btn.closest('tr').querySelector('td:nth-child(2)').textContent;

            abrirModalConfirmacion(
                'Activar ubicación',
                '¿Estás seguro de activar la ubicación "' + ubicacionNombre + '"?',
                function() {
                    mostrarToast('Activando la ubicación...', 'warning');
                    form.submit();
                }
            );
        });
    });

    }); // Fin DOMContentLoaded

})();


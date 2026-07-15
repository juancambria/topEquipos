(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var pagina = document.getElementById('paginaIncidencias');
        if (!pagina) return;

        var urlBase = pagina.dataset.urlBase;
        var urlCrear = pagina.dataset.urlCrear;
        var selectedId = null;
        var fotosEliminar = [];
        var fechaDiaSeleccionado = null;
        var formSnapshot = null;
        var previewUrls = [];

        var modal = document.getElementById('modalIncidencia');
        var modalDia = document.getElementById('modalDiaIncidencias');
        var form = document.getElementById('formIncidencia');
        var fotosInput = document.getElementById('incidenciaFotos');
        var tbody = document.querySelector('#tablaIncidencias tbody');

        var fotosCola = OperacionesForm.createColaFotos({
            max: 5,
            contarExistentes: function () {
                return document.querySelectorAll('#incidenciaFotosExistentes .op-foto-item').length;
            },
            avisar: function (msg) { mostrarToast(msg, 'warning'); },
        });

        if (typeof CrudCommon !== 'undefined') {
            CrudCommon.initSearchInput({ selector: '#searchInput' });
            CrudCommon.initSortableHeaders('#tablaIncidencias .sortable');
        }

        OperacionesForm.bindDirtyTracking(form, getFormState, function () {});

        document.querySelectorAll('.op-vista-toggle button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var url = new URL(window.location.href);
                url.searchParams.set('vista', btn.dataset.vista);
                window.location.href = url.toString();
            });
        });

        document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
        document.getElementById('filtroPrioridad')?.addEventListener('change', aplicarFiltros);

        function aplicarFiltros() {
            var url = new URL(window.location.href);
            var est = document.getElementById('filtroEstado').value;
            var pri = document.getElementById('filtroPrioridad').value;
            if (est) url.searchParams.set('estado', est); else url.searchParams.delete('estado');
            if (pri) url.searchParams.set('prioridad', pri); else url.searchParams.delete('prioridad');
            window.location.href = url.toString();
        }

        if (pagina.dataset.vista === 'calendario') {
            OperacionesCalendar({
                apiUrl: pagina.dataset.apiCalendario,
                gridEl: document.getElementById('calGrid'),
                dowEl: document.getElementById('calDow'),
                titleEl: document.getElementById('calTitulo'),
                prevBtn: document.getElementById('calPrev'),
                nextBtn: document.getElementById('calNext'),
                getEventClass: function (item) { return 'op-estado-' + (item.estado || 'pendiente'); },
                getEventLabel: function (item) { return item.incidencia || ('#' + item.id); },
                onDayClick: function (ymd, items) {
                    fechaDiaSeleccionado = ymd;
                    if (items.length === 0) {
                        abrirModalCrear(ymd);
                        return;
                    }
                    abrirModalDia(ymd, items);
                },
            }).cargar();
        }

        function getFormState() {
            return {
                snapshot: formSnapshot,
                extras: {
                    fotosEliminar: fotosEliminar,
                    nuevasFotos: fotosCola.getFiles(),
                },
            };
        }

        function hayCambios() {
            return OperacionesForm.isDirty(form, formSnapshot, getFormState().extras);
        }

        function capturarSnapshot() {
            formSnapshot = OperacionesForm.captureSnapshot(form);
        }

        function abrirModalDia(ymd, items) {
            document.getElementById('modalDiaIncidenciasTitulo').textContent = 'Incidencias — ' + formatFecha(ymd);
            var lista = document.getElementById('listaDiaIncidencias');
            lista.innerHTML = items.map(function (item) {
                return '<div class="op-dia-item" data-id="' + item.id + '">' +
                    '<span><span class="op-badge op-estado-' + item.estado + '">' + item.estado_label + '</span> ' +
                    escapeHtml(item.incidencia) + '</span>' +
                    '<span>#' + item.id + '</span></div>';
            }).join('');
            lista.querySelectorAll('.op-dia-item').forEach(function (el) {
                el.addEventListener('click', function () {
                    forceCerrarModal(modalDia);
                    cargarYEditar(el.dataset.id);
                });
            });
            abrirModal(modalDia);
        }

        document.getElementById('btnNuevaIncidenciaDia')?.addEventListener('click', function () {
            forceCerrarModal(modalDia);
            abrirModalCrear(fechaDiaSeleccionado);
        });
        document.getElementById('cerrarModalDiaIncidencias')?.addEventListener('click', function () { forceCerrarModal(modalDia); });
        document.getElementById('cerrarModalDiaIncidencias2')?.addEventListener('click', function () { forceCerrarModal(modalDia); });

        document.getElementById('btnAnadir')?.addEventListener('click', function () { abrirModalCrear(null); });
        document.getElementById('btnEditar')?.addEventListener('click', function () {
            if (selectedId) cargarYEditar(selectedId);
        });
        document.getElementById('btnEliminar')?.addEventListener('click', eliminarSeleccionada);
        document.getElementById('cerrarModalIncidencia')?.addEventListener('click', solicitarCerrarModal);
        document.getElementById('cancelarModalIncidencia')?.addEventListener('click', solicitarCerrarModal);

        document.getElementById('incidenciaLugar')?.addEventListener('change', cargarSectores);
        fotosInput?.addEventListener('change', function () {
            fotosCola.agregarDesdeInput(fotosInput);
            renderPreviewNuevasFotos();
        });
        document.querySelector('label[for="incidenciaFotos"]')?.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fotosInput?.click();
            }
        });
        form?.addEventListener('submit', guardarIncidencia);

        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var tr = e.target.closest('tr[data-id]');
                if (!tr) return;
                seleccionarFila(tr);
            });
            tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
                tr.addEventListener('dblclick', function () { cargarYEditar(tr.dataset.id); });
            });
        }

        function seleccionarFila(tr) {
            tbody.querySelectorAll('tr').forEach(function (r) { r.classList.remove('selected'); });
            tr.classList.add('selected');
            selectedId = tr.dataset.id;
            document.getElementById('selectedInfo').textContent = 'Incidencia #' + selectedId + ' seleccionada';
            document.getElementById('btnEditar').disabled = false;
            document.getElementById('btnEliminar').disabled = false;
        }

        function abrirModalCrear(fecha) {
            limpiarPreviews();
            fotosEliminar = [];
            document.getElementById('modalIncidenciaTitulo').textContent = 'Nueva incidencia';
            form.reset();
            document.getElementById('incidenciaId').value = '';
            document.getElementById('incidenciaFotosExistentes').innerHTML = '';
            document.getElementById('incidenciaFecha').value = fecha || toYmd(new Date());
            document.getElementById('incidenciaEstado').value = 'pendiente';
            document.getElementById('incidenciaPrioridad').value = 'media';
            document.getElementById('incidenciaProgreso').value = '0';
            resetSectorSelect();
            capturarSnapshot();
            abrirModal(modal);
        }

        function cargarYEditar(id) {
            fetch(urlBase + '/' + id, { headers: jsonHeaders() })
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    if (!json.success) throw new Error(json.message || 'Error');
                    rellenarFormulario(json.data);
                    abrirModal(modal);
                })
                .catch(function (err) {
                    mostrarToast(err.message || 'No se pudo cargar la incidencia', 'error');
                });
        }

        function rellenarFormulario(data) {
            limpiarPreviews();
            fotosEliminar = [];
            document.getElementById('modalIncidenciaTitulo').textContent = 'Editar incidencia #' + data.id;
            document.getElementById('incidenciaId').value = data.id;
            document.getElementById('incidenciaFecha').value = data.fecha || '';
            document.getElementById('incidenciaLugar').value = data.codigoLugar || '';
            cargarSectores().then(function () {
                document.getElementById('incidenciaSector').value = data.codigoSector || '';
                capturarSnapshot();
                if (window.__refocusModal) window.__refocusModal(modal);
            });
            document.getElementById('incidenciaSolicito').value = data.solicito || '';
            document.getElementById('incidenciaAsunto').value = data.incidencia || '';
            document.getElementById('incidenciaEstado').value = data.estado || 'pendiente';
            document.getElementById('incidenciaPrioridad').value = data.prioridad || 'media';
            document.getElementById('incidenciaObservacion').value = data.observacion || '';
            document.getElementById('incidenciaResolucion').value = data.incidenciaResolucion || '';
            document.getElementById('incidenciaFechaResolucion').value = data.fechaResolucion || '';
            document.getElementById('incidenciaTecnico').value = data.codigoTecnico || '';
            document.getElementById('incidenciaProgreso').value = data.completado || 0;
            renderFotosExistentes(data.fotos || []);
            if (!data.codigoLugar) capturarSnapshot();
        }

        function renderFotosExistentes(fotos) {
            var cont = document.getElementById('incidenciaFotosExistentes');
            cont.innerHTML = fotos.map(function (f) {
                return '<div class="op-foto-item" data-id="' + f.id + '">' +
                    '<img src="' + f.url + '" alt="' + escapeAttr(f.nombre) + '">' +
                    '<button type="button" class="btn-quitar-foto" data-id="' + f.id + '">×</button></div>';
            }).join('');
            cont.querySelectorAll('.btn-quitar-foto').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    fotosEliminar.push(btn.dataset.id);
                    btn.closest('.op-foto-item').remove();
                });
            });
        }

        function renderPreviewNuevasFotos() {
            previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
            previewUrls = [];
            var cont = document.getElementById('incidenciaFotosPreview');
            if (!cont) return;
            cont.innerHTML = '';
            fotosCola.getFiles().forEach(function (file, idx) {
                var url = URL.createObjectURL(file);
                previewUrls.push(url);
                var div = document.createElement('div');
                div.className = 'op-foto-item op-foto-item--nueva';
                div.innerHTML = '<img src="' + url + '" alt="' + escapeAttr(file.name) + '">' +
                    '<button type="button" class="btn-quitar-foto btn-quitar-foto-nueva" data-idx="' + idx + '" title="Quitar">×</button>';
                cont.appendChild(div);
            });
            cont.querySelectorAll('.btn-quitar-foto-nueva').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    fotosCola.quitar(parseInt(btn.dataset.idx, 10), fotosInput);
                    renderPreviewNuevasFotos();
                });
            });
        }

        function limpiarPreviews() {
            previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
            previewUrls = [];
            var prev = document.getElementById('incidenciaFotosPreview');
            if (prev) prev.innerHTML = '';
            fotosCola.limpiar(fotosInput);
        }

        function adjuntarFotosFormData(fd) {
            fotosCola.appendToFormData(fd);
        }

        function guardarIncidencia(e) {
            e.preventDefault();
            var id = document.getElementById('incidenciaId').value;
            var esCrear = !id;
            var asunto = document.getElementById('incidenciaAsunto').value.trim() || 'incidencia';

            OperacionesForm.confirmarGuardar(esCrear, 'incidencia "' + asunto + '"', function () {
                var fd = new FormData();
                Array.prototype.forEach.call(form.elements, function (el) {
                    if (!el.name || el.disabled || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        if (el.checked) fd.append(el.name, el.value);
                        return;
                    }
                    fd.append(el.name, el.value);
                });
                adjuntarFotosFormData(fd);
                fotosEliminar.forEach(function (fid) { fd.append('fotos_eliminar[]', fid); });
                var url = id ? urlBase + '/' + id + '/actualizar' : urlCrear;

                fetch(url, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': getCsrf(), Accept: 'application/json' },
                    body: fd,
                })
                    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
                    .then(function (res) {
                        if (!res.ok || !res.json.success) {
                            var msg = (res.json && res.json.message) ||
                                (res.json && res.json.errors && Object.values(res.json.errors)[0][0]) || 'Error al guardar';
                            throw new Error(msg);
                        }
                        mostrarToast(res.json.message, 'success');
                        forceCerrarModal(modal);
                        window.location.reload();
                    })
                    .catch(function (err) { mostrarToast(err.message, 'error'); });
            });
        }

        function eliminarSeleccionada() {
            if (!selectedId) return;
            OperacionesForm.confirmarEliminar('incidencia #' + selectedId, function () {
                fetch(urlBase + '/' + selectedId + '/baja', {
                    method: 'POST',
                    headers: jsonHeaders(),
                })
                    .then(function (r) { return r.json(); })
                    .then(function (json) {
                        if (!json.success) throw new Error(json.message);
                        mostrarToast(json.message, 'success');
                        window.location.reload();
                    })
                    .catch(function (err) { mostrarToast(err.message, 'error'); });
            });
        }

        function solicitarCerrarModal() {
            OperacionesForm.confirmarCancelar(hayCambios(), function () {
                forceCerrarModal(modal);
            });
        }

        function cargarSectores() {
            var lugarId = document.getElementById('incidenciaLugar').value;
            var sel = document.getElementById('incidenciaSector');
            if (!lugarId) {
                resetSectorSelect();
                return Promise.resolve();
            }
            return fetch('/api/sectores/ubicacion/' + lugarId, { headers: { Accept: 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (sectores) {
                    sel.innerHTML = '<option value="">— Seleccionar —</option>' +
                        (sectores || []).map(function (s) {
                            return '<option value="' + s.id + '">' + escapeHtml(s.nombre) + '</option>';
                        }).join('');
                });
        }

        function resetSectorSelect() {
            document.getElementById('incidenciaSector').innerHTML = '<option value="">— Seleccionar lugar primero —</option>';
        }

        function abrirModal(el) {
            el.setAttribute('aria-hidden', 'false');
            if (window.__refocusModal) {
                window.__refocusModal(el);
            }
        }
        function forceCerrarModal(el) {
            el.setAttribute('aria-hidden', 'true');
            if (el === modal) limpiarPreviews();
        }
        function getCsrf() {
            var m = document.querySelector('meta[name="csrf-token"]');
            return m ? m.content : '';
        }
        function jsonHeaders(extra) {
            return Object.assign({ Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() }, extra || {});
        }
        function toYmd(d) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
        function formatFecha(ymd) {
            var p = ymd.split('-');
            return p[2] + '/' + p[1] + '/' + p[0];
        }
        function escapeHtml(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
    });
})();

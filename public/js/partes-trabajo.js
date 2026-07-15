(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var pagina = document.getElementById('paginaPartes');
        if (!pagina) return;

        var urlBase = pagina.dataset.urlBase;
        var urlCrear = pagina.dataset.urlCrear;
        var urlApiEquipos = pagina.dataset.apiEquipos;
        var selectedId = null;
        var fotosEliminar = [];
        var fechaDiaSeleccionado = null;
        var formSnapshot = null;
        var previewUrls = [];
        var materialesInicial = 0;

        var modal = document.getElementById('modalParte');
        var modalDia = document.getElementById('modalDiaPartes');
        var modalPickerEquipo = document.getElementById('modalPickerEquipo');
        var form = document.getElementById('formParte');
        var fotosInput = document.getElementById('parteFotos');
        var tbody = document.querySelector('#tablaPartes tbody');

        var fotosCola = OperacionesForm.createColaFotos({
            max: 5,
            contarExistentes: function () {
                return document.querySelectorAll('#parteFotosExistentes .op-foto-item').length;
            },
            avisar: function (msg) { mostrarToast(msg, 'warning'); },
        });

        if (typeof CrudCommon !== 'undefined') {
            CrudCommon.initSearchInput({ selector: '#searchInput' });
            CrudCommon.initSortableHeaders('#tablaPartes .sortable');
        }

        OperacionesForm.bindDirtyTracking(form, getFormState, function () {});

        document.querySelectorAll('.op-vista-toggle button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var url = new URL(window.location.href);
                url.searchParams.set('vista', btn.dataset.vista);
                window.location.href = url.toString();
            });
        });

        document.getElementById('filtroTipo')?.addEventListener('change', function () {
            var url = new URL(window.location.href);
            var v = document.getElementById('filtroTipo').value;
            if (v) url.searchParams.set('tipo', v); else url.searchParams.delete('tipo');
            window.location.href = url.toString();
        });

        if (pagina.dataset.vista === 'calendario') {
            OperacionesCalendar({
                apiUrl: pagina.dataset.apiCalendario,
                gridEl: document.getElementById('calGrid'),
                dowEl: document.getElementById('calDow'),
                titleEl: document.getElementById('calTitulo'),
                prevBtn: document.getElementById('calPrev'),
                nextBtn: document.getElementById('calNext'),
                getEventClass: function (item) { return 'op-estado-' + (item.tipo || 'general'); },
                getEventLabel: function (item) { return item.descripcion_resumen || ('Parte #' + item.id); },
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

        function contarMateriales() {
            return document.querySelectorAll('#parteMaterialesLista .op-material-row').length;
        }

        function getFormState() {
            return {
                snapshot: formSnapshot,
                extras: {
                    fotosEliminar: fotosEliminar,
                    nuevasFotos: fotosCola.getFiles(),
                    extraDirty: contarMateriales() !== materialesInicial,
                },
            };
        }

        function hayCambios() {
            return OperacionesForm.isDirty(form, formSnapshot, getFormState().extras);
        }

        function capturarSnapshot() {
            formSnapshot = OperacionesForm.captureSnapshot(form);
            materialesInicial = contarMateriales();
        }

        function abrirModalDia(ymd, items) {
            document.getElementById('modalDiaPartesTitulo').textContent = 'Partes — ' + formatFecha(ymd);
            var lista = document.getElementById('listaDiaPartes');
            lista.innerHTML = items.map(function (item) {
                return '<div class="op-dia-item" data-id="' + item.id + '">' +
                    '<span><span class="op-badge op-estado-' + item.tipo + '">' + item.tipo_label + '</span> ' +
                    escapeHtml(item.descripcion_resumen) + '</span>' +
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

        document.getElementById('btnAnadir')?.addEventListener('click', function () { abrirModalCrear(null); });
        document.getElementById('btnEditar')?.addEventListener('click', function () {
            if (selectedId) cargarYEditar(selectedId);
        });
        document.getElementById('btnEliminar')?.addEventListener('click', eliminarSeleccionado);
        document.getElementById('cerrarModalParte')?.addEventListener('click', solicitarCerrarModal);
        document.getElementById('cancelarModalParte')?.addEventListener('click', solicitarCerrarModal);
        document.getElementById('parteLugar')?.addEventListener('change', cargarSectores);
        document.getElementById('parteTipo')?.addEventListener('change', toggleEquipo);
        document.getElementById('parteIncidencia')?.addEventListener('change', togglePanelIncidencia);
        document.getElementById('btnAbrirPickerEquipo')?.addEventListener('click', abrirPickerEquipo);
        document.getElementById('btnLimpiarEquipo')?.addEventListener('click', limpiarEquipoSeleccionado);
        document.getElementById('cerrarPickerEquipo')?.addEventListener('click', cerrarPickerEquipo);
        document.getElementById('cancelarPickerEquipo')?.addEventListener('click', cerrarPickerEquipo);
        initPickerEquipoFiltros();
        document.getElementById('btnAnadirMaterial')?.addEventListener('click', anadirFilaMaterial);
        fotosInput?.addEventListener('change', function () {
            fotosCola.agregarDesdeInput(fotosInput);
            renderPreviewNuevasFotos();
        });
        document.querySelector('label[for="parteFotos"]')?.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fotosInput?.click();
            }
        });
        form?.addEventListener('submit', guardarParte);

        document.getElementById('btnNuevoParteDia')?.addEventListener('click', function () {
            forceCerrarModal(modalDia);
            abrirModalCrear(fechaDiaSeleccionado);
        });
        document.getElementById('cerrarModalDiaPartes')?.addEventListener('click', function () { forceCerrarModal(modalDia); });
        document.getElementById('cerrarModalDiaPartes2')?.addEventListener('click', function () { forceCerrarModal(modalDia); });

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
            document.getElementById('selectedInfo').textContent = 'Parte #' + selectedId + ' seleccionado';
            document.getElementById('btnEditar').disabled = false;
            document.getElementById('btnEliminar').disabled = false;
        }

        function abrirModalCrear(fecha) {
            limpiarPreviews();
            fotosEliminar = [];
            document.getElementById('modalParteTitulo').textContent = 'Nuevo parte de trabajo';
            form.reset();
            document.getElementById('parteId').value = '';
            document.getElementById('parteFotosExistentes').innerHTML = '';
            document.getElementById('parteMaterialesLista').innerHTML = '';
            document.getElementById('parteFecha').value = fecha || toYmd(new Date());
            document.getElementById('parteTipo').value = '';
            limpiarEquipoSeleccionado();
            toggleEquipo();
            togglePanelIncidencia();
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
                .catch(function (err) { mostrarToast(err.message, 'error'); });
        }

        function rellenarFormulario(data) {
            limpiarPreviews();
            fotosEliminar = [];
            document.getElementById('modalParteTitulo').textContent = 'Editar parte #' + data.id;
            document.getElementById('parteId').value = data.id;
            document.getElementById('parteFecha').value = data.fecha || '';
            document.getElementById('parteTipo').value = data.tipo || '';
            setEquipoSeleccionado(data.codigoEquipo || '', data.equipo_label || data.equipo || '');
            document.getElementById('parteLugar').value = data.codigoLugar || '';
            cargarSectores().then(function () {
                document.getElementById('parteSector').value = data.codigoSector || '';
                capturarSnapshot();
                if (window.__refocusModal) window.__refocusModal(modal);
            });
            document.getElementById('parteIncidencia').value = data.codigo_incidencia || '';
            document.getElementById('parteDescripcion').value = data.descripcionTrabajo || '';
            document.getElementById('parteObservacion').value = data.observacion || '';
            toggleEquipo();
            togglePanelIncidencia();
            renderFotosExistentes(data.fotos || []);
            renderMateriales(data.materiales || []);
            if (!data.codigoLugar) capturarSnapshot();
        }

        function renderMateriales(materiales) {
            var lista = document.getElementById('parteMaterialesLista');
            lista.innerHTML = '';
            (materiales || []).forEach(function (m) {
                anadirFilaMaterial(m.material_id, m.cantidad);
            });
        }

        function anadirFilaMaterial(materialId, cantidad) {
            var tpl = document.getElementById('tplMaterialRow');
            if (!tpl) return;
            var node = tpl.content.cloneNode(true);
            var row = node.querySelector('.op-material-row');
            if (materialId) row.querySelector('.material-select').value = materialId;
            if (cantidad) row.querySelector('.material-cantidad').value = cantidad;
            row.querySelector('.btn-quitar-material').addEventListener('click', function () {
                row.remove();
            });
            document.getElementById('parteMaterialesLista').appendChild(row);
        }

        function renderFotosExistentes(fotos) {
            var cont = document.getElementById('parteFotosExistentes');
            cont.innerHTML = (fotos || []).map(function (f) {
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
            var cont = document.getElementById('parteFotosPreview');
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
            var prev = document.getElementById('parteFotosPreview');
            if (prev) prev.innerHTML = '';
            fotosCola.limpiar(fotosInput);
        }

        function adjuntarFotosFormData(fd) {
            fotosCola.appendToFormData(fd);
        }

        function construirFormDataParte() {
            var fd = new FormData();
            Array.prototype.forEach.call(form.elements, function (el) {
                if (!el.name || el.disabled || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
                if (el.closest && el.closest('.op-material-row')) return;
                if (el.type === 'checkbox' || el.type === 'radio') {
                    if (el.checked) fd.append(el.name, el.value);
                    return;
                }
                fd.append(el.name, el.value);
            });
            var idx = 0;
            document.querySelectorAll('#parteMaterialesLista .op-material-row').forEach(function (row) {
                var mid = row.querySelector('.material-select').value;
                var cant = row.querySelector('.material-cantidad').value;
                if (mid && cant) {
                    fd.append('materiales[' + idx + '][material_id]', mid);
                    fd.append('materiales[' + idx + '][cantidad]', cant);
                    idx++;
                }
            });
            adjuntarFotosFormData(fd);
            fotosEliminar.forEach(function (fid) { fd.append('fotos_eliminar[]', fid); });
            return fd;
        }

        function guardarParte(e) {
            e.preventDefault();
            var id = document.getElementById('parteId').value;
            var esCrear = !id;
            var tipo = document.getElementById('parteTipo').value;
            if (tipo === 'mantenimiento' && !document.getElementById('parteEquipo').value) {
                mostrarToast('Debe seleccionar un equipo para partes de mantenimiento.', 'error');
                return;
            }

            OperacionesForm.confirmarGuardar(esCrear, 'parte de trabajo #' + (id || 'nuevo'), function () {
                var fd = construirFormDataParte();
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

        function eliminarSeleccionado() {
            if (!selectedId) return;
            OperacionesForm.confirmarEliminar('parte de trabajo #' + selectedId, function () {
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

        function toggleEquipo() {
            var tipo = document.getElementById('parteTipo').value;
            var btnBuscar = document.getElementById('btnAbrirPickerEquipo');
            if (btnBuscar) btnBuscar.required = false;
            document.getElementById('grupoEquipo')?.classList.toggle('op-equipo-requerido', tipo === 'mantenimiento');
        }

        function setEquipoSeleccionado(id, label) {
            var hidden = document.getElementById('parteEquipo');
            var display = document.getElementById('parteEquipoDisplay');
            var btnClear = document.getElementById('btnLimpiarEquipo');
            if (!hidden || !display) return;
            hidden.value = id ? String(id) : '';
            display.value = label || (id ? ('#' + id) : '');
            if (btnClear) btnClear.hidden = !hidden.value;
        }

        function limpiarEquipoSeleccionado() {
            setEquipoSeleccionado('', '');
        }

        var pickerEquipoTimer = null;

        function initPickerEquipoFiltros() {
            var buscar = document.getElementById('pickerEquipoBuscar');
            var tipo = document.getElementById('pickerEquipoTipo');
            var idFiltro = document.getElementById('pickerEquipoId');
            [buscar, tipo, idFiltro].forEach(function (el) {
                if (!el) return;
                el.addEventListener('input', programarBusquedaEquipos);
                el.addEventListener('change', programarBusquedaEquipos);
            });
        }

        function programarBusquedaEquipos() {
            clearTimeout(pickerEquipoTimer);
            pickerEquipoTimer = setTimeout(cargarEquiposPicker, 280);
        }

        function abrirPickerEquipo() {
            if (!modalPickerEquipo) return;
            document.getElementById('pickerEquipoBuscar').value = '';
            document.getElementById('pickerEquipoTipo').value = '';
            document.getElementById('pickerEquipoId').value = '';
            modalPickerEquipo.setAttribute('aria-hidden', 'false');
            cargarEquiposPicker();
            if (window.__refocusModal) window.__refocusModal(modalPickerEquipo);
        }

        function cerrarPickerEquipo() {
            if (!modalPickerEquipo) return;
            modalPickerEquipo.setAttribute('aria-hidden', 'true');
            if (window.__refocusModal) window.__refocusModal(modal);
        }

        function cargarEquiposPicker() {
            var tbodyPicker = document.getElementById('pickerEquiposBody');
            var info = document.getElementById('pickerEquipoInfo');
            if (!tbodyPicker || !urlApiEquipos) return;

            var params = new URLSearchParams();
            var q = (document.getElementById('pickerEquipoBuscar')?.value || '').trim();
            var tipo = document.getElementById('pickerEquipoTipo')?.value || '';
            var idEq = document.getElementById('pickerEquipoId')?.value || '';
            if (q) params.set('q', q);
            if (tipo) params.set('tipo', tipo);
            if (idEq) params.set('id', idEq);

            tbodyPicker.innerHTML = '<tr><td colspan="5" class="td-vacio">Buscando…</td></tr>';

            fetch(urlApiEquipos + (params.toString() ? '?' + params.toString() : ''), {
                headers: { Accept: 'application/json' },
            })
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    if (!json.success) throw new Error(json.message || 'Error al buscar equipos');
                    renderTablaPickerEquipos(json.data || []);
                    if (info) {
                        var n = (json.data || []).length;
                        info.textContent = n === 0
                            ? 'No se encontraron equipos con esos criterios.'
                            : (n >= 150 ? 'Mostrando los primeros 150 resultados. Refine la búsqueda.' : (n + ' equipo(s). Clic en una fila para seleccionar.'));
                    }
                })
                .catch(function (err) {
                    tbodyPicker.innerHTML = '<tr><td colspan="5" class="td-vacio">Error al cargar equipos</td></tr>';
                    if (info) info.textContent = err.message || 'Error al buscar';
                });
        }

        function renderTablaPickerEquipos(items) {
            var tbodyPicker = document.getElementById('pickerEquiposBody');
            if (!tbodyPicker) return;
            if (!items.length) {
                tbodyPicker.innerHTML = '<tr><td colspan="5" class="td-vacio">Sin resultados</td></tr>';
                return;
            }
            tbodyPicker.innerHTML = items.map(function (eq) {
                return '<tr class="op-picker-row" tabindex="0" data-id="' + eq.id + '" data-label="' + escapeAttr(eq.label || ('#' + eq.id)) + '">' +
                    '<td>' + eq.id + '</td>' +
                    '<td>' + escapeHtml(eq.serie || '—') + '</td>' +
                    '<td>' + escapeHtml(eq.tipo || '—') + '</td>' +
                    '<td>' + escapeHtml(eq.marca || '—') + '</td>' +
                    '<td>' + escapeHtml(eq.modelo || '—') + '</td>' +
                    '</tr>';
            }).join('');

            tbodyPicker.querySelectorAll('.op-picker-row').forEach(function (row) {
                row.addEventListener('click', function () {
                    seleccionarEquipoPicker(row.dataset.id, row.dataset.label);
                });
                row.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        seleccionarEquipoPicker(row.dataset.id, row.dataset.label);
                    }
                });
            });
        }

        function seleccionarEquipoPicker(id, label) {
            setEquipoSeleccionado(id, label);
            cerrarPickerEquipo();
            form?.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function togglePanelIncidencia() {
            var val = document.getElementById('parteIncidencia').value;
            var panel = document.getElementById('panelIncidenciaUpdate');
            if (val) panel.classList.remove('op-hidden');
            else panel.classList.add('op-hidden');
        }

        function cargarSectores() {
            var lugarId = document.getElementById('parteLugar').value;
            var sel = document.getElementById('parteSector');
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
            document.getElementById('parteSector').innerHTML = '<option value="">— Seleccionar lugar primero —</option>';
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

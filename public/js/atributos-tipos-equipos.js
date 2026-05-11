(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var page = document.querySelector('.pagina-atributos-tipos-equipos');
        if (!page) return;

        var dataNode = document.getElementById('atributosTiposEquiposData');
        var data = {
            csrfToken: dataNode ? dataNode.dataset.csrfToken : '',
            rutas: {
                obtenerConfiguracion: dataNode ? dataNode.dataset.rutaObtenerConfiguracion : '',
                guardarConfiguracion: dataNode ? dataNode.dataset.rutaGuardarConfiguracion : '',
                crearAtributo: dataNode ? dataNode.dataset.rutaCrearAtributo : '',
                eliminarAtributo: dataNode ? dataNode.dataset.rutaEliminarAtributo : '',
                crearUnidad: dataNode ? dataNode.dataset.rutaCrearUnidad : '',
                eliminarUnidad: dataNode ? dataNode.dataset.rutaEliminarUnidad : '',
            },
            tipoSeleccionado: dataNode ? Number(dataNode.dataset.tipoSeleccionado || 0) : 0,
            configuracionesIniciales: {},
            unidadesMedida: [],
        };

        if (dataNode && dataNode.dataset.configuracionesIniciales) {
            try { data.configuracionesIniciales = JSON.parse(dataNode.dataset.configuracionesIniciales); } catch (_error) {}
        }
        if (dataNode && dataNode.dataset.unidadesMedida) {
            try { data.unidadesMedida = JSON.parse(dataNode.dataset.unidadesMedida); } catch (_error) {}
        }

        var listaAtributos = document.getElementById('listaAtributos');
        var listaTipos = document.getElementById('listaTipos');
        var tipoInfo = document.getElementById('tipoSeleccionadoInfo');
        var estadoAutoguardado = document.getElementById('estadoAutoguardado');
        var editorEspecificaciones = document.getElementById('editorEspecificaciones');
        var atributoEspecificacionActual = document.getElementById('atributoEspecificacionActual');
        var inputBuscarTipos = document.getElementById('buscarTiposEquipos');
        var inputBuscarAtributos = document.getElementById('buscarAtributosEquipos');
        var modalAtributo = document.getElementById('modalCrearAtributo');
        var formCrearAtributo = document.getElementById('formCrearAtributo');
        var inputNuevoAtributo = document.getElementById('nuevoAtributoNombre');
        var modalUnidades = document.getElementById('modalUnidadesMedida');
        var formCrearUnidad = document.getElementById('formCrearUnidadMedida');
        var inputNuevaUnidad = document.getElementById('nuevaUnidadNombre');
        var tbodyUnidades = document.getElementById('tbodyUnidadesMedida');

        var tipoSeleccionado = Number(data.tipoSeleccionado || 0);
        var configuraciones = data.configuracionesIniciales || {};
        var unidadesMedida = Array.isArray(data.unidadesMedida) ? data.unidadesMedida : [];
        var autoGuardadoTimer = null;
        var guardadoEnCurso = false;
        var reintentarGuardado = false;
        var atributoActivoId = 0;
        var LIMITES = {
            nombreAtributo: 30,
            nombreUnidad: 30,
            valorOpcion: 30,
        };

        function jsonHeaders(extra) {
            return Object.assign({
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': data.csrfToken || '',
            }, extra || {});
        }

        function setEstadoAutoguardado(texto, tipo) {
            if (!estadoAutoguardado) return;
            estadoAutoguardado.textContent = texto;
            estadoAutoguardado.classList.remove('estado-ok', 'estado-guardando', 'estado-error');
            if (tipo) estadoAutoguardado.classList.add(tipo);
        }

        function confirmarAccion(titulo, mensaje) {
            if (typeof window.abrirModalConfirmacion === 'function') {
                return new Promise(function (resolve) {
                    window.abrirModalConfirmacion(
                        titulo || 'Confirmar acción',
                        mensaje || '¿Desea continuar?',
                        function () { resolve(true); },
                        false,
                        true
                    );
                    var overlay = document.getElementById('modal-confirmacion-overlay');
                    if (!overlay) return;
                    var observer = new MutationObserver(function () {
                        var activo = overlay.classList.contains('activo');
                        if (!activo) {
                            observer.disconnect();
                            resolve(false);
                        }
                    });
                    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
                });
            }
            return Promise.resolve(window.confirm(mensaje || '¿Desea continuar?'));
        }

        function replaceRouteToken(template, id) {
            return String(template || '').replace('__ID__', String(id));
        }

        function obtenerFilasAtributos() {
            return Array.prototype.slice.call(document.querySelectorAll('#tablaAtributos tbody tr.atributo-item[data-atributo-id]'));
        }

        function obtenerFilasTiposVisibles() {
            return Array.prototype.slice.call(document.querySelectorAll('#tablaTiposEquipos tbody tr.tipo-item[data-tipo-id]'))
                .filter(function (row) { return row.style.display !== 'none'; });
        }

        function obtenerFilasAtributosVisibles() {
            return obtenerFilasAtributos().filter(function (row) { return row.style.display !== 'none'; });
        }

        function obtenerAtributosMarcados() {
            return obtenerFilasAtributos()
                .filter(function (fila) { return !!fila.querySelector('.atributo-check:checked'); })
                .map(function (fila) {
                    var nombreCell = fila.querySelector('.atributo-nombre');
                    return {
                        idAtributo: Number(fila.dataset.atributoId || 0),
                        nombre: nombreCell ? nombreCell.textContent.trim() : '',
                    };
                });
        }

        function tipoNombreActual() {
            var activo = document.querySelector('#tablaTiposEquipos .tipo-item.seleccionado');
            return activo ? (activo.dataset.tipoNombre || '') : '';
        }

        function actualizarInfoTipo() {
            var nombre = tipoNombreActual();
            tipoInfo.textContent = nombre ? ('Tipo seleccionado: ' + nombre) : 'Ningún tipo seleccionado';
        }

        function crearSelectUnidad(valorActual) {
            var select = document.createElement('select');
            select.className = 'esp-unidad';
            var optionVacia = document.createElement('option');
            optionVacia.value = '';
            optionVacia.textContent = '— Sin unidad —';
            select.appendChild(optionVacia);

            unidadesMedida.forEach(function (unidad) {
                var option = document.createElement('option');
                option.value = unidad.nombre;
                option.textContent = unidad.nombre;
                if (String(valorActual || '') === String(unidad.nombre)) option.selected = true;
                select.appendChild(option);
            });

            select.addEventListener('change', function () {
                var editor = select.closest('[data-atributo-id]');
                if (editor) actualizarConfiguracionDesdeEditor(editor);
                programarAutoGuardado(120);
            });
            return select;
        }

        function normalizarOpciones(valor) {
            if (!valor) return [];
            if (Array.isArray(valor)) {
                return valor.map(function (item) { return String(item || '').trim(); }).filter(Boolean);
            }
            var texto = String(valor).trim();
            if (!texto) return [];
            try {
                var json = JSON.parse(texto);
                if (Array.isArray(json)) return normalizarOpciones(json);
            } catch (_error) {}
            if (texto.indexOf('\n') >= 0) {
                return texto.split('\n').map(function (item) { return item.trim(); }).filter(Boolean);
            }
            return texto.split(',').map(function (item) { return item.trim(); }).filter(Boolean);
        }

        function setAtributoActivo(idAtributo) {
            atributoActivoId = Number(idAtributo || 0);
            obtenerFilasAtributos().forEach(function (fila) {
                var esActivo = Number(fila.dataset.atributoId || 0) === atributoActivoId;
                fila.classList.toggle('activo-especificacion', esActivo);
            });
        }

        function obtenerAtributoActivoMarcado() {
            var marcados = obtenerAtributosMarcados();
            if (!marcados.length) return null;
            var activo = marcados.find(function (a) { return Number(a.idAtributo) === Number(atributoActivoId); });
            return activo || marcados[0];
        }

        function crearItemOpcion(valorTexto, onChange) {
            var li = document.createElement('li');
            li.className = 'lista-opciones-item';
            li.dataset.valor = valorTexto;

            var span = document.createElement('span');
            span.textContent = valorTexto;
            li.appendChild(span);

            var btnEliminar = document.createElement('button');
            btnEliminar.type = 'button';
            btnEliminar.className = 'btn-opcion-quitar';
            btnEliminar.textContent = 'x';
            btnEliminar.title = 'Eliminar opción';
            btnEliminar.addEventListener('click', function () {
                li.remove();
                onChange();
            });
            li.appendChild(btnEliminar);

            return li;
        }

        function crearEditorOpciones(valorActual) {
            var wrapper = document.createElement('div');
            wrapper.className = 'lista-opciones';

            function onOpcionesChange() {
                var editor = wrapper.closest('[data-atributo-id]');
                if (editor) actualizarConfiguracionDesdeEditor(editor);
                programarAutoGuardado(120);
            }

            var ul = document.createElement('ul');
            ul.className = 'lista-opciones-items';
            normalizarOpciones(valorActual).forEach(function (opcion) {
                ul.appendChild(crearItemOpcion(opcion, onOpcionesChange));
            });

            var agregar = document.createElement('div');
            agregar.className = 'lista-opciones-agregar';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'esp-opcion-input';
            input.placeholder = 'Nueva opción';
            input.maxLength = LIMITES.valorOpcion;

            var btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.className = 'btn btn-secundario btn-opcion-add';
            btnAdd.title = 'Agregar opción';
            btnAdd.textContent = '+';

            function agregarOpcion() {
                var valor = String(input.value || '').slice(0, LIMITES.valorOpcion).trim();
                if (!valor) return;
                var valorNormalizado = valor.toLocaleLowerCase();
                var existente = Array.prototype.some.call(
                    ul.querySelectorAll('.lista-opciones-item'),
                    function (item) {
                        return String(item.dataset.valor || '').trim().toLocaleLowerCase() === valorNormalizado;
                    }
                );
                if (existente) {
                    mostrarToast('Esa opción ya existe para este atributo', 'warning');
                    input.focus();
                    return;
                }
                ul.appendChild(crearItemOpcion(valor, onOpcionesChange));
                input.value = '';
                input.focus();
                onOpcionesChange();
            }

            btnAdd.addEventListener('click', agregarOpcion);
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    agregarOpcion();
                }
            });

            agregar.appendChild(input);
            agregar.appendChild(btnAdd);
            wrapper.appendChild(ul);
            wrapper.appendChild(agregar);
            return wrapper;
        }

        function obtenerOpcionesLista(container) {
            if (!container) return [];
            return Array.prototype.slice.call(container.querySelectorAll('.lista-opciones-item'))
                .map(function (item) { return (item.dataset.valor || '').trim(); })
                .filter(Boolean);
        }

        function actualizarConfiguracionDesdeEditor(editor) {
            if (!editor) return;
            var idAtributo = String(editor.dataset.atributoId || '');
            if (!idAtributo) return;
            var existente = configuraciones[idAtributo] || {};
            var unidad = (editor.querySelector('.esp-unidad') || {}).value || '';
            var opciones = obtenerOpcionesLista(editor);
            configuraciones[idAtributo] = {
                unidad_medida: unidad,
                tipo_especificacion: 'rango_valores',
                rango_min: '',
                rango_max: '',
                valores_permitidos: JSON.stringify(opciones),
            };
            if (existente && existente.unidad_medida === unidad && JSON.stringify(normalizarOpciones(existente.valores_permitidos || '')) === JSON.stringify(opciones)) {
                configuraciones[idAtributo] = Object.assign({}, existente, configuraciones[idAtributo]);
            }
        }

        function renderTablaEspecificaciones() {
            if (!editorEspecificaciones) return;
            var atributosMarcados = obtenerAtributosMarcados();
            editorEspecificaciones.innerHTML = '';

            if (!tipoSeleccionado) {
                if (atributoEspecificacionActual) atributoEspecificacionActual.textContent = 'Atributo activo: —';
                editorEspecificaciones.innerHTML = '<div class="td-vacio">Selecciona un tipo de equipo.</div>';
                return;
            }
            if (atributosMarcados.length === 0) {
                setAtributoActivo(0);
                if (atributoEspecificacionActual) atributoEspecificacionActual.textContent = 'Atributo activo: —';
                editorEspecificaciones.innerHTML = '<div class="td-vacio">Marca atributos para este tipo.</div>';
                return;
            }
            var attr = obtenerAtributoActivoMarcado();
            if (!attr) {
                if (atributoEspecificacionActual) atributoEspecificacionActual.textContent = 'Atributo activo: —';
                editorEspecificaciones.innerHTML = '<div class="td-vacio">Selecciona un atributo marcado para editar sus opciones.</div>';
                return;
            }
            setAtributoActivo(attr.idAtributo);
            if (atributoEspecificacionActual) {
                atributoEspecificacionActual.textContent = 'Atributo activo: ' + String(attr.nombre || ('#' + attr.idAtributo));
            }

            var conf = configuraciones[String(attr.idAtributo)] || {};
            var editor = document.createElement('div');
            editor.className = 'editor-especificaciones-card';
            editor.dataset.atributoId = String(attr.idAtributo);

            var fieldUnidad = document.createElement('div');
            fieldUnidad.className = 'editor-field';
            var labelUnidad = document.createElement('label');
            labelUnidad.textContent = 'Unidad de medida';
            fieldUnidad.appendChild(labelUnidad);
            fieldUnidad.appendChild(crearSelectUnidad(conf.unidad_medida || ''));

            var fieldTipo = document.createElement('div');
            fieldTipo.className = 'editor-field';
            var labelTipo = document.createElement('label');
            labelTipo.textContent = 'Tipo de especificación';
            var tipoValor = document.createElement('input');
            tipoValor.type = 'text';
            tipoValor.className = 'esp-tipo-fijo';
            tipoValor.value = 'Rango de Valores';
            tipoValor.readOnly = true;
            fieldTipo.appendChild(labelTipo);
            fieldTipo.appendChild(tipoValor);

            var fieldOpciones = document.createElement('div');
            fieldOpciones.className = 'editor-field editor-field-opciones';
            var labelOpciones = document.createElement('label');
            labelOpciones.textContent = 'Opciones';
            fieldOpciones.appendChild(labelOpciones);
            fieldOpciones.appendChild(crearEditorOpciones(conf.valores_permitidos || ''));

            editor.appendChild(fieldUnidad);
            editor.appendChild(fieldTipo);
            editor.appendChild(fieldOpciones);
            editorEspecificaciones.appendChild(editor);
            actualizarConfiguracionDesdeEditor(editor);
        }

        function aplicarConfiguracionesEnChecks() {
            obtenerFilasAtributos().forEach(function (fila) {
                var id = String(fila.dataset.atributoId || '');
                var check = fila.querySelector('.atributo-check');
                var marcado = Object.prototype.hasOwnProperty.call(configuraciones, id);
                if (check) check.checked = marcado;
                fila.classList.toggle('seleccionado', marcado);
            });
        }

        function payloadGuardar() {
            return obtenerFilasAtributos().map(function (fila) {
                var idAtributo = Number(fila.dataset.atributoId || 0);
                var check = fila.querySelector('.atributo-check');
                var conf = configuraciones[String(idAtributo)] || {};
                return {
                    idAtributo: idAtributo,
                    asignado: !!(check && check.checked),
                    unidad_medida: conf.unidad_medida || '',
                    tipo_especificacion: 'rango_valores',
                    rango_min: '',
                    rango_max: '',
                    valores_permitidos: JSON.stringify(normalizarOpciones(conf.valores_permitidos || '')),
                };
            });
        }

        async function guardarConfiguracionActual(silencioso) {
            if (!tipoSeleccionado) return;
            if (guardadoEnCurso) {
                reintentarGuardado = true;
                return;
            }

            try {
                guardadoEnCurso = true;
                setEstadoAutoguardado('Guardando...', 'estado-guardando');
                var response = await fetch(replaceRouteToken(data.rutas.guardarConfiguracion, tipoSeleccionado), {
                    method: 'POST',
                    headers: jsonHeaders(),
                    body: JSON.stringify({ atributos: payloadGuardar() }),
                });
                var result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo guardar');
                configuraciones = result.configuraciones || {};
                renderTablaEspecificaciones();
                setEstadoAutoguardado('Guardado automático activo', 'estado-ok');
                if (!silencioso) mostrarToast(result.message || 'Guardado correctamente', 'success');
            } catch (error) {
                setEstadoAutoguardado('Error al guardar. Reintentando...', 'estado-error');
                mostrarToast(error.message || 'Error al guardar', 'error');
            } finally {
                guardadoEnCurso = false;
                if (reintentarGuardado) {
                    reintentarGuardado = false;
                    programarAutoGuardado(250);
                }
            }
        }

        function programarAutoGuardado(delayMs) {
            if (!tipoSeleccionado) return;
            clearTimeout(autoGuardadoTimer);
            setEstadoAutoguardado('Pendiente de guardar...', 'estado-guardando');
            autoGuardadoTimer = setTimeout(function () {
                guardarConfiguracionActual(true);
            }, typeof delayMs === 'number' ? delayMs : 350);
        }

        async function cargarConfiguracionTipo(idTipo) {
            if (!idTipo) return;
            try {
                var response = await fetch(replaceRouteToken(data.rutas.obtenerConfiguracion, idTipo), {
                    headers: jsonHeaders(),
                });
                var result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo cargar');
                tipoSeleccionado = idTipo;
                configuraciones = result.configuraciones || {};
                aplicarConfiguracionesEnChecks();
                renderTablaEspecificaciones();
                actualizarInfoTipo();
                setEstadoAutoguardado('Guardado automático activo', 'estado-ok');
            } catch (error) {
                mostrarToast(error.message || 'Error al cargar configuración', 'error');
            }
        }

        async function crearAtributo(nombre) {
            var response = await fetch(data.rutas.crearAtributo, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ nombre: nombre }),
            });
            var result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo crear el atributo');
            return result.atributo;
        }

        async function eliminarAtributo(idAtributo) {
            var response = await fetch(replaceRouteToken(data.rutas.eliminarAtributo, idAtributo), {
                method: 'DELETE',
                headers: jsonHeaders(),
            });
            var result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo eliminar el atributo');
        }

        async function crearUnidad(nombre) {
            var response = await fetch(data.rutas.crearUnidad, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ nombre: nombre }),
            });
            var result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo crear la unidad');
            return result.unidad;
        }

        async function eliminarUnidad(idUnidad) {
            var response = await fetch(replaceRouteToken(data.rutas.eliminarUnidad, idUnidad), {
                method: 'DELETE',
                headers: jsonHeaders(),
            });
            var result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo eliminar la unidad');
        }

        function agregarAtributoAFila(atributo) {
            var tabla = document.getElementById('tablaAtributos');
            var tbody = tabla ? tabla.querySelector('tbody') : null;
            if (!tbody) return;
            var filaVacia = tbody.querySelector('.fila-sin-atributos');
            if (filaVacia) filaVacia.remove();
            var fila = document.createElement('tr');
            fila.className = 'atributo-item';
            fila.dataset.atributoId = String(atributo.idAtributo);
            fila.innerHTML = ''
                + '<td><input type="checkbox" class="atributo-check" value="' + String(atributo.idAtributo) + '"></td>'
                + '<td>' + String(atributo.idAtributo) + '</td>'
                + '<td class="atributo-nombre">' + String(atributo.nombre) + '</td>'
                + '<td><button type="button" class="btn-opcion-quitar btn-eliminar-atributo" title="Eliminar atributo">x</button></td>';
            tbody.appendChild(fila);
        }

        function renderTablaUnidades() {
            if (!tbodyUnidades) return;
            tbodyUnidades.innerHTML = '';
            if (unidadesMedida.length === 0) {
                tbodyUnidades.innerHTML = '<tr class="sin-unidades"><td colspan="3" class="td-vacio">No hay unidades creadas.</td></tr>';
                return;
            }
            unidadesMedida.forEach(function (unidad) {
                var tr = document.createElement('tr');
                tr.dataset.unidadId = String(unidad.idUnidadMedida);
                tr.dataset.unidadNombre = unidad.nombre;
                tr.innerHTML = ''
                    + '<td>' + String(unidad.idUnidadMedida) + '</td>'
                    + '<td>' + String(unidad.nombre) + '</td>'
                    + '<td><button type="button" class="btn-opcion-quitar btn-eliminar-unidad" title="Eliminar unidad">x</button></td>';
                tbodyUnidades.appendChild(tr);
            });
        }

        function refrescarSelectsUnidades() {
            if (!editorEspecificaciones) return;
            var editor = editorEspecificaciones.querySelector('[data-atributo-id]');
            if (!editor) return;
            actualizarConfiguracionDesdeEditor(editor);
            renderTablaEspecificaciones();
        }

        function initTableSorting(tableSelector, columns) {
            var table = document.querySelector(tableSelector);
            if (!table) return;
            var headers = table.querySelectorAll('th.sortable');
            headers.forEach(function (header) {
                header.addEventListener('click', function () {
                    var column = header.dataset.column;
                    var nextOrder = header.dataset.order === 'asc' ? 'desc' : 'asc';
                    headers.forEach(function (h) {
                        h.dataset.order = 'asc';
                        var icon = h.querySelector('.sort-icon');
                        if (icon) icon.textContent = '↕';
                    });
                    header.dataset.order = nextOrder;
                    var iconSel = header.querySelector('.sort-icon');
                    if (iconSel) iconSel.textContent = nextOrder === 'asc' ? '▲' : '▼';

                    var tbody = table.querySelector('tbody');
                    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
                    var getValue = columns[column];
                    if (typeof getValue !== 'function') return;
                    rows.sort(function (a, b) {
                        var av = getValue(a);
                        var bv = getValue(b);
                        if (typeof av === 'number' && typeof bv === 'number') return nextOrder === 'asc' ? av - bv : bv - av;
                        var cmp = String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' });
                        return nextOrder === 'asc' ? cmp : -cmp;
                    });
                    rows.forEach(function (row) { tbody.appendChild(row); });
                });
            });
        }

        function filtrarTablaTipos(texto) {
            var term = String(texto || '').trim().toLocaleLowerCase();
            var filas = Array.prototype.slice.call(document.querySelectorAll('#tablaTiposEquipos tbody tr.tipo-item[data-tipo-id]'));
            filas.forEach(function (row) {
                var nombre = String(row.dataset.tipoNombre || '').toLocaleLowerCase();
                var id = String(row.dataset.tipoId || '').toLocaleLowerCase();
                var visible = !term || nombre.indexOf(term) >= 0 || id.indexOf(term) >= 0;
                row.style.display = visible ? '' : 'none';
            });
        }

        function filtrarTablaAtributos(texto) {
            var term = String(texto || '').trim().toLocaleLowerCase();
            var filas = obtenerFilasAtributos();
            filas.forEach(function (row) {
                var nombre = String((row.querySelector('.atributo-nombre') || {}).textContent || '').toLocaleLowerCase();
                var id = String(row.dataset.atributoId || '').toLocaleLowerCase();
                var visible = !term || nombre.indexOf(term) >= 0 || id.indexOf(term) >= 0;
                row.style.display = visible ? '' : 'none';
            });
        }

        function bindArrowNavigation(container, rowGetter, onActivate) {
            if (!container || container.dataset.arrowsBound === '1') return;
            container.dataset.arrowsBound = '1';
            container.addEventListener('keydown', async function (event) {
                var key = event.key;
                if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter' && key !== ' ') return;
                var targetRow = event.target.closest('tr');
                if (!targetRow) return;
                var rows = rowGetter();
                if (!rows.length) return;
                var idx = rows.indexOf(targetRow);
                if (idx < 0) return;

                if (key === 'Enter' || key === ' ') {
                    event.preventDefault();
                    await onActivate(targetRow, event);
                    return;
                }

                event.preventDefault();
                var nextIdx = key === 'ArrowDown' ? Math.min(rows.length - 1, idx + 1) : Math.max(0, idx - 1);
                var nextRow = rows[nextIdx];
                if (nextRow) nextRow.focus();
            });
        }

        window.abrirModalCrearAtributo = function () {
            if (!modalAtributo) return;
            modalAtributo.setAttribute('aria-hidden', 'false');
            if (inputNuevoAtributo) inputNuevoAtributo.focus();
        };
        window.cerrarModalCrearAtributo = function () {
            if (!modalAtributo) return;
            modalAtributo.setAttribute('aria-hidden', 'true');
            if (formCrearAtributo) formCrearAtributo.reset();
        };
        window.abrirModalUnidadesMedida = function () {
            if (!modalUnidades) return;
            modalUnidades.setAttribute('aria-hidden', 'false');
            if (inputNuevaUnidad) inputNuevaUnidad.focus();
        };
        window.cerrarModalUnidadesMedida = function () {
            if (!modalUnidades) return;
            modalUnidades.setAttribute('aria-hidden', 'true');
            if (formCrearUnidad) formCrearUnidad.reset();
        };

        if (formCrearAtributo) {
            formCrearAtributo.addEventListener('submit', async function (event) {
                event.preventDefault();
                var nombre = String(inputNuevoAtributo.value || '').slice(0, LIMITES.nombreAtributo).trim();
                if (!nombre) return;
                try {
                    var atributo = await crearAtributo(nombre);
                    agregarAtributoAFila(atributo);
                    cerrarModalCrearAtributo();
                    mostrarToast('Atributo creado correctamente', 'success');
                } catch (error) {
                    mostrarToast(error.message || 'Error al crear atributo', 'error');
                }
            });
        }

        if (formCrearUnidad) {
            formCrearUnidad.addEventListener('submit', async function (event) {
                event.preventDefault();
                var nombre = String(inputNuevaUnidad.value || '').slice(0, LIMITES.nombreUnidad).trim();
                if (!nombre) return;
                try {
                    var unidad = await crearUnidad(nombre);
                    unidadesMedida.push(unidad);
                    unidadesMedida.sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }); });
                    renderTablaUnidades();
                    refrescarSelectsUnidades();
                    formCrearUnidad.reset();
                    programarAutoGuardado(120);
                    mostrarToast('Unidad creada correctamente', 'success');
                } catch (error) {
                    mostrarToast(error.message || 'Error al crear unidad', 'error');
                }
            });
        }

        if (modalAtributo) modalAtributo.addEventListener('click', function (event) { if (event.target === modalAtributo) cerrarModalCrearAtributo(); });
        if (modalUnidades) modalUnidades.addEventListener('click', function (event) { if (event.target === modalUnidades) cerrarModalUnidadesMedida(); });

        if (listaAtributos) {
            listaAtributos.addEventListener('change', function (event) {
                if (!event.target.classList.contains('atributo-check')) return;
                var fila = event.target.closest('tr.atributo-item');
                if (fila) {
                    fila.classList.toggle('seleccionado', !!event.target.checked);
                    if (event.target.checked) {
                        setAtributoActivo(Number(fila.dataset.atributoId || 0));
                    } else if (Number(fila.dataset.atributoId || 0) === Number(atributoActivoId)) {
                        setAtributoActivo(0);
                    }
                }
                renderTablaEspecificaciones();
                programarAutoGuardado(120);
            });

            listaAtributos.addEventListener('click', async function (event) {
                var btnEliminar = event.target.closest('.btn-eliminar-atributo');
                if (!btnEliminar) return;
                var fila = btnEliminar.closest('tr.atributo-item');
                if (!fila) return;
                var idEliminar = Number(fila.dataset.atributoId || 0);
                var nombre = (fila.querySelector('.atributo-nombre') || {}).textContent || '';
                var confirmadoAtributo = await confirmarAccion(
                    'Eliminar atributo ' + nombre,
                    'Estás por eliminar el atributo "' + nombre + '". ¿Desea continuar?'
                );
                if (!confirmadoAtributo) return;
                try {
                    await eliminarAtributo(Number(fila.dataset.atributoId || 0));
                    fila.remove();
                    delete configuraciones[String(idEliminar)];
                    if (Number(atributoActivoId) === idEliminar) {
                        setAtributoActivo(0);
                    }
                    if (obtenerFilasAtributos().length === 0) {
                        var tbodyAtributos = document.querySelector('#tablaAtributos tbody');
                        if (tbodyAtributos) {
                            tbodyAtributos.innerHTML = '<tr class="fila-sin-atributos"><td colspan="4" class="td-vacio">No hay atributos creados todavía.</td></tr>';
                        }
                    }
                    renderTablaEspecificaciones();
                    programarAutoGuardado(120);
                    mostrarToast('Atributo eliminado correctamente', 'success');
                } catch (error) {
                    mostrarToast(error.message || 'Error al eliminar atributo', 'error');
                }
            });
        }

        if (tbodyUnidades) {
            tbodyUnidades.addEventListener('click', async function (event) {
                var btn = event.target.closest('.btn-eliminar-unidad');
                if (!btn) return;
                var fila = btn.closest('tr[data-unidad-id]');
                if (!fila) return;
                var nombre = fila.dataset.unidadNombre || '';
                var confirmadoUnidad = await confirmarAccion(
                    'Eliminar unidad de medida',
                    '¿Eliminar la unidad "' + nombre + '"?'
                );
                if (!confirmadoUnidad) return;
                try {
                    await eliminarUnidad(Number(fila.dataset.unidadId || 0));
                    unidadesMedida = unidadesMedida.filter(function (u) { return Number(u.idUnidadMedida) !== Number(fila.dataset.unidadId || 0); });
                    renderTablaUnidades();
                    refrescarSelectsUnidades();
                    programarAutoGuardado(120);
                    mostrarToast('Unidad eliminada correctamente', 'success');
                } catch (error) {
                    mostrarToast(error.message || 'Error al eliminar unidad', 'error');
                }
            });
        }

        if (listaTipos) {
            async function seleccionarFilaTipo(filaTipo) {
                var idTipo = Number(filaTipo.dataset.tipoId || 0);
                if (!idTipo || idTipo === tipoSeleccionado) return;
                if (autoGuardadoTimer) {
                    clearTimeout(autoGuardadoTimer);
                    autoGuardadoTimer = null;
                    await guardarConfiguracionActual(true);
                }
                document.querySelectorAll('#tablaTiposEquipos .tipo-item').forEach(function (row) { row.classList.remove('seleccionado'); });
                filaTipo.classList.add('seleccionado');
                await cargarConfiguracionTipo(idTipo);
            }

            listaTipos.addEventListener('click', async function (event) {
                var filaTipo = event.target.closest('.tipo-item');
                if (!filaTipo) return;
                await seleccionarFilaTipo(filaTipo);
            });

            listaTipos.addEventListener('keydown', async function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                var filaTipo = event.target.closest('.tipo-item');
                if (!filaTipo) return;
                event.preventDefault();
                await seleccionarFilaTipo(filaTipo);
            });

            bindArrowNavigation(listaTipos, obtenerFilasTiposVisibles, async function (row) {
                await seleccionarFilaTipo(row);
            });
        }

        if (listaAtributos) {
            bindArrowNavigation(listaAtributos, obtenerFilasAtributosVisibles, async function (row, event) {
                var check = row.querySelector('.atributo-check');
                if (!check) return;
                if (event && (event.key === 'Enter' || event.key === ' ')) {
                    if (!check.checked) {
                        mostrarToast('Primero selecciona la casilla del atributo', 'warning');
                        return;
                    }
                    setAtributoActivo(Number(row.dataset.atributoId || 0));
                    renderTablaEspecificaciones();
                }
            });

            listaAtributos.addEventListener('click', function (event) {
                var fila = event.target.closest('tr.atributo-item');
                if (!fila) return;
                if (event.target.closest('.btn-eliminar-atributo')) return;
                if (event.target.classList.contains('atributo-check')) return;
                var check = fila.querySelector('.atributo-check');
                if (!check) return;
                if (!check.checked) return;
                setAtributoActivo(Number(fila.dataset.atributoId || 0));
                renderTablaEspecificaciones();
            });
        }

        if (inputNuevoAtributo && inputNuevoAtributo.dataset.maxBound !== '1') {
            inputNuevoAtributo.dataset.maxBound = '1';
            inputNuevoAtributo.maxLength = LIMITES.nombreAtributo;
            inputNuevoAtributo.addEventListener('input', function () {
                if (inputNuevoAtributo.value.length > LIMITES.nombreAtributo) {
                    inputNuevoAtributo.value = inputNuevoAtributo.value.slice(0, LIMITES.nombreAtributo);
                }
            });
        }

        if (inputNuevaUnidad && inputNuevaUnidad.dataset.maxBound !== '1') {
            inputNuevaUnidad.dataset.maxBound = '1';
            inputNuevaUnidad.maxLength = LIMITES.nombreUnidad;
            inputNuevaUnidad.addEventListener('input', function () {
                if (inputNuevaUnidad.value.length > LIMITES.nombreUnidad) {
                    inputNuevaUnidad.value = inputNuevaUnidad.value.slice(0, LIMITES.nombreUnidad);
                }
            });
        }

        if (inputBuscarTipos && inputBuscarTipos.dataset.bound !== '1') {
            inputBuscarTipos.dataset.bound = '1';
            inputBuscarTipos.addEventListener('input', function () {
                filtrarTablaTipos(inputBuscarTipos.value || '');
            });
        }

        if (inputBuscarAtributos && inputBuscarAtributos.dataset.bound !== '1') {
            inputBuscarAtributos.dataset.bound = '1';
            inputBuscarAtributos.addEventListener('input', function () {
                filtrarTablaAtributos(inputBuscarAtributos.value || '');
            });
        }

        actualizarInfoTipo();
        renderTablaUnidades();
        aplicarConfiguracionesEnChecks();
        renderTablaEspecificaciones();
        setEstadoAutoguardado('Guardado automático activo', 'estado-ok');

        initTableSorting('#tablaTiposEquipos', {
            id: function (row) { return Number(row.dataset.tipoId || 0); },
            nombre: function (row) { return row.dataset.tipoNombre || ''; },
        });
        initTableSorting('#tablaAtributos', {
            id: function (row) { return Number(row.dataset.atributoId || 0); },
            nombre: function (row) { return (row.querySelector('.atributo-nombre') || {}).textContent || ''; },
        });
    });
})();

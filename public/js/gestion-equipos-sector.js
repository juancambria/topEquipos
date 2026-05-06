(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var tablaUbicaciones = document.getElementById('tablaGesUbicaciones');
        var tablaSectores = document.getElementById('tablaGesSectores');
        var tablaDisponibles = document.getElementById('tablaGesTiposDisponibles');
        var tablaAsignados = document.getElementById('tablaGesTiposAsignados');
        var infoSeleccion = document.getElementById('infoSeleccionGES');
        var btnAsignar = document.getElementById('btnGesAsignar');
        var btnQuitar = document.getElementById('btnGesQuitar');
        var vistaSectores = document.getElementById('gesVistaSectores');
        var vistaAsignados = document.getElementById('gesVistaAsignados');
        var btnVolverSectores = document.getElementById('btnGesVolverSectores');
        var tituloAsignados = document.getElementById('gesTituloAsignados');

        if (!tablaUbicaciones || !tablaSectores || !tablaDisponibles || !tablaAsignados || !vistaSectores || !vistaAsignados) {
            return;
        }

        var state = {
            ubicacionId: null,
            ubicacionNombre: '',
            sectorId: null,
            sectorNombre: '',
            tipoDisponibleId: null,
            tipoAsignadoId: null,
        };
        var sortState = {
            tablaGesUbicaciones: { key: null, order: 'asc' },
            tablaGesSectores: { key: null, order: 'asc' },
        };

        function csrfToken() {
            var tokenMeta = document.querySelector('meta[name="csrf-token"]');
            return tokenMeta ? tokenMeta.getAttribute('content') : '';
        }

        function notify(message, type) {
            if (typeof mostrarToast === 'function') {
                mostrarToast(message, type || 'success');
                return;
            }
            if (type === 'error') {
                console.error(message);
            } else {
                console.log(message);
            }
        }

        function updateInfo() {
            if (!state.ubicacionId) {
                infoSeleccion.textContent = 'Seleccione una ubicación y un sector.';
                return;
            }

            if (!state.sectorId) {
                infoSeleccion.textContent = 'Ubicación: ' + state.ubicacionNombre + '. Seleccione un sector.';
                return;
            }

            infoSeleccion.textContent = 'Ubicación: ' + state.ubicacionNombre + ' | Sector: ' + state.sectorNombre;
        }

        function updateButtons() {
            var habilitar = state.ubicacionId && state.sectorId;
            btnAsignar.disabled = !(habilitar && state.tipoDisponibleId);
            btnQuitar.disabled = !(habilitar && state.tipoAsignadoId);
        }

        function clearSelection(tbody) {
            tbody.querySelectorAll('tr.seleccionado').forEach(function (tr) {
                tr.classList.remove('seleccionado');
            });
        }

        function setPlaceholder(tbody, message, colspan) {
            tbody.innerHTML = '';
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            td.className = 'td-vacio';
            td.colSpan = colspan;
            td.textContent = message;
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        function mostrarVistaSectores() {
            vistaSectores.classList.remove('ges-oculto');
            vistaAsignados.classList.add('ges-oculto');
        }

        function mostrarVistaAsignados() {
            vistaSectores.classList.add('ges-oculto');
            vistaAsignados.classList.remove('ges-oculto');
        }

        function bindRowSelection(tbody, onSelect) {
            tbody.addEventListener('click', function (event) {
                var row = event.target.closest('tr[data-id]');
                if (!row) {
                    return;
                }

                clearSelection(tbody);
                row.classList.add('seleccionado');
                onSelect(row);
            });
        }

        function sortTbodyByIdAsc(tbody) {
            if (!tbody) {
                return;
            }
            var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
            if (rows.length <= 1) {
                return;
            }
            rows.sort(function (a, b) {
                return Number(a.dataset.id || 0) - Number(b.dataset.id || 0);
            });
            rows.forEach(function (row) {
                tbody.appendChild(row);
            });
        }

        function normalizeValue(value, type) {
            if (type === 'number') {
                var numeric = Number(value);
                return Number.isNaN(numeric) ? 0 : numeric;
            }
            return String(value || '').toLowerCase();
        }

        function updateSortIcons(table, activeKey, order) {
            table.querySelectorAll('th.ges-sortable').forEach(function (th) {
                var icon = th.querySelector('.ges-sort-icon');
                if (!icon) {
                    return;
                }
                if (th.dataset.sortKey === activeKey) {
                    icon.textContent = order === 'asc' ? '▲' : '▼';
                } else {
                    icon.textContent = '↕';
                }
            });
        }

        function sortTableRows(table, key, type, order) {
            var tbody = table.querySelector('tbody');
            if (!tbody) {
                return;
            }

            var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
            if (rows.length <= 1) {
                updateSortIcons(table, key, order);
                return;
            }

            rows.sort(function (a, b) {
                var aValue = normalizeValue(a.dataset[key], type);
                var bValue = normalizeValue(b.dataset[key], type);

                if (aValue < bValue) {
                    return order === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return order === 'asc' ? 1 : -1;
                }
                return 0;
            });

            rows.forEach(function (row) {
                tbody.appendChild(row);
            });

            updateSortIcons(table, key, order);
        }

        function initTableSorting(table) {
            if (!table || !table.id) {
                return;
            }

            table.querySelectorAll('th.ges-sortable').forEach(function (th) {
                th.addEventListener('click', function () {
                    var key = th.dataset.sortKey;
                    var type = th.dataset.sortType || 'string';
                    if (!key) {
                        return;
                    }

                    var tableState = sortState[table.id] || { key: null, order: 'asc' };
                    var nextOrder = 'asc';

                    if (tableState.key === key) {
                        nextOrder = tableState.order === 'asc' ? 'desc' : 'asc';
                    }

                    sortState[table.id] = { key: key, order: nextOrder };
                    sortTableRows(table, key, type, nextOrder);
                });
            });
        }

        function reapplyCurrentSort(table) {
            if (!table || !table.id) {
                return;
            }
            var tableState = sortState[table.id];
            if (!tableState || !tableState.key) {
                return;
            }
            var th = table.querySelector('th.ges-sortable[data-sort-key="' + tableState.key + '"]');
            var type = th ? th.dataset.sortType || 'string' : 'string';
            sortTableRows(table, tableState.key, type, tableState.order);
        }

        function renderSectores(sectores) {
            var tbody = tablaSectores.querySelector('tbody');
            tbody.innerHTML = '';
            state.sectorId = null;
            state.sectorNombre = '';
            state.tipoDisponibleId = null;
            state.tipoAsignadoId = null;

            if (!sectores.length) {
                setPlaceholder(tbody, 'No hay sectores para esta ubicación.', 2);
                setPlaceholder(tablaDisponibles.querySelector('tbody'), 'No hay tipos para mostrar.', 2);
                setPlaceholder(tablaAsignados.querySelector('tbody'), 'No hay tipos asignados.', 3);
                updateInfo();
                updateButtons();
                return;
            }

            sectores.forEach(function (sector) {
                var tr = document.createElement('tr');
                tr.dataset.id = sector.id;
                tr.dataset.nombre = sector.nombre || '';
                tr.innerHTML = '<td>' + sector.id + '</td><td>' + (sector.nombre || '') + '</td>';
                tbody.appendChild(tr);
            });
            if (sortState.tablaGesSectores && sortState.tablaGesSectores.key) {
                reapplyCurrentSort(tablaSectores);
            } else {
                sortTbodyByIdAsc(tbody);
            }

            setPlaceholder(tablaDisponibles.querySelector('tbody'), 'Seleccione un sector.', 2);
            setPlaceholder(tablaAsignados.querySelector('tbody'), 'Seleccione un sector.', 3);
            updateInfo();
            updateButtons();
        }

        function renderTipos(payload) {
            var tbodyDisponibles = tablaDisponibles.querySelector('tbody');
            var tbodyAsignados = tablaAsignados.querySelector('tbody');

            tbodyDisponibles.innerHTML = '';
            tbodyAsignados.innerHTML = '';
            state.tipoDisponibleId = null;
            state.tipoAsignadoId = null;

            if (!payload.disponibles || payload.disponibles.length === 0) {
                setPlaceholder(tbodyDisponibles, 'No hay tipos disponibles.', 2);
            } else {
                payload.disponibles.forEach(function (tipo) {
                    var tr = document.createElement('tr');
                    tr.dataset.id = tipo.idTipo;
                    tr.dataset.nombre = tipo.nombreTipo || '';
                    tr.innerHTML = '<td>' + tipo.idTipo + '</td><td>' + (tipo.nombreTipo || '') + '</td>';
                    tbodyDisponibles.appendChild(tr);
                });
                sortTbodyByIdAsc(tbodyDisponibles);
            }

            if (!payload.asignados || payload.asignados.length === 0) {
                setPlaceholder(tbodyAsignados, 'No hay tipos asignados al sector.', 3);
            } else {
                payload.asignados.forEach(function (tipo) {
                    var tr = document.createElement('tr');
                    tr.dataset.id = tipo.idTipo;
                    tr.dataset.nombre = tipo.nombreTipo || '';

                    var cantidad = tipo.CANTIDAD === null || typeof tipo.CANTIDAD === 'undefined'
                        ? ''
                        : tipo.CANTIDAD;

                    tr.innerHTML =
                        '<td>' + tipo.idTipo + '</td>' +
                        '<td>' + (tipo.nombreTipo || '') + '</td>' +
                        '<td><input class="ges-cantidad-input" type="number" min="1" step="1" value="' + cantidad + '" data-prev="' + cantidad + '" data-tipo-id="' + tipo.idTipo + '"></td>';

                    tbodyAsignados.appendChild(tr);
                });
                sortTbodyByIdAsc(tbodyAsignados);
            }

            updateButtons();
        }

        async function fetchSectores() {
            if (!state.ubicacionId) {
                return;
            }

            try {
                var response = await fetch('/lugares/equipos-sector/ubicaciones/' + state.ubicacionId + '/sectores', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                var data = await response.json();

                if (!response.ok) {
                    throw new Error('No se pudieron cargar los sectores.');
                }

                renderSectores(data);
            } catch (error) {
                notify(error.message || 'Error al cargar sectores.', 'error');
            }
        }

        async function fetchTipos() {
            if (!state.ubicacionId || !state.sectorId) {
                return;
            }

            try {
                var response = await fetch(
                    '/lugares/equipos-sector/ubicaciones/' + state.ubicacionId + '/sectores/' + state.sectorId + '/tipos',
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    }
                );
                var data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudieron cargar los tipos.');
                }

                renderTipos(data);
            } catch (error) {
                notify(error.message || 'Error al cargar tipos.', 'error');
            }
        }

        async function postJson(url, body) {
            var response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(body),
            });

            var data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Operación no completada.');
            }
            return data;
        }

        btnAsignar.addEventListener('click', async function () {
            if (!state.tipoDisponibleId) {
                return;
            }

            try {
                await postJson('/lugares/equipos-sector/asignar', {
                    ubicacion_id: state.ubicacionId,
                    sector_id: state.sectorId,
                    tipo_id: state.tipoDisponibleId,
                });

                notify('Tipo asignado correctamente.', 'success');
                await fetchTipos();
            } catch (error) {
                notify(error.message || 'No se pudo asignar el tipo.', 'error');
            }
        });

        btnQuitar.addEventListener('click', async function () {
            if (!state.tipoAsignadoId) {
                return;
            }

            try {
                await postJson('/lugares/equipos-sector/quitar', {
                    ubicacion_id: state.ubicacionId,
                    sector_id: state.sectorId,
                    tipo_id: state.tipoAsignadoId,
                });

                notify('Tipo quitado correctamente.', 'success');
                await fetchTipos();
            } catch (error) {
                notify(error.message || 'No se pudo quitar el tipo.', 'error');
            }
        });

        tablaAsignados.addEventListener('change', async function (event) {
            var input = event.target.closest('.ges-cantidad-input');
            if (!input) {
                return;
            }

            if (!state.ubicacionId || !state.sectorId) {
                return;
            }

            var cantidad = input.value === '' ? null : Number(input.value);
            if (cantidad !== null && (!Number.isInteger(cantidad) || cantidad < 1)) {
                notify('La cantidad debe ser un número entero mayor o igual a 1.', 'error');
                input.value = input.dataset.prev || '';
                return;
            }

            try {
                await postJson('/lugares/equipos-sector/cantidad', {
                    ubicacion_id: state.ubicacionId,
                    sector_id: state.sectorId,
                    tipo_id: Number(input.dataset.tipoId),
                    cantidad: cantidad,
                });
                input.dataset.prev = input.value;
                notify('Cantidad actualizada.', 'success');
            } catch (error) {
                input.value = input.dataset.prev || '';
                notify(error.message || 'No se pudo actualizar la cantidad.', 'error');
            }
        });

        bindRowSelection(tablaUbicaciones.querySelector('tbody'), function (row) {
            state.ubicacionId = Number(row.dataset.id);
            state.ubicacionNombre = row.dataset.nombre || '';
            state.sectorId = null;
            state.sectorNombre = '';
            state.tipoDisponibleId = null;
            state.tipoAsignadoId = null;
            mostrarVistaSectores();
            setPlaceholder(tablaDisponibles.querySelector('tbody'), 'Seleccione un sector.', 2);
            setPlaceholder(tablaAsignados.querySelector('tbody'), 'Seleccione un sector.', 3);
            updateInfo();
            updateButtons();
            fetchSectores();
        });

        bindRowSelection(tablaSectores.querySelector('tbody'), function (row) {
            state.sectorId = Number(row.dataset.id);
            state.sectorNombre = row.dataset.nombre || '';
            state.tipoDisponibleId = null;
            state.tipoAsignadoId = null;
            if (tituloAsignados) {
                tituloAsignados.textContent = 'Equipos del sector: ' + state.sectorNombre;
            }
            mostrarVistaAsignados();
            updateInfo();
            updateButtons();
            fetchTipos();
        });

        bindRowSelection(tablaDisponibles.querySelector('tbody'), function (row) {
            state.tipoDisponibleId = Number(row.dataset.id);
            state.tipoAsignadoId = null;
            clearSelection(tablaAsignados.querySelector('tbody'));
            updateButtons();
        });

        bindRowSelection(tablaAsignados.querySelector('tbody'), function (row) {
            state.tipoAsignadoId = Number(row.dataset.id);
            state.tipoDisponibleId = null;
            clearSelection(tablaDisponibles.querySelector('tbody'));
            updateButtons();
        });

        if (btnVolverSectores) {
            btnVolverSectores.addEventListener('click', function () {
                state.sectorId = null;
                state.sectorNombre = '';
                state.tipoDisponibleId = null;
                state.tipoAsignadoId = null;
                clearSelection(tablaSectores.querySelector('tbody'));
                setPlaceholder(tablaDisponibles.querySelector('tbody'), 'Seleccione un sector.', 2);
                setPlaceholder(tablaAsignados.querySelector('tbody'), 'Seleccione un sector.', 3);
                mostrarVistaSectores();
                updateInfo();
                updateButtons();
            });
        }

        initTableSorting(tablaUbicaciones);
        initTableSorting(tablaSectores);
        sortTbodyByIdAsc(tablaUbicaciones.querySelector('tbody'));
        mostrarVistaSectores();
        updateInfo();
        updateButtons();
    });
})();

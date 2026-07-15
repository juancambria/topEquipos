(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var modal = document.getElementById('modalTecnico');
        var form = document.getElementById('formTecnico');
        var tbody = document.querySelector('#tablaTecnicos tbody');
        if (!modal || !form) return;

        var selectedId = null;

        if (typeof CrudCommon !== 'undefined') {
            CrudCommon.initSearchInput({ selector: '#searchInput' });
            CrudCommon.initSortableHeaders('#tablaTecnicos .sortable');
        }

        document.getElementById('btnAnadir')?.addEventListener('click', function () {
            document.getElementById('modalTecnicoTitulo').textContent = 'Nuevo técnico';
            form.reset();
            form.dataset.mode = 'crear';
            abrirModal();
        });

        document.getElementById('btnEditar')?.addEventListener('click', function () {
            if (!selectedId) return;
            var tr = tbody.querySelector('tr[data-id="' + selectedId + '"]');
            if (!tr) return;
            document.getElementById('modalTecnicoTitulo').textContent = 'Editar técnico';
            document.getElementById('tecnicoNombre').value = tr.dataset.nombre || '';
            form.dataset.mode = 'editar';
            form.dataset.id = selectedId;
            abrirModal();
        });

        document.getElementById('btnEliminar')?.addEventListener('click', function () {
            if (!selectedId || !confirm('¿Eliminar el técnico seleccionado?')) return;
            fetch('/personas-tecnicos/' + selectedId + '/baja', {
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

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var mode = form.dataset.mode;
            var url = mode === 'editar'
                ? '/personas-tecnicos/' + form.dataset.id + '/actualizar'
                : '/personas-tecnicos/crear';

            fetch(url, {
                method: 'POST',
                headers: jsonHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ nombre: document.getElementById('tecnicoNombre').value.trim() }),
            })
                .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
                .then(function (res) {
                    if (!res.ok || !res.json.success) throw new Error(res.json.message || 'Error');
                    mostrarToast(res.json.message, 'success');
                    window.location.reload();
                })
                .catch(function (err) { mostrarToast(err.message, 'error'); });
        });

        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var tr = e.target.closest('tr[data-id]');
                if (!tr) return;
                tbody.querySelectorAll('tr').forEach(function (r) { r.classList.remove('selected'); });
                tr.classList.add('selected');
                selectedId = tr.dataset.id;
                document.getElementById('selectedInfo').textContent = tr.dataset.nombre + ' seleccionado';
                document.getElementById('btnEditar').disabled = false;
                document.getElementById('btnEliminar').disabled = false;
            });
        }

        window.cerrarModalTecnico = function () {
            modal.setAttribute('aria-hidden', 'true');
        };

        function abrirModal() {
            modal.setAttribute('aria-hidden', 'false');
        }

        function getCsrf() {
            var m = document.querySelector('meta[name="csrf-token"]');
            return m ? m.content : '';
        }

        function jsonHeaders(extra) {
            return Object.assign({ Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() }, extra || {});
        }
    });
})();

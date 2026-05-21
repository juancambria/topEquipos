(function() {
  'use strict';

  function createHMMain(config) {
    var c = window.HMCommon;
    if (!c || !config) return;

    function page() { return c.$(config.pageId); }
    var state = { selectedRow: null, editId: null, initial: '{}', touched: false, mode: 'create' };

    function updateSubmit() {
      var btn = c.$(config.saveButtonId);
      var form = c.$(config.formId);
      if (!btn || !form) return;
      var complete = (config.requiredFields || []).every(function(id) {
        var el = c.$(id);
        return !!el && String(el.value || '').trim() !== '';
      });
      if (state.mode === 'edit') {
        btn.disabled = !(complete && c.formSnapshot(form) !== state.initial);
        return;
      }
      btn.disabled = !complete;
    }

    async function cargarFamilias(selected) {
      var data = await c.fetchJson(page().dataset.apiFamilias);
      c.fillSelect(c.$(config.familyField), data.data, '— Seleccionar familia —', selected);
    }

    async function cargarMarcas(familiaId, selected) {
      var u = new URL(page().dataset.apiMarcas, window.location.origin);
      if (familiaId) u.searchParams.set(config.familyParam, familiaId);
      var data = await c.fetchJson(u.toString());
      c.fillSelect(c.$(config.brandField), data.data, '— Seleccionar marca —', selected);
    }

    async function cargarModelos(familiaId, marcaId, selected) {
      var u = new URL(page().dataset.apiModelos, window.location.origin);
      if (familiaId) u.searchParams.set(config.familyParam, familiaId);
      if (marcaId) u.searchParams.set(config.brandParam, marcaId);
      var data = await c.fetchJson(u.toString());
      c.fillSelect(c.$(config.modelField), data.data, '— Seleccionar modelo —', selected);
    }

    function selectRow(row) {
      if (state.selectedRow) state.selectedRow.classList.remove('seleccionado');
      state.selectedRow = row || null;
      if (state.selectedRow) state.selectedRow.classList.add('seleccionado');
      if (c.$(config.editButtonId)) c.$(config.editButtonId).disabled = !state.selectedRow;
      if (c.$(config.deleteButtonId)) c.$(config.deleteButtonId).disabled = !state.selectedRow;
      if (c.$(config.selectedInfoId)) {
        c.$(config.selectedInfoId).textContent = state.selectedRow
          ? ('Seleccionado: ' + (row.dataset.descripcion || '') + ' (ID ' + row.dataset.id + ')')
          : 'Ningún registro seleccionado';
      }
      c.persistSelection(config.rowSelector, state.selectedRow ? row.dataset.id : '');
    }

    async function abrirModal(mode, row) {
      var form = c.$(config.formId);
      if (!form) return;
      form.reset();
      state.editId = null;

      if (mode === 'edit' && row) {
        state.mode = 'edit';
        state.editId = Number(row.dataset.id);
        c.$(config.modalTitleId).textContent = config.editModalTitle;
        form.action = page().dataset.actualizarBase.replace(/\/$/, '') + '/' + state.editId + '/actualizar';
        c.$(config.descriptionField).value = row.dataset.descripcion || '';
        if (config.stockField) c.$(config.stockField).value = row.dataset.stock || '';
        await cargarFamilias(row.dataset.familiaId || '');
        await cargarMarcas(c.$(config.familyField).value, row.dataset.marcaId || '');
        await cargarModelos(c.$(config.familyField).value, c.$(config.brandField).value, row.dataset.modeloId || '');
      } else {
        state.mode = 'create';
        c.$(config.modalTitleId).textContent = config.createModalTitle;
        form.action = page().dataset.crearItem;
        await cargarFamilias('');
        c.fillSelect(c.$(config.brandField), [], '— Seleccionar marca —', '');
        c.fillSelect(c.$(config.modelField), [], '— Seleccionar modelo —', '');
        if (config.stockField) c.$(config.stockField).value = '';
      }

      state.initial = c.formSnapshot(form);
      state.touched = false;
      updateSubmit();
      c.setModal(config.modalId, true);
    }

    async function cerrarModal() {
      var form = c.$(config.formId);
      if (!form) return;
      var dirty = state.mode === 'create' ? state.touched : c.formSnapshot(form) !== state.initial;
      if (!dirty) return c.setModal(config.modalId, false);
      var ok = await c.openConfirm(config.closeTitle, 'Cerrar sin guardar cambios. ¿Desea continuar?', true);
      if (ok) c.setModal(config.modalId, false);
    }

    function bindQuickCreateButtons() {
      if (config.quickButtons.family) {
        c.$(config.quickButtons.family)?.addEventListener('click', async function() {
          var creada = await c.createQuickEntity({
            modalId: config.quickModalIds.family,
            title: 'Nueva Familia',
            bodyHtml: '<div class="form-grupo"><label for="' + config.quickInputIds.family + '">Nombre</label><input type="text" id="' + config.quickInputIds.family + '" maxlength="120" required></div>',
            confirmTitle: 'Crear familia',
            confirmMessage: 'Crear familia. ¿Desea continuar?',
            successMessage: 'Familia creada correctamente',
            url: page().dataset.crearFamilia,
            onBeforeOpen: function() { c.$(config.quickInputIds.family).value = ''; },
            buildPayload: function() { return { nombre: c.$(config.quickInputIds.family).value }; },
          });
          if (creada?.id) {
            await cargarFamilias(creada.id);
            await cargarMarcas(c.$(config.familyField).value, '');
            c.fillSelect(c.$(config.modelField), [], '— Seleccionar modelo —', '');
            state.touched = true;
            updateSubmit();
          }
        });
      }

      if (config.quickButtons.brand) {
        c.$(config.quickButtons.brand)?.addEventListener('click', async function() {
          if (!c.requireSelect(c.$(config.familyField))) return;
          var creada = await c.createQuickEntity({
            modalId: config.quickModalIds.brand,
            title: 'Nueva Marca',
            bodyHtml: '<div class="form-grupo"><label for="' + config.quickInputIds.brand + '">Nombre</label><input type="text" id="' + config.quickInputIds.brand + '" maxlength="120" required></div>',
            confirmTitle: 'Crear marca',
            confirmMessage: 'Crear marca. ¿Desea continuar?',
            successMessage: 'Marca creada correctamente',
            url: page().dataset.crearMarca,
            onBeforeOpen: function() { c.$(config.quickInputIds.brand).value = ''; },
            buildPayload: function() {
              var p = { nombre: c.$(config.quickInputIds.brand).value };
              p[config.familyParam] = c.$(config.familyField).value;
              return p;
            },
          });
          if (creada?.id) {
            await cargarMarcas(c.$(config.familyField).value, creada.id);
            await cargarModelos(c.$(config.familyField).value, c.$(config.brandField).value, '');
            state.touched = true;
            updateSubmit();
          }
        });
      }

      if (config.quickButtons.model) {
        c.$(config.quickButtons.model)?.addEventListener('click', async function() {
          if (!c.requireSelect(c.$(config.familyField)) || !c.requireSelect(c.$(config.brandField))) return;
          var creada = await c.createQuickEntity({
            modalId: config.quickModalIds.model,
            title: 'Nuevo Modelo',
            bodyHtml: '<div class="form-grupo"><label for="' + config.quickInputIds.model + '">Nombre</label><input type="text" id="' + config.quickInputIds.model + '" maxlength="120" required></div>',
            confirmTitle: 'Crear modelo',
            confirmMessage: 'Crear modelo. ¿Desea continuar?',
            successMessage: 'Modelo creado correctamente',
            url: page().dataset.crearModelo,
            onBeforeOpen: function() { c.$(config.quickInputIds.model).value = ''; },
            buildPayload: function() {
              var p = { nombre: c.$(config.quickInputIds.model).value };
              p[config.familyParam] = c.$(config.familyField).value;
              p[config.brandParam] = c.$(config.brandField).value;
              return p;
            },
          });
          if (creada?.id) {
            await cargarModelos(c.$(config.familyField).value, c.$(config.brandField).value, creada.id);
            state.touched = true;
            updateSubmit();
          }
        });
      }
    }

    function initForm() {
      var form = c.$(config.formId);
      if (!form || form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      ['input', 'change'].forEach(function(evt) {
        form.addEventListener(evt, function() { state.touched = true; updateSubmit(); });
      });

      c.$(config.familyField).addEventListener('change', async function() {
        try {
          await cargarMarcas(this.value, '');
          c.fillSelect(c.$(config.modelField), [], '— Seleccionar modelo —', '');
          updateSubmit();
        } catch (e) { c.toast(e.message, 'error'); }
      });
      c.$(config.brandField).addEventListener('change', async function() {
        try {
          await cargarModelos(c.$(config.familyField).value, this.value, '');
          updateSubmit();
        } catch (e) { c.toast(e.message, 'error'); }
      });

      bindQuickCreateButtons();

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var isEdit = !!state.editId;
        var ok = await c.openConfirm(
          isEdit ? config.updateTitle : config.createTitle,
          (isEdit ? 'Actualizar' : 'Crear') + ' ' + config.entityLabel + '. ¿Desea continuar?',
          false
        );
        if (!ok) return;
        try {
          var res = await c.postForm(form.action, form);
          c.persistSelection(config.rowSelector, isEdit ? state.editId : (res?.data?.id ?? null));
          c.toast(res?.message || (isEdit ? 'Registro actualizado correctamente' : 'Registro creado correctamente'), 'success');
          location.reload();
        } catch (err) {
          c.toast(err.message, 'error');
        }
      });
    }

    function initTable() {
      var rows = Array.from(document.querySelectorAll(config.rowSelector));
      rows.forEach(function(row) {
        row.tabIndex = 0;
        row.addEventListener('click', function() { selectRow(row); });
        row.addEventListener('dblclick', function() { selectRow(row); abrirModal('edit', row); });
        row.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            selectRow(row);
            abrirModal('edit', row);
          }
        });
      });

      CrudCommon.bindArrowRowNavigation({
        rowSelector: config.rowSelector,
        getSelectedRow: function() { return state.selectedRow; },
        onSelectRow: function(row) { selectRow(row); },
      });

      var pid = c.readPersistedSelection(config.rowSelector);
      if (pid) {
        var row = rows.find(function(r) { return String(r.dataset.id) === String(pid); });
        if (row) {
          selectRow(row);
          row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }

    function initToolbar() {
      c.$(config.createButtonId)?.addEventListener('click', function() { abrirModal('create'); });
      if (config.createEmptyButtonId) c.$(config.createEmptyButtonId)?.addEventListener('click', function() { abrirModal('create'); });
      c.$(config.editButtonId)?.addEventListener('click', function() { if (state.selectedRow) abrirModal('edit', state.selectedRow); });
      c.$(config.deleteButtonId)?.addEventListener('click', function() {
        if (!state.selectedRow) return;
        abrirModalConfirmacion(config.deleteTitle, config.deleteMessage, async function() {
          try {
            await c.postJson(page().dataset.bajaBase.replace(/\/$/, '') + '/' + state.selectedRow.dataset.id + '/baja', {});
            c.toast('Registro eliminado correctamente', 'success');
            location.reload();
          } catch (e) {
            c.toast(e.message, 'error');
          }
        }, false, false);
      });

      document.addEventListener('keydown', function(e) {
        if (!page() || !e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
        var k = (e.key || '').toLowerCase();
        var map = {};
        map[config.shortcuts.create] = config.createButtonId;
        map[config.shortcuts.edit] = config.editButtonId;
        map[config.shortcuts.delete] = config.deleteButtonId;
        var btn = c.$(map[k] || '');
        if (!btn || btn.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        btn.click();
      }, true);
    }

    function init() {
      if (!page()) return;
      initForm();
      initToolbar();
      initTable();
      CrudCommon.initSearchInput();
      CrudCommon.initSortableHeaders(config.sortableHeaderSelector);
    }

    document.addEventListener('DOMContentLoaded', init);
    window[config.closeFunctionName] = cerrarModal;
  }

  window.createHMMain = createHMMain;
})();

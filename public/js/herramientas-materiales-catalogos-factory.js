(function() {
  'use strict';

  function createHMCatalogos(config) {
    var c = window.HMCommon;
    if (!c || !config) return;
    var modalState = {};

    function ensureState(id) {
      if (!modalState[id]) modalState[id] = { initial: '{}', dirty: false, touched: false, mode: 'create', requiredFields: [] };
      return modalState[id];
    }

    function setModalInitial(id, form) {
      var st = ensureState(id);
      st.initial = c.formSnapshot(form);
      st.dirty = false;
      st.touched = false;
    }

    function hasUnsavedModalChanges(id) {
      var form = c.$(id + 'Form');
      var st = ensureState(id);
      if (st.mode === 'create') return !!st.touched;
      if (form) return c.formSnapshot(form) !== st.initial;
      return !!st.dirty;
    }

    function updateSubmitState(id, form) {
      if (!form) return;
      var submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      var st = ensureState(id);
      var complete = (st.requiredFields || []).every(function(fid) {
        var el = c.$(fid);
        return !!el && String(el.value || '').trim() !== '';
      });
      if (st.mode === 'edit') {
        submitBtn.disabled = !(complete && c.formSnapshot(form) !== st.initial);
        return;
      }
      submitBtn.disabled = !complete;
    }

    function watchModalDirty(id, form) {
      if (!form || form.dataset['watch' + id] === '1') return;
      form.dataset['watch' + id] = '1';
      var recompute = function(markTouched) {
        var st = ensureState(id);
        if (markTouched) st.touched = true;
        st.dirty = c.formSnapshot(form) !== st.initial;
        updateSubmitState(id, form);
      };
      form.addEventListener('input', function() { recompute(true); });
      form.addEventListener('change', function() { recompute(true); });
    }

    async function requestCloseModal(modal, id, title) {
      if (!modal) return;
      if (!hasUnsavedModalChanges(id)) return c.closeModal(modal);
      var ok = await c.openConfirm('Cerrar ' + (title || 'modal'), 'Cerrar sin guardar cambios. ¿Desea continuar?', true);
      if (ok) c.closeModal(modal);
    }

    function ensureCrudModal(id, title, bodyHtml) {
      var existing = c.$(id);
      if (existing) return existing;
      var wrap = document.createElement('div');
      wrap.id = id;
      wrap.className = 'modal-overlay';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.zIndex = '120100';
      wrap.innerHTML = ''
        + '<div class="modal-sector">'
        + '  <div class="modal-sector-header">'
        + '    <h2 id="' + id + 'Titulo">' + title + '</h2>'
        + '    <button type="button" class="modal-cerrar" data-close="' + id + '">&times;</button>'
        + '  </div>'
        + '  <form id="' + id + 'Form" class="modal-sector-body">' + bodyHtml
        + '    <div class="modal-sector-footer">'
        + '      <button type="button" class="btn btn-secundario" data-close="' + id + '">Cancelar</button>'
        + '      <button type="submit" class="btn btn-primario">Guardar</button>'
        + '    </div>'
        + '  </form>'
        + '</div>';
      document.body.appendChild(wrap);
      wrap.addEventListener('click', function(e) {
        if (e.target === wrap || (e.target.getAttribute && e.target.getAttribute('data-close') === id)) requestCloseModal(wrap, id, title);
      });
      return wrap;
    }

    async function createQuickFamily(pageEl, ids) {
      return await c.createQuickEntity({
        modalId: ids.modalId,
        title: 'Nueva Familia',
        bodyHtml: '<div class="form-grupo"><label for="' + ids.inputId + '">Nombre</label><input type="text" id="' + ids.inputId + '" maxlength="120" required></div>',
        confirmTitle: 'Crear familia',
        confirmMessage: 'Crear familia. ¿Desea continuar?',
        successMessage: 'Familia creada correctamente',
        url: pageEl.dataset.crearFamilia,
        onBeforeOpen: function() { c.$(ids.inputId).value = ''; },
        buildPayload: function() { return { nombre: c.$(ids.inputId).value }; },
      });
    }

    async function createQuickBrand(pageEl, ids, familyFieldId) {
      if (!c.requireSelect(c.$(familyFieldId))) return null;
      return await c.createQuickEntity({
        modalId: ids.modalId,
        title: 'Nueva Marca',
        bodyHtml: '<div class="form-grupo"><label for="' + ids.inputId + '">Nombre</label><input type="text" id="' + ids.inputId + '" maxlength="120" required></div>',
        confirmTitle: 'Crear marca',
        confirmMessage: 'Crear marca. ¿Desea continuar?',
        successMessage: 'Marca creada correctamente',
        url: pageEl.dataset.crearMarca,
        onBeforeOpen: function() { c.$(ids.inputId).value = ''; },
        buildPayload: function() {
          var p = { nombre: c.$(ids.inputId).value };
          p[config.params.family] = c.$(familyFieldId).value;
          return p;
        },
      });
    }

    function initFamilias() {
      var spec = config.pages.familias;
      var page = c.$(spec.pageId);
      if (!page) return;

      var modal = ensureCrudModal(spec.modal.id, 'Familia', ''
        + '<input type="hidden" id="' + spec.modal.fields.id + '">'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.name + '">Nombre</label><input type="text" id="' + spec.modal.fields.name + '" maxlength="120" required></div>'
      );
      var form = c.$(spec.modal.id + 'Form');

      var selection = CrudCommon.createRowSelection({
        rowSelector: spec.rowSelector,
        selectedInfo: c.$(spec.selectedInfoId),
        buttons: [c.$(spec.buttons.edit), c.$(spec.buttons.delete)],
        outsideIgnoreSelectors: [spec.buttons.create, spec.buttons.edit, spec.buttons.delete].map(function(id) { return '#' + id; }),
        formatInfo: function(row) { return row ? ('Familia seleccionada: ' + row.dataset.nombre + ' (ID ' + row.dataset.id + ')') : 'Ninguna familia seleccionada'; },
        onDoubleClick: function(row) { if (selection.getSelectedRow() !== row) selection.select(row); openEdit(row); },
      });

      CrudCommon.bindArrowRowNavigation({
        rowSelector: spec.rowSelector,
        getSelectedRow: selection.getSelectedRow,
        onSelectRow: function(row) { row.click(); },
      });

      function openCreate() {
        c.$(spec.modal.fields.id).value = '';
        c.$(spec.modal.fields.name).value = '';
        var st = ensureState(spec.modal.id);
        st.mode = 'create';
        st.requiredFields = [spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      function openEdit(rowArg) {
        var row = rowArg || selection.getSelectedRow();
        if (!row) return;
        c.$(spec.modal.fields.id).value = row.dataset.id;
        c.$(spec.modal.fields.name).value = row.dataset.nombre || '';
        var st = ensureState(spec.modal.id);
        st.mode = 'edit';
        st.requiredFields = [spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      watchModalDirty(spec.modal.id, form);
      c.$(spec.buttons.create)?.addEventListener('click', openCreate);
      c.$(spec.buttons.edit)?.addEventListener('click', function() { openEdit(); });
      c.$(spec.buttons.delete)?.addEventListener('click', function() {
        var row = selection.getSelectedRow();
        if (!row) return;
        abrirModalConfirmacion('Eliminar familia', 'Eliminar familia. ¿Desea continuar?', async function() {
          try { await c.postJson(page.dataset.base.replace(/\/$/, '') + '/' + row.dataset.id + '/baja', {}); location.reload(); }
          catch (e) { c.toast(e.message, 'error'); }
        }, false, false);
      });

      form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var id = c.$(spec.modal.fields.id).value;
        var ok = await c.openConfirm(id ? 'Actualizar familia' : 'Crear familia', (id ? 'Actualizar' : 'Crear') + ' familia. ¿Desea continuar?', false);
        if (!ok) return;
        var url = id ? (page.dataset.base.replace(/\/$/, '') + '/' + id + '/actualizar') : page.dataset.crear;
        try {
          var res = await c.postJson(url, { nombre: c.$(spec.modal.fields.name).value });
          c.persistSelection(spec.rowSelector, id ? Number(id) : (res?.data?.id ?? null));
          c.closeModal(modal);
          location.reload();
        } catch (err) { c.toast(err.message, 'error'); }
      });
    }

    function initMarcas() {
      var spec = config.pages.marcas;
      var page = c.$(spec.pageId);
      if (!page) return;

      var modal = ensureCrudModal(spec.modal.id, 'Marca', ''
        + '<input type="hidden" id="' + spec.modal.fields.id + '">'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.family + '">Familia</label>'
        + '<div class="input-group"><select id="' + spec.modal.fields.family + '" required><option value="">— Seleccionar familia —</option></select>'
        + '<div class="input-group-append"><button type="button" class="btn btn-agregar-entidad" id="' + spec.modal.buttons.quickFamily + '">+</button></div></div></div>'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.name + '">Nombre</label><input type="text" id="' + spec.modal.fields.name + '" maxlength="120" required></div>'
      );
      var form = c.$(spec.modal.id + 'Form');

      async function loadFamilies(selected) {
        var data = await c.fetchJson(page.dataset.apiFamilias);
        c.fillSelect(c.$(spec.modal.fields.family), data.data, '— Seleccionar familia —', selected);
      }

      var selection = CrudCommon.createRowSelection({
        rowSelector: spec.rowSelector,
        selectedInfo: c.$(spec.selectedInfoId),
        buttons: [c.$(spec.buttons.edit), c.$(spec.buttons.delete)],
        outsideIgnoreSelectors: [spec.buttons.create, spec.buttons.edit, spec.buttons.delete].map(function(id) { return '#' + id; }),
        formatInfo: function(row) { return row ? ('Marca seleccionada: ' + row.dataset.nombre + ' (ID ' + row.dataset.id + ')') : 'Ninguna marca seleccionada'; },
        onDoubleClick: function(row) { if (selection.getSelectedRow() !== row) selection.select(row); openEdit(row); },
      });

      function openCreate() {
        c.$(spec.modal.fields.id).value = '';
        c.$(spec.modal.fields.name).value = '';
        c.fillSelect(c.$(spec.modal.fields.family), [], '— Seleccionar familia —');
        loadFamilies('');
        var st = ensureState(spec.modal.id);
        st.mode = 'create';
        st.requiredFields = [spec.modal.fields.family, spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      async function openEdit(rowArg) {
        var row = rowArg || selection.getSelectedRow();
        if (!row) return;
        c.$(spec.modal.fields.id).value = row.dataset.id;
        c.$(spec.modal.fields.name).value = row.dataset.nombre || '';
        await loadFamilies(row.dataset.familiaId || '');
        var st = ensureState(spec.modal.id);
        st.mode = 'edit';
        st.requiredFields = [spec.modal.fields.family, spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      watchModalDirty(spec.modal.id, form);
      c.$(spec.modal.buttons.quickFamily)?.addEventListener('click', async function() {
        var creada = await createQuickFamily(page, spec.modal.quickFamilyIds);
        if (creada?.id) { await loadFamilies(creada.id); updateSubmitState(spec.modal.id, form); }
      });
      c.$(spec.buttons.create)?.addEventListener('click', openCreate);
      c.$(spec.buttons.edit)?.addEventListener('click', function() { openEdit(); });
      c.$(spec.buttons.delete)?.addEventListener('click', function() {
        var row = selection.getSelectedRow();
        if (!row) return;
        abrirModalConfirmacion('Eliminar marca', 'Eliminar marca. ¿Desea continuar?', async function() {
          try { await c.postJson(page.dataset.base.replace(/\/$/, '') + '/' + row.dataset.id + '/baja', {}); location.reload(); }
          catch (e) { c.toast(e.message, 'error'); }
        }, false, false);
      });

      form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var id = c.$(spec.modal.fields.id).value;
        var ok = await c.openConfirm(id ? 'Actualizar marca' : 'Crear marca', (id ? 'Actualizar' : 'Crear') + ' marca. ¿Desea continuar?', false);
        if (!ok) return;
        var payload = { nombre: c.$(spec.modal.fields.name).value };
        payload[config.params.family] = c.$(spec.modal.fields.family).value;
        var url = id ? (page.dataset.base.replace(/\/$/, '') + '/' + id + '/actualizar') : page.dataset.crear;
        try {
          var res = await c.postJson(url, payload);
          c.persistSelection(spec.rowSelector, id ? Number(id) : (res?.data?.id ?? null));
          c.closeModal(modal);
          location.reload();
        } catch (err) { c.toast(err.message, 'error'); }
      });
    }

    function initModelos() {
      var spec = config.pages.modelos;
      var page = c.$(spec.pageId);
      if (!page) return;

      var modal = ensureCrudModal(spec.modal.id, 'Modelo', ''
        + '<input type="hidden" id="' + spec.modal.fields.id + '">'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.family + '">Familia</label>'
        + '<div class="input-group"><select id="' + spec.modal.fields.family + '" required><option value="">— Seleccionar familia —</option></select>'
        + '<div class="input-group-append"><button type="button" class="btn btn-agregar-entidad" id="' + spec.modal.buttons.quickFamily + '">+</button></div></div></div>'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.brand + '">Marca</label>'
        + '<div class="input-group"><select id="' + spec.modal.fields.brand + '" required><option value="">— Seleccionar marca —</option></select>'
        + '<div class="input-group-append"><button type="button" class="btn btn-agregar-entidad" id="' + spec.modal.buttons.quickBrand + '">+</button></div></div></div>'
        + '<div class="form-grupo"><label for="' + spec.modal.fields.name + '">Nombre</label><input type="text" id="' + spec.modal.fields.name + '" maxlength="120" required></div>'
      );
      var form = c.$(spec.modal.id + 'Form');

      async function loadFamilies(selected) {
        var data = await c.fetchJson(page.dataset.apiFamilias);
        c.fillSelect(c.$(spec.modal.fields.family), data.data, '— Seleccionar familia —', selected);
      }
      async function loadBrands(familiaId, selected) {
        var u = new URL(page.dataset.apiMarcas, window.location.origin);
        if (familiaId) u.searchParams.set(config.params.family, familiaId);
        var data = await c.fetchJson(u.toString());
        c.fillSelect(c.$(spec.modal.fields.brand), data.data, '— Seleccionar marca —', selected);
      }

      var selection = CrudCommon.createRowSelection({
        rowSelector: spec.rowSelector,
        selectedInfo: c.$(spec.selectedInfoId),
        buttons: [c.$(spec.buttons.edit), c.$(spec.buttons.delete)],
        outsideIgnoreSelectors: [spec.buttons.create, spec.buttons.edit, spec.buttons.delete].map(function(id) { return '#' + id; }),
        formatInfo: function(row) { return row ? ('Modelo seleccionado: ' + row.dataset.nombre + ' (ID ' + row.dataset.id + ')') : 'Ningún modelo seleccionado'; },
        onDoubleClick: function(row) { if (selection.getSelectedRow() !== row) selection.select(row); openEdit(row); },
      });

      function openCreate() {
        c.$(spec.modal.fields.id).value = '';
        c.$(spec.modal.fields.name).value = '';
        c.fillSelect(c.$(spec.modal.fields.family), [], '— Seleccionar familia —');
        c.fillSelect(c.$(spec.modal.fields.brand), [], '— Seleccionar marca —');
        loadFamilies('');
        var st = ensureState(spec.modal.id);
        st.mode = 'create';
        st.requiredFields = [spec.modal.fields.family, spec.modal.fields.brand, spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      async function openEdit(rowArg) {
        var row = rowArg || selection.getSelectedRow();
        if (!row) return;
        c.$(spec.modal.fields.id).value = row.dataset.id;
        c.$(spec.modal.fields.name).value = row.dataset.nombre || '';
        await loadFamilies(row.dataset.familiaId || '');
        await loadBrands(c.$(spec.modal.fields.family).value, row.dataset.marcaId || '');
        var st = ensureState(spec.modal.id);
        st.mode = 'edit';
        st.requiredFields = [spec.modal.fields.family, spec.modal.fields.brand, spec.modal.fields.name];
        c.openModal(modal);
        setTimeout(function() { setModalInitial(spec.modal.id, form); updateSubmitState(spec.modal.id, form); }, 0);
      }

      watchModalDirty(spec.modal.id, form);
      c.$(spec.modal.fields.family)?.addEventListener('change', function() {
        loadBrands(this.value, '').then(function() { updateSubmitState(spec.modal.id, form); }).catch(function(e) { c.toast(e.message, 'error'); });
      });
      c.$(spec.modal.buttons.quickFamily)?.addEventListener('click', async function() {
        var creada = await createQuickFamily(page, spec.modal.quickFamilyIds);
        if (creada?.id) {
          await loadFamilies(creada.id);
          c.fillSelect(c.$(spec.modal.fields.brand), [], '— Seleccionar marca —');
          updateSubmitState(spec.modal.id, form);
        }
      });
      c.$(spec.modal.buttons.quickBrand)?.addEventListener('click', async function() {
        var creada = await createQuickBrand(page, spec.modal.quickBrandIds, spec.modal.fields.family);
        if (creada?.id) {
          await loadBrands(c.$(spec.modal.fields.family).value, creada.id);
          updateSubmitState(spec.modal.id, form);
        }
      });
      c.$(spec.buttons.create)?.addEventListener('click', openCreate);
      c.$(spec.buttons.edit)?.addEventListener('click', function() { openEdit(); });
      c.$(spec.buttons.delete)?.addEventListener('click', function() {
        var row = selection.getSelectedRow();
        if (!row) return;
        abrirModalConfirmacion('Eliminar modelo', 'Eliminar modelo. ¿Desea continuar?', async function() {
          try { await c.postJson(page.dataset.base.replace(/\/$/, '') + '/' + row.dataset.id + '/baja', {}); location.reload(); }
          catch (e) { c.toast(e.message, 'error'); }
        }, false, false);
      });

      form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var id = c.$(spec.modal.fields.id).value;
        var ok = await c.openConfirm(id ? 'Actualizar modelo' : 'Crear modelo', (id ? 'Actualizar' : 'Crear') + ' modelo. ¿Desea continuar?', false);
        if (!ok) return;
        var payload = { nombre: c.$(spec.modal.fields.name).value };
        payload[config.params.family] = c.$(spec.modal.fields.family).value;
        payload[config.params.brand] = c.$(spec.modal.fields.brand).value;
        var url = id ? (page.dataset.base.replace(/\/$/, '') + '/' + id + '/actualizar') : page.dataset.crear;
        try {
          var res = await c.postJson(url, payload);
          c.persistSelection(spec.rowSelector, id ? Number(id) : (res?.data?.id ?? null));
          c.closeModal(modal);
          location.reload();
        } catch (err) { c.toast(err.message, 'error'); }
      });
    }

    document.addEventListener('DOMContentLoaded', function() {
      initFamilias();
      initMarcas();
      initModelos();
      CrudCommon.initSearchInput();
      CrudCommon.initSortableHeaders('th.sortable');
    });
  }

  window.createHMCatalogos = createHMCatalogos;
})();

(function() {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function toast(msg, type) { if (typeof mostrarToast === 'function') mostrarToast(msg, type || 'info'); }
  function setModal(id, show) { var el = $(id); if (el) el.setAttribute('aria-hidden', show ? 'false' : 'true'); }

  function persistSelection(rowSelector, id) {
    if (!rowSelector || id == null || !window.CrudCommon) return;
    if (typeof window.CrudCommon.setPersistedSelection === 'function') {
      window.CrudCommon.setPersistedSelection(rowSelector, id);
    }
  }

  function readPersistedSelection(rowSelector) {
    try { return sessionStorage.getItem('crud-selection::' + window.location.pathname + '::' + rowSelector); } catch (_e) { return null; }
  }

  function firstLaravelError(payload) {
    if (!payload || !payload.errors) return '';
    var keys = Object.keys(payload.errors);
    if (!keys.length) return '';
    var arr = payload.errors[keys[0]];
    return Array.isArray(arr) && arr.length ? String(arr[0]) : '';
  }

  async function fetchJson(url) {
    var r = await fetch(url, { headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }) });
    var data = await r.json();
    if (!r.ok || data.success === false) throw new Error(firstLaravelError(data) || data.message || ('Error ' + r.status));
    return data;
  }

  async function postForm(url, formEl) {
    var r = await fetch(url, { method: 'POST', headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }), body: new FormData(formEl) });
    var data = await r.json();
    if (!r.ok || data.success === false) throw new Error(firstLaravelError(data) || data.message || ('Error ' + r.status));
    return data;
  }

  async function postJson(url, payload) {
    var r = await fetch(url, {
      method: 'POST',
      headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload || {}),
    });
    var data = await r.json();
    if (!r.ok || data.success === false) throw new Error(firstLaravelError(data) || data.message || ('Error ' + r.status));
    return data;
  }

  function openConfirm(title, message, danger) {
    return new Promise(function(resolve) {
      if (typeof abrirModalConfirmacion !== 'function') return resolve(window.confirm(message || '¿Desea continuar?'));
      abrirModalConfirmacion(title, message, function() { resolve(true); }, false, !!danger);
      var ov = $('modal-confirmacion-overlay');
      if (!ov) return;
      var ob = new MutationObserver(function() {
        if (!ov.classList.contains('activo')) {
          ob.disconnect();
          resolve(false);
        }
      });
      ob.observe(ov, { attributes: true, attributeFilter: ['class'] });
    });
  }

  function formSnapshot(form) {
    if (!form) return '{}';
    var entries = [];
    form.querySelectorAll('input, select, textarea').forEach(function(el) {
      if (!el) return;
      var type = (el.type || '').toLowerCase();
      if (type === 'button' || type === 'submit' || type === 'reset') return;
      var key = el.name || el.id;
      if (!key) return;
      if (type === 'checkbox' || type === 'radio') {
        entries.push([key, el.checked ? String(el.value || '1') : '0']);
      } else {
        entries.push([key, String(el.value ?? '')]);
      }
    });
    entries.sort(function(a, b) { return a[0].localeCompare(b[0]); });
    return JSON.stringify(entries);
  }

  function fillSelect(select, rows, placeholder, selected) {
    if (!select) return;
    var html = '<option value="">' + placeholder + '</option>';
    (rows || []).forEach(function(r) {
      var v = String(r.id || '');
      var sel = selected != null && String(selected) === v ? ' selected' : '';
      html += '<option value="' + v + '"' + sel + '>' + String(r.nombre || '') + '</option>';
    });
    select.innerHTML = html;
  }

  function ensureModal(id, title, bodyHtml, zIndex) {
    var existing = $(id);
    if (existing) return existing;
    var wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'modal-overlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.zIndex = String(zIndex || 120100);
    wrap.innerHTML = ''
      + '<div class="modal-sector">'
      + '  <div class="modal-sector-header">'
      + '    <h2>' + title + '</h2>'
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
      if (e.target === wrap || (e.target.getAttribute && e.target.getAttribute('data-close') === id)) {
        wrap.setAttribute('aria-hidden', 'true');
      }
    });
    return wrap;
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute('aria-hidden', 'false');
    setTimeout(function() {
      var focusEl = modalEl.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])');
      if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
    }, 0);
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute('aria-hidden', 'true');
  }

  function requireSelect(selectEl) {
    if (!selectEl) return false;
    if (String(selectEl.value || '').trim() !== '') return true;
    if (typeof selectEl.reportValidity === 'function') {
      selectEl.setCustomValidity('Selecciona un elemento de la lista');
      selectEl.reportValidity();
      setTimeout(function() { selectEl.setCustomValidity(''); }, 0);
    }
    selectEl.focus();
    return false;
  }

  async function createQuickEntity(options) {
    var modal = ensureModal(options.modalId, options.title, options.bodyHtml, options.zIndex || 120100);
    var form = $(options.modalId + 'Form');
    if (!form) return null;
    if (typeof options.onBeforeOpen === 'function') options.onBeforeOpen();
    openModal(modal);
    return await new Promise(function(resolve) {
      var resolved = false;
      function finish(value) {
        if (resolved) return;
        resolved = true;
        closeModal(modal);
        form.removeEventListener('submit', onSubmit);
        resolve(value || null);
      }
      async function onSubmit(e) {
        e.preventDefault();
        var ok = await openConfirm(options.confirmTitle, options.confirmMessage, false);
        if (!ok) return;
        try {
          var result = await postJson(options.url, options.buildPayload());
          toast(options.successMessage, 'success');
          finish(result.data || null);
        } catch (err) {
          toast(err.message, 'error');
        }
      }
      form.addEventListener('submit', onSubmit);
    });
  }

  window.HMCommon = {
    $: $,
    toast: toast,
    setModal: setModal,
    persistSelection: persistSelection,
    readPersistedSelection: readPersistedSelection,
    firstLaravelError: firstLaravelError,
    fetchJson: fetchJson,
    postForm: postForm,
    postJson: postJson,
    openConfirm: openConfirm,
    formSnapshot: formSnapshot,
    fillSelect: fillSelect,
    ensureModal: ensureModal,
    openModal: openModal,
    closeModal: closeModal,
    requireSelect: requireSelect,
    createQuickEntity: createQuickEntity,
  };
})();

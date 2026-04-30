/**
 * Enfoque automático y ciclo de Tab (focus trap) dentro de modales.
 * Mantiene el foco dentro del overlay/modal mientras esté visible.
 */
(function () {
  'use strict';

  if (window.__modalKeyboardLoaded) return;
  window.__modalKeyboardLoaded = true;

  var MODAL_ROOT = '.modal, .modal-overlay, .modal-antiguo, .modal-confirmacion-overlay';
  var FOCUS_DELAY_MS = 50;

  function isModalVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.classList.contains('modal-oculto')) return false;
    if (el.classList.contains('modal-confirmacion-overlay')) {
      return el.classList.contains('activo');
    }
    if (
      el.matches &&
      el.matches('.modal-overlay') &&
      el.classList.contains('show') &&
      el.getAttribute('aria-hidden') === 'false'
    ) {
      return true;
    }
    if (el.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    var s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (parseFloat(s.opacity || '1') === 0) return false;
    return true;
  }

  function isFocusableElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
    if (el.tabIndex < 0) return false;
    if (el.tagName === 'INPUT' && el.type === 'hidden') return false;
    var s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (s.pointerEvents === 'none') return false;
    var rects = el.getClientRects();
    if (!rects || rects.length === 0) return false;
    return true;
  }

  function getFocusable(root) {
    if (!root) return [];
    var sel = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.prototype.slice.call(root.querySelectorAll(sel)).filter(isFocusableElement);
  }

  function getModalForFocus() {
    var el = document.activeElement;
    if (!el || el === document.body) return null;
    var modal = el.closest && el.closest(MODAL_ROOT);
    if (modal && isModalVisible(modal)) return modal;
    return null;
  }

  function hasAnyVisibleModal() {
    var nodes = document.querySelectorAll(MODAL_ROOT);
    for (var i = 0; i < nodes.length; i++) {
      if (isModalVisible(nodes[i])) return true;
    }
    return false;
  }

  function getFocusableInPageRoot(pageRoot) {
    return getFocusable(pageRoot).filter(function (el) {
      var modal = el.closest && el.closest(MODAL_ROOT);
      if (!modal) return true;
      return isModalVisible(modal);
    });
  }

  function cycleTabTrap(list, e) {
    if (list.length === 0) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onDocumentKeydown(e) {
    onFooterAltShortcuts(e);
    if (e.key !== 'Tab') return;
    var modal = getModalForFocus();
    if (modal) {
      var modalList = getFocusable(modal);
      cycleTabTrap(modalList, e);
      return;
    }
    if (!document.body.classList.contains('window-embedded')) return;
    if (hasAnyVisibleModal()) return;
    var pageRoot = document.querySelector('.embedded-page');
    if (!pageRoot) return;
    var ae = document.activeElement;
    if (!ae || ae === document.body || !pageRoot.contains(ae)) return;
    var pageList = getFocusableInPageRoot(pageRoot);
    if (pageList.length === 0) return;
    var idx = pageList.indexOf(ae);
    if (idx === -1) {
      e.preventDefault();
      if (e.shiftKey) {
        pageList[pageList.length - 1].focus();
      } else {
        pageList[0].focus();
      }
      return;
    }
    cycleTabTrap(pageList, e);
  }

  /* -------- Atajos Alt en pies de modal (Cancelar=C, Actualizar=A, etc.) ---------- */

  var FOOTER_SELECTOR = '.modal-sector-footer, .modal-equipo-footer, .modal-footer, .totales-footer';

  function toastConfirmOverlayActive() {
    var o = document.getElementById('modal-confirmacion-overlay');
    return !!(o && o.classList.contains('activo'));
  }

  /** Alt en pie del modal: debe funcionar también con foco en inputs (Cancelar/Actualizar aun escribiendo en Nombre). */

  function normalizeFooterLabel(text) {
    if (!text) return '';
    return text
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
  var FOOTER_LABEL_RULES = [
    { re: /^cancelar$/i, key: 'c', pos: 0 },
    { re: /^seguir editando$/i, key: 's', pos: 0 },
    { re: /^si,\s*cerrar$/i, key: 'c' },
    { re: /^actualizar$/i, key: 'a', pos: 0 },
    { re: /^crear\s+factura$/i, key: 'f' },
    { re: /^crear\s+tipo$/i, key: 't' },
    { re: /^crear$/i, key: 'r', pos: 1 },
    { re: /^guardar$/i, key: 'g', pos: 0 },
    { re: /^guardando/i, key: 'g', pos: 0 },
    { re: /^confirmar$/i, key: 'o', pos: 1 },
    { re: /^cerrar$/i, key: 'c', pos: 0 },
    { re: /^omitir$/i, key: 'o', pos: 0 },
    { re: /^aceptar$/i, key: 'a', pos: 0 },
  ];

  function matchFooterRule(norm) {
    for (var i = 0; i < FOOTER_LABEL_RULES.length; i++) {
      var rule = FOOTER_LABEL_RULES[i];
      if (rule.re.test(norm)) return rule;
    }
    return null;
  }

  function indexOfInsensitiveKeyChar(plain, keyLower) {
    if (!plain || !keyLower) return 0;
    var want = keyLower.slice(0, 1).toLowerCase();
    var lower = plain.toLowerCase();
    var idx = lower.indexOf(want);
    return idx >= 0 ? idx : 0;
  }

  function firstAlnumPair(plain) {
    for (var i = 0; i < plain.length; i++) {
      var c = plain.charAt(i);
      if (/[a-zA-Z0-9]/.test(c)) {
        return { key: c.toLowerCase(), pos: i };
      }
    }
    return { key: 'a', pos: 0 };
  }

  function findFreeKeyPair(plain, used) {
    for (var i = 0; i < plain.length; i++) {
      var c = plain.charAt(i);
      if (!/[a-zA-Z0-9]/.test(c)) continue;
      var k = c.toLowerCase();
      if (!used[k]) return { key: k, pos: i };
    }
    return null;
  }

  function escapeHtmlModal(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function buildFooterAccentHtml(plain, pos) {
    var inner;
    if (pos < 0 || pos >= plain.length) {
      inner = escapeHtmlModal(plain);
    } else {
      var ch = plain.charAt(pos);
      inner =
        escapeHtmlModal(plain.slice(0, pos)) +
        '<span class="acc-k">' +
        escapeHtmlModal(ch) +
        '</span>' +
        escapeHtmlModal(plain.slice(pos + 1));
    }
    return '<span class="footer-acc-label">' + inner + '</span>';
  }

  /**
   * Pies del modal: misma lista de botones para subrayado y para Alt+letra.
   * Incluso disabled (p. ej. Actualizar antes de cambiar algo): el mapa guarda ref;
   * el clic real solo ocurre cuando el botón está habilitado.
   */
  function footerButtonVisibleInFooter(btn) {
    if (!btn || btn.nodeType !== 1) return false;
    if (btn.getAttribute('aria-hidden') === 'true') return false;
    var s = window.getComputedStyle(btn);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (parseFloat(s.opacity || '1') === 0) return false;
    var rects = btn.getClientRects();
    if (!rects || rects.length === 0) return false;
    return true;
  }

  function computeFooterShortcutPlan(footer) {
    var buttons = Array.prototype.slice.call(
      footer.querySelectorAll('button, input[type="submit"]')
    );
    buttons = buttons.filter(footerButtonVisibleInFooter);
    if (buttons.length === 0) return [];

    var used = Object.create(null);
    var plan = [];

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var plain = (btn.textContent || '').trim();
      if (!plain) continue;
      var norm = normalizeFooterLabel(plain);
      var rule = matchFooterRule(norm);
      var key;
      var pos;

      if (rule) {
        key = rule.key;
        if (typeof rule.pos === 'number') {
          pos = rule.pos;
        } else {
          pos = indexOfInsensitiveKeyChar(plain, key);
        }
        if (pos < 0 || pos >= plain.length) {
          pos = indexOfInsensitiveKeyChar(plain, key);
        }
      } else {
        var pair = firstAlnumPair(plain);
        key = pair.key;
        pos = pair.pos;
      }

      if (used[key]) {
        var free = findFreeKeyPair(plain, used);
        if (free) {
          key = free.key;
          pos = free.pos;
        }
      }

      if (used[key]) continue;
      used[key] = true;
      plan.push({ btn: btn, key: key, pos: pos, plain: plain });
    }

    return plan;
  }

  function applyFooterAccentPlan(plan) {
    for (var i = 0; i < plan.length; i++) {
      var p = plan[i];
      var sig = p.plain + '|' + p.pos;
      /** Si otro script hizo textContent=... se borra el HTML pero el dataset sigue: hay que repintar. */
      var markupOk = p.btn.querySelector && p.btn.querySelector('.footer-acc-label');
      if (p.btn.dataset.footerAccSig === sig && markupOk) continue;
      p.btn.dataset.footerAccSig = sig;
      p.btn.innerHTML = buildFooterAccentHtml(p.plain, p.pos);
      p.btn.setAttribute('aria-keyshortcuts', 'Alt+' + p.key.toUpperCase());
    }
  }

  var footerDecorateTimer = null;
  function scheduleFooterAccents() {
    clearTimeout(footerDecorateTimer);
    footerDecorateTimer = setTimeout(function () {
      decorateVisibleModalFooters();
    }, 80);
  }

  function getTopVisibleModalForShortcuts() {
    var nodes = document.querySelectorAll(MODAL_ROOT);
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      if (!isModalVisible(nodes[i])) continue;
      if (nodes[i].classList.contains('modal-confirmacion-overlay')) continue;
      list.push(nodes[i]);
    }
    if (list.length === 0) return null;
    list.sort(function (a, b) {
      var za = Number(window.getComputedStyle(a).zIndex) || 0;
      var zb = Number(window.getComputedStyle(b).zIndex) || 0;
      return zb - za;
    });
    return list[0];
  }

  function decorateVisibleModalFooters() {
    if (toastConfirmOverlayActive()) return;
    var modal = getTopVisibleModalForShortcuts();
    if (!modal) return;
    var footers = modal.querySelectorAll(FOOTER_SELECTOR);
    for (var f = 0; f < footers.length; f++) {
      var plan = computeFooterShortcutPlan(footers[f]);
      applyFooterAccentPlan(plan);
    }
  }

  function getFooterShortcutMapForModal(modal) {
    var map = Object.create(null);
    if (!modal) return map;
    var footers = modal.querySelectorAll(FOOTER_SELECTOR);
    for (var f = 0; f < footers.length; f++) {
      var plan = computeFooterShortcutPlan(footers[f]);
      for (var i = 0; i < plan.length; i++) {
        map[plan[i].key] = plan[i].btn;
      }
    }
    return map;
  }

  function getCharFromAltFooterEvent(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return null;
    if (e.key && e.key.length === 1) {
      return e.key.toLowerCase();
    }
    if (e.code && e.code.indexOf('Key') === 0) {
      return e.code.slice(3).toLowerCase();
    }
    return null;
  }

  function onFooterAltShortcuts(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat || e.defaultPrevented) return;
    if (toastConfirmOverlayActive()) return;

    var ch = getCharFromAltFooterEvent(e);
    if (!ch) return;

    var modal = getTopVisibleModalForShortcuts();
    if (!modal) return;

    var map = getFooterShortcutMapForModal(modal);
    var btn = map[ch];
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    if (btn.disabled || btn.classList.contains('disabled')) {
      return;
    }
    btn.click();
  }

  function applyEmbeddedPageInitialFocus(force) {
    if (!document.body.classList.contains('window-embedded')) return false;
    var pageRoot = document.querySelector('.embedded-page');
    if (!pageRoot) return false;
    if (!force) {
      var ae = document.activeElement;
      if (ae && ae !== document.body && pageRoot.contains(ae)) {
        return true;
      }
    }
    var selectors = [
      '#searchInput',
      '#buscar',
      '#buscadorHistorial',
      '[data-window-autofocus]',
    ];
    var target = null;
    for (var s = 0; s < selectors.length; s++) {
      var el = pageRoot.querySelector(selectors[s]);
      if (el && isFocusableElement(el)) {
        target = el;
        break;
      }
    }
    if (!target) {
      var fb = pageRoot.querySelector(
        'input.input-buscar:not([disabled]), input[type="search"]:not([disabled])'
      );
      if (fb && isFocusableElement(fb)) target = fb;
    }
    if (target) {
      target.focus();
      return true;
    }
    return false;
  }

  function tryEmbeddedPageInitialFocus() {
    applyEmbeddedPageInitialFocus(false);
  }

  window.__applyEmbeddedInitialFocus = applyEmbeddedPageInitialFocus;

  function tryInitialFocus(modal) {
    if (!isModalVisible(modal)) return;
    setTimeout(function () {
      if (!isModalVisible(modal)) return;
      scheduleFooterAccents();
      if (modal.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }
      var sel = modal.getAttribute('data-modal-focus');
      var target = sel ? modal.querySelector(sel) : null;
      if (target && isFocusableElement(target)) {
        target.focus();
        return;
      }
      var first = getFocusable(modal)[0];
      if (first) first.focus();
    }, FOCUS_DELAY_MS);
  }

  function onMutations(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList' && m.addedNodes) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (node.nodeType !== 1) continue;
          if (node.matches && node.matches(MODAL_ROOT)) {
            if (isModalVisible(node)) tryInitialFocus(node);
          }
          if (node.querySelectorAll) {
            var inner = node.querySelectorAll(MODAL_ROOT);
            for (var k = 0; k < inner.length; k++) {
              if (isModalVisible(inner[k])) tryInitialFocus(inner[k]);
            }
          }
        }
      }
      if (m.type === 'attributes' && m.target && m.target.nodeType === 1) {
        if (m.target.matches && m.target.matches(MODAL_ROOT)) {
          if (isModalVisible(m.target)) tryInitialFocus(m.target);
        }
      }
    }
    scheduleFooterAccents();
  }

  document.addEventListener('keydown', onDocumentKeydown, true);

  function scheduleEmbeddedInitialFocus() {
    setTimeout(tryEmbeddedPageInitialFocus, FOCUS_DELAY_MS);
  }

  if (document.body && document.body.classList.contains('window-embedded')) {
    scheduleEmbeddedInitialFocus();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body.classList.contains('window-embedded')) {
        scheduleEmbeddedInitialFocus();
      }
    });
  }

  function startObserver() {
    if (!document.body) return;
    var obs = new MutationObserver(onMutations);
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden'],
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver);
  }

  /** Desde facturas.js u otros tras asignar textContent a botones del pie. */
  window.__scheduleModalFooterAccents = scheduleFooterAccents;
})();

/**
 * Atajos de barra de herramientas: Alt + letra (p. ej. Alt+A = Añadir).
 * Requiere data-toolbar-key en el botón/enlace. No actúa con foco en
 * campos de texto, ni mientras un modal visible tiene el foco.
 */
(function () {
  'use strict';

  if (window.__toolbarAccesskeysInit) {
    return;
  }
  window.__toolbarAccesskeysInit = true;

  function isModalBlocking() {
    var list = document.querySelectorAll(
      '.modal, .modal-overlay, .modal-antiguo, .modal-confirmacion-overlay'
    );
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.classList.contains('modal-oculto')) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      if (el.classList.contains('modal-confirmacion-overlay') && !el.classList.contains('activo')) {
        continue;
      }
      var s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (parseFloat(s.opacity || '1') === 0) continue;
      return true;
    }
    return false;
  }

  function isTypingContext(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      var t = (el.type || 'text').toLowerCase();
      if (t === 'button' || t === 'submit' || t === 'reset' || t === 'checkbox' || t === 'radio' || t === 'file') {
        return false;
      }
      return true;
    }
    if (el.isContentEditable) return true;
    return false;
  }

  function getCharFromEvent(e) {
    if (e.key && e.key.length === 1) {
      return e.key.toLowerCase();
    }
    if (e.code && e.code.indexOf('Key') === 0) {
      return e.code.slice(3).toLowerCase();
    }
    if (e.code && e.code.indexOf('Digit') === 0) {
      return e.code.slice(5);
    }
    return null;
  }

  function triggerToolbarElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.tagName === 'BUTTON' && el.disabled) return false;
    el.click();
    return true;
  }

  document.addEventListener(
    'keydown',
    function (e) {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.repeat) return;
      if (e.defaultPrevented) return;

      var ch = getCharFromEvent(e);
      if (!ch) return;
      if (isTypingContext(document.activeElement)) return;
      if (isModalBlocking()) return;

      var el = document.querySelector('[data-toolbar-key="' + ch + '"]');
      if (!el) return;
      if (!document.body.contains(el)) return;

      e.preventDefault();
      e.stopPropagation();
      triggerToolbarElement(el);
    },
    true
  );
})();

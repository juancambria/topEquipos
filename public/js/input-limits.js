(() => {
  'use strict';

  if (window.__inputLimitsLoaded) return;
  window.__inputLimitsLoaded = true;

  const textRules = [
    { match: (el) => el.name === 'marca', max: 15 },
    { match: (el) => el.name === 'nombreTipo', max: 20 },
    { match: (el) => el.name === 'modelo', max: 20 },
    { match: (el) => el.name === 'proveedor', max: 40 },
    { match: (el) => el.name === 'mail', max: 50 },
    { match: (el) => el.name === 'direccion', max: 30 },
    { match: (el) => el.name === 'ciudad', max: 30 },
    { match: (el) => el.name === 'provincia', max: 20 },
    { match: (el) => el.name === 'codigo_postal', max: 10 },
    { match: (el) => el.name === 'nombre', max: 25 },
    { match: (el) => el.name === 'telefono', max: 15 },
    { match: (el) => el.name === 'cargo', max: 20 },
    { match: (el) => el.name === 'serie', max: 25 },
    { match: (el) => el.name === 'numero', max: 20 },
    { match: (el) => el.name === 'obra' || /\[obra\]$/.test(el.name || ''), max: 15 },
    { match: (el) => el.name === 'observacion', max: 250 },
    { match: (el) => el.name === 'descripcion_contenido', max: 250 },
    { match: (el) => /\[concepto\]$/.test(el.name || ''), max: 150 },
  ];

  const digitRules = [
    { match: (el) => el.name === 'idOrdenDeCompra', max: 10 },
    { match: (el) => el.name === 'idPresupuesto', max: 10 },
    { match: (el) => el.id === 'equipoGarantiaDias', max: 3 },
    { match: (el) => el.id === 'equipoFacturaGarantiaDias', max: 3 },
  ];

  const priceRules = [
    { match: (el) => el.name === 'precio' || el.id === 'equipoFacturaPrecio', maxLength: 13 },
  ];

  function setMaxLength(el, max) {
    if (!max || !('maxLength' in el)) return;
    el.maxLength = max;
  }

  function applyTextRules(el) {
    const rule = textRules.find(({ match }) => match(el));
    if (!rule) return;

    setMaxLength(el, rule.max);

    if (el.name === 'telefono') {
      el.setAttribute('inputmode', 'tel');
      el.setAttribute('autocomplete', 'off');
    }
  }

  function applyDigitRules(el) {
    const rule = digitRules.find(({ match }) => match(el));
    if (!rule) return;

    el.dataset.maxDigits = String(rule.max);
    el.setAttribute('inputmode', 'numeric');
  }

  function applyPriceRules(el) {
    const rule = priceRules.find(({ match }) => match(el));
    if (!rule) return;

    setMaxLength(el, rule.maxLength);
    el.setAttribute('inputmode', 'decimal');
    el.setAttribute('step', '0.01');
    if (!el.hasAttribute('min')) el.min = 0;
    if (!el.hasAttribute('max')) el.max = 999999999.99;
  }

  function applyElementRules(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

    applyTextRules(el);
    applyDigitRules(el);
    applyPriceRules(el);
  }

  function sanitizeElementValue(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

    if (el.name === 'telefono') {
      const cleaned = (el.value || '').replace(/[^0-9+\-().\s]/g, '').slice(0, el.maxLength || 30);
      if (cleaned !== el.value) el.value = cleaned;
    }

    if (el.dataset.maxDigits) {
      const maxDigits = Number(el.dataset.maxDigits) || 0;
      const cleaned = (el.value || '').replace(/\D+/g, '').slice(0, maxDigits);
      if (cleaned !== el.value) el.value = cleaned;
    }

    // Sanitize price fields
    const isPriceField = priceRules.some(({ match }) => match(el));
    if (isPriceField) {
      let cleaned = (el.value || '').replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[0]) {
        parts[0] = parts[0].slice(0, 10);
      }
      if (parts[1]) {
        parts[1] = parts[1].slice(0, 2);
      }
      cleaned = parts.join('.');
      if (cleaned !== el.value) el.value = cleaned;
    }

    if (el.maxLength > 0 && typeof el.value === 'string' && el.value.length > el.maxLength) {
      el.value = el.value.slice(0, el.maxLength);
    }
  }

  function applyDefaultRules(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

    if (el instanceof HTMLTextAreaElement) {
      if (!el.maxLength || el.maxLength === -1) el.maxLength = 1000;
      return;
    }

    const textTypes = ['text', 'email', 'tel', 'search', 'url', 'password'];
    if (textTypes.includes(el.type)) {
      if (!el.maxLength || el.maxLength === -1) el.maxLength = 255;
    }

    if (el.type === 'number') {
      if (!el.hasAttribute('max')) el.max = 999999999;
      if (!el.hasAttribute('min')) el.min = 0;
      if (!el.getAttribute('step')) el.step = '1';
    }
  }

  function applyAll(root = document) {
    root.querySelectorAll('input, textarea').forEach((el) => {
      applyDefaultRules(el);
      applyElementRules(el);
    });
  }

  function isControlKey(event) {
    return event.ctrlKey || event.metaKey || event.altKey || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Enter', 'Home', 'End'].includes(event.key);
  }

  document.addEventListener('keydown', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    if (isControlKey(event)) return;
    if (!el.maxLength || el.maxLength < 0) return;

    const hasSelection = el.selectionStart != null && el.selectionEnd != null && el.selectionEnd > el.selectionStart;
    if (hasSelection) return;

    if (String(el.value || '').length >= el.maxLength) {
      event.preventDefault();
    }
  });

  document.addEventListener('input', (event) => {
    sanitizeElementValue(event.target);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.('input, textarea')) applyElementRules(node);
        applyAll(node);
      });
    });
  });

  applyAll();
  observer.observe(document.body, { childList: true, subtree: true });
})();

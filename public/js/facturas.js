(() => {
  'use strict';

  if (window.__facturasScriptLoaded) return;
  window.__facturasScriptLoaded = true;

  const state = {
    equiposPendientes: [],
    indiceEquipoActual: 0,
    creandoEquipo: false,
    datosEquipoAnterior: null,
    renglonPendienteActualIndex: null,
    confirmFilaPendiente: null,
    selectedFacturaId: null,
    pdfsLocalesCola: [],
    pdfsLocalesUrls: [],
    pdfsServidorEnModal: [],
    facturaIdParaPdfsServidor: null,
    numeroFacturaParaPdfsServidor: null,
  };

  const FACTURA_MAX_PDFS = 5;
  const FACTURA_MAX_PDF_BYTES = 16 * 1024 * 1024;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const toast = (msg, type = 'info') => {
    if (typeof window.mostrarToast === 'function') window.mostrarToast(msg, type);
    else console.log(`[${type}] ${msg}`);
  };

  const csrfToken = () => CrudCommon.getCsrfToken();

  const toNum = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatMoney = (n) => (Number.isFinite(n) ? n : 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toDateSafe = (iso) => {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateAr = (iso) => {
    const d = toDateSafe(iso);
    return d ? d.toLocaleDateString('es-AR') : '—';
  };

  function formatBytesFacturaPdf(n) {
    const num = typeof n === 'number' ? n : parseInt(n, 10);
    if (!Number.isFinite(num) || num <= 0) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let v = num;
    let i = 0;
    while (v >= 1024 && i < u.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `(${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]})`;
  }

  function formatBytesFacturaPdfSinParentesis(n) {
    const s = formatBytesFacturaPdf(n);
    return s.replace(/^\(/, '').replace(/\)$/, '');
  }

  /** Último segmento de URL alineado con FacturaController::slugNombrePdfParaUrl (título de pestaña). */
  function slugNombrePdfParaUrlFactura(nombreOriginal, numeroFactura, idPdf) {
    const numRaw =
      numeroFactura != null && String(numeroFactura).trim() !== '' ? String(numeroFactura).trim() : '';
    const numSlug = numRaw !== '' ? numRaw.replace(/[^\w.-]+/gu, '-') : 'sin-numero';
    const fallback = `Factura-${numSlug}-${idPdf}.pdf`;
    if (!nombreOriginal || !/\.pdf$/i.test(String(nombreOriginal))) return fallback;
    let base = String(nombreOriginal)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    base = base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    if (base.length < 5 || !/\.pdf$/i.test(base)) return fallback;
    return base.slice(0, 120);
  }

  async function abrirVistaPreviaPdfDesdeArchivoLocal(file, anchor) {
    if (!file || !esPdfValidoArchivo(file)) {
      toast('Archivo PDF no válido', 'error');
      return;
    }
    if (anchor?.dataset?.pdfPreviewLoading === '1') return;

    const previewWin = window.open('about:blank', '_blank');
    if (!previewWin) {
      toast('Permita ventanas emergentes para ver el PDF', 'warning');
      return;
    }

    try {
      if (anchor) anchor.dataset.pdfPreviewLoading = '1';

      const fd = new FormData();
      fd.append('pdf', file, file.name || 'documento.pdf');
      const num = ($('#numero')?.value || '').trim();
      if (num) fd.append('numero_factura', num);

      /** Sin Accept: application/json para que extensiones del navegador no alteren el FormData */
      const r = await fetch('/facturas/pdfs/vista-previa', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: fd,
      });

      const rawText = await r.text();
      let data = null;
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch (_) {
          /* ignore */
        }
      }

      if (!r.ok) {
        const msg =
          (data && typeof data.message === 'string' && data.message) ||
          (Array.isArray(data?.errors?.pdf) && data.errors.pdf[0] ? String(data.errors.pdf[0]) : '') ||
          `Error ${r.status}`;
        throw new Error(msg);
      }

      if (!data?.url) throw new Error('Respuesta inválida del servidor');

      previewWin.location.href = data.url;
    } catch (e) {
      try {
        previewWin.close();
      } catch (_) {
        /* ignore */
      }
      toast(`No se pudo abrir la vista previa: ${e.message}`, 'error');
    } finally {
      if (anchor) delete anchor.dataset.pdfPreviewLoading;
    }
  }

  function renderAdjuntosExistentesFactura(pdfs, facturaId, numeroFactura) {
    const idNum = Number(facturaId);
    if (!Number.isFinite(idNum) || !Array.isArray(pdfs) || pdfs.length === 0) {
      state.pdfsServidorEnModal = [];
      state.facturaIdParaPdfsServidor = null;
      state.numeroFacturaParaPdfsServidor = null;
    } else {
      state.pdfsServidorEnModal = pdfs.map((p) => ({
        idFacturaPdf: p.idFacturaPdf,
        nombre_original: p.nombre_original,
        tamano_bytes: p.tamano_bytes,
      }));
      state.facturaIdParaPdfsServidor = idNum;
      state.numeroFacturaParaPdfsServidor =
        numeroFactura != null && String(numeroFactura).trim() !== ''
          ? String(numeroFactura).trim()
          : null;
    }
    pintarMosaicoPdfsFacturaModal();
  }

  async function eliminarAdjuntoPdfFactura(facturaId, pdfId) {
    const ok = await confirmarAccion({
      titulo: 'Quitar PDF',
      texto: '¿Eliminar este archivo adjunto de la factura?',
      textoAceptar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    });

    if (!ok) return;

    try {
      const r = await fetch(`/facturas/${facturaId}/pdfs/${pdfId}`, {
        method: 'DELETE',
        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }),
      });
      const data = r.headers.get('content-type')?.includes('application/json') ? await r.json() : null;
      if (!r.ok && !data?.success) {
        throw new Error(`Error ${r.status}`);
      }

      toast('Adjunto eliminado', 'success');
      state.pdfsServidorEnModal = state.pdfsServidorEnModal.filter(
        (x) => Number(x.idFacturaPdf) !== Number(pdfId),
      );
      pintarMosaicoPdfsFacturaModal();
    } catch (e) {
      toast(`No se pudo eliminar: ${e.message}`, 'error');
    }
  }

  function countPdfAdjuntosServidor() {
    return state.pdfsServidorEnModal.length;
  }

  function cupoPdfsRestante() {
    return Math.max(0, FACTURA_MAX_PDFS - countPdfAdjuntosServidor() - state.pdfsLocalesCola.length);
  }

  function esPdfValidoArchivo(f) {
    if (!f || !f.size) return false;
    if (f.size > FACTURA_MAX_PDF_BYTES) return false;
    return f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  }

  function syncInputFilesDesdeColaFactura() {
    const input = document.getElementById('factura_pdfs');
    if (!input) return;
    const dt = new DataTransfer();
    state.pdfsLocalesCola.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }

  function vaciarColaPdfsLocalesSinRepintado() {
    state.pdfsLocalesUrls.forEach((u) => URL.revokeObjectURL(u));
    state.pdfsLocalesCola = [];
    state.pdfsLocalesUrls = [];
    syncInputFilesDesdeColaFactura();
  }

  function crearTilePdfServidorFactura(p, idFactura) {
    const wrap = document.createElement('div');
    wrap.className = 'factura-pdf-tile-wrap';

    const a = document.createElement('a');
    a.className = 'factura-pdf-tile';
    const slug = slugNombrePdfParaUrlFactura(
      p.nombre_original,
      state.numeroFacturaParaPdfsServidor,
      p.idFacturaPdf,
    );
    a.href = `/facturas/${idFactura}/pdfs/${p.idFacturaPdf}/${encodeURIComponent(slug)}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = `Abrir: ${p.nombre_original || 'PDF'}`;

    const badge = document.createElement('span');
    badge.className = 'factura-pdf-tile-badge';
    badge.textContent = 'Guardado';

    const icon = document.createElement('span');
    icon.className = 'factura-pdf-tile-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📄';

    const name = document.createElement('span');
    name.className = 'factura-pdf-tile-name';
    name.textContent = p.nombre_original || 'PDF';

    const meta = document.createElement('span');
    meta.className = 'factura-pdf-tile-meta';
    meta.textContent = formatBytesFacturaPdfSinParentesis(p.tamano_bytes);

    a.appendChild(badge);
    a.appendChild(icon);
    a.appendChild(name);
    a.appendChild(meta);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'factura-pdf-tile-remove';
    btn.textContent = '×';
    btn.setAttribute('aria-label', 'Quitar PDF');
    btn.title = 'Quitar';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      eliminarAdjuntoPdfFactura(idFactura, p.idFacturaPdf);
    });

    wrap.appendChild(a);
    wrap.appendChild(btn);
    return wrap;
  }

  function crearTilePdfLocalFactura(file, idx) {
    const wrap = document.createElement('div');
    wrap.className = 'factura-pdf-tile-wrap';

    const a = document.createElement('a');
    a.className = 'factura-pdf-tile';
    a.href = '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = 'Abrir en otra pestaña';
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      void abrirVistaPreviaPdfDesdeArchivoLocal(file, a);
    });

    const badge = document.createElement('span');
    badge.className = 'factura-pdf-tile-badge factura-pdf-tile-badge--nuevo';
    badge.textContent = 'Nuevo';

    const icon = document.createElement('span');
    icon.className = 'factura-pdf-tile-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📄';

    const name = document.createElement('span');
    name.className = 'factura-pdf-tile-name';
    name.textContent = file.name;

    const meta = document.createElement('span');
    meta.className = 'factura-pdf-tile-meta';
    meta.textContent = formatBytesFacturaPdfSinParentesis(file.size);

    a.appendChild(badge);
    a.appendChild(icon);
    a.appendChild(name);
    a.appendChild(meta);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'factura-pdf-tile-remove';
    btn.textContent = '×';
    btn.setAttribute('aria-label', 'Quitar de la selección');
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      quitarPdfLocalFactura(idx);
    });

    wrap.appendChild(a);
    wrap.appendChild(btn);
    return wrap;
  }

  function crearTileAnadirPdfFactura() {
    const lab = document.createElement('label');
    lab.className = 'factura-pdf-tile factura-pdf-tile--add';
    lab.setAttribute('for', 'factura_pdfs');
    lab.tabIndex = 0;
    lab.innerHTML = `
      <span class="factura-pdf-tile-add-plus">+</span>
      <span class="factura-pdf-tile-add-txt">Añadir PDF</span>`;
    return lab;
  }

  function pintarMosaicoPdfsFacturaModal() {
    const grid = document.getElementById('facturaPdfTilesMerged');
    const addHit = document.getElementById('facturaPdfZoneAddHit');
    const zoneBody = document.getElementById('facturaPdfZoneBody');
    if (!grid || !addHit) return;

    grid.innerHTML = '';

    const idFactura = state.facturaIdParaPdfsServidor;
    if (idFactura != null && idFactura !== '') {
      state.pdfsServidorEnModal.forEach((p) => {
        grid.appendChild(crearTilePdfServidorFactura(p, idFactura));
      });
    }

    state.pdfsLocalesCola.forEach((file, idx) => {
      grid.appendChild(crearTilePdfLocalFactura(file, idx));
    });

    const total = state.pdfsServidorEnModal.length + state.pdfsLocalesCola.length;
    const cupo = cupoPdfsRestante();

    if (total === 0) {
      addHit.hidden = false;
      zoneBody?.classList.add('factura-pdf-zone-body--empty');
    } else {
      addHit.hidden = true;
      zoneBody?.classList.remove('factura-pdf-zone-body--empty');
      if (cupo > 0) {
        grid.appendChild(crearTileAnadirPdfFactura());
      }
    }

    actualizarCapacidadTextoFacturaPdfs();
  }

  function limpiarColaPdfsLocalesFactura() {
    vaciarColaPdfsLocalesSinRepintado();
    pintarMosaicoPdfsFacturaModal();
  }

  function agregarPdfsALaColaFactura(fileListOrArray) {
    const arr = Array.from(fileListOrArray || []);
    const invalidosTam = arr.filter((f) => f && f.size > FACTURA_MAX_PDF_BYTES);
    if (invalidosTam.length) toast('Uno o más archivos superan 16 MB.', 'warning');

    const validos = arr.filter(esPdfValidoArchivo);
    const noPdf = arr.filter((f) => f && f.size > 0 && f.size <= FACTURA_MAX_PDF_BYTES && !esPdfValidoArchivo(f));
    if (noPdf.length) toast('Solo se admiten archivos PDF.', 'warning');

    let cupo = cupoPdfsRestante();
    if (cupo <= 0) {
      if (validos.length) toast(`Ya alcanzaste el máximo de ${FACTURA_MAX_PDFS} PDF por factura.`, 'warning');
      return;
    }

    if (validos.length > cupo) {
      toast(`Solo se agregaron ${cupo} archivo(s): el máximo es ${FACTURA_MAX_PDFS} PDF por factura (total).`, 'warning');
    }

    validos.slice(0, cupo).forEach((f) => {
      state.pdfsLocalesCola.push(f);
      state.pdfsLocalesUrls.push(URL.createObjectURL(f));
    });

    syncInputFilesDesdeColaFactura();
    pintarMosaicoPdfsFacturaModal();
  }

  function quitarPdfLocalFactura(idx) {
    const u = state.pdfsLocalesUrls[idx];
    if (u) URL.revokeObjectURL(u);
    state.pdfsLocalesCola.splice(idx, 1);
    state.pdfsLocalesUrls.splice(idx, 1);
    syncInputFilesDesdeColaFactura();
    pintarMosaicoPdfsFacturaModal();
  }

  function actualizarCapacidadTextoFacturaPdfs() {
    const el = document.getElementById('facturaPdfsCapacidadTexto');
    const zone = document.getElementById('facturaPdfDropzone');
    const input = document.getElementById('factura_pdfs');

    const usados = countPdfAdjuntosServidor() + state.pdfsLocalesCola.length;
    if (el) {
      el.textContent = `${usados} / ${FACTURA_MAX_PDFS} PDF · hasta 16 MB c/u`;
    }

    const lleno = cupoPdfsRestante() <= 0;
    if (zone) {
      zone.classList.toggle('factura-pdf-zone--disabled', lleno);
    }
    if (input) {
      input.disabled = lleno;
    }
  }

  function initFacturaPdfZona() {
    const input = document.getElementById('factura_pdfs');
    const zone = document.getElementById('facturaPdfDropzone');
    if (!input || !zone || zone.dataset.facturasPdfBound === '1') return;
    zone.dataset.facturasPdfBound = '1';

    input.addEventListener('change', () => {
      if (input.files?.length) {
        agregarPdfsALaColaFactura(input.files);
      }
    });

    ['dragenter', 'dragover'].forEach((ev) => {
      zone.addEventListener(
        ev,
        (e) => {
          if (cupoPdfsRestante() <= 0) return;
          e.preventDefault();
          e.stopPropagation();
          zone.classList.add('factura-pdf-zone--active');
        },
        true
      );
    });

    ['dragleave'].forEach((ev) => {
      zone.addEventListener(
        ev,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.remove('factura-pdf-zone--active');
        },
        true
      );
    });

    zone.addEventListener(
      'drop',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('factura-pdf-zone--active');
        if (cupoPdfsRestante() <= 0) {
          toast(`Máximo ${FACTURA_MAX_PDFS} PDF por factura.`, 'warning');
          return;
        }
        const files = e.dataTransfer?.files;
        if (files?.length) agregarPdfsALaColaFactura(files);
      },
      true
    );

    actualizarCapacidadTextoFacturaPdfs();
  }

  const addDaysToISO = (baseIso, days) => {
    const d = toDateSafe(baseIso);
    if (!d) return '';
    d.setDate(d.getDate() + Math.max(0, Math.trunc(days)));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const diffDaysIso = (baseIso, targetIso) => {
    const a = toDateSafe(baseIso);
    const b = toDateSafe(targetIso);
    if (!a || !b) return 0;
    return Math.max(0, Math.round((b - a) / 86400000));
  };

  const getAddRowButton = () => $('#btnAgregarRenglon') || $('.section-header button[onclick*="agregarDetalleFila"]');

  function updateGarantiaFacturaFromDias() {
    const diasInput = document.getElementById('equipoFacturaGarantiaDias');
    const baseInput = document.getElementById('equipoFacturaGarantiaBase');
    const vtoInput = document.getElementById('equipoFacturaVtoGarantia');
    const preview = document.getElementById('equipoFacturaGarantiaPreview');
    if (!diasInput || !baseInput || !vtoInput || !preview) return;

    if (!String(baseInput.value || '').trim()) {
      baseInput.value = document.getElementById('fecha')?.value || new Date().toISOString().slice(0, 10);
    }

    const raw = String(diasInput.value || '').replace(/\D/g, '').slice(0, 3);
    const dias = raw === '' ? 0 : parseInt(raw, 10);
    diasInput.value = raw;
    const vto = addDaysToISO(baseInput.value, dias);
    vtoInput.value = vto;
    preview.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(vence: ' + formatDateAr(vto) + ')';
  }

function setGarantiaFactura(baseIso, vtoIso = '') {
    const baseInput = document.getElementById('equipoFacturaGarantiaBase');
    const diasInput = document.getElementById('equipoFacturaGarantiaDias');
    if (!baseInput || !diasInput) return;

    baseInput.value = baseIso || new Date().toISOString().slice(0, 10);
    if (vtoIso) {
      const dias = diffDaysIso(baseInput.value, vtoIso);
      diasInput.value = String(dias);
    } else {
      diasInput.value = '';
    }
    updateGarantiaFacturaFromDias();
  }


  function initGarantiaFactura() {
    const diasInput = document.getElementById('equipoFacturaGarantiaDias');
    if (!diasInput || diasInput.dataset.facturasBound === '1') return;
    diasInput.dataset.facturasBound = '1';
    diasInput.addEventListener('input', updateGarantiaFacturaFromDias);
    diasInput.addEventListener('change', updateGarantiaFacturaFromDias);
    const fechaFactura = document.getElementById('fecha')?.value || new Date().toISOString().slice(0, 10);
    setGarantiaFactura(fechaFactura, document.getElementById('equipoFacturaVtoGarantia')?.value || '');
  }

  const setModalVisible = (id, visible, asOverlay = false) => {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (asOverlay) {
      modal.classList.toggle('show', visible);
      modal.classList.toggle('modal-oculto', !visible);
      modal.style.display = visible ? 'flex' : 'none';
    } else {
      modal.classList.toggle('show', visible);
      modal.style.display = visible ? 'block' : 'none';
    }

    modal.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  function ensureConfirmModal() {
    let modal = document.getElementById('modalConfirmFacturasAccion');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modalConfirmFacturasAccion';
    modal.className = 'modal-overlay';
    modal.setAttribute('data-modal-focus', '#confirmAccionAceptar');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('data-static', 'true');
    modal.style.zIndex = '130000';
    modal.innerHTML = `
      <div class="modal-sector modal-confirm-accion">
        <div class="modal-sector-header">
          <h2 id="confirmAccionTitulo">Confirmación</h2>
          <button type="button" class="modal-cerrar" id="confirmAccionCerrar" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
          <p id="confirmAccionTexto" style="margin: 0; white-space: pre-line;"></p>
        </div>
        <div class="modal-sector-footer">
          <button type="button" class="btn btn-secundario" id="confirmAccionCancelar">Cancelar</button>
          <button type="button" class="btn btn-danger" id="confirmAccionAceptar">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function ensureFacturaDetalleModal() {
    let modal = document.getElementById('modalVerFacturaDynamic');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modalVerFacturaDynamic';
    modal.className = 'modal-overlay';
    modal.setAttribute('data-modal-focus', '#facturaDetalleCerrarFooter');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('data-static', 'true');
    modal.innerHTML = `
      <div class="modal-sector" style="max-width: 1100px; width: min(1100px, 96vw); max-height: 92vh;">
        <div class="modal-sector-header">
          <h2>Detalles de Factura</h2>
          <button type="button" class="modal-cerrar" id="facturaDetalleCerrar" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <div class="modal-sector-body" id="facturaDetalleContentDynamic" style="overflow:auto;"></div>
        <div class="modal-sector-footer">
          <button type="button" class="btn btn-secundario" id="facturaDetalleCerrarFooter">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => forceCerrarModal('modalVerFacturaDynamic');
    modal.querySelector('#facturaDetalleCerrar')?.addEventListener('click', close);
    modal.querySelector('#facturaDetalleCerrarFooter')?.addEventListener('click', close);

    return modal;
  }

  function confirmarAccion({
    titulo = 'Confirmación',
    texto = 'Estás por comenzar a crear una nueva factura. ¿Desea continuar?',
    textoAceptar = 'Confirmar',
    textoCancelar = 'Cancelar',
    peligro = true,
  } = {}) {
    const modal = ensureConfirmModal();
    if (!modal) return Promise.resolve(false);

    const titleEl = document.getElementById('confirmAccionTitulo');
    const textEl = document.getElementById('confirmAccionTexto');
    const btnOk = document.getElementById('confirmAccionAceptar');
    const btnCancel = document.getElementById('confirmAccionCancelar');
    const btnClose = document.getElementById('confirmAccionCerrar');

    if (titleEl) titleEl.textContent = titulo;
    if (textEl) textEl.textContent = texto;
    if (btnOk) {
      btnOk.textContent = textoAceptar;
      btnOk.classList.toggle('btn-danger', !!peligro);
      btnOk.classList.toggle('btn-primario', !peligro);
    }
    if (btnCancel) btnCancel.textContent = textoCancelar;

    return new Promise((resolve) => {
      let done = false;
      const finish = (result) => {
        if (done) return;
        done = true;
        setModalVisible('modalConfirmFacturasAccion', false, true);
        document.removeEventListener('keydown', onKeyDown);
        btnOk?.removeEventListener('click', onConfirm);
        btnCancel?.removeEventListener('click', onCancel);
        btnClose?.removeEventListener('click', onCancel);
        resolve(result);
      };
      const onConfirm = () => finish(true);
      const onCancel = () => finish(false);
      const onKeyDown = () => {};

      btnOk?.addEventListener('click', onConfirm, { once: true });
      btnCancel?.addEventListener('click', onCancel, { once: true });
      btnClose?.addEventListener('click', onCancel, { once: true });
      document.addEventListener('keydown', onKeyDown);
      setModalVisible('modalConfirmFacturasAccion', true, true);
      if (typeof window.__scheduleModalFooterAccents === 'function') {
        window.__scheduleModalFooterAccents();
      }
      setTimeout(() => btnOk?.focus(), 30);
    });
  }

  function obtenerRutaFactura(tipo) {
    const modal = document.getElementById('modalFactura');
    return modal?.getAttribute(`data-route-${tipo}`) || `/facturas/${tipo}`;
  }

  function obtenerRutaEquiposCrear() {
    const modal = document.getElementById('modalEquipoFactura');
    return modal?.getAttribute('data-route-equipos-crear') || '/equipos/crear';
  }

  function obtenerRutaEquiposEliminarLote() {
    return '/equipos/eliminar-lote';
  }

  function forceCerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  async function solicitarCierreModal(modalId, texto = 'Estás por cerrar la creación de una nueva factura. ¿Desea continuar?') {
    const confirmado = await confirmarAccion({
      titulo: 'Cerrar modal',
      texto,
      textoAceptar: 'Sí, cerrar',
      textoCancelar: 'Seguir editando',
      peligro: false,
    });
    if (!confirmado) return false;
    forceCerrarModal(modalId);
    return true;
  }

  function cerrarModal(modalId) {
    return solicitarCierreModal(modalId);
  }

  function forceCerrarTodosLosModales() {
    ['modalFactura', 'modalVerFactura', 'modalVerFacturaDynamic', 'modalBajaFactura', 'modalProveedor', 'modalConfirmAltaEquiposFactura', 'modalConfirmFacturasAccion'].forEach((id) => {
      setModalVisible(id, false);
    });
    setModalVisible('modalEquipoFactura', false, true);
    const temporal = document.getElementById('modalEquipoTemporal');
    if (temporal) temporal.remove();
  }

  function cerrarTodosLosModales() {
    forceCerrarTodosLosModales();
  }

  function cerrarModalFactura() {
    return solicitarCierreModal('modalFactura');
  }

  function generarNumeroFactura() {
    const inputNumero = document.getElementById('numero');
    if (!inputNumero) return;

    fetch(obtenerRutaFactura('siguiente-numero'), {
      headers: CrudCommon.jsonHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        inputNumero.value = data.numero || '';
      })
      .catch(() => {
        const d = new Date();
        const fallback = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-00000001`;
        inputNumero.value = fallback;
      });
  }

  function formatearNumero(numero) {
    return formatMoney(toNum(numero));
  }

  function limitarLongitud(input, maxDigitos) {
    if (input && input.value.length > maxDigitos) input.value = input.value.slice(0, maxDigitos);
  }

  function validarCantidad(input) {
    if (!input) return;
    const v = input.value;
    if (!v || v === '.') return;
    const n = parseFloat(v);
    if (Number.isNaN(n) || n < 0) return;
    if (v.includes('.')) {
      const [, dec = ''] = v.split('.');
      if (dec.length > 1) input.value = v.slice(0, -1);
    }
    if (parseFloat(input.value) > 99.9) input.value = v.slice(0, -1);
  }

  function deOptionsByOperacion(operacion) {
    if (operacion === 'compra') {
      return ['Equipo', 'Herramienta', 'Material'];
    }
    if (operacion === 'mano_obra') {
      return ['Sucursal', 'Equipo'];
    }
    return [];
  }

  function cambiarOperacion(select) {
    const fila = select?.closest('tr');
    if (!fila) return;

    const deSelect = $('.input-de', fila);
    if (!deSelect) return;

    const opciones = deOptionsByOperacion(select.value);
    deSelect.innerHTML = '<option value="">--</option>' + opciones.map((o) => `<option value="${o}">${o}</option>`).join('');
    deSelect.disabled = opciones.length === 0;

    if (!opciones.includes(deSelect.value)) deSelect.value = '';
  }

  function calcularSubtotalFila(input) {
    const fila = input?.closest('tr');
    if (!fila) return;

    const cantidad = toNum($('.input-cantidad', fila)?.value);
    const precio = toNum($('.input-precio', fila)?.value);
    const bonif = toNum($('.input-bonif', fila)?.value);

    let subtotal = cantidad * precio;
    if (bonif > 0) subtotal -= subtotal * (bonif / 100);

    const subtotalInput = $('.input-subtotal', fila);
    const subtotalHidden = $('.input-subtotal-hidden', fila);

    if (subtotalInput) subtotalInput.value = formatearNumero(subtotal);
    if (subtotalHidden) subtotalHidden.value = subtotal.toFixed(4);

    recalcularTotales();
  }

  function resetearTotales() {
    const idsTexto = ['importeBonificacionDisplay', 'iva105Display', 'iva21Display', 'netoDisplay', 'totalDisplay'];
    const idsHidden = ['importeBonificacion'];

    idsTexto.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0,00';
    });

    idsHidden.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '0.0000';
    });
  }

  function recalcularTotales() {
    const filas = $$('#detallesBody tr.detalle-row');

    let subtotalGeneral = 0;
    let iva105 = 0;
    let iva21 = 0;

    filas.forEach((fila) => {
      const subtotal = toNum($('.input-subtotal-hidden', fila)?.value);
      const iva = toNum($('.input-iva', fila)?.value);

      subtotalGeneral += subtotal;
      if (Math.abs(iva - 10.5) < 0.01) iva105 += subtotal * 0.105;
      if (Math.abs(iva - 21) < 0.01) iva21 += subtotal * 0.21;
    });

    const porcentajeBonificacion = toNum(document.getElementById('porcentajeBonificacion')?.value);
    const importeBonif = subtotalGeneral * (porcentajeBonificacion / 100);
    const neto = subtotalGeneral - importeBonif;
    const total = neto + iva105 + iva21;

    const assignText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatearNumero(v);
    };

    const assignHidden = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v.toFixed(4);
    };

    assignText('importeBonificacionDisplay', importeBonif);
    assignText('iva105Display', iva105);
    assignText('iva21Display', iva21);
    assignText('netoDisplay', neto);
    assignText('totalDisplay', total);
    assignHidden('importeBonificacion', importeBonif);
  }

  function prepararCamposFacturaParaSubmit() {
    $$('#detallesBody tr.detalle-row [name]').forEach((el) => {
      if (el.disabled) {
        el.disabled = false;
        el.dataset.facturaTemporarilyEnabled = '1';
      }
    });
  }

  function sincronizarDetallesFacturaEnFormulario(form) {
    if (!form) return;

    form.querySelectorAll('.factura-detalle-mirror').forEach((el) => el.remove());

    $$('#detallesBody tr.detalle-row').forEach((fila, index) => {
      const campos = [
        ['operacion', $('.input-operacion', fila)?.value || ''],
        ['de', $('.input-de', fila)?.value || ''],
        ['cantidad', $('.input-cantidad', fila)?.value || ''],
        ['concepto', $('.input-concepto', fila)?.value || ''],
        ['precioUnitario', $('.input-precio', fila)?.value || ''],
        ['porcentajeIva', $('.input-iva', fila)?.value || ''],
        ['porcentajeDto', $('.input-bonif', fila)?.value || ''],
        ['obra', $('.input-obra', fila)?.value || ''],
        ['subtotal', $('.input-subtotal-hidden', fila)?.value || '0'],
      ];

      campos.forEach(([campo, valor]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = `detalles[${index}][${campo}]`;
        input.value = valor;
        input.className = 'factura-detalle-mirror';
        form.appendChild(input);
      });
    });
  }

  function verificarRenglonCompletoParaEquipos(inputs) {
    return (
      inputs.operacion?.value === 'compra' &&
      inputs.de?.value === 'Equipo' &&
      toNum(inputs.cantidad?.value) >= 1 &&
      toNum(inputs.precio?.value) > 0
    );
  }

  function rowIsPending(fila) {
    return fila?.dataset.pendiente === 'true';
  }

  function rowRequiresAlta(fila) {
    return fila?.dataset.requierealta === 'true';
  }

  function getAltaButton(fila) {
    return fila ? fila.querySelector('.btn-alta-equipo') : null;
  }

  function rowIsCompleted(fila) {
    return !!fila?.classList.contains('renglon-completado');
  }

  function bloquearRenglonCompletado(fila) {
    if (!fila || !rowIsCompleted(fila)) return;
    fila.classList.add('renglon-bloqueado');
    const bloquear = (el) => {
      if (!el) return;
      if (el.tagName === 'SELECT') {
        el.style.pointerEvents = 'none';
        el.tabIndex = -1;
        el.setAttribute('aria-disabled', 'true');
        return;
      }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.type === 'hidden') return;
        el.readOnly = true;
        el.setAttribute('aria-readonly', 'true');
      }
    };

    bloquear($('.input-operacion', fila));
    bloquear($('.input-de', fila));
    bloquear($('.input-cantidad', fila));

    const btnAlta = getAltaButton(fila);
    if (btnAlta) {
      btnAlta.disabled = true;
      btnAlta.classList.add('btn-alta-equipo-disabled');
      btnAlta.title = 'Renglón ya dado de alta';
      btnAlta.setAttribute('aria-disabled', 'true');
    }
  }

  function aplicarBloqueoRenglonesCompletados() {
    $$('#detallesBody tr.detalle-row.renglon-completado').forEach(bloquearRenglonCompletado);
  }

  function actualizarAccionAltaRenglon(fila) {
    const btn = getAltaButton(fila);
    if (!btn) return;
    const pendiente = rowIsPending(fila);
    const requiere = rowRequiresAlta(fila);
    const habilitado = pendiente || requiere;
    btn.disabled = !habilitado;
    btn.title = pendiente
      ? 'Continuar alta de equipos pendiente'
      : (requiere ? 'Dar de alta equipo' : 'Disponible cuando el renglón requiera alta');
    btn.classList.toggle('btn-alta-equipo-disabled', !habilitado);
  }

  function marcarRenglonRequiereAlta(fila, requiere = true) {
    if (!fila) return;
    fila.dataset.requierealta = requiere ? 'true' : 'false';
    fila.classList.toggle('renglon-requiere-alta', !!requiere);
    actualizarAccionAltaRenglon(fila);
  }

  function verificarPendientesRestantes() {
    const filas = $$('#detallesBody tr.detalle-row');
    const hayPendiente = filas.some((fila) => rowIsPending(fila));
    const hayRequiereAlta = filas.some((fila) => rowRequiresAlta(fila));
    const bloqueado = hayPendiente || hayRequiereAlta;
    const btn = getAddRowButton();
    if (btn) {
      btn.disabled = bloqueado;
      btn.title = bloqueado ? 'No podés agregar renglones hasta dar de alta el equipo del renglón actual' : '';
    }
    return bloqueado;
  }

  function marcarRenglonCompletado(index) {
    const fila = $(`#detallesBody tr.detalle-row[data-index="${index}"]`);
    if (!fila) return;

    fila.dataset.pendiente = 'false';
    fila.classList.remove('renglon-pendiente');
    fila.classList.add('renglon-completado');

    bloquearRenglonCompletado(fila);

    const proxy = fila.dataset.iddetalleproxy;
    if (proxy && window.equiposCreadosPorDetalle) delete window.equiposCreadosPorDetalle[proxy];

    marcarRenglonRequiereAlta(fila, false);
    verificarPendientesRestantes();
    toast(`Renglón ${index + 1} completado`, 'success');
  }

  function cerrarConfirmAltaEquiposFactura() {
    if (state.confirmFilaPendiente?.isConnected) {
      marcarRenglonRequiereAlta(state.confirmFilaPendiente, true);
      verificarPendientesRestantes();
      toast('Renglón pendiente de alta de equipo. Usá el botón verde para continuar.', 'warning');
    }
    state.confirmFilaPendiente = null;
    setModalVisible('modalConfirmAltaEquiposFactura', false, true);
  }

  function iniciarAltaEquiposParaFila(fila) {
    if (!fila || !fila.isConnected) return;

    const rowIndex = parseInt(fila.dataset.index || '0', 10);
    const cantidadRaw = toNum($('.input-cantidad', fila)?.value);
    const cantidad = Math.max(1, Math.trunc(cantidadRaw));
    const concepto = ($('.input-concepto', fila)?.value || 'equipos').trim();

    const proxy = `detalle_row_${rowIndex}_${Date.now()}`;
    window.equiposCreadosPorDetalle = window.equiposCreadosPorDetalle || {};
    window.equiposCreadosPorDetalle[proxy] = { creados: 0, total: cantidad };

    fila.dataset.pendiente = 'true';
    fila.dataset.iddetalleproxy = proxy;
    fila.classList.add('renglon-pendiente');
    marcarRenglonRequiereAlta(fila, false);

    $$('input:not([readonly]), select', fila).forEach((el) => {
      el.disabled = true;
    });

    state.renglonPendienteActualIndex = rowIndex;
    state.equiposPendientes = Array.from({ length: cantidad }, (_, i) => ({
      idDetalle: proxy,
      concepto,
      index: i,
    }));
    state.indiceEquipoActual = 0;

    verificarPendientesRestantes();
    toast(`Renglón ${rowIndex + 1} pendiente. Iniciá el alta de ${cantidad} equipos.`, 'warning');
    mostrarModalEquipoActual(true);
  }

  function reanudarAltaEquiposParaFila(fila) {
    if (!fila || !fila.isConnected || !rowIsPending(fila)) return false;

    const proxy = fila.dataset.iddetalleproxy;
    if (!proxy) return false;

    const tracker = window.equiposCreadosPorDetalle?.[proxy];
    const resumenCount = Array.isArray(obtenerMapResumenEquipos()[proxy]) ? obtenerMapResumenEquipos()[proxy].length : 0;
    const concepto = ($('.input-concepto', fila)?.value || 'equipos').trim();
    const total = Math.max(1, Math.trunc(tracker?.total || toNum($('.input-cantidad', fila)?.value) || 1));
    const creados = Math.max(0, Math.trunc(Math.max(tracker?.creados || 0, resumenCount)));

    state.renglonPendienteActualIndex = parseInt(fila.dataset.index || '0', 10);
    state.equiposPendientes = Array.from({ length: total }, (_, i) => ({
      idDetalle: proxy,
      concepto,
      index: i,
    }));
    state.indiceEquipoActual = Math.min(creados, Math.max(total - 1, 0));

    marcarRenglonRequiereAlta(fila, false);
    verificarPendientesRestantes();
    mostrarModalEquipoActual(true);
    return true;
  }

  function confirmarAltaEquiposFactura() {
    const fila = state.confirmFilaPendiente;
    if (!fila || !fila.isConnected) {
      cerrarConfirmAltaEquiposFactura();
      return;
    }

    setModalVisible('modalConfirmAltaEquiposFactura', false, true);
    state.confirmFilaPendiente = null;
    iniciarAltaEquiposParaFila(fila);
  }

  function mostrarAlertaCrearEquipos(fila) {
    const rowIndex = parseInt(fila.dataset.index || '0', 10) + 1;
    const cantidadRaw = toNum($('.input-cantidad', fila)?.value);
    const cantidad = Math.max(1, Math.trunc(cantidadRaw));
    const concepto = ($('.input-concepto', fila)?.value || 'equipos').trim();

    marcarRenglonRequiereAlta(fila, true);
    verificarPendientesRestantes();
    state.confirmFilaPendiente = fila;

    const txt = document.getElementById('confirmAltaEquiposTexto');
    if (txt) {
      txt.textContent = `El renglón ${rowIndex} requiere dar de alta ${cantidad} equipos de "${concepto}".`;
    }

    const btn = document.getElementById('btnConfirmAltaEquiposFactura');
    if (btn) btn.onclick = confirmarAltaEquiposFactura;

    setModalVisible('modalConfirmAltaEquiposFactura', true, true);
  }

  function inicializarDetectorRenglon(fila) {
    const inputs = {
      operacion: $('.input-operacion', fila),
      de: $('.input-de', fila),
      cantidad: $('.input-cantidad', fila),
      precio: $('.input-precio', fila),
    };

    const getHash = () => [
      inputs.operacion?.value || '',
      inputs.de?.value || '',
      toNum(inputs.cantidad?.value || 0),
      toNum(inputs.precio?.value || 0),
    ].join('|');
    let alertaTimer = null;

    const trigger = () => {
      if (rowIsCompleted(fila)) return;
      if (rowIsPending(fila)) return;
      const cumple = verificarRenglonCompletoParaEquipos(inputs);
      if (!cumple) {
        if (alertaTimer) clearTimeout(alertaTimer);
        fila.dataset.lastTriggerHash = '';
        marcarRenglonRequiereAlta(fila, false);
        verificarPendientesRestantes();
        return;
      }
      const hash = getHash();
      if (fila.dataset.lastTriggerHash === hash) return;
      fila.dataset.lastTriggerHash = hash;
      if (alertaTimer) clearTimeout(alertaTimer);
      // Timeout para no interrumpir cuando el usuario recién termina de cargar precio.
      alertaTimer = setTimeout(() => {
        if (!fila.isConnected || rowIsPending(fila)) return;
        if (fila.dataset.lastTriggerHash !== hash) return;
        mostrarAlertaCrearEquipos(fila);
      }, 1200);
    };

    // Flexible: no disparar mientras escribe, solo al confirmar/terminar el campo.
    [inputs.operacion, inputs.de, inputs.cantidad, inputs.precio].forEach((el) => {
      if (!el) return;
      el.addEventListener('change', trigger);
      if (el === inputs.cantidad || el === inputs.precio) el.addEventListener('blur', trigger);
    });
  }

  function detalleRowHtml(index) {
    return `
      <td>
        <select name="detalles[${index}][operacion]" class="form-control input-operacion" onchange="cambiarOperacion(this)">
          <option value="">--</option>
          <option value="compra">Compra</option>
          <option value="mano_obra">Mano de obra</option>
        </select>
      </td>
      <td>
        <select name="detalles[${index}][de]" class="form-control input-de" disabled>
          <option value="">--</option>
        </select>
      </td>
      <td>
        <input type="number" name="detalles[${index}][cantidad]" value="1" min="0.1" step="0.1"
          class="form-control input-cantidad text-right"
          onchange="calcularSubtotalFila(this)" oninput="validarCantidad(this); calcularSubtotalFila(this)" required>
      </td>
      <td>
        <input type="text" name="detalles[${index}][concepto]" maxlength="150" class="form-control input-concepto" required>
      </td>
      <td>
        <input type="number" name="detalles[${index}][precioUnitario]" value="0" min="0" step="0.0001"
          class="form-control input-precio text-right"
          onchange="calcularSubtotalFila(this)" oninput="calcularSubtotalFila(this)" required>
      </td>
      <td>
        <select name="detalles[${index}][porcentajeIva]" class="form-control input-iva" onchange="recalcularTotales()" oninput="recalcularTotales()">
          <option value="">--</option>
          <option value="10.5">10.5%</option>
          <option value="21">21%</option>
        </select>
      </td>
      <td>
        <input type="number" name="detalles[${index}][porcentajeDto]" value="0" min="0" max="100" step="0.0001"
          class="form-control input-bonif text-right"
          onchange="calcularSubtotalFila(this)" oninput="calcularSubtotalFila(this)">
      </td>
      <td>
        <input type="text" name="detalles[${index}][obra]" maxlength="100" class="form-control input-obra">
      </td>
      <td>
        <input type="text" class="form-control input-subtotal text-right" value="0,00" readonly>
        <input type="hidden" name="detalles[${index}][subtotal]" class="input-subtotal-hidden" value="0">
      </td>
      <td class="text-center">
        <div class="acciones-renglon">
        <button type="button" class="btn-icon btn-delete" onclick="eliminarDetalleFila(this)" title="Eliminar">
          <i class="fas fa-times"></i>
        </button>
        <button type="button" class="btn-icon btn-alta-equipo btn-alta-equipo-disabled" onclick="abrirAltaEquipoPendiente(this)" title="Disponible cuando el renglón requiera alta o esté pendiente" disabled>
          <i class="fas fa-check"></i>
        </button>
        </div>
      </td>
    `;
  }

  function agregarDetalleFila() {
    if (verificarPendientesRestantes()) {
      toast('Complete equipos del renglón pendiente primero', 'warning');
      return false;
    }

    const filas = $$('#detallesBody tr.detalle-row');
    const primeraIncompleta = filas.find((fila) => {
      if (rowIsCompleted(fila)) return false;
      const operacion = $('.input-operacion', fila)?.value || '';
      const de = $('.input-de', fila)?.value || '';
      const cantidad = toNum($('.input-cantidad', fila)?.value);
      const concepto = ($('.input-concepto', fila)?.value || '').trim();
      const precio = toNum($('.input-precio', fila)?.value);

      if (!operacion || !de || !concepto || cantidad < 1 || precio <= 0) return true;
      if (operacion === 'compra' && de === 'Equipo') return !rowIsCompleted(fila);
      return false;
    });
    if (primeraIncompleta) {
      const idx = parseInt(primeraIncompleta.dataset.index || '0', 10) + 1;
      toast(`Completá el renglón ${idx} antes de agregar otro`, 'warning');
      return false;
    }

    const tbody = document.getElementById('detallesBody');
    if (!tbody) return false;

    const index = tbody.children.length;
    const fila = document.createElement('tr');
    fila.className = 'detalle-row';
    fila.dataset.index = String(index);
    fila.innerHTML = detalleRowHtml(index);

    tbody.appendChild(fila);
    inicializarDetectorRenglon(fila);
    recalcularTotales();
    return true;
  }

  function renumerarIndicesFilas() {
    $$('#detallesBody tr.detalle-row').forEach((fila, index) => {
      fila.dataset.index = String(index);
      $$('[name^="detalles["]', fila).forEach((el) => {
        el.name = el.name.replace(/detalles\[\d+\]/, `detalles[${index}]`);
      });
    });
    aplicarBloqueoRenglonesCompletados();
  }

  async function eliminarDetalleFila(btn) {
    const fila = btn?.closest('tr');
    if (!fila) return;

    const pending = rowIsPending(fila);
    const proxy = fila.dataset.iddetalleproxy;
    const mapResumen = obtenerMapResumenEquipos();
    const resumenCount = Array.isArray(mapResumen[proxy]) ? mapResumen[proxy].length : 0;
    const tracker = proxy && window.equiposCreadosPorDetalle ? window.equiposCreadosPorDetalle[proxy] : null;
    const totalAsociados = Math.max(
      tracker?.total || 0,
      tracker?.creados || 0,
      resumenCount,
    );
    const creados = Math.max(tracker?.creados || 0, resumenCount);
    const pendientes = Math.max(0, totalAsociados - creados);
    const mensaje = totalAsociados > 0
      ? `Este renglón tiene ${totalAsociados} equipo(s) asociado(s).\nCreados: ${creados} | Pendientes: ${pendientes}\nSi continuás, se eliminará el renglón y su referencia de equipos.`
      : '¿Seguro que querés eliminar este renglón?';

    const confirmado = await confirmarAccion({
      titulo: 'Eliminar renglón',
      texto: mensaje,
      textoAceptar: 'Sí, eliminar',
      textoCancelar: 'No, mantener',
      peligro: true,
    });
    if (!confirmado) return;

    try {
      const res = await eliminarEquiposRealesPorProxy(proxy);
      if (res.deleted > 0) toast(`Se eliminaron ${res.deleted} equipo(s) asociados`, 'info');
    } catch (e) {
      toast(`No se puede eliminar el renglón: ${e.message}`, 'error');
      return;
    }

    if (pending && proxy && window.equiposCreadosPorDetalle) {
      delete window.equiposCreadosPorDetalle[proxy];
      state.equiposPendientes = state.equiposPendientes.filter((e) => e.idDetalle !== proxy);
      if (state.indiceEquipoActual >= state.equiposPendientes.length) state.indiceEquipoActual = 0;
    }
    if (proxy) limpiarResumenEquiposPorProxy(proxy);

    fila.remove();
    renumerarIndicesFilas();
    if (state.confirmFilaPendiente === fila) state.confirmFilaPendiente = null;
    verificarPendientesRestantes();
    recalcularTotales();
    toast('Renglón eliminado correctamente', 'success');
  }

  function abrirAltaEquipoPendiente(btn) {
    const fila = btn?.closest('tr');
    if (!fila) return;
    if (rowIsPending(fila)) {
      reanudarAltaEquiposParaFila(fila);
      return;
    }
    state.confirmFilaPendiente = null;
    iniciarAltaEquiposParaFila(fila);
  }

  function abrirModalCrear() {
    forceCerrarTodosLosModales();

    const form = document.getElementById('formFactura');
    if (!form) return;

    form.reset();
    form.action = obtenerRutaFactura('crear');

    const facturaId = document.getElementById('factura_id');
    const method = document.getElementById('form_method');
    const title = document.getElementById('modalFacturaTitle');
    const submit = document.getElementById('btnSubmitFactura');
    const tbody = document.getElementById('detallesBody');

    if (facturaId) facturaId.value = '';
    if (method) method.value = '';
    if (title) title.textContent = 'Nueva Factura';
    if (submit) submit.textContent = 'Crear Factura';
    if (tbody) tbody.innerHTML = '';

    state.equiposPendientes = [];
    state.indiceEquipoActual = 0;
    state.datosEquipoAnterior = null;

    window.equiposPorCrear = [];
    window.idFacturaActual = null;
    window.idProveedorActual = null;

    agregarDetalleFila();
    resetearTotales();
    generarNumeroFactura();

    vaciarColaPdfsLocalesSinRepintado();
    renderAdjuntosExistentesFactura([], null, null);

    setModalVisible('modalFactura', true);
  }

  function cargarDatosFacturaEnFormulario(data, id) {
    const setVal = (idEl, val) => {
      const el = document.getElementById(idEl);
      if (el) el.value = val ?? '';
    };

    setVal('factura_id', data.idFactura);
    setVal('form_method', 'PUT');
    setVal('numero', data.numero);
    setVal('fecha', data.fecha);
    setVal('observacion', data.observacion);
    setVal('idOrdenDeCompra', data.idOrdenDeCompra);
    setVal('idPresupuesto', data.idPresupuesto);
    setVal('obra', data.obra);
    setVal('descripcion_contenido', data.descripcion_contenido);
    setVal('porcentajeBonificacion', data.porcentajeBonificacion || 0);
    setVal('idProveedor', data.idProveedor);

    const tbody = document.getElementById('detallesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    (data.detalles || []).forEach((detalle) => {
      agregarDetalleFila();
      const fila = tbody.lastElementChild;
      if (!fila) return;

      const operacion = $('.input-operacion', fila);
      if (operacion) {
        operacion.value = detalle.operacion || '';
        cambiarOperacion(operacion);
      }

      const assign = (cls, val) => {
        const el = $(cls, fila);
        if (el) el.value = val ?? '';
      };

      assign('.input-de', detalle.de || '');
      assign('.input-cantidad', detalle.cantidad || 1);
      assign('.input-concepto', detalle.concepto || '');
      assign('.input-precio', detalle.precioUnitario || 0);
      assign('.input-iva', detalle.porcentajeIva || '');
      assign('.input-bonif', detalle.porcentajeDto || 0);
      assign('.input-obra', detalle.obra || '');

      calcularSubtotalFila($('.input-cantidad', fila));
    });

    aplicarBloqueoRenglonesCompletados();

    recalcularTotales();

    vaciarColaPdfsLocalesSinRepintado();
    renderAdjuntosExistentesFactura(data.pdfs || [], id, data.numero);

    const title = document.getElementById('modalFacturaTitle');
    const form = document.getElementById('formFactura');
    const submit = document.getElementById('btnSubmitFactura');

    if (title) title.textContent = 'Editar Factura';
    if (form) form.action = `/facturas/${id}/actualizar`;
    if (submit) submit.textContent = 'Guardar Cambios';
  }

  function abrirModalEditar(id) {
    forceCerrarTodosLosModales();

    fetch(`/facturas/${id}`, {
      headers: CrudCommon.jsonHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.message || data.error);
        cargarDatosFacturaEnFormulario(data, id);
        setModalVisible('modalFactura', true);
      })
      .catch((e) => toast(`Error al cargar factura: ${e.message}`, 'error'));
  }

  function verDetalles(id) {
    forceCerrarTodosLosModales();

    const modal = ensureFacturaDetalleModal();
    const content = document.getElementById('facturaDetalleContentDynamic');

    if (!modal) {
      toast('No se encontró el modal de detalle de factura.', 'error');
      return;
    }

    if (!content) {
      toast('No se encontró el contenedor del detalle de factura.', 'error');
      return;
    }

    fetch(`/facturas/${id}`, {
      headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.message || data.error);

        const listaPdfs = Array.isArray(data.pdfs) ? data.pdfs : [];
        const pdfDetalleMosaicoHtml =
          listaPdfs.length === 0
            ? ''
            : (() => {
                const tiles = listaPdfs
                  .map((p) => {
                    const peso = formatBytesFacturaPdfSinParentesis(p.tamano_bytes);
                    const meta = [peso, p.created_at ? String(p.created_at) : ''].filter(Boolean).join(' · ');
                    const tit = escapeHtml(p.nombre_original || 'PDF');
                    const slug = slugNombrePdfParaUrlFactura(p.nombre_original, data.numero, p.idFacturaPdf);
                    const pdfHref = `/facturas/${data.idFactura}/pdfs/${p.idFacturaPdf}/${encodeURIComponent(slug)}`;
                    return `
                    <a class="factura-pdf-tile factura-pdf-tile--detalle" href="${pdfHref}" target="_blank" rel="noopener" title="Abrir en otra pestaña">
                      <span class="factura-pdf-tile-icon" aria-hidden="true">📄</span>
                      <span class="factura-pdf-tile-name">${tit}</span>
                      <span class="factura-pdf-tile-meta">${escapeHtml(meta)}</span>
                    </a>`;
                  })
                  .join('');
                return `
                <div class="factura-upload-pdfs-card factura-upload-pdfs-card--solo-mosaico">
                  <span class="factura-pdf-list-label">PDF de la factura</span>
                  <div class="factura-pdf-tiles-grid factura-pdf-tiles-grid--detalle">${tiles}</div>
                </div>`;
              })();

        let detailsReadonly = '';
        let detallesConEquipos = data.detalles_con_equipos || [];
        
        detallesConEquipos.forEach((item, idx) => {
          const d = item.detalle;
          const equipos = item.equipos || [];
          
          detailsReadonly += `
            <tr class="detalle-row factura-detalle-readonly-row">
              <td><input type="text" class="form-control" value="${escapeHtml(d.operacion || '')}" readonly></td>
              <td><input type="text" class="form-control" value="${escapeHtml(d.de || '')}" readonly></td>
              <td><input type="text" class="form-control text-right" value="${escapeHtml(d.cantidad || 0)}" readonly></td>
              <td><input type="text" class="form-control" value="${escapeHtml(d.concepto || '')}" readonly></td>
              <td><input type="text" class="form-control text-right" value="${formatearNumero(d.precioUnitario)}" readonly></td>
              <td><input type="text" class="form-control text-right" value="${escapeHtml(d.porcentajeIva || 0)}%" readonly></td>
              <td><input type="text" class="form-control text-right" value="${escapeHtml(d.porcentajeDto || 0)}%" readonly></td>
              <td><input type="text" class="form-control" value="${escapeHtml(d.obra || '')}" readonly></td>
              <td><input type="text" class="form-control text-right" value="${formatearNumero(d.subtotal)}" readonly></td>
            </tr>
          `;
          
          // Resumen equipos (verde como en edición)
          if (equipos.length > 0) {
            let equiposHtml = equipos.map(e => `
              <div style="padding: 2px 0;">
                <strong>Equipo:</strong> ID ${e.id} - ${e.serie} - ${e.tipo}
              </div>
            `).join('');

            detailsReadonly += `
              <tr class="detalle-row-equipos-readonly">
                <td colspan="9" style="padding: 5px 10px; background: #e8f5e8; font-size: 0.85em;">
                  ${equiposHtml}
                </td>
              </tr>
            `;
          }
        });

        const html = `
          <div class="factura-detalle factura-detalle-readonly">
            <div class="datos-factura">
              <div class="form-row">
                <div class="form-group">
                  <label>ID</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.idFactura)}" readonly>
                </div>
                <div class="form-group">
                  <label>Número de Factura</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.numero)}" readonly>
                </div>
                <div class="form-group">
                  <label>Fecha</label>
                  <input type="text" class="form-control" value="${formatDateAr(data.fecha)}" readonly>
                </div>
                <div class="form-group flex-2">
                  <label>Proveedor</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.proveedor || 'N/A')}" readonly>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Orden de Compra</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.idOrdenDeCompra || '')}" readonly>
                </div>
                <div class="form-group">
                  <label>Presupuesto</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.idPresupuesto || '')}" readonly>
                </div>
                <div class="form-group">
                  <label>Obra</label>
                  <input type="text" class="form-control" value="${escapeHtml(data.obra || '')}" readonly>
                </div>
              </div>
              <div class="form-group">
                <label>Descripción del Contenido</label>
                <textarea class="form-control" rows="2" readonly>${escapeHtml(data.descripcion_contenido || '')}</textarea>
              </div>
            </div>

            <div class="detalles-section">
              <div class="section-header">
                <h6>Equipos/Items de la Factura</h6>
              </div>
              ${detailsReadonly ? `
                <table class="detalles-table factura-detalle-readonly-table">
                  <thead>
                    <tr>
                      <th width="100">Operación</th>
                      <th width="120">De...</th>
                      <th width="70">Cantidad</th>
                      <th>Concepto</th>
                      <th width="100">Precio Unit.</th>
                      <th width="80">% IVA</th>
                      <th width="70">% Bonif</th>
                      <th width="100">Obra</th>
                      <th width="100">SubTotal</th>
                    </tr>
                  </thead>
                  <tbody>${detailsReadonly}</tbody>
                </table>
              ` : '<div class="factura-detalle-vacio">Esta factura no tiene renglones cargados.</div>'}
              ${detallesConEquipos.length === 0 ? '' : `
                <style>
                  .detalle-row-equipos-readonly {
                    border-left: 4px solid #28a745;
                  }
                </style>
              `}
            </div>

            <div class="totales-panel-redisenado factura-detalle-totales">
              <div class="totales-grid">
                <div class="totales-item bonificacion">
                  <div class="totales-item-header"><label>Bonificación</label></div>
                  <div class="totales-item-content">
                    <div class="totales-input-group">
                      <span class="label">% Bon. Vuelta</span>
                      <input type="text" class="form-control" value="${formatearNumero(data.porcentajeBonificacion)}" readonly>
                    </div>
                    <div class="totales-display">
                      <span class="label">Importe</span>
                      <span class="valor">${formatearNumero(data.importeBonificacion)}</span>
                    </div>
                  </div>
                </div>
                <div class="totales-item iva">
                  <div class="totales-item-header"><label>IVA</label></div>
                  <div class="totales-item-content">
                    <div class="totales-display">
                      <span class="label">IVA 10.5%</span>
                      <span class="valor">${formatearNumero(data.iva105)}</span>
                    </div>
                    <div class="totales-display">
                      <span class="label">IVA 21%</span>
                      <span class="valor">${formatearNumero(data.iva21)}</span>
                    </div>
                  </div>
                </div>
                <div class="totales-item totales">
                  <div class="totales-item-header"><label>Totales</label></div>
                  <div class="totales-item-content">
                    <div class="totales-display neto">
                      <span class="label">Neto</span>
                      <span class="valor">${formatearNumero(data.neto)}</span>
                    </div>
                    <div class="totales-display total-final">
                      <span class="label">TOTAL</span>
                      <span class="valor">${formatearNumero(data.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="observacion-section">
                <div class="form-group">
                  <label>Observación General</label>
                  <textarea class="form-control" rows="2" readonly>${escapeHtml(data.observacion || '')}</textarea>
                </div>
              </div>
              ${pdfDetalleMosaicoHtml}
            </div>
          </div>
        `;

        content.innerHTML = html;
        setModalVisible('modalVerFacturaDynamic', true, true);
        setTimeout(() => modal.querySelector('.modal-cerrar, .btn')?.focus(), 30);
      })
      .catch((e) => toast(`Error al ver detalles: ${e.message}`, 'error'));
  }

  function abrirModalBaja(id, numero) {
    forceCerrarTodosLosModales();
    const form = document.getElementById('formBajaFactura');
    const idInput = document.getElementById('baja_id');
    const nro = document.getElementById('baja_numero');
    const obs = document.getElementById('baja_observacion');

    if (form) form.action = `/facturas/${id}/baja`;
    if (idInput) idInput.value = id;
    if (nro) nro.textContent = numero;
    if (obs) obs.value = '';

    setModalVisible('modalBajaFactura', true);
    return false;
  }

  function getSelectedFacturaRow() {
    if (!state.selectedFacturaId) return null;
    return document.querySelector(`#tablaFacturas tbody tr[data-id="${state.selectedFacturaId}"]`);
  }

  function updateFacturaToolbarState() {
    const row = getSelectedFacturaRow();
    const info = document.getElementById('selectedFacturaInfo');
    const btnDetalle = document.getElementById('btnVerDetalleFactura');
    const btnBaja = document.getElementById('btnBajaFacturaToolbar');
    const enabled = !!row;

    if (info) {
      info.textContent = row
        ? `Factura "${row.dataset.numero}" (${row.dataset.id}) seleccionada`
        : 'Ninguna factura seleccionada';
    }

    if (btnDetalle) btnDetalle.disabled = !enabled;
    if (btnBaja) btnBaja.disabled = !enabled;
  }

  function selectFacturaRow(row) {
    $$('#tablaFacturas tbody tr[data-id]').forEach((tr) => tr.classList.remove('seleccionado'));
    if (!row) {
      state.selectedFacturaId = null;
      updateFacturaToolbarState();
      return;
    }

    row.classList.add('seleccionado');
    state.selectedFacturaId = row.dataset.id || null;
    updateFacturaToolbarState();
  }

  function initFacturaToolbar() {
    const page = document.querySelector('.facturas-container');
    if (!page || page.dataset.facturaToolbarBound === '1') return;
    page.dataset.facturaToolbarBound = '1';

    const rows = $$('#tablaFacturas tbody tr[data-id]');

    rows.forEach((row) => {
      if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '-1');
      if (row.dataset.facturaRowBound === '1') return;
      row.dataset.facturaRowBound = '1';

      row.addEventListener('click', () => selectFacturaRow(row));
    });

    const btnDetalle = document.getElementById('btnVerDetalleFactura');
    const btnBaja = document.getElementById('btnBajaFacturaToolbar');

    btnDetalle?.addEventListener('click', () => {
      const row = getSelectedFacturaRow();
      if (row) verDetalles(row.dataset.id);
    });

    btnBaja?.addEventListener('click', async () => {
      const row = getSelectedFacturaRow();
      if (!row) return;
      
      // Chequeo AJAX de equipos vinculados
      try {
        const response = await fetch(`/facturas/${row.dataset.id}/tiene-equipos`, {
          headers: CrudCommon.jsonHeaders(),
        });
        const data = await response.json();

        let confirmarEliminarEquipos = false;
        let mensaje = `¿Eliminar permanentemente la factura ${row.dataset.numero || row.dataset.id}?`;

        if (data.tieneEquipos) {
          const n = typeof data.cantidad === 'number' ? data.cantidad : 0;
          mensaje += `\n\nHay ${n} renglón(es) tipo compra de equipo. Podés elegir borrar también los equipos vinculados por número de factura.`;
          confirmarEliminarEquipos = true;
        }

        mensaje += `\n\nEsta acción no se puede deshacer.`;
        
        const confirmado = await confirmarAccion({
          titulo: 'Eliminar factura',
          texto: mensaje,
          textoAceptar: confirmarEliminarEquipos ? 'Sí, eliminar factura y equipos' : 'Sí, eliminar factura',
          textoCancelar: 'Cancelar',
          peligro: true,
        });
        
        if (!confirmado) return;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/facturas/${row.dataset.id}/baja`;
        form.innerHTML = `
          <input type="hidden" name="_token" value="${csrfToken()}">
          <input type="hidden" name="_method" value="DELETE">
          ${confirmarEliminarEquipos ? '<input type="hidden" name="eliminar_equipos" value="1">' : ''}
        `;
        document.body.appendChild(form);
        form.submit();
      } catch (error) {
        toast('Error al verificar equipos: ' + error.message, 'error');
      }
    });

    updateFacturaToolbarState();

    if (window.CrudCommon && typeof window.CrudCommon.bindArrowRowNavigation === 'function') {
      window.CrudCommon.bindArrowRowNavigation({
        rowSelector: '#tablaFacturas tbody tr[data-id]',
        getSelectedRow: getSelectedFacturaRow,
        onSelectRow: (row) => selectFacturaRow(row),
      });
    }
  }

  function cargarMarcasFacturaPorTipoYSeleccionar(idTipo, idMarca = null, callback = null) {
    const select = document.getElementById('equipoFacturaIdMarca');
    if (!select) return;

    let url = '/marcas/api';
    if (idTipo) {
      url += `?idTipo=${encodeURIComponent(idTipo)}`;
    }

    // ANTI-DUPLICADOS marcas
    select.innerHTML = '<option value="">— Seleccionar marca —</option>';
    if (select.dataset.loading === '1') return;
    select.dataset.loading = '1';

    fetch(url, { headers: CrudCommon.jsonHeaders() })
      .then((r) => r.json())
      .then((rows) => {
        rows.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.idMarca;
          opt.textContent = m.marca;
          select.appendChild(opt);
        });
        if (idMarca) select.value = String(idMarca);
        if (typeof callback === 'function') callback();
        select.dataset.loading = '0';
      })
      .catch(() => {
        select.dataset.loading = '0';
        toast('Error al cargar marcas', 'error');
      });
  }

  function cargarModelosPorMarcaYTipoYSeleccionar(idMarca, idTipo, idModelo = null) {
    const select = document.getElementById('equipoFacturaIdModelo');
    if (!select) return;

    // ANTI-DUPLICADOS: Clear siempre + dataset lock
    select.innerHTML = '<option value="">— Seleccionar modelo —</option>';
    if (select.dataset.loading === '1') return;
    select.dataset.loading = '1';

    if (!idMarca || !idTipo) {
      select.dataset.loading = '0';
      return;
    }

    fetch(`/modelos/marca/${idMarca}/tipo/${idTipo}`, { headers: CrudCommon.jsonHeaders() })
      .then((r) => r.json())
      .then((rows) => {
        rows.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.idModelo;
          opt.textContent = m.modelo;
          select.appendChild(opt);
        });
        if (idModelo) select.value = String(idModelo);
        select.dataset.loading = '0';
      })
      .catch(() => toast('Error al cargar modelos', 'error'));
  }

  function cargarSectoresPorUbicacionYSeleccionar(idUbicacion, idSector = null) {
    const select = document.getElementById('equipoFacturaSectorId');
    if (!select) return;

    select.innerHTML = '<option value="">— Sin especificar —</option>';
    if (!idUbicacion) return;

    fetch(`/api/sectores/ubicacion/${idUbicacion}`, { headers: CrudCommon.jsonHeaders() })
      .then((r) => r.json())
      .then((rows) => {
        rows.forEach((s) => {
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.nombre;
          select.appendChild(opt);
        });
        if (idSector) select.value = idSector;
      })
      .catch(() => toast('Error al cargar sectores', 'error'));
  }

  function cargarModelosFactura(idMarca) {
    const idTipo = document.getElementById('equipoFacturaIdTipo')?.value || '';
    cargarModelosPorMarcaYTipoYSeleccionar(idMarca, idTipo, null);
  }

  function cargarSectoresFactura(idUbicacion) {
    cargarSectoresPorUbicacionYSeleccionar(idUbicacion, null);
  }

  function cargarModelosFacturaPorMarcaYSeleccionar(idMarca, idModelo = null) {
    const idTipo = document.getElementById('equipoFacturaIdTipo')?.value || '';
    cargarModelosPorMarcaYTipoYSeleccionar(idMarca, idTipo, idModelo);
  }

  function cargarModelosPorMarcaYSeleccionar(idMarca, idModelo = null) {
    cargarModelosFacturaPorMarcaYSeleccionar(idMarca, idModelo);
  }

  function cargarSectoresFacturaPorUbicacionYSeleccionar(idUbicacion, idSector = null) {
    cargarSectoresPorUbicacionYSeleccionar(idUbicacion, idSector);
  }

  function recargarSelectProveedores(idSeleccionar = null) {
    const target = document.getElementById('idProveedor');
    if (!target) return;

    fetch('/proveedores/api', { headers: CrudCommon.jsonHeaders() })
      .then((r) => r.json())
      .then((rows) => {
        target.innerHTML = '<option value="">Seleccionar proveedor...</option>';
        rows.forEach((p) => {
          const opt = document.createElement('option');
          opt.value = p.idProveedor;
          opt.textContent = p.proveedor;
          target.appendChild(opt);
        });
        if (idSeleccionar) target.value = String(idSeleccionar);
      })
      .catch(() => toast('Error al actualizar proveedores', 'error'));
  }

  function obtenerMapResumenEquipos() {
    window.equiposResumenPorDetalle = window.equiposResumenPorDetalle || {};
    return window.equiposResumenPorDetalle;
  }

  function limpiarResumenEquiposPorProxy(proxy) {
    if (!proxy) return;
    const map = obtenerMapResumenEquipos();
    delete map[proxy];
    const row = document.querySelector(`#detallesBody tr.detalle-row-equipos[data-parent-proxy="${proxy}"]`);
    if (row) row.remove();
  }

  async function eliminarEquiposRealesPorProxy(proxy) {
    if (!proxy) return { ok: true, deleted: 0 };

    const map = obtenerMapResumenEquipos();
    const items = Array.isArray(map[proxy]) ? map[proxy] : [];
    const ids = items
      .map((it) => parseInt(String(it?.id || ''), 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!ids.length) return { ok: true, deleted: 0 };

    const response = await fetch(obtenerRutaEquiposEliminarLote(), {
      method: 'POST',
      headers: CrudCommon.jsonHeaders({
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }),
      body: JSON.stringify({ ids }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Error HTTP ${response.status}`);
    }

    return { ok: true, deleted: Number(data.deleted || 0) };
  }

  function renderResumenEquiposPorProxy(proxy) {
    if (!proxy) return;
    const map = obtenerMapResumenEquipos();
    const items = Array.isArray(map[proxy]) ? map[proxy] : [];
    const parentRow = document.querySelector(`#detallesBody tr.detalle-row[data-iddetalleproxy="${proxy}"]`);
    if (!parentRow) return;

    let infoRow = parentRow.nextElementSibling;
    if (!infoRow || !infoRow.classList.contains('detalle-row-equipos') || infoRow.dataset.parentProxy !== proxy) {
      infoRow = document.createElement('tr');
      infoRow.className = 'detalle-row-equipos';
      infoRow.dataset.parentProxy = proxy;
      parentRow.parentNode.insertBefore(infoRow, parentRow.nextSibling);
    }

    if (!items.length) {
      infoRow.remove();
      return;
    }

    const htmlItems = items.map((it) => `
      <div class="equipos-resumen-row">
        <span class="equipos-resumen-col col-id">${escapeHtml(it.id)}</span>
        <span class="equipos-resumen-col col-tipo">${escapeHtml(it.tipo)}</span>
        <span class="equipos-resumen-col col-serie">${escapeHtml(it.serie)}</span>
      </div>
    `).join('');
    infoRow.innerHTML = `
      <td colspan="10">
        <div class="equipos-resumen-wrap">
          <div class="equipos-resumen-head">
            <span class="equipos-resumen-col col-id">ID</span>
            <span class="equipos-resumen-col col-tipo">Tipo</span>
            <span class="equipos-resumen-col col-serie">Serie</span>
          </div>
          ${htmlItems}
        </div>
      </td>
    `;
  }

  function registrarEquipoCreado(proxy, item) {
    if (!proxy) return;
    const map = obtenerMapResumenEquipos();
    map[proxy] = map[proxy] || [];
    map[proxy].push(item);
    renderResumenEquiposPorProxy(proxy);
  }

  function abrirModalProveedor(mode = 'crear') {
    const modal = document.getElementById('modalProveedor');
    const titulo = document.getElementById('modalProveedorTitulo');
    const submit = document.getElementById('modalProveedorSubmit');
    const form = document.getElementById('formProveedor');

    if (!modal || !form) return;
    form.reset();
    if (titulo) titulo.textContent = mode === 'crear' ? 'Nuevo Proveedor' : 'Editar Proveedor';
    if (submit) submit.textContent = mode === 'crear' ? 'Crear' : 'Actualizar';
    setModalVisible('modalProveedor', true, true);
  }

  function formProveedorEstaVacio() {
    const ids = [
      'proveedorNombre',
      'proveedorMail',
      'proveedorDireccion',
      'proveedorCiudad',
      'proveedorProvincia',
      'proveedorCodigoPostal',
    ];
    return ids.every((id) => {
      const el = document.getElementById(id);
      return !el || String(el.value || '').trim() === '';
    });
  }

  function cerrarModalProveedor() {
    if (formProveedorEstaVacio()) {
      forceCerrarModal('modalProveedor');
      return Promise.resolve(true);
    }
    return solicitarCierreModal(
      'modalProveedor',
      '¿Cerrar sin guardar el nuevo proveedor?'
    );
  }

  function debugClick(tipo) {
    const modalEquipoFactura = document.getElementById('modalEquipoFactura');
    if (modalEquipoFactura?.classList.contains('show')) {
      modalEquipoFactura.style.display = 'none';
      window.__overlayEquipoFacturaOculto = true;
    }

    const fn = window[`abrirModal${tipo}`];
    if (typeof fn === 'function') {
      fn('crear');
      return;
    }
    toast(`No se encontró abrirModal${tipo}`, 'warning');
  }

  function initRestoreModalEquipoFacturaTrasEntidad() {
    const closeFns = ['cerrarModalMarca', 'cerrarModalModelo', 'cerrarModalUbicacion', 'cerrarModalSector', 'cerrarModalTipo'];

    closeFns.forEach((name) => {
      const original = window[name];
      if (typeof original !== 'function' || original.__wrappedForFactura) return;

      const wrapped = function(...args) {
        const res = original.apply(this, args);
        const modalEquipoFactura = document.getElementById('modalEquipoFactura');
        if (window.__overlayEquipoFacturaOculto && modalEquipoFactura) {
          modalEquipoFactura.style.display = 'flex';
          modalEquipoFactura.classList.add('show');
          modalEquipoFactura.classList.remove('modal-oculto');
          modalEquipoFactura.setAttribute('aria-hidden', 'false');
          window.__overlayEquipoFacturaOculto = false;
        }
        return res;
      };
      wrapped.__wrappedForFactura = true;
      window[name] = wrapped;
    });
  }

  function completarFilaSiCorresponde(idDetalleProxy) {
    if (!idDetalleProxy || !window.equiposCreadosPorDetalle?.[idDetalleProxy]) return;

    const tracker = window.equiposCreadosPorDetalle[idDetalleProxy];
    tracker.creados += 1;

    if (tracker.creados < tracker.total) return;

    const fila = $(`#detallesBody tr.detalle-row[data-iddetalleproxy="${idDetalleProxy}"]`);
    if (!fila) return;

    const idx = parseInt(fila.dataset.index || '-1', 10);
    if (idx >= 0) marcarRenglonCompletado(idx);
  }

  function finalizarColaEquipos() {
    state.equiposPendientes = [];
    state.indiceEquipoActual = 0;
    state.creandoEquipo = false;

    window.equiposPorCrear = [];
    window.idFacturaActual = null;
    window.idProveedorActual = null;

    // Marcar como completado
    localStorage.setItem('equiposFacturaCompletados', 'true');
    
    setModalVisible('modalEquipoFactura', false, true);

    fetch('/facturas/limpiar-sesion-equipos', {
      method: 'POST',
      headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
    }).catch(() => {});

    verificarPendientesRestantes();
  }

  function omitirEquipoActualFactura() {
    state.indiceEquipoActual += 1;
    if (state.indiceEquipoActual >= state.equiposPendientes.length) {
      toast('Equipos omitidos. Podés crearlos manualmente luego.', 'info');
      finalizarColaEquipos();
      return;
    }
    mostrarModalEquipoActual(true);
  }

  async function cerrarModalEquipoDesdeFactura() {
    if (state.equiposPendientes.length > state.indiceEquipoActual) {
      const confirmado = await confirmarAccion({
        titulo: 'Cerrar alta de equipos',
        texto: 'Hay equipos pendientes. Si cerrás ahora, se omitirán los restantes. ¿Querés continuar?',
        textoAceptar: 'Sí, cerrar',
        textoCancelar: 'Seguir cargando',
        peligro: false,
      });
      if (!confirmado) return false;
      toast('Equipos pendientes omitidos', 'info');
      finalizarColaEquipos();
      return true;
    }

    const confirmado = await confirmarAccion({
      titulo: 'Cerrar modal',
      texto: '¿Querés cerrar este modal de carga de equipos?',
      textoAceptar: 'Sí, cerrar',
      textoCancelar: 'Seguir editando',
      peligro: false,
    });
    if (!confirmado) return false;
    setModalVisible('modalEquipoFactura', false, true);
    return true;
  }

  function aplicarAutoCompletarEquipo(equipoActual, callback = null) {
    if (!state.datosEquipoAnterior || state.datosEquipoAnterior.idDetalle !== equipoActual.idDetalle) {
      if (callback) callback();
      return;
    }

    const d = state.datosEquipoAnterior;
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

    set('equipoFacturaIdProveedor', d.idProveedor);
    set('equipoFacturaIdProveedorHidden', d.idProveedor);
    set('equipoFacturaIdTipo', d.idTipo);
    if (d.idTipo) {
      cargarMarcasFacturaPorTipoYSeleccionar(d.idTipo, d.idMarca || null, () => {
        if (d.idMarca) {
          cargarModelosPorMarcaYTipoYSeleccionar(d.idMarca, d.idTipo, d.idModelo || null);
        }
      });
    } else {
      set('equipoFacturaIdMarca', d.idMarca);
      if (d.idMarca) cargarModelosFacturaPorMarcaYSeleccionar(d.idMarca, d.idModelo || null);
    }
    set('equipoFacturaUbicacionId', d.ubicacion_id);
    if (d.ubicacion_id) cargarSectoresPorUbicacionYSeleccionar(d.ubicacion_id, d.sector_id || null);
    set('equipoFacturaPrecio', d.precio);
    set('equipoFacturaObservacion', d.observacion);
    setGarantiaFactura(document.getElementById('equipoFacturaGarantiaBase')?.value || document.getElementById('fecha')?.value || new Date().toISOString().slice(0, 10), d.vtoGarantia || '');
    const checkSeguro = document.getElementById('equipoFacturaInformaSeguro');
    if (checkSeguro) checkSeguro.checked = d.informaSeguro || false;
  }

  function mostrarModalEquipoActual(forceOpen = false) {
    if (!state.equiposPendientes.length || state.indiceEquipoActual >= state.equiposPendientes.length) {
      if (forceOpen) finalizarColaEquipos();
      return;
    }

    const modal = document.getElementById('modalEquipoFactura');
    const equipo = state.equiposPendientes[state.indiceEquipoActual];
    if (!modal || !equipo) return;

    const total = state.equiposPendientes.length;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

    const facturaId = window.idFacturaActual || document.getElementById('factura_id')?.value || '';
    const numeroFactura = document.getElementById('numero')?.value || '';

    set('equipoFacturaIdFactura', facturaId);
    set('equipoFacturaNumeroFactura', numeroFactura);
    set('equipoFacturaIdDetalleFactura', equipo.idDetalle || '');
    set('equipoFacturaSerie', '');
    set('equipoFacturaObservacion', `Creado desde factura - ${equipo.concepto || 'Equipo'}`);
    set('equipoFacturaPrecio', '');
    set('equipoFacturaIdTipo', '');
    cargarMarcasFacturaPorTipoYSeleccionar('', null);
    const selectModelo = document.getElementById('equipoFacturaIdModelo');
    if (selectModelo) {
      selectModelo.innerHTML = '<option value="">— Seleccionar modelo —</option>';
    }
    const checkSeguro = document.getElementById('equipoFacturaInformaSeguro');
    if (checkSeguro) checkSeguro.checked = true;

    const rowInfo = document.getElementById('equipoFacturaRowInfo');
    const submit = document.getElementById('modalEquipoFacturaSubmit');

    if (rowInfo) {
      const rowLabel = Number.isInteger(state.renglonPendienteActualIndex) ? ` (Renglón ${state.renglonPendienteActualIndex + 1})` : '';
      rowInfo.textContent = `${rowLabel} (${state.indiceEquipoActual + 1}/${total})`;
    }
    if (submit) submit.textContent = state.indiceEquipoActual === total - 1 ? 'Crear y Finalizar' : 'Crear Siguiente';

    const btnCerrar = modal.querySelector('.modal-cerrar');
    const btnCancelar = modal.querySelector('.btn-secundario');
    if (btnCerrar) btnCerrar.onclick = cerrarModalEquipoDesdeFactura;
    if (btnCancelar) {
      btnCancelar.textContent = 'Omitir';
      btnCancelar.onclick = omitirEquipoActualFactura;
    }

    // Autocomplete proveedor desde factura seleccionada
    const proveedorFactura = document.getElementById('idProveedor')?.value || window.idProveedorActual || '';
    if (!proveedorFactura) {
      toast('Seleccioná primero un proveedor en la factura para dar de alta equipos', 'warning');
      return;
    }
    set('equipoFacturaIdProveedor', proveedorFactura);
    set('equipoFacturaIdProveedorHidden', proveedorFactura);
    const fechaFactura = document.getElementById('fecha')?.value || new Date().toISOString().slice(0, 10);
    setGarantiaFactura(fechaFactura, '');

    aplicarAutoCompletarEquipo(equipo);

    setModalVisible('modalEquipoFactura', true, true);
    setTimeout(() => document.getElementById('equipoFacturaSerie')?.focus(), 80);
  }

  function initDatosEquiposDesdeSession() {
    const contenedor = document.getElementById('datos-equipos');
    if (!contenedor) return;

    try {
      const decoded = (() => {
        const raw = contenedor.dataset.equipos;
        if (!raw) return [];
        const txt = document.createElement('textarea');
        txt.innerHTML = raw;
        const value = txt.value?.trim();
        if (!value || value === 'null' || value === '[]' || value === '""') return [];
        return JSON.parse(value);
      })();

      if (!Array.isArray(decoded) || decoded.length === 0) return;

      // Solo abrir si NO están completados (localStorage flag)
      if (localStorage.getItem('equiposFacturaCompletados') === 'true') {
        fetch('/facturas/limpiar-sesion-equipos', {
          method: 'POST',
          headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
        });
        return;
      }

      window.equiposPorCrear = decoded;
      window.idFacturaActual = contenedor.dataset.factura || null;
      window.idProveedorActual = contenedor.dataset.proveedor || null;

      state.equiposPendientes = decoded;
      state.indiceEquipoActual = 0;

      setTimeout(() => mostrarModalEquipoActual(true), 250);
    } catch (e) {
      console.error('Error leyendo sesión de equipos:', e);
    }
  }

  function initFormularioFactura() {
    const form = document.getElementById('formFactura');
    if (!form || form.dataset.facturasBound === '1') return;
    form.dataset.facturasBound = '1';

    form.addEventListener('submit', async (e) => {
      if (form.dataset.facturaConfirmada === '1') {
        form.dataset.facturaConfirmada = '0';
        return;
      }

      const ordenDeCompra = document.getElementById('idOrdenDeCompra');
      if (ordenDeCompra?.value && String(ordenDeCompra.value).length > 6) {
        e.preventDefault();
        toast('La orden de compra debe tener máximo 6 dígitos', 'warning');
        ordenDeCompra.focus();
        return;
      }

      const filas = $$('#detallesBody tr.detalle-row');
      if (!filas.length) {
        e.preventDefault();
        toast('Debe agregar al menos un renglón', 'warning');
        return;
      }

      const faltante = filas.find((fila) => {
        const operacion = $('.input-operacion', fila)?.value;
        const de = $('.input-de', fila)?.value;
        return operacion && !de;
      });

      if (faltante) {
        e.preventDefault();
        const idx = parseInt(faltante.dataset.index || '0', 10) + 1;
        toast(`Debe seleccionar "De..." en el renglón ${idx}`, 'warning');
        return;
      }

      if (verificarPendientesRestantes()) {
        e.preventDefault();
        toast('Hay renglones pendientes de equipos por resolver', 'warning');
        return;
      }

      e.preventDefault();
      const total = document.getElementById('totalDisplay')?.textContent?.trim() || '0,00';
      const isEdit = (document.getElementById('form_method')?.value || '').toUpperCase() === 'PUT';
      const accion = isEdit ? 'guardar cambios de la factura' : 'crear la factura';
      const confirmado = await confirmarAccion({
        titulo: isEdit ? 'Confirmar cambios de factura' : 'Confirmar creación de factura',
        texto: `Se va a ${accion} con ${filas.length} renglón(es).\nTotal estimado: $${total}\n¿Deseás continuar?`,
        textoAceptar: isEdit ? 'Sí, guardar cambios' : 'Sí, crear factura',
        textoCancelar: 'Revisar datos',
        peligro: false,
      });

      if (!confirmado) {
        toast('Creación cancelada. Podés seguir editando.', 'info');
        return;
      }

      form.dataset.facturaConfirmada = '1';
      prepararCamposFacturaParaSubmit();
      sincronizarDetallesFacturaEnFormulario(form);
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.submit();
    });
  }

  function initFormularioProveedorFactura() {
    const form = document.getElementById('formProveedor');
    if (!form || form.dataset.facturasBound === '1') return;
    form.dataset.facturasBound = '1';

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submit = document.getElementById('modalProveedorSubmit');
      const prev = submit?.textContent || 'Crear';
      if (submit) {
        submit.textContent = 'Guardando...';
        submit.disabled = true;
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!(data.success || data.idProveedor || data.id)) {
            throw new Error(data.message || 'No se pudo crear proveedor');
          }

          const id = data.idProveedor || data.id;
          recargarSelectProveedores(id);
          forceCerrarModal('modalProveedor');
          toast('Proveedor creado correctamente', 'success');
        })
        .catch((err) => toast(`Error al crear proveedor: ${err.message}`, 'error'))
        .finally(() => {
          if (submit) {
            submit.textContent = prev;
            submit.disabled = false;
          }
        });
    });
  }

  async function serieExisteFactura(serie) {
    if (!serie || !serie.trim()) return false;
    try {
      const response = await fetch('/equipos/serie-existe?serie=' + encodeURIComponent(serie.trim()), {
        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      return Boolean(data.exists);
    } catch (error) {
      console.error('Error comprobando serie existente (factura):', error);
      return false;
    }
  }

  function setSerieErrorFactura(msg) {
    const errorEl = document.getElementById('equipoFacturaSerieError');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function clearSerieErrorFactura() {
    const errorEl = document.getElementById('equipoFacturaSerieError');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  function manejarSerieExistenteFactura() {
    const input = document.getElementById('equipoFacturaSerie');
    toast('Número de serie ya existente', 'error');
    setSerieErrorFactura('Número de serie ya existente');
    if (input) {
      input.classList.add('input-error');
      input.focus();
      input.select();
    }
  }

  function initFormularioEquipoDesdeFactura() {
    const form = document.getElementById('formEquipoFactura');
    const inputSerie = document.getElementById('equipoFacturaSerie');
    if (!form || form.dataset.facturasBound === '1') return;
    form.dataset.facturasBound = '1';

    if (inputSerie) {
      inputSerie.addEventListener('input', () => {
        inputSerie.classList.remove('input-error');
        clearSerieErrorFactura();
      });
    }

    form.addEventListener('submit', async (e) => {
      if (!state.equiposPendientes.length) return;
      e.preventDefault();

      if (state.creandoEquipo) return;
      state.creandoEquipo = true;

      const equipoActual = state.equiposPendientes[state.indiceEquipoActual];
      const serieCreada = document.getElementById('equipoFacturaSerie')?.value?.trim() || '-';

      if (!serieCreada || serieCreada === '-') {
        toast('Ingrese un número de serie válido', 'warning');
        setSerieErrorFactura('Número de serie inválido');
        inputSerie?.classList.add('input-error');
        inputSerie?.focus();
        state.creandoEquipo = false;
        return;
      }

      clearSerieErrorFactura();
      inputSerie?.classList.remove('input-error');

      updateGarantiaFacturaFromDias();

      if (await serieExisteFactura(serieCreada)) {
        manejarSerieExistenteFactura();
        state.creandoEquipo = false;
        return;
      }

      const tipoSelect = document.getElementById('equipoFacturaIdTipo');
      const tipoCreado = tipoSelect?.options?.[tipoSelect.selectedIndex]?.text?.trim() || '-';
      const formData = new FormData(form);
      formData.set('idDetalleFactura', equipoActual?.idDetalle || formData.get('idDetalleFactura') || '');

      state.datosEquipoAnterior = {
        idDetalle: equipoActual?.idDetalle || null,
        idProveedor: document.getElementById('equipoFacturaIdProveedorHidden')?.value || '',
        idTipo: document.getElementById('equipoFacturaIdTipo')?.value || '',
        idMarca: document.getElementById('equipoFacturaIdMarca')?.value || '',
        idModelo: document.getElementById('equipoFacturaIdModelo')?.value || '',
        ubicacion_id: document.getElementById('equipoFacturaUbicacionId')?.value || '',
        sector_id: document.getElementById('equipoFacturaSectorId')?.value || '',
        vtoGarantia: document.getElementById('equipoFacturaVtoGarantia')?.value || '',
        precio: document.getElementById('equipoFacturaPrecio')?.value || '',
        observacion: document.getElementById('equipoFacturaObservacion')?.value || '',
        informaSeguro: document.getElementById('equipoFacturaInformaSeguro')?.checked || false,
      };

      fetch(obtenerRutaEquiposCrear(), {
        method: 'POST',
        body: formData,
        headers: CrudCommon.jsonHeaders({ 'X-Requested-With': 'XMLHttpRequest' }),
      })
        .then((r) => {
          const contentType = r.headers.get('content-type') || '';
          if (contentType.includes('application/json')) return r.json();
          return { success: r.ok };
        })
        .then((data) => {
          if (!data.success) throw new Error(data.message || 'No se pudo crear equipo. Revisá los campos obligatorios.');

          const idCreado = data.id || data.equipo?.id || '-';
          registrarEquipoCreado(equipoActual?.idDetalle, {
            id: idCreado,
            serie: serieCreada,
            tipo: tipoCreado,
          });

          completarFilaSiCorresponde(equipoActual?.idDetalle);

          state.indiceEquipoActual += 1;
          form.reset();
          toast('Equipo creado correctamente', 'success');

          if (state.indiceEquipoActual >= state.equiposPendientes.length) {
            toast('Proceso de equipos completado', 'success');
            finalizarColaEquipos();
          } else {
            mostrarModalEquipoActual(true);
          }
        })
        .catch((err) => toast(`Error al crear equipo: ${err.message}`, 'error'))
        .finally(() => {
          state.creandoEquipo = false;
        });
    });
  }

  function initFiltrosTabla() {
    $$('#tablaFacturas th.sortable').forEach((th) => {
      if (th.dataset.facturasBound === '1') return;
      th.dataset.facturasBound = '1';

      th.style.cursor = 'pointer';
      th.title = 'Click para ordenar';
      th.addEventListener('click', () => {
        const column = th.dataset.column;
        const current = th.dataset.order || 'desc';
        const next = current === 'desc' ? 'asc' : 'desc';
        const url = new URL(window.location.href);
        url.searchParams.set('column', column);
        url.searchParams.set('order', next);
        window.location.href = url.toString();
      });
    });

    const search = document.getElementById('buscar');
    if (search && search.dataset.facturasBound !== '1') {
      search.dataset.facturasBound = '1';
      let timeout;
      search.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          window.facturasApplyToolbarFilters();
        }, 450);
      });
    }

    const proveedor = document.getElementById('proveedor');
    if (proveedor && proveedor.dataset.facturasBound !== '1') {
      proveedor.dataset.facturasBound = '1';
      proveedor.addEventListener('change', () => {
        window.facturasApplyToolbarFilters();
      });
    }
  }

  function initBuscadorSelect(inputId, selectId) {
    const input = document.getElementById(inputId);
    const select = document.getElementById(selectId);
    if (!input || !select || input.dataset.facturasBound === '1') return;
    input.dataset.facturasBound = '1';

    const normalize = (txt) => String(txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    let originales = Array.from(select.options).map((o) => ({ value: o.value, text: o.textContent }));

    const render = (filtro = '') => {
      const q = normalize(filtro);
      const prev = select.value;

      const filtered = !q ? originales : originales
        .filter((o) => normalize(o.text).includes(q))
        .sort((a, b) => {
          const an = normalize(a.text);
          const bn = normalize(b.text);
          const as = an.startsWith(q) ? 0 : 1;
          const bs = bn.startsWith(q) ? 0 : 1;
          return as - bs || an.localeCompare(bn);
        });

      select.innerHTML = '';
      filtered.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.text;
        select.appendChild(opt);
      });

      if (Array.from(select.options).some((o) => o.value === prev)) {
        select.value = prev;
      } else if (filtered.length && q) {
        select.value = filtered[0].value;
      }

      // Modo sugerencias en vivo mientras escribe.
      select.size = q ? Math.min(Math.max(filtered.length, 1), 7) : 1;
    };

    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => render(input.value), 180);
    });
    input.addEventListener('focus', () => render(input.value));
    input.addEventListener('blur', () => setTimeout(() => { select.size = 1; }, 150));

    const observer = new MutationObserver(() => {
      originales = Array.from(select.options).map((o) => ({ value: o.value, text: o.textContent }));
      if (input.value.trim()) render(input.value);
    });
    observer.observe(select, { childList: true, subtree: false });
  }

  function initBuscadoresModalEquipoFactura() {
    initBuscadorSelect('buscarEquipoFacturaTipo', 'equipoFacturaIdTipo');
    initBuscadorSelect('buscarEquipoFacturaMarca', 'equipoFacturaIdMarca');
    initBuscadorSelect('buscarEquipoFacturaModelo', 'equipoFacturaIdModelo');
    initBuscadorSelect('buscarEquipoFacturaUbicacion', 'equipoFacturaUbicacionId');
    initBuscadorSelect('buscarEquipoFacturaSector', 'equipoFacturaSectorId');

    const selectTipo = document.getElementById('equipoFacturaIdTipo');
    const selectMarca = document.getElementById('equipoFacturaIdMarca');
    const selectModelo = document.getElementById('equipoFacturaIdModelo');

    if (selectTipo && selectTipo.dataset.facturaTipoMarcaBound !== '1') {
      selectTipo.dataset.facturaTipoMarcaBound = '1';
      selectTipo.addEventListener('change', () => {
        const modeloSelect = document.getElementById('equipoFacturaIdModelo');
        if (modeloSelect) modeloSelect.innerHTML = '<option value="">— Seleccionar modelo —</option>';
        cargarMarcasFacturaPorTipoYSeleccionar(selectTipo.value || '', null, () => {});
      });
    }

    if (selectMarca && selectMarca.dataset.facturaMarcaModeloBound !== '1') {
      selectMarca.dataset.facturaMarcaModeloBound = '1';
      selectMarca.addEventListener('change', () => {
        const modeloSelect = document.getElementById('equipoFacturaIdModelo');
        if (modeloSelect) modeloSelect.innerHTML = '<option value="">— Seleccionar modelo —</option>';
        cargarModelosFacturaPorMarcaYSeleccionar(selectMarca.value || '', null);
      });
    }
  }

  function initGlobalClosures() {
    if (window.__facturasClosuresBound) return;
    window.__facturasClosuresBound = true;

    window.addEventListener('beforeunload', (e) => {
      const modal = document.getElementById('modalEquipoFactura');
      const hasPending = state.equiposPendientes.length > 0 && state.indiceEquipoActual < state.equiposPendientes.length;
      if (modal?.classList.contains('show') && hasPending) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

  }

  function applyToolbarFilters() {
    const url = new URL(window.location.href);
    const buscar = document.getElementById('buscar')?.value?.trim() || '';
    const proveedor = document.getElementById('proveedor')?.value || '';

    if (buscar) url.searchParams.set('buscar', buscar);
    else url.searchParams.delete('buscar');

    if (proveedor) url.searchParams.set('proveedor', proveedor);
    else url.searchParams.delete('proveedor');

    window.location.href = url.toString();
  }

  function confirmarAbrirCrearFactura() {
    // Chequear si hay modales abiertos con cambios
    const modalesAbiertos = ['modalFactura', 'modalEquipoFactura', 'modalProveedor'].some(id => {
      const modal = document.getElementById(id);
      return modal && (modal.classList.contains('show') || modal.style.display !== 'none');
    });

    if (!modalesAbiertos) {
      abrirModalCrear();
      return;
    }

    confirmarAccion({
      titulo: 'Crear nueva factura',
      // texto: 'Hay modales abiertos con posibles cambios no guardados. Se cerrarán todos.\n\n¿Querés continuar y crear nueva factura?',
      textoAceptar: 'Sí, nueva factura',
      textoCancelar: 'Cancelar',
      peligro: false,
    }).then(confirmado => {
      if (confirmado) {
        forceCerrarTodosLosModales();
        abrirModalCrear();
      }
    });
  }

  function initConfirmacionFormBaja() {
    const form = document.getElementById('formBajaFactura');
    if (!form || form.dataset.confirmBound === '1') return;
    form.dataset.confirmBound = '1';

    form.addEventListener('submit', async (e) => {
      if (form.dataset.bajaConfirmed === '1') {
        form.dataset.bajaConfirmed = '0';
        return;
      }
      e.preventDefault();
      const id = document.getElementById('baja_id')?.value;
      const numero = document.getElementById('baja_numero')?.textContent || id;
      const obs = document.getElementById('baja_observacion')?.value?.trim();
      const obsLine = obs ? `\n\nNota: ${obs}` : '';

      const confirmado = await confirmarAccion({
        titulo: 'Confirmar eliminación',
        texto: `¿Confirmás eliminar permanentemente la factura ${numero}?${obsLine}`,
        textoAceptar: 'Sí, eliminar',
        textoCancelar: 'Cancelar',
        peligro: true,
      });

      if (confirmado) {
        form.dataset.bajaConfirmed = '1';
        form.requestSubmit();
      }
    });
  }

  function initFacturasPage() {
    const page = document.querySelector('.facturas-container');
    if (!page) return;

    const btnAgregar = getAddRowButton();
    if (btnAgregar && !btnAgregar.id) btnAgregar.id = 'btnAgregarRenglon';

    window.equiposPorCrear = window.equiposPorCrear || [];
    window.idFacturaActual = window.idFacturaActual || null;
    window.idProveedorActual = window.idProveedorActual || null;

    initFormularioFactura();
    initFacturaPdfZona();
    initFormularioProveedorFactura();
    initFormularioEquipoDesdeFactura();
    initConfirmacionFormBaja();
    initGarantiaFactura();
    initRestoreModalEquipoFacturaTrasEntidad();
    initBuscadoresModalEquipoFactura();
    initDatosEquiposDesdeSession();
    initFiltrosTabla();
    initFacturaToolbar();
    initGlobalClosures();

    verificarPendientesRestantes();
    recalcularTotales();
    aplicarBloqueoRenglonesCompletados();
  }

  Object.assign(window, {
    confirmarAbrirCrearFactura,
    obtenerRutaFactura,
    obtenerRutaEquiposCrear,
    cerrarTodosLosModales,
    cerrarModalFactura,
    cerrarModal,
    abrirModalCrear,
    abrirModalEditar,
    verDetalles,
    abrirModalBaja,
    agregarDetalleFila,
    eliminarDetalleFila,
    renumerarIndicesFilas,
    cambiarOperacion,
    validarCantidad,
    limitarLongitud,
    calcularSubtotalFila,
    recalcularTotales,
    resetearTotales,
    generarNumeroFactura,
    inicializarDetectorRenglon,
    verificarRenglonCompletoParaEquipos,
    verificarPendientesRestantes,
    marcarRenglonCompletado,
    debugClick,
    abrirModalProveedor,
    cerrarModalProveedor,
    recargarSelectProveedores,
    cargarModelosFactura,
    cargarSectoresFactura,
    cargarModelosFacturaPorMarcaYSeleccionar,
    cargarSectoresFacturaPorUbicacionYSeleccionar,
    cargarModelosPorMarcaYSeleccionar,
    cargarSectoresPorUbicacionYSeleccionar,
    mostrarModalEquipoActual,
    abrirAltaEquipoPendiente,
    omitirEquipoActualFactura,
    cerrarConfirmAltaEquiposFactura,
    cerrarModalEquipoDesdeFactura,
    cerrarModalEquipoFactura: cerrarModalEquipoDesdeFactura,
    facturasApplyToolbarFilters: applyToolbarFilters,
  });

  window.cerrarModalEquipo = cerrarModalEquipoDesdeFactura;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFacturasPage, { once: true });
  } else {
    initFacturasPage();
  }
})();

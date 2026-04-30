function abrirModalEquiposInline(idRenglon, totalEquipos, concepto) {
    console.log('🚀 abrirModalEquiposInline', idRenglon, totalEquipos, concepto);
    
    // 1. Config inline
    window.equiposInline = {
        idRenglon, totalEquipos, concepto, creados: 0, actual: 0
    };
    
    // 2. Reutilizar overlay
    crearOverlayAlternativoEquiposInline(idRenglon);
}

function crearOverlayAlternativoEquiposInline(idRenglon) {
    const config = window.equiposInline;
    const current = config.actual + 1;
    
    // Remover anterior
    document.querySelectorAll('[id^=modalEquipoInline]').forEach(el => el.remove());
    
    const overlay = document.createElement('div');
    overlay.id = `modalEquipoInline_${idRenglon}_${current}`;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1051;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    overlay.innerHTML = `
        <div style="background:white;border-radius:8px;padding:24px;max-width:1000px;width:95%;max-height:90vh;overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:15px;">
                <h3>Equipo ${current}/${config.totalEquipos} (${config.concepto})</h3>
                <button onclick="cerrarModalInlineEquipos('${idRenglon}')" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">×</button>
            </div>
            <form id="formEquipoInline${current}">
                <!-- REUTILIZAR ESTRUCTURA EXISTENTE DE modalEquipoTemporal -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                    <div>
                        <label style="font-weight:500;">Serie *</label>
                        <input type="text" id="serieInline${current}" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div>
                        <label style="font-weight:500;">Tipo</label>
                        <select id="tipoInline${current}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;">
                            <option value="">-- Tipo --</option>
                        </select>
                    </div>
                </div>
                <!-- ... resto formulario similar a modalEquipoTemporal ... -->
                <div style="margin-top:20px;padding-top:15px;border-top:1px solid #eee;text-align:right;">
                    <button type="button" onclick="omitirEquipoInline('${idRenglon}')" style="margin-right:10px;padding:10px 20px;border:1px solid #ccc;background:#f8f9fa;border-radius:4px;cursor:pointer;">Omitir este</button>
                    <button type="button" onclick="crearEquipoInline('${idRenglon}')" style="padding:10px 30px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500;">${current === config.totalEquipos ? 'Finalizar' : 'Crear Siguiente'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cargar selects y listeners (reutilizar funciones existentes)
    cargarSelectsInline(`inline${current}`);
    
    document.getElementById(`serieInline${current}`).focus();
}

function omitirEquipoInline(idRenglon) {
    const config = window.equiposInline;
    config.actual++;
    
    if (config.actual < config.totalEquipos) {
        crearOverlayAlternativoEquiposInline(idRenglon);
    } else {
        finalizarEquiposInline(idRenglon, 0);
    }
}

function crearEquipoInline(idRenglon) {
    // Crear equipo usando /equipos/crear
    // Callback finalizarEquiposInline(idRenglon, totalCreados)
    console.log('Crear equipo inline', idRenglon);
}

function finalizarEquiposInline(idRenglon, totalCreados) {
    const fila = document.querySelector(`tr[data-index="${idRenglon}"]`);
    if (fila) {
        // Badge ✅
        const status = document.createElement('td');
        status.innerHTML = `<span class="badge badge-success fs-6">✅ ${totalCreados} creados</span>`;
        status.className = 'status-cell text-center';
        fila.appendChild(status);
        
        // Desbloquear
        fila.dataset.pendiente = 'false';
        fila.classList.remove('renglon-pendiente');
    }
    
    // Desbloquear botón
    document.getElementById('btnAgregarRenglon').disabled = false;
    
    window.renglonPendienteActual = null;
    window.equiposInline = null;
    
    mostrarToast(`✅ ${totalCreados} equipos renglón ${idRenglon}`, 'success');
}

// Export
window.abrirModalEquiposInline = abrirModalEquiposInline;


// JavaScript para gestion de Facturas - Modal Grande
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario
    initFormularioFactura();
});

// ============================================
// MODAL FACTURA - ABRIR/CERRAR
// ============================================

/**
 * Obtener ruta desde atributos data-*
 */
function obtenerRutaFactura(tipo) {
    const modal = document.getElementById('modalFactura');
    if (modal) {
        return modal.getAttribute('data-route-' + tipo) || '/' + tipo;
    }
    return '/' + tipo;
}

/**
 * Obtener ruta de crear equipo
 */
function obtenerRutaEquiposCrear() {
    const modal = document.getElementById('modalCrearEquipo');
    if (modal) {
        return modal.getAttribute('data-route-equipos-crear') || '/equipos/crear';
    }
    return '/equipos/crear';
}

/**
 * Abrir modal para crear nueva factura
 */
function abrirModalCrear() {
    // Limpiar formulario
    document.getElementById('formFactura').reset();
    document.getElementById('factura_id').value = '';
    document.getElementById('modalFacturaTitle').textContent = 'Nueva Factura';
    document.getElementById('formFactura').action = obtenerRutaFactura('crear');
    document.getElementById('btnSubmitFactura').textContent = 'Crear Factura';
    
    // Limpiar tabla de detalles
    document.getElementById('detallesBody').innerHTML = '';
    
    // Resetear totales
    resetearTotales();
    
    // Generar numero de factura automatico
    generarNumeroFactura();
    
    // Mostrar modal
    document.getElementById('modalFactura').style.display = 'block';
}

/**
 * Abrir modal para editar factura existente
 */
function abrirModalEditar(id) {
    // Buscar datos de la factura en la tabla
    const filas = document.querySelectorAll('#tablaFacturas tbody tr');
    let facturaData = null;
    
    for (let fila of filas) {
        const btn = fila.querySelector('button[onclick*="abrirModalEditar"]');
        if (btn && btn.onclick.toString().includes(id)) {
            // Extraer datos de la fila
            facturaData = {
                id: id,
                numero: fila.cells[1].textContent.trim(),
                fecha: obtenerFechaInput(fila.cells[2].textContent.trim()),
                proveedor: obtenerTextoProveedor(fila.cells[3].textContent.trim()),
                neto: obtenerValorNumerico(fila.cells[4].textContent),
                iva105: obtenerValorNumerico(fila.cells[5].textContent),
                iva21: obtenerValorNumerico(fila.cells[6].textContent),
                total: obtenerValorNumerico(fila.cells[7].textContent),
                observacion: obtenerTextoObservacion(fila)
            };
            break;
        }
    }
    
    if (!facturaData) {
        showToast('No se encontraron los datos de la factura', 'error');
        return;
    }
    
    // Llenar formulario
    document.getElementById('factura_id').value = facturaData.id;
    document.getElementById('numero').value = facturaData.numero;
    document.getElementById('fecha').value = facturaData.fecha || new Date().toISOString().split('T')[0];
    document.getElementById('observacion').value = '';
    
    // Seleccionar proveedor
    const selectProveedor = document.getElementById('idProveedor');
    const opciones = selectProveedor.options;
    for (let i = 0; i < opciones.length; i++) {
        if (opciones[i].text === facturaData.proveedor) {
            opciones[i].selected = true;
            break;
        }
    }
    
    // Actualizar titulo y boton
    document.getElementById('modalFacturaTitle').textContent = 'Editar Factura';
    document.getElementById('formFactura').action = '/facturas/' + id + '/actualizar';
    document.getElementById('btnSubmitFactura').textContent = 'Guardar Cambios';
    
    // Aqui se podrian cargar los detalles existentes si el backend los provee
    document.getElementById('detallesBody').innerHTML = '';
    
    // Mostrar modal
    document.getElementById('modalFactura').style.display = 'block';
}

/**
 * Obtener fecha en formato YYYY-MM-DD desde texto DD/MM/YYYY
 */
function obtenerFechaInput(texto) {
    if (!texto || texto === '-') return '';
    const partes = texto.split('/');
    if (partes.length === 3) {
        return partes[2] + '-' + partes[1] + '-' + partes[0];
    }
    return '';
}

/**
 * Obtener texto de proveedor desde la celda
 */
function obtenerTextoProveedor(texto) {
    return texto.trim();
}

/**
 * Obtener valor numerico de texto con formato
 */
function obtenerValorNumerico(texto) {
    if (!texto) return 0;
    return parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Obtener observacion de la fila (ultima celda visible)
 */
function obtenerTextoObservacion(fila) {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 9) {
        return celdas[8].textContent.trim();
    }
    return '';
}

/**
 * Cerrar modal de factura
 */
function cerrarModalFactura() {
    document.getElementById('modalFactura').style.display = 'none';
}

// ============================================
// NUMERO DE FACTURA AUTOMATICO
// ============================================

/**
 * Generar numero de factura automatico (formato: AAA-00000000)
 */
function generarNumeroFactura() {
    const ahora = new Date();
    const anio = ahora.getFullYear().toString().slice(-2);
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    const prefijo = anio + mes + dia;
    
    fetch(obtenerRutaFactura('siguiente-numero'))
        .then(response => response.json())
        .then(data => {
            document.getElementById('numero').value = data.numero;
        })
        .catch(error => {
            console.error('Error al generar numero:', error);
            document.getElementById('numero').value = prefijo + '-00000001';
        });
}

// ============================================
// TABLA DE DETALLES
// ============================================

/**
 * Agregar nueva fila de detalle a la tabla
 */
function agregarDetalleFila() {
    const tbody = document.getElementById('detallesBody');
    const rowIndex = tbody.children.length;
    
    const fila = document.createElement('tr');
    fila.className = 'detalle-row';
    fila.dataset.index = rowIndex;
    
    fila.innerHTML = `
        <td>
            <select name="detalles[${rowIndex}][operacion]" 
                class="form-control input-operacion" 
                onchange="cambiarOperacion(this)">
                <option value="">--</option>
                <option value="compra">Compra</option>
                <option value="mano_obra">Mano de obra</option>
            </select>
        </td>
        <td>
            <select name="detalles[${rowIndex}][de]" 
                class="form-control input-de" 
                disabled>
                <option value="">--</option>
            </select>
        </td>
        <td>
            <input type="number" name="detalles[${rowIndex}][cantidad]" 
                value="1" min="0" step="0.0001" 
                class="form-control input-cantidad text-right" 
                onchange="calcularSubtotalFila(this)" required>
        </td>
        <td>
            <input type="text" name="detalles[${rowIndex}][concepto]" 
                placeholder="Concepto..." maxlength="150" 
                class="form-control input-concepto" required>
        </td>
        <td>
            <input type="number" name="detalles[${rowIndex}][precioUnitario]" 
                value="0" min="0" step="0.0001" 
                class="form-control input-precio text-right" 
                onchange="calcularSubtotalFila(this)" required>
        </td>
        <td>
            <select name="detalles[${rowIndex}][porcentajeIva]" 
                class="form-control input-iva">
                <option value="0">0%</option>
                <option value="10.5">10.5%</option>
                <option value="21" selected>21%</option>
            </select>
        </td>
        <td>
            <input type="number" name="detalles[${rowIndex}][porcentajeDto]" 
                value="0" min="0" max="100" step="0.0001" 
                class="form-control input-bonif text-right" 
                onchange="calcularSubtotalFila(this)">
        </td>
        <td>
            <input type="text" name="detalles[${rowIndex}][obra]" 
                placeholder="Obra..." maxlength="100" 
                class="form-control input-obra">
        </td>
        <td>
            <input type="text" class="form-control input-subtotal text-right" 
                value="0.0000" readonly>
            <input type="hidden" name="detalles[${rowIndex}][subtotal]" class="input-subtotal-hidden" value="0">
        </td>
        <td class="text-center">
            <button type="button" class="btn-icon btn-delete" 
                onclick="eliminarDetalleFila(this)" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(fila);
}

/**
 * Eliminar fila de detalle
 */
function eliminarDetalleFila(boton) {
    const fila = boton.closest('tr');
    fila.remove();
    renumerarIndicesFilas();
    recalcularTotales();
}

/**
 * Renumerar indices de las filas despues de eliminar
 */
function renumerarIndicesFilas() {
    const filas = document.querySelectorAll('#detallesBody tr');
    filas.forEach((fila, index) => {
        fila.dataset.index = index;
        
        const inputs = fila.querySelectorAll('input, select');
        inputs.forEach(input => {
            const name = input.getAttribute('name');
            if (name && name.includes('detalles[')) {
                const newName = name.replace(/detalles\[\d+\]/, `detalles[${index}]`);
                input.setAttribute('name', newName);
            }
        });
    });
}

/**
 * Cambiar operacion - actualiza opciones de "De..."
 */
function cambiarOperacion(select) {
    const fila = select.closest('tr');
    const deSelect = fila.querySelector('.input-de');
    const operacion = select.value;
    
    deSelect.innerHTML = '<option value="">--</option>';
    
    if (operacion === 'compra') {
        deSelect.innerHTML = `
            <option value="">--</option>
            <option value="Equipo">Equipo</option>
            <option value="Herramienta">Herramienta</option>
            <option value="Material">Material</option>
        `;
        deSelect.disabled = false;
    } else if (operacion === 'mano_obra') {
        deSelect.innerHTML = `
            <option value="">--</option>
            <option value="Sucursal">Sucursal</option>
            <option value="Equipo">Equipo</option>
        `;
        deSelect.disabled = false;
    } else {
        deSelect.disabled = true;
    }
}

// ============================================
// CALCULOS DE SUBTOTAL Y TOTALES
// ============================================

/**
 * Calcular subtotal de una fila
 */
function calcularSubtotalFila(input) {
    const fila = input.closest('tr');
    const cantidad = parseFloat(fila.querySelector('.input-cantidad').value) || 0;
    const precio = parseFloat(fila.querySelector('.input-precio').value) || 0;
    const bonif = parseFloat(fila.querySelector('.input-bonif').value) || 0;
    
    let subtotal = cantidad * precio;
    
    if (bonif > 0) {
        subtotal -= subtotal * (bonif / 100);
    }
    
    fila.querySelector('.input-subtotal').value = subtotal.toFixed(4);
    fila.querySelector('.input-subtotal-hidden').value = subtotal.toFixed(4);
    
    recalcularTotales();
}

/**
 * Resetear todos los totales a cero
 */
function resetearTotales() {
    document.getElementById('importeBonificacion').value = '0';
    document.getElementById('importeBonificacionDisplay').value = '0.0000';
    document.getElementById('iva105Display').value = '0.0000';
    document.getElementById('iva21Display').value = '0.0000';
    document.getElementById('netoDisplay').value = '0.0000';
    document.getElementById('totalDisplay').value = '0.0000';
}

/**
 * Recalcular todos los totales de la factura
 */
function recalcularTotales() {
    let subtotalGeneral = 0;
    let iva105 = 0;
    let iva21 = 0;
    
    const filas = document.querySelectorAll('#detallesBody tr');
    filas.forEach(fila => {
        const subtotal = parseFloat(fila.querySelector('.input-subtotal').value) || 0;
        const ivaPorcentaje = parseFloat(fila.querySelector('.input-iva').value) || 0;
        
        subtotalGeneral += subtotal;
        
        if (ivaPorcentaje === 10.5) {
            iva105 += subtotal * 0.105;
        } else if (ivaPorcentaje === 21) {
            iva21 += subtotal * 0.21;
        }
    });
    
    const porcentajeBonif = parseFloat(document.getElementById('porcentajeBonificacion').value) || 0;
    const importeBonif = subtotalGeneral * (porcentajeBonif / 100);
    const neto = subtotalGeneral - importeBonif;
    const total = neto + iva105 + iva21;
    
    document.getElementById('importeBonificacion').value = importeBonif.toFixed(4);
    document.getElementById('importeBonificacionDisplay').value = importeBonif.toFixed(4);
    document.getElementById('iva105Display').value = iva105.toFixed(4);
    document.getElementById('iva21Display').value = iva21.toFixed(4);
    document.getElementById('netoDisplay').value = neto.toFixed(4);
    document.getElementById('totalDisplay').value = total.toFixed(4);
}

// ============================================
// MODALES DE BAJA Y ALTA
// ============================================

function abrirModalBaja(id, numero) {
    document.getElementById('baja_id').value = id;
    document.getElementById('baja_numero').textContent = numero;
    document.getElementById('baja_observacion').value = '';
    document.getElementById('formBajaFactura').action = '/facturas/' + id + '/baja';
    document.getElementById('modalBajaFactura').style.display = 'block';
}

function abrirModalAlta(id, numero) {
    document.getElementById('alta_id').value = id;
    document.getElementById('alta_numero').textContent = numero;
    document.getElementById('formAltaFactura').action = '/facturas/' + id + '/alta';
    document.getElementById('modalAltaFactura').style.display = 'block';
}

function verDetalles(id) {
    showToast('Ver detalles de factura #' + id, 'info');
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ============================================
// INICIALIZAR FORMULARIO
// ============================================

function initFormularioFactura() {
    const form = document.getElementById('formFactura');
    if (form) {
        form.addEventListener('submit', function(e) {
            const detalles = document.querySelectorAll('#detallesBody tr');
            if (detalles.length === 0) {
                e.preventDefault();
                showToast('Debe agregar al menos un renglon a la factura', 'warning');
                return false;
            }
            
            let hayError = false;
            detalles.forEach((fila, index) => {
                const operacion = fila.querySelector('.input-operacion').value;
                const de = fila.querySelector('.input-de').value;
                
                if (operacion && de === '') {
                    hayError = true;
                    showToast('Debe seleccionar "De..." en el renglon ' + (index + 1), 'warning');
                }
            });
            
            if (hayError) {
                e.preventDefault();
                return false;
            }
            
            return true;
        });
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type) {
    type = type || 'info';
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">&times;</button>';
    
    toastContainer.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================
// CERRAR MODALES AL HACER CLIC FUERA
// ============================================

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// ============================================
// CREACION DE EQUIPOS DESDE FACTURA
// ============================================

let equiposPendientes = [];
let indiceEquipoActual = 0;

function mostrarModalProgresoEquipos() {
    equiposPendientes = window.equiposPorCrear || [];
    
    if (equiposPendientes.length === 0) {
        return;
    }
    
    const filas = document.querySelectorAll('#tablaFacturas tbody tr');
    let numeroFactura = 'N/A';
    if (filas.length > 0) {
        numeroFactura = filas[0].cells[1].textContent.trim();
    }
    
    document.getElementById('progresoFacturaNumero').textContent = numeroFactura;
    document.getElementById('progresoTotalEquipos').textContent = equiposPendientes.length;
    document.getElementById('progresoBarra').style.width = '0%';
    document.getElementById('progresoBarra').textContent = '0%';
    
    document.getElementById('modalProgresoEquipos').style.display = 'block';
}

function iniciarCreacionEquipos() {
    document.getElementById('modalProgresoEquipos').style.display = 'none';
    
    if (equiposPendientes.length > 0) {
        indiceEquipoActual = 0;
        mostrarModalEquipoActual();
    }
}

function mostrarModalEquipoActual() {
    if (indiceEquipoActual >= equiposPendientes.length) {
        showToast('Proceso de creacion de equipos completado', 'success');
        window.equiposPorCrear = [];
        window.idFacturaActual = null;
        window.idProveedorActual = null;
        return;
    }
    
    const equipo = equiposPendientes[indiceEquipoActual];
    const total = equiposPendientes.length;
    
    document.getElementById('equipoCounter').textContent = '(' + (indiceEquipoActual + 1) + '/' + total + ')';
    
    document.getElementById('equipoIdFactura').value = window.idFacturaActual || '';
    document.getElementById('equipoIdDetalleFactura').value = equipo.idDetalle || '';
    
    if (window.idProveedorActual) {
        document.getElementById('equipoFacturaProveedor').value = window.idProveedorActual;
    }
    
    document.getElementById('equipoFacturaSerie').value = '';
    document.getElementById('equipoFacturaTipo').value = '';
    document.getElementById('equipoFacturaMarca').value = '';
    document.getElementById('equipoFacturaModelo').innerHTML = '<option value="">— Sin especificar —</option>';
    document.getElementById('equipoFacturaUbicacion').value = '';
    document.getElementById('equipoFacturaSector').innerHTML = '<option value="">— Sin especificar —</option>';
    document.getElementById('equipoFacturaVtoGarantia').value = '';
    document.getElementById('equipoFacturaPrecio').value = '';
    document.getElementById('equipoFacturaObservacion').value = 'Creado desde factura - ' + (equipo.concepto || '');
    
    document.getElementById('btnSubmitEquipoFactura').textContent = indiceEquipoActual === total - 1 ? 'Crear y Finalizar' : 'Crear Siguiente';
    
    document.getElementById('modalCrearEquipo').style.display = 'block';
    
    setTimeout(function() {
        document.getElementById('equipoFacturaSerie').focus();
    }, 100);
}

function cerrarModalEquipoFactura() {
    if (confirm('Esta seguro de omitir este equipo? Podra crearlo manualmente despues.')) {
        document.getElementById('modalCrearEquipo').style.display = 'none';
        indiceEquipoActual++;
        actualizarProgreso();
        mostrarModalEquipoActual();
    }
}

function omitirTodosEquipos() {
    if (confirm('Esta seguro de omitir todos los equipos restantes? Podra crearlos manualmente despues.')) {
        document.getElementById('modalProgresoEquipos').style.display = 'none';
        showToast('Equipos omitidos. Puede crearlos manualmente desde la seccion Equipos.', 'info');
        window.equiposPorCrear = [];
        window.idFacturaActual = null;
        window.idProveedorActual = null;
    }
}

function actualizarProgreso() {
    const progreso = Math.round((indiceEquipoActual / equiposPendientes.length) * 100);
    document.getElementById('progresoBarra').style.width = progreso + '%';
    document.getElementById('progresoBarra').textContent = progreso + '%';
}

function cargarModelosFactura(idMarca) {
    const modeloSelect = document.getElementById('equipoFacturaModelo');
    modeloSelect.innerHTML = '<option value="">— Sin especificar —</option>';
    
    if (!idMarca) {
        return;
    }
    
    fetch('/modelos/marca/' + idMarca)
        .then(response => response.json())
        .then(modelos => {
            modelos.forEach(function(modelo) {
                const option = document.createElement('option');
                option.value = modelo.idModelo;
                option.textContent = modelo.modelo;
                modeloSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar modelos:', error);
        });
}

function cargarSectoresFactura(idUbicacion) {
    const sectorSelect = document.getElementById('equipoFacturaSector');
    sectorSelect.innerHTML = '<option value="">— Sin especificar —</option>';
    
    if (!idUbicacion) {
        return;
    }
    
    fetch('/api/sectores/ubicacion/' + idUbicacion)
        .then(response => response.json())
        .then(sectores => {
            sectores.forEach(function(sector) {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = sector.nombre;
                sectorSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar sectores:', error);
        });
}

// Manejar submit del formulario de equipo desde factura
document.addEventListener('DOMContentLoaded', function() {
    const formEquipo = document.getElementById('formEquipoFactura');
    if (formEquipo) {
        formEquipo.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(formEquipo);
            
            fetch(obtenerRutaEquiposCrear(), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Equipo creado correctamente', 'success');
                    formEquipo.reset();
                    
                    document.getElementById('modalCrearEquipo').style.display = 'none';
                    indiceEquipoActual++;
                    actualizarProgreso();
                    
                    if (indiceEquipoActual >= equiposPendientes.length) {
                        showToast('Todos los equipos han sido creados', 'success');
                        window.equiposPorCrear = [];
                        window.idFacturaActual = null;
                        window.idProveedorActual = null;
                    } else {
                        mostrarModalEquipoActual();
                    }
                } else {
                    showToast('Error al crear equipo: ' + (data.message || 'Error desconocido'), 'error');
                }
            })
            .catch(error => {
                showToast('Error al crear equipo: ' + error.message, 'error');
            });
        });
    }
});

// ============================================
// EXPORTAR FUNCIONES GLOBALMENTE
// ============================================

window.abrirModalCrear = abrirModalCrear;
window.abrirModalEditar = abrirModalEditar;
window.cerrarModalFactura = cerrarModalFactura;
window.cerrarModal = cerrarModal;
window.agregarDetalleFila = agregarDetalleFila;
window.eliminarDetalleFila = eliminarDetalleFila;
window.cambiarOperacion = cambiarOperacion;
window.calcularSubtotalFila = calcularSubtotalFila;
window.recalcularTotales = recalcularTotales;
window.generarNumeroFactura = generarNumeroFactura;
window.abrirModalBaja = abrirModalBaja;
window.abrirModalAlta = abrirModalAlta;
window.verDetalles = verDetalles;
window.mostrarModalProgresoEquipos = mostrarModalProgresoEquipos;
window.iniciarCreacionEquipos = iniciarCreacionEquipos;
window.cargarModelosFactura = cargarModelosFactura;
window.cargarSectoresFactura = cargarSectoresFactura;
window.cerrarModalEquipoFactura = cerrarModalEquipoFactura;
window.omitirTodosEquipos = omitirTodosEquipos;
window.obtenerRutaFactura = obtenerRutaFactura;
window.obtenerRutaEquiposCrear = obtenerRutaEquiposCrear;


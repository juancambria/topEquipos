<!-- ============================================
     MODAL CREAR/EDITAR FACTURA
     ============================================ -->
<div id="modalFactura" class="modal" data-route-crear="{{ route('facturas.crear') }}" data-route-siguiente-numero="{{ route('facturas.siguienteNumero') }}">
    <div class="modal-dialog modal-xxl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalFacturaTitle">Nueva Factura</h5>
                <button type="button" class="close" onclick="cerrarModalFactura()">
                    <span>&times;</span>
                </button>
            </div>
            <form action="{{ route('facturas.crear') }}" method="POST" id="formFactura">
                @csrf
                <input type="hidden" name="id" id="factura_id">
                <div class="modal-body">
                    
                    <!-- DATOS PRINCIPALES -->
                    <div class="datos-factura">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="numero">Numero de Factura *</label>
                                <input type="text" name="numero" id="numero" required 
                                    maxlength="20" placeholder="AAA-00000000" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="fecha">Fecha</label>
                                <input type="date" name="fecha" id="fecha" value="{{ date('Y-m-d') }}" class="form-control">
                            </div>
                            <div class="form-group flex-2">
                                <label for="idProveedor">Proveedor *</label>
                                <select name="idProveedor" id="idProveedor" required class="form-control">
                                    <option value="">Seleccionar proveedor...</option>
                                    @foreach($proveedores as $proveedor)
                                        <option value="{{ $proveedor->idProveedor }}">{{ $proveedor->proveedor }}</option>
                                    @endforeach
                                </select>
                            </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="idOrdenDeCompra">Orden de Compra</label>
                                <input type="number" name="idOrdenDeCompra" id="idOrdenDeCompra" 
                                    placeholder="Opcional" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="idPresupuesto">Presupuesto</label>
                                <input type="number" name="idPresupuesto" id="idPresupuesto" 
                                    placeholder="Opcional" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="obra">Obra</label>
                                <input type="text" name="obra" id="obra" 
                                    placeholder="Opcional" maxlength="100" class="form-control">
                            </div>
                        
                        <div class="form-group">
                            <label for="descripcion_contenido">Descripcion del Contenido</label>
                            <textarea name="descripcion_contenido" id="descripcion_contenido" 
                                rows="2" placeholder="Descripcion opcional del contenido..." class="form-control"></textarea>
                        </div>

                    <!-- TABLA DE DETALLES -->
                    <div class="detalles-section">
                        <div class="section-header">
                            <h6>Equipos/Items de la Factura</h6>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="agregarDetalleFila()">
                                <i class="fas fa-plus"></i> Agregar Renglon
                            </button>
                        </div>
                        <table class="detalles-table">
                            <thead>
                                <tr>
                                    <th width="100">Operacion</th>
                                    <th width="120">De...</th>
                                    <th width="70">Cantidad</th>
                                    <th>Concepto</th>
                                    <th width="100">Precio Unit.</th>
                                    <th width="60">% IVA</th>
                                    <th width="70">% Bonif</th>
                                    <th width="100">Obra</th>
                                    <th width="100">SubTotal</th>
                                    <th width="40"></th>
                                </tr>
                            </thead>
                            <tbody id="detallesBody"></tbody>
                        </table>
                    </div>

                    <!-- TOTALES - PANEL REDISEÑADO -->
                    <div class="totales-panel-redisenado">
                        <div class="totales-grid">
                            <!-- Bonificaciones -->
                            <div class="totales-item bonificacion">
                                <div class="totales-item-header">
                                    <label>Bonificación</label>
                                </div>
                                <div class="totales-item-content">
                                    <div class="totales-input-group">
                                        <span class="label">% Bon. Vuelta</span>
                                        <input type="number" name="porcentajeBonificacion" id="porcentajeBonificacion"
                                            value="0" min="0" max="100" step="0.0001" 
                                            onchange="recalcularTotales()" class="form-control">
                                    </div>
                                    <div class="totales-display">
                                        <span class="label">Importe</span>
                                        <span class="valor" id="importeBonificacionDisplay">0.0000</span>
                                        <input type="hidden" name="importeBonificacion" id="importeBonificacion" value="0">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- IVA -->
                            <div class="totales-item iva">
                                <div class="totales-item-header">
                                    <label>IVA</label>
                                </div>
                                <div class="totales-item-content">
                                    <div class="totales-display">
                                        <span class="label">IVA 10.5%</span>
                                        <span class="valor" id="iva105Display">0.0000</span>
                                    </div>
                                    <div class="totales-display">
                                        <span class="label">IVA 21%</span>
                                        <span class="valor" id="iva21Display">0.0000</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Totales -->
                            <div class="totales-item totales">
                                <div class="totales-item-header">
                                    <label>Totales</label>
                                </div>
                                <div class="totales-item-content">
                                    <div class="totales-display neto">
                                        <span class="label">Neto</span>
                                        <span class="valor" id="netoDisplay">0.0000</span>
                                    </div>
                                    <div class="totales-display total-final">
                                        <span class="label">TOTAL</span>
                                        <span class="valor" id="totalDisplay">0.0000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- OBSERVACION -->
                        <div class="observacion-section">
                            <div class="form-group">
                                <label for="observacion">Observación General</label>
                                <textarea name="observacion" id="observacion" rows="2" 
                                    placeholder="Observaciones adicionales..." class="form-control"></textarea>
                            </div>
                        </div>
                        
                        <!-- BOTONES -->
                        <div class="totales-footer">
                            <button type="button" class="btn btn-secondary btn-lg" onclick="cerrarModalFactura()">Cancelar</button>
                            <button type="submit" class="btn btn-primary btn-lg" id="btnSubmitFactura">Crear Factura</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL VER DETALLES
     ============================================ -->
<div id="modalVerFactura" class="modal">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Detalles de Factura</h5>
                <button type="button" class="close" onclick="cerrarModal('modalVerFactura')">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" id="facturaDetalleContent"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="cerrarModal('modalVerFactura')">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL BAJA
     ============================================ -->
<div id="modalBajaFactura" class="modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Dar de Baja Factura</h5>
                <button type="button" class="close" onclick="cerrarModal('modalBajaFactura')">
                    <span>&times;</span>
                </button>
            </div>
            <form action="#" method="POST" id="formBajaFactura">
                @csrf
                @method('PUT')
                <input type="hidden" name="id" id="baja_id">
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Atencion!</strong> Esta accion dara de baja la factura.
                    </div>
                    <p>Esta seguro de dar de baja la factura <strong id="baja_numero"></strong>?</p>
                    <div class="form-group">
                        <label for="baja_observacion">Motivo de la baja *</label>
                        <textarea name="observacion" id="baja_observacion" required rows="3" 
                            placeholder="Ingrese el motivo de la baja..." class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModal('modalBajaFactura')">Cancelar</button>
                    <button type="submit" class="btn btn-danger">Confirmar Baja</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL ALTA
     ============================================ -->
<div id="modalAltaFactura" class="modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Reactivar Factura</h5>
                <button type="button" class="close" onclick="cerrarModal('modalAltaFactura')">
                    <span>&times;</span>
                </button>
            </div>
            <form action="#" method="POST" id="formAltaFactura">
                @csrf
                @method('PUT')
                <input type="hidden" name="id" id="alta_id">
                <div class="modal-body">
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i>
                        <strong>Atencion!</strong> Esta accion reactivara la factura.
                    </div>
                    <p>Esta seguro de reactivas la factura <strong id="alta_numero"></strong>?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModal('modalAltaFactura')">Cancelar</button>
                    <button type="submit" class="btn btn-success">Confirmar Reactivacion</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL CREAR EQUIPO
     ============================================ -->
<div id="modalCrearEquipo" class="modal" data-route-equipos-crear="{{ route('equipos.crear') }}">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Crear Equipo <span id="equipoCounter">(1/3)</span></h5>
                <button type="button" class="close" onclick="cerrarModalEquipoFactura()">
                    <span>&times;</span>
                </button>
            </div>
            <form action="{{ route('equipos.crear') }}" method="POST" id="formEquipoFactura" enctype="multipart/form-data">
                @csrf
                <input type="hidden" name="idFactura" id="equipoIdFactura" value="">
                <input type="hidden" name="idDetalleFactura" id="equipoIdDetalleFactura" value="">
                <input type="hidden" name="origen" value="factura">
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Equipo desde Factura:</strong> Complete los datos del equipo para continuar.
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="equipoFacturaSerie">Serie *</label>
                            <input type="text" name="serie" id="equipoFacturaSerie" required 
                                maxlength="50" placeholder="Numero de serie..." class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="equipoFacturaProveedor">Proveedor</label>
                            <select name="idProveedor" id="equipoFacturaProveedor" class="form-control">
                                <option value="">— Sin especificar —</option>
                                @foreach($proveedores as $proveedor)
                                    <option value="{{ $proveedor->idProveedor }}">{{ $proveedor->proveedor }}</option>
                                @endforeach
                            </select>
                        </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="equipoFacturaTipo">Tipo</label>
                            <select name="idTipo" id="equipoFacturaTipo" class="form-control">
                                <option value="">— Sin especificar —</option>
                                @foreach(\App\Models\Tipo::activos()->get() as $tipo)
                                    <option value="{{ $tipo->idTipo }}">{{ $tipo->nombreTipo }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="equipoFacturaMarca">Marca *</label>
                            <select name="idMarca" id="equipoFacturaMarca" required class="form-control" onchange="cargarModelosFactura(this.value)">
                                <option value="">— Sin especificar —</option>
                                @foreach(\App\Models\Marca::activos()->get() as $marca)
                                    <option value="{{ $marca->idMarca }}">{{ $marca->marca }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="equipoFacturaModelo">Modelo *</label>
                            <select name="idModelo" id="equipoFacturaModelo" required class="form-control">
                                <option value="">— Sin especificar —</option>
                            </select>
                        </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="equipoFacturaUbicacion">Ubicacion</label>
                            <select name="ubicacion_id" id="equipoFacturaUbicacion" class="form-control" onchange="cargarSectoresFactura(this.value)">
                                <option value="">— Sin especificar —</option>
                                @foreach(\App\Models\Ubicacion::activos()->get() as $ubicacion)
                                    <option value="{{ $ubicacion->id }}">{{ $ubicacion->nombre }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="equipoFacturaSector">Sector</label>
                            <select name="sector_id" id="equipoFacturaSector" class="form-control">
                                <option value="">— Sin especificar —</option>
                            </select>
                        </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="equipoFacturaVtoGarantia">Vto. Garantia</label>
                            <input type="date" name="vtoGarantia" id="equipoFacturaVtoGarantia" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="equipoFacturaPrecio">Precio</label>
                            <input type="number" step="0.01" name="precio" id="equipoFacturaPrecio" 
                                placeholder="0.00" class="form-control text-right">
                        </div>
                    
                    <div class="form-group">
                        <label for="equipoFacturaObservacion">Observacion</label>
                        <textarea name="observacion" id="equipoFacturaObservacion" rows="2" 
                            placeholder="Observaciones del equipo..." class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalEquipoFactura()">Omitir / Saltar</button>
                    <button type="submit" class="btn btn-primary" id="btnSubmitEquipoFactura">Crear Equipo</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL PROGRESO
     ============================================ -->
<div id="modalProgresoEquipos" class="modal">
    <div class="modal-dialog modal-md">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Creando Equipos desde Factura</h5>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <i class="fas fa-clipboard-list"></i>
                    <strong>Factura guardada:</strong> <span id="progresoFacturaNumero"></span>
                </div>
                <p>La factura tiene <strong id="progresoTotalEquipos"></strong> equipo(s) por crear.</p>
                <p>Haga clic en "Continuar" para comenzar a crear los equipos.</p>
                <div class="progress-container">
                    <div class="progress-bar" id="progresoBarra" style="width: 0%;">0%</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="omitirTodosEquipos()">Omitir Todos</button>
                <button type="button" class="btn btn-primary" onclick="iniciarCreacionEquipos()">Continuar</button>
            </div>
        </div>
    </div>
</div>


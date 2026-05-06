<!-- ============================================
     MODAL CREAR/EDITAR FACTURA
     ============================================ -->
<div id="modalFactura" class="modal" data-modal-focus="#numero" data-route-crear="{{ route('facturas.crear') }}" data-route-siguiente-numero="{{ route('facturas.siguienteNumero') }}">
    <div class="modal-dialog modal-xxl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalFacturaTitle">Nueva Factura</h5>
                <button type="button" class="close" onclick="cerrarModalFactura()">
                    <span>&times;</span>
                </button>
            </div>
            <form action="{{ route('facturas.crear') }}" method="POST" id="formFactura" enctype="multipart/form-data">
                @csrf
                <input type="hidden" name="id" id="factura_id">
                <input type="hidden" name="_method" id="form_method" value="">
                <div class="modal-body">
                    
                    <!-- DATOS PRINCIPALES -->
                    <div class="datos-factura">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="numero">Numero de Factura *</label>
                                <input type="text" name="numero" id="numero" required
                                    maxlength="20" placeholder="00000-00000000"
                                    title="Formato 00000-00000000 (5 dígitos, guion, 8 dígitos)"
                                    inputmode="numeric" autocomplete="off"
                                    class="form-control input-numero-factura">
                            </div>
                            <div class="form-group">
                                <label for="fecha">Fecha</label>
                                <input type="date" name="fecha" id="fecha" value="" class="form-control">
                            </div>
                            <div class="form-group flex-2">
                                <label for="idProveedor">Proveedor *</label>
                                <div class="input-group">
                                    <select name="idProveedor" id="idProveedor" required class="form-control">
                                        <option value="">Seleccionar proveedor...</option>
                                        @foreach($proveedores as $proveedor)
                                            <option value="{{ $proveedor->idProveedor }}">{{ $proveedor->proveedor }}</option>
                                        @endforeach
                                    </select>
                                    <div class="input-group-append">
                                        <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Proveedor')" title="Crear nuevo proveedor" aria-label="Agregar proveedor">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="idOrdenDeCompra">Orden de Compra</label>
                                <input type="number" name="idOrdenDeCompra" id="idOrdenDeCompra" 
                                    placeholder="Opcional" class="form-control" max="999999"
                                    oninput="limitarLongitud(this, 6)">
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
                        </div>
                        
                        <div class="form-group">
                            <label for="descripcion_contenido">Descripcion del Contenido</label>
                            <textarea name="descripcion_contenido" id="descripcion_contenido" 
                                rows="2" placeholder="Descripcion opcional del contenido..." class="form-control"></textarea>
                        </div>
                    </div>

                    <!-- TABLA DE DETALLES -->
                    <div class="detalles-section">
                        <div class="section-header">
                            <h6>Equipos/Items de la Factura</h6>
                            <button type="button" class="btn btn-primario btn-sm" onclick="agregarDetalleFila()">
                                + Agregar Renglon
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
                                    <th width="80">% IVA</th>
                                    <th width="70">% Bonif</th>
                                    <th width="100">Obra</th>
                                    <th width="100">SubTotal</th>
                                    <th width="78"></th>
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

                        <div class="factura-upload-pdfs-card">
                            <div class="factura-upload-pdfs-head">
                                <span class="factura-upload-pdfs-icon" aria-hidden="true">📎</span>
                                <div>
                                    <strong class="factura-upload-pdfs-title">PDF de la factura</strong>
                                    <p class="factura-upload-pdfs-sub">Arrastrá archivos dentro o tocá esta zona cuando esté vacía; con archivos cargados podés usar el botón «+ Añadir PDF». Los límites figuran debajo.</p>
                                </div>
                            </div>

                            <div id="facturaPdfDropzone" class="factura-pdf-zone">
                                <input type="file" name="pdfs[]" id="factura_pdfs" multiple
                                    accept="application/pdf,.pdf" class="factura-pdf-input-sronly">
                                <div id="facturaPdfZoneBody" class="factura-pdf-zone-body factura-pdf-zone-body--empty">
                                    <div id="facturaPdfTilesMerged" class="factura-pdf-tiles-grid" aria-live="polite"></div>
                                    <label id="facturaPdfZoneAddHit" class="factura-pdf-zone-add-hit" for="factura_pdfs">
                                        <span id="facturaPdfTilesEmptyHint" class="factura-pdf-zone-visual">
                                            <span class="factura-pdf-zone-empty-icon" aria-hidden="true">📄</span>
                                            <span class="factura-pdf-zone-cta">Tocá o soltá tus PDF aquí</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <p id="facturaPdfsCapacidadTexto" class="factura-pdf-cap-line"></p>
                        </div>
                        
                        <!-- BOTONES -->
                        <div class="totales-footer">
                            <button type="button" class="btn btn-secundario btn-lg" onclick="cerrarModalFactura()">Cancelar</button>
                            <button type="submit" class="btn btn-primario btn-lg" id="btnSubmitFactura">Crear Factura</button>
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
<div id="modalVerFactura" class="modal" data-modal-focus=".modal-footer .btn">
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
                <button type="button" class="btn btn-secundario" onclick="cerrarModal('modalVerFactura')">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL BAJA / ELIMINAR
     ============================================ -->
<div id="modalBajaFactura" class="modal" data-modal-focus="#baja_observacion">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Eliminar factura</h5>
                <button type="button" class="close" onclick="cerrarModal('modalBajaFactura')">
                    <span>&times;</span>
                </button>
            </div>
            <form action="#" method="POST" id="formBajaFactura">
                @csrf
                @method('DELETE')
                <input type="hidden" name="id" id="baja_id">
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Atención.</strong> La factura se eliminará de forma permanente (y sus renglones). Esta acción no se puede deshacer.
                    </div>
                    <p>¿Eliminar la factura <strong id="baja_numero"></strong>?</p>
                    <div class="form-group">
                        <label for="baja_observacion">Nota (opcional)</label>
                        <textarea name="observacion" id="baja_observacion" rows="3" 
                            placeholder="Motivo o comentario interno..." class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secundario" onclick="cerrarModal('modalBajaFactura')">Cancelar</button>
                    <button type="submit" class="btn btn-danger">Eliminar factura</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ELIMINADO: modalCrearEquipo duplicado (usar #modalEquipo) -->

<!-- ============================================
     MODAL PROVEEDOR DESDE FACTURAS 
     ============================================ -->
<div id="modalProveedor" class="modal-overlay" data-modal-focus="#proveedorNombre" aria-hidden="true" style="z-index: 120000;" data-contexto="factura">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalProveedorTitulo">Nuevo Proveedor</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalProveedor()" aria-label="Cerrar">&times;</button>
        </div>
<form id="formProveedor" method="POST" action="/proveedores/crear" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="proveedorNombre">Proveedor *</label>
                <input type="text" id="proveedorNombre" name="proveedor" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorMail">Mail</label>
                <input type="email" id="proveedorMail" name="mail" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorDireccion">Dirección</label>
                <input type="text" id="proveedorDireccion" name="direccion" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorCiudad">Ciudad</label>
                <input type="text" id="proveedorCiudad" name="ciudad" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorProvincia">Provincia</label>
                <input type="text" id="proveedorProvincia" name="provincia" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorCodigoPostal">Código Postal</label>
                <input type="text" id="proveedorCodigoPostal" name="codigo_postal" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalProveedor()">Cancelar</button>
                <button type="submit" id="modalProveedorSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

<!-- ELIMINADO: modalProgresoEquipos obsoleto (nuevo flujo inline) -->

<!-- ============================================
     MODAL CONFIRMAR ALTA DE EQUIPOS (sin alert del navegador)
     ============================================ -->
<div id="modalConfirmAltaEquiposFactura" class="modal-overlay" data-modal-focus="#btnConfirmAltaEquiposFactura" aria-hidden="true">
    <div class="modal-sector" style="max-width: 520px;">
        <div class="modal-sector-header">
            <h2>Alta de Equipos Requerida</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarConfirmAltaEquiposFactura()" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <p id="confirmAltaEquiposTexto" style="margin-bottom: 14px;"></p>
            <div class="alert alert-warning" style="margin-bottom: 14px;">
                Este renglón quedará bloqueado hasta completar u omitir la carga de equipos.
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarConfirmAltaEquiposFactura()">Seguir editando</button>
                <button type="button" class="btn btn-primario" id="btnConfirmAltaEquiposFactura">Dar de alta ahora</button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL ALTA DE EQUIPO EXCLUSIVO DE FACTURAS
     ============================================ -->
<div id="modalEquipoFactura" class="modal-overlay" data-modal-focus="#equipoFacturaIdTipo" aria-hidden="true" data-route-equipos-crear="{{ route('equipos.crear') }}">
    <div class="modal-equipo">
        <div class="modal-equipo-header">
            <h2>Alta de Equipo desde Factura <span id="equipoFacturaRowInfo" style="font-size: 0.85em; color: #666; font-weight: normal;"></span></h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalEquipoFactura()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formEquipoFactura" method="POST" class="modal-equipo-body" enctype="multipart/form-data">
            @csrf
            <input type="hidden" name="idFactura" id="equipoFacturaIdFactura" value="">
            <input type="hidden" name="numeroFactura" id="equipoFacturaNumeroFactura" value="">
            <input type="hidden" name="idDetalleFactura" id="equipoFacturaIdDetalleFactura" value="">
            <input type="hidden" name="origen" value="factura">

            <input type="hidden" id="equipoFacturaIdProveedorHidden" name="idProveedor" value="">
            <div class="modal-equipo-layout">
                <div class="modal-equipo-col modal-equipo-col-main">
                    <div class="form-grupo">
                        <label for="equipoFacturaIdTipo">Tipo *</label>
                        <div class="input-group">
                            <select id="equipoFacturaIdTipo" name="idTipo" class="form-control" required onchange="cargarModelosFactura(this.value)">
                                <option value="">— Seleccionar tipo —</option>
                                @foreach(\App\Models\Tipo::activos()->orderBy('nombreTipo')->get() as $tipo)
                                    <option value="{{ $tipo->idTipo }}">{{ $tipo->nombreTipo }}</option>
                                @endforeach
                            </select>
                            <input type="text" id="buscarEquipoFacturaTipo" class="form-control mt-1" placeholder="Buscar tipo..." style="display:none;">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Tipo')" title="Crear nuevo tipo">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaIdMarca">Marca *</label>
                        <div class="input-group">
                            <select id="equipoFacturaIdMarca" name="idMarca" class="form-control" required onchange="cargarModelosFactura(this.value)">
                                <option value="">— Seleccionar marca —</option>
                                @foreach(\App\Models\Marca::activos()->orderBy('marca')->get() as $marca)
                                    <option value="{{ $marca->idMarca }}">{{ $marca->marca }}</option>
                                @endforeach
                            </select>
                            <input type="text" id="buscarEquipoFacturaMarca" class="form-control mt-1" placeholder="Buscar marca..." style="display:none;">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Marca')" title="Crear nueva marca">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaIdModelo">Modelo *</label>
                        <div class="input-group">
                            <select id="equipoFacturaIdModelo" name="idModelo" required class="form-control">
                                <option value="">— Seleccionar modelo —</option>
                                @foreach(\App\Models\Modelo::activos()->with('marca')->orderBy('modelo')->get() as $modelo)
                                    <option value="{{ $modelo->idModelo }}">{{ $modelo->modelo }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Modelo')" title="Crear nuevo modelo">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaSerie">Serie *</label>
                        <input type="text" id="equipoFacturaSerie" name="serie" required autocomplete="off" class="form-control">
                        <small id="equipoFacturaSerieError" class="texto-error" style="display:none; color:#d9534f; margin-top:4px;">Número de serie incorrecto o ya existente</small>
                    </div>

                    <div class="form-grupo form-grupo-garantia">
                        <div class="garantia-linea">
                            <span class="garantia-texto">Garantía de</span>
                            <input type="number" id="equipoFacturaGarantiaDias" min="0" max="999" step="1" value="0" class="form-control garantia-dias-input" placeholder="0" aria-label="Garantía en días">
                            <span class="garantia-texto">días</span>
                            <span id="equipoFacturaGarantiaPreview" class="garantia-preview">(vence: —)</span>
                        </div>
                        <input type="hidden" id="equipoFacturaGarantiaBase" value="">
                        <input type="hidden" id="equipoFacturaVtoGarantia" name="vtoGarantia" value="">
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaPrecio">Precio</label>
                        <input type="number" step="0.01" id="equipoFacturaPrecio" name="precio" class="form-control" placeholder="0.00">
                    </div>

                    <div class="form-grupo form-grupo-check">
                        <input type="hidden" name="informa_al_seguro" value="0">
                        <label class="form-check-label" for="equipoFacturaInformaSeguro">
                            <input type="checkbox" id="equipoFacturaInformaSeguro" class="form-check-input" name="informa_al_seguro" value="1" checked>
                            Informa al seguro
                        </label>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaUbicacionId">Ubicación *</label>
                        <div class="input-group">
                            <select id="equipoFacturaUbicacionId" name="ubicacion_id" required class="form-control" onchange="cargarSectoresFacturaPorUbicacionYSeleccionar(this.value, null)">
                                <option value="">— Seleccionar ubicación —</option>
                                @foreach(\App\Models\Ubicacion::activos()->orderBy('nombre')->get() as $u)
                                    <option value="{{ $u->id }}">{{ trim(($u->codigo ? $u->codigo . ' - ' : '') . $u->nombre) }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Ubicacion')" title="Crear nueva ubicación">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoFacturaSectorId">Sector *</label>
                        <div class="input-group">
                            <select id="equipoFacturaSectorId" name="sector_id" required class="form-control">
                                <option value="">— Seleccionar sector —</option>
                                @foreach(\App\Models\Sector::activos()->orderBy('nombre')->get() as $s)
                                    <option value="{{ $s->id }}">{{ $s->nombre }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-agregar-entidad" onclick="debugClick('Sector')" title="Crear nuevo sector">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo" hidden aria-hidden="true">
                        <label for="equipoFacturaIdProveedor">Proveedor (factura)</label>
                        <select id="equipoFacturaIdProveedor" class="form-control" tabindex="-1" aria-hidden="true">
                            <option value="">— Sin especificar —</option>
                            @foreach(\App\Models\Proveedor::activos()->orderBy('proveedor')->get() as $p)
                                <option value="{{ $p->idProveedor }}">{{ $p->proveedor }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <aside class="modal-equipo-col modal-equipo-col-side">
                    <div class="form-grupo">
                        <label for="equipoFacturaObservacion">Observación</label>
                        <textarea id="equipoFacturaObservacion" name="observacion" rows="5" class="form-control"></textarea>
                    </div>

                    <div class="form-grupo form-grupo-imagen">
                        <label for="equipoFacturaImagen">Imagen del equipo</label>
                        <input type="file" id="equipoFacturaImagen" name="imagen" accept="image/*" class="form-control-file-input">
                        <div class="preview-imagen preview-imagen--modal" id="previewImagenFactura">
                            <div class="preview-imagen-container">
                                <img id="previewImgTagFactura" src="">
                                <button type="button" id="btnEliminarImagenFactura" class="btn-eliminar-imagen" style="display: none;" title="Eliminar imagen">&times;</button>
                            </div>
                            <div class="placeholder" id="previewPlaceholderFactura">Tocá para elegir imagen</div>
                        </div>
                        <small class="form-grupo-imagen-hint">Formatos: JPG, PNG, GIF. Máx. 2&nbsp;MB</small>
                    </div>

                    <div id="equipoFacturaPanelFactura" class="equipo-panel-factura equipo-panel-factura--desde-factura">
                        <h3 class="equipo-panel-factura-titulo">Datos de la factura de compra</h3>
                        <dl class="equipo-panel-factura-dl">
                            <div class="equipo-panel-factura-fila">
                                <dt>Fecha</dt>
                                <dd id="equipoFacturaPanelFecha">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>Proveedor</dt>
                                <dd id="equipoFacturaPanelProveedor">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>N° factura</dt>
                                <dd id="equipoFacturaPanelNumero">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>Precio</dt>
                                <dd id="equipoFacturaPanelPrecio">—</dd>
                            </div>
                        </dl>
                    </div>
                </aside>
            </div>

            <div class="modal-equipo-footer">
                <button type="button" class="btn btn-secundario" onclick="omitirEquipoActualFactura()">Omitir</button>
                <button type="submit" id="modalEquipoFacturaSubmit" class="btn btn-primario">Guardar Equipo</button>
            </div>
        </form>
    </div>
</div>

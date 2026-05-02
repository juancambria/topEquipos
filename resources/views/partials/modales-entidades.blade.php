<!-- ============================================
     MODALES DE ENTIDADES (MARCA, MODELO, UBICACION, SECTOR, TIPO)
     Estos modales están disponibles globalmente para crear entidades desde cualquier página
     Las opciones se cargan vía AJAX
     ============================================ -->

<!-- ============================================
     MODAL CREAR MARCA
     ============================================ -->
<div id="modalMarca" class="modal-overlay" data-modal-focus="#marcaNombre" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalMarcaTitulo">Nueva Marca</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalMarca()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formMarca" method="POST" action="{{ route('marcas.crear') }}" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="marcaNombre">Marca</label>
                <input type="text" id="marcaNombre" name="marca" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalMarca()">Cancelar</button>
                <button type="submit" id="modalMarcaSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

<div id="modalMarcaTipos" class="modal-overlay" aria-hidden="true" style="z-index: 120100;">
    <div class="modal-sector" style="max-width: 560px;">
        <div class="modal-sector-header">
            <h2 id="tituloMarcaTipos">Tipos de la marca</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalTiposMarca()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <p style="margin-top:0;">Seleccione/marque con una tilde a los tipos de equipos que corresponden a esta marca.</p>
            <div class="modal-table-wrap">
                <table class="tabla-modal" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left; padding:8px 10px;"></th>
                            <th style="text-align:left; padding:8px 10px;">Tipo</th>
                        </tr>
                    </thead>
                    <tbody id="bodyMarcaTipos"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- ============================================
     MODAL CREAR MODELO
     ============================================ -->
<div id="modalModelo" class="modal-overlay" data-modal-focus="#modeloIdTipo" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalModeloTitulo">Nuevo Modelo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalModelo()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formModelo" method="POST" action="{{ route('modelos.store') }}" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="modeloIdTipo">Tipo</label>
                <select id="modeloIdTipo" name="idTipo">
                    <option value="">— Seleccionar tipo —</option>
                    <!-- Las opciones se cargan vía AJAX cuando se abre el modal -->
                </select>
            </div>
            <div class="form-grupo">
                <label for="modeloIdMarca">Marca</label>
                <select id="modeloIdMarca" name="idMarca">
                    <option value="">— Seleccionar marca —</option>
                    <!-- Las opciones se cargan vía AJAX cuando se abre el modal -->
                </select>
            </div>
            <div class="form-grupo">
                <label for="modeloNombre">Modelo</label>
                <input type="text" id="modeloNombre" name="modelo" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalModelo()">Cancelar</button>
                <button type="submit" id="modalModeloSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

<!-- ============================================
     MODAL CREAR TIPO
     ============================================ -->
<div id="modalTipo" class="modal-overlay" data-modal-focus="#tipoNombre" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalTipoTitulo">Nuevo Tipo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalTipo()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formTipo" method="POST" action="{{ route('tipos.crear') }}" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="tipoNombre">Nombre</label>
                <input type="text" id="tipoNombre" name="nombreTipo" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalTipo()">Cancelar</button>
                <button type="submit" id="modalTipoSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

<!-- ============================================
     MODAL CREAR UBICACIÓN
     ============================================ -->
<div id="modalUbicacion" class="modal-overlay" data-modal-focus="#ubicacionNombre" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalUbicacionTitulo">Nueva Ubicación</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalUbicacion()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formUbicacion" method="POST" action="{{ route('ubicaciones.crear') }}" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="ubicacionNombre">Nombre</label>
                <input type="text" id="ubicacionNombre" name="nombre" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCodigo">Código</label>
                <input type="text" id="ubicacionCodigo" name="codigo" maxlength="5" inputmode="numeric" pattern="[0-9]*" autocomplete="off" title="Hasta 5 dígitos">
            </div>
            <div class="form-grupo">
                <label for="ubicacionTelefono">Teléfono</label>
                <input type="text" id="ubicacionTelefono" name="telefono" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionDireccion">Dirección</label>
                <input type="text" id="ubicacionDireccion" name="direccion" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCiudad">Ciudad</label>
                <input type="text" id="ubicacionCiudad" name="ciudad" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionProvincia">Provincia</label>
                <input type="text" id="ubicacionProvincia" name="provincia" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCodigoPostal">Código Postal</label>
                <input type="text" id="ubicacionCodigoPostal" name="codigo_postal" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalUbicacion()">Cancelar</button>
                <button type="submit" id="modalUbicacionSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

<!-- ============================================
     MODAL CREAR SECTOR
     ============================================ -->
<div id="modalSector" class="modal-overlay" data-modal-focus="#sectorNombre" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalSectorTitulo">Nuevo Sector</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalSector()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formSector" method="POST" action="{{ route('sectores.crear') }}" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="sectorNombre">Nombre</label>
                <input type="text" id="sectorNombre" name="nombre" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalSector()">Cancelar</button>
                <button type="submit" id="modalSectorSubmit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

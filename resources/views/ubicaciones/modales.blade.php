{{-- Modal: listado de sectores de una ubicación con checkboxes --}}
<div id="modalSectores" class="modal-antiguo" style="display:none;">
    <div class="modal-sector" style="max-width: 500px;">
        <div class="modal-sector-header">
            <h2 id="tituloSectores">Sectores</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalSectores()" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">
                Marcale una tilde a los sectores que pertenecen a esta ubicación.
            </p>
            <table class="tabla-modal" id="tablaSectoresUbicacion">
                <thead>
                    <tr>
                        <th style="width: 40px;">&nbsp;</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody id="bodySectores"></tbody>
            </table>
        </div>
        <div class="modal-sector-footer">
            <button type="button" class="btn btn-secundario" onclick="cerrarModalSectores()">Cerrar</button>
        </div>
    </div>
</div>


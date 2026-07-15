<div id="modalIncidencia" class="modal-overlay op-modal-overlay" data-modal-focus="#incidenciaFecha" aria-hidden="true">
    <div class="modal-sector op-modal op-modal--incidencia">
        <div class="modal-sector-header op-modal-header">
            <h2 id="modalIncidenciaTitulo">Incidencia</h2>
            <button type="button" class="modal-cerrar" id="cerrarModalIncidencia" aria-label="Cerrar" tabindex="-1">&times;</button>
        </div>
        <form id="formIncidencia" class="op-modal-form" enctype="multipart/form-data">
            @csrf
            <input type="hidden" id="incidenciaId" name="id">
            <div class="modal-sector-body op-modal-body">
                <div class="op-modal-grid op-modal-grid--3">
                    <div class="op-modal-col">
                        <div class="form-grupo">
                            <label for="incidenciaFecha">Fecha</label>
                            <input type="date" id="incidenciaFecha" name="fecha" required>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaLugar">Lugar / Sucursal</label>
                            <select id="incidenciaLugar" name="codigoLugar">
                                <option value="">— Seleccionar —</option>
                                @foreach($ubicaciones as $u)
                                <option value="{{ $u->id }}">{{ $u->nombre }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaSector">Sector</label>
                            <select id="incidenciaSector" name="codigoSector">
                                <option value="">— Seleccionar lugar primero —</option>
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaSolicito">Solicitó</label>
                            <input type="text" id="incidenciaSolicito" name="solicito" maxlength="180" autocomplete="off">
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaAsunto">Asunto</label>
                            <input type="text" id="incidenciaAsunto" name="incidencia" required maxlength="255" autocomplete="off">
                        </div>
                    </div>
                    <div class="op-modal-col">
                        <div class="form-grupo">
                            <label for="incidenciaEstado">Estado</label>
                            <select id="incidenciaEstado" name="estado" required>
                                @foreach(\App\Models\Incidencia::ESTADOS as $est)
                                <option value="{{ $est }}">{{ ucfirst(str_replace('_', ' ', $est)) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaPrioridad">Prioridad</label>
                            <select id="incidenciaPrioridad" name="prioridad" required>
                                @foreach(\App\Models\Incidencia::PRIORIDADES as $pri)
                                <option value="{{ $pri }}" @selected($pri === 'media')>{{ ucfirst($pri) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaTecnico">Responsable / Técnico</label>
                            <select id="incidenciaTecnico" name="codigoTecnico">
                                <option value="">— Sin asignar —</option>
                                @foreach($tecnicos as $t)
                                <option value="{{ $t->id }}">{{ $t->nombre }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaProgreso">Progreso (%)</label>
                            <input type="number" id="incidenciaProgreso" name="completado" min="0" max="100" value="0">
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaFechaResolucion">Fecha resolución</label>
                            <input type="date" id="incidenciaFechaResolucion" name="fechaResolucion">
                        </div>
                    </div>
                    <div class="op-modal-col op-modal-col-textos">
                        <div class="form-grupo">
                            <label for="incidenciaObservacion">Observación</label>
                            <textarea id="incidenciaObservacion" name="observacion" class="op-textarea-lg" rows="6"></textarea>
                        </div>
                        <div class="form-grupo">
                            <label for="incidenciaResolucion">Resolución</label>
                            <textarea id="incidenciaResolucion" name="incidenciaResolucion" class="op-textarea-lg" rows="6"></textarea>
                        </div>
                    </div>
                    <div class="form-grupo op-modal-span-full op-fotos-bloque">
                        <label for="incidenciaFotos">Imágenes adjuntas</label>
                        <p class="op-fotos-hint">Hasta 5 imágenes en formato JPG o PNG.</p>
                        <label class="op-fotos-dropzone op-fotos-dropzone--compact" for="incidenciaFotos" tabindex="0" role="button" aria-label="Seleccionar imágenes">
                            <span class="op-fotos-dropzone-icon" aria-hidden="true">📷</span>
                            <span class="op-fotos-dropzone-text">Clic para seleccionar imágenes</span>
                            <input type="file" id="incidenciaFotos" name="fotos[]" accept="image/jpeg,image/jpg,image/png" multiple class="op-fotos-input" tabindex="-1">
                        </label>
                        <div id="incidenciaFotosExistentes" class="op-fotos-grid"></div>
                        <div id="incidenciaFotosPreview" class="op-fotos-grid"></div>
                    </div>
                </div>
            </div>
            <div class="modal-sector-footer op-modal-footer">
                <button type="button" class="btn btn-secundario" id="cancelarModalIncidencia">Cancelar</button>
                <button type="submit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

<div id="modalDiaIncidencias" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector op-modal-dia">
        <div class="modal-sector-header">
            <h2 id="modalDiaIncidenciasTitulo">Incidencias del día</h2>
            <button type="button" class="modal-cerrar" id="cerrarModalDiaIncidencias" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <div id="listaDiaIncidencias" class="op-dia-lista"></div>
            <div class="modal-sector-footer op-modal-footer">
                <button type="button" class="btn btn-primario" id="btnNuevaIncidenciaDia">Guardar</button>
                <button type="button" class="btn btn-secundario" id="cerrarModalDiaIncidencias2">Cancelar</button>
            </div>
        </div>
    </div>
</div>

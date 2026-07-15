<div id="modalParte" class="modal-overlay op-modal-overlay" data-modal-focus="#parteFecha" aria-hidden="true">
    <div class="modal-sector op-modal op-modal--parte">
        <div class="modal-sector-header op-modal-header">
            <h2 id="modalParteTitulo">Parte de trabajo</h2>
            <button type="button" class="modal-cerrar" id="cerrarModalParte" aria-label="Cerrar" tabindex="-1">&times;</button>
        </div>
        <form id="formParte" class="op-modal-form" enctype="multipart/form-data">
            @csrf
            <input type="hidden" id="parteId" name="id">
            <div class="modal-sector-body op-modal-body">
                <div class="op-modal-grid op-modal-grid--2">
                    <div class="op-modal-col">
                        <div class="form-grupo">
                            <label for="parteFecha">Fecha</label>
                            <input type="date" id="parteFecha" name="fecha" required>
                        </div>
                        <div class="form-grupo">
                            <label for="parteTipo">Tipo</label>
                            <select id="parteTipo" name="tipo" required>
                                <option value="">— Seleccionar —</option>
                                @foreach(\App\Models\ParteTrabajo::TIPOS as $tipo)
                                <option value="{{ $tipo }}">{{ $tipo === 'mantenimiento' ? 'Mantenimiento' : 'Tarea general' }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo" id="grupoEquipo">
                            <label for="parteEquipoDisplay">Equipo</label>
                            <div class="op-equipo-picker">
                                <input type="hidden" id="parteEquipo" name="codigoEquipo" value="">
                                <input type="text" id="parteEquipoDisplay" class="op-equipo-picker-display" readonly
                                    placeholder="— Seleccionar —" autocomplete="off" tabindex="-1" aria-labelledby="parteEquipoDisplay">
                                <button type="button" class="btn btn-secundario op-equipo-picker-btn" id="btnAbrirPickerEquipo">Buscar…</button>
                                <button type="button" class="btn btn-baja op-equipo-picker-clear" id="btnLimpiarEquipo" title="Quitar equipo" aria-label="Quitar equipo" hidden>✕</button>
                            </div>
                        </div>
                        <div class="form-grupo">
                            <label for="parteLugar">Lugar / Sucursal</label>
                            <select id="parteLugar" name="codigoLugar">
                                <option value="">— Seleccionar —</option>
                                @foreach($ubicaciones as $u)
                                <option value="{{ $u->id }}">{{ $u->nombre }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="parteSector">Sector</label>
                            <select id="parteSector" name="codigoSector">
                                <option value="">— Seleccionar lugar primero —</option>
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label for="parteIncidencia">Incidencia vinculada (opcional)</label>
                            <select id="parteIncidencia" name="codigo_incidencia">
                                <option value="">— Sin vincular —</option>
                                @foreach($incidencias as $inc)
                                <option value="{{ $inc->idIncidencia }}">#{{ $inc->idIncidencia }} — {{ Str::limit($inc->incidencia, 50) }} ({{ $inc->fecha?->format('d/m/Y') }})</option>
                                @endforeach
                            </select>
                        </div>
                        <div id="panelIncidenciaUpdate" class="op-incidencia-panel op-hidden">
                            <p><strong>Actualizar incidencia vinculada</strong> (opcional)</p>
                            <div class="form-grupo">
                                <label for="incidenciaEstadoParte">Estado incidencia</label>
                                <select id="incidenciaEstadoParte" name="incidencia_estado">
                                    <option value="">— No cambiar —</option>
                                    @foreach(\App\Models\Incidencia::ESTADOS as $est)
                                    <option value="{{ $est }}">{{ ucfirst(str_replace('_', ' ', $est)) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-grupo">
                                <label for="incidenciaFechaResParte">Fecha resolución</label>
                                <input type="date" id="incidenciaFechaResParte" name="incidencia_fecha_resolucion">
                            </div>
                            <div class="form-grupo">
                                <label for="incidenciaResParte">Resolución incidencia</label>
                                <textarea id="incidenciaResParte" name="incidencia_resolucion" class="op-textarea-lg op-textarea-sm" rows="2"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="op-modal-col op-modal-col-derecha">
                        <div class="form-grupo op-materiales-wrap">
                            <label>Materiales utilizados</label>
                            <div id="parteMaterialesLista" class="op-materiales-lista"></div>
                            <button type="button" class="btn btn-secundario op-btn-inline" id="btnAnadirMaterial">+ Añadir material</button>
                        </div>
                        <div class="form-grupo">
                            <label for="parteDescripcion">Acciones realizadas</label>
                            <textarea id="parteDescripcion" name="descripcionTrabajo" class="op-textarea-lg" rows="5" required></textarea>
                        </div>
                        <div class="form-grupo">
                            <label for="parteObservacion">Observación</label>
                            <textarea id="parteObservacion" name="observacion" class="op-textarea-lg" rows="4"></textarea>
                        </div>
                    </div>
                    <div class="form-grupo op-modal-span-full op-fotos-bloque">
                        <label for="parteFotos">Imágenes adjuntas</label>
                        <p class="op-fotos-hint">Hasta 5 imágenes en formato JPG o PNG.</p>
                        <label class="op-fotos-dropzone op-fotos-dropzone--compact" for="parteFotos" tabindex="0" role="button" aria-label="Seleccionar imágenes">
                            <span class="op-fotos-dropzone-icon" aria-hidden="true">📷</span>
                            <span class="op-fotos-dropzone-text">Clic para seleccionar imágenes</span>
                            <input type="file" id="parteFotos" name="fotos[]" accept="image/jpeg,image/jpg,image/png" multiple class="op-fotos-input" tabindex="-1">
                        </label>
                        <div id="parteFotosExistentes" class="op-fotos-grid"></div>
                        <div id="parteFotosPreview" class="op-fotos-grid"></div>
                    </div>
                </div>
            </div>
            <div class="modal-sector-footer op-modal-footer">
                <button type="button" class="btn btn-secundario" id="cancelarModalParte">Cancelar</button>
                <button type="submit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

<div id="modalDiaPartes" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector op-modal-dia">
        <div class="modal-sector-header">
            <h2 id="modalDiaPartesTitulo">Partes del día</h2>
            <button type="button" class="modal-cerrar" id="cerrarModalDiaPartes" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <div id="listaDiaPartes" class="op-dia-lista"></div>
            <div class="modal-sector-footer op-modal-footer">
                <button type="button" class="btn btn-primario" id="btnNuevoParteDia">Guardar</button>
                <button type="button" class="btn btn-secundario" id="cerrarModalDiaPartes2">Cancelar</button>
            </div>
        </div>
    </div>
</div>

<div id="modalPickerEquipo" class="modal-overlay op-picker-overlay" data-modal-focus="#pickerEquipoBuscar" aria-hidden="true">
    <div class="modal-sector op-picker-modal">
        <div class="modal-sector-header op-modal-header">
            <h2>Seleccionar equipo</h2>
            <button type="button" class="modal-cerrar" id="cerrarPickerEquipo" aria-label="Cerrar" tabindex="-1">&times;</button>
        </div>
        <div class="modal-sector-body op-picker-body">
            <div class="op-picker-toolbar">
                <div class="search-wrapper op-picker-search">
                    <span class="search-icon" aria-hidden="true">🔍</span>
                    <input type="search" id="pickerEquipoBuscar" class="input-buscar" placeholder="Buscar por texto (serie, marca, modelo, tipo…)" autocomplete="off" aria-label="Buscar equipo">
                </div>
                <select id="pickerEquipoTipo" class="op-picker-filtro" aria-label="Filtrar por tipo de equipo">
                    <option value="">Todos los tipos</option>
                    @foreach($tipos as $t)
                    <option value="{{ $t->idTipo }}">{{ $t->nombreTipo }}</option>
                    @endforeach
                </select>
                <input type="number" id="pickerEquipoId" class="op-picker-id" min="1" step="1" placeholder="ID" aria-label="Filtrar por ID de equipo">
            </div>
            <p id="pickerEquipoInfo" class="op-picker-info">Escriba o filtre para buscar. Clic en una fila para seleccionar.</p>
            <div class="op-picker-tabla-wrap">
                <table class="op-picker-tabla" id="tablaPickerEquipos">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Serie / nombre</th>
                            <th>Tipo</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                        </tr>
                    </thead>
                    <tbody id="pickerEquiposBody">
                        <tr><td colspan="5" class="td-vacio">Cargando…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-sector-footer op-modal-footer">
            <button type="button" class="btn btn-secundario" id="cancelarPickerEquipo">Cancelar</button>
        </div>
    </div>
</div>

<template id="tplMaterialRow">
    <div class="op-material-row">
        <select class="material-select" name="materiales[][material_id]">
            <option value="">— Material —</option>
            @foreach($materiales as $m)
            <option value="{{ $m->id }}" data-stock="{{ $m->stock }}">{{ $m->descripcion }} (stock: {{ $m->stock }})</option>
            @endforeach
        </select>
        <input type="number" class="material-cantidad" name="materiales[][cantidad]" min="0.0001" step="0.0001" placeholder="Cantidad">
        <button type="button" class="btn btn-baja btn-quitar-material" title="Quitar">✕</button>
    </div>
</template>

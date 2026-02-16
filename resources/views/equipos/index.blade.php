@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/equipos.css') }}">
@endsection

@section('content')
<div class="pagina-equipos">
    <header class="equipos-header">
        <h1>Equipos</h1>
        <div class="equipos-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar equipo..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalEquipo('crear')">+ Nuevo Equipo</button>
            @if(request()->routeIs('equipos.inactivos'))
                <a href="{{ route('equipos.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('equipos.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="equipos-tabla-wrap">
        <table class="tabla-equipos" id="tablaEquipos">
            <thead>
                <tr>
                    <th>Serie</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Tipo</th>
                    <th>Proveedor</th>
                    <th>Ubicación</th>
                    <th>Sector</th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($equipos as $e)
                <tr>
                    <td>{{ $e->serie }}</td>
                    <td>{{ $e->marca->marca ?? '—' }}</td>
                    <td>{{ $e->modelo->modelo ?? '—' }}</td>
                    <td>{{ $e->tipo->nombreTipo ?? '—' }}</td>
                    <td>{{ $e->proveedor->proveedor ?? '—' }}</td>
                    <td>{{ $e->ubicacion->nombre ?? '—' }}</td>
                    <td>{{ $e->sector->nombre ?? '—' }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('equipos.inactivos'))
                            <form method="POST" action="{{ route('equipos.alta', $e->id) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-ver-historial" data-id="{{ $e->id }}">Historial</button>
                            <button type="button" class="btn btn-link btn-editar-equipo" 
                                data-id="{{ $e->id }}"
                                data-serie="{{ e($e->serie) }}"
                                data-id-marca="{{ $e->idMarca }}"
                                data-id-modelo="{{ $e->idModelo }}"
                                data-id-tipo="{{ $e->idTipo }}"
                                data-id-proveedor="{{ $e->idProveedor ?? '' }}"
                                data-ubicacion-id="{{ $e->ubicacion_id ?? '' }}"
                                data-sector-id="{{ $e->sector_id ?? '' }}"
                                data-observacion="{{ e($e->observacion ?? '') }}"
                                data-vto-garantia="{{ $e->vtoGarantia ?? '' }}"
                                data-precio="{{ $e->precio ?? '' }}"
                                data-imagen="{{ $e->imagen ?? '' }}"
                            >Editar</button>
                            <form method="POST" action="{{ route('equipos.baja', $e->id) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="td-vacio">No hay equipos. <button type="button" class="btn btn-link" onclick="abrirModalEquipo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

<div id="modalEquipo" class="modal-overlay" aria-hidden="true">
    <div class="modal-equipo">
        <div class="modal-equipo-header">
            <h2 id="modalEquipoTitulo">Equipo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalEquipo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formEquipo" method="POST" class="modal-equipo-body" enctype="multipart/form-data">
            @csrf
            <div class="modal-equipo-grid">
                <div class="form-grupo">
                    <label for="equipoSerie">Serie *</label>
                    <input type="text" id="equipoSerie" name="serie" required autocomplete="off">
                </div>
                <div class="form-grupo">
                    <label for="equipoIdMarca">Marca *</label>
                    <select id="equipoIdMarca" name="idMarca" required>
                        <option value="">— Sin especificar —</option>
                        @foreach($marcas as $m)
                            <option value="{{ $m->idMarca }}">{{ $m->marca }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoIdModelo">Modelo *</label>
                    <select id="equipoIdModelo" name="idModelo" required>
                        <option value="">— Sin especificar —</option>
                        @foreach($modelos as $mo)
                            <option value="{{ $mo->idModelo }}">{{ $mo->modelo }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoIdTipo">Tipo</label>
                    <select id="equipoIdTipo" name="idTipo">
                        <option value="">— Sin especificar —</option>
                        @foreach($tipos as $t)
                            <option value="{{ $t->idTipo }}">{{ $t->nombreTipo }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoIdProveedor">Proveedor</label>
                    <select id="equipoIdProveedor" name="idProveedor">
                        <option value="">— Sin especificar —</option>
                        @foreach($proveedores as $p)
                            <option value="{{ $p->idProveedor }}">{{ $p->proveedor }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoUbicacionId">Ubicación</label>
                    <select id="equipoUbicacionId" name="ubicacion_id">
                        <option value="">— Sin especificar —</option>
                        @foreach($ubicaciones as $u)
                            <option value="{{ $u->id }}">{{ $u->nombre }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoSectorId">Sector</label>
                    <select id="equipoSectorId" name="sector_id">
                        <option value="">— Sin especificar —</option>
                        @foreach($sectores as $s)
                            <option value="{{ $s->id }}">{{ $s->nombre }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-grupo">
                    <label for="equipoVtoGarantia">Vto. Garantía</label>
                    <input type="date" id="equipoVtoGarantia" name="vtoGarantia">
                </div>
                <div class="form-grupo">
                    <label for="equipoPrecio">Precio</label>
                    <input type="number" step="0.01" id="equipoPrecio" name="precio" placeholder="0.00">
                </div>
                <div class="form-grupo full-width form-grupo-imagen">
                    <label>Imagen del equipo</label>
                    <input type="file" id="equipoImagen" name="imagen" accept="image/*">
                    <input type="hidden" id="imagenActual" name="imagen_actual" value="">
                    <div class="preview-imagen" id="previewImagen">
                        <div class="preview-imagen-container">
                            <img id="previewImgTag" src="" alt="Previsualización">
                            <button type="button" id="btnEliminarImagen" class="btn-eliminar-imagen" style="display: none;" title="Eliminar imagen">&times;</button>
                        </div>
                        <div class="placeholder" id="previewPlaceholder">
                            Click para seleccionar imagen
                        </div>
                    </div>
                    <small style="color: #666; font-size: 11px; margin-top: 4px; display: block;">Formatos: JPG, PNG, GIF. Tamaño máx: 2MB</small>
                </div>
            <div class="form-grupo full-width">
                <label for="equipoObservacion">Observación</label>
                <textarea id="equipoObservacion" name="observacion" rows="2"></textarea>
            </div>
            <div class="modal-equipo-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalEquipo()">Cancelar</button>
                <button type="submit" id="modalEquipoSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/equipos.js') }}?v={{ time() }}"></script>
@endpush
@endsection


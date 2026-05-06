@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/ubicaciones.css') }}">
@endsection

@section('content')
<div class="page-container pagina-ubicaciones">
    <header class="ubicaciones-header">
        <h1>Gestión de Ubicaciones</h1>
        <div class="ubicaciones-toolbar">
            <div class="search-wrapper">
                <select id="searchColumn" class="search-column">
                    <option value="">Todas las columnas</option>
                    <option value="id">ID</option>
                    <option value="nombre">Nombre</option>
                    <option value="codigo">Código</option>
                    <option value="ciudad">Ciudad</option>
                    <option value="provincia">Provincia</option>
                    <option value="telefono">Teléfono</option>
                </select>
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar ubicación">
            </div>
            <span id="selectedUbicacionInfo" class="selected-info">Ninguna ubicación seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalUbicacion('crear')" title="Crear ubicación (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarUbicacion" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Editar ubicación seleccionada (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnEliminarUbicacion" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar ubicación seleccionada (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
            <button type="button" id="btnVerSectoresUbicacion" class="btn btn-primario tool-btn" data-toolbar-key="s" disabled title="Ver sectores (Alt+S)"><span class="tool-icon">📂</span><span class="tool-label"><span class="acc-k">S</span>ectores</span></button>
        </div>
    </header>

    <div class="ubicaciones-tabla-wrap">
        <table class="tabla-ubicaciones" id="tablaUbicaciones">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'id')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">
                        Nombre
                        @if(request('column') == 'nombre')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th>Código</th>
                    <th>Ciudad</th>
                    <th>Provincia</th>
                    <th>Teléfono</th>
                </tr>
            </thead>
            <tbody>
@forelse($ubicaciones as $u)
                <tr data-id="{{ $u->id }}"
                    data-nombre="{{ e($u->nombre) }}"
                    data-codigo="{{ e($u->codigo ?? '') }}"
                    data-ciudad="{{ e($u->ciudad ?? '') }}"
                    data-provincia="{{ e($u->provincia ?? '') }}"
                    data-telefono="{{ e($u->telefono ?? '') }}"
                    data-direccion="{{ e($u->direccion ?? '') }}"
                    data-codigo-postal="{{ e($u->codigo_postal ?? '') }}">
                    <form class="form-baja" method="POST" action="/ubicaciones/{{ $u->id }}/baja" style="display: none;">
                        @csrf
                    </form>
                    <td>{{ $u->id }}</td>
                    <td>{{ $u->nombre }}</td>
                    <td>{{ $u->codigo ?? '—' }}</td>
                    <td>{{ $u->ciudad ?? '—' }}</td>
                    <td>{{ $u->provincia ?? '—' }}</td>
                    <td>{{ $u->telefono ?? '—' }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="td-vacio">No hay ubicaciones. <button type="button" class="btn btn-link" onclick="abrirModalUbicacion('crear')">Crear la primera</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalUbicacionPagina" class="modal-overlay" data-modal-focus="#ubicacionNombrePagina" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalUbicacionTituloPagina">Ubicación</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalUbicacion()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formUbicacionPagina" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="ubicacionNombrePagina">Nombre</label>
                <input type="text" id="ubicacionNombrePagina" name="nombre" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCodigoPagina">Código</label>
                <input type="text" id="ubicacionCodigoPagina" name="codigo" maxlength="5" inputmode="numeric" pattern="[0-9]*" autocomplete="off" title="Hasta 5 dígitos">
            </div>
            <div class="form-grupo">
                <label for="ubicacionTelefonoPagina">Teléfono</label>
                <input type="text" id="ubicacionTelefonoPagina" name="telefono" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionDireccionPagina">Dirección</label>
                <input type="text" id="ubicacionDireccionPagina" name="direccion" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCiudadPagina">Ciudad</label>
                <input type="text" id="ubicacionCiudadPagina" name="ciudad" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionProvinciaPagina">Provincia</label>
                <input type="text" id="ubicacionProvinciaPagina" name="provincia" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionCodigoPostalPagina">Código Postal</label>
                <input type="text" id="ubicacionCodigoPostalPagina" name="codigo_postal" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalUbicacion()">Cancelar</button>
                <button type="submit" id="modalUbicacionSubmitPagina" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@include('ubicaciones.modales')

@endsection

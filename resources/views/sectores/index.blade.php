@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/sectores.css') }}">
@endsection

@section('content')
<div class="pagina-sectores">
    <header class="sectores-header">
        <h1>Sectores</h1>
        <div class="sectores-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar sector..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalSector('crear')">+ Nuevo Sector</button>
            @if(request()->routeIs('sectores.inactivos'))
                <a href="{{ route('sectores.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('sectores.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="sectores-tabla-wrap">
        <table class="tabla-sectores" id="tablaSectores">
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
                    <th>Ubicación</th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sectores as $s)
                <tr data-id="{{ $s->id }}" data-nombre="{{ e($s->nombre) }}" data-ubicacion-id="{{ $s->ubicacion_id }}">
                    <td>{{ $s->id }}</td>
                    <td>{{ $s->nombre }}</td>
                    <td>{{ $s->ubicacion->nombre ?? '—' }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('sectores.inactivos'))
                            <form method="POST" action="{{ route('sectores.alta', $s->id) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-sector">Editar</button>
                            <form method="POST" action="{{ route('sectores.baja', $s->id) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="td-vacio">No hay sectores. <button type="button" class="btn btn-link" onclick="abrirModalSector('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalSector" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalSectorTitulo">Sector</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalSector()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formSector" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="sectorNombre">Nombre</label>
                <input type="text" id="sectorNombre" name="nombre" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="sectorUbicacionId">Ubicación</label>
                <select id="sectorUbicacionId" name="ubicacion_id" required>
                    @foreach($ubicaciones as $u)
                        <option value="{{ $u->id }}">{{ $u->nombre }}</option>
                    @endforeach
                </select>
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalSector()">Cancelar</button>
                <button type="submit" id="modalSectorSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/sectores.js') }}"></script>
@endpush
@endsection


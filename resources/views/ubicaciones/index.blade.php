@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/ubicaciones.css') }}">
@endsection

@section('content')
<div class="pagina-ubicaciones">
    <header class="ubicaciones-header">
        <h1>Ubicaciones</h1>
        <div class="ubicaciones-toolbar">
            <input type="search" id="buscadorUbicaciones" class="input-buscar" placeholder="Buscar ubicación..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalUbicacion('crear')">+ Nueva Ubicación</button>
            @if(request()->routeIs('ubicaciones.inactivos'))
                <a href="{{ route('ubicaciones.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('ubicaciones.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
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
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($ubicaciones as $u)
                <tr>
                    <td>{{ $u->id }}</td>
                    <td>{{ $u->nombre }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('ubicaciones.inactivos'))
                            <form method="POST" action="{{ route('ubicaciones.alta', $u->id) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-ubicacion" data-id="{{ $u->id }}" data-nombre="{{ e($u->nombre) }}">Editar</button>
                            <button type="button" class="btn btn-link btn-ver-sectores" data-id="{{ $u->id }}" data-nombre="{{ e($u->nombre) }}">Ver sectores</button>
                            <form method="POST" action="{{ route('ubicaciones.baja', $u->id) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="td-vacio">No hay ubicaciones. <button type="button" class="btn btn-link" onclick="abrirModalUbicacion('crear')">Crear la primera</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalUbicacion" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalUbicacionTitulo">Ubicación</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalUbicacion()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formUbicacion" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="ubicacionId">ID (opcional)</label>
                <input type="number" id="ubicacionId" name="id" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="ubicacionNombre">Nombre</label>
                <input type="text" id="ubicacionNombre" name="nombre" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalUbicacion()">Cancelar</button>
                <button type="submit" id="modalUbicacionSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@include('ubicaciones.modales')

@push('scripts')
<script src="{{ asset('js/ubicaciones.js') }}"></script>
@endpush
@endsection


@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/tipos.css') }}">
@endsection

@section('content')
<div class="pagina-tipos">
    <header class="tipos-header">
        <h1>Tipos</h1>
        <div class="tipos-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar tipo..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalTipo('crear')">+ Nuevo Tipo</button>
            @if(request()->routeIs('tipos.inactivos'))
                <a href="{{ route('tipos.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('tipos.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="tipos-tabla-wrap">
        <table class="tabla-tipos" id="tablaTipos">
            <thead>
                <tr>
                    <th class="sortable" data-column="idTipo" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'idTipo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="nombreTipo" data-order="{{ request('order', 'asc') }}">
                        Nombre
                        @if(request('column') == 'nombreTipo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($tipos as $t)
                <tr>
                    <td>{{ $t->idTipo }}</td>
                    <td>{{ $t->nombreTipo }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('tipos.inactivos'))
                            <form method="POST" action="{{ route('tipos.alta', $t->idTipo) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-tipo" data-id="{{ $t->idTipo }}" data-nombre="{{ e($t->nombreTipo) }}">Editar</button>
                            <form method="POST" action="{{ route('tipos.baja', $t->idTipo) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="td-vacio">No hay tipos. <button type="button" class="btn btn-link" onclick="abrirModalTipo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalTipo" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalTipoTitulo">Tipo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalTipo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formTipo" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="tipoNombre">Nombre</label>
                <input type="text" id="tipoNombre" name="nombreTipo" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalTipo()">Cancelar</button>
                <button type="submit" id="modalTipoSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/tipos.js') }}"></script>
@endpush
@endsection


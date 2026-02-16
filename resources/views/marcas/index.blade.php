@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/marcas.css') }}">
@endsection

@section('content')
<div class="pagina-marcas">
    <header class="marcas-header">
        <h1>Marcas</h1>
        <div class="marcas-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar marca..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalMarca('crear')">+ Nueva Marca</button>
            @if(request()->routeIs('marcas.inactivos'))
                <a href="{{ route('marcas.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('marcas.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="marcas-tabla-wrap">
        <table class="tabla-marcas" id="tablaMarcas">
            <thead>
                <tr>
                    <th class="sortable" data-column="idMarca" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'idMarca')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="marca" data-order="{{ request('order', 'asc') }}">
                        Marca
                        @if(request('column') == 'marca')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($marcas as $m)
                <tr>
                    <td>{{ $m->idMarca }}</td>
                    <td>{{ $m->marca }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('marcas.inactivos'))
                            <form method="POST" action="{{ route('marcas.alta', $m->idMarca) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-marca" data-id="{{ $m->idMarca }}" data-marca="{{ e($m->marca) }}">Editar</button>
                            <form method="POST" action="{{ route('marcas.baja', $m->idMarca) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="td-vacio">No hay marcas. <button type="button" class="btn btn-link" onclick="abrirModalMarca('crear')">Crear la primera</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalMarca" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalMarcaTitulo">Marca</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalMarca()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formMarca" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="marcaNombre">Marca</label>
                <input type="text" id="marcaNombre" name="marca" required autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalMarca()">Cancelar</button>
                <button type="submit" id="modalMarcaSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/marcas.js') }}"></script>
@endpush
@endsection


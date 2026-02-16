@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/modelos.css') }}">
@endsection

@section('content')
<div class="pagina-modelos">
    <header class="modelos-header">
        <h1>Modelos</h1>
        <div class="modelos-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar modelo..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalModelo('crear')">+ Nuevo Modelo</button>
            @if(request()->routeIs('modelos.inactivos'))
                <a href="{{ route('modelos.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('modelos.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="modelos-tabla-wrap">
        <table class="tabla-modelos" id="tablaModelos">
            <thead>
                <tr>
                    <th class="sortable" data-column="idModelo" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'idModelo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="modelo" data-order="{{ request('order', 'asc') }}">
                        Modelo
                        @if(request('column') == 'modelo')
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
                    <th>Tipo</th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($modelos as $m)
                <tr>
                    <td>{{ $m->idModelo }}</td>
                    <td>{{ $m->modelo }}</td>
                    <td>{{ $m->marca->marca ?? '' }}</td>
                    <td>{{ $m->tipo->nombreTipo ?? '—' }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('modelos.inactivos'))
                            <form method="POST" action="{{ route('modelos.alta', $m) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-modelo" data-id="{{ $m->idModelo }}" data-modelo="{{ e($m->modelo) }}" data-id-marca="{{ $m->idMarca }}" data-id-tipo="{{ $m->idTipo ?? '' }}">Editar</button>
                            <form method="POST" action="{{ route('modelos.baja', $m) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="td-vacio">No hay modelos. <button type="button" class="btn btn-link" onclick="abrirModalModelo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalModelo" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalModeloTitulo">Modelo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalModelo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formModelo" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="modeloNombre">Modelo</label>
                <input type="text" id="modeloNombre" name="modelo" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="modeloIdMarca">Marca</label>
                <select id="modeloIdMarca" name="idMarca" required>
                    @foreach($marcas as $x)
                        <option value="{{ $x->idMarca }}">{{ $x->marca }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-grupo">
                <label for="modeloIdTipo">Tipo</label>
                <select id="modeloIdTipo" name="idTipo">
                    <option value="">— Opcional —</option>
                    @foreach($tipos as $x)
                        <option value="{{ $x->idTipo }}">{{ $x->nombreTipo }}</option>
                    @endforeach
                </select>
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalModelo()">Cancelar</button>
                <button type="submit" id="modalModeloSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/modelos.js') }}"></script>
@endpush
@endsection


@extends('layouts.dashboard')

@section('title', 'Técnicos')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/operaciones.css') }}">
@endsection

@section('content')
<div class="page-container">
    <header class="op-header">
        <h1>Técnicos / Responsables</h1>
        <div class="op-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar técnico">
            </div>
            <span id="selectedInfo" class="selected-info">Ningún técnico seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" id="btnAnadir" title="Añadir (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="e" id="btnEditar" disabled title="Editar (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" class="btn btn-baja tool-btn" data-toolbar-key="l" id="btnEliminar" disabled title="Eliminar (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
        </div>
    </header>

    <div class="op-tabla-wrap">
        <table id="tablaTecnicos">
            <thead>
                <tr>
                    <th class="sortable" data-column="id">ID</th>
                    <th class="sortable" data-column="nombre">Nombre</th>
                </tr>
            </thead>
            <tbody>
                @forelse($tecnicos as $t)
                <tr data-id="{{ $t->id }}" data-nombre="{{ e($t->nombre) }}">
                    <td>{{ $t->id }}</td>
                    <td>{{ $t->nombre }}</td>
                </tr>
                @empty
                <tr><td colspan="2" class="td-vacio">No hay técnicos registrados.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalTecnico" class="modal-overlay" data-modal-focus="#tecnicoNombre" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalTecnicoTitulo">Técnico</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalTecnico()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formTecnico" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="tecnicoNombre">Nombre</label>
                <input type="text" id="tecnicoNombre" name="nombre" required maxlength="180" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalTecnico()">Cancelar</button>
                <button type="submit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/personas-tecnicos.js') }}"></script>
@endpush

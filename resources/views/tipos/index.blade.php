@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/tipos.css') }}">
@endsection

@section('content')
<div class="page-container pagina-tipos">
    <header class="tipos-header">
        <h1>Gestión de Tipos</h1>
        <div class="tipos-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar tipo">
            </div>
            <span id="selectedTipoInfo" class="selected-info">Ningún tipo seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalTipo('crear')" title="Crear tipo (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarTipo" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Editar tipo seleccionado (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnEliminarTipo" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar tipo seleccionado (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
        </div>
    </header>

    <div class="tipos-tabla-wrap">
        <table class="tabla-tipos" id="tablaTipos">
            <thead>
                <tr>
                    <th class="sortable" data-column="idTipo" data-order="{{ request('order', 'asc') }}">
                        ID
                        @include('partials.sort-icon', ['column' => 'idTipo'])
                    </th>
                    <th class="sortable" data-column="nombreTipo" data-order="{{ request('order', 'asc') }}">
                        Nombre
                        @include('partials.sort-icon', ['column' => 'nombreTipo'])
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($tipos as $t)
                <tr data-id="{{ $t->idTipo }}" data-nombre="{{ e($t->nombreTipo) }}">
                    <td>{{ $t->idTipo }}</td>
                    <td>{{ $t->nombreTipo }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="td-vacio">No hay tipos. <button type="button" class="btn btn-link" onclick="abrirModalTipo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <form id="formEliminarTipo" method="POST" style="display:none;">
        @csrf
    </form>
</div>

<div id="modalTipo" class="modal-overlay" data-modal-focus="#tipoNombre" aria-hidden="true">
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

@endsection

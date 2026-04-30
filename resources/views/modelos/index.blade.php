@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/modelos.css') }}">
@endsection

@section('content')
<div class="page-container pagina-modelos">
    <header class="modelos-header">
        <h1>Gestión de Modelos</h1>
        <div class="modelos-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar modelo">
            </div>
            <span id="selectedModeloInfo" class="selected-info">Ningún modelo seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalModelo('crear')" title="Crear modelo (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarModelo" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Editar modelo seleccionado (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnEliminarModelo" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar modelo seleccionado (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
        </div>
    </header>

    <div class="modelos-tabla-wrap">
        <table class="tabla-modelos" id="tablaModelos">
            <thead>
                <tr>
                    <th class="sortable" data-column="idModelo" data-order="{{ request('order', 'asc') }}">
                        ID
                        @include('partials.sort-icon', ['column' => 'idModelo'])
                    </th>
                    <th class="sortable" data-column="modelo" data-order="{{ request('order', 'asc') }}">
                        Modelo
                        @include('partials.sort-icon', ['column' => 'modelo'])
                    </th>
                    <th class="sortable" data-column="marca" data-order="{{ request('order', 'asc') }}">
                        Marca
                        @include('partials.sort-icon', ['column' => 'marca'])
                    </th>
                    <th class="sortable" data-column="tipo" data-order="{{ request('order', 'asc') }}">
                        Tipo
                        @include('partials.sort-icon', ['column' => 'tipo'])
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($modelos as $m)
                <tr data-id="{{ $m->idModelo }}" data-modelo="{{ e($m->modelo) }}" data-id-marca="{{ $m->idMarca }}" data-id-tipo="{{ $m->idTipo ?? '' }}">
                    <td>{{ $m->idModelo }}</td>
                    <td>{{ $m->modelo }}</td>
                    <td>{{ $m->marca->marca ?? '' }}</td>
                    <td>{{ $m->tipo->nombreTipo ?? '—' }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="td-vacio">No hay modelos. <button type="button" class="btn btn-link" onclick="abrirModalModelo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <form id="formEliminarModelo" method="POST" style="display:none;">
        @csrf
    </form>
</div>

@endsection

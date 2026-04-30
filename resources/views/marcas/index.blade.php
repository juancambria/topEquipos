@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/marcas.css') }}">
@endsection

@section('content')
<div class="page-container pagina-marcas">
    <header class="marcas-header">
        <h1>Gestión de Marcas</h1>
        <div class="marcas-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar marca">
            </div>
            <span id="selectedMarcaInfo" class="selected-info">Ninguna marca seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalMarca('crear')" title="Crear marca (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarMarca" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Editar marca seleccionada (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnEliminarMarca" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar marca seleccionada (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
        </div>
    </header>

    <div class="marcas-tabla-wrap">
        <table class="tabla-marcas" id="tablaMarcas">
            <thead>
                <tr>
                    <th class="sortable" data-column="idMarca" data-order="{{ request('order', 'asc') }}">
                        ID
                        @include('partials.sort-icon', ['column' => 'idMarca'])
                    </th>
                    <th class="sortable" data-column="marca" data-order="{{ request('order', 'asc') }}">
                        Marca
                        @include('partials.sort-icon', ['column' => 'marca'])
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($marcas as $m)
                <tr data-id="{{ $m->idMarca }}" data-marca="{{ e($m->marca) }}">
                    <td>{{ $m->idMarca }}</td>
                    <td>{{ $m->marca }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="2" class="td-vacio">No hay marcas. <button type="button" class="btn btn-link" onclick="abrirModalMarca('crear')">Crear la primera</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <form id="formEliminarMarca" method="POST" style="display:none;">
        @csrf
    </form>
</div>
@endsection

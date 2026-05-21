@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="materialesMarcasPage"
    data-crear="{{ route('materiales.marcas.crear') }}"
    data-crear-familia="{{ route('materiales.familias.crear') }}"
    data-base="{{ url('/materiales/marcas') }}"
    data-api-familias="{{ route('materiales.api.familias') }}">
    <header class="hm-header">
        <h1>Materiales - Marcas</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedMaterialMarcaInfo" class="selected-info">Ninguna marca seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialMarcaCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialMarcaEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnMaterialMarcaEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaMaterialesMarcas">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th>Familia</th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">Marca @include('partials.sort-icon', ['column' => 'nombre'])</th>
                </tr>
            </thead>
            <tbody>
            @forelse($marcas as $marca)
                <tr data-id="{{ $marca->id }}" data-familia-id="{{ $marca->material_familia_id }}" data-nombre="{{ e($marca->nombre) }}">
                    <td>{{ $marca->id }}</td>
                    <td>{{ $marca->familia->nombre ?? '—' }}</td>
                    <td>{{ $marca->nombre }}</td>
                </tr>
            @empty
                <tr><td colspan="3" class="td-vacio">No hay marcas cargadas.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

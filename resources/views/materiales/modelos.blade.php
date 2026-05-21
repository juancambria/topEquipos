@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="materialesModelosPage"
    data-crear="{{ route('materiales.modelos.crear') }}"
    data-crear-familia="{{ route('materiales.familias.crear') }}"
    data-crear-marca="{{ route('materiales.marcas.crear') }}"
    data-base="{{ url('/materiales/modelos') }}"
    data-api-familias="{{ route('materiales.api.familias') }}"
    data-api-marcas="{{ route('materiales.api.marcas') }}">
    <header class="hm-header">
        <h1>Materiales - Modelos</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedMaterialModeloInfo" class="selected-info">Ningún modelo seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialModeloCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialModeloEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnMaterialModeloEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaMaterialesModelos">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th>Familia</th>
                    <th>Marca</th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">Modelo @include('partials.sort-icon', ['column' => 'nombre'])</th>
                </tr>
            </thead>
            <tbody>
            @forelse($modelos as $modelo)
                <tr data-id="{{ $modelo->id }}" data-familia-id="{{ $modelo->material_familia_id }}" data-marca-id="{{ $modelo->material_marca_id }}" data-nombre="{{ e($modelo->nombre) }}">
                    <td>{{ $modelo->id }}</td>
                    <td>{{ $modelo->familia->nombre ?? '—' }}</td>
                    <td>{{ $modelo->marca->nombre ?? '—' }}</td>
                    <td>{{ $modelo->nombre }}</td>
                </tr>
            @empty
                <tr><td colspan="4" class="td-vacio">No hay modelos cargados.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

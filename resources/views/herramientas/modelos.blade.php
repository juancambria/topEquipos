@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="herramientasModelosPage"
    data-crear="{{ route('herramientas.modelos.crear') }}"
    data-crear-familia="{{ route('herramientas.familias.crear') }}"
    data-crear-marca="{{ route('herramientas.marcas.crear') }}"
    data-base="{{ url('/herramientas/modelos') }}"
    data-api-familias="{{ route('herramientas.api.familias') }}"
    data-api-marcas="{{ route('herramientas.api.marcas') }}">
    <header class="hm-header">
        <h1>Herramientas - Modelos</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedHerramientaModeloInfo" class="selected-info">Ningún modelo seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaModeloCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaModeloEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnHerramientaModeloEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaHerramientasModelos">
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
                <tr data-id="{{ $modelo->id }}" data-familia-id="{{ $modelo->herramienta_familia_id }}" data-marca-id="{{ $modelo->herramienta_marca_id }}" data-nombre="{{ e($modelo->nombre) }}">
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

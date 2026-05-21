@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="herramientasMarcasPage"
    data-crear="{{ route('herramientas.marcas.crear') }}"
    data-crear-familia="{{ route('herramientas.familias.crear') }}"
    data-base="{{ url('/herramientas/marcas') }}"
    data-api-familias="{{ route('herramientas.api.familias') }}">
    <header class="hm-header">
        <h1>Herramientas - Marcas</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedHerramientaMarcaInfo" class="selected-info">Ninguna marca seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaMarcaCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaMarcaEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnHerramientaMarcaEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaHerramientasMarcas">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th>Familia</th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">Marca @include('partials.sort-icon', ['column' => 'nombre'])</th>
                </tr>
            </thead>
            <tbody>
            @forelse($marcas as $marca)
                <tr data-id="{{ $marca->id }}" data-familia-id="{{ $marca->herramienta_familia_id }}" data-nombre="{{ e($marca->nombre) }}">
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

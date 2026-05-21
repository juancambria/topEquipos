@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="herramientasFamiliasPage" data-crear="{{ route('herramientas.familias.crear') }}" data-base="{{ url('/herramientas/familias') }}">
    <header class="hm-header">
        <h1>Herramientas - Familias</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedHerramientaFamiliaInfo" class="selected-info">Ninguna familia seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaFamiliaCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnHerramientaFamiliaEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnHerramientaFamiliaEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaHerramientasFamilias">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">Familia @include('partials.sort-icon', ['column' => 'nombre'])</th>
                </tr>
            </thead>
            <tbody>
            @forelse($familias as $familia)
                <tr data-id="{{ $familia->id }}" data-nombre="{{ e($familia->nombre) }}">
                    <td>{{ $familia->id }}</td>
                    <td>{{ $familia->nombre }}</td>
                </tr>
            @empty
                <tr><td colspan="2" class="td-vacio">No hay familias cargadas.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

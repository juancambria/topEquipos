@extends('layouts.dashboard')

@section('content')
<div class="page-container pagina-hm" id="materialesFamiliasPage" data-crear="{{ route('materiales.familias.crear') }}" data-base="{{ url('/materiales/familias') }}">
    <header class="hm-header">
        <h1>Materiales - Familias</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedMaterialFamiliaInfo" class="selected-info">Ninguna familia seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialFamiliaCrear" data-toolbar-key="a">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" id="btnMaterialFamiliaEditar" data-toolbar-key="e" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" id="btnMaterialFamiliaEliminar" data-toolbar-key="l" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaMaterialesFamilias">
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

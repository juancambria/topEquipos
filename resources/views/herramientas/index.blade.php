@extends('layouts.dashboard')

@section('content')
<div
    id="herramientasPage"
    class="page-container pagina-hm"
    data-api-familias="{{ route('herramientas.api.familias') }}"
    data-api-marcas="{{ route('herramientas.api.marcas') }}"
    data-api-modelos="{{ route('herramientas.api.modelos') }}"
    data-crear-familia="{{ route('herramientas.familias.crear') }}"
    data-crear-marca="{{ route('herramientas.marcas.crear') }}"
    data-crear-modelo="{{ route('herramientas.modelos.crear') }}"
    data-crear-item="{{ route('herramientas.crear') }}"
    data-actualizar-base="{{ url('/herramientas') }}"
    data-baja-base="{{ url('/herramientas') }}"
>
    <header class="hm-header">
        <h1>Herramientas</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedHerramientaInfo" class="selected-info">Ningún registro seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" id="btnHerramientaCrear">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="e" id="btnHerramientaEditar" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" data-toolbar-key="l" id="btnHerramientaEliminar" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaHerramientas">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th>Familia</th>
                    <th class="sortable" data-column="descripcion" data-order="{{ request('order', 'asc') }}">Descripción @include('partials.sort-icon', ['column' => 'descripcion'])</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $item)
                <tr data-id="{{ $item->id }}" data-familia-id="{{ $item->herramienta_familia_id }}" data-descripcion="{{ e($item->descripcion) }}" data-marca-id="{{ $item->herramienta_marca_id }}" data-modelo-id="{{ $item->herramienta_modelo_id }}">
                    <td>{{ $item->id }}</td>
                    <td>{{ $item->familia->nombre ?? '—' }}</td>
                    <td>{{ $item->descripcion }}</td>
                    <td>{{ $item->marca->nombre ?? '—' }}</td>
                    <td>{{ $item->modelo->nombre ?? '—' }}</td>
                </tr>
                @empty
                <tr><td colspan="5" class="td-vacio">No hay registros. <button type="button" class="btn btn-link" id="btnHerramientaCrearVacio">Crear el primero</button></td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalHerramientaItem" class="modal-overlay" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector hm-modal">
        <div class="modal-sector-header">
            <h2 id="modalHerramientaTitulo">Nueva herramienta</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalHerramientaItem()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formHerramientaItem" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="herramientaFamilia">Familia</label>
                <div class="input-group">
                    <select id="herramientaFamilia" name="herramienta_familia_id" required>
                        <option value="">— Seleccionar familia —</option>
                    </select>
                    <div class="input-group-append">
                        <button type="button" class="btn btn-agregar-entidad" id="btnHerramientaNuevaFamilia" title="Crear familia">+</button>
                    </div>
                </div>
            </div>
            <div class="form-grupo">
                <label for="herramientaDescripcion">Descripción</label>
                <input type="text" id="herramientaDescripcion" name="descripcion" required maxlength="180" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="herramientaMarca">Marca</label>
                <div class="input-group">
                    <select id="herramientaMarca" name="herramienta_marca_id" required>
                        <option value="">— Seleccionar marca —</option>
                    </select>
                    <div class="input-group-append">
                        <button type="button" class="btn btn-agregar-entidad" id="btnHerramientaNuevaMarca" title="Crear marca">+</button>
                    </div>
                </div>
            </div>
            <div class="form-grupo">
                <label for="herramientaModelo">Modelo</label>
                <div class="input-group">
                    <select id="herramientaModelo" name="herramienta_modelo_id" required>
                        <option value="">— Seleccionar modelo —</option>
                    </select>
                    <div class="input-group-append">
                        <button type="button" class="btn btn-agregar-entidad" id="btnHerramientaNuevoModelo" title="Crear modelo">+</button>
                    </div>
                </div>
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalHerramientaItem()">Cancelar</button>
                <button type="submit" id="btnHerramientaGuardar" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>
@endsection

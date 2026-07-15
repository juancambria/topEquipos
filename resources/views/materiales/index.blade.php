@extends('layouts.dashboard')

@section('content')
<div
    id="materialesPage"
    class="page-container pagina-hm"
    data-api-familias="{{ route('materiales.api.familias') }}"
    data-api-tipificaciones="{{ route('materiales.api.tipificaciones') }}"
    data-api-marcas="{{ route('materiales.api.marcas') }}"
    data-api-modelos="{{ route('materiales.api.modelos') }}"
    data-crear-familia="{{ route('materiales.familias.crear') }}"
    data-crear-tipificacion="{{ route('materiales.tipificaciones.crear') }}"
    data-crear-marca="{{ route('materiales.marcas.crear') }}"
    data-crear-modelo="{{ route('materiales.modelos.crear') }}"
    data-crear-item="{{ route('materiales.crear') }}"
    data-actualizar-base="{{ url('/materiales') }}"
    data-baja-base="{{ url('/materiales') }}"
    data-movimientos-stock-base="{{ url('/materiales') }}"
>
    <header class="hm-header">
        <h1>Materiales</h1>
        <div class="hm-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedMaterialInfo" class="selected-info">Ningún registro seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" id="btnMaterialCrear">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="e" id="btnMaterialEditar" disabled>
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>
            <button type="button" class="btn btn-baja tool-btn" data-toolbar-key="l" id="btnMaterialEliminar" disabled>
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>
        </div>
    </header>

    <div class="table-container">
        <table class="data-table" id="tablaMateriales">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">ID @include('partials.sort-icon', ['column' => 'id'])</th>
                    <th>Familia</th>
                    <th>Nombre (Tipificación familia)</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th class="sortable" data-column="stock" data-order="{{ request('order', 'asc') }}">Stock @include('partials.sort-icon', ['column' => 'stock'])</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $item)
                <tr data-id="{{ $item->id }}" data-familia-id="{{ $item->material_familia_id }}" data-tipificacion-id="{{ $item->material_tipificacion_id }}" data-descripcion="{{ e($item->tipificacion->nombre ?? $item->descripcion) }}" data-marca-id="{{ $item->material_marca_id }}" data-modelo-id="{{ $item->material_modelo_id }}" data-stock="{{ $item->stock }}">
                    <td>{{ $item->id }}</td>
                    <td>{{ $item->familia->nombre ?? '—' }}</td>
                    <td>{{ $item->tipificacion->nombre ?? $item->descripcion ?? '—' }}</td>
                    <td>{{ $item->marca->nombre ?? '—' }}</td>
                    <td>{{ $item->modelo->nombre ?? '—' }}</td>
                    <td>{{ number_format((float) $item->stock, 4, ',', '.') }}</td>
                </tr>
                @empty
                <tr><td colspan="6" class="td-vacio">No hay registros. <button type="button" class="btn btn-link" id="btnMaterialCrearVacio">Crear el primero</button></td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalMaterialItem" class="modal-overlay" aria-hidden="true" style="z-index: 120000;">
    <div class="modal-sector hm-modal hm-modal-stock">
        <div class="modal-sector-header">
            <h2 id="modalMaterialTitulo">Nuevo material</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalMaterialItem()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formMaterialItem" method="POST" class="modal-sector-body hm-modal-stock-shell">
            @csrf
            <div class="hm-modal-stock-body">
                <div class="hm-modal-stock-form">
                    <div class="form-grupo">
                        <label for="materialFamilia">Familia</label>
                        <div class="hm-stock-input-row">
                            <div class="input-group">
                                <select id="materialFamilia" name="material_familia_id" required>
                                    <option value="">— Seleccionar familia —</option>
                                </select>
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-agregar-entidad" id="btnMaterialNuevaFamilia" title="Crear familia">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-grupo">
                        <label for="materialTipificacion">Nombre (Tipificación familia)</label>
                        <div class="hm-stock-input-row">
                            <div class="input-group">
                                <select id="materialTipificacion" name="material_tipificacion_id" required>
                                    <option value="">— Seleccionar —</option>
                                </select>
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-agregar-entidad" id="btnMaterialNuevaTipificacion" title="Crear tipificación">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-grupo">
                        <label for="materialMarca">Marca</label>
                        <div class="hm-stock-input-row">
                            <div class="input-group">
                                <select id="materialMarca" name="material_marca_id" required>
                                    <option value="">— Seleccionar marca —</option>
                                </select>
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-agregar-entidad" id="btnMaterialNuevaMarca" title="Crear marca">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-grupo">
                        <label for="materialModelo">Modelo</label>
                        <div class="hm-stock-input-row">
                            <div class="input-group">
                                <select id="materialModelo" name="material_modelo_id" required>
                                    <option value="">— Seleccionar modelo —</option>
                                </select>
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-agregar-entidad" id="btnMaterialNuevoModelo" title="Crear modelo">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-grupo">
                        <label for="materialStock">Stock</label>
                        <input type="number" id="materialStock" name="stock" required min="0" step="0.0001" autocomplete="off">
                    </div>
                </div>
                <aside class="hm-stock-panel" id="materialStockPanel" hidden>
                    <h3>INFORMACION DE STOCK</h3>
                    <div id="materialStockInfoList" class="hm-stock-panel-list">
                        <p class="hm-stock-panel-empty">Sin movimientos registrados.</p>
                    </div>
                </aside>
            </div>
            <input type="hidden" name="factura_id" value="">
            <input type="hidden" name="factura_numero" value="">
            <input type="hidden" name="factura_fecha" value="">
            <input type="hidden" name="proveedor_id" value="">
            <input type="hidden" name="proveedor_nombre" value="">
            <input type="hidden" name="precio_unitario" value="">
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalMaterialItem()">Cancelar</button>
                <button type="submit" id="btnMaterialGuardar" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>
@endsection

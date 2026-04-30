@extends('layouts.dashboard')

@section('title', 'Facturas')

@section('content')
<div class="page-container facturas-container">
    <!-- Contenedor para datos de sesión de equipos por crear -->
    @if(session('equiposPorCrear'))
    <div id="datos-equipos" 
         data-equipos="{{ htmlspecialchars(json_encode(session('equiposPorCrear')), ENT_QUOTES, 'UTF-8') }}" 
         data-factura="{{ session('idFactura') }}"
         data-proveedor="{{ session('idProveedor') }}"
         style="display: none;">
    </div>
    @endif
    
    <header class="facturas-header">
        <h1>Gestión de Facturas</h1>
        <div class="facturas-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="buscar" name="buscar" class="input-buscar"
                    placeholder="Buscar número, proveedor u observación..."
                    autocomplete="off"
                    value="{{ request('buscar') }}"
                    aria-label="Buscar factura">
            </div>
            <select name="proveedor" id="proveedor" class="select-filtro" onchange="window.facturasApplyToolbarFilters()">
                <option value="">Todos los proveedores</option>
                @foreach($proveedores as $proveedor)
                    <option value="{{ $proveedor->idProveedor }}"
                        {{ request('proveedor') == $proveedor->idProveedor ? 'selected' : '' }}>
                        {{ $proveedor->proveedor }}
                    </option>
                @endforeach
            </select>
            <span id="selectedFacturaInfo" class="selected-info">Ninguna factura seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="confirmarAbrirCrearFactura()" title="Crear factura (Alt+A)">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>
            <button type="button" id="btnVerDetalleFactura" class="btn btn-primario tool-btn" data-toolbar-key="d" disabled title="Detalle (Alt+D)">
                <span class="tool-icon">📄</span><span class="tool-label"><span class="acc-k">D</span>etalle</span>
            </button>
            <button type="button" id="btnBajaFacturaToolbar" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar factura (Alt+L)">
                <span class="tool-icon">🗑️</span><span class="tool-label"><span class="acc-k">E</span>liminar</span>
            </button>
        </div>
    </header>

    <!-- Tabla de Facturas -->
    <div class="table-container">
        @if($facturas->count() > 0)
            <table class="data-table" id="tablaFacturas">
                <thead>
                    <tr>
                        <th class="sortable" data-column="idFactura" data-order="{{ request('order', 'desc') }}">
                            ID
                            @if(request('column') == 'idFactura')
                                <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                            @else
                                <span class="sort-icon">↕</span>
                            @endif
                        </th>
                        <th class="sortable" data-column="numero" data-order="{{ request('order', 'desc') }}">
                            Numero
                            @if(request('column') == 'numero')
                                <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                            @else
                                <span class="sort-icon">↕</span>
                            @endif
                        </th>
                        <th class="sortable" data-column="fecha" data-order="{{ request('order', 'desc') }}">
                            Fecha
                            @if(request('column') == 'fecha')
                                <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                            @else
                                <span class="sort-icon">↕</span>
                            @endif
                        </th>
                        <th>
                            Proveedor
                        </th>

                        <th class="sortable" data-column="total" data-order="{{ request('order', 'desc') }}">
                            Total
                            @if(request('column') == 'total')
                                <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                            @else
                                <span class="sort-icon">↕</span>
                            @endif
                        </th>
                        <th>
                            Observacion
                        </th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($facturas as $factura)
                        <tr
                            data-id="{{ $factura->idFactura }}"
                            data-numero="{{ e($factura->numero) }}"
                            data-proveedor="{{ e($factura->proveedor->proveedor ?? 'N/A') }}"
                            data-estado="{{ e($factura->estado) }}"
                            ondblclick="verDetalles({{ $factura->idFactura }})">
                            <td>{{ $factura->idFactura }}</td>
                            <td><strong>{{ $factura->numero }}</strong></td>
                            <td>{{ $factura->fecha ? $factura->fecha->format('d/m/Y') : '-' }}</td>
                            <td>{{ $factura->proveedor->proveedor ?? 'N/A' }}</td>

                            <td class="text-right"><strong>{{ number_format($factura->total ?? 0, 2, ',', '.') }}</strong></td>
                            <td>{{ Str::limit($factura->observacion, 30) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="empty-state">
                <i class="fas fa-file-invoice-dollar"></i>
                <h3>No hay facturas registradas</h3>
                <p>Comienza creando una nueva factura</p>
            </div>
        @endif
    </div>
</div>

<!-- Incluir modales -->
@include('facturas.modales')

@endsection

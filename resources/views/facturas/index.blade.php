@extends('layouts.dashboard')

@section('title', 'Facturas')

@section('content')
<div class="facturas-container">
    <!-- Header -->
    <div class="page-header">
        <h1>Gestion de Facturas</h1>
        <button class="btn btn-primary" onclick="abrirModalCrear()">
            <i class="fas fa-plus"></i> Nueva Factura
        </button>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
        <form method="GET" action="{{ route('facturas.index') }}" class="filters-form">
            <div class="filter-group">
                <label for="proveedor">Proveedor:</label>
                <select name="proveedor" id="proveedor" onchange="this.form.submit()">
                    <option value="">Todos los proveedores</option>
                    @foreach($proveedores as $proveedor)
                        <option value="{{ $proveedor->idProveedor }}" 
                            {{ request('proveedor') == $proveedor->idProveedor ? 'selected' : '' }}>
                            {{ $proveedor->proveedor }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="filter-group">
                <label for="buscar">Buscar:</label>
                <input type="text" name="buscar" id="buscar" 
                    placeholder="Numero u observacion..." 
                    value="{{ request('buscar') }}">
            </div>
            <div class="filter-group">
                <label for="column">Ordenar por:</label>
                <select name="column" id="column" onchange="this.form.submit()">
                    <option value="idFactura" {{ request('column') == 'idFactura' ? 'selected' : '' }}>ID</option>
                    <option value="numero" {{ request('column') == 'numero' ? 'selected' : '' }}>Numero</option>
                    <option value="fecha" {{ request('column') == 'fecha' ? 'selected' : '' }}>Fecha</option>
                    <option value="total" {{ request('column') == 'total' ? 'selected' : '' }}>Total</option>
                    <option value="created_at" {{ request('column') == 'created_at' ? 'selected' : '' }}>Creado</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="order">Sentido:</label>
                <select name="order" id="order" onchange="this.form.submit()">
                    <option value="asc" {{ request('order') == 'asc' ? 'selected' : '' }}>Ascendente</option>
                    <option value="desc" {{ request('order') == 'desc' ? 'selected' : '' }}>Descendente</option>
                </select>
            </div>
            <div class="filter-actions">
                <a href="{{ route('facturas.index') }}" class="btn btn-secondary">Limpiar</a>
                <a href="{{ route('facturas.inactivos') }}" class="btn btn-warning">Ver Inactivos</a>
            </div>
        </form>
    </div>

    <!-- Tabla de Facturas -->
    <div class="table-container">
        @if($facturas->count() > 0)
            <table class="data-table" id="tablaFacturas">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Numero</th>
                        <th>Fecha</th>
                        <th>Proveedor</th>
                        <th>Neto</th>
                        <th>IVA 10.5%</th>
                        <th>IVA 21%</th>
                        <th>Total</th>
                        <th>Observacion</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($facturas as $factura)
                        <tr>
                            <td>{{ $factura->idFactura }}</td>
                            <td><strong>{{ $factura->numero }}</strong></td>
                            <td>{{ $factura->fecha ? $factura->fecha->format('d/m/Y') : '-' }}</td>
                            <td>{{ $factura->proveedor->proveedor ?? 'N/A' }}</td>
                            <td class="text-right">{{ number_format($factura->neto ?? 0, 2, ',', '.') }}</td>
                            <td class="text-right">{{ number_format($factura->iva105 ?? 0, 2, ',', '.') }}</td>
                            <td class="text-right">{{ number_format($factura->iva21 ?? 0, 2, ',', '.') }}</td>
                            <td class="text-right"><strong>{{ number_format($factura->total ?? 0, 2, ',', '.') }}</strong></td>
                            <td>{{ Str::limit($factura->observacion, 30) }}</td>
                            <td class="actions-cell">
                                <button class="btn-icon btn-view btn-action" 
                                    data-id="{{ $factura->idFactura }}"
                                    data-action="detalles"
                                    title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon btn-edit btn-action"
                                    data-id="{{ $factura->idFactura }}"
                                    data-action="editar"
                                    title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                @if($factura->estado === 'activo')
                                    <button class="btn-icon btn-delete btn-action"
                                        data-id="{{ $factura->idFactura }}"
                                        data-numero="{{ $factura->numero }}"
                                        data-action="baja"
                                        title="Dar de baja">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                @else           
                                    <button class="btn-icon btn-success btn-action"
                                        data-id="{{ $factura->idFactura }}"
                                        data-numero="{{ $factura->numero }}"
                                        data-action="alta"
                                        title="Reactivar">
                                        <i class="fas fa-check"></i>
                                    </button>
                                @endif
                            </td>

                            <script>
                            document.querySelectorAll('.btn-action').forEach(btn => {
                                btn.addEventListener('click', function() {
                                    const id = this.dataset.id;
                                    const numero = this.dataset.numero;
                                    const action = this.dataset.action;

                                    if (action === 'detalles') verDetalles(id);
                                    else if (action === 'editar') abrirModalEditar(id);
                                    else if (action === 'baja') abrirModalBaja(id, numero);
                                    else if (action === 'alta') abrirModalAlta(id, numero);
                                });
                            });
                            </script>
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

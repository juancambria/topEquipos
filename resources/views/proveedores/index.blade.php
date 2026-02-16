@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/proveedores.css') }}">
@endsection

@section('content')
<div class="pagina-proveedores">
    <header class="proveedores-header">
        <h1>Proveedores</h1>
        <div class="proveedores-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar proveedor..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalProveedor('crear')">+ Nuevo Proveedor</button>
            @if(request()->routeIs('proveedores.inactivos'))
                <a href="{{ route('proveedores.index') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('proveedores.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="proveedores-tabla-wrap">
        <table class="tabla-proveedores" id="tablaProveedores">
            <thead>
                <tr>
                    <th class="sortable" data-column="idProveedor" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'idProveedor')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="proveedor" data-order="{{ request('order', 'asc') }}">
                        Proveedor
                        @if(request('column') == 'proveedor')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="mail" data-order="{{ request('order', 'asc') }}">
                        Mail
                        @if(request('column') == 'mail')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="ciudad" data-order="{{ request('order', 'asc') }}">
                        Ciudad
                        @if(request('column') == 'ciudad')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="provincia" data-order="{{ request('order', 'asc') }}">
                        Provincia
                        @if(request('column') == 'provincia')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($proveedores as $p)
                <tr>
                    <td>{{ $p->idProveedor }}</td>
                    <td>{{ $p->proveedor }}</td>
                    <td>{{ $p->mail ?? '—' }}</td>
                    <td>{{ $p->ciudad ?? '—' }}</td>
                    <td>{{ $p->provincia ?? '—' }}</td>
                    <td class="td-acciones">
                        @if(request()->routeIs('proveedores.inactivos'))
                            <form method="POST" action="{{ route('proveedores.alta', $p->idProveedor) }}" class="form-inline form-alta">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <button type="button" class="btn btn-link btn-editar-proveedor" data-id="{{ $p->idProveedor }}" data-proveedor="{{ e($p->proveedor) }}" data-mail="{{ e($p->mail ?? '') }}" data-provincia="{{ e($p->provincia ?? '') }}" data-ciudad="{{ e($p->ciudad ?? '') }}" data-codigo_postal="{{ e($p->codigo_postal ?? '') }}" data-direccion="{{ e($p->direccion ?? '') }}">Editar</button>
                            <button type="button" class="btn btn-link btn-contactos-proveedor" data-id="{{ $p->idProveedor }}">Contactos</button>
                            <form method="POST" action="{{ route('proveedores.baja', $p->idProveedor) }}" class="form-inline form-baja">
                                @csrf
                                <button type="submit" class="btn btn-link btn-baja">Baja</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="td-vacio">No hay proveedores. <button type="button" class="btn btn-link" onclick="abrirModalProveedor('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalProveedor" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalProveedorTitulo">Proveedor</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalProveedor()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formProveedor" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="proveedorNombre">Proveedor</label>
                <input type="text" id="proveedorNombre" name="proveedor" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorMail">Mail</label>
                <input type="email" id="proveedorMail" name="mail" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorDireccion">Dirección</label>
                <input type="text" id="proveedorDireccion" name="direccion" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorCiudad">Ciudad</label>
                <input type="text" id="proveedorCiudad" name="ciudad" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorProvincia">Provincia</label>
                <input type="text" id="proveedorProvincia" name="provincia" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="proveedorCodigoPostal">Código Postal</label>
                <input type="text" id="proveedorCodigoPostal" name="codigo_postal" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalProveedor()">Cancelar</button>
                <button type="submit" id="modalProveedorSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/proveedores.js') }}"></script>
@endpush
@endsection


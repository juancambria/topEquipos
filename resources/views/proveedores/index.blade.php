@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/proveedores.css') }}">
@endsection

@section('content')
@php
    $esVistaInactivos = false;
@endphp
<div class="page-container pagina-proveedores">
    <header class="proveedores-header">
        <h1>{{ $esVistaInactivos ? 'Proveedores Inactivos' : 'Gestión de Proveedores' }}</h1>
        <div class="proveedores-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar proveedor..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedProveedorInfo" class="selected-info">Ningún proveedor seleccionado</span>
                <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalProveedor('crear')" title="Alt+A"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
                <button type="button" id="btnEditarProveedor" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Alt+E"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
                <button type="button" id="btnContactosProveedor" class="btn btn-primario tool-btn" data-toolbar-key="c" disabled title="Alt+C"><span class="tool-icon">👥</span><span class="tool-label"><span class="acc-k">C</span>ontactos</span></button>
                <button type="button" id="btnEliminarProveedor" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar proveedor (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
                <!-- Botón Ver inactivos eliminado -->
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
                    <th class="sortable" data-column="telefono" data-order="{{ request('order', 'asc') }}">
                        Teléfono
                        @if(request('column') == 'telefono')
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
                </tr>
            </thead>
            <tbody>
@forelse($proveedores as $p)
                <tr data-id="{{ $p->idProveedor }}" data-proveedor="{{ e($p->proveedor) }}" data-mail="{{ e($p->mail ?? '') }}" data-telefono="{{ e($p->telefono ?? '') }}" data-provincia="{{ e($p->provincia ?? '') }}" data-ciudad="{{ e($p->ciudad ?? '') }}" data-codigo_postal="{{ e($p->codigo_postal ?? '') }}" data-direccion="{{ e($p->direccion ?? '') }}">
                    <td>{{ $p->idProveedor }}</td>

                    <td>{{ $p->proveedor }}</td>
                    <td>{{ $p->mail ?? '—' }}</td>
                    <td>{{ $p->telefono ?? '—' }}</td>
                    <td>{{ $p->ciudad ?? '—' }}</td>
                    <td>{{ $p->provincia ?? '—' }}</td>
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

<div id="modalProveedor" class="modal-overlay" data-modal-focus="#proveedorNombre" aria-hidden="true">
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
                <label for="proveedorTelefono">Teléfono</label>
                <input type="tel" id="proveedorTelefono" name="telefono" autocomplete="off" maxlength="20">
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

@endsection

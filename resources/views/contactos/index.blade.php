@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/contactos.css') }}">
@endsection

@section('content')
<div class="page-container pagina-contactos" data-context-id-proveedor="{{ $idProveedor ?? '' }}">
    <header class="contactos-header">
        <h1>Contactos de {{ $proveedor?->proveedor ?? 'Proveedor' }}</h1>
        <div class="contactos-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar contacto..." autocomplete="off" value="{{ request('search') }}">
            </div>
            <span id="selectedContactoInfo" class="selected-info">Ningún contacto seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalContacto('crear', null, null, null, null, null, null, {{ $idProveedor ?? 'null' }})" title="Alt+A"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarContacto" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Alt+E"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnEliminarContacto" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Eliminar contacto (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
            <!-- Botón Ver inactivos eliminado -->
        </div>
    </header>

    <div class="contactos-tabla-wrap">
        <table class="tabla-contactos" id="tablaContactos">
            <thead>
                <tr>

                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">
                        Nombre
                        @include('partials.sort-icon', ['column' => 'nombre'])
                    </th>
                    <th class="sortable" data-column="telefono" data-order="{{ request('order', 'asc') }}">
                        Teléfono
                        @include('partials.sort-icon', ['column' => 'telefono'])
                    </th>
                    <th class="sortable" data-column="mail" data-order="{{ request('order', 'asc') }}">
                        Mail
                        @include('partials.sort-icon', ['column' => 'mail'])
                    </th>
                    <th class="sortable" data-column="cargo" data-order="{{ request('order', 'asc') }}">
                        Cargo
                        @include('partials.sort-icon', ['column' => 'cargo'])
                    </th>
                    <th class="sortable" data-column="observacion" data-order="{{ request('order', 'asc') }}">
                        Observación
                        @include('partials.sort-icon', ['column' => 'observacion'])
                    </th>

                </tr>
                    </thead>
                    <tbody>
                        @forelse($contactos as $c)
                        <tr data-id="{{ $c->idContacto }}" data-nombre="{{ e($c->nombre) }}" data-telefono="{{ e($c->telefono ?? '') }}" data-mail="{{ e($c->mail ?? '') }}" data-cargo="{{ e($c->cargo ?? '') }}" data-observacion="{{ e($c->observacion ?? '') }}" data-id-proveedor="{{ $c->idProveedor }}">
                            <td>{{ $c->nombre }}</td>
                            <td>{{ $c->telefono ?? '—' }}</td>
                            <td>{{ $c->mail ?? '—' }}</td>
                            <td>{{ $c->cargo ?? '—' }}</td>
                            <td>{{ $c->observacion ?? '—' }}</td>
                        </tr>
                        @empty
                        <tr>
                    <td colspan="5" class="td-vacio">No hay contactos. <button type="button" class="btn btn-link" onclick="abrirModalContacto('crear', null, null, null, null, null, null, {{ $idProveedor ?? 'null' }})">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalContacto" class="modal-overlay" data-modal-focus="#contactoIdProveedor" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalContactoTitulo">Contacto</h2>
                <button type="button" class="modal-cerrar" onclick="cerrarModalContacto()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formContacto" method="POST" class="modal-sector-body">
            @csrf
            <input type="hidden" id="contactoIdProveedorHidden" name="idProveedor" value="">
            <div class="form-grupo">
                <label for="contactoIdProveedor">Proveedor</label>
                <select id="contactoIdProveedor" name="idProveedor">
                    <option value="" disabled selected>Seleccione proveedor...</option>
                    @foreach($proveedores as $p)
                        <option value="{{ $p->idProveedor }}">{{ $p->proveedor }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-grupo">
                <label for="contactoNombre">Nombre</label>
                <input type="text" id="contactoNombre" name="nombre" required autocomplete="off" maxlength="30">
            </div>

            <div class="form-grupo">
                <label for="contactoTelefono">Teléfono</label>
                <input type="text" id="contactoTelefono" name="telefono" autocomplete="off" maxlength="15" inputmode="tel">
            </div>
            <div class="form-grupo">
                <label for="contactoMail">Mail</label>
                <input type="email" id="contactoMail" name="mail" autocomplete="off" maxlength="28" title="Máximo 28 caracteres">
            </div>
            <div class="form-grupo">
                <label for="contactoCargo">Cargo</label>
                <input type="text" id="contactoCargo" name="cargo" autocomplete="off" maxlength="18">
            </div>
            <div class="form-grupo">
                <label for="contactoObservacion">Observación</label>
                <input type="text" id="contactoObservacion" name="observacion" autocomplete="off" maxlength="42">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalContacto()">Cancelar</button>
                <button type="submit" id="modalContactoSubmit" class="btn btn-primario">Guardar</button>
            </div>

        </form>
    </div>
</div>

@endsection

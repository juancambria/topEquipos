@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/contactos.css') }}">
@endsection

@section('content')
<div class="pagina-contactos">
    <header class="contactos-header">
        <h1>Contactos de {{ $proveedor?->proveedor ?? 'Proveedor' }}</h1>
        <div class="contactos-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar contacto..." autocomplete="off">
            <button type="button" class="btn btn-primario" onclick="abrirModalContacto('crear', null, null, null, null, {{ $idProveedor ?? 'null' }})">+ Nuevo Contacto</button>
            @if(request()->routeIs('contactos.inactivos'))
                <a href="{{ route('contactos.index', ['idProveedor' => $idProveedor]) }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('contactos.inactivos', ['idProveedor' => $idProveedor]) }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="contactos-tabla-wrap">
        <table class="tabla-contactos" id="tablaContactos">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Cargo</th>
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($contactos as $c)
                <tr>
                    <td>{{ $c->nombre }}</td>
                    <td>{{ $c->telefono ?? '—' }}</td>
                    <td>{{ $c->cargo ?? '—' }}</td>
                    <td class="td-acciones">
                        <button type="button" class="btn btn-link btn-editar-contacto" 
                            data-id="{{ $c->id }}" 
                            data-nombre="{{ e($c->nombre) }}" 
                            data-telefono="{{ e($c->telefono ?? '') }}" 
                            data-cargo="{{ e($c->cargo ?? '') }}" 
                            data-id-proveedor="{{ $c->idProveedor }}">Editar</button>
                        <form method="POST" action="{{ route('contactos.baja', $c) }}" class="form-inline form-baja">
                            @csrf
                            <button type="submit" class="btn btn-link btn-baja">Baja</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="td-vacio">No hay contactos. <button type="button" class="btn btn-link" onclick="abrirModalContacto('crear', null, null, null, null, {{ $idProveedor ?? 'null' }})">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div id="modalContacto" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalContactoTitulo">Contacto</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalContacto()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formContacto" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="contactoNombre">Nombre</label>
                <input type="text" id="contactoNombre" name="nombre" required autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="contactoIdProveedor">Proveedor</label>
                <select id="contactoIdProveedor" name="idProveedor" required>
                    @foreach($proveedores as $p)
                        <option value="{{ $p->idProveedor }}">{{ $p->proveedor }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-grupo">
                <label for="contactoTelefono">Teléfono</label>
                <input type="text" id="contactoTelefono" name="telefono" autocomplete="off">
            </div>
            <div class="form-grupo">
                <label for="contactoCargo">Cargo</label>
                <input type="text" id="contactoCargo" name="cargo" autocomplete="off">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalContacto()">Cancelar</button>
                <button type="submit" id="modalContactoSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/contactos.js') }}"></script>
@endpush
@endsection


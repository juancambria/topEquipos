@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/contactos.css') }}">
@endsection

@section('content')
<div class="pagina-contactos">
    <header class="contactos-header">
        <h1>Contactos - Vista General</h1>
        <div class="contactos-toolbar">
            <input type="search" id="buscador" class="input-buscar" placeholder="Buscar contacto..." autocomplete="off">
            @if(request()->routeIs('contactos.inactivos'))
                <a href="{{ route('contactos.general') }}" class="btn btn-primario">Ver activos</a>
            @else
                <a href="{{ route('contactos.inactivos') }}" class="btn btn-primario">Ver inactivos</a>
            @endif
        </div>
    </header>

    <div class="contactos-tabla-wrap">
        <table class="tabla-contactos" id="tablaContactosGeneral">
            <thead>
                <tr>
                    <th class="sortable" data-column="idContacto" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'idContacto')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="nombre" data-order="{{ request('order', 'asc') }}">
                        Nombre
                        @if(request('column') == 'nombre')
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
                    <th class="sortable" data-column="cargo" data-order="{{ request('order', 'asc') }}">
                        Cargo
                        @if(request('column') == 'cargo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th>Proveedor</th>
                    @if(request()->routeIs('contactos.inactivos'))
                    <th>Estado</th>
                    @endif
                    <th class="th-acciones">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($contactos as $c)
                <tr>
                    <td>{{ $c->idContacto }}</td>
                    <td>{{ $c->nombre }}</td>
                    <td>{{ $c->telefono ?? '—' }}</td>
                    <td>{{ $c->cargo ?? '—' }}</td>
                    <td>{{ $c->proveedor->proveedor ?? '—' }}</td>
                    @if(request()->routeIs('contactos.inactivos'))
                    <td><span class="badge badge-baja">{{ $c->estado }}</span></td>
                    @endif
                    <td class="td-acciones">
                        @if(request()->routeIs('contactos.inactivos'))
                            <form method="POST" action="{{ route('contactos.alta', $c) }}" class="form-inline" onsubmit="return confirm('¿Activar este contacto?')">
                                @csrf
                                <button type="submit" class="btn btn-link btn-alta">Alta</button>
                            </form>
                        @else
                            <a href="{{ route('contactos.index', $c->idProveedor) }}" class="btn btn-link">Ver</a>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="td-vacio">
                        @if(request()->routeIs('contactos.inactivos'))
                            No hay contactos inactivos.
                        @else
                            No hay contactos.
                        @endif
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/contactos-general.js') }}"></script>
@endpush
@endsection


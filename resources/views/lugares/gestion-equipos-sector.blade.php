@extends('layouts.dashboard')

@section('title', 'Gestión de Equipos por Sector')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/gestion-equipos-sector.css') }}">
@endsection

@section('content')
<div class="page-container pagina-gestion-equipos-sector">
    <header class="gestion-equipos-sector-header">
        <h1>Gestión de Equipos por Sector</h1>
        <div class="gestion-equipos-sector-toolbar">
            <span id="infoSeleccionGES" class="selected-info">Seleccione una ubicación y un sector.</span>
        </div>
    </header>

    <div class="ges-layout">
        <section class="ges-columna">
            <h2>Ubicaciones</h2>
            <div class="ges-tabla-wrap">
                <table class="ges-tabla" id="tablaGesUbicaciones">
                    <thead>
                        <tr>
                            <th class="ges-sortable" data-sort-key="id" data-sort-type="number">
                                ID <span class="ges-sort-icon">↕</span>
                            </th>
                            <th class="ges-sortable" data-sort-key="nombre" data-sort-type="string">
                                Nombre <span class="ges-sort-icon">↕</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($ubicaciones as $ubicacion)
                            <tr data-id="{{ $ubicacion->id }}" data-nombre="{{ e($ubicacion->nombre) }}">
                                <td>{{ $ubicacion->id }}</td>
                                <td>{{ $ubicacion->nombre }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="2" class="td-vacio">No hay ubicaciones activas.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>

        <section class="ges-columna ges-columna-centro">
            <div id="gesVistaSectores">
                <h2>Sectores</h2>
                <div class="ges-tabla-wrap">
                    <table class="ges-tabla" id="tablaGesSectores">
                        <thead>
                            <tr>
                                <th class="ges-sortable" data-sort-key="id" data-sort-type="number">
                                    ID <span class="ges-sort-icon">↕</span>
                                </th>
                                <th class="ges-sortable" data-sort-key="nombre" data-sort-type="string">
                                    Nombre <span class="ges-sort-icon">↕</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="2" class="td-vacio">Seleccione una ubicación.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="gesVistaAsignados" class="ges-oculto">
                <div class="ges-centro-header">
                    <button type="button" id="btnGesVolverSectores" class="btn btn-secundario ges-btn-volver" title="Volver a sectores">
                        ← Volver
                    </button>
                    <h2 id="gesTituloAsignados">Equipos del Sector</h2>
                </div>
                <div class="ges-tabla-wrap">
                    <table class="ges-tabla" id="tablaGesTiposAsignados">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="3" class="td-vacio">Seleccione un sector.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <section class="ges-controles-columna">
            <section class="ges-controles">
                <button type="button" id="btnGesAsignar" class="btn btn-primario ges-btn-flecha" disabled title="Agregar tipo al sector">←</button>
                <button type="button" id="btnGesQuitar" class="btn btn-secundario ges-btn-flecha" disabled title="Quitar tipo del sector">→</button>
            </section>
        </section>

        <section class="ges-columna ges-columna-tipos">
            <h2>Tipos Disponibles</h2>
            <div class="ges-tabla-wrap">
                <table class="ges-tabla" id="tablaGesTiposDisponibles">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="2" class="td-vacio">Seleccione un sector.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/gestion-equipos-sector.js') }}?v={{ time() }}"></script>
@endpush

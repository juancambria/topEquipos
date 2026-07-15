@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/sectores.css') }}">
@endsection

@section('content')
<div class="page-container pagina-sectores">
    <header class="sectores-header">
        <h1>Gestión de Sectores</h1>
        <div class="sectores-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar por nombre" autocomplete="off" value="{{ request('search') }}" aria-label="Buscar sector por nombre">
            </div>
            <span id="selectedSectorInfo" class="selected-info">Ningún sector seleccionado</span>

            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalSector('crear')" title="Alt+A">
                <span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span>
            </button>

            <button type="button" id="btnEditarSector" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Alt+E">
                <span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span>
            </button>

            <button type="button" id="btnEliminarSector" class="btn btn-baja tool-btn" data-toolbar-key="l" disabled title="Alt+L">
                <span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span>
            </button>

            <button type="button" id="btnVerUbicacionesSector" class="btn btn-primario tool-btn" data-toolbar-key="u" disabled title="Alt+U">
                <span class="tool-icon">📂</span><span class="tool-label"><span class="acc-k">U</span>bicaciones</span>
            </button>
        </div>
    </header>

    <div class="sectores-tabla-wrap">
        <table class="tabla-sectores" id="tablaSectores">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sectores as $s)
                <tr data-id="{{ $s->id }}" data-nombre="{{ e($s->nombre) }}">
                    <td>{{ $s->id }}</td>
                    <td>{{ $s->nombre }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="2" class="td-vacio">
                        No hay sectores.
                        <button type="button" class="btn btn-link" onclick="abrirModalSector('crear')">
                            Crear el primero
                        </button>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

{{-- MODAL CREAR / EDITAR --}}
<div id="modalSector" class="modal-overlay" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2 id="modalSectorTitulo">Sector</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalSector()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>

        <form id="formSector" method="POST" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label>Nombre</label>
                <input type="text" id="sectorNombre" name="nombre" required>
            </div>

            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalSector()">
                    Cancelar
                </button>
                <button type="submit" id="modalSectorSubmit" class="btn btn-primario">
                    Guardar
                </button>
            </div>
        </form>
    </div>
</div>

{{-- MODAL UBICACIONES --}}
<div id="modalUbicacionesSector" class="modal-overlay" data-modal-focus="#btnAgregarUbicacionDesdeSector" aria-hidden="true">
    <div class="modal-sector" style="max-width: 500px;">
        <div class="modal-sector-header">
            <h2 id="tituloUbicacionesSector">Ubicaciones del sector</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalUbicacionesSector()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
             <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">
                Seleccione/marque con una tilde a las ubicaciones que pertenecen a este sector.
            </p>
            <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
                <button type="button" class="btn btn-primario" id="btnAgregarUbicacionDesdeSector">Agregar ubicación</button>
            </div>
            <table class="tabla-modal" id="tablaUbicacionesSector">
                <thead>
                    <tr>
                        <th style="width: 40px;">&nbsp;</th>
                        <th>Nombre</th>
                    </tr>
                </thead>
                <tbody id="bodyUbicacionesSector"></tbody>
            </table>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalUbicacionesSector()">Guardar</button>
            </div>
        </div>
    </div>
</div>

{{-- CSS Toast ADICIONAL --}}
<style>
.toast-container {
    z-index: 100000 !important;
}
.toast {
    z-index: 100001 !important;
}
</style>

@endsection

@section('scripts')
<script src="{{ asset('js/sectores.js') }}"></script>
@endsection


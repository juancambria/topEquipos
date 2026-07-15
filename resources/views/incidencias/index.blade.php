@extends('layouts.dashboard')

@section('title', 'Incidencias')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/operaciones.css') }}">
@endsection

@section('content')
<div class="page-container pagina-operaciones" id="paginaIncidencias"
     data-vista="{{ $vista }}"
     data-api-calendario="{{ route('incidencias.api.calendario') }}"
     data-url-crear="{{ route('incidencias.crear') }}"
     data-url-base="{{ url('/incidencias') }}">
    <header class="operaciones-header">
        <h1>Incidencias</h1>
        <div class="operaciones-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." value="{{ request('search') }}" autocomplete="off">
            </div>
            <select id="filtroEstado" class="search-column" aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                @foreach(\App\Models\Incidencia::ESTADOS as $est)
                <option value="{{ $est }}" @selected($filtroEstado === $est)>{{ ucfirst(str_replace('_', ' ', $est)) }}</option>
                @endforeach
            </select>
            <select id="filtroPrioridad" class="search-column" aria-label="Filtrar por prioridad">
                <option value="">Todas las prioridades</option>
                @foreach(\App\Models\Incidencia::PRIORIDADES as $pri)
                <option value="{{ $pri }}" @selected($filtroPrioridad === $pri)>{{ ucfirst($pri) }}</option>
                @endforeach
            </select>
            <div class="op-vista-toggle" role="group" aria-label="Tipo de vista">
                <button type="button" data-vista="calendario" class="{{ $vista === 'calendario' ? 'active' : '' }}">📅 Calendario</button>
                <button type="button" data-vista="tabla" class="{{ $vista === 'tabla' ? 'active' : '' }}">📋 Tabla</button>
            </div>
            <span id="selectedInfo" class="selected-info">Ninguna incidencia seleccionada</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" id="btnAnadir" title="Añadir (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="e" id="btnEditar" disabled title="Editar (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" class="btn btn-baja tool-btn" data-toolbar-key="l" id="btnEliminar" disabled title="Eliminar (Alt+L)"><span class="tool-icon">🗑️</span><span class="tool-label">E<span class="acc-k">l</span>iminar</span></button>
        </div>
    </header>

    <div id="vistaCalendario" class="op-calendario-wrap {{ $vista === 'tabla' ? 'op-hidden' : '' }}">
        <div class="op-cal-nav">
            <button type="button" id="calPrev" aria-label="Mes anterior">◀</button>
            <h2 id="calTitulo"></h2>
            <button type="button" id="calNext" aria-label="Mes siguiente">▶</button>
        </div>
        <div class="op-cal-grid" id="calDow"></div>
        <div class="op-cal-grid" id="calGrid"></div>
    </div>

    <div id="vistaTabla" class="op-tabla-wrap {{ $vista === 'calendario' ? 'op-hidden' : '' }}">
        <table id="tablaIncidencias">
            <thead>
                <tr>
                    <th class="sortable" data-column="idIncidencia">Código</th>
                    <th class="sortable" data-column="fecha">Fecha</th>
                    <th>Lugar</th>
                    <th>Sector</th>
                    <th>Técnico</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Resolución</th>
                    <th>Prioridad</th>
                    <th>Partes</th>
                </tr>
            </thead>
            <tbody>
                @forelse($incidencias as $i)
                <tr data-id="{{ $i->idIncidencia }}"
                    data-fecha="{{ $i->fecha?->format('Y-m-d') }}"
                    data-estado="{{ $i->estado }}">
                    <td>{{ $i->idIncidencia }}</td>
                    <td>{{ $i->fecha?->format('d/m/Y') }}</td>
                    <td>{{ $i->ubicacion?->nombre ?? '—' }}</td>
                    <td>{{ $i->sector?->nombre ?? '—' }}</td>
                    <td>{{ $i->tecnico?->nombre ?? '—' }}</td>
                    <td>{{ $i->incidencia }}</td>
                    <td><span class="op-badge op-estado-{{ $i->estado }}">{{ $i->estado_label }}</span></td>
                    <td>{{ $i->fechaResolucion?->format('d/m/Y') ?? '—' }}</td>
                    <td>{{ $i->prioridad_label }}</td>
                    <td>{{ $i->partesTrabajo->count() }}</td>
                </tr>
                @empty
                <tr><td colspan="10" class="td-vacio">No hay incidencias registradas.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@include('incidencias.modales', ['ubicaciones' => $ubicaciones, 'tecnicos' => $tecnicos])
@endsection

@push('scripts')
<script src="{{ asset('js/operaciones-form-common.js') }}"></script>
<script src="{{ asset('js/operaciones-calendar.js') }}"></script>
<script src="{{ asset('js/incidencias.js') }}"></script>
@endpush

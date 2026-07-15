@extends('layouts.dashboard')

@section('title', 'Partes de trabajo')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/operaciones.css') }}">
@endsection

@section('content')
<div class="page-container pagina-operaciones" id="paginaPartes"
     data-vista="{{ $vista }}"
     data-api-calendario="{{ route('partesTrabajo.api.calendario') }}"
     data-url-crear="{{ route('partesTrabajo.crear') }}"
     data-url-base="{{ url('/partes-trabajo') }}"
     data-api-equipos="{{ route('partesTrabajo.api.equipos') }}">
    <header class="operaciones-header">
        <h1>Partes de trabajo</h1>
        <div class="operaciones-toolbar">
            <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." value="{{ request('search') }}" autocomplete="off">
            </div>
            <select id="filtroTipo" class="search-column" aria-label="Filtrar por tipo">
                <option value="">Todos los tipos</option>
                @foreach(\App\Models\ParteTrabajo::TIPOS as $tipo)
                <option value="{{ $tipo }}" @selected($filtroTipo === $tipo)>{{ $tipo === 'mantenimiento' ? 'Mantenimiento' : 'Tarea general' }}</option>
                @endforeach
            </select>
            <div class="op-vista-toggle" role="group" aria-label="Tipo de vista">
                <button type="button" data-vista="calendario" class="{{ $vista === 'calendario' ? 'active' : '' }}">📅 Calendario</button>
                <button type="button" data-vista="tabla" class="{{ $vista === 'tabla' ? 'active' : '' }}">📋 Tabla</button>
            </div>
            <span id="selectedInfo" class="selected-info">Ningún parte seleccionado</span>
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
        <table id="tablaPartes">
            <thead>
                <tr>
                    <th class="sortable" data-column="idParteTrabajo">Código</th>
                    <th class="sortable" data-column="fecha">Fecha</th>
                    <th>Tipo</th>
                    <th>Lugar</th>
                    <th>Sector</th>
                    <th>Equipo</th>
                    <th>Incidencia</th>
                    <th>Descripción</th>
                </tr>
            </thead>
            <tbody>
                @forelse($partes as $p)
                <tr data-id="{{ $p->idParteTrabajo }}" data-fecha="{{ $p->fecha?->format('Y-m-d') }}" data-tipo="{{ $p->tipo }}">
                    <td>{{ $p->idParteTrabajo }}</td>
                    <td>{{ $p->fecha?->format('d/m/Y') }}</td>
                    <td><span class="op-badge op-estado-{{ $p->tipo }}">{{ $p->tipo_label }}</span></td>
                    <td>{{ $p->ubicacion?->nombre ?? '—' }}</td>
                    <td>{{ $p->sector?->nombre ?? '—' }}</td>
                    <td>{{ $p->equipo ? ($p->equipo->serie ?: '#' . $p->equipo->id) : '—' }}</td>
                    <td>{{ $p->incidencia ? '#' . $p->incidencia->idIncidencia . ' — ' . Str::limit($p->incidencia->incidencia, 40) : '—' }}</td>
                    <td>{{ Str::limit($p->descripcionTrabajo, 60) }}</td>
                </tr>
                @empty
                <tr><td colspan="8" class="td-vacio">No hay partes de trabajo registrados.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@include('partes_trabajo.modales', [
    'ubicaciones' => $ubicaciones,
    'incidencias' => $incidencias,
    'materiales' => $materiales,
    'tipos' => $tipos,
])
@endsection

@push('scripts')
<script src="{{ asset('js/operaciones-form-common.js') }}"></script>
<script src="{{ asset('js/operaciones-calendar.js') }}"></script>
<script src="{{ asset('js/partes-trabajo.js') }}"></script>
@endpush

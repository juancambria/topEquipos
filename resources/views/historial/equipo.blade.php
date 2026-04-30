@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/historial.css') }}">
@endsection

@section('content')
<div class="page-container pagina-historial">
    <header class="historial-header">
        <h1>Historial: {{ $equipo->serie }}</h1>
        <div class="historial-toolbar">
            <a href="{{ route('equipos.index') }}{{ request()->has('window') ? '?window=1' : '' }}" class="btn-link">← Volver a Equipos</a>
        </div>
    </header>

    <div class="historial-tabla-wrap">
        <table class="tabla-historial" id="tablaHistorialEquipo">
            <thead>
                <tr>
                    <th class="sortable" data-column="accion" data-order="asc">
                        Acción
                        <span class="sort-icon">↕</span>
                    </th>
                    <th class="sortable" data-column="detalle" data-order="asc">
                        Detalle
                        <span class="sort-icon">↕</span>
                    </th>
                    <th>Observación</th>
                    <th class="sortable" data-column="created_at" data-order="desc">
                        Fecha
                        <span class="sort-icon">↕</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($historial as $item)
                <tr>
                    <td>{{ $item->accion }}</td>
                    <td>{{ $item->detalle }}</td>
                    <td>{{ $item->observacion ?? '—' }}</td>
                    <td>{{ $item->created_at?->format('d/m/Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="td-vacio">No hay registros para este equipo.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

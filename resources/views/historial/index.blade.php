@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/historial.css') }}">
@endsection

@section('content')
<div class="pagina-historial">
    <header class="historial-header">
        <h1>Historial de Equipos</h1>
        <div class="historial-toolbar">
            <input type="search" id="buscadorHistorial" class="input-buscar" placeholder="Buscar por acción, detalle o equipo..." autocomplete="off">
        </div>
    </header>

    <div class="historial-tabla-wrap">
        <table class="tabla-historial" id="tablaHistorial">
            <thead>
                <tr>
                    <th class="sortable" data-column="equipo" data-order="{{ request('order', 'desc') }}">
                        Equipo (serie)
                        @if(request('column') == 'equipo')
                            <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="accion" data-order="{{ request('order', 'desc') }}">
                        Acción
                        @if(request('column') == 'accion')
                            <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="detalle" data-order="{{ request('order', 'desc') }}">
                        Detalle
                        @if(request('column') == 'detalle')
                            <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th>Observación</th>
                    <th class="sortable" data-column="created_at" data-order="{{ request('order', 'desc') }}">
                        Fecha
                        @if(request('column') == 'created_at')
                            <span class="sort-icon">{{ request('order', 'desc') == 'desc' ? '▼' : '▲' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($historial as $item)
                <tr>
                    <td>
                        @if($item->equipo)
                            <a href="{{ route('historial.equipo', $item->equipo->id) }}" class="btn-link">{{ $item->equipo->serie }}</a>
                        @else
                            —
                        @endif
                    </td>
                    <td>{{ $item->accion }}</td>
                    <td>{{ $item->detalle }}</td>
                    <td>{{ $item->observacion ?? '—' }}</td>
                    <td>{{ $item->created_at?->format('d/m/Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="td-vacio">No hay registros en el historial.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@push('scripts')
<script>
document.getElementById('buscadorHistorial')?.addEventListener('input', function() {
    var f = this.value.toLowerCase().trim();
    document.querySelectorAll('#tablaHistorial tbody tr').forEach(function(tr) {
        if (tr.querySelector('.td-vacio')) return;
        tr.style.display = tr.innerText.toLowerCase().indexOf(f) >= 0 ? '' : 'none';
    });
});
</script>
@endpush
@endsection

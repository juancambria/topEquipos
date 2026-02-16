<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Inventario')</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/toast.css') }}">
    <link rel="stylesheet" href="{{ asset('css/facturas.css') }}">
    @yield('styles')
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>

<div class="app">
    <header class="topbar">
        <span class="app-title">Inventario</span>
    </header>

    <div class="main">
        <aside class="sidebar">
            <!-- Grupo General -->
            <div class="sidebar-group">
                <button class="sidebar-group-btn collapsed" data-group="general">
                    General
                    <span class="arrow">▶</span>
                </button>
                <div class="sidebar-group-content collapsed" id="group-general">
                    <a href="{{ route('equipos.index') }}">Equipos</a>
                    <a href="{{ route('tipos.index') }}">Tipos</a>
                    <a href="{{ route('marcas.index') }}">Marcas</a>
                    <a href="{{ route('modelos.index') }}">Modelos</a>
                    <a href="{{ route('historial.index') }}">Historial</a>
                </div>
            </div>

            <!-- Grupo Lugares -->
            <div class="sidebar-group">
                <button class="sidebar-group-btn collapsed" data-group="lugares">
                    Lugares
                    <span class="arrow">▶</span>
                </button>
                <div class="sidebar-group-content collapsed" id="group-lugares">
                    <a href="{{ route('ubicaciones.index') }}">Ubicaciones</a>
                    <a href="{{ route('sectores.index') }}">Sectores</a>
                </div>
            </div>

            <!-- Grupo Comercial -->
            <div class="sidebar-group">
                <button class="sidebar-group-btn collapsed" data-group="comercial">
                    Comercial
                    <span class="arrow">▶</span>
                </button>
                <div class="sidebar-group-content collapsed" id="group-comercial">
                    <a href="{{ route('proveedores.index') }}">Proveedores</a>
                    <a href="{{ route('contactos.general') }}">Contactos</a>
                    <a href="{{ route('facturas.index') }}">Facturas</a>
                </div>
            </div>
        </aside>

        <section class="content">
            @if(session('success'))
                <div class="mensaje mensaje-success">{{ session('success') }}</div>
            @endif
            @if(session('error'))
                <div class="mensaje mensaje-error">{{ session('error') }}</div>
            @endif
            @yield('content')
        </section>
    </div>
</div>

@if(session('success'))
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            mostrarToast("{{ session('success') }}", 'success');
        });
    </script>
@endif

@if(session('error'))
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            mostrarToast("{{ session('error') }}", 'error');
        });
    </script>
@endif

<script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/toast.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/facturas.js') }}?v={{ time() }}"></script>
@stack('scripts')

</body>
</html>

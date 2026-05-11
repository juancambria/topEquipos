<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Inventario')</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/crud-entities.css') }}">
    <link rel="stylesheet" href="{{ asset('css/toast.css') }}">
    <link rel="stylesheet" href="{{ asset('css/facturas.css') }}">
    <link rel="stylesheet" href="{{ asset('css/equipos.css') }}">
    @yield('styles')
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body class="{{ request()->boolean('window') ? 'window-embedded' : 'window-shell' }}">

@if (request()->has('window'))
    <div class="embedded-page">
        @yield('content')
    </div>
@else
    <div class="app">
        <header class="topbar">
            <div class="topbar-left">
                <div class="topbar-brand">
                    <img src="{{ asset('storage/logo/logoTop.png') }}" class="app-logo" alt="Logo">
                </div>
            </div>

            <div class="topbar-right">
                <!-- FILA 1 -->
                <div class="topbar-row topbar-row-top">
                    <nav class="app-nav" aria-label="Navegación principal">

                        <div class="app-menu">
                            <button type="button" class="app-menu-toggle" data-menu="general">
                                General <span class="app-menu-arrow">▾</span>
                            </button>
                            <div class="app-menu-panel" id="menu-general">
                                <a href="{{ route('equipos.index') }}">Equipos</a>
                                <a href="{{ route('tipos.index') }}">Tipos</a>
                                <a href="{{ route('marcas.index') }}">Marcas</a>
                                <a href="{{ route('modelos.index') }}">Modelos</a>
                                <a href="{{ route('atributosTiposEquipos.index') }}">Atributos de Tipos de Equipos</a>
                                <a href="{{ route('historial.index') }}">Historial</a>
                            </div>
                        </div>

                        <div class="app-menu">
                            <button type="button" class="app-menu-toggle" data-menu="lugares">
                                Lugares <span class="app-menu-arrow">▾</span>
                            </button>
                            <div class="app-menu-panel" id="menu-lugares">
                                <a href="{{ route('ubicaciones.index') }}">Ubicaciones</a>
                                <a href="{{ route('sectores.index') }}">Sectores</a>
                                <a href="{{ route('lugares.equiposSector.index') }}">Gestión de Equipos por Sector</a>
                            </div>
                        </div>

                        <div class="app-menu">
                            <button type="button" class="app-menu-toggle" data-menu="comercial">
                                Comercial <span class="app-menu-arrow">▾</span>
                            </button>
                            <div class="app-menu-panel" id="menu-comercial">
                                <a href="{{ route('proveedores.index') }}">Proveedores</a>
                                <a href="{{ route('contactos.general') }}">Contactos</a>
                                <a href="{{ route('facturas.index') }}">Facturas</a>
                            </div>
                        </div>

                    </nav>

                    @auth
                        <div class="topbar-actions">
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button type="submit" class="logout-btn">Cerrar sesión</button>
                            </form>
                        </div>
                    @endauth
                </div>

                <!-- FILA 2 -->
                <div class="topbar-row topbar-row-bottom">
                    <nav class="topbar-shortcuts">
                        <a href="{{ route('dashboard') }}" class="topbar-shortcut" data-home-link="true">
                            <span class="topbar-shortcut-icon">🏠</span>
                            Inicio
                        </a>
                        <a href="{{ route('equipos.index') }}" class="topbar-shortcut">
                            <span class="topbar-shortcut-icon">💻</span>
                            Equipos
                        </a>
                        <a href="{{ route('facturas.index') }}" class="topbar-shortcut">
                            <span class="topbar-shortcut-icon">🧾</span>
                            Facturas
                        </a>
                        <a href="{{ route('proveedores.index') }}" class="topbar-shortcut">
                            <span class="topbar-shortcut-icon">🏢</span>
                            Proveedores
                        </a>
                        <a href="{{ route('ubicaciones.index') }}" class="topbar-shortcut">
                            <span class="topbar-shortcut-icon">📍</span>
                            Ubicaciones
                        </a>
                    </nav>
                </div>
            </div>
        </header>

        <div class="main">
            <section class="content desktop-shell">
                <div
                    class="desktop-area"
                    id="desktopArea"
                    data-current-path="{{ request()->getPathInfo() }}"
                    data-current-title="@yield('title', 'Inventario')"
                    data-is-home="{{ request()->routeIs('dashboard') ? 'true' : 'false' }}"
                >
                    @yield('content')
                </div>
                <div class="taskbar" id="taskbar">
                    <div class="taskbar-windows" id="taskbarWindows"></div>
                </div>
            </section>
        </div>
    </div>
@endif

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

@if(session('warning'))
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            mostrarToast("{{ session('warning') }}", 'warning');
        });
    </script>
@endif
@include('partials.modales-entidades')

@if(session('equiposPorCrear'))
<div id="datos-equipos"
     data-equipos='@json(session("equiposPorCrear"))'
     data-factura='{{ session("idFactura") ?? 0 }}'
     data-proveedor='{{ session("idProveedor") ?? 0 }}'>
</div>
@endif



<script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/toast.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/crud-common.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/input-limits.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/modal-keyboard.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/toolbar-accesskeys.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/equipos.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/facturas.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/marcas.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/tipos.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/modelos.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/atributos-tipos-equipos.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/proveedores.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/contactos.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/ubicaciones.js') }}?v={{ time() }}"></script>
<script src="{{ asset('js/sectores.js') }}?v={{ time() }}"></script>
@stack('scripts')

</body>
</html>

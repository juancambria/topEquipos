<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\TipoController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\ContactoController;
use App\Http\Controllers\UbicacionController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\ModeloController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\HistorialController;
use App\Http\Controllers\FacturaController;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {

Route::get('/api/sectores/ubicacion/{id}', [SectorController::class, 'porUbicacion']);
Route::get('/api/ubicaciones/{id}/sectores-vinculacion', [SectorController::class, 'paraVinculacion']);

/*
|--------------------------------------------------------------------------
| API ROUTES (JSON responses for AJAX)
|--------------------------------------------------------------------------
*/
// Marcas API
Route::get('/marcas/api', [MarcaController::class, 'apiIndex'])->name('marcas.api');

// Tipos API
Route::get('/tipos/api', [TipoController::class, 'apiIndex'])->name('tipos.api');

// Ubicaciones API
Route::get('/ubicaciones/api', function() {
    $ubicaciones = \App\Models\Ubicacion::where('estado', 'activo')->orderBy('nombre')->get(['id', 'codigo', 'nombre']);
    return response()->json($ubicaciones);
});

// Proveedores API
Route::get('/proveedores/api', function() {
    $proveedores = \App\Models\Proveedor::where('estado', 'activo')->orderBy('proveedor')->get(['idProveedor', 'proveedor']);
    return response()->json($proveedores);
});

/*
|--------------------------------------------------------------------------
| MARCAS
|--------------------------------------------------------------------------
*/
Route::prefix('marcas')->group(function () {
    Route::get('/', [MarcaController::class, 'index'])->name('marcas.index');
    Route::get('/inactivos', [MarcaController::class, 'inactivos'])->name('marcas.inactivos');
    Route::get('/{id}/tipos-vinculacion', [MarcaController::class, 'tiposParaVinculacion'])->name('marcas.tiposVinculacion');
    Route::post('/crear', [MarcaController::class, 'crear'])->name('marcas.crear');
    Route::post('/asociar-tipo', [MarcaController::class, 'asociarTipo'])->name('marcas.asociarTipo');
    Route::post('/{id}/actualizar', [MarcaController::class, 'actualizar'])->name('marcas.actualizar');
    Route::post('/{id}/baja', [MarcaController::class, 'baja'])->name('marcas.baja');
    Route::post('/{id}/alta', [MarcaController::class, 'alta'])->name('marcas.alta');
});

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/
Route::prefix('tipos')->group(function () {
    Route::get('/', [TipoController::class, 'index'])->name('tipos.index');
    Route::get('/inactivos', [TipoController::class, 'inactivos'])->name('tipos.inactivos');
    Route::post('/crear', [TipoController::class, 'crear'])->name('tipos.crear');
    Route::post('/{id}/actualizar', [TipoController::class, 'actualizar'])->name('tipos.actualizar');
    Route::post('/{id}/baja', [TipoController::class, 'baja'])->name('tipos.baja');
    Route::post('/{id}/alta', [TipoController::class, 'alta'])->name('tipos.alta');
});

/*
|--------------------------------------------------------------------------
| PROVEEDORES
|--------------------------------------------------------------------------
*/
Route::prefix('proveedores')->group(function () {
    Route::get('/', [ProveedorController::class, 'index'])->name('proveedores.index');
    Route::get('/{id}/tiene-equipos', [ProveedorController::class, 'apiTieneEquipos']);
    Route::post('/crear', [ProveedorController::class, 'crear'])->name('proveedores.crear');
    Route::post('/{id}/actualizar', [ProveedorController::class, 'actualizar'])->name('proveedores.actualizar');
    Route::delete('/{id}/baja', [ProveedorController::class, 'baja'])->name('proveedores.baja');
});

/*
|--------------------------------------------------------------------------
| CONTACTOS
|--------------------------------------------------------------------------
*/
Route::prefix('contactos')->group(function () {
    Route::get('/', [ContactoController::class, 'general'])->name('contactos.general');
    Route::get('/proveedor/{idProveedor}', [ContactoController::class, 'index'])->name('contactos.index');
    Route::post('/crear', [ContactoController::class, 'crear'])->name('contactos.crear');
    Route::post('/{id}/actualizar', [ContactoController::class, 'actualizar'])->name('contactos.actualizar');
    Route::delete('/{id}/baja', [ContactoController::class, 'baja'])->name('contactos.baja');
});

/*
|--------------------------------------------------------------------------
| UBICACIONES
|--------------------------------------------------------------------------
*/
Route::prefix('ubicaciones')->group(function () {
    Route::get('/', [UbicacionController::class, 'index'])->name('ubicaciones.index');
    Route::get('/inactivos', [UbicacionController::class, 'inactivos'])->name('ubicaciones.inactivos');
    Route::post('/crear', [UbicacionController::class, 'crear'])->name('ubicaciones.crear');
    Route::post('/{id}/actualizar', [UbicacionController::class, 'actualizar'])->name('ubicaciones.actualizar');
    Route::post('/{id}/baja', [UbicacionController::class, 'baja'])->name('ubicaciones.baja');
    Route::post('/{id}/alta', [UbicacionController::class, 'alta'])->name('ubicaciones.alta');
});

/*
|--------------------------------------------------------------------------
| SECTORES
|--------------------------------------------------------------------------
*/
Route::prefix('sectores')->group(function () {
    Route::get('/', [SectorController::class, 'index'])->name('sectores.index');
    Route::get('/inactivos', [SectorController::class, 'inactivos'])->name('sectores.inactivos');
    Route::post('/crear', [SectorController::class, 'crear'])->name('sectores.crear');
    Route::post('/{id}/actualizar', [SectorController::class, 'actualizar'])->name('sectores.actualizar');
    Route::post('/asociar', [SectorController::class, 'asociar'])->name('sectores.asociar');
    Route::post('/{id}/baja', [SectorController::class, 'baja'])->name('sectores.baja');
    Route::post('/{id}/alta', [SectorController::class, 'alta'])->name('sectores.alta');
    Route::get('/{id}/ubicaciones', [SectorController::class, 'ubicacionesParaSector'])->name('sectores.ubicaciones');
    Route::post('/{id}/sync-ubicaciones', [SectorController::class, 'syncUbicaciones'])->name('sectores.syncUbicaciones');
});

/*
|--------------------------------------------------------------------------
| MODELOS
|--------------------------------------------------------------------------
*/
Route::prefix('modelos')->group(function () {
    Route::get('/', [ModeloController::class, 'index'])->name('modelos.index');
    Route::get('/inactivos', [ModeloController::class, 'inactivos'])->name('modelos.inactivos');
    Route::get('/marca/{idMarca}', [ModeloController::class, 'porMarca'])->name('modelos.porMarca');
    Route::get('/marca/{idMarca}/tipo/{idTipo}', [ModeloController::class, 'porMarcaYTipo'])->name('modelos.porMarcaYTipo');
    Route::post('/crear', [ModeloController::class, 'store'])->name('modelos.store');
    Route::post('/{modelo}/actualizar', [ModeloController::class, 'update'])->name('modelos.actualizar');
    Route::post('/{modelo}/baja', [ModeloController::class, 'destroy'])->name('modelos.baja');
    Route::post('/{modelo}/alta', [ModeloController::class, 'alta'])->name('modelos.alta');
});

/*
|--------------------------------------------------------------------------
| EQUIPOS
|--------------------------------------------------------------------------
*/
Route::prefix('equipos')->group(function () {
    Route::get('/', [EquipoController::class, 'index'])->name('equipos.index');
    Route::get('/inactivos', [EquipoController::class, 'inactivos'])->name('equipos.inactivos');
    Route::get('/serie-existe', [EquipoController::class, 'serieExiste'])->name('equipos.serieExiste');
    Route::post('/crear', [EquipoController::class, 'crear'])->name('equipos.crear');
    Route::post('/eliminar-lote', [EquipoController::class, 'eliminarLote'])->name('equipos.eliminarLote');
    Route::post('/{id}/actualizar', [EquipoController::class, 'actualizar'])->name('equipos.actualizar');
    Route::post('/{id}/baja', [EquipoController::class, 'baja'])->name('equipos.baja');
    Route::post('/{id}/alta', [EquipoController::class, 'alta'])->name('equipos.alta');
});

/*
|--------------------------------------------------------------------------
| HISTORIAL
|--------------------------------------------------------------------------
*/
Route::prefix('historial')->name('historial.')->group(function () {
    Route::get('/', [HistorialController::class, 'index'])->name('index');

    Route::get('/equipo/{equipoId}', [HistorialController::class, 'porEquipo'])
        ->name('equipo');
});

/*
|--------------------------------------------------------------------------
| FACTURAS
|--------------------------------------------------------------------------
*/
Route::prefix('facturas')->name('facturas.')->group(function () {
    Route::get('/', [FacturaController::class, 'index'])->name('index');
    Route::get('/inactivos', [FacturaController::class, 'inactivos'])->name('inactivos');
    Route::get('/{id}/tiene-equipos', [FacturaController::class, 'apiTieneEquipos']);
    Route::post('/crear', [FacturaController::class, 'crear'])->name('crear');
    Route::put('/{id}/actualizar', [FacturaController::class, 'actualizar'])->name('actualizar');
    Route::delete('/{id}/baja', [FacturaController::class, 'baja'])->name('baja');
    Route::put('/{id}/alta', [FacturaController::class, 'alta'])->name('alta');
    Route::get('/proveedor/{idProveedor}', [FacturaController::class, 'porProveedor'])->name('porProveedor');
    Route::post('/limpiar-sesion-equipos', [FacturaController::class, 'limpiarSesionEquipos'])->name('limpiarSesionEquipos');
    Route::get('/siguiente-numero', [FacturaController::class, 'siguienteNumero'])->name('siguienteNumero');
    Route::get('/equipos', [FacturaController::class, 'equipos'])->name('equipos');
    Route::get('/{id}', [FacturaController::class, 'show'])->whereNumber('id')->name('show');
});

});
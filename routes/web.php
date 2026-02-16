<?php

use Illuminate\Support\Facades\Route;

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
| HOME
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => redirect()->route('equipos.index'));

Route::get('/api/sectores/ubicacion/{id}', [SectorController::class, 'porUbicacion']);

/*
|--------------------------------------------------------------------------
| MARCAS
|--------------------------------------------------------------------------
*/
Route::prefix('marcas')->group(function () {
    Route::get('/', [MarcaController::class, 'index'])->name('marcas.index');
    Route::get('/inactivos', [MarcaController::class, 'inactivos'])->name('marcas.inactivos');
    Route::post('/crear', [MarcaController::class, 'crear'])->name('marcas.crear');
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
    Route::get('/inactivos', [ProveedorController::class, 'inactivos'])->name('proveedores.inactivos');
    Route::post('/crear', [ProveedorController::class, 'crear'])->name('proveedores.crear');
    Route::post('/{id}/actualizar', [ProveedorController::class, 'actualizar'])->name('proveedores.actualizar');
    Route::post('/{id}/baja', [ProveedorController::class, 'baja'])->name('proveedores.baja');
    Route::post('/{id}/alta', [ProveedorController::class, 'alta'])->name('proveedores.alta');
});

/*
|--------------------------------------------------------------------------
| CONTACTOS
|--------------------------------------------------------------------------
*/
Route::prefix('contactos')->group(function () {
    Route::get('/', [ContactoController::class, 'general'])->name('contactos.general');
    Route::get('/proveedor/{idProveedor?}/inactivos', [ContactoController::class, 'inactivos'])->name('contactos.inactivos');
    Route::get('/proveedor/{idProveedor}', [ContactoController::class, 'index'])->name('contactos.index');
    Route::post('/crear', [ContactoController::class, 'crear'])->name('contactos.crear');
    Route::post('/{id}/actualizar', [ContactoController::class, 'actualizar'])->name('contactos.actualizar');
    Route::post('/{id}/baja', [ContactoController::class, 'baja'])->name('contactos.baja');
    Route::post('/{id}/alta', [ContactoController::class, 'alta'])->name('contactos.alta');
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
    Route::post('/crear', [EquipoController::class, 'crear'])->name('equipos.crear');
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
    Route::post('/crear', [FacturaController::class, 'crear'])->name('crear');
    Route::put('/{id}/actualizar', [FacturaController::class, 'actualizar'])->name('actualizar');
    Route::put('/{id}/baja', [FacturaController::class, 'baja'])->name('baja');
    Route::put('/{id}/alta', [FacturaController::class, 'alta'])->name('alta');
    Route::get('/proveedor/{idProveedor}', [FacturaController::class, 'porProveedor'])->name('porProveedor');
    Route::get('/siguiente-numero', [FacturaController::class, 'siguienteNumero'])->name('siguienteNumero');
    Route::get('/equipos', [FacturaController::class, 'equipos'])->name('equipos');
});


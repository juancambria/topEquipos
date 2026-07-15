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
use App\Http\Controllers\GestionEquipoSectorController;
use App\Http\Controllers\AtributoTipoEquipoController;
use App\Http\Controllers\HerramientaController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\PersonaTecnicoController;
use App\Http\Controllers\IncidenciaController;
use App\Http\Controllers\ParteTrabajoController;

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
    $ubicaciones = \App\Models\Ubicacion::where('estado', 'activo')
        ->orderBy('codigo')
        ->orderBy('nombre')
        ->get(['id', 'codigo', 'nombre']);
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
| ATRIBUTOS DE TIPOS DE EQUIPOS
|--------------------------------------------------------------------------
*/
Route::prefix('atributos-tipos-equipos')->group(function () {
    Route::get('/', [AtributoTipoEquipoController::class, 'index'])->name('atributosTiposEquipos.index');
    Route::post('/atributos/crear', [AtributoTipoEquipoController::class, 'crearAtributo'])->name('atributosTiposEquipos.atributos.crear');
    Route::delete('/atributos/{idAtributo}', [AtributoTipoEquipoController::class, 'eliminarAtributo'])->name('atributosTiposEquipos.atributos.eliminar');
    Route::post('/tipos/{idTipo}/atributos/crear', [AtributoTipoEquipoController::class, 'crearAtributoParaTipo'])->name('atributosTiposEquipos.tipos.atributos.crear');
    Route::post('/tipos/{idTipo}/atributos/{idAtributo}/opciones/crear', [AtributoTipoEquipoController::class, 'crearOpcionParaTipoAtributo'])->name('atributosTiposEquipos.tipos.atributos.opciones.crear');
    Route::post('/unidades-medida/crear', [AtributoTipoEquipoController::class, 'crearUnidadMedida'])->name('atributosTiposEquipos.unidadesMedida.crear');
    Route::delete('/unidades-medida/{idUnidadMedida}', [AtributoTipoEquipoController::class, 'eliminarUnidadMedida'])->name('atributosTiposEquipos.unidadesMedida.eliminar');
    Route::get('/tipos/{idTipo}/configuracion', [AtributoTipoEquipoController::class, 'configuracionesPorTipo'])->name('atributosTiposEquipos.tipos.configuracion');
    Route::post('/tipos/{idTipo}/configuracion', [AtributoTipoEquipoController::class, 'guardarConfiguracionesTipo'])->name('atributosTiposEquipos.tipos.configuracion.guardar');
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
| GESTION EQUIPOS POR SECTOR
|--------------------------------------------------------------------------
*/
Route::prefix('lugares/equipos-sector')->name('lugares.equiposSector.')->group(function () {
    Route::get('/', [GestionEquipoSectorController::class, 'index'])->name('index');
    Route::get('/ubicaciones/{ubicacionId}/sectores', [GestionEquipoSectorController::class, 'sectoresPorUbicacion'])
        ->name('sectores');
    Route::get('/ubicaciones/{ubicacionId}/sectores/{sectorId}/tipos', [GestionEquipoSectorController::class, 'tiposPorSector'])
        ->name('tipos');
    Route::post('/asignar', [GestionEquipoSectorController::class, 'asignarTipo'])->name('asignar');
    Route::post('/quitar', [GestionEquipoSectorController::class, 'quitarTipo'])->name('quitar');
    Route::post('/cantidad', [GestionEquipoSectorController::class, 'actualizarCantidad'])->name('cantidad');
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
    Route::get('/tipos/{idTipo}/atributos', [EquipoController::class, 'atributosPorTipo'])->name('equipos.atributosPorTipo');
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
    Route::get('/{id}/tiene-equipos', [FacturaController::class, 'apiTieneEquipos']);
    Route::post('/crear', [FacturaController::class, 'crear'])->name('crear');
    Route::put('/{id}/actualizar', [FacturaController::class, 'actualizar'])->name('actualizar');
    Route::delete('/{id}/baja', [FacturaController::class, 'baja'])->name('baja');
    Route::get('/proveedor/{idProveedor}', [FacturaController::class, 'porProveedor'])->name('porProveedor');
    Route::post('/limpiar-sesion-equipos', [FacturaController::class, 'limpiarSesionEquipos'])->name('limpiarSesionEquipos');
    Route::get('/siguiente-numero', [FacturaController::class, 'siguienteNumero'])->name('siguienteNumero');
    Route::get('/equipos', [FacturaController::class, 'equipos'])->name('equipos');
    Route::post('/pdfs/vista-previa', [FacturaController::class, 'subirVistaPreviaPdf'])->name('pdfs.vista_previa_subir');
    Route::get('/pdfs/vista-previa/{token}/{nombreArchivo}', [FacturaController::class, 'verVistaPreviaPdf'])
        ->where(['token' => '[a-zA-Z0-9]{32,}', 'nombreArchivo' => '[A-Za-z0-9._\-]+\.pdf'])
        ->name('pdfs.vista_previa_ver');
    Route::get('/{id}/pdfs/{pdfId}/descargar', [FacturaController::class, 'descargarPdfLegacy'])
        ->whereNumber(['id', 'pdfId'])
        ->name('pdfs.descargar');
    Route::get('/{id}/pdfs/{pdfId}/{nombreArchivo}', [FacturaController::class, 'descargarPdf'])
        ->whereNumber(['id', 'pdfId'])
        ->where('nombreArchivo', '[A-Za-z0-9._\-]+\.pdf')
        ->name('pdfs.ver');
    Route::delete('/{id}/pdfs/{pdfId}', [FacturaController::class, 'eliminarPdf'])
        ->whereNumber(['id', 'pdfId'])
        ->name('pdfs.eliminar');
    Route::get('/{id}', [FacturaController::class, 'show'])->whereNumber('id')->name('show');
});

/*
|--------------------------------------------------------------------------
| HERRAMIENTAS (SEPARADO)
|--------------------------------------------------------------------------
*/
Route::prefix('herramientas')->name('herramientas.')->group(function () {
    Route::get('/', [HerramientaController::class, 'index'])->name('index');
    Route::get('/familias', [HerramientaController::class, 'indexFamilias'])->name('familias.index');
    Route::get('/marcas', [HerramientaController::class, 'indexMarcas'])->name('marcas.index');
    Route::get('/modelos', [HerramientaController::class, 'indexModelos'])->name('modelos.index');

    Route::get('/api/familias', [HerramientaController::class, 'familias'])->name('api.familias');
    Route::get('/api/marcas', [HerramientaController::class, 'marcas'])->name('api.marcas');
    Route::get('/api/modelos', [HerramientaController::class, 'modelos'])->name('api.modelos');

    Route::post('/familias/crear', [HerramientaController::class, 'crearFamilia'])->name('familias.crear');
    Route::post('/familias/{id}/actualizar', [HerramientaController::class, 'actualizarFamilia'])->name('familias.actualizar');
    Route::post('/familias/{id}/baja', [HerramientaController::class, 'bajaFamilia'])->name('familias.baja');
    Route::post('/marcas/crear', [HerramientaController::class, 'crearMarca'])->name('marcas.crear');
    Route::post('/marcas/{id}/actualizar', [HerramientaController::class, 'actualizarMarca'])->name('marcas.actualizar');
    Route::post('/marcas/{id}/baja', [HerramientaController::class, 'bajaMarca'])->name('marcas.baja');
    Route::post('/modelos/crear', [HerramientaController::class, 'crearModelo'])->name('modelos.crear');
    Route::post('/modelos/{id}/actualizar', [HerramientaController::class, 'actualizarModelo'])->name('modelos.actualizar');
    Route::post('/modelos/{id}/baja', [HerramientaController::class, 'bajaModelo'])->name('modelos.baja');

    Route::post('/crear', [HerramientaController::class, 'crearItem'])->name('crear');
    Route::post('/{id}/actualizar', [HerramientaController::class, 'actualizarItem'])->name('actualizar');
    Route::post('/{id}/baja', [HerramientaController::class, 'bajaItem'])->name('baja');
});

/*
|--------------------------------------------------------------------------
| MATERIALES (SEPARADO)
|--------------------------------------------------------------------------
*/
Route::prefix('materiales')->name('materiales.')->group(function () {
    Route::get('/', [MaterialController::class, 'index'])->name('index');
    Route::get('/familias', [MaterialController::class, 'indexFamilias'])->name('familias.index');
    Route::get('/tipificaciones', [MaterialController::class, 'indexTipificaciones'])->name('tipificaciones.index');
    Route::get('/marcas', [MaterialController::class, 'indexMarcas'])->name('marcas.index');
    Route::get('/modelos', [MaterialController::class, 'indexModelos'])->name('modelos.index');

    Route::get('/api/familias', [MaterialController::class, 'familias'])->name('api.familias');
    Route::get('/api/tipificaciones', [MaterialController::class, 'tipificaciones'])->name('api.tipificaciones');
    Route::get('/api/marcas', [MaterialController::class, 'marcas'])->name('api.marcas');
    Route::get('/api/modelos', [MaterialController::class, 'modelos'])->name('api.modelos');
    Route::get('/{id}/movimientos-stock', [MaterialController::class, 'movimientosStock'])->name('movimientosStock');

    Route::post('/familias/crear', [MaterialController::class, 'crearFamilia'])->name('familias.crear');
    Route::post('/tipificaciones/crear', [MaterialController::class, 'crearTipificacion'])->name('tipificaciones.crear');
    Route::post('/familias/{id}/actualizar', [MaterialController::class, 'actualizarFamilia'])->name('familias.actualizar');
    Route::post('/familias/{id}/baja', [MaterialController::class, 'bajaFamilia'])->name('familias.baja');
    Route::post('/tipificaciones/{id}/actualizar', [MaterialController::class, 'actualizarTipificacion'])->name('tipificaciones.actualizar');
    Route::post('/tipificaciones/{id}/baja', [MaterialController::class, 'bajaTipificacion'])->name('tipificaciones.baja');
    Route::post('/marcas/crear', [MaterialController::class, 'crearMarca'])->name('marcas.crear');
    Route::post('/marcas/{id}/actualizar', [MaterialController::class, 'actualizarMarca'])->name('marcas.actualizar');
    Route::post('/marcas/{id}/baja', [MaterialController::class, 'bajaMarca'])->name('marcas.baja');
    Route::post('/modelos/crear', [MaterialController::class, 'crearModelo'])->name('modelos.crear');
    Route::post('/modelos/{id}/actualizar', [MaterialController::class, 'actualizarModelo'])->name('modelos.actualizar');
    Route::post('/modelos/{id}/baja', [MaterialController::class, 'bajaModelo'])->name('modelos.baja');

    Route::post('/crear', [MaterialController::class, 'crearItem'])->name('crear');
    Route::post('/{id}/actualizar', [MaterialController::class, 'actualizarItem'])->name('actualizar');
    Route::post('/{id}/baja', [MaterialController::class, 'bajaItem'])->name('baja');
});

/*
|--------------------------------------------------------------------------
| OPERACIONES — TÉCNICOS, INCIDENCIAS, PARTES DE TRABAJO
|--------------------------------------------------------------------------
*/
Route::prefix('personas-tecnicos')->name('personasTecnicos.')->group(function () {
    Route::get('/', [PersonaTecnicoController::class, 'index'])->name('index');
    Route::get('/api', [PersonaTecnicoController::class, 'apiIndex'])->name('api');
    Route::post('/crear', [PersonaTecnicoController::class, 'crear'])->name('crear');
    Route::post('/{id}/actualizar', [PersonaTecnicoController::class, 'actualizar'])->name('actualizar');
    Route::post('/{id}/baja', [PersonaTecnicoController::class, 'baja'])->name('baja');
});

Route::prefix('incidencias')->name('incidencias.')->group(function () {
    Route::get('/', [IncidenciaController::class, 'index'])->name('index');
    Route::get('/api/calendario', [IncidenciaController::class, 'apiCalendario'])->name('api.calendario');
    Route::get('/{id}', [IncidenciaController::class, 'show'])->whereNumber('id')->name('show');
    Route::post('/crear', [IncidenciaController::class, 'crear'])->name('crear');
    Route::post('/{id}/actualizar', [IncidenciaController::class, 'actualizar'])->whereNumber('id')->name('actualizar');
    Route::post('/{id}/baja', [IncidenciaController::class, 'baja'])->whereNumber('id')->name('baja');
});

Route::prefix('partes-trabajo')->name('partesTrabajo.')->group(function () {
    Route::get('/', [ParteTrabajoController::class, 'index'])->name('index');
    Route::get('/api/equipos', [ParteTrabajoController::class, 'apiEquipos'])->name('api.equipos');
    Route::get('/api/calendario', [ParteTrabajoController::class, 'apiCalendario'])->name('api.calendario');
    Route::get('/{id}', [ParteTrabajoController::class, 'show'])->whereNumber('id')->name('show');
    Route::post('/crear', [ParteTrabajoController::class, 'crear'])->name('crear');
    Route::post('/{id}/actualizar', [ParteTrabajoController::class, 'actualizar'])->whereNumber('id')->name('actualizar');
    Route::post('/{id}/baja', [ParteTrabajoController::class, 'baja'])->whereNumber('id')->name('baja');
});

});

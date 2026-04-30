<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\FacturaDetalle;
use App\Models\Proveedor;
use App\Models\Equipo;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\Tipo;
use App\Models\Ubicacion;
use App\Models\Sector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FacturaController extends Controller
{
    public function index(Request $request)
    {
        $query = Factura::with('proveedor');

        // Filtro por proveedor
        if ($request->filled('proveedor')) {
            $query->where('idProveedor', $request->proveedor);
        }

        // Busqueda por numero o observacion
        if ($request->filled('buscar')) {
            $query->buscar($request->buscar);
        }

        // Ordenamiento
        $column = $request->input('column', 'idFactura');
        $order = $request->input('order', 'desc');
        
        $allowedColumns = ['idFactura', 'numero', 'fecha', 'total', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idFactura';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'desc';
        
        $query->orderBy($column, $order);

        $facturas = $query->get();
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();

        // Variables para el modal de equipos
        $marcas = Marca::activos()->orderBy('marca')->get();
        $modelos = Modelo::activos()->with('marca')->orderBy('modelo')->get();
        $tipos = Tipo::activos()->orderBy('nombreTipo')->get();
        $ubicaciones = Ubicacion::activos()->orderBy('nombre')->get();
        $sectores = Sector::activos()->orderBy('nombre')->get();

        return view('facturas.index', compact('facturas', 'proveedores', 'marcas', 'modelos', 'tipos', 'ubicaciones', 'sectores'));
    }

    public function show($id)
    {
        try {
            $factura = Factura::with('proveedor')->findOrFail($id);
            $factura->load('detalles');
            
            // Filtrar solo detalles relevantes para equipos
            $detallesCompraEquipo = $factura->detalles->filter(fn($d) => $d->operacion === 'compra' && $d->de === 'Equipo');
            
            $detallesConEquipos = $detallesCompraEquipo->map(function ($detalle) use ($factura) {
                $equipos = \App\Models\Equipo::where('numeroFactura', $factura->numero)
                    ->where('observacion', 'LIKE', '%' . $detalle->concepto . '%')
                    ->take(10)
                    ->with('tipo')
                    ->get(['id', 'serie', 'idTipo'])
                    ->map(fn($e) => [
                        'id' => $e->id,
                        'serie' => $e->serie,
                        'tipo' => $e->tipo->nombreTipo ?? 'N/A'
                    ]);
                
                return [
                    'detalle' => $detalle,
                    'equipos' => $equipos
                ];
            });
            
            return response()->json([
                'idFactura' => $factura->idFactura,
                'numero' => $factura->numero,
                'fecha' => $factura->fecha ? $factura->fecha->format('Y-m-d') : null,
                'idProveedor' => $factura->idProveedor,
                'proveedor' => $factura->proveedor ? $factura->proveedor->proveedor : null,
                'observacion' => $factura->observacion,
                'idOrdenDeCompra' => $factura->idOrdenDeCompra,
                'idPresupuesto' => $factura->idPresupuesto,
                'obra' => $factura->obra,
                'descripcion_contenido' => $factura->descripcion_contenido,
                'porcentajeBonificacion' => $factura->porcentajeBonificacion,
                'importeBonificacion' => $factura->importeBonificacion,
                'neto' => $factura->neto,
                'iva105' => $factura->iva105,
                'iva21' => $factura->iva21,
                'total' => $factura->total,
                'estado' => $factura->estado,
                'detalles_con_equipos' => $detallesConEquipos,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Factura no encontrada',
                'message' => 'La factura con ID ' . $id . ' no existe'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener la factura',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function crear(Request $request)
    {
        $this->mergeCleaned($request, [
            'numero' => $this->cleanString($request->input('numero')),
            'observacion' => $this->cleanTextarea($request->input('observacion')),
            'idOrdenDeCompra' => $this->cleanDigits((string) $request->input('idOrdenDeCompra')),
            'idPresupuesto' => $this->cleanDigits((string) $request->input('idPresupuesto')),
            'obra' => $this->cleanString($request->input('obra')),
            'descripcion_contenido' => $this->cleanTextarea($request->input('descripcion_contenido')),
        ]);

        $data = $request->validate([
            'numero' => 'required|string|max:20|unique:facturas,numero',
            'fecha' => 'nullable|date',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'observacion' => 'nullable|string|max:1000',
            'idOrdenDeCompra' => 'nullable|digits_between:1,10',
            'idPresupuesto' => 'nullable|digits_between:1,10',
            'obra' => 'nullable|string|max:15',
            'descripcion_contenido' => 'nullable|string|max:1000',
            'porcentajeBonificacion' => 'nullable|numeric|min:0|max:100',
            'importeBonificacion' => 'nullable|numeric|min:0',
            'detalles' => 'nullable|array|max:100',
            'detalles.*.operacion' => 'nullable|in:compra,mano_obra',
            'detalles.*.de' => 'nullable|in:Equipo,Herramienta,Material,Sucursal',
            'detalles.*.cantidad' => 'nullable|numeric|min:0.0001',
            'detalles.*.concepto' => 'nullable|string|max:150',
            'detalles.*.precioUnitario' => 'nullable|numeric|min:0',
            'detalles.*.porcentajeIva' => 'nullable|numeric|min:0|max:21',
            'detalles.*.porcentajeDto' => 'nullable|numeric|min:0|max:100',
            'detalles.*.subtotal' => 'nullable|numeric|min:0',
            'detalles.*.obra' => 'nullable|string|max:15',
        ]);

        DB::beginTransaction();

        try {
            $factura = Factura::create([
                'numero' => $data['numero'],
                'fecha' => $data['fecha'] ?? null,
                'idProveedor' => $data['idProveedor'],
                'observacion' => $data['observacion'] ?? null,
                'idOrdenDeCompra' => $data['idOrdenDeCompra'] ?? null,
                'idPresupuesto' => $data['idPresupuesto'] ?? null,
                'obra' => $data['obra'] ?? null,
                'descripcion_contenido' => $data['descripcion_contenido'] ?? null,
                'porcentajeBonificacion' => $data['porcentajeBonificacion'] ?? 0,
                'importeBonificacion' => $data['importeBonificacion'] ?? 0,
            ]);

            $equiposPorCrear = [];

            // Si hay detalles, procesarlos
            if (!empty($data['detalles']) && is_array($data['detalles'])) {
                foreach ($data['detalles'] as $index => $detalleData) {
                    if (!empty($detalleData['concepto'])) {
                        $detalle = new FacturaDetalle($detalleData);
                        $detalle->idFactura = $factura->idFactura;
                        $detalle->renglonFactura = $index + 1;
                        $detalle->calcularSubtotal();
                        $detalle->save();
                        
                        // Si es una operacion de compra de equipo, agregar a la lista
                        // Se crea una entrada por cada unidad de equipo
                        if (!empty($detalleData['operacion']) && $detalleData['operacion'] === 'compra' 
                            && !empty($detalleData['de']) && $detalleData['de'] === 'Equipo') {
                            $cantidadEquipos = intval($detalleData['cantidad'] ?? 1);
                            
                            // Crear una entrada por cada equipo
                            for ($i = 0; $i < $cantidadEquipos; $i++) {
                                $equiposPorCrear[] = [
                                    'idDetalle' => $detalle->idFacturaDet,
                                    'concepto' => $detalleData['concepto'] ?? '',
                                    'cantidad' => 1,
                                    // Agregar información de grupo para auto-completar
                                    'cantidadOriginal' => $cantidadEquipos,
                                    'grupoIndex' => $i,
                                ];
                            }
                        }
                    }
                }
                
                // Calcular totales de la factura
                $factura->calcularTotales();
            }

            DB::commit();

            // Calcular el total de equipos a crear
            $totalEquiposPorCrear = count($equiposPorCrear);

            // Si hay equipos por crear, redirigir con datos para mostrar modales
            session()->forget(['equiposPorCrear', 'idFactura', 'idProveedor']);
            
            return redirect()->to(url()->previous())
                ->with('success', 'Factura creada correctamente.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al crear la factura: ' . $e->getMessage());
        }
    }

    /**
     * Actualizar factura con todos los campos nuevos
     */
    public function actualizar(Request $request, $id)
    {
        $factura = Factura::where('idFactura', $id)->firstOrFail();

        $this->mergeCleaned($request, [
            'numero' => $this->cleanString($request->input('numero')),
            'observacion' => $this->cleanTextarea($request->input('observacion')),
            'idOrdenDeCompra' => $this->cleanDigits((string) $request->input('idOrdenDeCompra')),
            'idPresupuesto' => $this->cleanDigits((string) $request->input('idPresupuesto')),
            'obra' => $this->cleanString($request->input('obra')),
            'descripcion_contenido' => $this->cleanTextarea($request->input('descripcion_contenido')),
        ]);

        $data = $request->validate([
            'numero' => 'required|string|max:20|unique:facturas,numero,' . $id . ',idFactura',
            'fecha' => 'nullable|date',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'observacion' => 'nullable|string|max:1000',
            'idOrdenDeCompra' => 'nullable|digits_between:1,10',
            'idPresupuesto' => 'nullable|digits_between:1,10',
            'obra' => 'nullable|string|max:15',
            'descripcion_contenido' => 'nullable|string|max:1000',
            'porcentajeBonificacion' => 'nullable|numeric|min:0|max:100',
            'importeBonificacion' => 'nullable|numeric|min:0',
            'detalles' => 'nullable|array|max:100',
            'detalles.*.operacion' => 'nullable|in:compra,mano_obra',
            'detalles.*.de' => 'nullable|in:Equipo,Herramienta,Material,Sucursal',
            'detalles.*.cantidad' => 'nullable|numeric|min:0.0001',
            'detalles.*.concepto' => 'nullable|string|max:150',
            'detalles.*.precioUnitario' => 'nullable|numeric|min:0',
            'detalles.*.porcentajeIva' => 'nullable|numeric|min:0|max:21',
            'detalles.*.porcentajeDto' => 'nullable|numeric|min:0|max:100',
            'detalles.*.subtotal' => 'nullable|numeric|min:0',
            'detalles.*.obra' => 'nullable|string|max:15',
        ]);

        DB::beginTransaction();

        try {
            $factura->update([
                'numero' => $data['numero'],
                'fecha' => $data['fecha'] ?? null,
                'idProveedor' => $data['idProveedor'],
                'observacion' => $data['observacion'] ?? null,
                'idOrdenDeCompra' => $data['idOrdenDeCompra'] ?? null,
                'idPresupuesto' => $data['idPresupuesto'] ?? null,
                'obra' => $data['obra'] ?? null,
                'descripcion_contenido' => $data['descripcion_contenido'] ?? null,
                'porcentajeBonificacion' => $data['porcentajeBonificacion'] ?? 0,
                'importeBonificacion' => $data['importeBonificacion'] ?? 0,
            ]);

            // Si hay detalles, procesarlos
            if (!empty($data['detalles']) && is_array($data['detalles'])) {
                // Eliminar detalles existentes
                FacturaDetalle::where('idFactura', $factura->idFactura)->delete();
                
                foreach ($data['detalles'] as $index => $detalleData) {
                    if (!empty($detalleData['concepto'])) {
                        $detalle = new FacturaDetalle($detalleData);
                        $detalle->idFactura = $factura->idFactura;
                        $detalle->renglonFactura = $index + 1;
                        $detalle->calcularSubtotal();
                        $detalle->save();
                    }
                }
                
                // Calcular totales de la factura
                $factura->calcularTotales();
            }

            DB::commit();

            return redirect()->back()->with('success', 'Factura actualizada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al actualizar la factura: ' . $e->getMessage());
        }
    }

    /**
     * Obtener siguiente numero de factura
     */
    public function siguienteNumero()
    {
        $prefijo = date('ymd');
        $hoy = date('Y-m-d');

        $ultimaFactura = Factura::whereDate('created_at', $hoy)
            ->where('numero', 'like', $prefijo . '-%')
            ->orderBy('idFactura', 'desc')
            ->first();

        if ($ultimaFactura) {
            $partes = explode('-', (string) $ultimaFactura->numero);
            $secuencial = (count($partes) === 2) ? (intval($partes[1]) + 1) : 1;
        } else {
            $secuencial = 1;
        }

        $numero = $prefijo . '-' . str_pad((string) $secuencial, 8, '0', STR_PAD_LEFT);

        return response()->json(['numero' => $numero]);
    }

    /**
     * Obtener equipos para autocomplete
     */
    public function equipos(Request $request)
    {
        $query = $request->get('q', '');
        $equipos = Equipo::activos()
            ->where('serie', 'like', "%{$query}%")
            ->with(['marca', 'modelo'])
            ->limit(20)
            ->get();
        
        return response()->json($equipos->map(function ($equipo) {
            return [
                'id' => $equipo->id,
                'texto' => $equipo->serie . ' - ' . ($equipo->marca->marca ?? '') . ' ' . ($equipo->modelo->modelo ?? ''),
                'serie' => $equipo->serie,
            ];
        }));
    }

    /**
     * Obtener modelos por marca
     */
    public function modelosPorMarca($idMarca)
    {
        $modelos = Modelo::where('idMarca', $idMarca)->activos()->get();
        return response()->json($modelos);
    }

    /**
     * Obtener sectores por ubicacion
     */
    public function sectoresPorUbicacion($idUbicacion)
    {
        $sectores = Sector::whereHas('ubicaciones', function ($query) use ($idUbicacion) {
            $query->where('ubicaciones.id', $idUbicacion);
        })->activos()->get();
        return response()->json($sectores);
    }

    public function agregarDetalle(Request $request, $id)
    {
        $factura = Factura::findOrFail($id);

        $this->mergeCleaned($request, [
            'concepto' => $this->cleanString($request->input('concepto')),
            'obra' => $this->cleanString($request->input('obra')),
        ]);

        $data = $request->validate([
            'concepto' => 'required|string|max:150',
            'cantidad' => 'required|numeric|min:0',
            'precioUnitario' => 'required|numeric|min:0',
            'porcentajeIva' => 'nullable|numeric|min:0|max:21',
            'porcentajeDto' => 'nullable|numeric|min:0|max:100',
            'operacionDe' => 'nullable|integer|min:1|max:3',
            'tipoOperacion' => 'nullable|integer|min:1|max:2',
            'obra' => 'nullable|string|max:15',
        ]);

        $ultimoRenglon = FacturaDetalle::where('idFactura', $id)->max('renglonFactura') ?? 0;

        $detalle = new FacturaDetalle($data);
        $detalle->idFactura = $id;
        $detalle->renglonFactura = $ultimoRenglon + 1;
        $detalle->save();

        // Recalcular totales
        $factura->calcularTotales();

        return redirect()->back()->with('success', 'Detalle agregado correctamente');
    }

    public function eliminarDetalle($id, $detalleId)
    {
        $detalle = FacturaDetalle::where('idFactura', $id)->findOrFail($detalleId);
        $factura = Factura::findOrFail($id);
        
        $detalle->delete();
        
        // Renumerar renglones
        $detalles = FacturaDetalle::where('idFactura', $id)->orderBy('renglonFactura')->get();
        foreach ($detalles as $index => $d) {
            $d->renglonFactura = $index + 1;
            $d->save();
        }

        // Recalcular totales
        $factura->calcularTotales();

        return redirect()->back()->with('success', 'Detalle eliminado correctamente');
    }

    public function apiTieneEquipos($id)
    {
        $count = \App\Models\FacturaDetalle::where('idFactura', $id)
            ->where('operacion', 'compra')
            ->where('de', 'Equipo')
            ->count();
        
        return response()->json(['tieneEquipos' => $count > 0, 'cantidad' => $count]);
    }

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'nullable|string|max:1000',
        ]);

        $factura = Factura::where('idFactura', $id)->firstOrFail();

        $eliminarEquipos = $request->boolean('eliminar_equipos', false);

        DB::beginTransaction();
        try {
            if ($eliminarEquipos) {
                Equipo::where('numeroFactura', $factura->numero)->delete();
            }

            $factura->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'No se pudo eliminar la factura: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Factura eliminada correctamente');
    }

    public function porProveedor($idProveedor)
    {
        $facturas = Factura::where('idProveedor', $idProveedor)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($facturas);
    }

    /**
     * Limpiar sesión de equipos pendientes
     */
    public function limpiarSesionEquipos()
    {
        // Limpiar los datos de sesión
        session()->forget('equiposPorCrear');
        session()->forget('idFactura');
        session()->forget('idProveedor');
        
        return response()->json(['success' => true]);
    }
}

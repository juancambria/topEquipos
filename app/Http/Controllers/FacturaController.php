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
        $query = Factura::with('proveedor')->activos();

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

        return view('facturas.index', compact('facturas', 'proveedores'));
    }

    public function inactivos(Request $request)
    {
        $query = Factura::with('proveedor')->where('estado', 'baja');

        if ($request->filled('buscar')) {
            $query->buscar($request->buscar);
        }

        $column = $request->input('column', 'idFactura');
        $order = $request->input('order', 'desc');
        
        $query->orderBy($column, $order);

        $facturas = $query->get();
        $proveedores = Proveedor::all();

        return view('facturas.index', compact('facturas', 'proveedores'));
    }

    public function show($id)
    {
        $factura = Factura::with(['proveedor', 'detalles'])->findOrFail($id);
        return view('facturas.show', compact('factura'));
    }

    public function crear(Request $request)
    {
        $request->validate([
            'numero' => 'required|string|max:20|unique:facturas,numero',
            'fecha' => 'nullable|date',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
        ]);

        DB::beginTransaction();

        try {
            $factura = Factura::create([
                'numero' => $request->numero,
                'fecha' => $request->fecha,
                'idProveedor' => $request->idProveedor,
                'observacion' => $request->observacion,
                'idOrdenDeCompra' => $request->idOrdenDeCompra ?: null,
                'idPresupuesto' => $request->idPresupuesto ?: null,
                'obra' => $request->obra ?: null,
                'descripcion_contenido' => $request->descripcion_contenido ?: null,
                'porcentajeBonificacion' => $request->porcentajeBonificacion ?: 0,
                'importeBonificacion' => $request->importeBonificacion ?: 0,
            ]);

            $equiposPorCrear = [];

            // Si hay detalles, procesarlos
            if ($request->has('detalles') && is_array($request->detalles)) {
                foreach ($request->detalles as $index => $detalleData) {
                    if (!empty($detalleData['concepto'])) {
                        $detalle = new FacturaDetalle($detalleData);
                        $detalle->idFactura = $factura->idFactura;
                        $detalle->renglonFactura = $index + 1;
                        $detalle->calcularSubtotal();
                        $detalle->save();
                        
                        // Si es una operacion de compra de equipo, agregar a la lista
                        if (!empty($detalleData['operacion']) && $detalleData['operacion'] === 'compra' 
                            && !empty($detalleData['de']) && $detalleData['de'] === 'Equipo') {
                            $equiposPorCrear[] = [
                                'idDetalle' => $detalle->idFacturaDet,
                                'concepto' => $detalleData['concepto'] ?? '',
                                'cantidad' => $detalleData['cantidad'] ?? 1,
                            ];
                        }
                    }
                }
                
                // Calcular totales de la factura
                $factura->calcularTotales();
            }

            DB::commit();

            // Si hay equipos por crear, redirigir con datos para mostrar modales
            if (count($equiposPorCrear) > 0) {
                return redirect()->route('facturas.index')
                    ->with('success', 'Factura creada correctamente. Debe crear ' . count($equiposPorCrear) . ' equipo(s).')
                    ->with('equiposPorCrear', $equiposPorCrear)
                    ->with('idFactura', $factura->idFactura)
                    ->with('idProveedor', $factura->idProveedor);
            }

            return redirect()->back()->with('success', 'Factura creada correctamente');
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
        $factura = Factura::activos()->where('idFactura', $id)->firstOrFail();

        $request->validate([
            'numero' => 'required|string|max:20|unique:facturas,numero,' . $id . ',idFactura',
            'fecha' => 'nullable|date',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
        ]);

        DB::beginTransaction();

        try {
            $factura->update([
                'numero' => $request->numero,
                'fecha' => $request->fecha,
                'idProveedor' => $request->idProveedor,
                'observacion' => $request->observacion,
                'idOrdenDeCompra' => $request->idOrdenDeCompra ?: null,
                'idPresupuesto' => $request->idPresupuesto ?: null,
                'obra' => $request->obra ?: null,
                'descripcion_contenido' => $request->descripcion_contenido ?: null,
                'porcentajeBonificacion' => $request->porcentajeBonificacion ?: 0,
                'importeBonificacion' => $request->importeBonificacion ?: 0,
            ]);

            // Si hay detalles, procesarlos
            if ($request->has('detalles') && is_array($request->detalles)) {
                // Eliminar detalles existentes
                FacturaDetalle::where('idFactura', $factura->idFactura)->delete();
                
                foreach ($request->detalles as $index => $detalleData) {
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
        // Obtener el ultimo numero de factura del dia actual
        $hoy = date('Y-m-d');
        $ultimaFactura = Factura::whereDate('created_at', $hoy)
            ->orderBy('idFactura', 'desc')
            ->first();
        
        if ($ultimaFactura) {
            // Extraer el numero secuencial del formato XXX-XXXXXXXX
            $partes = explode('-', $ultimaFactura->numero);
            if (count($partes) === 2) {
                $secuencial = intval($partes[1]) + 1;
            } else {
                $secuencial = 1;
            }
        } else {
            $secuencial = 1;
        }
        
        // Formato: 001-00000001
        $prefijo = date('ymd'); // 6 digitos: aammdd
        $secuencialStr = str_pad($secuencial, 8, '0', STR_PAD_LEFT);
        
        return response()->json([
            'numero' => $prefijo . '-' . $secuencialStr
        ]);
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
        $sectores = Sector::where('ubicacion_id', $idUbicacion)->activos()->get();
        return response()->json($sectores);
    }

    public function agregarDetalle(Request $request, $id)
    {
        $factura = Factura::findOrFail($id);

        $request->validate([
            'concepto' => 'required|string|max:150',
            'cantidad' => 'required|numeric|min:0',
            'precioUnitario' => 'required|numeric|min:0',
            'porcentajeIva' => 'nullable|numeric|min:0|max:100',
            'porcentajeDto' => 'nullable|numeric|min=0|max=100',
            'operacionDe' => 'nullable|integer|min=1|max=3',
            'tipoOperacion' => 'nullable|integer|min=1|max=2',
        ]);

        $ultimoRenglon = FacturaDetalle::where('idFactura', $id)->max('renglonFactura') ?? 0;

        $detalle = new FacturaDetalle($request->all());
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

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $factura = Factura::activos()->where('idFactura', $id)->firstOrFail();

        if (!$factura->darDeBaja($request->observacion)) {
            return redirect()->back()->with('error', 'No se pudo dar de baja la factura');
        }

        return redirect()->back()->with('success', 'Factura dada de baja correctamente');
    }

    public function alta($id)
    {
        $factura = Factura::where('estado', 'baja')->where('idFactura', $id)->firstOrFail();
        $factura->darDeAlta();

        return redirect()->back()->with('success', 'Factura reactivada correctamente');
    }

    public function porProveedor($idProveedor)
    {
        $facturas = Factura::activos()
            ->where('idProveedor', $idProveedor)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($facturas);
    }
}

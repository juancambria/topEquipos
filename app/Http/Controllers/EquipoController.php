<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Marca;
use App\Models\Tipo;
use App\Models\Modelo;
use App\Models\Proveedor;
use App\Models\Ubicacion;
use App\Models\Sector;
use Illuminate\Http\Request;

class EquipoController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipo::activos()
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector']);

        // Ordenamiento por columna
        $column = $request->input('column', 'serie');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['serie', 'observacion', 'estado', 'marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'serie';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        // Ordenamiento según la columna
        switch ($column) {
            case 'marca':
                $query->join('marcas', 'equipos.idMarca', '=', 'marcas.idMarca')
                      ->orderBy('marcas.marca', $order)
                      ->select('equipos.*');
                break;
            case 'tipo':
                $query->join('tipos', 'equipos.idTipo', '=', 'tipos.idTipo')
                      ->orderBy('tipos.nombreTipo', $order)
                      ->select('equipos.*');
                break;
            case 'modelo':
                $query->join('modelos', 'equipos.idModelo', '=', 'modelos.idModelo')
                      ->orderBy('modelos.modelo', $order)
                      ->select('equipos.*');
                break;
            case 'proveedor':
                $query->leftJoin('proveedores', 'equipos.idProveedor', '=', 'proveedores.idProveedor')
                      ->orderBy('proveedores.proveedor', $order)
                      ->select('equipos.*');
                break;
            case 'ubicacion':
                $query->join('ubicaciones', 'equipos.ubicacion_id', '=', 'ubicaciones.id')
                      ->orderBy('ubicaciones.nombre', $order)
                      ->select('equipos.*');
                break;
            case 'sector':
                $query->join('sectores', 'equipos.sector_id', '=', 'sectores.id')
                      ->orderBy('sectores.nombre', $order)
                      ->select('equipos.*');
                break;
            default:
                $query->orderBy($column, $order);
                break;
        }

        $equipos = $query->get();

        $marcas      = Marca::activos()->orderBy('marca')->get();
        $tipos       = Tipo::activos()->orderBy('nombreTipo')->get();
        $modelos     = Modelo::activos()->orderBy('modelo')->get();
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();
        $ubicaciones = Ubicacion::activos()->orderBy('nombre')->get();
        $sectores    = Sector::with('ubicacion')->activos()->orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'proveedores', 'ubicaciones', 'sectores'
        ));
    }

    public function inactivos(Request $request)
    {
        $query = Equipo::where('estado', 'baja')
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector']);

        $column = $request->input('column', 'serie');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['serie', 'observacion', 'estado', 'marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'serie';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        switch ($column) {
            case 'marca':
                $query->join('marcas', 'equipos.idMarca', '=', 'marcas.idMarca')
                      ->orderBy('marcas.marca', $order)
                      ->select('equipos.*');
                break;
            case 'tipo':
                $query->join('tipos', 'equipos.idTipo', '=', 'tipos.idTipo')
                      ->orderBy('tipos.nombreTipo', $order)
                      ->select('equipos.*');
                break;
            case 'modelo':
                $query->join('modelos', 'equipos.idModelo', '=', 'modelos.idModelo')
                      ->orderBy('modelos.modelo', $order)
                      ->select('equipos.*');
                break;
            case 'proveedor':
                $query->leftJoin('proveedores', 'equipos.idProveedor', '=', 'proveedores.idProveedor')
                      ->orderBy('proveedores.proveedor', $order)
                      ->select('equipos.*');
                break;
            case 'ubicacion':
                $query->join('ubicaciones', 'equipos.ubicacion_id', '=', 'ubicaciones.id')
                      ->orderBy('ubicaciones.nombre', $order)
                      ->select('equipos.*');
                break;
            case 'sector':
                $query->join('sectores', 'equipos.sector_id', '=', 'sectores.id')
                      ->orderBy('sectores.nombre', $order)
                      ->select('equipos.*');
                break;
            default:
                $query->orderBy($column, $order);
                break;
        }

        $equipos = $query->get();

        $marcas      = Marca::orderBy('marca')->get();
        $tipos       = Tipo::orderBy('nombreTipo')->get();
        $modelos     = Modelo::orderBy('modelo')->get();
        $proveedores = Proveedor::orderBy('proveedor')->get();
        $ubicaciones = Ubicacion::orderBy('nombre')->get();
        $sectores    = Sector::with('ubicacion')->orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'proveedores', 'ubicaciones', 'sectores'
        ));
    }

    public function crear(Request $request)
    {
        $request->merge(['idProveedor' => $request->input('idProveedor') ?: null]);

        $data = $request->validate([
            'serie'         => 'required|string|unique:equipos,serie',
            'observacion'   => 'nullable|string',
            'idMarca'       => 'required|exists:marcas,idMarca',
            'idTipo'        => 'required|exists:tipos,idTipo',
            'idModelo'      => 'required|exists:modelos,idModelo',
            'idProveedor'   => 'nullable|exists:proveedores,idProveedor',
            'ubicacion_id'  => 'required|exists:ubicaciones,id',
            'sector_id'     => 'required|exists:sectores,id',
            'imagen'        => 'nullable|image|mimes:jpeg,png,gif|max:2048',
            'vtoGarantia'   => 'nullable|date',
            'precio'        => 'nullable|numeric|min:0',
        ]);

        // Manejar la imagen
        $imagenPath = null;
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $imagen = $request->file('imagen');
            $nombreArchivo = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $imagen->getClientOriginalName());
            $imagen->storeAs('equipos', $nombreArchivo, 'public');
            $imagenPath = 'equipos/' . $nombreArchivo;
            $data['imagen'] = $imagenPath;
        }

        // Eliminar campos que no existen en la tabla
        unset($data['imagen_actual']);

        Equipo::crear($data);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $equipo = Equipo::activos()->findOrFail($id);
        $request->merge(['idProveedor' => $request->input('idProveedor') ?: null]);

        $data = $request->validate([
            'serie'         => 'required|string|unique:equipos,serie,' . $id . ',id',
            'observacion'   => 'nullable|string',
            'idMarca'       => 'required|exists:marcas,idMarca',
            'idTipo'        => 'required|exists:tipos,idTipo',
            'idModelo'      => 'required|exists:modelos,idModelo',
            'idProveedor'   => 'nullable|exists:proveedores,idProveedor',
            'ubicacion_id'  => 'required|exists:ubicaciones,id',
            'sector_id'     => 'required|exists:sectores,id',
            'imagen'        => 'nullable|image|mimes:jpeg,png,gif|max:2048',
            'vtoGarantia'   => 'nullable|date',
            'precio'        => 'nullable|numeric|min:0',
        ]);

        // Manejar la imagen
        $imagenPath = null;
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            // Eliminar imagen anterior si existe
            if ($equipo->imagen && \Storage::disk('public')->exists($equipo->imagen)) {
                \Storage::disk('public')->delete($equipo->imagen);
            }
            
            // Guardar nueva imagen
            $imagen = $request->file('imagen');
            $nombreArchivo = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $imagen->getClientOriginalName());
            $imagen->storeAs('equipos', $nombreArchivo, 'public');
            $data['imagen'] = 'equipos/' . $nombreArchivo;
        } elseif ($request->input('eliminar_imagen') === '1') {
            // Eliminar imagen si se marcó la opción
            if ($equipo->imagen && \Storage::disk('public')->exists($equipo->imagen)) {
                \Storage::disk('public')->delete($equipo->imagen);
            }
            $data['imagen'] = null;
        }
        // Si no se envía nueva imagen ni se elimina, mantener la actual (no incluir en $data)

        // Eliminar campos que no existen en la tabla
        unset($data['imagen_actual']);
        unset($data['eliminar_imagen']);

        $equipo->actualizar($data);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $equipo = Equipo::activos()->findOrFail($id);
        $equipo->baja($request->observacion);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo dado de baja');
    }

    public function alta($id)
    {
        $equipo = Equipo::where('estado', 'baja')->findOrFail($id);
        $equipo->darDeAlta();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo activado correctamente');
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use App\Models\Ubicacion;
use Illuminate\Http\Request;

class SectorController extends Controller
{
    public function porUbicacion($id)
    {
        // Devolver TODOS los sectores con su estado de asociación a esta ubicación
        $todosSectores = Sector::with('ubicacion')->orderBy('nombre')->get();
        
        // Marcar cuáles están asociados a esta ubicación
        $sectores = $todosSectores->map(function ($sector) use ($id) {
            $sector->asociado = (int) $sector->ubicacion_id === (int) $id;
            return $sector;
        });
        
        return response()->json($sectores);
    }

    public function index(Request $request)
    {
        $query = Sector::with('ubicacion')->activos();

        // Ordenamiento por columna
        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        // Validar columnas permitidas
        $allowedColumns = ['id', 'nombre', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        // Validar orden
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $sectores = $query->get();
        $ubicaciones = Ubicacion::activos()->orderBy('nombre')->get();

        return view('sectores.index', compact('sectores', 'ubicaciones'));
    }

    public function inactivos(Request $request)
    {
        $query = Sector::with('ubicacion')->where('estado', 'baja');

        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['id', 'nombre', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $sectores = $query->get();
        $ubicaciones = Ubicacion::orderBy('nombre')->get();

        return view('sectores.index', compact('sectores', 'ubicaciones'));
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'ubicacion_id' => 'required|exists:ubicaciones,id',
        ]);

        Sector::crear($data);

        return redirect()->back()->with('success', 'Sector creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $sector = Sector::activos()->findOrFail($id);

        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'ubicacion_id' => 'required|exists:ubicaciones,id',
        ]);

        $sector->actualizar($data);

        return redirect()->back()->with('success', 'Sector actualizado correctamente');
    }

    /** asociarSector: asocia un sector existente a una ubicación */
    public function asociar(Request $request)
    {
        $data = $request->validate([
            'sector_id'    => 'required|exists:sectores,id',
            'ubicacion_id' => 'required|exists:ubicaciones,id',
        ]);

        $sector = Sector::findOrFail($data['sector_id']);
        $sector->update(['ubicacion_id' => $data['ubicacion_id']]);

        return response()->json(['success' => true, 'message' => 'Sector asociado correctamente']);
    }

public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $sector = Sector::activos()->findOrFail($id);

        if (!$sector->darDeBaja($request->observacion)) {
            return redirect()->back()
                ->with('error', 'No se puede dar de baja el sector porque tiene equipos activos asociados');
        }

        return redirect()->back()->with('success', 'Sector dado de baja correctamente');
    }

    public function alta($id)
    {
        $sector = Sector::where('estado', 'baja')->findOrFail($id);
        $sector->darDeAlta();

        return redirect()->back()->with('success', 'Sector activado correctamente');
    }
}


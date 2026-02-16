<?php

namespace App\Http\Controllers;

use App\Models\Ubicacion;
use Illuminate\Http\Request;

class UbicacionController extends Controller
{
    public function index(Request $request)
    {
        $query = Ubicacion::activos();

        // Búsqueda
        if ($request->filled('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%');
        }

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

        $ubicaciones = $query->get();

        return view('ubicaciones.index', compact('ubicaciones'));
    }

    public function inactivos(Request $request)
    {
        $query = Ubicacion::where('estado', 'baja');

        // Búsqueda
        if ($request->filled('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%');
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['id', 'nombre', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $ubicaciones = $query->get();

        return view('ubicaciones.index', compact('ubicaciones'));
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|integer|unique:ubicaciones,id',
            'nombre' => 'required|string|max:100|unique:ubicaciones,nombre',
        ]);

        Ubicacion::crear($data);

        return redirect()->back()->with('success', 'Ubicación creada correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $ubicacion = Ubicacion::activos()->findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:100|unique:ubicaciones,nombre,' . $id . ',id',
        ]);

        $ubicacion->actualizar($data);

        return redirect()->back()->with('success', 'Ubicación actualizada correctamente');
    }

public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $ubicacion = Ubicacion::activos()->findOrFail($id);

        if (!$ubicacion->darDeBaja($request->observacion)) {
            return redirect()->back()
                ->with('error', 'No se puede dar de baja la ubicación porque tiene equipos activos asociados');
        }

        return redirect()->back()->with('success', 'Ubicación dada de baja correctamente');
    }

    public function alta($id)
    {
        $ubicacion = Ubicacion::where('estado', 'baja')->findOrFail($id);
        $ubicacion->darDeAlta();

        return redirect()->back()->with('success', 'Ubicación activada correctamente');
    }
}


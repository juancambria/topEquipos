<?php

namespace App\Http\Controllers;

use App\Models\Tipo;
use Illuminate\Http\Request;

class TipoController extends Controller
{
    public function index(Request $request)
    {
        $query = Tipo::activos();

        if ($request->filled('buscar')) {
            $query->where('nombreTipo', 'like', '%' . $request->buscar . '%');
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'idTipo');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idTipo', 'nombreTipo', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idTipo';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $tipos = $query->get();

        return view('tipos.index', compact('tipos'));
    }

    public function inactivos(Request $request)
    {
        $query = Tipo::where('estado', 'baja');

        if ($request->filled('buscar')) {
            $query->where('nombreTipo', 'like', '%' . $request->buscar . '%');
        }

        $column = $request->input('column', 'idTipo');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idTipo', 'nombreTipo', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idTipo';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $tipos = $query->get();

        return view('tipos.index', compact('tipos'));
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'nombreTipo' => 'required|string|max:100|unique:tipos,nombreTipo',
        ]);

        Tipo::crear($data);

        return redirect()->back()->with('success', 'Tipo creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $tipo = Tipo::activos()->where('idTipo', $id)->firstOrFail();

        $data = $request->validate([
            'nombreTipo' => 'required|string|max:100|unique:tipos,nombreTipo,' . $id . ',idTipo',
        ]);

        $tipo->actualizar($data);

        return redirect()->back()->with('success', 'Tipo actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $tipo = Tipo::activos()->where('idTipo', $id)->firstOrFail();

        if (!$tipo->darDeBaja($request->observacion)) {
            return redirect()->back()
                ->with('error', 'No se puede dar de baja el tipo porque tiene equipos activos asociados');
        }

        return redirect()->back()->with('success', 'Tipo dado de baja correctamente');
    }

    public function alta($id)
    {
        $tipo = Tipo::where('estado', 'baja')->where('idTipo', $id)->firstOrFail();
        $tipo->darDeAlta();

        return redirect()->back()->with('success', 'Tipo activado correctamente');
    }
}


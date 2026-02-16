<?php

namespace App\Http\Controllers;

use App\Models\Modelo;
use App\Models\Marca;
use App\Models\Tipo;
use Illuminate\Http\Request;

class ModeloController extends Controller
{
    public function index(Request $request)
    {
        $query = Modelo::with(['marca', 'tipo'])->activos();

        // Ordenamiento por columna
        $column = $request->input('column', 'idModelo');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idModelo', 'modelo', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idModelo';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $modelos = $query->get();
        $marcas = Marca::activos()->orderBy('marca')->get();
        $tipos  = Tipo::activos()->orderBy('nombreTipo')->get();

        return view('modelos.index', compact('modelos', 'marcas', 'tipos'));
    }

    public function inactivos(Request $request)
    {
        $query = Modelo::with(['marca', 'tipo'])->where('estado', 'baja');

        $column = $request->input('column', 'idModelo');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idModelo', 'modelo', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idModelo';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $modelos = $query->get();
        $marcas = Marca::orderBy('marca')->get();
        $tipos  = Tipo::orderBy('nombreTipo')->get();

        return view('modelos.index', compact('modelos', 'marcas', 'tipos'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'modelo'  => 'required|string|max:100',
            'idMarca' => 'required|exists:marcas,idMarca',
            'idTipo'  => 'nullable|exists:tipos,idTipo',
        ]);

        Modelo::crear($data);

        return redirect()->route('modelos.index')
            ->with('success', 'Modelo creado correctamente');
    }

    public function update(Request $request, Modelo $modelo)
    {
        $data = $request->validate([
            'modelo'  => 'required|string|max:100',
            'idMarca' => 'required|exists:marcas,idMarca',
            'idTipo'  => 'nullable|exists:tipos,idTipo',
        ]);

        $modelo->actualizar($data);

        return redirect()->route('modelos.index')
            ->with('success', 'Modelo actualizado correctamente');
    }

    public function destroy(Request $request, Modelo $modelo)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        if (!$modelo->darDeBaja($request->observacion)) {
            return redirect()->route('modelos.index')
                ->with('error', 'No se puede dar de baja el modelo porque tiene equipos activos asociados');
        }

        return redirect()->route('modelos.index')
            ->with('success', 'Modelo dado de baja correctamente');
    }

    public function alta(Modelo $modelo)
    {
        $modelo = Modelo::where('estado', 'baja')->where('idModelo', $modelo->idModelo)->firstOrFail();
        $modelo->darDeAlta();

        return redirect()->route('modelos.index')
            ->with('success', 'Modelo activado correctamente');
    }

    /**
     * API: Obtener modelos por marca
     */
    public function porMarca($idMarca)
    {
        $modelos = Modelo::where('idMarca', $idMarca)
            ->activos()
            ->orderBy('modelo')
            ->get();

        return response()->json($modelos);
    }
}


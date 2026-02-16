<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use Illuminate\Http\Request;

class MarcaController extends Controller
{
    /* =========================
       LISTADO + BUSCADOR
    ==========================*/
    public function index(Request $request)
    {
        $query = Marca::activos();

        if ($request->filled('buscar')) {
            $query->where('marca', 'like', '%' . $request->buscar . '%');
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'idMarca');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idMarca', 'marca', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idMarca';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $marcas = $query->get();

        return view('marcas.index', compact('marcas'));
    }

    /* =========================
       INACTIVOS
    ==========================*/
    public function inactivos(Request $request)
    {
        $query = Marca::where('estado', 'baja');

        if ($request->filled('buscar')) {
            $query->where('marca', 'like', '%' . $request->buscar . '%');
        }

        $column = $request->input('column', 'idMarca');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idMarca', 'marca', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idMarca';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $marcas = $query->get();

        return view('marcas.index', compact('marcas'));
    }

    /* =========================
       CREAR
    ==========================*/
    public function crear(Request $request)
    {
        $data = $request->validate([
            'marca' => 'required|string|max:255|unique:marcas,marca'
        ]);

        Marca::crear($data);

        return redirect()->back()->with('success', 'Marca creada correctamente');
    }

    /* =========================
       ACTUALIZAR
    ==========================*/
    public function actualizar(Request $request, $id)
    {
        $marca = Marca::activos()->where('idMarca', $id)->firstOrFail();

        $data = $request->validate([
            'marca' => 'required|string|max:255|unique:marcas,marca,' . $id . ',idMarca'
        ]);

        $marca->actualizar($data);

        return redirect()->back()->with('success', 'Marca actualizada correctamente');
    }

    /* =========================
       BAJA
    ==========================*/
    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $marca = Marca::activos()->where('idMarca', $id)->firstOrFail();

        if (! $marca->darDeBaja($request->observacion)) {
            return redirect()->back()->with('error', 'No se puede dar de baja la marca porque tiene modelos activos asociados');
        }

        return redirect()->back()->with('success', 'Marca dada de baja correctamente');
    }

    /* =========================
       ALTA
    ==========================*/
    public function alta($id)
    {
        $marca = Marca::where('estado', 'baja')->where('idMarca', $id)->firstOrFail();
        $marca->darDeAlta();

        return redirect()->back()->with('success', 'Marca activada correctamente');
    }
}


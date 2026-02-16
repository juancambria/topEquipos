<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(Request $request)
    {
        $query = Proveedor::activos();

        if ($request->filled('buscar')) {
            $query->where('proveedor', 'like', '%' . $request->buscar . '%');
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'idProveedor');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idProveedor', 'proveedor', 'mail', 'ciudad', 'provincia', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idProveedor';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $proveedores = $query->get();

        return view('proveedores.index', compact('proveedores'));
    }

    public function inactivos(Request $request)
    {
        $query = Proveedor::where('estado', 'baja');

        if ($request->filled('buscar')) {
            $query->where('proveedor', 'like', '%' . $request->buscar . '%');
        }

        $column = $request->input('column', 'idProveedor');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idProveedor', 'proveedor', 'mail', 'ciudad', 'provincia', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idProveedor';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $proveedores = $query->get();

        return view('proveedores.index', compact('proveedores'));
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'proveedor'     => 'required|string|max:255|unique:proveedores,proveedor',
            'mail'          => 'nullable|email|max:255',
            'provincia'     => 'nullable|string|max:100',
            'ciudad'        => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|string|max:20',
            'direccion'     => 'nullable|string|max:255',
        ]);

        Proveedor::crear($data);

        return redirect()->back()->with('success', 'Proveedor creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $proveedor = Proveedor::activos()->where('idProveedor', $id)->firstOrFail();

        $data = $request->validate([
            'proveedor'     => 'required|string|max:255|unique:proveedores,proveedor,' . $id . ',idProveedor',
            'mail'          => 'nullable|email|max:255',
            'provincia'     => 'nullable|string|max:100',
            'ciudad'        => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|string|max:20',
            'direccion'     => 'nullable|string|max:255',
        ]);

        $proveedor->actualizar($data);

        return redirect()->back()->with('success', 'Proveedor actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $proveedor = Proveedor::activos()->where('idProveedor', $id)->firstOrFail();

        if (!$proveedor->darDeBaja($request->observacion)) {
            return redirect()->back()
                ->with('error', 'No se puede dar de baja el proveedor porque tiene equipos activos asociados');
        }

        return redirect()->back()->with('success', 'Proveedor dado de baja correctamente');
    }

    public function alta($id)
    {
        $proveedor = Proveedor::where('estado', 'baja')->where('idProveedor', $id)->firstOrFail();
        $proveedor->darDeAlta();

        return redirect()->back()->with('success', 'Proveedor activado correctamente');
    }
}


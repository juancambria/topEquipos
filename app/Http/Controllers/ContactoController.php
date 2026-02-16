<?php

namespace App\Http\Controllers;

use App\Models\Contacto;
use App\Models\Proveedor;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function index(Request $request, $idProveedor = null)
    {
        // Si se pasa un idProveedor, filtrar por ese proveedor
        $proveedor = null;
        if ($idProveedor) {
            $proveedor = Proveedor::where('idProveedor', $idProveedor)->first();
        }

        $query = Contacto::with('proveedor')->activos();

        // Si hay un idProveedor específico, filtrar por él
        if ($idProveedor) {
            $query->where('idProveedor', $idProveedor);
        }

        if ($request->filled('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%');
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');

        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }

        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        $query->orderBy($column, $order);

        $contactos = $query->get();
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();

        return view('contactos.index', compact('contactos', 'proveedores', 'proveedor', 'idProveedor'));
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'telefono'    => 'nullable|string|max:50',
            'cargo'       => 'nullable|string|max:100',
        ]);

        Contacto::crear($data);

        return redirect()->back()->with('success', 'Contacto creado correctamente');
    }

    public function actualizar(Request $request, Contacto $contacto)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'telefono'    => 'nullable|string|max:50',
            'cargo'       => 'nullable|string|max:100',
        ]);

        $contacto->actualizar($data);

        return redirect()->back()->with('success', 'Contacto actualizado correctamente');
    }

    public function baja(Request $request, Contacto $contacto)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $contacto->darDeBaja($request->observacion);

        return redirect()->back()->with('success', 'Contacto dado de baja correctamente');
    }

    public function inactivos(Request $request, $idProveedor = null)
    {
        $proveedor = null;
        if ($idProveedor) {
            $proveedor = Proveedor::where('idProveedor', $idProveedor)->first();
        }

        $query = Contacto::with('proveedor')->inactivos();

        if ($idProveedor) {
            $query->where('idProveedor', $idProveedor);
        }

        if ($request->filled('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%');
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $contactos = $query->get();
        $proveedores = Proveedor::orderBy('proveedor')->get();

        return view('contactos.index', compact('contactos', 'proveedores', 'proveedor', 'idProveedor'));
    }

    public function alta(Contacto $contacto)
    {
        $contacto->darDeAlta();

        return redirect()->back()->with('success', 'Contacto activado correctamente');
    }

    public function general(Request $request)
    {
        $query = Contacto::with('proveedor')->activos();

        if ($request->filled('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%')
                  ->orWhere('telefono', 'like', '%' . $request->buscar . '%')
                  ->orWhere('cargo', 'like', '%' . $request->buscar . '%')
                  ->orWhereHas('proveedor', function ($q) use ($request) {
                      $q->where('proveedor', 'like', '%' . $request->buscar . '%');
                  });
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $contactos = $query->get();

        return view('contactos.general', compact('contactos'));
    }
}


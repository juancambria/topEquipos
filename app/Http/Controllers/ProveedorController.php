<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(Request $request)
    {
        $query = Proveedor::activos();

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('proveedor', 'like', '%' . $request->search . '%')
                  ->orWhere('mail', 'like', '%' . $request->search . '%')
                  ->orWhere('telefono', 'like', '%' . $request->search . '%')
                  ->orWhere('ciudad', 'like', '%' . $request->search . '%')
                  ->orWhere('provincia', 'like', '%' . $request->search . '%');
            });
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'idProveedor');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idProveedor', 'proveedor', 'mail', 'telefono', 'ciudad', 'provincia', 'created_at'];
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

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('proveedor', 'like', '%' . $request->search . '%')
                  ->orWhere('mail', 'like', '%' . $request->search . '%')
                  ->orWhere('telefono', 'like', '%' . $request->search . '%')
                  ->orWhere('ciudad', 'like', '%' . $request->search . '%')
                  ->orWhere('provincia', 'like', '%' . $request->search . '%');
            });
        }

        $column = $request->input('column', 'idProveedor');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idProveedor', 'proveedor', 'mail', 'telefono', 'ciudad', 'provincia', 'created_at'];
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
        $this->mergeCleaned($request, [
            'proveedor' => $this->cleanString($request->input('proveedor')),
            'mail' => $this->cleanEmail($request->input('mail')),
            'telefono' => $this->cleanString($request->input('telefono')),
            'provincia' => $this->cleanString($request->input('provincia')),
            'ciudad' => $this->cleanString($request->input('ciudad')),
            'codigo_postal' => $this->cleanString($request->input('codigo_postal')),
            'direccion' => $this->cleanString($request->input('direccion')),
        ]);

        $data = $request->validate([
            'proveedor'     => 'required|string|max:30|unique:proveedores,proveedor',
            'mail'          => 'nullable|email:rfc|max:28',
            'telefono'      => 'nullable|string|max:15',
            'provincia'     => 'nullable|string|max:14',
            'ciudad'        => 'nullable|string|max:16',
            'codigo_postal' => 'nullable|string|max:8',
            'direccion'     => 'nullable|string|max:24',
        ]);

        $proveedor = Proveedor::crear($data);

        if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'id' => $proveedor->idProveedor,
                'message' => 'Proveedor creado correctamente'
            ]);
        }

        return redirect()->back()->with('success', 'Proveedor creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $proveedor = Proveedor::activos()->where('idProveedor', $id)->firstOrFail();

        $this->mergeCleaned($request, [
            'proveedor' => $this->cleanString($request->input('proveedor')),
            'mail' => $this->cleanEmail($request->input('mail')),
            'telefono' => $this->cleanString($request->input('telefono')),
            'provincia' => $this->cleanString($request->input('provincia')),
            'ciudad' => $this->cleanString($request->input('ciudad')),
            'codigo_postal' => $this->cleanString($request->input('codigo_postal')),
            'direccion' => $this->cleanString($request->input('direccion')),
        ]);

        $data = $request->validate([
            'proveedor'     => 'required|string|max:30|unique:proveedores,proveedor,' . $id . ',idProveedor',
            'mail'          => 'nullable|email:rfc|max:28',
            'telefono'      => 'nullable|string|max:15',
            'provincia'     => 'nullable|string|max:14',
            'ciudad'        => 'nullable|string|max:16',
            'codigo_postal' => 'nullable|string|max:8',
            'direccion'     => 'nullable|string|max:24',
        ]);

        $proveedor->actualizar($data);

        if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'id' => $proveedor->idProveedor,
                'message' => 'Proveedor actualizado correctamente'
            ]);
        }

        return redirect()->back()->with('success', 'Proveedor actualizado correctamente');
    }

    public function apiTieneEquipos($id)
    {
        $tiene = \App\Models\Equipo::where('idProveedor', $id)->exists();
        return response()->json(['tieneEquipos' => $tiene]);
    }

    public function baja(Request $request, $id)
    {
        $proveedor = Proveedor::where('idProveedor', $id)->firstOrFail();
        
        // Chequeo final de equipos
        if (\App\Models\Equipo::where('idProveedor', $id)->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar el proveedor porque tiene equipos vinculados.');
        }
        
        try {
            $proveedor->delete();
        } catch (\Throwable $e) {
            return redirect()->back()
                ->with('error', 'No se puede eliminar el proveedor: ' . $e->getMessage());
        }
        return redirect()->back()->with('success', 'Proveedor eliminado correctamente');
    }

    public function alta($id)
    {
        $proveedor = Proveedor::where('estado', 'baja')->where('idProveedor', $id)->firstOrFail();
        $proveedor->darDeAlta();

        return redirect()->back()->with('success', 'Proveedor activado correctamente');
    }
}

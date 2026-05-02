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

        $query = Contacto::activos();

        // Si hay un idProveedor específico, filtrar por él
        if ($idProveedor) {
            $query->where('idProveedor', $idProveedor);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->input('search') . '%');
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');

        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'proveedor', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }

        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        if ($column === 'proveedor') {
            $q = Contacto::select('contactos.*')
                ->join('proveedores', 'contactos.idProveedor', '=', 'proveedores.idProveedor')
                ->where('contactos.estado', 'activo');

            if ($idProveedor) {
                $q->where('contactos.idProveedor', $idProveedor);
            }

            if ($request->filled('search')) {
                $q->where('contactos.nombre', 'like', '%' . $request->input('search') . '%');
            }

            $contactos = $q->orderBy('proveedores.proveedor', $order)->with('proveedor')->get();
        } else {
            $query->orderBy($column, $order);
            $contactos = $query->with('proveedor')->get();
        }
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();

        return view('contactos.index', compact('contactos', 'proveedores', 'proveedor', 'idProveedor'));
    }

    public function crear(Request $request)
    {
        // Normalizar email a minúsculas ANTES de limpiar
        $email = $request->input('mail');
        if ($email) {
            $email = strtolower(trim($email));
            $request->merge(['mail' => $email]);
        }

        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
            'telefono' => $this->cleanPhone($request->input('telefono')),
            'mail' => $this->cleanString($request->input('mail')),
            'observacion' => $this->cleanString($request->input('observacion')),
            'cargo' => $this->cleanString($request->input('cargo')),
        ]);

        $data = $request->validate([
            'nombre'      => 'required|string|max:30',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'telefono'    => ['nullable', 'string', 'max:15', 'regex:/^[0-9+\-().\s]+$/'],
            'mail'        => ['nullable', 'string', 'max:28', 'email:rfc'],
            'observacion' => ['nullable', 'string', 'max:42'],
            'cargo'       => 'nullable|string|max:18',
        ]);

        $contacto = Contacto::crear($data);

        if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'id' => $contacto->idContacto,
                'message' => 'Contacto creado correctamente',
            ]);
        }

        return redirect()->back()->with('success', 'Contacto creado correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $contacto = Contacto::find($id);

        if (!$contacto) {
            if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['error' => 'Contacto no encontrado'], 404);
            }
            return redirect()->back()->with('error', 'Contacto no encontrado');
        }

        // Normalizar email a minúsculas ANTES de limpiar
        $email = $request->input('mail');
        if ($email) {
            $email = strtolower(trim($email));
            $request->merge(['mail' => $email]);
        }

        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
            'telefono' => $this->cleanPhone($request->input('telefono')),
            'mail' => $this->cleanString($request->input('mail')),
            'observacion' => $this->cleanString($request->input('observacion')),
            'cargo' => $this->cleanString($request->input('cargo')),
        ]);

        $data = $request->validate([
            'nombre'      => 'required|string|max:30',
            'idProveedor' => 'required|exists:proveedores,idProveedor',
            'telefono'    => ['nullable', 'string', 'max:15', 'regex:/^[0-9+\-().\s]+$/'],
            'mail'        => ['nullable', 'string', 'max:28', 'email:rfc'],
            'observacion' => ['nullable', 'string', 'max:42'],
            'cargo'       => 'nullable|string|max:18',
        ]);

        $contacto->actualizar($data);

        if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'id' => $contacto->idContacto,
                'message' => 'Contacto actualizado correctamente',
            ]);
        }

        return redirect()->back()->with('success', 'Contacto actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $contacto = Contacto::findOrFail($id);
        try {
            $contacto->delete();
            return response()->json(['success' => true, 'message' => 'Contacto eliminado correctamente']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'No se pudo eliminar el contacto: ' . $e->getMessage()], 500);
        }
    }

    public function inactivos(Request $request, $idProveedor = null)
    {
        $proveedor = null;
        if ($idProveedor) {
            $proveedor = Proveedor::where('idProveedor', $idProveedor)->first();
        }

        $query = Contacto::inactivos();

        if ($idProveedor) {
            $query->where('idProveedor', $idProveedor);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->input('search') . '%');
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'proveedor', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        if ($column === 'proveedor') {
            $q = Contacto::select('contactos.*')
                ->join('proveedores', 'contactos.idProveedor', '=', 'proveedores.idProveedor')
                ->where('contactos.estado', 'baja');

            if ($idProveedor) {
                $q->where('contactos.idProveedor', $idProveedor);
            }

            if ($request->filled('search')) {
                $q->where('contactos.nombre', 'like', '%' . $request->input('search') . '%');
            }

            $contactos = $q->orderBy('proveedores.proveedor', $order)->with('proveedor')->get();
        } else {
            $query->orderBy($column, $order);
            $contactos = $query->with('proveedor')->get();
        }
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
        $query = Contacto::activos();

        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('nombre', 'like', $term)
                  ->orWhere('telefono', 'like', $term)
                  ->orWhere('cargo', 'like', $term)
                  ->orWhereHas('proveedor', function ($q2) use ($term) {
                      $q2->where('proveedor', 'like', $term);
                  });
            });
        }

        $column = $request->input('column', 'idContacto');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['idContacto', 'nombre', 'telefono', 'cargo', 'proveedor', 'estado', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'idContacto';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        if ($column === 'proveedor') {
            $q = Contacto::select('contactos.*')
                ->join('proveedores', 'contactos.idProveedor', '=', 'proveedores.idProveedor')
                ->where('contactos.estado', 'activo');

            if ($request->filled('search')) {
                $term = '%' . $request->input('search') . '%';
                $q->where(function ($w) use ($term) {
                    $w->where('contactos.nombre', 'like', $term)
                      ->orWhere('contactos.telefono', 'like', $term)
                      ->orWhere('contactos.cargo', 'like', $term)
                      ->orWhere('proveedores.proveedor', 'like', $term);
                });
            }

            $contactos = $q->orderBy('proveedores.proveedor', $order)->with('proveedor')->get();
        } else {
            $query->orderBy($column, $order);
            $contactos = $query->with('proveedor')->get();
        }
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();

        return view('contactos.general', compact('contactos', 'proveedores'));
    }
}

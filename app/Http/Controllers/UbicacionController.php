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
        if ($request->filled('search')) {
            $searchColumn = $request->input('searchColumn', '');
            $search = '%' . $request->search . '%';
            
            if ($searchColumn && in_array($searchColumn, ['id', 'nombre', 'codigo', 'ciudad', 'provincia', 'telefono'])) {
                $query->where($searchColumn, 'like', $search);
            } else {
                // Si no especifica columna, busca en todas
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', $search)
                      ->orWhere('nombre', 'like', $search)
                      ->orWhere('codigo', 'like', $search)
                      ->orWhere('ciudad', 'like', $search)
                      ->orWhere('provincia', 'like', $search)
                      ->orWhere('telefono', 'like', $search);
                });
            }
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

    public function apiIndex(Request $request)
    {
        $ubicaciones = Ubicacion::activos()->orderBy('nombre', 'asc')->get();
        
        return response()->json($ubicaciones);
    }

    public function inactivos(Request $request)
    {
        $query = Ubicacion::where('estado', 'baja');

        // Búsqueda
        if ($request->filled('search')) {
            $searchColumn = $request->input('searchColumn', '');
            $search = '%' . $request->search . '%';
            
            if ($searchColumn && in_array($searchColumn, ['id', 'nombre', 'codigo', 'ciudad', 'provincia', 'telefono'])) {
                $query->where($searchColumn, 'like', $search);
            } else {
                // Si no especifica columna, busca en todas
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', $search)
                      ->orWhere('nombre', 'like', $search)
                      ->orWhere('codigo', 'like', $search)
                      ->orWhere('ciudad', 'like', $search)
                      ->orWhere('provincia', 'like', $search)
                      ->orWhere('telefono', 'like', $search);
                });
            }
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
        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
            'codigo' => $this->cleanString($request->input('codigo')),
            'ciudad' => $this->cleanString($request->input('ciudad')),
            'provincia' => $this->cleanString($request->input('provincia')),
            'telefono' => $this->cleanPhone($request->input('telefono')),
            'direccion' => $this->cleanString($request->input('direccion')),
            'codigo_postal' => $this->cleanString($request->input('codigo_postal')),
        ]);

        $data = $request->validate([
            'nombre' => 'required|string|max:40|unique:ubicaciones,nombre',
            'codigo' => 'nullable|string|max:40',
            'ciudad' => 'nullable|string|max:40',
            'provincia' => 'nullable|string|max:40',
            'telefono' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-().\s]+$/'],
            'direccion' => 'nullable|string|max:40',
            'codigo_postal' => 'nullable|string|max:20',
        ]);

        $ubicacion = Ubicacion::crear($data);

        $redirect = $request->input('redirect_to', route('ubicaciones.index'));

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ubicación creada correctamente',
                'id' => $ubicacion->id,
                'nombre' => $ubicacion->nombre
            ]);
        }

        return redirect($redirect)->with('success', 'Ubicación creada correctamente');
    }

    public function actualizar(Request $request, $id)
    {
        $ubicacion = Ubicacion::activos()->findOrFail($id);

        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
            'codigo' => $this->cleanString($request->input('codigo')),
            'ciudad' => $this->cleanString($request->input('ciudad')),
            'provincia' => $this->cleanString($request->input('provincia')),
            'telefono' => $this->cleanPhone($request->input('telefono')),
            'direccion' => $this->cleanString($request->input('direccion')),
            'codigo_postal' => $this->cleanString($request->input('codigo_postal')),
        ]);

        $data = $request->validate([
            'nombre' => 'required|string|max:40|unique:ubicaciones,nombre,' . $id . ',id',
            'codigo' => 'nullable|string|max:40',
            'ciudad' => 'nullable|string|max:40',
            'provincia' => 'nullable|string|max:40',
            'telefono' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-().\s]+$/'],
            'direccion' => 'nullable|string|max:40',
            'codigo_postal' => 'nullable|string|max:20',
        ]);

        $ubicacion->actualizar($data);

        return redirect()->back()->with('success', 'Ubicación actualizada correctamente');
    }

    public function baja(Request $request, $id)
    {
        $ubicacion = Ubicacion::activos()->findOrFail($id);
        try {
            $ubicacion->delete();
        } catch (\Throwable $e) {
            return redirect()->back()
                ->with('error', 'No se puede eliminar la ubicación porque tiene registros asociados');
        }
        return redirect()->back()->with('success', 'Ubicación eliminada correctamente');
    }

    public function alta($id)
    {
        $ubicacion = Ubicacion::where('estado', 'baja')->findOrFail($id);
        $ubicacion->darDeAlta();

        return redirect()->back()->with('success', 'Ubicación activada correctamente');
    }
}

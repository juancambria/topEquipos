<?php

namespace App\Http\Controllers;

use App\Models\PersonaTecnico;
use Illuminate\Http\Request;

class PersonaTecnicoController extends Controller
{
    public function index(Request $request)
    {
        $query = PersonaTecnico::query();

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->search) . '%';
            $query->where('nombre', 'like', $search);
        }

        $this->applySearchAndSorting($request, $query, null, ['id', 'nombre', 'created_at'], 'nombre');
        $query->orderBy('nombre');

        return view('personas_tecnicos.index', [
            'tecnicos' => $query->get(),
        ]);
    }

    public function apiIndex()
    {
        return response()->json(
            PersonaTecnico::orderBy('nombre')->get(['id', 'nombre'])
        );
    }

    public function crear(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:180',
        ]);

        $tecnico = PersonaTecnico::create([
            'nombre' => $this->cleanString($data['nombre']),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Técnico creado correctamente',
                'data' => $tecnico,
            ]);
        }

        return redirect()->route('personasTecnicos.index')->with('success', 'Técnico creado correctamente');
    }

    public function actualizar(Request $request, int $id)
    {
        $tecnico = PersonaTecnico::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:180',
        ]);

        $tecnico->update([
            'nombre' => $this->cleanString($data['nombre']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Técnico actualizado correctamente',
            'data' => $tecnico,
        ]);
    }

    public function baja(int $id)
    {
        $tecnico = PersonaTecnico::findOrFail($id);

        if ($tecnico->incidencias()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar: el técnico tiene incidencias asociadas.',
            ], 422);
        }

        $tecnico->delete();

        return response()->json([
            'success' => true,
            'message' => 'Técnico eliminado correctamente',
        ]);
    }
}

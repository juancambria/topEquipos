<?php

namespace App\Http\Controllers;

use App\Models\Tipo;
use Illuminate\Http\Request;

class TipoController extends Controller
{
    public function index(Request $request)
    {
        $query = Tipo::activos();
        $this->applySearchAndSorting($request, $query, 'nombreTipo', ['idTipo', 'nombreTipo', 'created_at'], 'idTipo');

        $tipos = $query->get();

        return view('tipos.index', compact('tipos'));
    }

    public function apiIndex(Request $request)
    {
        $query = Tipo::activos();

        if ($request->filled('idMarca')) {
            $idMarca = (int) $request->input('idMarca');
            $query->whereHas('marcas', function ($sub) use ($idMarca) {
                $sub->where('marcas.idMarca', $idMarca);
            });
        }

        $tipos = $query->orderBy('nombreTipo', 'asc')->get();
        
        return response()->json($tipos);
    }

    public function inactivos(Request $request)
    {
        $query = Tipo::where('estado', 'baja');
        $this->applySearchAndSorting($request, $query, 'nombreTipo', ['idTipo', 'nombreTipo', 'created_at'], 'idTipo');

        $tipos = $query->get();

        return view('tipos.index', compact('tipos'));
    }

    public function crear(Request $request)
    {
        $this->mergeCleaned($request, [
            'nombreTipo' => $this->cleanString($request->input('nombreTipo')),
        ]);

        $data = $request->validate([
            'nombreTipo' => 'required|string|max:40|unique:tipos,nombreTipo',
        ]);

        $tipo = Tipo::crear($data);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Tipo creado correctamente',
                'id' => $tipo->idTipo,
                'nombre' => $tipo->nombreTipo
            ]);
        }

        return redirect()->back()->with('success', 'Tipo creado correctamente');;
    }

    public function actualizar(Request $request, $id)
    {
        $tipo = Tipo::activos()->where('idTipo', $id)->firstOrFail();

        $this->mergeCleaned($request, [
            'nombreTipo' => $this->cleanString($request->input('nombreTipo')),
        ]);

        $data = $request->validate([
            'nombreTipo' => 'required|string|max:40|unique:tipos,nombreTipo,' . $id . ',idTipo',
        ]);

        $tipo->actualizar($data);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Tipo actualizado correctamente',
                'id' => $tipo->idTipo,
                'nombre' => $tipo->nombreTipo
            ]);
        }

        return redirect()->back()->with('success', 'Tipo actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $tipo = Tipo::activos()->where('idTipo', $id)->firstOrFail();
        try {
            $tipo->delete();
        } catch (\Throwable $e) {
            return redirect()->back()
                ->with('error', 'No se puede eliminar el tipo porque tiene registros asociados');
        }
        return redirect()->back()->with('success', 'Tipo eliminado correctamente');
    }

    public function alta($id)
    {
        $tipo = Tipo::where('estado', 'baja')->where('idTipo', $id)->firstOrFail();
        $tipo->darDeAlta();

        return redirect()->back()->with('success', 'Tipo activado correctamente');
    }
}

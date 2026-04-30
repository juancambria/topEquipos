<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use App\Models\Tipo;
use Illuminate\Http\Request;

class MarcaController extends Controller
{
    /* =========================
       LISTADO + BUSCADOR
    ==========================*/
    public function index(Request $request)
    {
        $query = Marca::activos();
        $this->applySearchAndSorting($request, $query, 'marca', ['idMarca', 'marca', 'created_at'], 'idMarca');

        $marcas = $query->get();

        return view('marcas.index', compact('marcas'));
    }

    /* =========================
       INACTIVOS
    ==========================*/
    public function inactivos(Request $request)
    {
        $query = Marca::where('estado', 'baja');
        $this->applySearchAndSorting($request, $query, 'marca', ['idMarca', 'marca', 'created_at'], 'idMarca');

        $marcas = $query->get();

        return view('marcas.index', compact('marcas'));
    }

    /* =========================
       API INDEX - Returns JSON for AJAX calls
    ==========================*/
    public function apiIndex(Request $request)
    {
        $query = Marca::activos();

        if ($request->filled('idTipo')) {
            $idTipo = (int) $request->input('idTipo');
            $query->whereHas('tipos', function ($sub) use ($idTipo) {
                $sub->where('tipos.idTipo', $idTipo);
            });
        }

        if ($request->filled('buscar')) {
            $query->where('marca', 'like', '%' . $request->buscar . '%');
        }

        $marcas = $query->orderBy('marca', 'asc')->get();

        return response()->json($marcas);
    }

    /* =========================
       CREAR
    ==========================*/
    public function crear(Request $request)
    {
        try {
            $this->mergeCleaned($request, [
                'marca' => $this->cleanUpperString($request->input('marca')),
            ]);

// Check if marca already exists (case-insensitive)
            $marcaExistente = Marca::whereRaw('UPPER(TRIM(marca)) = UPPER(?)', [trim($request->marca)])->first();
            if ($marcaExistente) {
                if ($request->ajax() || $request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Marca ya existe',
                        'existing' => [
                            'idMarca' => $marcaExistente->idMarca,
                            'marca' => $marcaExistente->marca
                        ],
                        'errors' => [
                            'marca' => ['Esta marca ya existe']
                        ]
                    ], 422);
                }
                return back()->withErrors(['marca' => 'Esta marca ya existe']);
            }

            $data = $request->validate([
                'marca' => 'required|string|max:40|unique:marcas,marca'
            ]);
            $marca = Marca::crear($data);

if ($request->filled('tipo_id')) {
    $marca->tipos()->attach((int) $request->tipo_id);
}
$redirect = $request->input('redirect_to');

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Marca creada correctamente',
                    'id' => $marca->idMarca,
                    'nombre' => $marca->marca
                ]);
            }

            if ($redirect) {
                return redirect($redirect)->with('success', 'Marca creada correctamente');
            }

            return redirect()->route('marcas.index', [
                'abrirTiposMarca' => $marca->idMarca,
                'marcaNombre' => $marca->marca,
            ])->with('success', 'Marca creada correctamente');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error interno del servidor',
                    'error' => $e->getMessage()
                ], 500);
            }
            throw $e;
        }
    }

    /* =========================
       ACTUALIZAR
    ==========================*/
    public function actualizar(Request $request, $id)
    {
        $marca = Marca::activos()->where('idMarca', $id)->firstOrFail();

        $this->mergeCleaned($request, [
            'marca' => $this->cleanUpperString($request->input('marca')),
        ]);

        $data = $request->validate([
            'marca' => 'required|string|max:40|unique:marcas,marca,' . $id . ',idMarca'
        ]);

        $marca->actualizar($data);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Marca actualizada correctamente',
                'id' => $marca->idMarca,
                'nombre' => $marca->marca
            ]);
        }

        return redirect()->back()->with('success', 'Marca actualizada correctamente');
    }

    public function tiposParaVinculacion($id)
    {
        $marca = Marca::activos()->with('tipos:idTipo')->where('idMarca', $id)->firstOrFail();
        $tiposAsociados = $marca->tipos->pluck('idTipo')->all();

        $tipos = Tipo::activos()
            ->orderBy('nombreTipo')
            ->get(['idTipo', 'nombreTipo'])
            ->map(function ($tipo) use ($tiposAsociados) {
                return [
                    'idTipo' => $tipo->idTipo,
                    'nombreTipo' => $tipo->nombreTipo,
                    'asociado' => in_array($tipo->idTipo, $tiposAsociados, true),
                ];
            })
            ->values();

        return response()->json($tipos);
    }

    public function asociarTipo(Request $request)
    {
        $data = $request->validate([
            'idMarca' => 'required|exists:marcas,idMarca',
            'idTipo' => 'required|exists:tipos,idTipo',
            'asociado' => 'required|boolean',
        ]);

        $marca = Marca::findOrFail($data['idMarca']);

        if ((bool) $data['asociado']) {
            $marca->tipos()->syncWithoutDetaching([$data['idTipo']]);
        } else {
            $marca->tipos()->detach($data['idTipo']);
        }

        return response()->json(['success' => true]);
    }

    /* =========================
       BAJA
    ==========================*/
    public function baja(Request $request, $id)
    {
        $marca = Marca::activos()->where('idMarca', $id)->firstOrFail();
        try {
            $marca->delete();
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se puede eliminar la marca porque tiene registros asociados.');
        }
        return redirect()->back()->with('success', 'Marca eliminada correctamente');
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

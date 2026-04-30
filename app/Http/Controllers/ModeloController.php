<?php

namespace App\Http\Controllers;

use App\Models\Modelo;
use App\Models\Marca;
use App\Models\Tipo;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ModeloController extends Controller
{
    public function index(Request $request)
    {
        $query = Modelo::with(['marca', 'tipo'])->activos();
        $this->applySearchAndSorting($request, $query, null, ['idModelo', 'modelo', 'created_at'], 'idModelo');

        $modelos = $query->get();
        $marcas = Marca::activos()->orderBy('marca')->get();
        $tipos  = Tipo::activos()->orderBy('nombreTipo')->get();

        return view('modelos.index', compact('modelos', 'marcas', 'tipos'));
    }

    public function inactivos(Request $request)
    {
        $query = Modelo::with(['marca', 'tipo'])->where('estado', 'baja');
        $this->applySearchAndSorting($request, $query, null, ['idModelo', 'modelo', 'created_at'], 'idModelo');

        $modelos = $query->get();
        $marcas = Marca::orderBy('marca')->get();
        $tipos  = Tipo::orderBy('nombreTipo')->get();

        return view('modelos.index', compact('modelos', 'marcas', 'tipos'));
    }

    public function store(Request $request)
    {
        $this->mergeCleaned($request, [
            'modelo' => $this->cleanString($request->input('modelo')),
        ]);

        $data = $request->validate([
            'modelo'  => [
                'required',
                'string',
                'max:40',
                Rule::unique('modelos', 'modelo')->where(function ($query) use ($request) {
                    return $query->where('idMarca', $request->input('idMarca'))
                        ->where('idTipo', $request->input('idTipo'));
                }),
            ],
            'idMarca' => 'required|exists:marcas,idMarca',
            'idTipo'  => 'required|exists:tipos,idTipo',
        ]);

        $this->validarRelacionMarcaTipo((int) $data['idMarca'], (int) $data['idTipo']);

        $modelo = Modelo::crear($data);

        $redirect = $request->input('redirect_to', route('modelos.index'));

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Modelo creado correctamente',
                'id' => $modelo->idModelo,
                'nombre' => $modelo->modelo
            ]);
        }

        return redirect($redirect)->with('success', 'Modelo creado correctamente');
    }

    public function update(Request $request, Modelo $modelo)
    {
        $this->mergeCleaned($request, [
            'modelo' => $this->cleanString($request->input('modelo')),
        ]);

        $data = $request->validate([
            'modelo'  => [
                'required',
                'string',
                'max:40',
                Rule::unique('modelos', 'modelo')->where(function ($query) use ($request) {
                    return $query->where('idMarca', $request->input('idMarca'))
                        ->where('idTipo', $request->input('idTipo'));
                })->ignore($modelo->idModelo, 'idModelo'),
            ],
            'idMarca' => 'required|exists:marcas,idMarca',
            'idTipo'  => 'required|exists:tipos,idTipo',
        ]);

        $this->validarRelacionMarcaTipo((int) $data['idMarca'], (int) $data['idTipo']);

        $modelo->actualizar($data);

        return redirect()->route('modelos.index')
            ->with('success', 'Modelo actualizado correctamente');
    }

    public function destroy(Request $request, Modelo $modelo)
    {
        try {
            $modelo->delete();
        } catch (\Throwable $e) {
            return redirect()->route('modelos.index')
                ->with('error', 'No se puede eliminar el modelo porque tiene registros asociados');
        }
        return redirect()->route('modelos.index')
            ->with('success', 'Modelo eliminado correctamente');
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

    public function porMarcaYTipo($idMarca, $idTipo)
    {
        $modelos = Modelo::where('idMarca', $idMarca)
            ->where('idTipo', $idTipo)
            ->activos()
            ->orderBy('modelo')
            ->get();

        return response()->json($modelos);
    }

    protected function validarRelacionMarcaTipo(int $idMarca, int $idTipo): void
    {
        $existe = Marca::where('idMarca', $idMarca)
            ->whereHas('tipos', function ($query) use ($idTipo) {
                $query->where('tipos.idTipo', $idTipo);
            })
            ->exists();

        if (! $existe) {
            throw ValidationException::withMessages([
                'idMarca' => 'La marca seleccionada no está vinculada al tipo elegido.',
            ]);
        }
    }
}

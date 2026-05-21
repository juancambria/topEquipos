<?php

namespace App\Http\Controllers;

use App\Models\Herramienta;
use App\Models\HerramientaFamilia;
use App\Models\HerramientaMarca;
use App\Models\HerramientaModelo;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HerramientaController extends Controller
{
    public function index(Request $request)
    {
        $query = Herramienta::with(['familia', 'marca', 'modelo'])->activos();
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('descripcion', 'like', '%' . $s . '%')
                    ->orWhereHas('familia', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('marca', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('modelo', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'));
            });
        }
        $column = (string) $request->input('column', 'id');
        $order = (string) $request->input('order', 'asc');
        if (!in_array($column, ['id', 'descripcion', 'created_at'], true)) $column = 'id';
        if (!in_array($order, ['asc', 'desc'], true)) $order = 'asc';
        $query->orderBy($column, $order);
        return view('herramientas.index', ['items' => $query->get()]);
    }

    public function indexFamilias(Request $request)
    {
        $query = HerramientaFamilia::activos();
        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . trim((string) $request->input('search')) . '%');
        }
        $this->applySearchAndSorting($request, $query, null, ['id', 'nombre', 'created_at'], 'id');
        return view('herramientas.familias', ['familias' => $query->get()]);
    }

    public function indexMarcas(Request $request)
    {
        $query = HerramientaMarca::with('familia')->activos();
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('nombre', 'like', '%' . $s . '%')
                    ->orWhereHas('familia', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'));
            });
        }
        $column = (string) $request->input('column', 'id');
        $order = (string) $request->input('order', 'asc');
        if (!in_array($column, ['id', 'nombre', 'created_at'], true)) $column = 'id';
        if (!in_array($order, ['asc', 'desc'], true)) $order = 'asc';
        $query->orderBy($column, $order);
        return view('herramientas.marcas', ['marcas' => $query->get()]);
    }

    public function indexModelos(Request $request)
    {
        $query = HerramientaModelo::with(['familia', 'marca'])->activos();
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('nombre', 'like', '%' . $s . '%')
                    ->orWhereHas('familia', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('marca', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'));
            });
        }
        $column = (string) $request->input('column', 'id');
        $order = (string) $request->input('order', 'asc');
        if (!in_array($column, ['id', 'nombre', 'created_at'], true)) $column = 'id';
        if (!in_array($order, ['asc', 'desc'], true)) $order = 'asc';
        $query->orderBy($column, $order);
        return view('herramientas.modelos', ['modelos' => $query->get()]);
    }

    public function familias()
    {
        return response()->json(['success' => true, 'data' => HerramientaFamilia::activos()->orderBy('nombre')->get(['id', 'nombre'])]);
    }

    public function marcas(Request $request)
    {
        $query = HerramientaMarca::activos()->orderBy('nombre');
        if ($request->filled('herramienta_familia_id')) {
            $query->where('herramienta_familia_id', (int) $request->input('herramienta_familia_id'));
        }
        return response()->json(['success' => true, 'data' => $query->get(['id', 'herramienta_familia_id', 'nombre'])]);
    }

    public function modelos(Request $request)
    {
        $query = HerramientaModelo::activos()->orderBy('nombre');
        if ($request->filled('herramienta_familia_id')) {
            $query->where('herramienta_familia_id', (int) $request->input('herramienta_familia_id'));
        }
        if ($request->filled('herramienta_marca_id')) {
            $query->where('herramienta_marca_id', (int) $request->input('herramienta_marca_id'));
        }
        return response()->json(['success' => true, 'data' => $query->get(['id', 'herramienta_familia_id', 'herramienta_marca_id', 'nombre'])]);
    }

    public function crearFamilia(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate(['nombre' => 'required|string|max:120']);
        $familia = HerramientaFamilia::create($data);
        return response()->json(['success' => true, 'data' => $familia, 'message' => 'Familia creada correctamente']);
    }

    public function actualizarFamilia(Request $request, int $id)
    {
        $familia = HerramientaFamilia::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate(['nombre' => 'required|string|max:120']);
        $familia->update($data);
        return response()->json(['success' => true, 'message' => 'Familia actualizada correctamente']);
    }

    public function bajaFamilia(int $id)
    {
        $familia = HerramientaFamilia::activos()->findOrFail($id);
        $familia->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Familia eliminada correctamente']);
    }

    public function crearMarca(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['herramienta_familia_id'], null);
        $marca = HerramientaMarca::create($data);
        return response()->json(['success' => true, 'data' => $marca, 'message' => 'Marca creada correctamente']);
    }

    public function actualizarMarca(Request $request, int $id)
    {
        $marca = HerramientaMarca::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['herramienta_familia_id'], null);
        $marca->update($data);
        return response()->json(['success' => true, 'message' => 'Marca actualizada correctamente']);
    }

    public function bajaMarca(int $id)
    {
        $marca = HerramientaMarca::activos()->findOrFail($id);
        $marca->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Marca eliminada correctamente']);
    }

    public function crearModelo(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'herramienta_marca_id' => 'required|integer|exists:herramientas_marcas,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['herramienta_familia_id'], (int) $data['herramienta_marca_id']);
        $modelo = HerramientaModelo::create($data);
        return response()->json(['success' => true, 'data' => $modelo, 'message' => 'Modelo creado correctamente']);
    }

    public function actualizarModelo(Request $request, int $id)
    {
        $modelo = HerramientaModelo::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'herramienta_marca_id' => 'required|integer|exists:herramientas_marcas,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['herramienta_familia_id'], (int) $data['herramienta_marca_id']);
        $modelo->update($data);
        return response()->json(['success' => true, 'message' => 'Modelo actualizado correctamente']);
    }

    public function bajaModelo(int $id)
    {
        $modelo = HerramientaModelo::activos()->findOrFail($id);
        $modelo->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Modelo eliminado correctamente']);
    }

    public function crearItem(Request $request)
    {
        $this->mergeCleaned($request, ['descripcion' => $this->cleanString($request->input('descripcion'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'descripcion' => 'required|string|max:180',
            'herramienta_marca_id' => 'required|integer|exists:herramientas_marcas,id',
            'herramienta_modelo_id' => 'required|integer|exists:herramientas_modelos,id',
        ]);
        $this->validarCadena((int) $data['herramienta_familia_id'], (int) $data['herramienta_marca_id'], (int) $data['herramienta_modelo_id']);
        $item = Herramienta::create($data);
        return response()->json(['success' => true, 'data' => $item, 'message' => 'Registro creado correctamente']);
    }

    public function actualizarItem(Request $request, int $id)
    {
        $item = Herramienta::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['descripcion' => $this->cleanString($request->input('descripcion'))]);
        $data = $request->validate([
            'herramienta_familia_id' => 'required|integer|exists:herramientas_familias,id',
            'descripcion' => 'required|string|max:180',
            'herramienta_marca_id' => 'required|integer|exists:herramientas_marcas,id',
            'herramienta_modelo_id' => 'required|integer|exists:herramientas_modelos,id',
        ]);
        $this->validarCadena((int) $data['herramienta_familia_id'], (int) $data['herramienta_marca_id'], (int) $data['herramienta_modelo_id']);
        $item->update($data);
        return response()->json(['success' => true, 'message' => 'Registro actualizado correctamente']);
    }

    public function bajaItem(int $id)
    {
        $item = Herramienta::activos()->findOrFail($id);
        $item->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Registro eliminado correctamente']);
    }

    protected function validarFamiliaMarca(int $familiaId, ?int $marcaId): void
    {
        $familia = HerramientaFamilia::activos()->where('id', $familiaId)->first();
        if (! $familia) {
            throw ValidationException::withMessages([
                'herramienta_familia_id' => 'La familia seleccionada no está activa.',
            ]);
        }

        if ($marcaId === null) {
            return;
        }

        $marca = HerramientaMarca::activos()
            ->where('id', $marcaId)
            ->where('herramienta_familia_id', $familiaId)
            ->first();
        if (! $marca) {
            throw ValidationException::withMessages([
                'herramienta_marca_id' => 'La marca no corresponde a la familia seleccionada.',
            ]);
        }
    }

    protected function validarCadena(int $familiaId, int $marcaId, int $modeloId): void
    {
        $this->validarFamiliaMarca($familiaId, $marcaId);

        $modelo = HerramientaModelo::activos()
            ->where('id', $modeloId)
            ->where('herramienta_familia_id', $familiaId)
            ->where('herramienta_marca_id', $marcaId)
            ->first();
        if (! $modelo) {
            throw ValidationException::withMessages([
                'herramienta_modelo_id' => 'El modelo no corresponde a la marca y familia seleccionadas.',
            ]);
        }
    }
}

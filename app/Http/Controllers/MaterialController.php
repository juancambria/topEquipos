<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialFamilia;
use App\Models\MaterialMarca;
use App\Models\MaterialModelo;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::with(['familia', 'marca', 'modelo'])->activos();
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
        if (!in_array($column, ['id', 'descripcion', 'stock', 'created_at'], true)) $column = 'id';
        if (!in_array($order, ['asc', 'desc'], true)) $order = 'asc';
        $query->orderBy($column, $order);
        return view('materiales.index', ['items' => $query->get()]);
    }

    public function indexFamilias(Request $request)
    {
        $query = MaterialFamilia::activos();
        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . trim((string) $request->input('search')) . '%');
        }
        $this->applySearchAndSorting($request, $query, null, ['id', 'nombre', 'created_at'], 'id');
        return view('materiales.familias', ['familias' => $query->get()]);
    }

    public function indexMarcas(Request $request)
    {
        $query = MaterialMarca::with('familia')->activos();
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
        return view('materiales.marcas', ['marcas' => $query->get()]);
    }

    public function indexModelos(Request $request)
    {
        $query = MaterialModelo::with(['familia', 'marca'])->activos();
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
        return view('materiales.modelos', ['modelos' => $query->get()]);
    }

    public function familias()
    {
        return response()->json(['success' => true, 'data' => MaterialFamilia::activos()->orderBy('nombre')->get(['id', 'nombre'])]);
    }

    public function marcas(Request $request)
    {
        $query = MaterialMarca::activos()->orderBy('nombre');
        if ($request->filled('material_familia_id')) {
            $query->where('material_familia_id', (int) $request->input('material_familia_id'));
        }
        return response()->json(['success' => true, 'data' => $query->get(['id', 'material_familia_id', 'nombre'])]);
    }

    public function modelos(Request $request)
    {
        $query = MaterialModelo::activos()->orderBy('nombre');
        if ($request->filled('material_familia_id')) {
            $query->where('material_familia_id', (int) $request->input('material_familia_id'));
        }
        if ($request->filled('material_marca_id')) {
            $query->where('material_marca_id', (int) $request->input('material_marca_id'));
        }
        return response()->json(['success' => true, 'data' => $query->get(['id', 'material_familia_id', 'material_marca_id', 'nombre'])]);
    }

    public function crearFamilia(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate(['nombre' => 'required|string|max:120']);
        $familia = MaterialFamilia::create($data);
        return response()->json(['success' => true, 'data' => $familia, 'message' => 'Familia creada correctamente']);
    }

    public function actualizarFamilia(Request $request, int $id)
    {
        $familia = MaterialFamilia::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate(['nombre' => 'required|string|max:120']);
        $familia->update($data);
        return response()->json(['success' => true, 'message' => 'Familia actualizada correctamente']);
    }

    public function bajaFamilia(int $id)
    {
        $familia = MaterialFamilia::activos()->findOrFail($id);
        $familia->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Familia eliminada correctamente']);
    }

    public function crearMarca(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['material_familia_id'], null);
        $marca = MaterialMarca::create($data);
        return response()->json(['success' => true, 'data' => $marca, 'message' => 'Marca creada correctamente']);
    }

    public function actualizarMarca(Request $request, int $id)
    {
        $marca = MaterialMarca::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['material_familia_id'], null);
        $marca->update($data);
        return response()->json(['success' => true, 'message' => 'Marca actualizada correctamente']);
    }

    public function bajaMarca(int $id)
    {
        $marca = MaterialMarca::activos()->findOrFail($id);
        $marca->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Marca eliminada correctamente']);
    }

    public function crearModelo(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['material_familia_id'], (int) $data['material_marca_id']);
        $modelo = MaterialModelo::create($data);
        return response()->json(['success' => true, 'data' => $modelo, 'message' => 'Modelo creado correctamente']);
    }

    public function actualizarModelo(Request $request, int $id)
    {
        $modelo = MaterialModelo::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaMarca((int) $data['material_familia_id'], (int) $data['material_marca_id']);
        $modelo->update($data);
        return response()->json(['success' => true, 'message' => 'Modelo actualizado correctamente']);
    }

    public function bajaModelo(int $id)
    {
        $modelo = MaterialModelo::activos()->findOrFail($id);
        $modelo->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Modelo eliminado correctamente']);
    }

    public function crearItem(Request $request)
    {
        $this->mergeCleaned($request, ['descripcion' => $this->cleanString($request->input('descripcion'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'descripcion' => 'required|string|max:180',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'material_modelo_id' => 'required|integer|exists:materiales_modelos,id',
            'stock' => 'required|numeric|min:0.0001',
        ]);
        $this->validarCadena((int) $data['material_familia_id'], (int) $data['material_marca_id'], (int) $data['material_modelo_id']);

        $existente = Material::activos()
            ->where('material_familia_id', (int) $data['material_familia_id'])
            ->where('material_marca_id', (int) $data['material_marca_id'])
            ->where('material_modelo_id', (int) $data['material_modelo_id'])
            ->where('descripcion', (string) $data['descripcion'])
            ->first();

        if ($existente) {
            $existente->stock = (float) $existente->stock + (float) $data['stock'];
            $existente->save();
            return response()->json(['success' => true, 'data' => $existente, 'message' => 'Stock acumulado correctamente']);
        }

        $item = Material::create($data);
        return response()->json(['success' => true, 'data' => $item, 'message' => 'Registro creado correctamente']);
    }

    public function actualizarItem(Request $request, int $id)
    {
        $item = Material::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['descripcion' => $this->cleanString($request->input('descripcion'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'descripcion' => 'required|string|max:180',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'material_modelo_id' => 'required|integer|exists:materiales_modelos,id',
            'stock' => 'required|numeric|min:0',
        ]);
        $this->validarCadena((int) $data['material_familia_id'], (int) $data['material_marca_id'], (int) $data['material_modelo_id']);
        $item->update($data);
        return response()->json(['success' => true, 'message' => 'Registro actualizado correctamente']);
    }

    public function bajaItem(int $id)
    {
        $item = Material::activos()->findOrFail($id);
        $item->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Registro eliminado correctamente']);
    }

    protected function validarFamiliaMarca(int $familiaId, ?int $marcaId): void
    {
        $familia = MaterialFamilia::activos()->where('id', $familiaId)->first();
        if (! $familia) {
            throw ValidationException::withMessages([
                'material_familia_id' => 'La familia seleccionada no está activa.',
            ]);
        }

        if ($marcaId === null) {
            return;
        }

        $marca = MaterialMarca::activos()
            ->where('id', $marcaId)
            ->where('material_familia_id', $familiaId)
            ->first();
        if (! $marca) {
            throw ValidationException::withMessages([
                'material_marca_id' => 'La marca no corresponde a la familia seleccionada.',
            ]);
        }
    }

    protected function validarCadena(int $familiaId, int $marcaId, int $modeloId): void
    {
        $this->validarFamiliaMarca($familiaId, $marcaId);

        $modelo = MaterialModelo::activos()
            ->where('id', $modeloId)
            ->where('material_familia_id', $familiaId)
            ->where('material_marca_id', $marcaId)
            ->first();
        if (! $modelo) {
            throw ValidationException::withMessages([
                'material_modelo_id' => 'El modelo no corresponde a la marca y familia seleccionadas.',
            ]);
        }
    }
}

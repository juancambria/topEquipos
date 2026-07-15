<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialFamilia;
use App\Models\MaterialMarca;
use App\Models\MaterialModelo;
use App\Models\MaterialStockMovimiento;
use App\Models\MaterialTipificacion;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::with(['familia', 'tipificacion', 'marca', 'modelo'])->activos();
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('descripcion', 'like', '%' . $s . '%')
                    ->orWhereHas('familia', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('tipificacion', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('marca', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'))
                    ->orWhereHas('modelo', fn($x) => $x->where('nombre', 'like', '%' . $s . '%'));
            });
        }
        $column = (string) $request->input('column', 'id');
        $order = (string) $request->input('order', 'asc');
        if (!in_array($column, ['id', 'stock', 'created_at'], true)) $column = 'id';
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

    public function indexTipificaciones(Request $request)
    {
        $query = MaterialTipificacion::with('familia')->activos();
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
        return view('materiales.tipificaciones', ['tipificaciones' => $query->get()]);
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

    public function tipificaciones(Request $request)
    {
        $query = MaterialTipificacion::activos()->orderBy('nombre');
        if ($request->filled('material_familia_id')) {
            $query->where('material_familia_id', (int) $request->input('material_familia_id'));
        }
        return response()->json(['success' => true, 'data' => $query->get(['id', 'material_familia_id', 'nombre'])]);
    }

    public function movimientosStock(int $id)
    {
        if (!Schema::hasTable('materiales_stock_movimientos')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $item = Material::with('movimientosStock')->activos()->findOrFail($id);

        $movimientos = $item->movimientosStock()
            ->orderByDesc('fecha_movimiento')
            ->orderByDesc('id')
            ->get()
            ->map(function (MaterialStockMovimiento $movimiento) {
                $fecha = $movimiento->fecha_movimiento
                    ? $movimiento->fecha_movimiento->format('d/m/Y')
                    : ($movimiento->created_at?->format('d/m/Y') ?? '—');

                $cantidad = rtrim(rtrim(number_format((float) $movimiento->cantidad, 4, ',', '.'), '0'), ',');
                if ($cantidad === '') {
                    $cantidad = '0';
                }

                if ($movimiento->factura_numero || $movimiento->proveedor_nombre) {
                    $titulo = 'Datos de la factura de compra';
                } else {
                    $titulo = 'Datos';
                }

                return [
                    'id' => $movimiento->id,
                    'titulo' => $titulo,
                    'fecha' => $fecha,
                    'proveedor' => $movimiento->proveedor_nombre
                        ? trim((string) (($movimiento->proveedor_id ? $movimiento->proveedor_id . ' - ' : '') . $movimiento->proveedor_nombre))
                        : 'Sin proveedor',
                    'factura' => $movimiento->factura_numero ?: 'Sin numero de factura',
                    'precio' => $movimiento->precio_unitario !== null
                        ? number_format((float) $movimiento->precio_unitario, 2, ',', '.')
                        : 'Sin precio',
                    'unidades' => $cantidad,
                ];
            })
            ->values();

        return response()->json(['success' => true, 'data' => $movimientos]);
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

    public function crearTipificacion(Request $request)
    {
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaTipificacion((int) $data['material_familia_id'], null);
        $tipificacion = MaterialTipificacion::create($data);
        return response()->json(['success' => true, 'data' => $tipificacion, 'message' => 'Tipificación creada correctamente']);
    }

    public function actualizarTipificacion(Request $request, int $id)
    {
        $tipificacion = MaterialTipificacion::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['nombre' => $this->cleanUpperString($request->input('nombre'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'nombre' => 'required|string|max:120',
        ]);
        $this->validarFamiliaTipificacion((int) $data['material_familia_id'], null);
        $tipificacion->update($data);
        return response()->json(['success' => true, 'message' => 'Tipificación actualizada correctamente']);
    }

    public function bajaTipificacion(int $id)
    {
        $tipificacion = MaterialTipificacion::activos()->findOrFail($id);
        $tipificacion->update(['estado' => 'baja']);
        return response()->json(['success' => true, 'message' => 'Tipificación eliminada correctamente']);
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
            'material_tipificacion_id' => 'required|integer|exists:materiales_tipificaciones,id',
            'descripcion' => 'nullable|string|max:180',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'material_modelo_id' => 'required|integer|exists:materiales_modelos,id',
            'stock' => 'required|numeric|min:0.0001',
            'factura_id' => 'nullable|integer',
            'factura_numero' => 'nullable|string|max:20',
            'factura_fecha' => 'nullable|date',
            'proveedor_id' => 'nullable|integer',
            'proveedor_nombre' => 'nullable|string|max:180',
            'precio_unitario' => 'nullable|numeric|min:0',
        ]);
        $this->validarCadena(
            (int) $data['material_familia_id'],
            (int) $data['material_tipificacion_id'],
            (int) $data['material_marca_id'],
            (int) $data['material_modelo_id']
        );
        $data['descripcion'] = $this->resolverDescripcionMaterial($data);

        $existente = Material::activos()
            ->where('material_familia_id', (int) $data['material_familia_id'])
            ->where('material_tipificacion_id', (int) $data['material_tipificacion_id'])
            ->where('material_marca_id', (int) $data['material_marca_id'])
            ->where('material_modelo_id', (int) $data['material_modelo_id'])
            ->first();

        if ($existente) {
            $existente->stock = (float) $existente->stock + (float) $data['stock'];
            $existente->save();
            $this->registrarMovimientoStock($existente, (float) $data['stock'], $data, 'alta');
            return response()->json(['success' => true, 'data' => $existente, 'message' => 'Stock acumulado correctamente']);
        }

        $item = Material::create($data);
        $this->registrarMovimientoStock($item, (float) $data['stock'], $data, 'alta');
        return response()->json(['success' => true, 'data' => $item, 'message' => 'Registro creado correctamente']);
    }

    public function actualizarItem(Request $request, int $id)
    {
        $item = Material::activos()->findOrFail($id);
        $this->mergeCleaned($request, ['descripcion' => $this->cleanString($request->input('descripcion'))]);
        $data = $request->validate([
            'material_familia_id' => 'required|integer|exists:materiales_familias,id',
            'material_tipificacion_id' => 'required|integer|exists:materiales_tipificaciones,id',
            'descripcion' => 'nullable|string|max:180',
            'material_marca_id' => 'required|integer|exists:materiales_marcas,id',
            'material_modelo_id' => 'required|integer|exists:materiales_modelos,id',
            'stock' => 'required|numeric|min:0',
        ]);
        $this->validarCadena(
            (int) $data['material_familia_id'],
            (int) $data['material_tipificacion_id'],
            (int) $data['material_marca_id'],
            (int) $data['material_modelo_id']
        );
        $data['descripcion'] = $this->resolverDescripcionMaterial($data);
        $stockAnterior = (float) $item->stock;
        $item->update($data);
        $diferencia = round(((float) $data['stock']) - $stockAnterior, 4);
        if (abs($diferencia) >= 0.0001) {
            $this->registrarMovimientoStock($item, $diferencia, $data, 'ajuste_manual');
        }
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

    protected function validarFamiliaTipificacion(int $familiaId, ?int $tipificacionId): void
    {
        $familia = MaterialFamilia::activos()->where('id', $familiaId)->first();
        if (! $familia) {
            throw ValidationException::withMessages([
                'material_familia_id' => 'La familia seleccionada no está activa.',
            ]);
        }

        if ($tipificacionId === null) {
            return;
        }

        $tipificacion = MaterialTipificacion::activos()
            ->where('id', $tipificacionId)
            ->where('material_familia_id', $familiaId)
            ->first();
        if (! $tipificacion) {
            throw ValidationException::withMessages([
                'material_tipificacion_id' => 'La tipificación no corresponde a la familia seleccionada.',
            ]);
        }
    }

    protected function validarCadena(int $familiaId, int $tipificacionId, int $marcaId, int $modeloId): void
    {
        $this->validarFamiliaTipificacion($familiaId, $tipificacionId);
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

    protected function resolverDescripcionMaterial(array $data): string
    {
        $descripcion = trim((string) ($data['descripcion'] ?? ''));
        if ($descripcion !== '') {
            return $descripcion;
        }

        $tipificacion = MaterialTipificacion::query()->find((int) $data['material_tipificacion_id']);
        return trim((string) ($tipificacion?->nombre ?? ''));
    }

    protected function registrarMovimientoStock(Material $material, float $cantidad, array $data, string $origen): void
    {
        if (!Schema::hasTable('materiales_stock_movimientos')) {
            return;
        }

        $facturaNumero = $this->cleanString($data['factura_numero'] ?? null);
        $proveedorNombre = $this->cleanString($data['proveedor_nombre'] ?? null);
        $proveedorId = isset($data['proveedor_id']) && $data['proveedor_id'] !== '' ? (int) $data['proveedor_id'] : null;

        if ($proveedorNombre === null && $proveedorId) {
            $proveedorNombre = Proveedor::query()
                ->where('idProveedor', $proveedorId)
                ->value('proveedor');
        }

        $fechaMovimiento = null;
        if (!empty($data['factura_fecha'])) {
            $fechaMovimiento = Carbon::parse((string) $data['factura_fecha'])->toDateString();
        }

        MaterialStockMovimiento::create([
            'material_id' => $material->id,
            'fecha_movimiento' => $fechaMovimiento ?? now()->toDateString(),
            'cantidad' => $cantidad,
            'factura_id' => isset($data['factura_id']) && $data['factura_id'] !== '' ? (int) $data['factura_id'] : null,
            'factura_numero' => $facturaNumero,
            'proveedor_id' => $proveedorId,
            'proveedor_nombre' => $proveedorNombre,
            'origen' => $origen,
            'observacion' => $facturaNumero || $proveedorNombre ? null : 'SIN FACTURA',
        ] + (
            Schema::hasColumn('materiales_stock_movimientos', 'precio_unitario')
                ? ['precio_unitario' => isset($data['precio_unitario']) && $data['precio_unitario'] !== '' ? (float) $data['precio_unitario'] : null]
                : []
        ));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\FotoParteTrabajo;
use App\Models\Incidencia;
use App\Models\Material;
use App\Models\MaterialStockMovimiento;
use App\Models\ParteTrabajo;
use App\Models\ParteTrabajoMaterial;
use App\Models\Sector;
use App\Models\Tipo;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ParteTrabajoController extends Controller
{
    private const MAX_FOTOS = 5;

    public function index(Request $request)
    {
        $query = ParteTrabajo::with(['ubicacion', 'sector', 'equipo', 'incidencia', 'materiales.material']);

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('idParteTrabajo', 'like', $search)
                    ->orWhere('descripcionTrabajo', 'like', $search)
                    ->orWhere('observacion', 'like', $search)
                    ->orWhereHas('ubicacion', fn ($x) => $x->where('nombre', 'like', $search))
                    ->orWhereHas('sector', fn ($x) => $x->where('nombre', 'like', $search))
                    ->orWhereHas('incidencia', fn ($x) => $x->where('incidencia', 'like', $search));
            });
        }

        if ($request->filled('tipo') && in_array($request->tipo, ParteTrabajo::TIPOS, true)) {
            $query->where('tipo', $request->tipo);
        }

        $column = (string) $request->input('column', 'fecha');
        $order = (string) $request->input('order', 'desc');
        $allowed = ['idParteTrabajo', 'fecha', 'tipo', 'created_at'];
        if (!in_array($column, $allowed, true)) {
            $column = 'fecha';
        }
        if (!in_array($order, ['asc', 'desc'], true)) {
            $order = 'desc';
        }
        $query->orderBy($column, $order);

        $vista = $request->input('vista', 'calendario');
        if (!in_array($vista, ['calendario', 'tabla'], true)) {
            $vista = 'calendario';
        }

        return view('partes_trabajo.index', [
            'partes' => $query->get(),
            'ubicaciones' => Ubicacion::activos()->orderBy('nombre')->get(['id', 'nombre']),
            'incidencias' => Incidencia::orderByDesc('fecha')->limit(500)->get(['idIncidencia', 'incidencia', 'fecha', 'estado']),
            'materiales' => Material::activos()->with('familia')->orderBy('descripcion')->get(),
            'tipos' => Tipo::activos()->orderBy('nombreTipo')->get(['idTipo', 'nombreTipo']),
            'vista' => $vista,
            'filtroTipo' => $request->input('tipo', ''),
        ]);
    }

    public function apiEquipos(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:120',
            'tipo' => 'nullable|integer|exists:tipos,idTipo',
            'id' => 'nullable|integer|min:1',
        ]);

        $query = Equipo::query()
            ->where('estado', 'activo')
            ->with([
                'tipo:idTipo,nombreTipo',
                'marca:idMarca,marca',
                'modelo:idModelo,modelo',
            ]);

        if ($request->filled('id')) {
            $query->where('id', (int) $request->id);
        }

        if ($request->filled('tipo')) {
            $query->where('idTipo', (int) $request->tipo);
        }

        if ($request->filled('q')) {
            $raw = trim((string) $request->q);
            $term = '%' . $raw . '%';
            $query->where(function ($q) use ($term, $raw) {
                $q->where('serie', 'like', $term)
                    ->orWhereHas('marca', fn ($x) => $x->where('marca', 'like', $term))
                    ->orWhereHas('modelo', fn ($x) => $x->where('modelo', 'like', $term))
                    ->orWhereHas('tipo', fn ($x) => $x->where('nombreTipo', 'like', $term));
                if (ctype_digit($raw)) {
                    $q->orWhere('id', (int) $raw);
                } elseif (preg_match('/^\d+$/', $raw)) {
                    $q->orWhere('id', 'like', $term);
                }
            });
        }

        $equipos = $query->orderBy('id')->limit(150)->get()->map(function (Equipo $e) {
            return [
                'id' => $e->id,
                'serie' => $e->serie,
                'tipo' => $e->tipo?->nombreTipo,
                'tipo_id' => $e->idTipo,
                'marca' => $e->marca?->marca,
                'modelo' => $e->modelo?->modelo,
                'label' => $this->formatearEquipoLabel($e),
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $equipos]);
    }

    public function apiCalendario(Request $request)
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $partes = ParteTrabajo::with(['ubicacion', 'sector', 'incidencia'])
            ->whereBetween('fecha', [$request->desde, $request->hasta])
            ->orderBy('fecha')
            ->orderBy('idParteTrabajo')
            ->get()
            ->map(fn (ParteTrabajo $p) => $this->serializarParte($p));

        return response()->json(['success' => true, 'data' => $partes]);
    }

    public function show(int $id)
    {
        $parte = ParteTrabajo::with(['ubicacion', 'sector', 'equipo.tipo', 'equipo.marca', 'equipo.modelo', 'incidencia', 'fotos', 'materiales.material'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->serializarParte($parte, true),
        ]);
    }

    public function crear(Request $request)
    {
        $data = $this->validarParte($request);
        $materiales = $this->validarMateriales($request);

        return DB::transaction(function () use ($request, $data, $materiales) {
            $parte = ParteTrabajo::create($this->extraerDatosParte($data));
            $this->aplicarMateriales($parte, $materiales);
            $this->guardarFotos($request, $parte);
            $this->aplicarIncidenciaDesdeData($data, $parte);

            return response()->json([
                'success' => true,
                'message' => 'Parte de trabajo creado correctamente',
                'data' => $this->serializarParte($parte->fresh([
                    'ubicacion', 'sector', 'equipo', 'incidencia', 'fotos', 'materiales.material',
                ]), true),
            ]);
        });
    }

    public function actualizar(Request $request, int $id)
    {
        $parte = ParteTrabajo::with('materiales')->findOrFail($id);
        $data = $this->validarParte($request, $parte);
        $materiales = $this->validarMateriales($request);

        return DB::transaction(function () use ($request, $parte, $data, $materiales) {
            $this->revertirStockMateriales($parte);
            $parte->materiales()->delete();

            $parte->update($this->extraerDatosParte($data));
            $this->aplicarMateriales($parte, $materiales);
            $this->guardarFotos($request, $parte);

            if ($request->filled('fotos_eliminar')) {
                $this->eliminarFotosMarcadas($request, $parte);
            }

            $this->aplicarIncidenciaDesdeData($data, $parte);

            return response()->json([
                'success' => true,
                'message' => 'Parte de trabajo actualizado correctamente',
                'data' => $this->serializarParte($parte->fresh([
                    'ubicacion', 'sector', 'equipo', 'incidencia', 'fotos', 'materiales.material',
                ]), true),
            ]);
        });
    }

    public function baja(int $id)
    {
        $parte = ParteTrabajo::with(['fotos', 'materiales'])->findOrFail($id);

        DB::transaction(function () use ($parte) {
            $this->revertirStockMateriales($parte);
            MaterialStockMovimiento::where('parte_trabajo_id', $parte->idParteTrabajo)->delete();
            foreach ($parte->fotos as $foto) {
                $foto->delete();
            }
            $parte->materiales()->delete();
            $parte->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Parte de trabajo eliminado correctamente',
        ]);
    }

    private function validarParte(Request $request, ?ParteTrabajo $parte = null): array
    {
        $data = $request->validate([
            'fecha' => 'required|date',
            'tipo' => ['required', Rule::in(ParteTrabajo::TIPOS)],
            'codigoEquipo' => 'nullable|integer|exists:equipos,id',
            'codigoLugar' => 'nullable|integer|exists:ubicaciones,id',
            'codigoSector' => 'nullable|integer|exists:sectores,id',
            'codigo_incidencia' => 'nullable|integer|exists:incidencias,idIncidencia',
            'descripcionTrabajo' => 'required|string|max:10000',
            'observacion' => 'nullable|string|max:5000',
            'fotos.*' => 'nullable|image|mimes:jpeg,jpg,png|max:4096',
            'incidencia_estado' => ['nullable', Rule::in(Incidencia::ESTADOS)],
            'incidencia_fecha_resolucion' => 'nullable|date',
            'incidencia_resolucion' => 'nullable|string|max:5000',
        ]);

        if ($data['tipo'] === 'mantenimiento' && empty($data['codigoEquipo'])) {
            throw ValidationException::withMessages([
                'codigoEquipo' => ['El equipo es obligatorio para partes de mantenimiento.'],
            ]);
        }

        if (!empty($data['codigoLugar']) && !empty($data['codigoSector'])) {
            $sectorValido = Sector::where('id', $data['codigoSector'])
                ->whereHas('ubicaciones', fn ($q) => $q->where('ubicaciones.id', $data['codigoLugar']))
                ->exists();
            if (!$sectorValido) {
                throw ValidationException::withMessages([
                    'codigoSector' => ['El sector seleccionado no pertenece a la ubicación indicada.'],
                ]);
            }
        }

        $data['descripcionTrabajo'] = $this->cleanTextarea($data['descripcionTrabajo']);
        $data['observacion'] = $this->cleanTextarea($data['observacion'] ?? null);

        $incidenciaEstado = $data['incidencia_estado'] ?? null;
        $incidenciaFechaRes = $data['incidencia_fecha_resolucion'] ?? null;
        $incidenciaResolucion = $data['incidencia_resolucion'] ?? null;
        unset($data['incidencia_estado'], $data['incidencia_fecha_resolucion'], $data['incidencia_resolucion'], $data['fotos']);

        return array_merge($data, [
            '_incidencia_estado' => $incidenciaEstado,
            '_incidencia_fecha_resolucion' => $incidenciaFechaRes,
            '_incidencia_resolucion' => $incidenciaResolucion,
        ]);
    }

    private function extraerDatosParte(array $data): array
    {
        unset($data['_incidencia_estado'], $data['_incidencia_fecha_resolucion'], $data['_incidencia_resolucion']);
        return $data;
    }

    private function aplicarIncidenciaDesdeData(array $data, ParteTrabajo $parte): void
    {
        if (empty($parte->codigo_incidencia)) {
            return;
        }

        $incidencia = Incidencia::find($parte->codigo_incidencia);
        if (!$incidencia) {
            return;
        }

        $cambios = [];
        if (!empty($data['_incidencia_estado'])) {
            $cambios['estado'] = $data['_incidencia_estado'];
        }
        if (!empty($data['_incidencia_fecha_resolucion'])) {
            $cambios['fechaResolucion'] = $data['_incidencia_fecha_resolucion'];
        }
        if (!empty($data['_incidencia_resolucion'])) {
            $cambios['incidenciaResolucion'] = $this->cleanTextarea($data['_incidencia_resolucion']);
        }

        if ($cambios !== []) {
            $incidencia->update($cambios);
        }
    }

    private function validarMateriales(Request $request): array
    {
        $materiales = $request->input('materiales', []);
        if (!is_array($materiales)) {
            return [];
        }

        $resultado = [];
        foreach ($materiales as $item) {
            if (!is_array($item)) {
                continue;
            }
            $materialId = (int) ($item['material_id'] ?? 0);
            $cantidad = (float) ($item['cantidad'] ?? 0);
            if ($materialId <= 0 || $cantidad <= 0) {
                continue;
            }
            if (!Material::activos()->where('id', $materialId)->exists()) {
                throw ValidationException::withMessages([
                    'materiales' => ['Material no válido o inactivo.'],
                ]);
            }
            $resultado[] = [
                'material_id' => $materialId,
                'cantidad' => round($cantidad, 4),
            ];
        }

        return $resultado;
    }

    private function aplicarMateriales(ParteTrabajo $parte, array $materiales): void
    {
        foreach ($materiales as $item) {
            $material = Material::findOrFail($item['material_id']);
            $cantidad = (float) $item['cantidad'];

            ParteTrabajoMaterial::create([
                'idParteTrabajo' => $parte->idParteTrabajo,
                'material_id' => $material->id,
                'cantidad' => $cantidad,
            ]);

            $material->stock = round((float) $material->stock - $cantidad, 4);
            $material->save();

            MaterialStockMovimiento::create([
                'material_id' => $material->id,
                'fecha_movimiento' => $parte->fecha,
                'cantidad' => -$cantidad,
                'parte_trabajo_id' => $parte->idParteTrabajo,
                'origen' => 'parte_trabajo',
                'observacion' => 'Consumo parte de trabajo #' . $parte->idParteTrabajo,
            ] + (
                Schema::hasColumn('materiales_stock_movimientos', 'precio_unitario')
                    ? ['precio_unitario' => null]
                    : []
            ));
        }
    }

    private function revertirStockMateriales(ParteTrabajo $parte): void
    {
        foreach ($parte->materiales as $uso) {
            $material = Material::find($uso->material_id);
            if ($material) {
                $material->stock = round((float) $material->stock + (float) $uso->cantidad, 4);
                $material->save();
            }
        }

        MaterialStockMovimiento::where('parte_trabajo_id', $parte->idParteTrabajo)->delete();
    }

    private function guardarFotos(Request $request, ParteTrabajo $parte): void
    {
        if (!$request->hasFile('fotos')) {
            return;
        }

        $actuales = $parte->fotos()->count();
        $nuevas = count(array_filter($request->file('fotos') ?? [], fn ($f) => $f && $f->isValid()));

        if ($actuales + $nuevas > self::MAX_FOTOS) {
            throw ValidationException::withMessages([
                'fotos' => ['Máximo ' . self::MAX_FOTOS . ' fotos por parte de trabajo.'],
            ]);
        }

        foreach ($request->file('fotos') as $archivo) {
            if (!$archivo || !$archivo->isValid()) {
                continue;
            }

            $nombreOriginal = $archivo->getClientOriginalName();
            $nombreArchivo = time() . '_' . uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $nombreOriginal);
            $archivo->storeAs('partes_trabajo/' . $parte->idParteTrabajo, $nombreArchivo, 'public');

            FotoParteTrabajo::create([
                'codigo_parte_trabajo' => $parte->idParteTrabajo,
                'pathFoto' => 'partes_trabajo/' . $parte->idParteTrabajo . '/' . $nombreArchivo,
                'nombreFoto' => $nombreOriginal,
                'formatoFoto' => strtolower($archivo->getClientOriginalExtension()),
            ]);
        }
    }

    private function eliminarFotosMarcadas(Request $request, ParteTrabajo $parte): void
    {
        $ids = array_filter(array_map('intval', (array) $request->input('fotos_eliminar', [])));
        if ($ids === []) {
            return;
        }

        $parte->fotos()->whereIn('idFoto', $ids)->get()->each->delete();
    }

    private function serializarParte(ParteTrabajo $parte, bool $detalle = false): array
    {
        $data = [
            'id' => $parte->idParteTrabajo,
            'fecha' => $parte->fecha?->format('Y-m-d'),
            'fecha_formateada' => $parte->fecha?->format('d/m/Y'),
            'tipo' => $parte->tipo,
            'tipo_label' => $parte->tipo_label,
            'codigoEquipo' => $parte->codigoEquipo,
            'equipo' => $parte->equipo?->serie ?? ($parte->equipo ? '#' . $parte->equipo->id : null),
            'equipo_label' => $this->formatearEquipoLabel($parte->equipo),
            'codigoLugar' => $parte->codigoLugar,
            'codigoSector' => $parte->codigoSector,
            'lugar' => $parte->ubicacion?->nombre,
            'sector' => $parte->sector?->nombre,
            'codigo_incidencia' => $parte->codigo_incidencia,
            'incidencia_asunto' => $parte->incidencia?->incidencia,
            'descripcion_resumen' => mb_substr((string) $parte->descripcionTrabajo, 0, 80),
        ];

        if ($detalle) {
            $data['descripcionTrabajo'] = $parte->descripcionTrabajo;
            $data['observacion'] = $parte->observacion;
            $data['fotos'] = $parte->fotos?->map(fn (FotoParteTrabajo $f) => [
                'id' => $f->idFoto,
                'nombre' => $f->nombreFoto,
                'url' => Storage::disk('public')->url($f->pathFoto),
            ])->values()->all() ?? [];
            $data['materiales'] = $parte->materiales?->map(fn (ParteTrabajoMaterial $m) => [
                'material_id' => $m->material_id,
                'cantidad' => (float) $m->cantidad,
                'descripcion' => $m->material?->descripcion,
                'familia' => $m->material?->familia?->nombre,
            ])->values()->all() ?? [];
        }

        return $data;
    }

    private function formatearEquipoLabel(?Equipo $equipo): ?string
    {
        if (!$equipo) {
            return null;
        }

        $partes = array_filter([
            '#' . $equipo->id,
            $equipo->serie,
            $equipo->tipo?->nombreTipo,
            $equipo->marca?->marca,
            $equipo->modelo?->modelo,
        ], fn ($v) => $v !== null && $v !== '');

        return implode(' — ', $partes);
    }
}

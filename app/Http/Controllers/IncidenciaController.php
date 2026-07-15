<?php

namespace App\Http\Controllers;

use App\Models\FotoIncidencia;
use App\Models\Incidencia;
use App\Models\PersonaTecnico;
use App\Models\Sector;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class IncidenciaController extends Controller
{
    private const MAX_FOTOS = 5;

    public function index(Request $request)
    {
        $query = Incidencia::with(['ubicacion', 'sector', 'tecnico', 'partesTrabajo']);

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('idIncidencia', 'like', $search)
                    ->orWhere('incidencia', 'like', $search)
                    ->orWhere('solicito', 'like', $search)
                    ->orWhere('observacion', 'like', $search)
                    ->orWhereHas('ubicacion', fn ($x) => $x->where('nombre', 'like', $search))
                    ->orWhereHas('sector', fn ($x) => $x->where('nombre', 'like', $search))
                    ->orWhereHas('tecnico', fn ($x) => $x->where('nombre', 'like', $search));
            });
        }

        if ($request->filled('estado') && in_array($request->estado, Incidencia::ESTADOS, true)) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('prioridad') && in_array($request->prioridad, Incidencia::PRIORIDADES, true)) {
            $query->where('prioridad', $request->prioridad);
        }

        $column = (string) $request->input('column', 'fecha');
        $order = (string) $request->input('order', 'desc');
        $allowed = ['idIncidencia', 'fecha', 'estado', 'prioridad', 'created_at'];
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

        return view('incidencias.index', [
            'incidencias' => $query->get(),
            'ubicaciones' => Ubicacion::activos()->orderBy('nombre')->get(['id', 'nombre']),
            'tecnicos' => PersonaTecnico::orderBy('nombre')->get(['id', 'nombre']),
            'vista' => $vista,
            'filtroEstado' => $request->input('estado', ''),
            'filtroPrioridad' => $request->input('prioridad', ''),
        ]);
    }

    public function apiCalendario(Request $request)
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $incidencias = Incidencia::with(['ubicacion', 'sector', 'tecnico'])
            ->whereBetween('fecha', [$request->desde, $request->hasta])
            ->orderBy('fecha')
            ->orderBy('idIncidencia')
            ->get()
            ->map(fn (Incidencia $i) => $this->serializarIncidencia($i));

        return response()->json(['success' => true, 'data' => $incidencias]);
    }

    public function show(int $id)
    {
        $incidencia = Incidencia::with(['ubicacion', 'sector', 'tecnico', 'fotos', 'partesTrabajo'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->serializarIncidencia($incidencia, true),
        ]);
    }

    public function crear(Request $request)
    {
        $data = $this->validarIncidencia($request);

        return DB::transaction(function () use ($request, $data) {
            $incidencia = Incidencia::create($data);
            $this->guardarFotos($request, $incidencia);

            return response()->json([
                'success' => true,
                'message' => 'Incidencia creada correctamente',
                'data' => $this->serializarIncidencia($incidencia->fresh(['ubicacion', 'sector', 'tecnico', 'fotos']), true),
            ]);
        });
    }

    public function actualizar(Request $request, int $id)
    {
        $incidencia = Incidencia::findOrFail($id);
        $data = $this->validarIncidencia($request);

        return DB::transaction(function () use ($request, $incidencia, $data) {
            $incidencia->update($data);
            $this->guardarFotos($request, $incidencia);

            if ($request->filled('fotos_eliminar')) {
                $this->eliminarFotosMarcadas($request, $incidencia);
            }

            return response()->json([
                'success' => true,
                'message' => 'Incidencia actualizada correctamente',
                'data' => $this->serializarIncidencia($incidencia->fresh(['ubicacion', 'sector', 'tecnico', 'fotos']), true),
            ]);
        });
    }

    public function baja(int $id)
    {
        $incidencia = Incidencia::with('fotos')->findOrFail($id);

        DB::transaction(function () use ($incidencia) {
            foreach ($incidencia->fotos as $foto) {
                $foto->delete();
            }
            $incidencia->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Incidencia eliminada correctamente',
        ]);
    }

    private function validarIncidencia(Request $request): array
    {
        $data = $request->validate([
            'fecha' => 'required|date',
            'codigoLugar' => 'nullable|integer|exists:ubicaciones,id',
            'codigoSector' => 'nullable|integer|exists:sectores,id',
            'incidencia' => 'required|string|max:255',
            'observacion' => 'nullable|string|max:5000',
            'incidenciaResolucion' => 'nullable|string|max:5000',
            'fechaResolucion' => 'nullable|date',
            'estado' => ['required', Rule::in(Incidencia::ESTADOS)],
            'tipo' => 'nullable|string|max:50',
            'codigoTecnico' => 'nullable|integer|exists:personas_tecnicos,id',
            'prioridad' => ['required', Rule::in(Incidencia::PRIORIDADES)],
            'solicito' => 'nullable|string|max:180',
            'completado' => 'nullable|integer|min:0|max:100',
            'fotos.*' => 'nullable|image|mimes:jpeg,jpg,png|max:4096',
        ]);

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

        $data['incidencia'] = $this->cleanString($data['incidencia']);
        $data['observacion'] = $this->cleanTextarea($data['observacion'] ?? null);
        $data['incidenciaResolucion'] = $this->cleanTextarea($data['incidenciaResolucion'] ?? null);
        $data['solicito'] = $this->cleanString($data['solicito'] ?? null);
        $data['completado'] = isset($data['completado']) ? (int) $data['completado'] : 0;
        unset($data['fotos']);

        return $data;
    }

    private function guardarFotos(Request $request, Incidencia $incidencia): void
    {
        if (!$request->hasFile('fotos')) {
            return;
        }

        $actuales = $incidencia->fotos()->count();
        $nuevas = count(array_filter($request->file('fotos') ?? [], fn ($f) => $f && $f->isValid()));

        if ($actuales + $nuevas > self::MAX_FOTOS) {
            throw ValidationException::withMessages([
                'fotos' => ['Máximo ' . self::MAX_FOTOS . ' fotos por incidencia.'],
            ]);
        }

        foreach ($request->file('fotos') as $archivo) {
            if (!$archivo || !$archivo->isValid()) {
                continue;
            }

            $nombreOriginal = $archivo->getClientOriginalName();
            $nombreArchivo = time() . '_' . uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $nombreOriginal);
            $archivo->storeAs('incidencias/' . $incidencia->idIncidencia, $nombreArchivo, 'public');

            FotoIncidencia::create([
                'codigo_incidencia' => $incidencia->idIncidencia,
                'pathFoto' => 'incidencias/' . $incidencia->idIncidencia . '/' . $nombreArchivo,
                'nombreFoto' => $nombreOriginal,
                'formatoFoto' => strtolower($archivo->getClientOriginalExtension()),
            ]);
        }
    }

    private function eliminarFotosMarcadas(Request $request, Incidencia $incidencia): void
    {
        $ids = array_filter(array_map('intval', (array) $request->input('fotos_eliminar', [])));
        if ($ids === []) {
            return;
        }

        $incidencia->fotos()->whereIn('idFoto', $ids)->get()->each->delete();
    }

    private function serializarIncidencia(Incidencia $incidencia, bool $detalle = false): array
    {
        $data = [
            'id' => $incidencia->idIncidencia,
            'fecha' => $incidencia->fecha?->format('Y-m-d'),
            'fecha_formateada' => $incidencia->fecha?->format('d/m/Y'),
            'codigoLugar' => $incidencia->codigoLugar,
            'codigoSector' => $incidencia->codigoSector,
            'lugar' => $incidencia->ubicacion?->nombre,
            'sector' => $incidencia->sector?->nombre,
            'incidencia' => $incidencia->incidencia,
            'estado' => $incidencia->estado,
            'estado_label' => $incidencia->estado_label,
            'prioridad' => $incidencia->prioridad,
            'prioridad_label' => $incidencia->prioridad_label,
            'solicito' => $incidencia->solicito,
            'codigoTecnico' => $incidencia->codigoTecnico,
            'tecnico' => $incidencia->tecnico?->nombre,
            'completado' => $incidencia->completado,
            'fechaResolucion' => $incidencia->fechaResolucion?->format('Y-m-d'),
            'fecha_resolucion_formateada' => $incidencia->fechaResolucion?->format('d/m/Y'),
            'partes_count' => $incidencia->relationLoaded('partesTrabajo')
                ? $incidencia->partesTrabajo->count()
                : $incidencia->partesTrabajo()->count(),
        ];

        if ($detalle) {
            $data['observacion'] = $incidencia->observacion;
            $data['incidenciaResolucion'] = $incidencia->incidenciaResolucion;
            $data['tipo'] = $incidencia->tipo;
            $data['fotos'] = $incidencia->fotos?->map(fn (FotoIncidencia $f) => [
                'id' => $f->idFoto,
                'nombre' => $f->nombreFoto,
                'url' => Storage::disk('public')->url($f->pathFoto),
            ])->values()->all() ?? [];
            $data['partes_trabajo'] = $incidencia->partesTrabajo?->pluck('idParteTrabajo')->all() ?? [];
        }

        return $data;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AtributoTipoEquipo;
use App\Models\Tipo;
use App\Models\TipoAtributoEspecificacion;
use App\Models\UnidadMedidaAtributo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AtributoTipoEquipoController extends Controller
{
    public function index(Request $request)
    {
        $atributos = AtributoTipoEquipo::activos()
            ->orderBy('nombre')
            ->get(['idAtributo', 'nombre']);

        $tipos = Tipo::activos()
            ->orderBy('nombreTipo')
            ->get(['idTipo', 'nombreTipo']);

        $idTipoSeleccionado = (int) $request->query('idTipo', $tipos->first()->idTipo ?? 0);
        if (!$tipos->contains('idTipo', $idTipoSeleccionado)) {
            $idTipoSeleccionado = (int) ($tipos->first()->idTipo ?? 0);
        }

        $configuraciones = $idTipoSeleccionado > 0
            ? $this->obtenerConfiguracionesTipo($idTipoSeleccionado)
            : [];

        $unidadesMedida = UnidadMedidaAtributo::orderBy('nombre')
            ->get(['idUnidadMedida', 'nombre']);

        return view('atributos-tipos-equipos.index', compact(
            'atributos',
            'tipos',
            'idTipoSeleccionado',
            'configuraciones',
            'unidadesMedida'
        ));
    }

    public function crearAtributo(Request $request)
    {
        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
        ]);

        $data = $request->validate([
            'nombre' => 'required|string|max:30|unique:atributos_tipos_equipos,nombre',
        ]);

        $atributo = AtributoTipoEquipo::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Atributo creado correctamente',
            'atributo' => [
                'idAtributo' => $atributo->idAtributo,
                'nombre' => $atributo->nombre,
            ],
        ]);
    }

    public function eliminarAtributo(int $idAtributo)
    {
        $atributo = AtributoTipoEquipo::findOrFail($idAtributo);
        $tieneVinculos = TipoAtributoEspecificacion::where('idAtributo', $atributo->idAtributo)->exists();
        if ($tieneVinculos) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el atributo porque está vinculado a uno o más tipos.',
            ], 422);
        }
        $atributo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Atributo eliminado correctamente',
        ]);
    }

    public function crearUnidadMedida(Request $request)
    {
        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
        ]);

        $data = $request->validate([
            'nombre' => 'required|string|max:30|unique:unidades_medida_atributos,nombre',
        ]);

        $unidad = UnidadMedidaAtributo::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Unidad de medida creada correctamente',
            'unidad' => [
                'idUnidadMedida' => $unidad->idUnidadMedida,
                'nombre' => $unidad->nombre,
            ],
        ]);
    }

    public function eliminarUnidadMedida(int $idUnidadMedida)
    {
        $unidad = UnidadMedidaAtributo::findOrFail($idUnidadMedida);

        DB::transaction(function () use ($unidad) {
            TipoAtributoEspecificacion::where('unidad_medida', $unidad->nombre)
                ->update(['unidad_medida' => null]);

            $unidad->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Unidad de medida eliminada correctamente',
        ]);
    }

    public function configuracionesPorTipo(int $idTipo)
    {
        $tipo = Tipo::activos()->where('idTipo', $idTipo)->firstOrFail();

        return response()->json([
            'success' => true,
            'tipo' => [
                'idTipo' => $tipo->idTipo,
                'nombreTipo' => $tipo->nombreTipo,
            ],
            'configuraciones' => $this->obtenerConfiguracionesTipo($idTipo),
        ]);
    }

    public function guardarConfiguracionesTipo(Request $request, int $idTipo)
    {
        Tipo::activos()->where('idTipo', $idTipo)->firstOrFail();

        $payload = $request->validate([
            'atributos' => 'required|array',
            'atributos.*.idAtributo' => 'required|integer|exists:atributos_tipos_equipos,idAtributo',
            'atributos.*.asignado' => 'required|boolean',
            'atributos.*.unidad_medida' => 'nullable|string|max:30',
            'atributos.*.tipo_especificacion' => 'nullable|in:rango_valores',
            'atributos.*.valores_permitidos' => 'nullable|string|max:3000',
        ]);

        DB::transaction(function () use ($idTipo, $payload) {
            $idsAsignados = [];

            foreach ($payload['atributos'] as $item) {
                $idAtributo = (int) $item['idAtributo'];
                $asignado = (bool) $item['asignado'];

                if (!$asignado) {
                    TipoAtributoEspecificacion::where('idTipo', $idTipo)
                        ->where('idAtributo', $idAtributo)
                        ->delete();
                    continue;
                }

                $idsAsignados[] = $idAtributo;

                TipoAtributoEspecificacion::updateOrCreate(
                    ['idTipo' => $idTipo, 'idAtributo' => $idAtributo],
                    [
                        'unidad_medida' => $this->cleanString($item['unidad_medida'] ?? null),
                        'tipo_especificacion' => 'rango_valores',
                        'rango_min' => null,
                        'rango_max' => null,
                        'valores_permitidos' => $this->serializarOpcionesUnicas($item['valores_permitidos'] ?? null),
                    ]
                );
            }

            if (count($idsAsignados) === 0) {
                TipoAtributoEspecificacion::where('idTipo', $idTipo)->delete();
            } else {
                TipoAtributoEspecificacion::where('idTipo', $idTipo)
                    ->whereNotIn('idAtributo', $idsAsignados)
                    ->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Configuración guardada correctamente',
            'configuraciones' => $this->obtenerConfiguracionesTipo($idTipo),
        ]);
    }

    public function crearAtributoParaTipo(Request $request, int $idTipo)
    {
        $tipo = Tipo::activos()->where('idTipo', $idTipo)->firstOrFail();

        $this->mergeCleaned($request, [
            'nombre' => $this->cleanString($request->input('nombre')),
        ]);

        $data = $request->validate([
            'nombre' => 'required|string|max:30|unique:atributos_tipos_equipos,nombre',
        ]);

        $atributo = AtributoTipoEquipo::create([
            'nombre' => $data['nombre'],
            'estado' => 'activo',
        ]);

        TipoAtributoEspecificacion::firstOrCreate(
            ['idTipo' => $tipo->idTipo, 'idAtributo' => $atributo->idAtributo],
            [
                'unidad_medida' => null,
                'tipo_especificacion' => 'rango_valores',
                'rango_min' => null,
                'rango_max' => null,
                'valores_permitidos' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Atributo creado y asignado al tipo correctamente',
            'atributo' => [
                'idAtributo' => (int) $atributo->idAtributo,
                'nombre' => $atributo->nombre,
            ],
        ]);
    }

    public function crearOpcionParaTipoAtributo(Request $request, int $idTipo, int $idAtributo)
    {
        Tipo::activos()->where('idTipo', $idTipo)->firstOrFail();
        AtributoTipoEquipo::activos()->where('idAtributo', $idAtributo)->firstOrFail();

        $this->mergeCleaned($request, [
            'valor' => $this->cleanString($request->input('valor')),
        ]);

        $data = $request->validate([
            'valor' => 'required|string|max:30',
        ]);

        $valor = $data['valor'];

        $especificacion = TipoAtributoEspecificacion::firstOrCreate(
            ['idTipo' => $idTipo, 'idAtributo' => $idAtributo],
            [
                'unidad_medida' => null,
                'tipo_especificacion' => 'rango_valores',
                'rango_min' => null,
                'rango_max' => null,
                'valores_permitidos' => null,
            ]
        );

        $opciones = $this->extraerOpciones($especificacion->valores_permitidos);
        $yaExiste = collect($opciones)->contains(function ($item) use ($valor) {
            return mb_strtolower(trim((string) $item)) === mb_strtolower($valor);
        });

        if (!$yaExiste) {
            $opciones[] = $valor;
            $especificacion->tipo_especificacion = 'rango_valores';
            $especificacion->rango_min = null;
            $especificacion->rango_max = null;
            $especificacion->valores_permitidos = json_encode(array_values($opciones), JSON_UNESCAPED_UNICODE);
            $especificacion->save();
        }

        return response()->json([
            'success' => true,
            'message' => $yaExiste ? 'La opción ya existe para este atributo' : 'Opción creada correctamente',
            'opciones' => array_values($this->extraerOpciones($especificacion->valores_permitidos)),
        ]);
    }

    private function obtenerConfiguracionesTipo(int $idTipo): array
    {
        return TipoAtributoEspecificacion::where('idTipo', $idTipo)
            ->get([
                'idAtributo',
                'unidad_medida',
                'tipo_especificacion',
                'rango_min',
                'rango_max',
                'valores_permitidos',
            ])
            ->mapWithKeys(function (TipoAtributoEspecificacion $item) {
                return [
                    $item->idAtributo => [
                        'unidad_medida' => $item->unidad_medida,
                        'tipo_especificacion' => $item->tipo_especificacion,
                        'rango_min' => $item->rango_min,
                        'rango_max' => $item->rango_max,
                        'valores_permitidos' => $item->valores_permitidos,
                    ],
                ];
            })
            ->toArray();
    }

    private function serializarOpcionesUnicas(?string $raw): ?string
    {
        $opciones = $this->extraerOpciones($raw);
        return count($opciones) > 0 ? json_encode($opciones, JSON_UNESCAPED_UNICODE) : null;
    }

    private function extraerOpciones(?string $raw): array
    {
        if ($raw === null) {
            return [];
        }

        $raw = trim($raw);
        if ($raw === '') {
            return [];
        }

        $candidatas = [];
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $candidatas = $json;
        } elseif (str_contains($raw, "\n")) {
            $candidatas = preg_split('/\R/u', $raw) ?: [];
        } else {
            $candidatas = array_map('trim', explode(',', $raw));
        }

        $resultado = [];
        $vistos = [];
        foreach ($candidatas as $item) {
            $texto = mb_substr(trim((string) $item), 0, 30);
            if ($texto === '') {
                continue;
            }
            $clave = mb_strtolower($texto);
            if (isset($vistos[$clave])) {
                continue;
            }
            $vistos[$clave] = true;
            $resultado[] = $texto;
        }

        return $resultado;
    }
}

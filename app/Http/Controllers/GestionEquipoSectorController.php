<?php

namespace App\Http\Controllers;

use App\Models\Tipo;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GestionEquipoSectorController extends Controller
{
    public function index()
    {
        $ubicaciones = Ubicacion::activos()
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return view('lugares.gestion-equipos-sector', compact('ubicaciones'));
    }

    public function sectoresPorUbicacion(int $ubicacionId): JsonResponse
    {
        $sectores = DB::table('sectores')
            ->join('sector_ubicacion', 'sector_ubicacion.sector_id', '=', 'sectores.id')
            ->where('sector_ubicacion.ubicacion_id', $ubicacionId)
            ->where('sectores.estado', 'activo')
            ->orderBy('sectores.nombre')
            ->get([
                'sectores.id',
                'sectores.nombre',
            ]);

        return response()->json($sectores);
    }

    public function tiposPorSector(int $ubicacionId, int $sectorId): JsonResponse
    {
        $asociacionExiste = DB::table('sector_ubicacion')
            ->where('ubicacion_id', $ubicacionId)
            ->where('sector_id', $sectorId)
            ->exists();

        if (!$asociacionExiste) {
            return response()->json([
                'success' => false,
                'message' => 'El sector no pertenece a la ubicación seleccionada.',
            ], 404);
        }

        $asignados = DB::table('LUGARSECTORTIPO as lst')
            ->join('tipos', 'tipos.idTipo', '=', 'lst.CODIGOTIPO')
            ->where('lst.CODIGOLUGAR', $ubicacionId)
            ->where('lst.CODIGOSECTOR', $sectorId)
            ->where('tipos.estado', 'activo')
            ->orderBy('tipos.nombreTipo')
            ->get([
                'tipos.idTipo',
                'tipos.nombreTipo',
                'lst.CANTIDAD',
            ]);

        $tiposAsignadosIds = $asignados->pluck('idTipo');

        $disponibles = Tipo::activos()
            ->when($tiposAsignadosIds->isNotEmpty(), function ($query) use ($tiposAsignadosIds) {
                $query->whereNotIn('idTipo', $tiposAsignadosIds);
            })
            ->orderBy('nombreTipo')
            ->get(['idTipo', 'nombreTipo']);

        return response()->json([
            'success' => true,
            'asignados' => $asignados,
            'disponibles' => $disponibles,
        ]);
    }

    public function asignarTipo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ubicacion_id' => 'required|integer|exists:ubicaciones,id',
            'sector_id' => 'required|integer|exists:sectores,id',
            'tipo_id' => 'required|integer|exists:tipos,idTipo',
        ]);

        $asociacionExiste = DB::table('sector_ubicacion')
            ->where('ubicacion_id', $data['ubicacion_id'])
            ->where('sector_id', $data['sector_id'])
            ->exists();

        if (!$asociacionExiste) {
            return response()->json([
                'success' => false,
                'message' => 'El sector no pertenece a la ubicación seleccionada.',
            ], 422);
        }

        $yaExiste = DB::table('LUGARSECTORTIPO')
            ->where('CODIGOLUGAR', $data['ubicacion_id'])
            ->where('CODIGOSECTOR', $data['sector_id'])
            ->where('CODIGOTIPO', $data['tipo_id'])
            ->exists();

        if ($yaExiste) {
            return response()->json([
                'success' => false,
                'message' => 'Ese tipo ya está asignado al sector seleccionado.',
            ], 422);
        }

        DB::table('LUGARSECTORTIPO')->insert([
            'CODIGOLUGAR' => $data['ubicacion_id'],
            'CODIGOSECTOR' => $data['sector_id'],
            'CODIGOTIPO' => $data['tipo_id'],
            'CANTIDAD' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo asignado correctamente.',
        ]);
    }

    public function quitarTipo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ubicacion_id' => 'required|integer|exists:ubicaciones,id',
            'sector_id' => 'required|integer|exists:sectores,id',
            'tipo_id' => 'required|integer|exists:tipos,idTipo',
        ]);

        DB::table('LUGARSECTORTIPO')
            ->where('CODIGOLUGAR', $data['ubicacion_id'])
            ->where('CODIGOSECTOR', $data['sector_id'])
            ->where('CODIGOTIPO', $data['tipo_id'])
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo quitado del sector.',
        ]);
    }

    public function actualizarCantidad(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ubicacion_id' => 'required|integer|exists:ubicaciones,id',
            'sector_id' => 'required|integer|exists:sectores,id',
            'tipo_id' => 'required|integer|exists:tipos,idTipo',
            'cantidad' => 'nullable|integer|min:1',
        ]);

        $afectadas = DB::table('LUGARSECTORTIPO')
            ->where('CODIGOLUGAR', $data['ubicacion_id'])
            ->where('CODIGOSECTOR', $data['sector_id'])
            ->where('CODIGOTIPO', $data['tipo_id'])
            ->update([
                'CANTIDAD' => $data['cantidad'],
            ]);

        if ($afectadas === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró la relación para actualizar la cantidad.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cantidad actualizada.',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SectorController extends Controller
{
    public function porUbicacion($id)
    {
        $sectores = Sector::whereHas('ubicaciones', function ($query) use ($id) {
                $query->where('ubicaciones.id', $id);
            })
            ->orderBy('nombre')
            ->get();

        return response()->json($sectores);
    }

    public function paraVinculacion($id)
    {
        $todosSectores = Sector::with('ubicaciones')->orderBy('nombre')->get();

        $sectores = $todosSectores->map(function ($sector) use ($id) {
                $sector->asociado = $sector->ubicaciones->contains('id', (int) $id);
                return $sector;
            });
        
        return response()->json($sectores);
    }

    public function index(Request $request)
    {
        $query = Sector::with('ubicaciones')->activos();

        // Buscador solo por nombre
        if ($search = $request->input('search')) {
            $query->where('nombre', 'like', '%' . $search . '%');
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        // Validar columnas permitidas
        $allowedColumns = ['id', 'nombre', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        // Validar orden
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $sectores = $query->get();
        $ubicaciones = Ubicacion::activos()->orderBy('nombre')->get();

        return view('sectores.index', compact('sectores', 'ubicaciones'));
    }

    public function inactivos(Request $request)
    {
        $query = Sector::with('ubicaciones')->where('estado', 'baja');

        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['id', 'nombre', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';
        
        $query->orderBy($column, $order);

        $sectores = $query->get();
        $ubicaciones = Ubicacion::orderBy('nombre')->get();

        return view('sectores.index', compact('sectores', 'ubicaciones'));
    }


    public function crear(Request $request)
    {
        try {
            $data = $request->validate([
                'nombre' => 'required|string|max:40'
            ]);

            $nombreLimpio = trim($data['nombre']);

            // Check DB constraint real (nombre + ubicacion_id?)
            if (Sector::where('estado', 'activo')
                ->whereRaw('LOWER(TRIM(nombre)) = ?', [strtolower($nombreLimpio)])
                ->exists()) {

                $validator = Validator::make([], []);
                $validator->errors()->add('nombre', 'El sector ya existe');

                throw new \Illuminate\Validation\ValidationException($validator);
            }

            $sector = Sector::crear(['nombre' => $nombreLimpio, 'estado' => 'activo']);

if ($request->filled('ubicacion_id')) {
    $sector->ubicaciones()->attach((int) $request->ubicacion_id);
}
$redirect = $request->input('redirect_to', route('sectores.index'));

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sector creado correctamente',
                    'id' => $sector->id,
                    'nombre' => $sector->nombre
                ]);
            }

            return redirect($redirect)->with('success', 'Sector creado correctamente');
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


    public function actualizar(Request $request, $id)
    {
        try {
            $sector = Sector::activos()->findOrFail($id);

            $nombreLimpio = trim($request->input('nombre', ''));

            $data = $request->validate([
                'nombre'       => 'required|string|max:40',
            ]);

            // Validar unique nombre (excluyendo propio ID)
            if (Sector::where('estado', 'activo')
                ->where('id', '!=', $id)
                ->whereRaw('LOWER(TRIM(nombre)) = ?', [strtolower($nombreLimpio)])
                ->exists()) {

                $validator = Validator::make([], []);
                $validator->errors()->add('nombre', 'Ya existe otro sector con ese nombre');

                throw new \Illuminate\Validation\ValidationException($validator);
            }

            $sector->actualizar($data);

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sector actualizado correctamente'
                ]);
            }

            return redirect()->back()->with('success', 'Sector actualizado correctamente');
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
                    'message' => $e->getMessage()
                ], 500);
            }
            throw $e;
        }
    }

    public function ubicacionesParaSector($id)
    {
        $sector = Sector::with('ubicaciones')->findOrFail($id);
        $todasUbicaciones = Ubicacion::orderBy('nombre')->get();

        $ubicaciones = $todasUbicaciones->map(function ($ubicacion) use ($sector) {
            $ubicacion->asociado = $sector->ubicaciones->contains('id', $ubicacion->id);
            return $ubicacion;
        });

        return response()->json($ubicaciones);
    }

    public function syncUbicaciones(Request $request, $id)
    {
        $sector = Sector::findOrFail($id);
        $ubicacionIds = $request->input('ubicacion_ids', []);

        // Validar que no hay equipos activos si se van a desvincular ubicaciones
        $ubicacionesActuales = $sector->ubicaciones->pluck('id');
        $ubicacionesDesvincular = array_diff($ubicacionesActuales->toArray(), $ubicacionIds);

        if (!empty($ubicacionesDesvincular) && $sector->equipos()->where('estado', 'activo')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede desvincular ubicaciones porque el sector tiene equipos activos.',
            ], 409);
        }

        $sector->ubicaciones()->sync($ubicacionIds);

        return response()->json([
            'success' => true,
            'message' => 'Ubicaciones actualizadas correctamente.'
        ]);
    }

    /** asociarSector: asocia un sector existente a una ubicación */
    public function asociar(Request $request)
    {
        $data = $request->validate([
            'sector_id'    => 'required|exists:sectores,id',
            'ubicacion_id' => 'required|exists:ubicaciones,id',
            'asociado'     => 'nullable|boolean',
        ]);

        $sector = Sector::findOrFail($data['sector_id']);
        $asociado = array_key_exists('asociado', $data) ? (bool) $data['asociado'] : true;

        if (!$asociado && $sector->equipos()->where('estado', 'activo')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede desvincular el sector porque tiene equipos activos asociados.',
            ], 409);
        }

        if ($asociado) {
            $sector->ubicaciones()->syncWithoutDetaching([$data['ubicacion_id']]);
        } else {
            $sector->ubicaciones()->detach($data['ubicacion_id']);
        }

        return response()->json([
            'success' => true,
            'message' => $asociado ? 'Sector asociado correctamente' : 'Sector desvinculado correctamente',
        ]);
    }

    public function baja(Request $request, $id)
    {
        $sector = Sector::activos()->findOrFail($id);
        try {
            $sector->delete();
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sector eliminado correctamente'
                ]);
            }
            return redirect()->back()->with('success', 'Sector eliminado correctamente');
        } catch (\Throwable $e) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el sector porque tiene registros asociados'
                ],409);
            }
            return redirect()->back()
                ->with('error', 'No se puede eliminar el sector porque tiene registros asociados');
        }
    }

    public function alta($id)
    {
        $sector = Sector::where('estado', 'baja')->findOrFail($id);
        $sector->darDeAlta();

        return redirect()->back()->with('success', 'Sector activado correctamente');
    }
}

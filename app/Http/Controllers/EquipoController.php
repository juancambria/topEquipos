<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Marca;
use App\Models\Tipo;
use App\Models\Modelo;
use App\Models\Proveedor;
use App\Models\Ubicacion;
use App\Models\Sector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class EquipoController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipo::where('equipos.estado', 'activo')
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector']); 

        if ($request->filled('search')) {
            if ($request->filled('searchColumn')) {
                $column = $request->searchColumn;
                $searchTerm = '%' . $request->search . '%';
                switch ($column) {
                    case 'id':
                        $query->where('equipos.id', 'like', $searchTerm);
                        break;
                    case 'serie':
                        $query->where('equipos.serie', 'like', $searchTerm);
                        break;
                    case 'tipo':
                        $query->whereHas('tipo', function($q) use ($searchTerm) {
                            $q->where('nombreTipo', 'like', $searchTerm);
                        });
                        break;
                    case 'marca':
                        $query->whereHas('marca', function($q) use ($searchTerm) {
                            $q->where('marca', 'like', $searchTerm);
                        });
                        break;
                    case 'modelo':
                        $query->whereHas('modelo', function($q) use ($searchTerm) {
                            $q->where('modelo', 'like', $searchTerm);
                        });
                        break;
                    case 'proveedor':
                        $query->whereHas('proveedor', function($q) use ($searchTerm) {
                            $q->where('proveedor', 'like', $searchTerm);
                        });
                        break;
                    case 'numeroFactura':
                        $query->where('equipos.numeroFactura', 'like', $searchTerm);
                        break;
                    case 'ubicacion':
                        $query->whereHas('ubicacion', function($q) use ($searchTerm) {
                            $q->where('nombre', 'like', $searchTerm);
                        });
                        break;
                    case 'sector':
                        $query->whereHas('sector', function($q) use ($searchTerm) {
                            $q->where('nombre', 'like', $searchTerm);
                        });
                        break;
                    default:
                        // Búsqueda general si no se especifica columna válida
                        $query->where(function($q) use ($request) {
                            $q->where('equipos.serie', 'like', '%' . $request->search . '%')
                              ->orWhere('equipos.observacion', 'like', '%' . $request->search . '%')
                              ->orWhereHas('marca', function($sub) use ($request) { $sub->where('marca', 'like', '%' . $request->search . '%'); })
                              ->orWhereHas('modelo', function($sub) use ($request) { $sub->where('modelo', 'like', '%' . $request->search . '%'); })
                              ->orWhereHas('proveedor', function($sub) use ($request) { $sub->where('proveedor', 'like', '%' . $request->search . '%'); });
                        });
                        break;
                }
            } else {
                $query->where(function($q) use ($request) {
                    $q->where('equipos.serie', 'like', '%' . $request->search . '%')
                      ->orWhere('equipos.observacion', 'like', '%' . $request->search . '%')
                      ->orWhereHas('marca', function($sub) use ($request) { $sub->where('marca', 'like', '%' . $request->search . '%'); })
                      ->orWhereHas('modelo', function($sub) use ($request) { $sub->where('modelo', 'like', '%' . $request->search . '%'); })
                      ->orWhereHas('proveedor', function($sub) use ($request) { $sub->where('proveedor', 'like', '%' . $request->search . '%'); });
                });
            }
        }

        // Ordenamiento por columna
        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['id', 'serie', 'observacion', 'estado', 'marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        // Ordenamiento según la columna
        switch ($column) {
            case 'marca':
                $query->join('marcas', 'equipos.idMarca', '=', 'marcas.idMarca')
                      ->orderBy('marcas.marca', $order)
                      ->select('equipos.*');
                break;
            case 'tipo':
                $query->join('tipos', 'equipos.idTipo', '=', 'tipos.idTipo')
                      ->orderBy('tipos.nombreTipo', $order)
                      ->select('equipos.*');
                break;
            case 'modelo':
                $query->join('modelos', 'equipos.idModelo', '=', 'modelos.idModelo')
                      ->orderBy('modelos.modelo', $order)
                      ->select('equipos.*');
                break;
            case 'proveedor':
                $query->leftJoin('proveedores', 'equipos.idProveedor', '=', 'proveedores.idProveedor')
                      ->orderBy('proveedores.proveedor', $order)
                      ->select('equipos.*');
                break;
            case 'ubicacion':
                $query->join('ubicaciones', 'equipos.ubicacion_id', '=', 'ubicaciones.id')
                      ->orderBy('ubicaciones.nombre', $order)
                      ->select('equipos.*');
                break;
            case 'sector':
                $query->join('sectores', 'equipos.sector_id', '=', 'sectores.id')
                      ->orderBy('sectores.nombre', $order)
                      ->select('equipos.*');
                break;
            default:
                $query->orderBy($column, $order);
                break;
        }

        $equipos = $query->get();

        $marcas      = Marca::activos()->orderBy('marca')->get();
        $tipos       = Tipo::activos()->orderBy('nombreTipo')->get();
        $modelos     = Modelo::activos()->orderBy('modelo')->get();
        $proveedores = Proveedor::activos()->orderBy('proveedor')->get();
        $ubicaciones = Ubicacion::activos()->orderBy('nombre')->get();
        $sectores    = Sector::activos()->orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'proveedores', 'ubicaciones', 'sectores'
        ));
    }

    public function inactivos(Request $request)
    {
        $query = Equipo::where('equipos.estado', 'baja')
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector']);

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('equipos.serie', 'like', '%' . $request->search . '%')
                  ->orWhere('equipos.observacion', 'like', '%' . $request->search . '%')
                  ->orWhereHas('marca', function($sub) use ($request) { $sub->where('marca', 'like', '%' . $request->search . '%'); })
                  ->orWhereHas('modelo', function($sub) use ($request) { $sub->where('modelo', 'like', '%' . $request->search . '%'); })
                  ->orWhereHas('proveedor', function($sub) use ($request) { $sub->where('proveedor', 'like', '%' . $request->search . '%'); });
            });
        }

        $column = $request->input('column', 'id');
        $order = $request->input('order', 'asc');
        
        $allowedColumns = ['id', 'serie', 'observacion', 'estado', 'marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'created_at'];
        if (!in_array($column, $allowedColumns)) {
            $column = 'id';
        }
        
        $order = in_array($order, ['asc', 'desc']) ? $order : 'asc';

        switch ($column) {
            case 'marca':
                $query->join('marcas', 'equipos.idMarca', '=', 'marcas.idMarca')
                      ->orderBy('marcas.marca', $order)
                      ->select('equipos.*');
                break;
            case 'tipo':
                $query->join('tipos', 'equipos.idTipo', '=', 'tipos.idTipo')
                      ->orderBy('tipos.nombreTipo', $order)
                      ->select('equipos.*');
                break;
            case 'modelo':
                $query->join('modelos', 'equipos.idModelo', '=', 'modelos.idModelo')
                      ->orderBy('modelos.modelo', $order)
                      ->select('equipos.*');
                break;
            case 'proveedor':
                $query->leftJoin('proveedores', 'equipos.idProveedor', '=', 'proveedores.idProveedor')
                      ->orderBy('proveedores.proveedor', $order)
                      ->select('equipos.*');
                break;
            case 'ubicacion':
                $query->join('ubicaciones', 'equipos.ubicacion_id', '=', 'ubicaciones.id')
                      ->orderBy('ubicaciones.nombre', $order)
                      ->select('equipos.*');
                break;
            case 'sector':
                $query->join('sectores', 'equipos.sector_id', '=', 'sectores.id')
                      ->orderBy('sectores.nombre', $order)
                      ->select('equipos.*');
                break;
            default:
                $query->orderBy($column, $order);
                break;
        }

        $equipos = $query->get();

        $marcas      = Marca::orderBy('marca')->get();
        $tipos       = Tipo::orderBy('nombreTipo')->get();
        $modelos     = Modelo::orderBy('modelo')->get();
        $proveedores = Proveedor::orderBy('proveedor')->get();
        $ubicaciones = Ubicacion::orderBy('nombre')->get();
        $sectores    = Sector::orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'proveedores', 'ubicaciones', 'sectores'
        ));
    }

    public function crear(Request $request)
    {
        $this->mergeCleaned($request, [
            'serie' => $this->cleanString($request->input('serie')),
            'observacion' => $this->cleanTextarea($request->input('observacion')),
            'idProveedor' => $request->input('idProveedor') ?: null,
            'numeroFactura' => $this->cleanString($request->input('numeroFactura')),
        ]);

        $data = $request->validate([
            'serie'         => 'required|string|max:30|unique:equipos,serie',
            'observacion'   => 'nullable|string|max:1000',
            'idMarca'       => 'required|exists:marcas,idMarca',
            'idTipo'        => 'required|exists:tipos,idTipo',
            'idModelo'      => 'required|exists:modelos,idModelo',
            'idProveedor'   => 'nullable|exists:proveedores,idProveedor',
            'numeroFactura' => 'nullable|string|max:50',
            'ubicacion_id'  => 'required|exists:ubicaciones,id',
            'sector_id'     => 'required|exists:sectores,id',
            'imagen'        => 'nullable|image|mimes:jpeg,png,gif|max:2048',
            'vtoGarantia'   => 'nullable|date',
            'precio'        => 'nullable|numeric|min:0',
        ]);

        $data['informa_al_seguro'] = $this->normalizarInformaSeguroRequest($request);
        if (array_key_exists('vtoGarantia', $data) && ($data['vtoGarantia'] === '' || $data['vtoGarantia'] === null)) {
            $data['vtoGarantia'] = null;
        }
        
        $this->validarRelacionEquipo($data);

        // Manejar la imagen
        $imagenPath = null;
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $imagen = $request->file('imagen');
            $nombreArchivo = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $imagen->getClientOriginalName());
            $imagen->storeAs('equipos', $nombreArchivo, 'public');
            $imagenPath = 'equipos/' . $nombreArchivo;
            $data['imagen'] = $imagenPath;
        }

        // Eliminar campos que no existen en la tabla
        unset($data['imagen_actual']);

        $equipo = Equipo::crear($data);

        // Asegurar que numeroFactura sea asignado correctamente
        if (empty($equipo->numeroFactura)) {
            // Si viene numeroFactura en data (desde form), usarlo
            if (!empty($data['numeroFactura'])) {
                $equipo->numeroFactura = $data['numeroFactura'];
            }
            // Si vino idFactura, buscar su número
            elseif ($request->filled('idFactura')) {
                $factura = \App\Models\Factura::find($request->input('idFactura'));
                if ($factura) {
                    $equipo->numeroFactura = $factura->numero;
                }
            }
            // Si es alta desde equipos (sin factura), usar id
            else {
                $equipo->numeroFactura = (string) $equipo->id;
            }
            $equipo->save();
        }

        $esSolicitudFactura = $request->input('origen') === 'factura';

        if ($esSolicitudFactura) {
            return response()->json([
                'success' => true,
                'id' => $equipo->id,
                'message' => 'Equipo creado correctamente',
            ]);
        }

        if ($request->has('window')) {
            return redirect()->route('equipos.index', ['window' => 1])
                ->with('success', 'Equipo creado correctamente');
        }

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo creado correctamente');
    }

    public function serieExiste(Request $request)
    {
        $serie = $this->cleanString($request->query('serie', ''));
        if (trim($serie) === '') {
            return response()->json(['exists' => false]);
        }

        $exists = Equipo::where('serie', $serie)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function actualizar(Request $request, $id)
    {
        $equipo = Equipo::activos()->findOrFail($id);
        $this->mergeCleaned($request, [
            'serie' => $this->cleanString($request->input('serie')),
            'observacion' => $this->cleanTextarea($request->input('observacion')),
            'idProveedor' => $request->input('idProveedor') ?: null,
            'numeroFactura' => $this->cleanString($request->input('numeroFactura')),
        ]);

        $data = $request->validate([
            'serie'         => 'required|string|max:30|unique:equipos,serie,' . $id . ',id',
            'observacion'   => 'nullable|string|max:1000',
            'idMarca'       => 'required|exists:marcas,idMarca',
            'idTipo'        => 'required|exists:tipos,idTipo',
            'idModelo'      => 'required|exists:modelos,idModelo',
            'idProveedor'   => 'nullable|exists:proveedores,idProveedor',
            'numeroFactura' => 'nullable|string|max:50',
            'ubicacion_id'  => 'required|exists:ubicaciones,id',
            'sector_id'     => 'required|exists:sectores,id',
            'imagen'        => 'nullable|image|mimes:jpeg,png,gif|max:2048',
            'vtoGarantia'   => 'nullable|date',
            'precio'        => 'nullable|numeric|min:0',
        ]);

        $data['informa_al_seguro'] = $this->normalizarInformaSeguroRequest($request);
        if (array_key_exists('vtoGarantia', $data) && ($data['vtoGarantia'] === '' || $data['vtoGarantia'] === null)) {
            $data['vtoGarantia'] = null;
        }

        $this->validarRelacionEquipo($data);

        // Manejar la imagen
        $imagenPath = null;
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            // Eliminar imagen anterior si existe
            if ($equipo->imagen && Storage::disk('public')->exists($equipo->imagen)) {
                Storage::disk('public')->delete($equipo->imagen);
            }
            
            // Guardar nueva imagen
            $imagen = $request->file('imagen');
            $nombreArchivo = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $imagen->getClientOriginalName());
            $imagen->storeAs('equipos', $nombreArchivo, 'public');
            $data['imagen'] = 'equipos/' . $nombreArchivo;
        } elseif ($request->input('eliminar_imagen') === '1') {
            // Eliminar imagen si se marcó la opción
            if ($equipo->imagen && Storage::disk('public')->exists($equipo->imagen)) {
                Storage::disk('public')->delete($equipo->imagen);
            }
            $data['imagen'] = null;
        }
        // Si no se envía nueva imagen ni se elimina, mantener la actual (no incluir en $data)

        // Eliminar campos que no existen en la tabla
        unset($data['imagen_actual']);
        unset($data['eliminar_imagen']);

        // Preservar numeroFactura si no viene en los datos o si está vacío
        if (empty($data['numeroFactura'])) {
            $data['numeroFactura'] = $equipo->numeroFactura;
        }

        $equipo->actualizar($data);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Equipo actualizado correctamente',
            ]);
        }

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo actualizado correctamente');
    }

    public function baja(Request $request, $id)
    {
        $request->validate([
            'observacion' => 'required|string|max:1000',
        ]);

        $equipo = Equipo::activos()->findOrFail($id);
        $equipo->baja($request->observacion);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo dado de baja');
    }

    public function alta($id)
    {
        $equipo = Equipo::where('estado', 'baja')->findOrFail($id);
        $equipo->darDeAlta();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo activado correctamente');
    }

    public function eliminarLote(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|min:1',
        ]);

        $ids = collect($data['ids'])->map(fn ($id) => (int) $id)->unique()->values();
        if ($ids->isEmpty()) {
            return response()->json([
                'success' => true,
                'deleted' => 0,
                'deleted_ids' => [],
            ]);
        }

        DB::beginTransaction();
        try {
            $equipos = Equipo::whereIn('id', $ids)->get()->keyBy('id');
            $faltantes = $ids->diff($equipos->keys())->values();
            if ($faltantes->isNotEmpty()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Algunos equipos ya no existen o no se pudieron ubicar.',
                    'missing_ids' => $faltantes->all(),
                ], 409);
            }

            foreach ($equipos as $equipo) {
                if ($equipo->imagen && Storage::disk('public')->exists($equipo->imagen)) {
                    Storage::disk('public')->delete($equipo->imagen);
                }
                $equipo->delete();
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'deleted' => $ids->count(),
                'deleted_ids' => $ids->all(),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'No se pudieron eliminar los equipos asociados.',
            ], 500);
        }
    }

    /**
     * Checkbox + input hidden pueden llegar duplicados; sin hidden, el campo ausente implica false.
     */
    protected function normalizarInformaSeguroRequest(Request $request): bool
    {
        $raw = $request->input('informa_al_seguro', '0');
        if (is_array($raw)) {
            $raw = (string) collect($raw)->last();
        }

        return $raw === '1' || $raw === 1 || $raw === true;
    }

    protected function validarRelacionEquipo(array $data): void
    {
        $marcaValida = Marca::where('idMarca', $data['idMarca'])
            ->whereHas('tipos', function ($query) use ($data) {
                $query->where('tipos.idTipo', $data['idTipo']);
            })
            ->exists();

        if (! $marcaValida) {
            throw ValidationException::withMessages([
                'idMarca' => 'La marca seleccionada no corresponde al tipo elegido.',
            ]);
        }

        $modeloValido = Modelo::where('idModelo', $data['idModelo'])
            ->where('idMarca', $data['idMarca'])
            ->where('idTipo', $data['idTipo'])
            ->exists();

        if (! $modeloValido) {
            throw ValidationException::withMessages([
                'idModelo' => 'El modelo seleccionado no corresponde a la marca y tipo elegidos.',
            ]);
        }
    }
}

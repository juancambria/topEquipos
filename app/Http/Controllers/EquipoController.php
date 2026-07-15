<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Factura;
use App\Models\FacturaDetalle;
use App\Models\Marca;
use App\Models\Tipo;
use App\Models\Modelo;
use App\Models\Proveedor;
use App\Models\Ubicacion;
use App\Models\Sector;
use App\Models\TipoAtributoEspecificacion;
use App\Models\EquipoAtributoValor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class EquipoController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipo::where('equipos.estado', 'activo')
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'atributoValores.atributo']);

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
        $this->anexarDatosFacturaAEquipos($equipos);

        $marcas      = Marca::activos()->orderBy('marca')->get();
        $tipos       = Tipo::activos()->orderBy('nombreTipo')->get();
        $modelos     = Modelo::activos()->orderBy('modelo')->get();
        $ubicaciones = Ubicacion::activos()->orderBy('codigo')->orderBy('nombre')->get();
        $sectores    = Sector::activos()->orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'ubicaciones', 'sectores'
        ));
    }

    public function inactivos(Request $request)
    {
        $query = Equipo::where('equipos.estado', 'baja')
            ->with(['marca', 'tipo', 'modelo', 'proveedor', 'ubicacion', 'sector', 'atributoValores.atributo']);

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
        $this->anexarDatosFacturaAEquipos($equipos);

        $marcas      = Marca::orderBy('marca')->get();
        $tipos       = Tipo::orderBy('nombreTipo')->get();
        $modelos     = Modelo::orderBy('modelo')->get();
        $ubicaciones = Ubicacion::orderBy('codigo')->orderBy('nombre')->get();
        $sectores    = Sector::orderBy('nombre')->get();

        return view('equipos.index', compact(
            'equipos', 'marcas', 'tipos', 'modelos', 'ubicaciones', 'sectores'
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
            'precio'        => 'required|numeric|gt:0',
            'idDetalleFactura' => 'nullable|integer|exists:factura_detalles,idFacturaDet',
        ], [
            'precio.required' => 'Debe ingresar un precio para el equipo.',
            'precio.gt' => 'El precio del equipo debe ser mayor a 0.',
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
        $this->sincronizarAtributosEquipo($equipo, (int) $data['idTipo'], (array) $request->input('atributo_valores', []));

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
        if ($esSolicitudFactura && $request->filled('idDetalleFactura')) {
            $detalle = FacturaDetalle::query()
                ->where('idFacturaDet', (int) $request->input('idDetalleFactura'))
                ->first();
            if ($detalle) {
                $cantidad = (float) ($detalle->cantidad ?? 0);
                $precioRenglon = (float) ($detalle->precioUnitario ?? 0);
                $data['precio'] = $cantidad > 0 ? ($precioRenglon / $cantidad) : 0;
            }
        }

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
            'serie'         => $this->cleanString($request->input('serie')),
            'observacion'   => $this->cleanTextarea($request->input('observacion')),
            'numeroFactura' => $this->cleanString($request->input('numeroFactura')),
        ]);

        $data = $request->validate([
            'serie'         => 'required|string|max:30|unique:equipos,serie,' . $id . ',id',
            'observacion'   => 'nullable|string|max:1000',
            'idMarca'       => 'required|exists:marcas,idMarca',
            'idTipo'        => 'required|exists:tipos,idTipo',
            'idModelo'      => 'required|exists:modelos,idModelo',
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
        $this->sincronizarAtributosEquipo($equipo, (int) $data['idTipo'], (array) $request->input('atributo_valores', []));

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

    protected function anexarDatosFacturaAEquipos($equipos): void
    {
        $numerosFactura = $equipos->pluck('numeroFactura')->filter()->unique()->values();
        if ($numerosFactura->isEmpty()) {
            return;
        }

        $facturasPorNumero = Factura::query()
            ->with('proveedor:idProveedor,proveedor')
            ->whereIn('numero', $numerosFactura)
            ->get()
            ->keyBy('numero');

        $idsFactura = $facturasPorNumero->pluck('idFactura')->filter()->unique()->values();
        $detallesPorFacturaConcepto = FacturaDetalle::query()
            ->whereIn('idFactura', $idsFactura)
            ->where('operacion', 'compra')
            ->where('de', 'Equipo')
            ->get(['idFactura', 'concepto', 'cantidad', 'precioUnitario'])
            ->groupBy(function ($detalle) {
                $concepto = trim((string) ($detalle->concepto ?? ''));
                return (string) $detalle->idFactura . '|' . mb_strtolower($concepto);
            });

        $equipos->each(function ($equipo) use ($facturasPorNumero, $detallesPorFacturaConcepto) {
            $factura = $facturasPorNumero->get($equipo->numeroFactura);
            $equipo->factura_total = $factura?->total;
            $equipo->factura_fecha = $factura?->fecha?->format('Y-m-d');
            $equipo->factura_proveedor_id = $factura?->idProveedor;
            $equipo->factura_proveedor_nombre = $factura?->proveedor?->proveedor;

            $equipo->factura_precio_equipo = null;
            if (! $factura) {
                return;
            }

            $prefijo = 'Creado desde factura - ';
            $obs = trim((string) ($equipo->observacion ?? ''));
            if (!str_starts_with($obs, $prefijo)) {
                return;
            }

            $concepto = trim(substr($obs, strlen($prefijo)));
            if ($concepto === '') {
                return;
            }

            $clave = (string) $factura->idFactura . '|' . mb_strtolower($concepto);
            $detalle = $detallesPorFacturaConcepto->get($clave)?->first();
            if (! $detalle) {
                return;
            }

            $cantidad = (float) ($detalle->cantidad ?? 0);
            $precioRenglon = (float) ($detalle->precioUnitario ?? 0);
            $equipo->factura_precio_equipo = $cantidad > 0 ? ($precioRenglon / $cantidad) : 0;
        });
    }

    public function atributosPorTipo(int $idTipo)
    {
        $tipo = Tipo::activos()->where('idTipo', $idTipo)->firstOrFail();

        $atributos = TipoAtributoEspecificacion::query()
            ->with('atributo:idAtributo,nombre')
            ->where('idTipo', $tipo->idTipo)
            ->orderBy('idAtributo')
            ->get()
            ->map(function (TipoAtributoEspecificacion $esp) {
                $opciones = $this->extraerOpciones($esp->valores_permitidos);
                return [
                    'idAtributo' => (int) $esp->idAtributo,
                    'nombre' => $esp->atributo?->nombre ?? ('Atributo #' . $esp->idAtributo),
                    'unidad_medida' => $esp->unidad_medida,
                    'tipo_especificacion' => 'rango_valores',
                    'opciones' => $opciones,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'tipo' => [
                'idTipo' => $tipo->idTipo,
                'nombreTipo' => $tipo->nombreTipo,
            ],
            'atributos' => $atributos,
        ]);
    }

    protected function sincronizarAtributosEquipo(Equipo $equipo, int $idTipo, array $valores): void
    {
        $definidos = TipoAtributoEspecificacion::query()
            ->where('idTipo', $idTipo)
            ->get(['idAtributo', 'valores_permitidos'])
            ->keyBy('idAtributo');

        if ($definidos->isEmpty()) {
            EquipoAtributoValor::where('equipo_id', $equipo->id)->delete();
            return;
        }

        $permitidosPorAtributo = [];
        foreach ($definidos as $idAtributo => $def) {
            $permitidosPorAtributo[(int) $idAtributo] = $this->extraerOpciones($def->valores_permitidos);
        }

        $aGuardar = [];
        foreach ($valores as $idAtributoRaw => $valorRaw) {
            $idAtributo = (int) $idAtributoRaw;
            if (!isset($permitidosPorAtributo[$idAtributo])) {
                continue;
            }

            $valor = $this->cleanString(is_scalar($valorRaw) ? (string) $valorRaw : null);
            if ($valor === null) {
                continue;
            }

            $permitidos = $permitidosPorAtributo[$idAtributo];
            if (!empty($permitidos)) {
                $esValido = collect($permitidos)->contains(function ($op) use ($valor) {
                    return mb_strtolower(trim((string) $op)) === mb_strtolower($valor);
                });
                if (!$esValido) {
                    continue;
                }
            }

            $aGuardar[$idAtributo] = $valor;
        }

        DB::transaction(function () use ($equipo, $aGuardar) {
            $ids = array_keys($aGuardar);
            if (empty($ids)) {
                EquipoAtributoValor::where('equipo_id', $equipo->id)->delete();
                return;
            }

            EquipoAtributoValor::where('equipo_id', $equipo->id)
                ->whereNotIn('idAtributo', $ids)
                ->delete();

            foreach ($aGuardar as $idAtributo => $valor) {
                EquipoAtributoValor::updateOrCreate(
                    ['equipo_id' => $equipo->id, 'idAtributo' => $idAtributo],
                    ['valor' => $valor]
                );
            }
        });
    }

    protected function extraerOpciones(?string $raw): array
    {
        if ($raw === null || trim($raw) === '') {
            return [];
        }

        $json = json_decode($raw, true);
        if (is_array($json)) {
            return collect($json)
                ->map(fn ($item) => trim((string) $item))
                ->filter(fn ($item) => $item !== '')
                ->values()
                ->all();
        }

        if (str_contains($raw, "\n")) {
            return collect(preg_split('/\R/u', $raw) ?: [])
                ->map(fn ($item) => trim((string) $item))
                ->filter(fn ($item) => $item !== '')
                ->values()
                ->all();
        }

        return collect(explode(',', $raw))
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();
    }
}

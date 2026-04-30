<?php

namespace App\Http\Controllers;

use App\Models\Historial;
use App\Models\Equipo;
use Illuminate\Http\Request;

class HistorialController extends Controller
{
    public function index(Request $request)
    {
        $query = Historial::with('equipo')->orderBy('created_at', 'desc');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('accion', 'like', '%' . $buscar . '%')
                  ->orWhere('detalle', 'like', '%' . $buscar . '%')
                  ->orWhereHas('equipo', function ($qe) use ($buscar) {
                      $qe->where('serie', 'like', '%' . $buscar . '%');
                  });
            });
        }

        $historial = $query->paginate(30)->withQueryString();

        return view('historial.index', compact('historial'));
    }

    public function porEquipo($equipoId, Request $request)
    {
        $equipo = Equipo::findOrFail($equipoId);
        
        $query = Historial::where('equipo_id', $equipoId)->orderBy('created_at', 'desc');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('accion', 'like', '%' . $buscar . '%')
                  ->orWhere('detalle', 'like', '%' . $buscar . '%');
            });
        }

        $historial = $query->paginate(20, ['*'], 'pagina', $request->get('pagina', 1))->withQueryString();

        return view('historial.equipo', compact('historial', 'equipo'));
    }

    public function porEquipoInactivos($equipoId, Request $request)
    {
        $equipo = Equipo::withTrashed()->findOrFail($equipoId);
        
        $query = Historial::where('equipo_id', $equipoId)->orderBy('created_at', 'desc');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('accion', 'like', '%' . $buscar . '%')
                  ->orWhere('detalle', 'like', '%' . $buscar . '%');
            });
        }

        $historial = $query->paginate(20, ['*'], 'pagina', $request->get('pagina', 1))->withQueryString();

        return view('historial.equipo', compact('historial', 'equipo'));
    }
}


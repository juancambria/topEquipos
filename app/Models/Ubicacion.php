<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ubicacion extends Model
{
    protected $table      = 'ubicaciones';
    protected $primaryKey = 'id';
    public    $timestamps = false;
    protected $fillable   = ['id', 'nombre', 'codigo', 'ciudad', 'provincia', 'telefono', 'direccion', 'codigo_postal', 'estado'];

    protected $attributes = [
        'estado' => 'activo',
    ];

    /** Relación: una ubicación puede tener muchos sectores */
    public function sectores(): BelongsToMany
    {
        return $this->belongsToMany(Sector::class, 'sector_ubicacion', 'ubicacion_id', 'sector_id');
    }

    /** Scope: solo activos */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /** Crear ubicación con estado activo y opcionalmente ID manual */
    public static function crear(array $data): self
    {
        $ubicacion = new self();
        $ubicacion->nombre = $data['nombre'];
        $ubicacion->codigo = $data['codigo'] ?? null;
        $ubicacion->ciudad = $data['ciudad'] ?? null;
        $ubicacion->provincia = $data['provincia'] ?? null;
        $ubicacion->telefono = $data['telefono'] ?? null;
        $ubicacion->direccion = $data['direccion'] ?? null;
        $ubicacion->codigo_postal = $data['codigo_postal'] ?? null;
        $ubicacion->estado = 'activo';

        // Si se proporciona un ID manual, usarlo
        if (isset($data['id']) && $data['id']) {
            $ubicacion->id = $data['id'];
        }

        $ubicacion->save();
        return $ubicacion;
    }

    /** Actualizar nombre */
    public function actualizar(array $data): bool
    {
        return $this->fill([
            'nombre' => $data['nombre'],
            'codigo' => $data['codigo'] ?? null,
            'ciudad' => $data['ciudad'] ?? null,
            'provincia' => $data['provincia'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'codigo_postal' => $data['codigo_postal'] ?? null,
        ])->save();
    }

/** Dar de baja: solo si no tiene sectores con equipos activos */
    public function darDeBaja(?string $observacion = null): bool
    {
        foreach ($this->sectores as $sector) {
            if ($sector->equipos()->where('estado', 'activo')->exists()) {
                return false;
            }
        }

        $this->estado = 'baja';
        $guardado = $this->save();
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Ubicación dada de baja', $observacion);
        }
        
        return $guardado;
    }

    /** Dar de alta */
    public function darDeAlta(): bool
    {
        $this->estado = 'activo';
        $guardado = $this->save();
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Ubicación dada de alta');
        }
        
        return $guardado;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sector extends Model
{
    protected $table      = 'sectores';
    protected $primaryKey = 'id';
    public    $timestamps = false;
    protected $fillable   = ['nombre', 'ubicacion_id', 'estado'];

    protected $attributes = [
        'estado' => 'activo',
    ];

    /** Relación: un sector pertenece a una ubicación */
    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }

    /** Scope: solo activos */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /** Crear sector con estado activo */
    public static function crear(array $data): self
    {
        return static::create([
            'nombre'       => $data['nombre'],
            'ubicacion_id' => $data['ubicacion_id'],
            'estado'       => 'activo',
        ]);
    }

    /** Actualizar datos básicos */
    public function actualizar(array $data): bool
    {
        return $this->fill([
            'nombre'       => $data['nombre'],
            'ubicacion_id' => $data['ubicacion_id'],
        ])->save();
    }

/** Dar de baja: solo si no tiene equipos activos */
    public function darDeBaja(?string $observacion = null): bool
    {
        if ($this->equipos()->where('estado', 'activo')->exists()) {
            return false;
        }

        $this->estado = 'baja';
        $guardado = $this->save();
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Sector dado de baja', $observacion);
        }
        
        return $guardado;
    }

    /** Dar de alta */
    public function darDeAlta(): bool
    {
        $this->estado = 'activo';
        $guardado = $this->save();
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Sector dado de alta');
        }
        
        return $guardado;
    }

    /** Relación con equipos */
    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'sector_id');
    }
}


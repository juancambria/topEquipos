<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modelo extends Model
{
    protected $table = 'modelos';
    protected $primaryKey = 'idModelo';

    protected $fillable = [
        'modelo',
        'idMarca',
        'idTipo',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'idMarca', 'idMarca');
    }

    public function tipo()
    {
        return $this->belongsTo(Tipo::class, 'idTipo', 'idTipo');
    }

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'idModelo', 'idModelo');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public static function crear(array $data): self
    {
        $data['estado'] = 'activo';
        return self::create($data);
    }

    public function actualizar(array $data): bool
    {
        return $this->update($data);
    }

public function darDeBaja(?string $observacion = null): bool
    {
        if ($this->equipos()->where('estado', 'activo')->exists()) {
            return false;
        }
        
        $guardado = $this->update(['estado' => 'baja']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Modelo dado de baja', $observacion);
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Modelo dado de alta');
        }
        
        return $guardado;
    }
}

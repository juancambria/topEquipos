<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tipo extends Model
{
    protected $table = 'tipos';
    protected $primaryKey = 'idTipo';

    protected $fillable = [
        'nombreTipo',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'idTipo', 'idTipo');
    }

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'idTipo', 'idTipo');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public static function crear(array $data): self
    {
        return self::create([
            'nombreTipo' => $data['nombreTipo'],
            'estado'     => 'activo',
        ]);
    }

    public function actualizar(array $data): bool
    {
        return $this->update(['nombreTipo' => $data['nombreTipo']]);
    }

    public function darDeBaja(?string $observacion = null): bool
    {
        if ($this->equipos()->where('estado', 'activo')->exists()) {
            return false;
        }
        
        $guardado = $this->update(['estado' => 'baja']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Tipo dado de baja', $observacion);
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Tipo dado de alta');
        }
        
        return $guardado;
    }
}

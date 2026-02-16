<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    protected $table = 'marcas';
    protected $primaryKey = 'idMarca';

    protected $fillable = [
        'marca',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'idMarca', 'idMarca');
    }

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'idMarca', 'idMarca');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public static function crear(array $data): self
    {
        return self::create([
            'marca'  => $data['marca'],
            'estado' => 'activo',
        ]);
    }

    public function actualizar(array $data): bool
    {
        return $this->update(['marca' => $data['marca']]);
    }

    public function darDeBaja(?string $observacion = null): bool
    {
        if ($this->modelos()->where('estado', 'activo')->exists()) {
            return false;
        }
        
        $guardado = $this->update(['estado' => 'baja']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Marca dada de baja', $observacion);
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Marca dada de alta');
        }
        
        return $guardado;
    }
}

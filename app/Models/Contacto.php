<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contacto extends Model
{
    protected $table = 'contactos';
    protected $primaryKey = 'idContacto';

    protected $fillable = [
        'nombre',
        'idProveedor',
        'telefono',
        'cargo',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'idProveedor', 'idProveedor');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopeInactivos($query)
    {
        return $query->where('estado', 'baja');
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
        $guardado = $this->update(['estado' => 'baja']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Contacto dado de baja', $observacion);
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Contacto dado de alta');
        }
        
        return $guardado;
    }
}


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
        'mail',
        'observacion',
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

    public function darDeAlta(): bool
    {
        return $this->update(['estado' => 'activo']);
    }
}


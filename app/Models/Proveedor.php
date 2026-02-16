<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';
    protected $primaryKey = 'idProveedor';

    protected $fillable = [
        'proveedor',
        'mail',
        'provincia',
        'ciudad',
        'codigo_postal',
        'direccion',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'idProveedor', 'idProveedor');
    }

    public function contactos()
    {
        return $this->hasMany(Contacto::class, 'idProveedor', 'idProveedor');
    }

    public function facturas()
    {
        return $this->hasMany(Factura::class, 'idProveedor', 'idProveedor');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public static function crear(array $data): self
    {
        $data['estado'] = $data['estado'] ?? 'activo';
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
            Historial::registrar($this->id, 'BAJA', 'Proveedor dado de baja', $observacion);
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Proveedor dado de alta');
        }
        
        return $guardado;
    }
}

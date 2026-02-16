<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipo extends Model
{
    protected $table = 'equipos';

    protected $fillable = [
        'idTipo',
        'idMarca',
        'idModelo',
        'idProveedor',
        'serie',
        'imagen',
        'observacion',
        'vtoGarantia',
        'precio',
        'ubicacion_id',
        'sector_id',
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

    public function modelo()
    {
        return $this->belongsTo(Modelo::class, 'idModelo', 'idModelo');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'idProveedor', 'idProveedor');
    }

    public function ubicacion()
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id', 'id');
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'sector_id', 'id');
    }

    public function historial()
    {
        return $this->hasMany(Historial::class, 'equipo_id', 'id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public static function crear(array $data): self
    {
        $data['estado'] = 'activo';
        $equipo = self::create($data);

        Historial::registrar($equipo->id, 'CREACIÓN', 'Equipo dado de alta');

        return $equipo;
    }

    public function actualizar(array $data): bool
    {
        $actualizado = $this->update($data);

        if ($actualizado) {
            Historial::registrar($this->id, 'EDICIÓN', 'Datos del equipo actualizados');
        }

        return $actualizado;
    }

    public function baja(?string $observacion = null): bool
    {
        $this->estado = 'baja';
        $guardado = $this->save();

        if ($guardado) {
            Historial::registrar($this->id, 'BAJA', 'Equipo dado de baja', $observacion);
        }

        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $this->estado = 'activo';
        $guardado = $this->save();

        if ($guardado) {
            Historial::registrar($this->id, 'ALTA', 'Equipo dado de alta');
        }

        return $guardado;
    }
}

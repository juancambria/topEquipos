<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HerramientaFamilia extends Model
{
    protected $table = 'herramientas_familias';

    protected $fillable = [
        'nombre',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function marcas()
    {
        return $this->hasMany(HerramientaMarca::class, 'herramienta_familia_id');
    }

    public function modelos()
    {
        return $this->hasMany(HerramientaModelo::class, 'herramienta_familia_id');
    }

    public function items()
    {
        return $this->hasMany(Herramienta::class, 'herramienta_familia_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

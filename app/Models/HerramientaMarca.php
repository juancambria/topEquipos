<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HerramientaMarca extends Model
{
    protected $table = 'herramientas_marcas';

    protected $fillable = [
        'herramienta_familia_id',
        'nombre',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function familia()
    {
        return $this->belongsTo(HerramientaFamilia::class, 'herramienta_familia_id');
    }

    public function modelos()
    {
        return $this->hasMany(HerramientaModelo::class, 'herramienta_marca_id');
    }

    public function items()
    {
        return $this->hasMany(Herramienta::class, 'herramienta_marca_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

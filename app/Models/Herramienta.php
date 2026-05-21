<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Herramienta extends Model
{
    protected $table = 'herramientas';

    protected $fillable = [
        'herramienta_familia_id',
        'descripcion',
        'herramienta_marca_id',
        'herramienta_modelo_id',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function familia()
    {
        return $this->belongsTo(HerramientaFamilia::class, 'herramienta_familia_id');
    }

    public function marca()
    {
        return $this->belongsTo(HerramientaMarca::class, 'herramienta_marca_id');
    }

    public function modelo()
    {
        return $this->belongsTo(HerramientaModelo::class, 'herramienta_modelo_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

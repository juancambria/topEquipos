<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HerramientaModelo extends Model
{
    protected $table = 'herramientas_modelos';

    protected $fillable = [
        'herramienta_familia_id',
        'herramienta_marca_id',
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

    public function marca()
    {
        return $this->belongsTo(HerramientaMarca::class, 'herramienta_marca_id');
    }

    public function items()
    {
        return $this->hasMany(Herramienta::class, 'herramienta_modelo_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

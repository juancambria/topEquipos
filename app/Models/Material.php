<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    protected $table = 'materiales';

    protected $fillable = [
        'material_familia_id',
        'descripcion',
        'material_marca_id',
        'material_modelo_id',
        'stock',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function familia()
    {
        return $this->belongsTo(MaterialFamilia::class, 'material_familia_id');
    }

    public function marca()
    {
        return $this->belongsTo(MaterialMarca::class, 'material_marca_id');
    }

    public function modelo()
    {
        return $this->belongsTo(MaterialModelo::class, 'material_modelo_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

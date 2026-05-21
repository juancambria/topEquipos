<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialModelo extends Model
{
    protected $table = 'materiales_modelos';

    protected $fillable = [
        'material_familia_id',
        'material_marca_id',
        'nombre',
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

    public function items()
    {
        return $this->hasMany(Material::class, 'material_modelo_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

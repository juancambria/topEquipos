<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialMarca extends Model
{
    protected $table = 'materiales_marcas';

    protected $fillable = [
        'material_familia_id',
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

    public function modelos()
    {
        return $this->hasMany(MaterialModelo::class, 'material_marca_id');
    }

    public function items()
    {
        return $this->hasMany(Material::class, 'material_marca_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

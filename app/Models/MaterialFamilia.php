<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialFamilia extends Model
{
    protected $table = 'materiales_familias';

    protected $fillable = [
        'nombre',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function marcas()
    {
        return $this->hasMany(MaterialMarca::class, 'material_familia_id');
    }

    public function tipificaciones()
    {
        return $this->hasMany(MaterialTipificacion::class, 'material_familia_id');
    }

    public function modelos()
    {
        return $this->hasMany(MaterialModelo::class, 'material_familia_id');
    }

    public function items()
    {
        return $this->hasMany(Material::class, 'material_familia_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

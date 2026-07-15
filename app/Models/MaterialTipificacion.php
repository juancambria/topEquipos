<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialTipificacion extends Model
{
    protected $table = 'materiales_tipificaciones';

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

    public function items()
    {
        return $this->hasMany(Material::class, 'material_tipificacion_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

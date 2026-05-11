<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AtributoTipoEquipo extends Model
{
    protected $table = 'atributos_tipos_equipos';
    protected $primaryKey = 'idAtributo';

    protected $fillable = [
        'nombre',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
    ];

    public function especificacionesPorTipo()
    {
        return $this->hasMany(TipoAtributoEspecificacion::class, 'idAtributo', 'idAtributo');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }
}

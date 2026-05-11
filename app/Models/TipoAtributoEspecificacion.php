<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoAtributoEspecificacion extends Model
{
    protected $table = 'tipo_atributo_especificaciones';

    protected $fillable = [
        'idTipo',
        'idAtributo',
        'unidad_medida',
        'tipo_especificacion',
        'rango_min',
        'rango_max',
        'valores_permitidos',
    ];

    public function tipo()
    {
        return $this->belongsTo(Tipo::class, 'idTipo', 'idTipo');
    }

    public function atributo()
    {
        return $this->belongsTo(AtributoTipoEquipo::class, 'idAtributo', 'idAtributo');
    }
}

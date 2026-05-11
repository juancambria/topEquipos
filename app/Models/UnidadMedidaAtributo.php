<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnidadMedidaAtributo extends Model
{
    protected $table = 'unidades_medida_atributos';
    protected $primaryKey = 'idUnidadMedida';

    protected $fillable = [
        'nombre',
    ];
}

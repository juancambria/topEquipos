<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipoAtributoValor extends Model
{
    protected $table = 'equipo_atributo_valores';

    protected $fillable = [
        'equipo_id',
        'idAtributo',
        'valor',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id', 'id');
    }

    public function atributo()
    {
        return $this->belongsTo(AtributoTipoEquipo::class, 'idAtributo', 'idAtributo');
    }
}

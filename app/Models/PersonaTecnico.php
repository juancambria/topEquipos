<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonaTecnico extends Model
{
    protected $table = 'personas_tecnicos';

    protected $fillable = ['nombre'];

    public function incidencias()
    {
        return $this->hasMany(Incidencia::class, 'codigoTecnico', 'id');
    }
}

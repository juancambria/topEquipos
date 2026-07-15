<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParteTrabajoMaterial extends Model
{
    protected $table = 'parte_trabajo_materiales';

    protected $fillable = [
        'idParteTrabajo',
        'material_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function parteTrabajo()
    {
        return $this->belongsTo(ParteTrabajo::class, 'idParteTrabajo', 'idParteTrabajo');
    }

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }
}

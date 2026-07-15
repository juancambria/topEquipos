<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParteTrabajo extends Model
{
    public const TIPOS = ['general', 'mantenimiento'];

    protected $table = 'partes_trabajo';

    protected $primaryKey = 'idParteTrabajo';

    protected $fillable = [
        'fecha',
        'tipo',
        'codigoEquipo',
        'codigoLugar',
        'codigoSector',
        'codigo_incidencia',
        'descripcionTrabajo',
        'observacion',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'codigoEquipo', 'id');
    }

    public function ubicacion()
    {
        return $this->belongsTo(Ubicacion::class, 'codigoLugar', 'id');
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'codigoSector', 'id');
    }

    public function incidencia()
    {
        return $this->belongsTo(Incidencia::class, 'codigo_incidencia', 'idIncidencia');
    }

    public function fotos()
    {
        return $this->hasMany(FotoParteTrabajo::class, 'codigo_parte_trabajo', 'idParteTrabajo');
    }

    public function materiales()
    {
        return $this->hasMany(ParteTrabajoMaterial::class, 'idParteTrabajo', 'idParteTrabajo');
    }

    public function getTipoLabelAttribute(): string
    {
        return match ($this->tipo) {
            'mantenimiento' => 'Mantenimiento',
            default => 'Tarea general',
        };
    }
}

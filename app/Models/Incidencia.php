<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incidencia extends Model
{
    public const ESTADOS = ['cancelada', 'pendiente', 'en_progreso', 'finalizada'];

    public const PRIORIDADES = ['baja', 'media', 'alta'];

    protected $table = 'incidencias';

    protected $primaryKey = 'idIncidencia';

    protected $fillable = [
        'fecha',
        'codigoLugar',
        'codigoSector',
        'incidencia',
        'observacion',
        'incidenciaResolucion',
        'fechaResolucion',
        'estado',
        'tipo',
        'codigoTecnico',
        'prioridad',
        'solicito',
        'completado',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fechaResolucion' => 'date',
        'completado' => 'integer',
    ];

    public function ubicacion()
    {
        return $this->belongsTo(Ubicacion::class, 'codigoLugar', 'id');
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'codigoSector', 'id');
    }

    public function tecnico()
    {
        return $this->belongsTo(PersonaTecnico::class, 'codigoTecnico', 'id');
    }

    public function fotos()
    {
        return $this->hasMany(FotoIncidencia::class, 'codigo_incidencia', 'idIncidencia');
    }

    public function partesTrabajo()
    {
        return $this->hasMany(ParteTrabajo::class, 'codigo_incidencia', 'idIncidencia');
    }

    public function getEstadoLabelAttribute(): string
    {
        return match ($this->estado) {
            'cancelada' => 'Cancelada',
            'pendiente' => 'Pendiente',
            'en_progreso' => 'En progreso',
            'finalizada' => 'Finalizada',
            default => ucfirst((string) $this->estado),
        };
    }

    public function getPrioridadLabelAttribute(): string
    {
        return match ($this->prioridad) {
            'baja' => 'Baja',
            'media' => 'Media',
            'alta' => 'Alta',
            default => ucfirst((string) $this->prioridad),
        };
    }
}

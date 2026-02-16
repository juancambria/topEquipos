<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Historial extends Model
{
    protected $table = 'historial';

    protected $fillable = [
        'equipo_id',
        'accion',
        'detalle',
        'observacion',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id', 'id');
    }

    public static function registrar(int $equipoId, string $accion, ?string $detalle = null, ?string $observacion = null): self
    {
        return self::create([
            'equipo_id'   => $equipoId,
            'accion'      => $accion,
            'detalle'     => $detalle,
            'observacion' => $observacion,
        ]);
    }

    public function scopeRecientes($query, $cantidad = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($cantidad);
    }
}

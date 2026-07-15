<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FotoIncidencia extends Model
{
    protected $table = 'fotos_incidencia';

    protected $primaryKey = 'idFoto';

    protected $fillable = [
        'codigo_incidencia',
        'pathFoto',
        'nombreFoto',
        'formatoFoto',
    ];

    protected static function booted(): void
    {
        static::deleting(function (FotoIncidencia $foto) {
            if ($foto->pathFoto && Storage::disk('public')->exists($foto->pathFoto)) {
                Storage::disk('public')->delete($foto->pathFoto);
            }
        });
    }

    public function incidencia()
    {
        return $this->belongsTo(Incidencia::class, 'codigo_incidencia', 'idIncidencia');
    }
}

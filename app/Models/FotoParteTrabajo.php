<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FotoParteTrabajo extends Model
{
    protected $table = 'fotos_parte_trabajo';

    protected $primaryKey = 'idFoto';

    protected $fillable = [
        'codigo_parte_trabajo',
        'pathFoto',
        'nombreFoto',
        'formatoFoto',
    ];

    protected static function booted(): void
    {
        static::deleting(function (FotoParteTrabajo $foto) {
            if ($foto->pathFoto && Storage::disk('public')->exists($foto->pathFoto)) {
                Storage::disk('public')->delete($foto->pathFoto);
            }
        });
    }

    public function parteTrabajo()
    {
        return $this->belongsTo(ParteTrabajo::class, 'codigo_parte_trabajo', 'idParteTrabajo');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FacturaPdf extends Model
{
    protected $table = 'factura_pdfs';

    protected $primaryKey = 'idFacturaPdf';

    public $timestamps = true;

    protected $fillable = [
        'idFactura',
        'ruta_archivo',
        'nombre_original',
        'tamano_bytes',
    ];

    protected static function booted(): void
    {
        static::deleting(function (FacturaPdf $pdf): void {
            if ($pdf->ruta_archivo) {
                Storage::disk('local')->delete($pdf->ruta_archivo);
            }
        });
    }

    public function factura()
    {
        return $this->belongsTo(Factura::class, 'idFactura', 'idFactura');
    }
}

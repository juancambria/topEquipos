<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    protected $table = 'facturas';
    protected $primaryKey = 'idFactura';
    public $timestamps = true;

    protected $fillable = [
        'numero',
        'fecha',
        'idProveedor',
        'neto',
        'iva105',
        'iva21',
        'porcentajeDto',
        'importeDto',
        'total',
        'observacion',
        'idPresupuesto',
        'idOrdenDeCompra',
        'obra',
        'descripcion_contenido',
        'porcentajeBonificacion',
        'importeBonificacion',
        'pathFoto',
        'nombreFoto',
        'formatoFoto',
        'pathFoto2',
        'nombreFoto2',
        'formatoFoto2',
        'observacion2',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
        'idPresupuesto' => null,
        'idOrdenDeCompra' => null,
        'obra' => null,
        'descripcion_contenido' => null,
        'porcentajeBonificacion' => 0,
        'importeBonificacion' => 0,
    ];

    protected $casts = [
        'fecha' => 'date',
        'neto' => 'decimal:4',
        'iva105' => 'decimal:4',
        'iva21' => 'decimal:4',
        'porcentajeDto' => 'decimal:4',
        'importeDto' => 'decimal:4',
        'total' => 'decimal:4',
    ];

    // Relaciones
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'idProveedor', 'idProveedor');
    }

    public function detalles()
    {
        return $this->hasMany(FacturaDetalle::class, 'idFactura', 'idFactura');
    }

    public function pdfs()
    {
        return $this->hasMany(FacturaPdf::class, 'idFactura', 'idFactura');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopePorProveedor($query, $idProveedor)
    {
        return $query->where('idProveedor', $idProveedor);
    }

    public function scopeBuscar($query, $termino)
    {
        return $query->where(function($q) use ($termino) {
            $q->where('numero', 'like', "%{$termino}%")
              ->orWhere('observacion', 'like', "%{$termino}%");
        });
    }

    // Métodos
    public function calcularTotales()
    {
        $neto = 0;
        $iva105 = 0;
        $iva21 = 0;

        foreach ($this->detalles()->get() as $detalle) {
            $subtotal = $detalle->subtotal ?? 0;
            $neto += $subtotal;

            $iva = $detalle->porcentajeIva ?? 0;
            if ($iva == 10.5) {
                $iva105 += $subtotal * 0.105;
            } elseif ($iva == 21) {
                $iva21 += $subtotal * 0.21;
            }
        }

        // Aplicar bonificación
        $porcentajeBonificacion = $this->porcentajeBonificacion ?? 0;
        $importeBonificacion = $neto * ($porcentajeBonificacion / 100);
        
        $this->porcentajeBonificacion = $porcentajeBonificacion;
        $this->importeBonificacion = $importeBonificacion;
        
        $netoConBonificacion = $neto - $importeBonificacion;

        $this->neto = $netoConBonificacion;
        $this->iva105 = $iva105;
        $this->iva21 = $iva21;

        $this->total = $netoConBonificacion + $iva105 + $iva21;

        return $this->save();
    }

    public function darDeAlta(): bool
    {
        return $this->update(['estado' => 'activo']);
    }
}

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

        foreach ($this->detalles as $detalle) {
            $subtotal = $detalle->subtotal ?? 0;
            $neto += $subtotal;

            $iva = $detalle->porcentajeIva ?? 0;
            if ($iva == 10.5) {
                $iva105 += $subtotal * 0.105;
            } elseif ($iva == 21) {
                $iva21 += $subtotal * 0.21;
            }
        }

        $this->neto = $neto;
        $this->iva105 = $iva105;
        $this->iva21 = $iva21;

        $descuento = $this->porcentajeDto ?? 0;
        $this->importeDto = $neto * ($descuento / 100);

        $this->total = $neto + $iva105 + $iva21 - $this->importeDto;

        return $this->save();
    }

    public function darDeBaja(?string $observacion = null): bool
    {
        $guardado = $this->update(['estado' => 'baja']);
        
        if ($guardado) {
            Historial::registrar(
                $this->idProveedor,
                'BAJA FACTURA',
                "Factura {$this->numero} dada de baja",
                $observacion
            );
        }
        
        return $guardado;
    }

    public function darDeAlta(): bool
    {
        $guardado = $this->update(['estado' => 'activo']);
        
        if ($guardado) {
            Historial::registrar(
                $this->idProveedor,
                'ALTA FACTURA',
                "Factura {$this->numero} reactivada"
            );
        }
        
        return $guardado;
    }
}


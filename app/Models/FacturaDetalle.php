<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacturaDetalle extends Model
{
    protected $table = 'factura_detalles';
    protected $primaryKey = 'idFacturaDet';
    public $timestamps = true;

    protected $fillable = [
        'concepto',
        'cantidad',
        'porcentajeIva',
        'porcentajeDto',
        'precioUnitario',
        'subtotal',
        'operacion',
        'de',
        'idCodigo',
        'obra',
        'operacionDe',
        'tipoOperacion',
        'idCodigoCodigo',
        'idFactura',
        'renglonFactura',
        'estado',
    ];

    protected $attributes = [
        'estado' => 'activo',
        'operacion' => null,
        'de' => null,
        'idCodigo' => 0,
        'obra' => null,
        'operacionDe' => 1,
        'tipoOperacion' => 1,
        'idCodigoCodigo' => 0,
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'porcentajeIva' => 'decimal:1',
        'porcentajeDto' => 'decimal:4',
        'precioUnitario' => 'decimal:4',
        'subtotal' => 'decimal:4',
    ];

    // Constantes para operaciones
    const OPERACION_COMPRA = 1;
    const OPERACION_VENTA = 2;
    const OPERACION_ALQUILER = 3;

    // Constantes para tipo operación
    const TIPO_ARTICULO = 1;
    const TIPO_SERVICIO = 2;

    // Relaciones
    public function factura()
    {
        return $this->belongsTo(Factura::class, 'idFactura', 'idFactura');
    }

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'idCodigoCodigo', 'id');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopePorFactura($query, $idFactura)
    {
        return $query->where('idFactura', $idFactura);
    }

    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipoOperacion', $tipo);
    }

    // Métodos
    public function calcularSubtotal(): bool
    {
        $cantidad = $this->cantidad ?? 0;
        $precio = $this->precioUnitario ?? 0;
        $descuento = $this->porcentajeDto ?? 0;

        $subtotal = $cantidad * $precio;
        $subtotal -= $subtotal * ($descuento / 100);

        $this->subtotal = $subtotal;

        return $this->save();
    }

    public function getOperacionDeTextoAttribute(): string
    {
        return match($this->operacionDe) {
            self::OPERACION_VENTA => 'Venta',
            self::OPERACION_ALQUILER => 'Alquiler',
            default => 'Compra',
        };
    }

    public function getTipoOperacionTextoAttribute(): string
    {
        return match($this->tipoOperacion) {
            self::TIPO_SERVICIO => 'Servicio',
            default => 'Artículo',
        };
    }

    public function getIvaMontoAttribute(): float
    {
        $iva = $this->porcentajeIva ?? 0;
        return ($this->subtotal ?? 0) * ($iva / 100);
    }
}


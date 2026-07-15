<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialStockMovimiento extends Model
{
    protected $table = 'materiales_stock_movimientos';

    protected $fillable = [
        'material_id',
        'fecha_movimiento',
        'cantidad',
        'factura_id',
        'parte_trabajo_id',
        'factura_numero',
        'proveedor_id',
        'proveedor_nombre',
        'precio_unitario',
        'origen',
        'observacion',
    ];

    protected $casts = [
        'fecha_movimiento' => 'date',
        'cantidad' => 'decimal:4',
        'precio_unitario' => 'decimal:4',
    ];

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiales_stock_movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materiales')->cascadeOnDelete();
            $table->date('fecha_movimiento')->nullable();
            $table->decimal('cantidad', 18, 4);
            $table->unsignedBigInteger('factura_id')->nullable();
            $table->string('factura_numero', 20)->nullable();
            $table->unsignedBigInteger('proveedor_id')->nullable();
            $table->string('proveedor_nombre', 180)->nullable();
            $table->decimal('precio_unitario', 18, 4)->nullable();
            $table->string('origen', 40)->default('manual');
            $table->string('observacion', 180)->nullable();
            $table->timestamps();

            $table->index(['material_id', 'fecha_movimiento'], 'materiales_stock_movimientos_material_fecha_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiales_stock_movimientos');
    }
};

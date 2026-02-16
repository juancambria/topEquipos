<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factura_detalles', function (Blueprint $table) {
            $table->id('idFacturaDet');
            $table->string('concepto', 150)->nullable();
            $table->decimal('cantidad', 18, 4)->nullable();
            $table->decimal('porcentajeIva', 2, 1)->nullable();
            $table->decimal('porcentajeDto', 18, 4)->nullable();
            $table->decimal('precioUnitario', 18, 4)->nullable();
            $table->decimal('subtotal', 18, 4)->nullable();
            // Campos de operación
            $table->enum('operacion', ['compra', 'mano_obra'])->nullable()->comment('Tipo de operación');
            $table->string('de', 50)->nullable()->comment('De: Equipo, Herramienta, Material, Sucursal');
            $table->unsignedBigInteger('idCodigo')->default(0)->comment('FK a equipos o null');
            // Campo obra por renglón
            $table->string('obra', 100)->nullable()->comment('Obra específica del renglón');
            // Campos legacy (mantener compatibilidad)
            $table->unsignedTinyInteger('operacionDe')->default(1)->comment('1=compra, 2=venta, 3=alquiler');
            $table->unsignedTinyInteger('tipoOperacion')->default(1)->comment('1=articulo, 2=servicio');
            $table->unsignedBigInteger('idCodigoCodigo')->default(0)->comment('FK a equipos');
            $table->unsignedBigInteger('idFactura');
            $table->unsignedSmallInteger('renglonFactura');
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->foreign('idFactura')
                ->references('idFactura')
                ->on('facturas')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factura_detalles');
    }
};


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id('idFactura');
            $table->string('numero', 20);
            $table->date('fecha')->nullable();
            $table->unsignedBigInteger('idProveedor');
            $table->decimal('neto', 18, 4)->nullable();
            $table->decimal('iva105', 18, 4)->nullable();
            $table->decimal('iva21', 18, 4)->nullable();
            $table->decimal('porcentajeDto', 18, 4)->nullable();
            $table->decimal('importeDto', 18, 4)->nullable();
            $table->decimal('total', 18, 4)->nullable();
            $table->text('observacion')->nullable();
            // Campos nuevos opcionales
            $table->unsignedInteger('idOrdenDeCompra')->nullable();
            $table->unsignedInteger('idPresupuesto')->nullable();
            $table->string('obra', 100)->nullable();
            $table->text('descripcion_contenido')->nullable();
            // Campos de bonificación
            $table->decimal('porcentajeBonificacion', 18, 4)->nullable();
            $table->decimal('importeBonificacion', 18, 4)->nullable();
            // Campos de foto
            $table->string('pathFoto', 255)->nullable();
            $table->string('nombreFoto', 100)->nullable();
            $table->string('formatoFoto', 3)->nullable();
            $table->string('pathFoto2', 255)->nullable();
            $table->string('nombreFoto2', 100)->nullable();
            $table->string('formatoFoto2', 3)->nullable();
            $table->longText('observacion2')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->foreign('idProveedor')
                ->references('idProveedor')
                ->on('proveedores')
                ->onDelete('restrict');

            $table->unique(['idProveedor', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};


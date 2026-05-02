<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factura_pdfs', function (Blueprint $table) {
            $table->id('idFacturaPdf');
            $table->unsignedBigInteger('idFactura');
            $table->string('ruta_archivo');
            $table->string('nombre_original', 255);
            $table->unsignedBigInteger('tamano_bytes')->nullable();
            $table->timestamps();

            $table->foreign('idFactura')
                ->references('idFactura')
                ->on('facturas')
                ->onDelete('cascade');

            $table->index(['idFactura']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factura_pdfs');
    }
};

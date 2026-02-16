<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cambiar porcentajeIva de decimal(2,1) a decimal(3,1) para permitir valores como 10.5 y 21
        Schema::table('factura_detalles', function (Blueprint $table) {
            $table->decimal('porcentajeIva', 3, 1)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Revertir al tamaño original
        Schema::table('factura_detalles', function (Blueprint $table) {
            $table->decimal('porcentajeIva', 2, 1)->nullable()->change();
        });
    }
};


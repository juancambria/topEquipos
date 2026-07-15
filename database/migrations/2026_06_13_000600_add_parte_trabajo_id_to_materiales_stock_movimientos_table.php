<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materiales_stock_movimientos', function (Blueprint $table) {
            $table->unsignedBigInteger('parte_trabajo_id')->nullable()->after('factura_id');
            $table->foreign('parte_trabajo_id')
                ->references('idParteTrabajo')
                ->on('partes_trabajo')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('materiales_stock_movimientos', function (Blueprint $table) {
            $table->dropForeign(['parte_trabajo_id']);
            $table->dropColumn('parte_trabajo_id');
        });
    }
};

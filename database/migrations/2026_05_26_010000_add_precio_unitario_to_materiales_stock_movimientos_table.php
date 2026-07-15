<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('materiales_stock_movimientos')) {
            return;
        }

        if (Schema::hasColumn('materiales_stock_movimientos', 'precio_unitario')) {
            return;
        }

        Schema::table('materiales_stock_movimientos', function (Blueprint $table) {
            $table->decimal('precio_unitario', 18, 4)
                ->nullable()
                ->after('proveedor_nombre');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('materiales_stock_movimientos')) {
            return;
        }

        if (!Schema::hasColumn('materiales_stock_movimientos', 'precio_unitario')) {
            return;
        }

        Schema::table('materiales_stock_movimientos', function (Blueprint $table) {
            $table->dropColumn('precio_unitario');
        });
    }
};

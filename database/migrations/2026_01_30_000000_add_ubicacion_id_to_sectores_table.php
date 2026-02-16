<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Verificar si la columna ya existe antes de agregarla
        if (!Schema::hasColumn('sectores', 'ubicacion_id')) {
            Schema::table('sectores', function (Blueprint $table) {
                $table->foreignId('ubicacion_id')->constrained('ubicaciones')->onDelete('restrict');
            });
        }
    }

    public function down(): void
    {
        Schema::table('sectores', function (Blueprint $table) {
            $table->dropForeign(['ubicacion_id']);
            $table->dropColumn('ubicacion_id');
        });
    }
};


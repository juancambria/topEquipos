<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modelos', function (Blueprint $table) {
            $table->dropUnique('modelos_modelo_idmarca_unique');
            $table->unique(['modelo', 'idMarca', 'idTipo'], 'modelos_modelo_idmarca_idtipo_unique');
        });
    }

    public function down(): void
    {
        Schema::table('modelos', function (Blueprint $table) {
            $table->dropUnique('modelos_modelo_idmarca_idtipo_unique');
            $table->unique(['modelo', 'idMarca'], 'modelos_modelo_idmarca_unique');
        });
    }
};

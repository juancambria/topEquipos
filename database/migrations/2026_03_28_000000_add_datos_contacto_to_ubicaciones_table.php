<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->string('ciudad', 40)->nullable()->after('nombre');
            $table->string('provincia', 40)->nullable()->after('ciudad');
            $table->string('telefono', 30)->nullable()->after('provincia');
            $table->string('direccion', 40)->nullable()->after('telefono');
            $table->string('codigo_postal', 20)->nullable()->after('direccion');
        });
    }

    public function down(): void
    {
        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->dropColumn([
                'ciudad',
                'provincia',
                'telefono',
                'direccion',
                'codigo_postal',
            ]);
        });
    }
};

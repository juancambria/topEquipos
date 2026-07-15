<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fotos_incidencia', function (Blueprint $table) {
            $table->bigIncrements('idFoto');
            $table->unsignedBigInteger('codigo_incidencia');
            $table->string('pathFoto', 500);
            $table->string('nombreFoto', 255);
            $table->string('formatoFoto', 10);
            $table->timestamps();

            $table->foreign('codigo_incidencia')
                ->references('idIncidencia')
                ->on('incidencias')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fotos_incidencia');
    }
};

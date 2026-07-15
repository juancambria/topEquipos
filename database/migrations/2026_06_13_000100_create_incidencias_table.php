<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidencias', function (Blueprint $table) {
            $table->bigIncrements('idIncidencia');
            $table->date('fecha');
            $table->unsignedBigInteger('codigoLugar')->nullable();
            $table->unsignedBigInteger('codigoSector')->nullable();
            $table->string('incidencia', 255);
            $table->text('observacion')->nullable();
            $table->text('incidenciaResolucion')->nullable();
            $table->date('fechaResolucion')->nullable();
            $table->string('estado', 30)->default('pendiente');
            $table->string('tipo', 50)->nullable();
            $table->unsignedBigInteger('codigoTecnico')->nullable();
            $table->string('prioridad', 20)->default('media');
            $table->string('solicito', 180)->nullable();
            $table->unsignedTinyInteger('completado')->default(0);
            $table->timestamps();

            $table->foreign('codigoLugar')->references('id')->on('ubicaciones')->nullOnDelete();
            $table->foreign('codigoSector')->references('id')->on('sectores')->nullOnDelete();
            $table->foreign('codigoTecnico')->references('id')->on('personas_tecnicos')->nullOnDelete();
            $table->index('fecha');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidencias');
    }
};

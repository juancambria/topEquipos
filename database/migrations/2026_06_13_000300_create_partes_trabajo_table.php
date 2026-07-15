<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partes_trabajo', function (Blueprint $table) {
            $table->bigIncrements('idParteTrabajo');
            $table->date('fecha');
            $table->string('tipo', 30)->default('general');
            $table->unsignedBigInteger('codigoEquipo')->nullable();
            $table->unsignedBigInteger('codigoLugar')->nullable();
            $table->unsignedBigInteger('codigoSector')->nullable();
            $table->unsignedBigInteger('codigo_incidencia')->nullable();
            $table->text('descripcionTrabajo');
            $table->text('observacion')->nullable();
            $table->timestamps();

            $table->foreign('codigoEquipo')->references('id')->on('equipos')->nullOnDelete();
            $table->foreign('codigoLugar')->references('id')->on('ubicaciones')->nullOnDelete();
            $table->foreign('codigoSector')->references('id')->on('sectores')->nullOnDelete();
            $table->foreign('codigo_incidencia')
                ->references('idIncidencia')
                ->on('incidencias')
                ->nullOnDelete();
            $table->index('fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partes_trabajo');
    }
};

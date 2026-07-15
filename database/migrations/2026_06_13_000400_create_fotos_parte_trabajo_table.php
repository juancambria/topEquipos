<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fotos_parte_trabajo', function (Blueprint $table) {
            $table->bigIncrements('idFoto');
            $table->unsignedBigInteger('codigo_parte_trabajo');
            $table->string('pathFoto', 500);
            $table->string('nombreFoto', 255);
            $table->string('formatoFoto', 10);
            $table->timestamps();

            $table->foreign('codigo_parte_trabajo')
                ->references('idParteTrabajo')
                ->on('partes_trabajo')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fotos_parte_trabajo');
    }
};

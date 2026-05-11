<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atributos_tipos_equipos', function (Blueprint $table) {
            $table->id('idAtributo');
            $table->string('nombre', 155)->unique();
            $table->string('estado')->default('activo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atributos_tipos_equipos');
    }
};

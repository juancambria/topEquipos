<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipo_atributo_valores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipo_id')
                ->constrained('equipos')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('idAtributo')
                ->constrained('atributos_tipos_equipos', 'idAtributo')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('valor', 255);
            $table->timestamps();

            $table->unique(['equipo_id', 'idAtributo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipo_atributo_valores');
    }
};

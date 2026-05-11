<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipo_atributo_especificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('idTipo')
                ->constrained('tipos', 'idTipo')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('idAtributo')
                ->constrained('atributos_tipos_equipos', 'idAtributo')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('unidad_medida', 100)->nullable();
            $table->string('tipo_especificacion', 50)->default('texto');
            $table->string('rango_min', 120)->nullable();
            $table->string('rango_max', 120)->nullable();
            $table->text('valores_permitidos')->nullable();
            $table->timestamps();

            $table->unique(['idTipo', 'idAtributo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipo_atributo_especificaciones');
    }
};

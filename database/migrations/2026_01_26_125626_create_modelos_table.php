<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modelos', function (Blueprint $table) {
            $table->id('idModelo');
            $table->string('modelo');
            $table->foreignId('idMarca')
                  ->constrained('marcas', 'idMarca')
                  ->cascadeOnUpdate()
                  ->restrictOnDelete();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->unique(['modelo', 'idMarca']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modelos');
    }
};

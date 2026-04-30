<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marca_tipo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('idMarca')
                ->constrained('marcas', 'idMarca')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('idTipo')
                ->constrained('tipos', 'idTipo')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['idMarca', 'idTipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marca_tipo');
    }
};

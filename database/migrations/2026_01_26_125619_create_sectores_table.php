<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sectores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('ubicacion_id')->constrained('ubicaciones');
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->unique(['nombre', 'ubicacion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sectores');
    }
};

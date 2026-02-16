<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('idTipo')
                ->constrained('tipos', 'idTipo');

            $table->foreignId('idMarca')
                ->constrained('marcas', 'idMarca');

            $table->foreignId('idModelo')
                ->constrained('modelos', 'idModelo');

            $table->foreignId('idProveedor')
                ->nullable()
                ->constrained('proveedores', 'idProveedor')
                ->nullOnDelete();

            $table->string('serie')->unique();
            $table->string('imagen')->nullable();
            $table->text('observacion')->nullable();
            $table->date('vtoGarantia')->nullable();
            $table->decimal('precio', 12, 2)->nullable();

            $table->foreignId('ubicacion_id')->nullable()->constrained('ubicaciones');
            $table->foreignId('sector_id')->nullable()->constrained('sectores');

            $table->string('estado')->default('activo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};

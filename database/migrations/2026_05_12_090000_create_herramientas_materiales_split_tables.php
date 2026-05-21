<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('herramientas_familias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(['nombre']);
        });

        Schema::create('herramientas_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('herramienta_familia_id')->constrained('herramientas_familias')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(['herramienta_familia_id', 'nombre'], 'herramientas_marcas_familia_nombre_unique');
        });

        Schema::create('herramientas_modelos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('herramienta_familia_id')->constrained('herramientas_familias')->restrictOnDelete();
            $table->foreignId('herramienta_marca_id')->constrained('herramientas_marcas')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(
                ['herramienta_familia_id', 'herramienta_marca_id', 'nombre'],
                'herramientas_modelos_familia_marca_nombre_unique'
            );
        });

        Schema::create('herramientas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('herramienta_familia_id')->constrained('herramientas_familias')->restrictOnDelete();
            $table->string('descripcion', 180);
            $table->foreignId('herramienta_marca_id')->constrained('herramientas_marcas')->restrictOnDelete();
            $table->foreignId('herramienta_modelo_id')->constrained('herramientas_modelos')->restrictOnDelete();
            $table->string('estado')->default('activo');
            $table->timestamps();
        });

        Schema::create('materiales_familias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(['nombre']);
        });

        Schema::create('materiales_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_familia_id')->constrained('materiales_familias')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(['material_familia_id', 'nombre'], 'materiales_marcas_familia_nombre_unique');
        });

        Schema::create('materiales_modelos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_familia_id')->constrained('materiales_familias')->restrictOnDelete();
            $table->foreignId('material_marca_id')->constrained('materiales_marcas')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(
                ['material_familia_id', 'material_marca_id', 'nombre'],
                'materiales_modelos_familia_marca_nombre_unique'
            );
        });

        Schema::create('materiales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_familia_id')->constrained('materiales_familias')->restrictOnDelete();
            $table->string('descripcion', 180);
            $table->foreignId('material_marca_id')->constrained('materiales_marcas')->restrictOnDelete();
            $table->foreignId('material_modelo_id')->constrained('materiales_modelos')->restrictOnDelete();
            $table->decimal('stock', 18, 4)->default(0);
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->unique(
                ['material_familia_id', 'descripcion', 'material_marca_id', 'material_modelo_id'],
                'materiales_item_unique_compuesto'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiales');
        Schema::dropIfExists('materiales_modelos');
        Schema::dropIfExists('materiales_marcas');
        Schema::dropIfExists('materiales_familias');
        Schema::dropIfExists('herramientas');
        Schema::dropIfExists('herramientas_modelos');
        Schema::dropIfExists('herramientas_marcas');
        Schema::dropIfExists('herramientas_familias');
    }
};

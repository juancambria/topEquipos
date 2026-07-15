<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parte_trabajo_materiales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idParteTrabajo');
            $table->unsignedBigInteger('material_id');
            $table->decimal('cantidad', 18, 4);
            $table->timestamps();

            $table->foreign('idParteTrabajo')
                ->references('idParteTrabajo')
                ->on('partes_trabajo')
                ->cascadeOnDelete();
            $table->foreign('material_id')
                ->references('id')
                ->on('materiales')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parte_trabajo_materiales');
    }
};

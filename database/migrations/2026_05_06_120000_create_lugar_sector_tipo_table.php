<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('LUGARSECTORTIPO')) {
            return;
        }

        Schema::create('LUGARSECTORTIPO', function (Blueprint $table) {
            $table->unsignedBigInteger('CODIGOLUGAR');
            $table->unsignedBigInteger('CODIGOSECTOR');
            $table->unsignedBigInteger('CODIGOTIPO');
            // Debe arrancar vacío para que el usuario cargue el valor manualmente.
            $table->integer('CANTIDAD')->nullable();

            $table->primary(
                ['CODIGOLUGAR', 'CODIGOSECTOR', 'CODIGOTIPO'],
                'PKLUGARSECTORTIPO'
            );

            $table->foreign('CODIGOLUGAR')
                ->references('id')
                ->on('ubicaciones')
                ->cascadeOnDelete();

            $table->foreign('CODIGOSECTOR')
                ->references('id')
                ->on('sectores')
                ->cascadeOnDelete();

            $table->foreign('CODIGOTIPO')
                ->references('idTipo')
                ->on('tipos')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('LUGARSECTORTIPO');
    }
};

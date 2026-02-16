<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contactos', function (Blueprint $table) {
            $table->id('idContacto');
            $table->string('nombre');
            $table->unsignedBigInteger('idProveedor');
            $table->string('telefono')->nullable();
            $table->string('cargo')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->foreign('idProveedor')
                ->references('idProveedor')
                ->on('proveedores')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contactos');
    }
};

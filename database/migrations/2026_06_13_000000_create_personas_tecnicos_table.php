<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personas_tecnicos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 180);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personas_tecnicos');
    }
};

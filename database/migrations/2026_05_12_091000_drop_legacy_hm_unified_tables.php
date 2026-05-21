<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('herramienta_materiales');
        Schema::dropIfExists('hm_modelos');
        Schema::dropIfExists('hm_marcas');
        Schema::dropIfExists('hm_familias');
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Sin rollback automático: el esquema nuevo reemplaza al legado.
    }
};

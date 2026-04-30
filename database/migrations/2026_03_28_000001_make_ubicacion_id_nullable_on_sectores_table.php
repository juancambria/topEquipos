<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sectores', 'ubicacion_id')) {
            return;
        }

        DB::statement('ALTER TABLE sectores MODIFY ubicacion_id BIGINT UNSIGNED NULL');
    }

    public function down(): void
    {
        if (!Schema::hasColumn('sectores', 'ubicacion_id')) {
            return;
        }

        DB::statement('UPDATE sectores SET ubicacion_id = 1 WHERE ubicacion_id IS NULL');
        DB::statement('ALTER TABLE sectores MODIFY ubicacion_id BIGINT UNSIGNED NOT NULL');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sector_ubicacion')) {
            Schema::create('sector_ubicacion', function (Blueprint $table) {
                $table->foreignId('sector_id')->constrained('sectores')->cascadeOnDelete();
                $table->foreignId('ubicacion_id')->constrained('ubicaciones')->cascadeOnDelete();
                $table->unique(['sector_id', 'ubicacion_id']);
            });
        }

        $rows = DB::table('sectores')
            ->whereNotNull('ubicacion_id')
            ->get(['id', 'ubicacion_id']);

        foreach ($rows as $row) {
            DB::table('sector_ubicacion')->updateOrInsert([
                'sector_id' => $row->id,
                'ubicacion_id' => $row->ubicacion_id,
            ], []);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sector_ubicacion')) {
            Schema::dropIfExists('sector_ubicacion');
        }
    }
};

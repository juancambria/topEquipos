<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiales_tipificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_familia_id')->constrained('materiales_familias')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->unique(
                ['material_familia_id', 'nombre'],
                'materiales_tipificaciones_familia_nombre_unique'
            );
        });

        Schema::table('materiales', function (Blueprint $table) {
            $table->foreignId('material_tipificacion_id')
                ->nullable()
                ->after('material_familia_id')
                ->constrained('materiales_tipificaciones')
                ->nullOnDelete();
        });

        $rows = DB::table('materiales')
            ->select('id', 'material_familia_id', 'descripcion')
            ->whereNotNull('descripcion')
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $nombre = trim((string) $row->descripcion);
            if ($nombre === '') {
                continue;
            }

            $existingId = DB::table('materiales_tipificaciones')
                ->where('material_familia_id', $row->material_familia_id)
                ->where('nombre', $nombre)
                ->value('id');

            $tipificacionId = $existingId ?: DB::table('materiales_tipificaciones')->insertGetId([
                'material_familia_id' => $row->material_familia_id,
                'nombre' => $nombre,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('materiales')
                ->where('id', $row->id)
                ->update(['material_tipificacion_id' => $tipificacionId]);
        }
    }

    public function down(): void
    {
        Schema::table('materiales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('material_tipificacion_id');
        });

        Schema::dropIfExists('materiales_tipificaciones');
    }
};

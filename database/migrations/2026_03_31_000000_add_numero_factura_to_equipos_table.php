<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->string('numeroFactura')->nullable()->after('idProveedor');
        });

        // Para los equipos existentes sin factura se puede asignar id (valor no nulo)
        if (Schema::hasColumn('equipos', 'id')) {
            DB::table('equipos')
                ->whereNull('numeroFactura')
                ->update(['numeroFactura' => DB::raw('CAST(id AS CHAR)')]);
        }
    }

    public function down(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->dropColumn('numeroFactura');
        });
    }
};

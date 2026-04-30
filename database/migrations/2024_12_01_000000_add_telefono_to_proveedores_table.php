<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('telefono')->nullable()->after('mail');
        });
    }

    public function down(): void
    {
        Schema::table('proveveedores', function (Blueprint $table) {
            $table->dropColumn('telefono');
        });
    }
};


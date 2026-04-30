<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contactos', function (Blueprint $table) {
            $table->string('mail')->nullable()->after('telefono');
            $table->string('observacion', 80)->nullable()->after('mail');
        });
    }

    public function down(): void
    {
        Schema::table('contactos', function (Blueprint $table) {
            $table->dropColumn(['mail', 'observacion']);
        });
    }
};


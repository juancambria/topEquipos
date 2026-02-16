<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Eliminar columnas antiguas
            if (Schema::hasColumn('proveedores', 'contacto')) {
                $table->dropColumn('contacto');
            }
            if (Schema::hasColumn('proveedores', 'telefono')) {
                $table->dropColumn('telefono');
            }
            if (Schema::hasColumn('proveedores', 'cargo')) {
                $table->dropColumn('cargo');
            }
        });

        Schema::table('proveedores', function (Blueprint $table) {
            // Agregar nuevas columnas
            if (!Schema::hasColumn('proveedores', 'mail')) {
                $table->string('mail')->nullable()->after('proveedor');
            }
            if (!Schema::hasColumn('proveedores', 'provincia')) {
                $table->string('provincia')->nullable()->after('mail');
            }
            if (!Schema::hasColumn('proveedores', 'ciudad')) {
                $table->string('ciudad')->nullable()->after('provincia');
            }
            if (!Schema::hasColumn('proveedores', 'codigo_postal')) {
                $table->string('codigo_postal')->nullable()->after('ciudad');
            }
            if (!Schema::hasColumn('proveedores', 'direccion')) {
                $table->string('direccion')->nullable()->after('codigo_postal');
            }
        });
    }

    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            if (Schema::hasColumn('proveedores', 'mail')) {
                $table->dropColumn('mail');
            }
            if (Schema::hasColumn('proveedores', 'provincia')) {
                $table->dropColumn('provincia');
            }
            if (Schema::hasColumn('proveedores', 'ciudad')) {
                $table->dropColumn('ciudad');
            }
            if (Schema::hasColumn('proveedores', 'codigo_postal')) {
                $table->dropColumn('codigo_postal');
            }
            if (Schema::hasColumn('proveedores', 'direccion')) {
                $table->dropColumn('direccion');
            }

            $table->string('contacto')->nullable();
            $table->string('telefono')->nullable();
            $table->string('cargo')->nullable();
        });
    }
};

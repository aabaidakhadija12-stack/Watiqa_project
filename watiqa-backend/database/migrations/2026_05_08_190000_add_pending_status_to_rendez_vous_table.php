<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE rendez_vous MODIFY statut ENUM('en_attente', 'confirme', 'annule', 'passe') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::table('rendez_vous')
            ->where('statut', 'en_attente')
            ->update(['statut' => 'confirme']);

        DB::statement("ALTER TABLE rendez_vous MODIFY statut ENUM('confirme', 'annule', 'passe') NOT NULL DEFAULT 'confirme'");
    }
};

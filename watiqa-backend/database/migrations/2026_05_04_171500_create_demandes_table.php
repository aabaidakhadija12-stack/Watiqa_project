<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['naissance', 'deces', 'celibat', 'residence', 'vie', 'casier_judiciaire']);
            $table->json('data');
            $table->enum('statut', ['en_attente', 'en_traitement', 'approuve', 'rejete'])->default('en_attente');
            $table->string('numero_suivi', 20)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};


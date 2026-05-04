<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_rdv');
            $table->string('heure_rdv', 5);
            $table->string('motif', 255);
            $table->string('service', 100)->default('Guichet principal');
            $table->enum('statut', ['confirme', 'annule', 'passe'])->default('confirme');
            $table->timestamps();

            $table->index(['date_rdv', 'heure_rdv']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};


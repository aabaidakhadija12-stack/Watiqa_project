<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RendezVousTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_book_rendezvous_without_matching_demande(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/rendezvous', [
            'date_rdv' => now()->addDay()->toDateString(),
            'heure_rdv' => '10:00',
            'motif' => 'Agadir Ida Outanane',
            'service' => 'Acte de naissance',
            'demande_type' => 'naissance',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_cannot_book_rendezvous_in_the_past(): void
    {
        $user = User::factory()->create();

        Demande::create([
            'user_id' => $user->id,
            'type' => 'naissance',
            'data' => ['firstname' => 'Test'],
            'statut' => 'en_attente',
            'numero_suivi' => 'WAT-TEST-001',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/rendezvous', [
            'date_rdv' => now()->subDay()->toDateString(),
            'heure_rdv' => '10:00',
            'motif' => 'Agadir Ida Outanane',
            'service' => 'Acte de naissance',
            'demande_type' => 'naissance',
        ]);

        $response->assertStatus(422);
    }
}

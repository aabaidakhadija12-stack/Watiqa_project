<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\RendezVous;
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

    public function test_rendezvous_is_pending_until_admin_confirms_it(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        Demande::create([
            'user_id' => $user->id,
            'type' => 'naissance',
            'data' => ['firstname' => 'Test'],
            'statut' => 'en_attente',
            'numero_suivi' => 'WAT-TEST-002',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/rendezvous', [
            'date_rdv' => now()->addDay()->toDateString(),
            'heure_rdv' => '10:00',
            'motif' => 'Agadir Ida Outanane',
            'service' => 'Acte de naissance',
            'demande_type' => 'naissance',
        ]);

        $response->assertCreated()
            ->assertJsonPath('rdv.statut', 'en_attente');

        $rdvId = $response->json('rdv.id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/rendezvous/{$rdvId}/statut", ['statut' => 'confirme'])
            ->assertOk()
            ->assertJsonPath('rendezvous.statut', 'confirme');
    }

    public function test_confirmed_expired_rendezvous_is_marked_as_passed(): void
    {
        $user = User::factory()->create();

        RendezVous::create([
            'user_id' => $user->id,
            'date_rdv' => now()->subDay()->toDateString(),
            'heure_rdv' => '10:00',
            'motif' => 'Agadir Ida Outanane',
            'service' => 'Acte de naissance',
            'statut' => 'confirme',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/rendezvous')
            ->assertOk()
            ->assertJsonPath('0.statut', 'passe');
    }
}

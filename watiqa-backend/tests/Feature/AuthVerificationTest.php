<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_requires_email_verification_before_issuing_token(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJson([
                'requires_email_verification' => true,
            ])
            ->assertJsonMissingPath('token');

        $user = User::where('email', 'test@example.com')->firstOrFail();

        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->email_verification_code);
        $this->assertNotNull($user->email_verification_code_expires_at);
    }

    public function test_unverified_user_can_request_a_new_verification_code(): void
    {
        Mail::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/auth/resend-verification', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();

        $user->refresh();

        $this->assertNotNull($user->email_verification_code);
        $this->assertNotNull($user->email_verification_sent_at);
    }
}

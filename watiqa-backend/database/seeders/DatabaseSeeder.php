<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);

        // Optional demo user (only if env is set)
        $demoEmail = env('DEMO_USER_EMAIL');
        $demoPassword = env('DEMO_USER_PASSWORD');
        if ($demoEmail && $demoPassword) {
            User::updateOrCreate(
                ['email' => $demoEmail],
                [
                    'name' => env('DEMO_USER_NAME', 'Demo User'),
                    'password' => Hash::make($demoPassword),
                    'role' => 'user',
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}

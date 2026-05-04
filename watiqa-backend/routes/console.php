<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('watiqa:make-admin {email : User email} {--create : Create the user if it does not exist}', function () {
    $email = (string) $this->argument('email');
    $create = (bool) $this->option('create');

    $user = User::where('email', $email)->first();

    if (! $user && ! $create) {
        $this->error('User not found. Re-run with --create to create it.');
        return self::FAILURE;
    }

    if (! $user) {
        $password = env('ADMIN_PASSWORD');
        if (! $password) {
            $this->error('ADMIN_PASSWORD is not set in .env');
            return self::FAILURE;
        }

        $user = User::create([
            'name' => env('ADMIN_NAME', 'Admin'),
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make($password),
            'role' => 'admin',
        ]);
    } else {
        $user->update(['role' => 'admin']);
    }

    $this->info("OK: {$user->email} is now admin (id={$user->id})");
    return self::SUCCESS;
})->purpose('Promote a user to admin');

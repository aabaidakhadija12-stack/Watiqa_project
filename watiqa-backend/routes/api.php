<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\SuiviController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes - Watiqa Project
|--------------------------------------------------------------------------
*/

Route::get('/', fn () => response()->json([
    'name' => config('app.name', 'Watiqa'),
    'ok' => true,
]));

// ==================== AUTH (Public) ====================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
});

// Assistant IA (Public)
Route::post('/assistant', [AssistantController::class, 'chat']);
Route::get('/assistant/tts', [AssistantController::class, 'tts']);

// ==================== PROTECTED ROUTES ====================
Route::middleware(['auth:sanctum', 'verified'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Demandes (toutes les wathiqa)
    Route::prefix('demandes')->group(function () {
        Route::get('/',         [DemandeController::class, 'index']);       // Liste mes demandes
        Route::post('/',        [DemandeController::class, 'store']);       // Créer une demande
        Route::get('/{id}',     [DemandeController::class, 'show']);        // Détail demande
        Route::delete('/{id}',  [DemandeController::class, 'destroy']);     // Annuler demande
    });

    // Rendez-vous
    Route::prefix('rendezvous')->group(function () {
        Route::get('/',         [RendezVousController::class, 'index']);    // Mes RDV
        Route::post('/',        [RendezVousController::class, 'store']);    // Prendre RDV
        Route::get('/slots',    [RendezVousController::class, 'slots']);    // Créneaux disponibles
        Route::delete('/{id}',  [RendezVousController::class, 'destroy']); // Annuler RDV
    });

    // Suivi
    Route::get('/suivi/{numeroSuivi}', [SuiviController::class, 'track']); // Suivre une demande

    // ==================== ADMIN ====================
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::patch('/users/{id}/role', [AdminController::class, 'setUserRole']);

        Route::get('/demandes', [AdminController::class, 'listDemandes']);
        Route::patch('/demandes/{id}/statut', [AdminController::class, 'updateDemandeStatus']);

        Route::get('/rendezvous', [AdminController::class, 'listRendezVous']);
        Route::patch('/rendezvous/{id}/statut', [AdminController::class, 'updateRendezVousStatus']);
    });
});

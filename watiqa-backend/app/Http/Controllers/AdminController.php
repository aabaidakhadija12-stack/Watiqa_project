<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function stats()
    {
        return response()->json([
            'users' => User::count(),
            'demandes' => Demande::count(),
            'rendezvous' => RendezVous::count(),
        ]);
    }

    public function listUsers()
    {
        return response()->json(
            User::query()->latest()->get(['id', 'name', 'email', 'phone', 'cin', 'role', 'created_at'])
        );
    }

    public function setUserRole(Request $request, int $id)
    {
        $data = $request->validate([
            'role' => 'required|in:user,admin',
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $data['role']]);

        return response()->json([
            'message' => 'Role updated',
            'user' => $user->only(['id', 'name', 'email', 'role']),
        ]);
    }

    public function listDemandes(Request $request)
    {
        $query = Demande::query()->with('user:id,name,email');

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return response()->json($query->latest()->get());
    }

    public function updateDemandeStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'statut' => 'required|in:en_attente,en_traitement,approuve,rejete',
        ]);

        $demande = Demande::findOrFail($id);
        $demande->update(['statut' => $data['statut']]);

        return response()->json([
            'message' => 'Statut updated',
            'demande' => $demande,
        ]);
    }
}


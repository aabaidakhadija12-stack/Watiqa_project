<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use Illuminate\Http\Request;
use App\Http\Requests\StoreDemandeRequest;
use Illuminate\Support\Str;

class DemandeController extends Controller
{
    public function index(Request $request)
    {
        $demandes = Demande::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function store(StoreDemandeRequest $request)
    {
        $demande = Demande::create([
            'user_id'       => $request->user()->id,
            'type'          => $request->type,
            'data'          => $request->data,
            'statut'        => 'en_attente',
            'numero_suivi'  => $this->generateNumeroSuivi(),
        ]);

        return response()->json([
            'message'      => 'Demande soumise avec succès',
            'demande'      => $demande,
            'numero_suivi' => $demande->numero_suivi,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $demande = Demande::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json($demande);
    }

    public function destroy(Request $request, $id)
    {
        $demande = Demande::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($demande->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Impossible d\'annuler une demande déjà traitée',
            ], 422);
        }

        $demande->delete();

        return response()->json(['message' => 'Demande annulée']);
    }

    private function generateNumeroSuivi(): string
    {
        do {
            $numero = 'WAT-' . date('Y') . '-' . strtoupper(Str::random(6));
        } while (Demande::where('numero_suivi', $numero)->exists());

        return $numero;
    }
}

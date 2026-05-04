<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DemandeController extends Controller
{
    const TYPES = [
        'naissance',
        'deces',
        'celibat',
        'residence',
        'vie',
        'casier_judiciaire',
    ];

    public function index(Request $request)
    {
        $demandes = Demande::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:' . implode(',', self::TYPES),
            'data' => 'required|array',
        ]);

        $this->validateByType($request->type, $request->data);

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

    private function validateByType(string $type, array $data): void
    {
        $rules = match ($type) {
            'naissance' => [
                'nom'            => 'required|string',
                'prenom'         => 'required|string',
                'date_naissance' => 'required|date',
                'lieu_naissance' => 'required|string',
                'nom_pere'       => 'required|string',
                'nom_mere'       => 'required|string',
            ],
            'deces' => [
                'nom_defunt'    => 'required|string',
                'date_deces'    => 'required|date',
                'lieu_deces'    => 'required|string',
                'nom_declarant' => 'required|string',
                'cin_declarant' => 'required|string',
            ],
            'celibat' => [
                'nom'            => 'required|string',
                'prenom'         => 'required|string',
                'date_naissance' => 'required|date',
                'cin'            => 'required|string',
            ],
            'residence' => [
                'nom'     => 'required|string',
                'prenom'  => 'required|string',
                'adresse' => 'required|string',
                'cin'     => 'required|string',
            ],
            'vie' => [
                'nom'    => 'required|string',
                'prenom' => 'required|string',
                'cin'    => 'required|string',
            ],
            'casier_judiciaire' => [
                'nom'    => 'required|string',
                'prenom' => 'required|string',
                'cin'    => 'required|string',
                'motif'  => 'required|string',
            ],
            default => [],
        };

        validator($data, $rules)->validate();
    }
}


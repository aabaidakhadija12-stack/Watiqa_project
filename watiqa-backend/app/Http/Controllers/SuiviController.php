<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use Illuminate\Http\Request;

class SuiviController extends Controller
{
    public function track(Request $request, string $numeroSuivi)
    {
        $demande = Demande::where('numero_suivi', $numeroSuivi)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'numero_suivi' => $demande->numero_suivi,
            'type'         => $demande->type,
            'statut'       => $demande->statut,
            'created_at'   => $demande->created_at,
            'updated_at'   => $demande->updated_at,
            'etapes'       => $this->getEtapes($demande->statut),
        ]);
    }

    private function getEtapes(string $statut): array
    {
        return [
            ['label' => 'Demande soumise',        'done' => true],
            ['label' => 'En cours de traitement', 'done' => in_array($statut, ['en_traitement', 'approuve', 'rejete'])],
            ['label' => 'Traitée',                'done' => in_array($statut, ['approuve', 'rejete'])],
            ['label' => 'Prête à retirer',        'done' => $statut === 'approuve'],
        ];
    }
}


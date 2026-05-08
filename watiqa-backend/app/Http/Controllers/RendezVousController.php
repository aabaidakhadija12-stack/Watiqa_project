<?php

namespace App\Http\Controllers;

use App\Models\RendezVous;
use App\Models\Demande;
use Illuminate\Http\Request;
use App\Http\Requests\StoreRendezVousRequest;
use Carbon\Carbon;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        RendezVous::syncExpiredStatuses();

        $rdvs = RendezVous::where('user_id', $request->user()->id)
            ->latest('date_rdv')
            ->latest('heure_rdv')
            ->get();

        return response()->json($rdvs);
    }

    public function slots(Request $request)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
        ]);

        $date = Carbon::parse($request->date);

        if ($date->isWeekend()) {
            return response()->json(['slots' => []]);
        }

        $allSlots = [];
        $start = $date->copy()->setTime(8, 0);
        $end   = $date->copy()->setTime(16, 0);

        while ($start < $end) {
            $allSlots[] = $start->format('H:i');
            $start->addMinutes(30);
        }

        $taken = RendezVous::whereDate('date_rdv', $date->toDateString())
            ->whereIn('statut', RendezVous::BLOCKING_STATUSES)
            ->pluck('heure_rdv')
            ->toArray();

        $available = array_values(array_filter($allSlots, fn ($slot) => ! in_array($slot, $taken)));

        return response()->json([
            'date'  => $date->toDateString(),
            'slots' => $available,
        ]);
    }

    public function store(StoreRendezVousRequest $request)
    {
        $data = $request->validated();
        $dateTime = Carbon::parse($data['date_rdv'] . ' ' . $data['heure_rdv']);

        if ($dateTime->lessThanOrEqualTo(Carbon::now())) {
            return response()->json([
                'message' => 'Impossible de prendre un rendez-vous dans le passe.',
            ], 422);
        }

        $hasMatchingDemande = Demande::where('user_id', $request->user()->id)
            ->where('type', $data['demande_type'])
            ->exists();

        if (! $hasMatchingDemande) {
            return response()->json([
                'message' => 'Vous devez d abord creer une demande pour cette watiqa.',
            ], 422);
        }

        $exists = RendezVous::where('date_rdv', $data['date_rdv'])
            ->where('heure_rdv', $data['heure_rdv'])
            ->whereIn('statut', RendezVous::BLOCKING_STATUSES)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ce créneau est déjà pris, veuillez en choisir un autre',
            ], 422);
        }

        $rdv = RendezVous::create([
            'user_id'   => $request->user()->id,
            'date_rdv'  => $data['date_rdv'],
            'heure_rdv' => $data['heure_rdv'],
            'motif'     => $data['motif'],
            'service'   => $data['service'] ?? 'Guichet principal',
            'statut'    => RendezVous::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'Rendez-vous envoye pour validation',
            'rdv'     => $rdv,
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $rdv = RendezVous::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($rdv->statut === RendezVous::STATUS_PASSED) {
            return response()->json([
                'message' => 'Impossible d annuler un rendez-vous deja passe.',
            ], 422);
        }

        $rdv->update(['statut' => RendezVous::STATUS_CANCELLED]);

        return response()->json(['message' => 'Rendez-vous annulé']);
    }
}

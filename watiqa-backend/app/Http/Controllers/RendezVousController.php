<?php

namespace App\Http\Controllers;

use App\Models\RendezVous;
use Illuminate\Http\Request;
use App\Http\Requests\StoreRendezVousRequest;
use Carbon\Carbon;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        $rdvs = RendezVous::where('user_id', $request->user()->id)
            ->latest()
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
            ->where('statut', '!=', 'annule')
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

        $exists = RendezVous::where('date_rdv', $data['date_rdv'])
            ->where('heure_rdv', $data['heure_rdv'])
            ->where('statut', '!=', 'annule')
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
            'statut'    => 'confirme',
        ]);

        return response()->json([
            'message' => 'Rendez-vous confirmé',
            'rdv'     => $rdv,
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $rdv = RendezVous::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $rdv->update(['statut' => 'annule']);

        return response()->json(['message' => 'Rendez-vous annulé']);
    }
}

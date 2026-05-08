<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\RendezVous;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats()
    {
        RendezVous::syncExpiredStatuses();

        $months = collect();
        $start = Carbon::now()->subMonths(11)->startOfMonth();

        for ($i = 0; $i < 12; $i++) {
            $months->push($start->copy()->addMonths($i));
        }

        $monthlyCounts = Demande::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->keyBy(fn($item) => sprintf('%s-%s', $item->year, $item->month));

        $demandesByMonth = $months->map(fn($month) => [
            'label' => $month->format('M'),
            'count' => $monthlyCounts->get(sprintf('%s-%s', $month->year, $month->month))->count ?? 0,
        ]);

        return response()->json([
            'users' => User::count(),
            'demandes' => Demande::count(),
            'demandes_en_cours' => Demande::whereIn('statut', ['en_attente', 'en_traitement'])->count(),
            'rendezvous' => RendezVous::count(),
            'rendezvous_confirmed' => RendezVous::where('statut', 'confirme')->count(),
            'rendezvous_pending' => RendezVous::where('statut', 'en_attente')->count(),
            'rendezvous_cancelled' => RendezVous::where('statut', 'annule')->count(),
            'rendezvous_passed' => RendezVous::where('statut', 'passe')->count(),
            'demandes_by_month' => $demandesByMonth,
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

    public function listRendezVous(Request $request)
    {
        RendezVous::syncExpiredStatuses();

        $query = RendezVous::query()->with('user:id,name,email,phone,cin');

        if ($request->filled('statut') && in_array($request->string('statut'), ['en_attente', 'confirme', 'annule', 'passe'])) {
            $query->where('statut', $request->string('statut'));
        }

        return response()->json(
            $query
                ->latest('date_rdv')
                ->latest('heure_rdv')
                ->get()
        );
    }

    public function updateRendezVousStatus(Request $request, int $id)
    {
        RendezVous::syncExpiredStatuses();

        $data = $request->validate([
            'statut' => 'required|in:en_attente,confirme,annule,passe',
        ]);

        $rdv = RendezVous::findOrFail($id);

        if ($rdv->statut === 'passe' && $data['statut'] !== 'passe') {
            return response()->json([
                'message' => 'Impossible de modifier un rendez-vous deja passe.',
            ], 422);
        }

        $rdv->update(['statut' => $data['statut']]);

        return response()->json([
            'message' => 'Statut rendez-vous updated',
            'rendezvous' => $rdv->load('user:id,name,email,phone,cin'),
        ]);
    }
}

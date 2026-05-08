<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RendezVous extends Model
{
    public const STATUS_PENDING = 'en_attente';
    public const STATUS_CONFIRMED = 'confirme';
    public const STATUS_CANCELLED = 'annule';
    public const STATUS_PASSED = 'passe';
    public const BLOCKING_STATUSES = [self::STATUS_PENDING, self::STATUS_CONFIRMED];

    protected $table = 'rendez_vous';

    protected $fillable = [
        'user_id',
        'date_rdv',
        'heure_rdv',
        'motif',
        'service',
        'statut',
    ];

    protected $casts = [
        'date_rdv' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function syncExpiredStatuses(): void
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $currentTime = $now->format('H:i');

        $expired = fn ($query) => $query
            ->where('date_rdv', '<', $today)
            ->orWhere(fn ($sameDay) => $sameDay
                ->whereDate('date_rdv', $today)
                ->where('heure_rdv', '<=', $currentTime));

        self::where(self::expiredQuery($expired))
            ->where('statut', self::STATUS_CONFIRMED)
            ->update(['statut' => self::STATUS_PASSED]);

        self::where(self::expiredQuery($expired))
            ->where('statut', self::STATUS_PENDING)
            ->update(['statut' => self::STATUS_CANCELLED]);
    }

    private static function expiredQuery(callable $expired): callable
    {
        return fn ($query) => $expired($query);
    }
}


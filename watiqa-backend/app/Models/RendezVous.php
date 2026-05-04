<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RendezVous extends Model
{
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
}


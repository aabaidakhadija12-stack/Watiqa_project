<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRendezVousRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_rdv'  => 'required|date|after_or_equal:today',
            'heure_rdv' => 'required|string|regex:/^\\d{2}:\\d{2}$/',
            'motif'     => 'required|string|max:255',
            'service'   => 'nullable|string|max:100',
        ];
    }
}

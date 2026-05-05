<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDemandeRequest extends FormRequest
{
    const TYPES = [
        'naissance',
        'deces',
        'celibat',
        'residence',
        'vie',
        'casier_judiciaire',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'type' => 'required|in:' . implode(',', self::TYPES),
            'data' => 'required|array',
        ];

        // Ajouter les règles spécifiques en fonction du type
        if ($this->has('type')) {
            $typeRules = match ($this->type) {
                'naissance' => [
                    'data.firstname' => 'required|string',
                    'data.lastname'  => 'required|string',
                    'data.birthdate' => 'required|date',
                    'data.birthplace'=> 'required|string',
                ],
                'deces' => [
                    'data.decLastname'    => 'required|string',
                    'data.decFirstname'   => 'required|string',
                    'data.deathDate'      => 'required|date',
                    'data.deathPlace'     => 'required|string',
                    'data.reqLastname'    => 'required|string',
                    'data.reqFirstname'   => 'required|string',
                    'data.cin'            => 'required|string',
                ],
                'celibat' => [
                    'data.firstname' => 'required|string',
                    'data.lastname'  => 'required|string',
                    'data.birthdate' => 'required|date',
                    'data.cin'       => 'required|string',
                ],
                'residence' => [
                    'data.firstname' => 'required|string',
                    'data.lastname'  => 'required|string',
                    'data.address'   => 'required|string',
                    'data.cin'       => 'required|string',
                ],
                'vie' => [
                    'data.firstname' => 'required|string',
                    'data.lastname'  => 'required|string',
                    'data.cin'       => 'required|string',
                ],
                'casier_judiciaire' => [
                    'data.firstname' => 'required|string',
                    'data.lastname'  => 'required|string',
                    'data.cin'       => 'required|string',
                    'data.purpose'   => 'required|string',
                ],
                default => [],
            };

            $rules = array_merge($rules, $typeRules);
        }

        return $rules;
    }
}

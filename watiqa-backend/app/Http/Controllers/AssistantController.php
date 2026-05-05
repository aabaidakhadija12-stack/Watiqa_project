<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AssistantController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $reply = $this->getReply($request->message);

        return response()->json([
            'reply' => $reply,
        ]);
    }

    public function tts(Request $request)
    {
        $text = $request->query('text', '');
        $lang = $request->query('lang', 'ar');

        if (empty($text)) {
            return response()->json(['error' => 'No text provided'], 400);
        }

        // Use Google TTS API
        $url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=' . urlencode(mb_substr($text, 0, 200)) . '&tl=' . $lang . '&client=gtx';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $audio = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$audio) {
            return response()->json(['error' => 'TTS generation failed'], 500);
        }

        return response($audio)
            ->header('Content-Type', 'audio/mpeg')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Access-Control-Allow-Origin', '*');
    }

    private function getReply(string $message): string
    {
        $msg = mb_strtolower($message);
        
        // Détection de la langue de base (si contient des lettres arabes)
        $isArabic = preg_match('/\p{Arabic}/u', $message);

        $rules = [
            'naissance' => [
                'ar' => ['نيابة', 'ولادة', 'ازدياد'],
                'fr' => ['naissance', 'naitre'],
                'reply_ar' => 'لطلب عقد الازدياد، توجه لصفحة "الخدمات" واختر "عقد الازدياد". ستحتاج: اسم المولود، تاريخ ومكان الازدياد، وأسماء الوالدين.',
                'reply_fr' => 'Pour demander un acte de naissance, allez sur la page "Guichet" et choisissez "Acte de naissance". Vous aurez besoin de : nom du nouveau-né, date et lieu de naissance, et les noms des parents.'
            ],
            'deces' => [
                'ar' => ['وفاة', 'موت'],
                'fr' => ['décès', 'deces', 'mort'],
                'reply_ar' => 'لطلب شهادة الوفاة، اختر "شهادة الوفاة". ستحتاج: اسم المتوفى، تاريخ ومكان الوفاة، وهوية المُصرِّح.',
                'reply_fr' => 'Pour demander un acte de décès, choisissez "Acte de décès". Il vous faudra : nom du défunt, date et lieu du décès, et l\'identité du déclarant.'
            ],
            'celibat' => [
                'ar' => ['عزوبة', 'عازب'],
                'fr' => ['célibat', 'celibat', 'celibataire'],
                'reply_ar' => 'لطلب شهادة العزوبة، اختر "شهادة العزوبة" وأدخل: الاسم الكامل، تاريخ الازدياد، ورقم البطاقة الوطنية.',
                'reply_fr' => 'Pour demander un certificat de célibat, choisissez "Certificat de célibat" et saisissez : nom complet, date de naissance, et numéro de CIN.'
            ],
            'residence' => [
                'ar' => ['سكنى', 'إقامة', 'اقامة', 'سكن'],
                'fr' => ['résidence', 'residence', 'domicile', 'habite'],
                'reply_ar' => 'لطلب شهادة السكنى، اختر "شهادة السكنى" وأدخل: الاسم الكامل، العنوان الكامل، ورقم البطاقة الوطنية.',
                'reply_fr' => 'Pour demander un certificat de résidence, choisissez "Certificat de résidence" et saisissez : nom complet, adresse complète, et numéro de CIN.'
            ],
            'vie' => [
                'ar' => ['حياة', 'حي'],
                'fr' => ['vie', 'vivant'],
                'reply_ar' => 'لطلب شهادة الحياة، اختر "شهادة الحياة". ستحتاج فقط: الاسم الكامل ورقم البطاقة الوطنية.',
                'reply_fr' => 'Pour demander un certificat de vie, choisissez "Certificat de vie". Vous aurez uniquement besoin de : nom complet et numéro de CIN.'
            ],
            'casier' => [
                'ar' => ['سيرة', 'قضائي', 'سوابق'],
                'fr' => ['casier', 'judiciaire', 'antécédent'],
                'reply_ar' => 'لطلب السيرة القضائية (السوابق العدلية)، اختر "السيرة القضائية" وحدد سبب الطلب (عمل، سفر، إلخ).',
                'reply_fr' => 'Pour demander un casier judiciaire, choisissez "Casier judiciaire" et précisez le motif de la demande (travail, voyage, etc.).'
            ],
            'rdv' => [
                'ar' => ['موعد', 'لقاء'],
                'fr' => ['rendez', 'rdv', 'rendez-vous'],
                'reply_ar' => 'لأخذ موعد، توجه لصفحة "المواعيد"، اختر التاريخ والوقت المناسبَين، وأدخل سبب الزيارة.',
                'reply_fr' => 'Pour prendre un rendez-vous, allez sur la page "Rendez-vous", choisissez une date et une heure, et indiquez le motif de votre visite.'
            ],
            'suivi' => [
                'ar' => ['تتبع', 'متابعة', 'طلبي', 'اين'],
                'fr' => ['suivi', 'suivre', 'statut', 'où en est'],
                'reply_ar' => 'لمتابعة طلبك، توجه لصفحة "التتبع" وأدخل رقم المتابعة الذي حصلت عليه عند تقديم الطلب.',
                'reply_fr' => 'Pour suivre votre demande, allez sur la page "Suivi" et saisissez le numéro de suivi qui vous a été fourni.'
            ]
        ];

        foreach ($rules as $rule) {
            // Check French words
            foreach ($rule['fr'] as $word) {
                if (str_contains($msg, $word)) {
                    return $rule['reply_fr'];
                }
            }
            // Check Arabic words
            foreach ($rule['ar'] as $word) {
                if (str_contains($msg, $word)) {
                    return $rule['reply_ar'];
                }
            }
        }

        // Fallback depending on detected language
        if ($isArabic) {
            return 'مرحباً! يمكنني مساعدتك في: طلب الوثائق (عقد الازدياد، الوفاة، العزوبة، السكنى، الحياة، السيرة القضائية)، أخذ موعد، أو تتبع طلبك. بماذا يمكنني مساعدتك؟';
        }

        return 'Bonjour ! Je peux vous aider avec : la demande de documents (acte de naissance, décès, célibat, résidence, vie, casier judiciaire), la prise de rendez-vous ou le suivi de votre demande. Comment puis-je vous aider ?';
    }
}

